import React from "react";
import { requireAdmin } from "@/lib/supabase/auth-helper";
import * as memberService from "@/lib/services/member.service";
import { MembersClient } from "./members-client";

// Set dynamic configuration to ensure cookies and database queries run fresh on every request
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  // 1. Guard access (server-side authentication and role check)
  await requireAdmin();

  // 2. Load initial data in parallel
  const [members, roles, tokens] = await Promise.all([
    memberService.listMembers(),
    memberService.listRoles(),
    memberService.listApiTokens(),
  ]);

  return (
    <MembersClient
      initialMembers={members}
      initialRoles={roles}
      initialTokens={tokens}
    />
  );
}
