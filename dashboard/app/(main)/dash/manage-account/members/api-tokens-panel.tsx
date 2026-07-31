"use client";

import React, { useState } from "react";
import { Plus, ShieldCheck, X, Copy, AlertTriangle } from "lucide-react";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { createApiTokenAction, revokeApiTokenAction } from "@/lib/actions/member.actions";
import { ApiTokenItem, RoleItem } from "@/lib/services/member.service";

interface ApiTokensPanelProps {
  tokens: ApiTokenItem[];
  roles: RoleItem[];
  showToast: (msg: string, type?: "success" | "info") => void;
}

export function ApiTokensPanel({ tokens, roles, showToast }: ApiTokensPanelProps) {
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenRole, setNewTokenRole] = useState("user");
  const [expiresDays, setExpiresDays] = useState("30");
  const [loading, setLoading] = useState(false);

  // Single exposure token display state
  const [exposedToken, setExposedToken] = useState<string | null>(null);

  const handleCreateTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName) return;

    setLoading(true);
    const days = parseInt(expiresDays, 10);
    const res = await createApiTokenAction(newTokenName, newTokenRole, days > 0 ? days : undefined);
    setLoading(false);

    if (res.error) {
      showToast(res.error, "info");
    } else if (res.rawToken) {
      setExposedToken(res.rawToken);
      showToast(`API Token "${newTokenName}" đã được tạo thành công`, "success");
      setNewTokenName("");
      setNewTokenRole("user");
      setExpiresDays("30");
      setIsCreateTokenOpen(false);
    }
  };

  const handleRevokeToken = async (tokenId: string, tokenName: string) => {
    if (confirm(`Bạn có chắc chắn muốn thu hồi API Token "${tokenName}"? Hộp thoại này không thể phục hồi.`)) {
      setLoading(true);
      const res = await revokeApiTokenAction(tokenId, tokenName);
      setLoading(false);

      if (res.error) {
        showToast(res.error, "info");
      } else {
        showToast(`Đã thu hồi API Token "${tokenName}"`, "success");
      }
    }
  };

  const handleCopyToken = () => {
    if (exposedToken) {
      navigator.clipboard.writeText(exposedToken);
      showToast("Đã sao chép token vào bộ nhớ tạm!", "success");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">API Access Tokens</h3>
          <p className="text-xs text-muted-foreground">
            Tạo các API tokens để các công cụ bên ngoài hoặc mã nguồn crawler có thể gọi API hợp lệ.
          </p>
        </div>
        <button
          onClick={() => {
            setExposedToken(null);
            setIsCreateTokenOpen(true);
          }}
          className="flex h-9 items-center justify-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} /> Tạo Token mới
        </button>
      </div>

      {/* Exposed Token Dialog (Single Exposure) */}
      {exposedToken && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Lưu ý bảo mật quan trọng</h4>
              <p className="text-[10px] text-muted-foreground">
                Sao chép mã API Token dưới đây ngay bây giờ. Vì lý do bảo mật, bạn sẽ **không thể nhìn thấy** mã này lần thứ hai sau khi đóng hộp thoại này.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
            <code className="text-xs font-mono text-foreground break-all select-all flex-1">{exposedToken}</code>
            <button
              onClick={handleCopyToken}
              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="Sao chép"
            >
              <Copy size={14} />
            </button>
          </div>
          <button
            onClick={() => setExposedToken(null)}
            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 select-none cursor-pointer"
          >
            Tôi đã sao chép và lưu trữ an toàn, hãy đóng lại.
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <div className="divide-y divide-border/60">
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between py-3 text-xs first:pt-0 last:pb-0">
                <div className="space-y-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{token.name}</p>
                    {token.status === "revoked" && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 select-none">Đã thu hồi</span>
                    )}
                    {token.status === "expired" && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 select-none">Đã hết hạn</span>
                    )}
                    {token.status === "active" && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 select-none">Hoạt động</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{token.tokenPrefix}</span>
                    <span>•</span>
                    <span>Vai trò: {token.role}</span>
                    <span>•</span>
                    <span>Người tạo: {token.creatorEmail || "Hệ thống"}</span>
                    <span>•</span>
                    <span>Hạn dùng: {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString("vi-VN") : "Vô hạn"}</span>
                    <span>•</span>
                    <span>Dùng cuối: {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString("vi-VN") : "Chưa dùng"}</span>
                  </div>
                </div>
                {token.status === "active" && (
                  <button
                    disabled={loading}
                    onClick={() => handleRevokeToken(token.id, token.name)}
                    className="text-red-500 hover:underline font-semibold cursor-pointer text-xs shrink-0 disabled:opacity-50"
                  >
                    Thu hồi
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-2 text-center select-none">Chưa có API Token nào được tạo.</p>
          )}
        </div>
      </div>

      {/* Create API Token Modal */}
      {isCreateTokenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border select-none">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-primary" />
                Tạo API Token mới
              </h3>
              <button
                onClick={() => setIsCreateTokenOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTokenSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tên gợi nhớ</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="VD: Server crawler scraper"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Vai trò của Token</label>
                <DropdownSelect
                  value={newTokenRole}
                  onChange={setNewTokenRole}
                  options={roles.map(r => ({ value: r.roleId, label: r.roleName }))}
                  fullWidth
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Hạn hiệu lực của Token</label>
                <DropdownSelect
                  value={expiresDays}
                  onChange={setExpiresDays}
                  options={[
                    { value: "30", label: "30 ngày" },
                    { value: "90", label: "90 ngày" },
                    { value: "365", label: "365 ngày" },
                    { value: "0", label: "Không hết hạn (Vĩnh viễn)" }
                  ]}
                  fullWidth
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 select-none">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsCreateTokenOpen(false)}
                  className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-all duration-120 active-press cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-all duration-120 active-press cursor-pointer disabled:opacity-50"
                >
                  Tạo Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
