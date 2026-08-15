"use server";
/**
 * Server Actions — Crawler (Tasks, Accounts, Logs)
 * Wrapper cho crawler.service.
 */
import { requireAdmin } from "@/lib/supabase/auth-helper";
import { verifyCSRF } from "@/lib/csrf";
import type { CreateTaskInput } from "@/lib/repositories/task.repo";
import {
  getTasks as getTasksService,
  createTask as createTaskService,
  createTasksBulk as createTasksBulkService,
  cancelTask as cancelTaskService,
  retryTask as retryTaskService,
  getTaskLogs as getTaskLogsService,
  getAccounts as getAccountsService,
  getTaskById as getTaskByIdService,
  createAccount as createAccountService,
  unbanAccount as unbanAccountService,
  deleteAccount as deleteAccountService,
} from "@/lib/services/crawler.service";

export async function createAccount(
  platform: string,
  username: string,
  cookieData: string,
  proxyStr?: string | null
): Promise<void> {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  await createAccountService(platform, username, cookieData, proxyStr);
}

export async function unbanAccount(id: string): Promise<void> {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  await unbanAccountService(id);
}

export async function deleteAccount(id: string): Promise<void> {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  await deleteAccountService(id);
}

// READ ACTIONS - Require authenticated admin
export async function getTasks() {
  await requireAdmin();
  return await getTasksService();
}

export async function getTaskLogs(taskId: string) {
  await requireAdmin();
  return await getTaskLogsService(taskId);
}

export async function getTaskById(id: string) {
  await requireAdmin();
  return await getTaskByIdService(id);
}

export async function getAccounts() {
  await requireAdmin();
  return await getAccountsService();
}

// WRITE ACTIONS - Require admin role
export async function createTask(input: CreateTaskInput) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await createTaskService(input);
}

export async function createTasksBulk(tasks: CreateTaskInput[]) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await createTasksBulkService(tasks);
}

export async function cancelTask(id: string) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await cancelTaskService(id);
}

export async function retryTask(id: string) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await retryTaskService(id);
}
