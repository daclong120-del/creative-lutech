/**
 * Realtime Subscriptions — File DUY NHẤT import browser Supabase client.
 * Cung cấp WebSocket subscriptions cho các bảng cần lắng nghe thay đổi live.
 */
import { createClientBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CrawlerTask, CrawlerLogEntry, Platform } from "@/types";

// ─── Mappers (cần ở client-side) ─────────────────────────────

function mapDbTask(row: Record<string, unknown>): CrawlerTask {
  return {
    id: row.id as string,
    platform: row.platform as Platform,
    command: (row.command as CrawlerTask["command"]) || "search",
    target: (row.target as string) || "",
    status: (row.status as CrawlerTask["status"]) || "pending",
    priority: (row.priority as CrawlerTask["priority"]) || "normal",
    scheduled_at: (row.scheduled_at as string) || null,
    created_at: (row.created_at as string) || "",
    created_by: "system",
    error_message: (row.error_message as string) || null,
    metadata: (row.metadata as CrawlerTask["metadata"]) || {},
  };
}

function mapDbLog(row: Record<string, unknown>): CrawlerLogEntry {
  return {
    id: String(row.id),
    task_id: row.task_id as string,
    level: ((row.level as string)?.toUpperCase() || "INFO") as CrawlerLogEntry["level"],
    message: (row.message as string) || "",
    created_at: (row.created_at as string) || "",
  };
}

// ─── Subscriptions ───────────────────────────────────────────

/**
 * Lắng nghe thay đổi trên bảng crawler_tasks (UPDATE + INSERT).
 * Trả về RealtimeChannel — gọi channel.unsubscribe() khi component unmount.
 */
export function subscribeToTasks(
  onUpdate: (task: CrawlerTask) => void,
  onInsert?: (task: CrawlerTask) => void,
  onStatusChange?: (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => void,
): RealtimeChannel {
  const supabase = createClientBrowser();

  const channel = supabase
    .channel("tasks-realtime")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "crawler_tasks" },
      (payload) => {
        onUpdate(mapDbTask(payload.new as Record<string, unknown>));
      },
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "crawler_tasks" },
      (payload) => {
        if (onInsert) {
          onInsert(mapDbTask(payload.new as Record<string, unknown>));
        }
      },
    )
    .subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status as "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err);
      }
    });

  return channel;
}

/**
 * Lắng nghe log mới của một task cụ thể (INSERT on crawler_logs).
 * Trả về RealtimeChannel — gọi channel.unsubscribe() khi component unmount.
 */
