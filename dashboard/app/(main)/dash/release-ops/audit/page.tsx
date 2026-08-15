"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getAuditLogs } from "@/lib/actions/release-ops.actions";
import { Database } from "@/types/supabase";
import {
  Search,
  RefreshCw,
  History,
  TrendingUp,
  Ban,
  Rocket,
  AppWindow,
  Users,
  Code2,
  FileJson,
} from "lucide-react";

type DbAudit = Database["public"]["Tables"]["release_ops_audits"]["Row"];

function ActionBadge({ action }: { action: string }) {
  switch (action) {
    case "PROMOTE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <TrendingUp size={12} /> PROMOTE
        </span>
      );
    case "HALT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <Ban size={12} /> HALT
        </span>
      );
    case "CREATE_RELEASE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <Rocket size={12} /> CREATE_RELEASE
        </span>
      );
    case "CREATE_APP":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <AppWindow size={12} /> CREATE_APP
        </span>
      );
    case "CREATE_ACCOUNT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
          <Users size={12} /> CREATE_ACCOUNT
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-muted text-muted-foreground border border-border">
          {action}
        </span>
      );
  }
}

export default function AuditLogPage() {
  const [audits, setAudits] = useState<DbAudit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [search, setSearch] = useState("");

  // Json viewer modal state
  const [activeDetailsJson, setActiveDetailsJson] = useState<Record<string, unknown> | null>(null);

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(300);
      setAudits(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const filteredAudits = audits.filter((a) => {
    if (selectedAction !== "all" && a.action !== selectedAction) return false;
    if (selectedEntityType !== "all" && a.entity_type !== selectedEntityType) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchAction = a.action.toLowerCase().includes(q);
      const matchEntityId = a.entity_id.toLowerCase().includes(q);
      const matchActor = (a.user_id ?? "").toLowerCase().includes(q);
      if (!matchAction && !matchEntityId && !matchActor) return false;
    }
    return true;
  });

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <History size={20} className="text-primary" /> Nhật ký Kiểm toán (Release-Ops Audit Log Trail)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi truy vết lịch sử các thao tác Promote, Halt, Khởi tạo Release, Onboard App & Cấu hình bảo mật
          </p>
        </div>

        <button
          onClick={loadAudits}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Làm mới Audit Trail</span>
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
              placeholder="Tìm theo Actor, Entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">Tất cả Hành động (All Actions)</option>
            <option value="PROMOTE">PROMOTE (Tăng Rollout)</option>
            <option value="HALT">HALT (Tạm dừng Release)</option>
            <option value="CREATE_RELEASE">CREATE_RELEASE (Tạo Release)</option>
            <option value="CREATE_APP">CREATE_APP (Onboard App)</option>
            <option value="CREATE_ACCOUNT">CREATE_ACCOUNT (Thêm Account)</option>
          </select>

          {/* Entity Filter */}
          <select
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">Tất cả Thực thể (All Entities)</option>
            <option value="release">Release</option>
            <option value="app">App</option>
            <option value="account">Account</option>
            <option value="job">Job</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Tổng số bản ghi: <strong className="text-foreground">{filteredAudits.length}</strong> / {audits.length}
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Thời gian (Timestamp)</th>
                <th className="py-3 px-4">Hành động (Action)</th>
                <th className="py-3 px-4">Thực thể (Entity)</th>
                <th className="py-3 px-4">Người thực hiện (Actor)</th>
                <th className="py-3 px-4">Chi tiết Thay đổi (Payload)</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground font-sans">
                    <RefreshCw size={20} className="animate-spin inline mr-2" />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground font-sans">
                    Chưa có bản ghi kiểm toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <ActionBadge action={a.action} />
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      <span className="font-semibold">{a.entity_type}:</span>{" "}
                      <span className="text-muted-foreground">{a.entity_id.slice(0, 12)}...</span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-foreground">
                      {a.user_id ?? "Admin Operator"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setActiveDetailsJson((a.details as Record<string, unknown>) ?? {})}
                        className="px-2 py-0.5 rounded text-[10px] font-mono border border-border hover:bg-muted text-primary flex items-center gap-1 cursor-pointer"
                      >
                        <FileJson size={12} /> Xem Payload JSON
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {a.ip_address ?? "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Details Viewer Modal */}
      {activeDetailsJson && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Code2 size={16} className="text-primary" /> Chi tiết Payload Audit Entry
              </h3>
              <button
                onClick={() => setActiveDetailsJson(null)}
                className="text-muted-foreground text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-muted/40 p-3 rounded-lg border border-border overflow-x-auto">
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
                {JSON.stringify(activeDetailsJson, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setActiveDetailsJson(null)}
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
