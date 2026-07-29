"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PlatformBadge, StatusBadge, PriorityBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import TagInput from "@/components/dashboard/TagInput";
import { getTasks, getTaskLogs, createTasksBulk, cancelTask, retryTask } from "@/lib/actions/crawler.actions";
import { subscribeToTasks, subscribeToTaskLogs } from "@/lib/realtime/subscriptions";
import { timeAgo, cn } from "@/lib/utils";
import type { CrawlerTask, CrawlerLogEntry, Platform } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { X, AlertCircle, Radio, Eye, EyeOff, XCircle, RotateCcw } from "lucide-react";

const LOG_COLORS: Record<string, string> = {
  INFO: "text-green-400",
  DEBUG: "text-zinc-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
};

const PLATFORM_MAP: Record<string, Platform> = {
  "Douyin": "douyin",
  "XHS / Tiểu Hồng Thư": "xhs",
  "Bilibili": "bilibili",
  "Weibo": "weibo",
  "Kuaishou": "kuaishou",
  "Tieba": "tieba",
  "Zhihu": "zhihu",
  "TikTok": "tiktok"
};

const COMMAND_MAP: Record<string, string> = {
  "Creator": "creator",
  "Search": "search",
  "Comment": "comments",
  "Ads Target": "ads"
};

const PRIORITY_MAP: Record<string, string> = {
  "Normal": "normal",
  "Critical": "critical",
  "High": "high",
  "Low": "low"
};

const LANGUAGE_MAP: Record<string, string> = {
  "Auto": "auto",
  "Trung Quốc (zh)": "zh",
  "Tiếng Anh (en)": "en",
  "Tiếng Việt (vi)": "vi"
};

interface TasksClientProps {
  initialTasks: CrawlerTask[];
  initialError?: string | null;
}

