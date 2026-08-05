"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getApp, getReleases, getJobs } from "@/lib/actions/release-ops.actions";
import type { AppRegistryItem, AppReleaseItem } from "@/types/release-ops";
import { Database } from "@/types/supabase";
import {
  ArrowLeft,
  AppWindow,
  ShieldCheck,
  ExternalLink,
  Rocket,
  UploadCloud,
  RefreshCw,
  Tag,
  Users,
} from "lucide-react";

type DbJob = Database["public"]["Tables"]["release_ops_jobs"]["Row"];

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params?.id as string;

  const [app, setApp] = useState<AppRegistryItem | null>(null);
  const [releases, setReleases] = useState<AppReleaseItem[]>([]);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppDetail() {
      if (!appId) return;
      setLoading(true);
      try {
        const [appData, releasesData, jobsData] = await Promise.all([
          getApp(appId),
          getReleases(),
          getJobs(200),
        ]);
        setApp(appData);

        if (appData) {
          const appReleases = releasesData.filter(
            (r) => r.packageName === appData.packageName || r.appName === appData.appName
          );
          setReleases(appReleases);

          const appJobs = jobsData.filter((j) => j.app_id === appId);
          setJobs(appJobs);
        }
      } catch (err) {
        console.error("Failed to load app detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAppDetail();
  }, [appId]);

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dash/release-ops/apps")}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Chi tiết Ứng dụng {app ? `— ${app.appName}` : ""}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">{app?.packageName}</span>
        </div>
      </div>

      <ReleaseOpsNavTabs />

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-xs">
          <RefreshCw size={20} className="animate-spin inline mr-2" />
          Đang tải thông tin chi tiết ứng dụng...
        </div>
      ) : !app ? (
        <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
          Không tìm thấy ứng dụng có ID: {appId}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <AppWindow size={15} className="text-primary" /> Thông tin Metadata Tổng quan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Tên App:</span>
                <span className="font-bold text-foreground block text-sm">{app.appName}</span>
                <span className="font-mono text-[11px] text-muted-foreground block">{app.packageName}</span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Đội ngũ Sở hữu (Team Owner):</span>
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Users size={14} className="text-primary" />
                  {app.teamOwner}
                </span>
                <span className="text-muted-foreground">Tài khoản Dev: {app.accountName}</span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Target SDK & Trạng thái:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                  Target SDK API {app.targetSdk}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-block">
                  {app.status}
                </span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Privacy Policy & Safety:</span>
                {app.privacyPolicyUrl ? (
                  <a
                    href={app.privacyPolicyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1 truncate"
                  >
                    <span>Liên kết URL</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-muted-foreground">Chưa có URL</span>
                )}
                <span className="text-[10px] text-amber-600 font-bold block">
                  Data Safety: {app.dataSafetyStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Releases list for this app */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Rocket size={15} className="text-emerald-500" /> Các Bản phát hành (Releases — {releases.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Track</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Rollout %</th>
                    <th className="py-2.5 px-3">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {releases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground font-sans">
                        Chưa có bản phát hành nào cho ứng dụng này.
                      </td>
                    </tr>
                  ) : (
                    releases.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {r.versionName} ({r.versionCode})
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r.track}</td>
                        <td className="py-2.5 px-3 font-sans font-medium">{r.status}</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">{r.rolloutPercentage}%</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {new Date(r.updatedAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Jobs list for this app */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <UploadCloud size={15} className="text-blue-500" /> Lịch sử Tác vụ (Jobs — {jobs.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Worker</th>
                    <th className="py-2.5 px-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground font-sans">
                        Chưa có tác vụ nào chạy cho ứng dụng này.
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
