"use client";

import React, { useState, useEffect } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import { PlatformBadge, StatusBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { getAccounts, createAccount, unbanAccount, deleteAccount } from "@/lib/actions/crawler.actions";
import { timeAgo, cn } from "@/lib/utils";
import type { CrawlerAccount } from "@/types";

export default function AccountsPage() {
  const [showModal, setShowModal] = useState(false);
  const [accountPlatform, setAccountPlatform] = useState("Douyin");
  const [accounts, setAccounts] = useState<CrawlerAccount[]>([]);

  // Form states
  const [alias, setAlias] = useState("");
  const [cookie, setCookie] = useState("");
  const [proxy, setProxy] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [globalError, setGlobalError] = useState("");

  const loadList = async () => {
    try {
      setGlobalError("");
      const data = await getAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      const error = err as Error;
      setGlobalError(error.message || "Không thể tải danh sách tài khoản.");
    }
  };

  useEffect(() => {
    let active = true;

    const load = () => {
      getAccounts()
        .then((data) => {
          if (active) {
            setAccounts(data);
            setGlobalError("");
          }
        })
        .catch((err) => {
          if (active) {
            const error = err as Error;
            setGlobalError(error.message || "Không thể tải danh sách tài khoản.");
          }
        });
    };

    load();

    const interval = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeCount = accounts.filter((a) => a.status === "active").length;
  const bannedCount = accounts.filter((a) => a.status === "banned").length;
  const healthRate = accounts.length > 0 ? Math.round((activeCount / accounts.length) * 100) : 0;

  const handleAddAccount = async () => {
    if (!alias.trim() || !cookie.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ Tên gợi nhớ và Cookie.");
      return;
    }

    if (proxy.trim()) {
      const parts = proxy.trim().split(":");
      if (parts.length < 2) {
        setErrorMsg("Proxy không hợp lệ. Phải là host:port hoặc host:port:username:password.");
        return;
      }
      const port = parseInt(parts[1], 10);
      if (isNaN(port)) {
        setErrorMsg("Port của proxy phải là số hợp lệ.");
        return;
      }
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await createAccount(accountPlatform, alias.trim(), cookie.trim(), proxy.trim() || null);
      
      // Reset & đóng modal
      setAlias("");
      setCookie("");
      setProxy("");
      setShowModal(false);
      await loadList();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Đã xảy ra lỗi khi nạp tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (id: string) => {
    try {
      await unbanAccount(id);
      await loadList();
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi khi kích hoạt lại tài khoản: " + error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản ${name}?`)) {
      return;
    }
    try {
      await deleteAccount(id);
      await loadList();
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi khi xóa tài khoản: " + error.message);
    }
  };

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý tài khoản crawler</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Nạp và quản lý pool cookie tài khoản cào</p>
        </div>
        <button onClick={() => setShowModal(true)} className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nạp tài khoản mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Tổng Active" value={activeCount} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} color="emerald" />
        <MetricCard label="Tổng Banned" value={bannedCount} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>} color="red" />
        <MetricCard label="Tổng tài khoản" value={accounts.length} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} color="blue" />
        <MetricCard label="Tỷ lệ sống" value={`${healthRate}%`} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>} color="violet" />
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs text-red-800 dark:text-red-300">
          ⚠️ Lỗi tải dữ liệu: {globalError}
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-800 dark:text-blue-300">
        ℹ️ Hệ thống tự động chọn tài khoản Active có <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">last_used_at</code> cũ nhất khi cào. Tài khoản lỗi ≥ 3 lần sẽ tự động Banned.
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Tên tài khoản</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Nền tảng</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Trạng thái</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Lỗi</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Proxy</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Dùng lần cuối</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{acc.alias}</td>
                  <td className="px-4 py-2.5"><PlatformBadge platform={acc.platform} /></td>
                  <td className="px-4 py-2.5"><StatusBadge status={acc.status} /></td>
                  <td className="px-4 py-2.5">
                    <span className={cn("tabular-nums font-mono", acc.failure_count >= 3 ? "text-red-500 font-bold" : acc.failure_count >= 1 ? "text-amber-500" : "text-muted-foreground")}>
                      {acc.failure_count}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px] max-w-[160px] truncate">{acc.proxy || <span className="italic text-zinc-400">Rotating Pool</span>}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{acc.last_used_at ? timeAgo(acc.last_used_at) : "—"}</td>
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    {acc.status === "banned" && (
                      <button onClick={() => handleUnban(acc.id)} className="text-[10px] text-emerald-600 hover:underline font-medium">Unban</button>
                    )}
                    <button onClick={() => handleDelete(acc.id, acc.alias)} className="text-[10px] text-destructive hover:underline font-medium">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => {
          setAlias("");
          setCookie("");
          setProxy("");
          setErrorMsg("");
          setShowModal(false);
        }}>
          <div className="bg-card rounded-xl border border-border w-full max-w-xl shadow-xl animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-card-foreground">Nạp tài khoản cào mới</h2>
              <button onClick={() => {
                setAlias("");
                setCookie("");
                setProxy("");
                setErrorMsg("");
                setShowModal(false);
              }} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Nền tảng *</span>
                <DropdownSelect
                  value={accountPlatform}
                  onChange={setAccountPlatform}
                  options={["Douyin", "XHS", "Bilibili", "Weibo", "Kuaishou", "Tieba", "Zhihu", "TikTok"]}
                  fullWidth
                />
              </label>
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Tên gợi nhớ *</span>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="VD: douyin_account_01"
                  className="w-full h-8 px-2 text-xs border border-border rounded-lg bg-background text-foreground"
                />
              </label>
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Cookie *</span>
                <textarea
                  rows={5}
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Raw string hoặc Chrome JSON format"
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground font-mono resize-none"
                />
              </label>
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Proxy riêng (tùy chọn)</span>
                <input
                  type="text"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                  placeholder="IP:Port:Username:Password"
                  className="w-full h-8 px-2 text-xs border border-border rounded-lg bg-background text-foreground font-mono"
                />
              </label>
            </div>
            
            {errorMsg && (
              <div className="text-red-500 text-xs px-6 pt-2 font-medium">{errorMsg}</div>
            )}

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={() => {
                  setAlias("");
                  setCookie("");
                  setProxy("");
                  setErrorMsg("");
                  setShowModal(false);
                }}
                className="h-8 px-4 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleAddAccount}
                disabled={loading}
                className="h-8 px-4 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Đang nạp..." : "Nạp tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
