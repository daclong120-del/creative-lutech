"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getJobs, getJobDetail, cancelJob, createJob } from "@/lib/actions/release-ops.actions";
import type { JobDetailItem } from "@/lib/services/release-ops.service";
import { Database } from "@/types/supabase";
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
  FileText,
  Download,
  RotateCcw,
  Ban,
  Layers,
  Cpu,
  Eye,
} from "lucide-react";

type DbJob = Database["public"]["Tables"]["release_ops_jobs"]["Row"];

function JobStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "queued":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock size={12} /> Hàng chờ
        </span>
      );
    case "leased":
    case "running":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <PlayCircle size={12} className="animate-spin" /> Đang chạy
        </span>
      );
    case "succeeded":
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 size={12} /> Thành công
        </span>
      );
    case "failed":
    case "dead_letter":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <XCircle size={12} /> Thất bại
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
          <Ban size={12} /> Đã hủy
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
          {status}
        </span>
      );
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Modal Detail state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJobs(200);
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const openJobDetail = async (jobId: string) => {
    setSelectedJobId(jobId);
    setDetailLoading(true);
    try {
      const detail = await getJobDetail(jobId);
      setJobDetail(detail);
    } catch (err) {
      console.error("Failed to load job detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
      await loadJobs();
      if (selectedJobId === jobId) {
        openJobDetail(jobId);
      }
    } catch (err) {
      console.error("Failed to cancel job:", err);
    }
  };

  const handleRetryJob = async (job: DbJob) => {
    try {
      await createJob({
        job_type: job.job_type,
        app_id: job.app_id,
        release_id: job.release_id,
        payload: (job.payload as Record<string, unknown>) ?? {},
        priority: job.priority ?? 0,
      });
      await loadJobs();
      setSelectedJobId(null);
    } catch (err) {
      console.error("Failed to retry job:", err);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (selectedType !== "all" && j.job_type !== selectedType) return false;
    if (selectedStatus !== "all" && j.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = j.id.toLowerCase().includes(q);
      const matchType = j.job_type.toLowerCase().includes(q);
      const matchWorker = (j.worker_id ?? "").toLowerCase().includes(q);
      if (!matchId && !matchType && !matchWorker) return false;
    }
    return true;
  });

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Hàng chờ Tác vụ (Job Queue & Lifecycle Trace)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giám sát tiến độ thực thi các tác vụ Upload, Promote, Halt, Sync Report & kiểm tra Timeline Events
          </p>
        </div>

        <button
          onClick={loadJobs}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Làm mới Queue</span>
        </button>
      </div>

      <ReleaseOpsNavTabs />

      {/* Filter Panel */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64 text-xs">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo Job ID, Worker ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">Tất cả Loại Job (All Types)</option>
            <option value="upload">Upload Build (.aab)</option>
            <option value="promote">Promote Rollout</option>
            <option value="halt">Halt Rollout</option>
            <option value="sync_report">Sync Report</option>
            <option value="build">CI Build</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">Tất cả Trạng thái (All Status)</option>
            <option value="queued">Hàng chờ (Queued)</option>
            <option value="running">Đang chạy (Running)</option>
            <option value="succeeded">Thành công (Succeeded)</option>
            <option value="failed">Thất bại (Failed)</option>
            <option value="cancelled">Đã hủy (Cancelled)</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Tổng số: <strong className="text-foreground">{filteredJobs.length}</strong> / {jobs.length} jobs
        </div>
      </div>

      {/* Job Queue Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Loại Tác vụ (Type)</th>
                <th className="py-3 px-4">Worker Node</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Độ ưu tiên</th>
                <th className="py-3 px-4">Thời gian tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-sans">
                    <RefreshCw size={20} className="animate-spin inline mr-2" />
                    Đang tải danh sách Job Queue...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-sans">
                    Không tìm thấy Job nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">
                      <button
                        onClick={() => openJobDetail(j.id)}
                        className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{j.id.slice(0, 8)}...</span>
                        <Eye size={12} />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted border border-border font-mono text-[10px] font-bold">
                        {j.job_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {j.worker_id ? (
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <Cpu size={12} className="text-muted-foreground" />
                          {j.worker_id}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <JobStatusBadge status={j.status} />
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      P{j.priority ?? 0}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(j.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openJobDetail(j.id)}
                          className="px-2 py-1 text-[11px] font-medium border border-border rounded hover:bg-muted flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={12} /> Timeline
                        </button>

                        {["queued", "leased", "retrying"].includes(j.status) && (
                          <button
                            onClick={() => handleCancelJob(j.id)}
                            className="px-2 py-1 text-[11px] font-medium border border-rose-500/20 bg-rose-500/10 text-rose-600 rounded hover:bg-rose-500/20 cursor-pointer"
                          >
                            Hủy Job
                          </button>
                        )}

                        {["failed", "dead_letter", "cancelled"].includes(j.status) && (
                          <button
                            onClick={() => handleRetryJob(j)}
                            className="px-2 py-1 text-[11px] font-medium border border-blue-500/20 bg-blue-500/10 text-blue-600 rounded hover:bg-blue-500/20 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw size={11} /> Thử lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Job Detail & Event Timeline Modal ─── */}
      {selectedJobId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground font-mono">Job: {selectedJobId}</h3>
                  {jobDetail && <JobStatusBadge status={jobDetail.job.status} />}
                </div>
                <span className="text-xs text-muted-foreground">Chi tiết tiến độ & Timeline sự kiện tác vụ</span>
              </div>
              <button
                onClick={() => {
                  setSelectedJobId(null);
                  setJobDetail(null);
                }}
                className="text-muted-foreground text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-muted-foreground text-xs font-sans">
                <RefreshCw size={20} className="animate-spin inline mr-2" />
                Đang tải dữ liệu sự kiện...
              </div>
            ) : jobDetail ? (
              <div className="space-y-4 text-xs overflow-y-auto pr-1">
                {/* Metadata Card */}
                <div className="p-3 bg-muted/30 border border-border rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-muted-foreground block">Loại Job:</span>
                    <span className="font-mono font-bold text-foreground">{jobDetail.job.job_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">App:</span>
                    <span className="font-semibold text-foreground">
                      {jobDetail.job.app?.app_name ?? jobDetail.job.app_id ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Worker Gán:</span>
                    <span className="font-mono font-bold text-foreground">
                      {jobDetail.job.worker_id ?? "Chưa gán"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Số lần thử:</span>
                    <span className="font-mono text-foreground">
                      {jobDetail.job.attempt_count ?? 0} / {jobDetail.job.max_attempts ?? 3}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Thời hạn Lease:</span>
                    <span className="font-mono text-foreground">
                      {jobDetail.leaseExpiryRemainingSeconds !== null
                        ? `${jobDetail.leaseExpiryRemainingSeconds}s còn lại`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Thời gian tạo:</span>
                    <span className="font-mono text-foreground">
                      {new Date(jobDetail.job.created_at).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Error Banner if failed */}
                {jobDetail.job.error_message && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg space-y-1">
                    <span className="font-bold block flex items-center gap-1">
                      <AlertTriangle size={13} /> Thông báo Lỗi (Error Details):
                    </span>
                    <pre className="font-mono text-[11px] whitespace-pre-wrap">
                      {jobDetail.job.error_message}
                    </pre>
                  </div>
                )}

                {/* Event Timeline List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                    Event Timeline Tracing ({jobDetail.events.length} bước)
                  </h4>

                  {jobDetail.events.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground bg-muted/20 border border-border rounded-lg">
                      Chưa ghi nhận event log nào cho tác vụ này.
                    </div>
                  ) : (
                    <div className="space-y-2 relative border-l-2 border-border/80 ml-2 pl-4 py-1">
                      {jobDetail.events.map((ev) => (
                        <div key={ev.id} className="relative space-y-0.5">
                          <span
                            className={`absolute -left-[21px] top-1 size-2 rounded-full border border-background ${
                              ev.level === "error"
                                ? "bg-rose-500"
                                : ev.level === "warn"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground font-mono">[{ev.stage}]</span>
                            <span className="text-muted-foreground text-[10px] font-mono">
                              {new Date(ev.created_at).toLocaleTimeString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-foreground">{ev.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Artifacts Section */}
                {jobDetail.artifacts.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      Tệp Artifact đính kèm ({jobDetail.artifacts.length})
                    </h4>
                    <div className="space-y-2">
                      {jobDetail.artifacts.map((art) => (
                        <div
                          key={art.id}
                          className="p-2.5 bg-muted/30 border border-border rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-foreground font-mono block">{art.file_name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              SHA256: {art.checksum_sha256.slice(0, 16)}... | {(art.file_size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                          <a
                            href={`/api/worker/v1/artifacts/${art.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded text-[11px] flex items-center gap-1 hover:bg-primary/90"
                          >
                            <Download size={12} /> Tải tệp
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
              <button
                onClick={() => {
                  setSelectedJobId(null);
                  setJobDetail(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