export function subscribeToTaskLogs(
  taskId: string,
  onNewLog: (log: CrawlerLogEntry) => void,
  onStatusChange?: (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => void,
): RealtimeChannel {
  const supabase = createClientBrowser();

  const channel = supabase
    .channel(`task-logs-${taskId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "crawler_logs",
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        onNewLog(mapDbLog(payload.new as Record<string, unknown>));
      },
    )
    .subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status as "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err);
      }
    });

  return channel;
}

// ─── Release Ops Realtime Subscriptions ──────────────────────

/** Row shape từ release_ops_jobs realtime payload */
export interface ReleaseOpsJobUpdate {
  id: string;
  job_type: string;
  status: string;
  priority: number;
  release_id: string | null;
  app_id: string | null;
  worker_id: string | null;
  attempt_count: number;
  error_message: string | null;
  completed_at: string | null;
  updated_at: string;
}

/** Row shape từ release_ops_job_events realtime payload */
export interface ReleaseOpsEventUpdate {
  id: string;
  job_id: string;
  level: string;
  stage: string;
  message: string;
  progress: number | null;
  external_ref: string | null;
  created_at: string;
}

/** Row shape từ release_ops_releases realtime payload */
export interface ReleaseOpsReleaseUpdate {
  id: string;
  app_id: string;
  version_name: string;
  version_code: number;
  track: string;
  rollout_percentage: number;
  status: string;
  updated_at: string;
}

function mapJobPayload(row: Record<string, unknown>): ReleaseOpsJobUpdate {
  return {
    id: row.id as string,
    job_type: (row.job_type as string) || "",
    status: (row.status as string) || "queued",
    priority: (row.priority as number) || 0,
    release_id: (row.release_id as string) || null,
    app_id: (row.app_id as string) || null,
    worker_id: (row.worker_id as string) || null,
    attempt_count: (row.attempt_count as number) || 0,
    error_message: (row.error_message as string) || null,
    completed_at: (row.completed_at as string) || null,
    updated_at: (row.updated_at as string) || "",
  };
}

function mapEventPayload(row: Record<string, unknown>): ReleaseOpsEventUpdate {
  return {
    id: row.id as string,
    job_id: (row.job_id as string) || "",
    level: (row.level as string) || "info",
    stage: (row.stage as string) || "",
    message: (row.message as string) || "",
    progress: (row.progress as number) ?? null,
    external_ref: (row.external_ref as string) || null,
    created_at: (row.created_at as string) || "",
  };
}

function mapReleasePayload(row: Record<string, unknown>): ReleaseOpsReleaseUpdate {
  return {
    id: row.id as string,
    app_id: (row.app_id as string) || "",
    version_name: (row.version_name as string) || "",
    version_code: (row.version_code as number) || 0,
    track: (row.track as string) || "production",
    rollout_percentage: (row.rollout_percentage as number) || 0,
    status: (row.status as string) || "draft",
    updated_at: (row.updated_at as string) || "",
  };
}

/**
 * Lắng nghe thay đổi trên bảng release_ops_jobs (UPDATE + INSERT).
 * Trả về RealtimeChannel — gọi channel.unsubscribe() khi component unmount.
 */
export function subscribeToReleaseOpsJobs(
  onUpdate: (job: ReleaseOpsJobUpdate) => void,
  onInsert?: (job: ReleaseOpsJobUpdate) => void,
  onStatusChange?: (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => void,
): RealtimeChannel {
  const supabase = createClientBrowser();

  const channel = supabase
    .channel("release-ops-jobs-realtime")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "release_ops_jobs" },
      (payload) => {
        onUpdate(mapJobPayload(payload.new as Record<string, unknown>));
      },
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "release_ops_jobs" },
      (payload) => {
        if (onInsert) {
          onInsert(mapJobPayload(payload.new as Record<string, unknown>));
        }
      },
    )
    .subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status as "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err);
      }
    });

  return channel;
}

/**
 * Lắng nghe job events mới của 1 job cụ thể (INSERT on release_ops_job_events).
 * Trả về RealtimeChannel — gọi channel.unsubscribe() khi component unmount.
 */
export function subscribeToJobEvents(
  jobId: string,
  onNewEvent: (event: ReleaseOpsEventUpdate) => void,
  onStatusChange?: (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => void,
): RealtimeChannel {
  const supabase = createClientBrowser();

  const channel = supabase
    .channel(`release-ops-job-events-${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "release_ops_job_events",
        filter: `job_id=eq.${jobId}`,
      },
      (payload) => {
        onNewEvent(mapEventPayload(payload.new as Record<string, unknown>));
      },
    )
    .subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status as "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err);
      }
    });

  return channel;
}

/**
 * Lắng nghe thay đổi trên bảng release_ops_releases (UPDATE — status, rollout).
 * Trả về RealtimeChannel — gọi channel.unsubscribe() khi component unmount.
 */
export function subscribeToReleaseUpdates(
  onUpdate: (release: ReleaseOpsReleaseUpdate) => void,
  onStatusChange?: (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => void,
): RealtimeChannel {
  const supabase = createClientBrowser();

  const channel = supabase
    .channel("release-ops-releases-realtime")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "release_ops_releases" },
      (payload) => {
        onUpdate(mapReleasePayload(payload.new as Record<string, unknown>));
      },
    )
    .subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status as "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err);
      }
    });

  return channel;
}
