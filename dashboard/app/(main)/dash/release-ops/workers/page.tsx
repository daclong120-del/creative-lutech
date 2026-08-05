"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getWorkers } from "@/lib/actions/release-ops.actions";
import type { WorkerDetailItem } from "@/lib/services/release-ops.service";
import {
  Cpu,
  RefreshCw,
  Activity,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";

function WorkerHealthBadge({ status }: { status: "online" | "stale" | "offline" }) {
  switch (status) {
    case "online":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Online
        </span>
      );
    case "stale":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <span className="size-2 rounded-full bg-amber-500" /> Stale (Chậm)
        </span>
      );
    case "offline":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <span className="size-2 rounded-full bg-rose-500" /> Offline
        </span>
      );
  }
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerDetailItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkers();
      setWorkers(data as unknown as WorkerDetailItem[]);
    } catch (err) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 15000);
    return () => clearInterval(interval);
  }, [loadWorkers]);

  const onlineCount = workers.filter((w) => w.status === "online").length;
  const staleCount = workers.filter((w) => w.status === "stale").length;
  const offlineCount = workers.filter((w) => w.status === "offline").length;
  const activeJobsTotal = workers.reduce((sum, w) => sum + w.currentJobsCount, 0);

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Worker Fleet Management (Đội ngũ Worker Nodes)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giám sát trạng thái máy chủ thực thi tác vụ (VPS Windows Server nodes), sức chứa (Capacity) & Heartbeat
          </p>
        </div>

        <button
          onClick={loadWorkers}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Làm mới Fleet Status</span>
        </button>
      </div>

      <ReleaseOpsNavTabs />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tổng số Workers</span>
            <Server size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{workers.length} Nodes</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {onlineCount} Online | {staleCount} Stale | {offlineCount} Offline
          </span>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tác vụ Đang chạy (Active Jobs)</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {activeJobsTotal} Jobs
          </div>
          <span className="text-[11px] text-muted-foreground">Đang xử lý đồng thời trên fleet</span>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tổng Capacity Slots</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {workers.reduce((s, w) => s + w.maxParallelJobs, 0)} Slots
          </div>
          <span className="text-[11px] text-muted-foreground">Số tác vụ tối đa thực thi cùng lúc</span>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tỷ lệ Hoạt động (Fleet Availability)</span>
            <CheckCircle2 size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {workers.length > 0 ? `${Math.round((onlineCount / workers.length) * 100)}%` : "0%"}
          </div>
          <span className="text-[11px] text-muted-foreground">Dựa trên nhịp tim Heartbeat 30 giây</span>
        </div>
      </div>

      {/* Worker Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Danh sách Worker Nodes ({workers.length})
        </h2>

        {loading && workers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
            <RefreshCw size={20} className="animate-spin inline mr-2" />
            Đang kiểm tra thông tin Worker Fleet...
          </div>
        ) : workers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
            Chưa có Worker Node nào đăng ký vào hệ thống release-ops.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w) => {
              const capacityRatio = (w.currentJobsCount / w.maxParallelJobs) * 100;
              return (
                <div
                  key={w.id}
                  className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs hover:border-primary/40 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu size={18} className="text-primary shrink-0" />
                      <div>
                        <span className="font-bold text-foreground block font-mono text-sm">
                          {w.hostname}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          IP: {w.ipAddress}
                        </span>
                      </div>
                    </div>
                    <WorkerHealthBadge status={w.status} />
                  </div>

                  {/* Heartbeat Status */}
                  <div className="p-2.5 bg-muted/30 border border-border/60 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Heartbeat gần nhất:</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Clock size={12} className="text-muted-foreground" />
                      {w.lastHeartbeatAgoSeconds}s trước
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-muted-foreground">Sức chứa (Capacity Slots):</span>
                      <span className="font-mono text-foreground">
                        {w.currentJobsCount} / {w.maxParallelJobs} slots
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div
                        className={`h-full transition-all duration-300 ${
                          capacityRatio >= 100
                            ? "bg-rose-500"
                            : capacityRatio > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, capacityRatio)}%` }}
                      />
                    </div>
                  </div>

                  {/* Capabilities Tags */}
                  <div className="space-y-1 text-xs">
                    <span className="text-muted-foreground font-semibold text-[11px] block">
                      Khả năng xử lý (Capabilities):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {w.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Active Jobs Running */}
                  {w.activeJobs.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                      <span className="font-semibold text-foreground text-[11px] block flex items-center gap-1">
                        <PlayCircle size={12} className="text-emerald-500 animate-spin" /> Jobs đang xử lý:
                      </span>
                      <div className="space-y-1">
                        {w.activeJobs.map((j) => (
                          <div
                            key={j.id}
                            className="p-1.5 bg-muted/40 rounded border border-border flex items-center justify-between font-mono text-[10px]"
                          >
                            <span className="font-bold text-foreground truncate max-w-[150px]">
                              {j.id.slice(0, 8)}... ({j.job_type})
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                              {j.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
