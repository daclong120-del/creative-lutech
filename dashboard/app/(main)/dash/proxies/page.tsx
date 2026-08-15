import { requireAdmin } from "@/lib/supabase/auth-helper";
import ProxiesClient from "./proxies-client";

export default async function ProxiesPage() {
  await requireAdmin();
  return <ProxiesClient />;
}
