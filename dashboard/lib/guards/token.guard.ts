import { NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export interface TokenGuardResult {
  token: {
    id: string;
    name: string;
    role_id: string | null;
    created_by: string | null;
    scopes: string[];
  };
  error: string | null;
  status: number;
}

/**
 * Parses the token from headers: Authorization: Bearer <token> OR x-api-key: <token>
 */
export function extractTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    return apiKey;
  }
  return null;
}

/**
 * Validates an API token against the api_tokens table in Supabase.
 * Returns the token details if valid, or an error if invalid/expired/revoked/missing scopes.
 */
export async function verifyApiToken(
  req: NextRequest,
  requiredScopes: string[] = [],
  allowWildcard: boolean = true
): Promise<TokenGuardResult> {
  const rawToken = extractTokenFromRequest(req);
  
  if (!rawToken) {
    return { token: null as unknown as TokenGuardResult["token"], error: "Missing API token", status: 401 };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // We must use the Service Role Key to bypass RLS and read all api_tokens
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    return { token: null as unknown as TokenGuardResult["token"], error: "Internal Server Error", status: 500 };
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: token, error } = await supabaseAdmin
    .from("api_tokens")
    .select("id, name, status, expires_at, scopes, role_id, created_by")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !token) {
    return { token: null as unknown as TokenGuardResult["token"], error: "Invalid API token", status: 401 };
  }

  if (token.status !== "active") {
    return { token: null as unknown as TokenGuardResult["token"], error: `Token is ${token.status}`, status: 401 };
  }

  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    return { token: null as unknown as TokenGuardResult["token"], error: "Token has expired", status: 401 };
  }

  // Validate scopes
  // Assuming scopes array in DB has '*' meaning all access, or specific scopes.
  const tokenScopes = token.scopes || [];
  const hasWildcard = tokenScopes.includes("*");

  if (hasWildcard && !allowWildcard) {
    return { token: null as unknown as TokenGuardResult["token"], error: "Wildcard tokens (*) are not permitted for this endpoint", status: 403 };
  }

  if ((!hasWildcard || !allowWildcard) && requiredScopes.length > 0) {
    const hasRequiredScope = requiredScopes.some(scope => tokenScopes.includes(scope));
    if (!hasRequiredScope) {
      return { token: null as unknown as TokenGuardResult["token"], error: `Insufficient scope. Required one of: ${requiredScopes.join(", ")}`, status: 403 };
    }
  }

  // Asynchronously update last_used_at
  // Fire and forget to not block the request
  supabaseAdmin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id)
    .then(({ error: updateError }) => {
      if (updateError) {
        console.error(`Failed to update last_used_at for token ${token.id}:`, updateError);
      }
    });

  return {
    token: {
      id: token.id,
      name: token.name,
      role_id: token.role_id,
      created_by: token.created_by,
      scopes: token.scopes || []
    },
    error: null,
    status: 200
  };
}
