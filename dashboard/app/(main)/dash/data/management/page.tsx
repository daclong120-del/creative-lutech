import { requireAdmin } from "@/lib/supabase/auth-helper";
import ManagementClient from "./management-client";

export default async function ManagementPage() {
  await requireAdmin();
  return <ManagementClient />;
}
