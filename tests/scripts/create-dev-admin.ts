import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

// Load env from .env.local manually
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalsIdx = trimmed.indexOf("=");
      if (equalsIdx !== -1) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const value = trimmed.slice(equalsIdx + 1).trim();
        process.env[key] = value;
      }
    }
  });
} else {
  console.error("No .env.local file found at:", envPath);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.TEST_ADMIN_EMAIL!;
const adminPassword = process.env.TEST_ADMIN_PASSWORD!;

if (!supabaseUrl || !serviceKey || !adminEmail || !adminPassword) {
  console.error("Missing env configurations in .env.local. Make sure you have NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log(`Creating/Verifying admin user: ${adminEmail}`);

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  let userId = userData?.user?.id;

  if (userError) {
    const msg = userError.message || "";
    const code = (userError as any).code || "";
    if (code === "email_exists" || msg.includes("already") || msg.includes("exists")) {
      console.log("User already exists in auth. Retrieving user ID.");
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("Failed to list users:", listError);
        process.exit(1);
      }
      const existingUser = listData.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
      if (existingUser) {
        userId = existingUser.id;
      } else {
        console.error("User exists but could not be found in list.");
        process.exit(1);
      }
    } else {
      console.error("Failed to create user:", userError);
      process.exit(1);
    }
  }

  console.log(`User ID is ${userId}. Ensuring profile and admin role...`);

  // Upsert into profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, name: "Test Admin", email: adminEmail });

  if (profileError) {
    console.error("Failed to upsert profile:", profileError);
    process.exit(1);
  }

  const workspaceId = "00000000-0000-0000-0000-000000000000";

  // Check if member already exists in team_members
  const { data: existingMember, error: selectError } = await supabase
    .from("team_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("Failed to check existing member:", selectError);
    process.exit(1);
  }

  if (existingMember) {
    console.log("Member already exists in team_members. Updating role to admin...");
    const { error: updateError } = await supabase
      .from("team_members")
      .update({ role_id: "admin", status: "active" })
      .eq("id", existingMember.id);

    if (updateError) {
      console.error("Failed to update member role:", updateError);
      process.exit(1);
    }
  } else {
    console.log("Adding member to team_members as admin...");
    const { error: insertError } = await supabase
      .from("team_members")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role_id: "admin",
        status: "active"
      });

    if (insertError) {
      console.error("Failed to insert member:", insertError);
      process.exit(1);
    }
  }

  console.log("Admin user created/verified and assigned role successfully!");
}

run();
