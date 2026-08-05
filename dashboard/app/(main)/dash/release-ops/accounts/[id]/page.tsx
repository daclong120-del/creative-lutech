"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getPlayAccounts, getApps } from "@/lib/actions/release-ops.actions";
import type { PlayAccountItem, AppRegistryItem } from "@/types/release-ops";
import {
  ArrowLeft,
  Users,
  Key,
  Database as DbIcon,
  AppWindow,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params?.id as string;

  const [account, setAccount] = useState<PlayAccountItem | null>(null);
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccountDetail() {
      if (!accountId) return;
      setLoading(true);
      try {
        const [accountsData, appsData] = await Promise.all([
          getPlayAccounts(),
          getApps(),
        ]);
        const acc = accountsData.find((a) => a.id === accountId) || null;
        setAccount(acc);

        if (acc) {
          const ownedApps = appsData.filter(
            (app) => app.accountName === acc.name || app.accountName === acc.email
          );
          setApps(ownedApps);
        }
      } catch (err) {
        console.error("Failed to load account detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAccountDetail();
  }, [accountId]);

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dash/release-ops/accounts")}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Chi tiết Tài khoản Play Developer {account ? `— ${account.name}` : ""}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">{account?.email}</span>
        </div>
      </div>

      <ReleaseOpsNavTabs />

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-xs">
          <RefreshCw size={20} className="animate-spin inline mr-2" />
          Đang tải thông tin tài khoản...
        </div>
      ) : !account ? (
        <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
          Không tìm thấy tài khoản Developer có ID: {accountId}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Users size={15} className="text-primary" /> Thông tin Service Account Key & Google Play Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Developer ID / Name:</span>
                <span className="font-bold text-foreground block text-sm">{account.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground block">{account.email}</span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Trạng thái Kết nối:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Healthy (Đã xác minh Token)
                </span>
                <span className="text-muted-foreground font-mono">
                  Sync: {new Date(account.lastSyncAt).toLocaleString("vi-VN")}
                </span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Tuổi thọ Key (Credential Key Age):</span>
                <span className="font-mono font-bold text-foreground block text-sm">
                  {account.keyAgeDays} ngày
                </span>
                <span className="text-muted-foreground text-[10px]">Cần xoay key nếu {">"} 365 ngày</span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium block">Tổng số Apps sở hữu:</span>
                <span className="font-mono font-bold text-primary block text-sm">
                  {account.totalApps} Ứng dụng
                </span>
                <span className="text-muted-foreground text-[10px]">Quota API: Normal</span>
              </div>
            </div>
          </div>

          {/* Apps list for this account */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <AppWindow size={15} className="text-emerald-500" /> Các Ứng dụng trực thuộc ({apps.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Tên App & Package</th>
                    <th className="py-2.5 px-3">Team Owner</th>
                    <th className="py-2.5 px-3">Target SDK</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Chưa có ứng dụng nào gán cho tài khoản này.
                      </td>
                    </tr>
                  ) : (
                    apps.map((app) => (
                      <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-foreground block">{app.appName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{app.packageName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{app.teamOwner}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">API {app.targetSdk}</td>
                        <td className="py-2.5 px-3 font-medium text-emerald-600 uppercase">{app.status}</td>
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
