import { requireAdmin } from "@/lib/supabase/auth-helper";
import { getSanitizedSettings } from "@/lib/services/settings.service";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  await requireAdmin();
  const initialSettings = await getSanitizedSettings();
  return <SettingsClient initialSettings={initialSettings} />;
}
