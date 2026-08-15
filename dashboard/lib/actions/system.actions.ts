"use server";

/**
 * Server Actions - System (Proxies, Audit, Exports)
 * App-layer guard for admin-only system operations.
 */
import { requireAdmin } from "@/lib/supabase/auth-helper";
import { verifyCSRF } from "@/lib/csrf";
import * as systemService from "@/lib/services/system.service";
import type { CreateProxyInput } from "@/lib/repositories/proxy.repo";
import type { ExportFileInput } from "@/lib/repositories/audit.repo";

function assertCsrf(ok: boolean) {
  if (!ok) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
}

export async function getProxies() {
  await requireAdmin();
  return systemService.getProxies();
}

export async function createProxies(proxies: CreateProxyInput[]) {
  assertCsrf(await verifyCSRF());
  await requireAdmin();
  return systemService.createProxies(proxies);
}

export async function deleteProxy(id: string) {
  assertCsrf(await verifyCSRF());
  await requireAdmin();
  return systemService.deleteProxy(id);
}

export async function testProxy(id: string) {
  assertCsrf(await verifyCSRF());
  await requireAdmin();
  return systemService.testProxy(id);
}

export async function getAuditLogs() {
  await requireAdmin();
  return systemService.getAuditLogs();
}

export async function getExports() {
  await requireAdmin();
  return systemService.getExports();
}

export async function logExport(file: ExportFileInput) {
  assertCsrf(await verifyCSRF());
  await requireAdmin();
  return systemService.logExport(file);
}
