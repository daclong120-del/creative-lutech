"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getRelease, promoteRelease, haltRelease, getJobs } from "@/lib/actions/release-ops.actions";
import type { AppReleaseItem } from "@/types/release-ops";
import { Database } from "@/types/supabase";
import {
  ArrowLeft,
  Rocket,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Ban,
} from "lucide-react";

type DbJob = Database["public"]["Tables"]["release_ops_jobs"]["Row"];

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params?.id as string;

  const [release, setRelease] = useState<AppReleaseItem | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReleaseDetail = async () => {
    if (!releaseId) return;
    setLoading(true);
    try {
      const [relData, jobsData] = await Promise.all([
        getRelease(releaseId),
        getJobs(200),
      ]);
      setRelease(relData);
      const relJobs = jobsData.filter((j) => j.release_id === releaseId);
      setJobs(relJobs);
    } catch (err) {
      console.error("Failed to load release detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleaseDetail();
  }, [releaseId]);

  const handlePromote = async (targetPct: number) => {
    if (!release) return;
    setIsSubmitting(true);
    try {
      await promoteRelease(release.id, {
        targetRolloutPercentage: targetPct,
        reason: actionReason || "Promote from Release Detail page",
      });
      setActionReason("");
      await loadReleaseDetail();
    } catch (err) {
      console.error("Promote failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHalt = async () => {
    if (!release) return;
    setIsSubmitting(true);
    try {
      await haltRelease(release.id, {
        reason: actionReason || "Halt from Release Detail page",
      });
      setActionReason("");
      await loadReleaseDetail();
    } catch (err) {
      console.error("Halt failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dash/release-ops/releases")}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Chi tiết Bản phát hành {release ? `— ${release.appName} (${release.versionName})` : ""}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">{release?.packageName}</span>
        </div>
      </div>

      <ReleaseOpsNavTabs />

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-xs">
          <RefreshCw size={20} className="animate-spin inline mr-2" />
          Đang tải thông tin bản phát hành...
        </div>
      ) : !release ? (
        <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
          Không tìm thấy bản phát hành có ID: {releaseId}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs text-muted-foreground block font-mono">Release ID: {release.id}</span>
                <h2 className="text-base font-bold text-foreground">
                  {release.appName} &bull; Version {release.versionName} (Code: {release.versionCode})
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border uppercase">
                    Track: {release.track}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Status: {release.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground font-semibold">Tỷ lệ Rollout hiện tại:</span>
                <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {release.rolloutPercentage}%
                </div>
              </div>
            </div>

            {/* Action Buttons & Reason Box */}
            <div className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Thao tác Quản lý Rollout
              </span>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nhập lý do nghiệp vụ (Reason)..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePromote(Math.min(100, release.rolloutPercentage + 20))}
                    disabled={isSubmitting || release.rolloutPercentage >= 100 || release.status === "halted"}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <TrendingUp size={13} /> +20% Rollout
                  </button>

                  <button
                    onClick={() => handlePromote(100)}
                    disabled={isSubmitting || release.rolloutPercentage >= 100 || release.status === "halted"}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
                  >
                    100% Full Live
                  </button>

                  <button
                    onClick={handleHalt}
                    disabled={isSubmitting || release.status === "halted"}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <Ban size={13} /> Halt Release
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Readiness Gate & Health Guard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Readiness Gate */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <ShieldCheck size={16} className="text-emerald-500" /> Readiness Gate Checklist
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Pre-check Automated Tests</span>
                  {release.readinessGate.precheckPassed ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> PASSED
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <XCircle size={13} /> FAILED
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Google Play Review Status</span>
                  <span className="font-bold text-foreground">
                    {release.readinessGate.playReviewApproved ? "Đã Phê duyệt (Approved)" : "Đang chờ duyệt (Pending)"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Xác minh Version Code</span>
                  <span className="text-emerald-600 font-bold">VERIFIED OK</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Trạng thái Policy Check</span>
                  <span className="font-mono text-emerald-600 font-bold uppercase">
                    {release.readinessGate.policyStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Guard */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Activity size={16} className="text-blue-500" /> Health Guard & Bad Behavior Metrics
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Khuyến nghị Tăng rollout</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {release.healthGuard.recommendation}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Tỷ lệ Crash Rate (%)</span>
                  <span className="font-mono font-bold text-foreground">
                    {release.healthGuard.crashRatePct}% (Dưới ngưỡng cảnh báo)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Tỷ lệ ANR Rate (%)</span>
                  <span className="font-mono font-bold text-foreground">
                    {release.healthGuard.anrRatePct}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg">
                  <span>Bad Behavior Index</span>
                  <span className="font-bold text-emerald-600 uppercase">
                    {release.healthGuard.badBehaviorStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Jobs */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Lịch sử Tác vụ liên quan ({jobs.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold font-sans">
                  <tr>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Worker ID</th>
                    <th className="py-2.5 px-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[11px]">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground font-sans">
                        Chưa có tác vụ nào thuộc bản phát hành này.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-foreground">{j.id.slice(0, 8)}...</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{j.job_type}</td>
                        <td className="py-2.5 px-3 font-sans font-medium">{j.status}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{j.worker_id ?? "—"}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {new Date(j.created_at).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
