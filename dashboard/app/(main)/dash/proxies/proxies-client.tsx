"use client";

import React, { useState, useEffect, useRef } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { getProxies, createProxies, deleteProxy, testProxy } from "@/lib/actions/system.actions";
import { timeAgo, cn } from "@/lib/utils";
import type { ProxyItem } from "@/types";
import { getLargeDraft, setLargeDraft, delLargeDraft } from "@/lib/utils/storage-helper";
import { debounce } from "@/lib/utils/debounce";

export default function ProxiesClient() {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [proxyProto, setProxyProto] = useState("HTTP");
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const debouncedSaveRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    debouncedSaveRef.current = debounce(async (text: string) => {
      const result = await setLargeDraft("sinomedia-proxy-bulk-draft", text);
      if (result.success && result.isFallback) {
        showToast("Đang duyệt ẩn danh. Bản nháp proxy sẽ bị mất khi đóng tab.", "info");
      }
    }, 500);
  }, []);

  const handleTextChange = (text: string) => {
    setBulkText(text);
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current(text);
    }
  };

  useEffect(() => {
    if (showModal) {
      const loadDraft = async () => {
        const draft = await getLargeDraft<string>("sinomedia-proxy-bulk-draft");
        if (draft) {
          setBulkText(draft);
          showToast("Đã tự động khôi phục bản nháp proxy trước đó của bạn.", "info");
        }
      };
      loadDraft();
    }
  }, [showModal]);

  const handleCancel = async () => {
    setShowModal(false);
    setBulkText("");
    await delLargeDraft("sinomedia-proxy-bulk-draft");
  };

  const handleCleanDraft = async () => {
    setBulkText("");
    await delLargeDraft("sinomedia-proxy-bulk-draft");
    showToast("Đã xóa bản nháp proxy.", "info");
  };

  const fetchList = async () => {
    setLoading(true);
    const list = await getProxies();
    setProxies(list);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const activeCount = proxies.filter((p) => p.status === "active").length;
  const inactiveCount = proxies.filter((p) => p.status === "inactive").length;
  const deadCount = proxies.filter((p) => p.status === "dead").length;

  const filtered = statusFilter === "all" ? proxies : proxies.filter((p) => p.status === statusFilter);

  const handleTestProxy = async (id: string) => {
    try {
      const newStatus = await testProxy(id);
      setProxies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus, last_used_at: new Date().toISOString() } : p))
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi khi kiểm tra proxy.");
    }
  };

  const handleDeleteProxy = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa proxy này?")) return;
    try {
      await deleteProxy(id);
      setProxies((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa proxy.");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) return;
    setSubmitting(true);
    try {
      const lines = bulkText.split("\n").filter((l) => l.trim());
      const parsed: Omit<ProxyItem, "id" | "assigned_account_id" | "assigned_account_alias" | "last_used_at" | "created_at">[] = [];

      for (const line of lines) {
        const parts = line.trim().split(":");
        if (parts.length < 2) continue;
        const host = parts[0];
        const port = parseInt(parts[1], 10);
        if (isNaN(port)) continue;
        const username = parts[2] || null;
        const password = parts[3] || null;

        parsed.push({
          host,
          port,
          username,
          password,
          protocol: proxyProto.toLowerCase() as ProxyItem["protocol"],
          status: "active"
        });
      }

      if (parsed.length > 0) {
        await createProxies(parsed);
        showToast(`Đã nạp thành công ${parsed.length} proxies.`, "success");
        setBulkText("");
        setShowModal(false);
        await delLargeDraft("sinomedia-proxy-bulk-draft");
        fetchList();
      } else {
        showToast("Định dạng dòng không hợp lệ. Vui lòng kiểm tra lại.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi nạp proxies.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý Proxy Pool</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Nạp và gán proxy cho các tài khoản crawler</p>
        </div>
        <button onClick={() => setShowModal(true)} className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nạp Proxy
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Tổng Active" value={activeCount} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>} color="emerald" />
        <MetricCard label="Tổng Inactive" value={inactiveCount} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>} color="orange" />
        <MetricCard label="Tổng Dead" value={deadCount} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>} color="red" />
        <MetricCard label="Tổng Proxy" value={proxies.length} icon={<svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></svg>} color="blue" />
      </div>

      {/* Mode info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-bold text-card-foreground flex items-center gap-1.5 mb-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            Sticky Proxy
          </h3>
          <p className="text-[11px] text-muted-foreground leading-normal">Gán 1 proxy cố định cho 1 tài khoản cụ thể tại trang <code className="bg-muted px-1 py-0.5 rounded text-[10px]">Tài khoản cào</code>. Crawler sẽ chỉ dùng proxy này để đăng nhập và giữ session cho tài khoản đó.</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-bold text-card-foreground flex items-center gap-1.5 mb-1">
            <span className="size-2 rounded-full bg-blue-500" />
            Rotating Pool
          </h3>
          <p className="text-[11px] text-muted-foreground leading-normal">Proxy không gán cho tài khoản nào sẽ được tự động xếp vào Rotating Pool. Crawler sẽ xoay vòng ngẫu nhiên danh sách này để thực hiện các request cào công khai như Search hoặc Post Detail.</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "active", "inactive", "dead"].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={cn(
              "h-7 px-3 text-[11px] font-medium rounded-lg border transition-colors",
              statusFilter === status ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}>
              {status === "all" ? "Tất cả" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">IP:Port</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Giao thức</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Tài khoản Proxy</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Trạng thái</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Gán cho Account</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Dùng lần cuối</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-32"></th>
                </tr>
              </thead>
              <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải danh sách proxy...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">Không tìm thấy proxy nào.</td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-card-foreground">{p.host}:{p.port}</td>
                        <td className="px-4 py-2.5 uppercase font-medium text-card-foreground">{p.protocol}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.username || "Anonymous"}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-2.5 text-card-foreground font-semibold">{p.assigned_account_alias || <span className="italic text-zinc-400 font-normal">Rotating Pool</span>}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.last_used_at ? timeAgo(p.last_used_at) : "—"}</td>
                        <td className="px-4 py-2.5 flex items-center gap-3">
                          <button onClick={() => handleTestProxy(p.id)} className="text-[10px] text-primary hover:underline font-medium cursor-pointer">Test Proxy</button>
                          <button onClick={() => handleDeleteProxy(p.id)} className="text-[10px] text-destructive hover:underline font-medium cursor-pointer">Xóa</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Add Proxy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-220 ease-[cubic-bezier(0.23,1,0.32,1)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-card-foreground">Nạp Proxy mới</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-transform duration-150 active:scale-90 cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Giao thức *</span>
                <DropdownSelect
                  value={proxyProto}
                  onChange={setProxyProto}
                  options={["HTTP", "SOCKS5"]}
                  fullWidth
                />
              </label>
              <label className="space-y-1 block">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-muted-foreground">Danh sách proxy *</span>
                  {bulkText.trim() && (
                    <button onClick={handleCleanDraft} className="text-[10px] text-destructive hover:underline font-semibold cursor-pointer">Xóa nháp</button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="IP:Port&#10;IP:Port:User:Pass&#10;45.123.45.6:1080:username:password"
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground font-mono resize-none"
                />
              </label>
              <p className="text-[10px] text-muted-foreground leading-normal">Hệ thống hỗ trợ tự động tách IP, Cổng, Username, Password. Có thể nạp số lượng lớn cùng lúc.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={handleCancel} className="h-8 px-4 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted cursor-pointer">Hủy</button>
              <button onClick={handleBulkUpload} disabled={submitting} className="h-8 px-4 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer">
                {submitting ? "Đang nạp..." : "Nạp Proxy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification.show && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200",
          notification.type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          notification.type === "error" && "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
          notification.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
        )}>
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}
    </div>
  );
}
