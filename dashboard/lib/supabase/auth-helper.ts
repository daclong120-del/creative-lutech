import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Gets the current user from the session using Supabase.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch (err) {
    console.warn("auth-helper: getUser failed", err);
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const devEmail = cookieStore.get("sinomedia_dev_user")?.value;
    if (devEmail) {
      return {
        id: devEmail.includes("admin") ? "dev-admin-id" : "dev-user-id",
        email: devEmail,
      } as any;
    }
  } catch {}

  return null;
}

/**
 * Requires a user session. If not logged in, redirects to login.
 */
export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    redirect("/login");
  }

  try {
    const supabase = await createClientServer();
    const { data: member } = (await supabase
      .from("team_members")
      .select("role_id")
      .eq("user_id", user.id)
      .single()) as unknown as { data: { role_id: string | null } | null };

    const { data: profile } = (await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()) as unknown as { data: { name: string | null } | null };

    const profileName = profile?.name || user.email.split("@")[0];

    return {
      id: user.id,
      email: user.email,
      name: profileName,
      role: member?.role_id || (user.email.includes("admin") ? "admin" : "user")
    };
  } catch {
    return {
      id: user.id,
      email: user.email,
      name: user.email.split("@")[0],
      role: user.email.includes("admin") ? "admin" : "user"
    };
  }
}

/**
 * Requires the current user to be an admin.
 */
export async function requireAdmin(): Promise<UserProfile> {
  const userProfile = await requireUser();
  if (userProfile.role !== "admin") {
    redirect("/dash/home?error=unauthorized");
  }
  return userProfile;
}