export default function TasksClient({ initialTasks, initialError }: TasksClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<CrawlerTask[]>(initialTasks);
  const [taskLogs, setTaskLogs] = useState<CrawlerLogEntry[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "subscribed" | "error">("connecting");
  const [error, setError] = useState<string | null>(initialError || null);
  
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }
  
  // New task form states
  const [newPlatform, setNewPlatform] = useState("Douyin");
  const [newCategory, setNewCategory] = useState("Creator");
  const [newPriority, setNewPriority] = useState("Normal");
  const [newTargets, setNewTargets] = useState("");
  const [newMaxCount, setNewMaxCount] = useState(50);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("Auto");
  const [crawlComments, setCrawlComments] = useState(true);
  const [crawlSubComments, setCrawlSubComments] = useState(true);
  const [headlessMode, setHeadlessMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Notification & Feedback States
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "success"
  });
  const [errorsList, setErrorsList] = useState<string[]>([]);

  // Refs for realtime channels
  const tasksChannelRef = useRef<RealtimeChannel | null>(null);
  const logsChannelRef = useRef<RealtimeChannel | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const isSyncingTasksRef = useRef(false);

  const syncTasks = useCallback(async () => {
    if (isSyncingTasksRef.current) {
      return;
    }
    isSyncingTasksRef.current = true;
    try {
      const freshTasks = await getTasks();
      setTasks(freshTasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("Failed to sync tasks:", err);
    } finally {
      isSyncingTasksRef.current = false;
    }
  }, []);

  // ─── Realtime: Tasks table ─────────────────────────────────
  useEffect(() => {
    const channel = subscribeToTasks(
      // onUpdate: merge updated task into state
      (updatedTask) => {
        if (!updatedTask || !updatedTask.id || !updatedTask.platform) {
          console.warn("Discarding malformed/unauthorized realtime task update:", updatedTask);
          void syncTasks();
          return;
        }
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
      },
      // onInsert: prepend new task to list
      (newTask) => {
        if (!newTask || !newTask.id || !newTask.platform) {
          console.warn("Discarding malformed/unauthorized realtime task insert:", newTask);
          void syncTasks();
          return;
        }
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      },
      // onStatusChange
      (status, err) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("subscribed");
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          setRealtimeStatus("error");
          console.error("Tasks realtime subscription error:", status, err);
          void syncTasks();
        } else if (status === "CLOSED") {
          setRealtimeStatus("connecting");
        }
      }
    );

    tasksChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      tasksChannelRef.current = null;
    };
  }, [syncTasks]);

  useEffect(() => {
    const hasActiveTask = tasks.some((task) => task.status === "pending" || task.status === "running");
    const intervalMs = hasActiveTask || realtimeStatus !== "subscribed" ? 3000 : 10000;
    const timer = window.setInterval(() => {
      void syncTasks();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [tasks, realtimeStatus, syncTasks]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 6000);
  }, []);

  // ─── Realtime: Task Logs (per selected task) ───────────────
  const loadAndSubscribeLogs = useCallback(async (taskId: string) => {
    try {
      // Fetch existing logs first
      const existingLogs = await getTaskLogs(taskId);
      setTaskLogs(existingLogs);
    } catch (err) {
      console.error("Failed to load task logs:", err);
      showToast("Không thể tải logs của nhiệm vụ: " + (err instanceof Error ? err.message : String(err)), "error");
    }

    // Subscribe to new logs
    const channel = subscribeToTaskLogs(
      taskId, 
      (newLog) => {
        if (!newLog || !newLog.id || !newLog.message) {
          console.warn("Discarding malformed log payload:", newLog);
          return;
        }
        setTaskLogs((prev) => {
          if (prev.some((l) => l.id === newLog.id)) return prev;
          return [...prev, newLog];
        });
      },
      (status, err) => {
        if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          console.error("Logs realtime subscription error:", status, err);
        }
      }
    );

    logsChannelRef.current = channel;
  }, [showToast]);

  // ─── Control Actions: Cancel / Retry / Refresh ───────────────
  const handleCancelTask = async (taskId: string) => {
    const previousTasks = [...tasks];
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "cancelled" } : t))
    );
    showToast("Đang huỷ nhiệm vụ...", "info");

    try {
      await cancelTask(taskId);
      showToast("Đã gửi lệnh huỷ nhiệm vụ.", "success");
      const freshTasks = await getTasks();
      setTasks(freshTasks);
      setError(null);
    } catch (err) {
      showToast("Huỷ nhiệm vụ thất bại: " + (err instanceof Error ? err.message : String(err)), "error");
      setTasks(previousTasks); // rollback
    }
  };

  const handleRetryTask = async (taskId: string) => {
    const previousTasks = [...tasks];
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "pending" } : t))
    );
    showToast("Đang đưa nhiệm vụ vào hàng chờ chạy lại...", "info");

    try {
      await retryTask(taskId);
      showToast("Đã đưa nhiệm vụ vào hàng chờ chạy lại thành công.", "success");
      const freshTasks = await getTasks();
      setTasks(freshTasks);
      setError(null);
    } catch (err) {
      showToast("Không thể chạy lại nhiệm vụ: " + (err instanceof Error ? err.message : String(err)), "error");
      setTasks(previousTasks); // rollback
    }
  };

  const handleRefreshTasks = async () => {
    showToast("Đang tải lại danh sách nhiệm vụ...", "info");
    try {
      const freshTasks = await getTasks();
      setTasks(freshTasks);
      setError(null);
      showToast("Đã tải lại danh sách nhiệm vụ thành công.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      showToast("Tải lại danh sách thất bại: " + (err instanceof Error ? err.message : String(err)), "error");
    }
  };

  useEffect(() => {
    // Cleanup previous log subscription
    if (logsChannelRef.current) {
      logsChannelRef.current.unsubscribe();
      logsChannelRef.current = null;
    }

    let timer: NodeJS.Timeout | null = null;
    if (selectedTask) {
      timer = setTimeout(() => {
        setTaskLogs([]); // Clear immediately
        loadAndSubscribeLogs(selectedTask);
      }, 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (logsChannelRef.current) {
        logsChannelRef.current.unsubscribe();
        logsChannelRef.current = null;
      }
    };
  }, [selectedTask, loadAndSubscribeLogs]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [taskLogs]);


  const getPlaceholderText = () => {
    const platformKey = PLATFORM_MAP[newPlatform] || "douyin";
    const commandKey = COMMAND_MAP[newCategory] || "creator";
    if (platformKey === "bilibili") {
      if (commandKey === "creator") {
        return "Nhập mỗi UID số hoặc link space của creator một dòng...\nVí dụ:\n3546578405361883\nhttps://space.bilibili.com/3546578405361883";
      } else if (commandKey === "search") {
        return "Nhập mỗi từ khóa tìm kiếm một dòng...\nVí dụ:\ncar\ntechnology";
      }
    }
    return "Nhập mỗi target một dòng...\nVí dụ:\nhttps://www.douyin.com/user/MS4wLjABAAAA...\ntừ khóa tìm kiếm";
  };

  const getLabelText = () => {
    const platformKey = PLATFORM_MAP[newPlatform] || "douyin";
    const commandKey = COMMAND_MAP[newCategory] || "creator";
    if (platformKey === "bilibili" && commandKey === "creator") {
      return "UID số hoặc Link Space của Creator * (Mỗi mục một dòng, tối đa 50 dòng)";
    }
    return "Target / Từ khóa * (Nhập mỗi mục một dòng, tối đa 50 dòng, tối đa 500 ký tự/dòng)";
  };

  const handleCreateTasks = async () => {
    if (!newTargets.trim()) {
      showToast("Vui lòng nhập mục tiêu cào (Target / Từ khóa).", "error");
      return;
    }

    const lines = newTargets
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      showToast("Vui lòng nhập mục tiêu cào (Target / Từ khóa).", "error");
      return;
    }

    // Check target length limit of 500 chars
    const overLimitLine = lines.find(line => line.length > 500);
    if (overLimitLine) {
      showToast("Mỗi dòng target không được vượt quá 500 ký tự.", "error");
      return;
    }

    // Client-side case-insensitive deduplication
    const uniqueLines = Array.from(new Set(lines.map(l => l.toLowerCase()))).map(lower => {
      return lines.find(l => l.toLowerCase() === lower) || lower;
    });

    if (uniqueLines.length > 50) {
      showToast("Số lượng nhiệm vụ tối đa cho mỗi lượt gửi là 50.", "error");
      return;
    }

    const platformKey = PLATFORM_MAP[newPlatform] || "douyin";
    const commandKey = COMMAND_MAP[newCategory] || "creator";

    // Frontend validation for Bilibili + Creator target format
    if (platformKey === "bilibili" && commandKey === "creator") {
      const invalidTarget = uniqueLines.find(line => {
        const isNumeric = /^\d+$/.test(line);
        const isSpaceUrl = /space\.bilibili\.com\/\d+/.test(line);
        return !isNumeric && !isSpaceUrl;
      });
      if (invalidTarget) {
        showToast(
          `Mục tiêu "${invalidTarget}" không hợp lệ. Danh mục Creator của Bilibili chỉ hỗ trợ UID số (ví dụ: 3546578405361883) hoặc link space (ví dụ: space.bilibili.com/3546578405361883). Nếu muốn dùng từ khóa, vui lòng đổi danh mục sang "Search".`,
          "error"
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorsList([]);

    const priorityKey = PRIORITY_MAP[newPriority] || "normal";

    const payload = uniqueLines.map(target => ({
      platform: platformKey,
      command: commandKey,
      target: target,
      max_count: Number(newMaxCount) || 50,
      priority: priorityKey,
      metadata: {
        tags: newTags,
        language: LANGUAGE_MAP[newLanguage] || "auto",
        crawl_comments: crawlComments,
        crawl_sub_comments: crawlSubComments,
        headless: headlessMode,
        media_strategy: platformKey === "bilibili" ? "embed" : "original"
      }
    }));

    const result = await createTasksBulk(payload);
    setIsSubmitting(false);

    if (!result) {
      showToast("Tạo nhiệm vụ thất bại, lỗi hệ thống hoặc kết nối.", "error");
      return;
    }

    const { inserted_count, skipped_count, errors } = result;

    if (inserted_count > 0) {
      if (skipped_count > 0) {
        showToast(`Đã tạo thành công ${inserted_count} nhiệm vụ. Bỏ qua ${skipped_count} nhiệm vụ trùng lặp.`, "success");
      } else {
        showToast(`Đã tạo thành công ${inserted_count} nhiệm vụ.`, "success");
      }
      
      // Reset targets input and close modal
      setNewTargets("");
      setNewMaxCount(50);
      setNewTags([]);
      setNewLanguage("Auto");
      setCrawlComments(true);
      setCrawlSubComments(true);
      setHeadlessMode(true);
      setShowModal(false);
      setErrorsList([]);

      // Fetch fresh tasks immediately instead of relying solely on realtime
      try {
        const freshTasks = await getTasks();
        setTasks(freshTasks);
        setError(null);
      } catch (err) {
        console.error("Failed to sync tasks after creation:", err);
      }
    } else {
      showToast(`Không nhiệm vụ nào được thêm mới (bỏ qua ${skipped_count} nhiệm vụ trùng).`, "info");
      if (errors && errors.length > 0) {
        setErrorsList(errors);
      }
    }
  };

  const filtered = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6 select-none relative">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className={cn(
          "fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg bg-card text-foreground animate-in slide-in-from-top-4 duration-300",
          notification.type === "success" ? "border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
          notification.type === "error" ? "border-red-500/20 text-red-500" : "border-amber-500/20 text-amber-500"
        )}>
          <div className={cn(
            "h-2 w-2 rounded-full",
            notification.type === "success" ? "bg-emerald-500" :
            notification.type === "error" ? "bg-red-500" : "bg-amber-500"
          )} />
          <p className="text-xs font-semibold">{notification.message}</p>
          <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-2 hover:bg-muted p-0.5 rounded text-muted-foreground transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Chiến dịch & Nhiệm vụ cào</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            Tạo, lên lịch và giám sát crawler tasks
            {realtimeStatus === "subscribed" && (
              <span className="inline-flex items-center gap-1 text-emerald-500">
                <Radio size={10} className="animate-pulse" />
                <span className="text-[10px] font-medium">Live</span>
              </span>
            )}
            {realtimeStatus === "connecting" && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                <Radio size={10} className="animate-pulse" />
                <span className="text-[10px] font-medium text-amber-500 animate-pulse">Connecting...</span>
              </span>
            )}
            {realtimeStatus === "error" && (
              <span className="inline-flex items-center gap-1 text-red-500">
                <Radio size={10} />
                <span className="text-[10px] font-medium">Offline</span>
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer active-press">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Tạo nhiệm vụ mới
        </button>

      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 text-xs bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 select-text">
          <div className="flex gap-2.5 items-start">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-500">Lỗi kết nối Cơ sở dữ liệu</p>
              <p className="mt-0.5 text-red-400/90 font-mono text-[11.5px] whitespace-pre-wrap">{error}</p>
            </div>
          </div>
          <button 
            onClick={handleRefreshTasks} 
            className="self-start sm:self-center px-3 h-7 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer shrink-0"
          >
            Thử kết nối lại
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "running", "pending", "scheduled", "completed", "failed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn(
            "h-7 px-3 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer",
            statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}>
            {s === "all" ? "Tất cả" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Task Queue Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Nền tảng</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Loại</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Target</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Cấu hình & Nhãn</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Ưu tiên</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Trạng thái</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Tạo lúc</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} className={cn(
                  "border-b border-border/50 hover:bg-muted/20 transition-colors",
                  task.status === "running" && "bg-primary/5"
                )}>
                  <td className="px-4 py-2.5"><PlatformBadge platform={task.platform} /></td>
                  <td className="px-4 py-2.5 text-card-foreground capitalize">{task.command}</td>
                  <td className="px-4 py-2.5 text-card-foreground max-w-[200px] truncate font-mono text-[11px]">{task.target}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-1">
                      {/* Configuration Badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {task.metadata?.headless !== undefined && (
                          <span className={cn(
                            "px-1 py-0.5 rounded text-[9px] font-medium border",
                            task.metadata.headless ? "bg-zinc-900 border-zinc-700 text-zinc-400" : "bg-orange-950 border-orange-900/50 text-orange-400"
                          )}>
                            {task.metadata.headless ? "headless" : "headful"}
                          </span>
                        )}
                        {task.metadata?.crawl_comments && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-blue-950 border border-blue-900/50 text-blue-400">
                            comments
                            {task.metadata?.crawl_sub_comments && "+sub"}
                          </span>
                        )}
                        {task.metadata?.language && task.metadata.language !== "auto" && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-purple-950 border border-purple-900/50 text-purple-400">
                            lang: {task.metadata.language}
                          </span>
                        )}
                      </div>
                      {/* Tags Badges */}
                      {task.metadata?.tags && task.metadata.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {task.metadata.tags.map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={task.status} />
                        {task.status === "running" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        {task.metadata?.progress && (
                          <span className="text-[10px] font-semibold text-muted-foreground ml-1">
                            Đã lưu: {task.metadata.progress.current}/{task.metadata.progress.target}
                          </span>
                        )}
                      </div>
                      {task.status === "running" && task.metadata?.phase && (
                        <div className="text-[9.5px] font-medium text-blue-500 dark:text-blue-400 mt-0.5 flex items-center gap-1 select-none">
                          <span className="inline-block size-1 bg-blue-500 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                          {task.metadata.phase === "collecting_posts" && (
                            ["bilibili", "douyin", "kuaishou"].includes(task.platform)
                              ? "Đang thu thập video"
                              : "Đang thu thập bài đăng"
                          )}
                          {task.metadata.phase === "crawling_comments" && (
                            <>
                              Đang cào bình luận
                              {task.metadata.comment_progress ? (
                                ` ${task.metadata.comment_progress.current}/${task.metadata.comment_progress.target} ${
                                  ["bilibili", "douyin", "kuaishou"].includes(task.platform) ? "video" : "bài"
                                }`
                              ) : (
                                ["bilibili", "douyin", "kuaishou"].includes(task.platform) ? " video" : " bài"
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {task.status === "failed" && task.error_message && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 font-medium max-w-[180px] break-words line-clamp-2" title={task.error_message}>
                          {task.error_message}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{timeAgo(task.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setSelectedTask(task.id === selectedTask ? null : task.id)} 
                        className={cn(
                          "h-6 gap-1 rounded-[10px] px-2 text-[11px] inline-flex items-center justify-center font-semibold transition-all cursor-pointer border shrink-0",
                          task.id === selectedTask 
                            ? "bg-muted text-foreground border-border" 
                            : "bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {task.id === selectedTask ? (
                          <>
                            <EyeOff size={11} />
                            Ẩn Log
                          </>
                        ) : (
                          <>
                            <Eye size={11} />
                            Xem Log
                          </>
                        )}
                      </button>
                      
                      {(task.status === "pending" || task.status === "running") && (
                        <button 
                          onClick={() => handleCancelTask(task.id)} 
                          className="h-6 gap-1 rounded-[10px] px-2 text-[11px] inline-flex items-center justify-center font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 transition-all cursor-pointer shrink-0"
                        >
                          <XCircle size={11} />
                          Huỷ
                        </button>
                      )}
                      
                      {(task.status === "failed" || task.status === "cancelled") && (
                        <button 
                          onClick={() => handleRetryTask(task.id)} 
                          className="h-6 gap-1 rounded-[10px] px-2 text-[11px] inline-flex items-center justify-center font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 transition-all cursor-pointer shrink-0"
                        >
                          <RotateCcw size={11} />
                          Chạy lại
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-xs">
            <p className="font-medium">Không có task nào</p>
          </div>
        )}
      </div>

      {/* Console Panel — Live Logs */}
      {selectedTask && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[oklch(0.15_0_0)] border-b border-white/10">
            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
              Console — Task {selectedTask.slice(0, 8)}…
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
                <Radio size={8} className="animate-pulse" />
                Live
              </span>
            </span>
            <button onClick={() => setSelectedTask(null)} className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer">Đóng ✕</button>
          </div>
          <div className="bg-[oklch(0.12_0_0)] p-4 font-mono text-xs space-y-0.5 max-h-[300px] overflow-y-auto">
            {taskLogs.length === 0 && (
              <div className="text-zinc-600 text-center py-4">Chưa có log nào cho task này.</div>
            )}
            {taskLogs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-zinc-600 shrink-0">{new Date(log.created_at).toLocaleTimeString("vi-VN")}</span>
                <span className={cn("font-semibold shrink-0 w-12", LOG_COLORS[log.level] || "text-zinc-400")}>[{log.level}]</span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl flex flex-col animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-card-foreground">Tạo nhiệm vụ cào mới</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
            </div>
            
            <div className="p-6 space-y-6 flex-1">
              {/* Warnings List if any duplicate task exists */}
              {errorsList.length > 0 && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg space-y-1.5 flex gap-2 items-start">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Phát hiện nhiệm vụ đã trùng lặp hoặc đang chờ xử lý:</p>
                    <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto font-mono text-[10px]">
                      {errorsList.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Form groups */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground border-b border-border pb-2">Cấu hình mục tiêu</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-medium text-muted-foreground">Nền tảng *</span>
                    <DropdownSelect
                      value={newPlatform}
                      onChange={setNewPlatform}
                      options={[
                        "Douyin",
                        "XHS / Tiểu Hồng Thư",
                        "Bilibili",
                        "Weibo",
                        "Kuaishou",
                        "Tieba",
                        "Zhihu",
                        "TikTok"
                      ]}
                      fullWidth
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-medium text-muted-foreground">Danh mục cào *</span>
                    <DropdownSelect
                      value={newCategory}
                      onChange={setNewCategory}
                      options={[
                        "Creator",
                        "Search",
                        "Comment",
                        "Ads Target"
                      ]}
                      fullWidth
                    />
                  </label>
                </div>
                
                <label className="space-y-1 block">
                  <span className="text-[11px] font-medium text-muted-foreground">{getLabelText()}</span>
                  <textarea 
                    rows={4} 
                    placeholder={getPlaceholderText()} 
                    value={newTargets}
                    onChange={(e) => setNewTargets(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono" 
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-medium text-muted-foreground">Số lượng bài viết tối đa</span>
                    <input 
                      type="number" 
                      min={1}
                      max={1000}
                      value={newMaxCount} 
                      onChange={(e) => setNewMaxCount(Number(e.target.value))}
                      className="w-full h-8 px-3 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary" 
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-medium text-muted-foreground">Mức ưu tiên</span>
                    <DropdownSelect
                      value={newPriority}
                      onChange={setNewPriority}
                      options={[
                        "Normal",
                        "Critical",
                        "High",
                        "Low"
                      ]}
                      fullWidth
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-foreground border-b border-border pb-2">Cấu hình đầu ra & Chạy</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground block">Tags (phân tách bằng dấu phẩy)</span>
                    <TagInput tags={newTags} onChange={setNewTags} placeholder="Ví dụ: hot, tin_tuc, giải_trí" />
                  </div>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-medium text-muted-foreground">Ngôn ngữ phân tích</span>
                    <DropdownSelect
                      value={newLanguage}
                      onChange={setNewLanguage}
                      options={[
                        "Auto",
                        "Trung Quốc (zh)",
                        "Tiếng Anh (en)",
                        "Tiếng Việt (vi)"
                      ]}
                      fullWidth
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs text-card-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={headlessMode}
                      onChange={(e) => setHeadlessMode(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary size-3.5 bg-background" 
                    />
                    Chạy ẩn danh (Headless Mode)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-card-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={crawlComments}
                      onChange={(e) => setCrawlComments(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary size-3.5 bg-background" 
                    />
                    Cào bình luận bài đăng (Crawl Comments)
                  </label>
                  {crawlComments && (
                    <label className="flex items-center gap-2 text-xs text-card-foreground pl-5 cursor-pointer animate-in fade-in slide-in-from-left-2 duration-150">
                      <input 
                        type="checkbox" 
                        checked={crawlSubComments}
                        onChange={(e) => setCrawlSubComments(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary size-3.5 bg-background" 
                      />
                      Cào bình luận phụ (Crawl Sub-comments)
                    </label>
                  )}

                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <button 
                onClick={() => setShowModal(false)} 
                disabled={isSubmitting}
                className="h-8 px-4 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateTasks} 
                disabled={isSubmitting}
                className="h-8 px-4 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? "Đang xử lý..." : "Tạo nhiệm vụ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
