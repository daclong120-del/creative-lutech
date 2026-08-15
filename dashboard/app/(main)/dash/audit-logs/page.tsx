import { requireAdmin } from "@/lib/supabase/auth-helper";
import AuditLogsClient from "./audit-logs-client";

export default async function AuditLogsPage() {
  await requireAdmin();
  return <AuditLogsClient />;
}
