"use client";

import React, { useState } from "react";
import { X, UserPlus, Check, Clipboard } from "lucide-react";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { inviteMemberAction } from "@/lib/actions/member.actions";
import { RoleItem } from "@/lib/services/member.service";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleItem[];
  showToast: (msg: string, type?: "success" | "info") => void;
}

export function InviteMemberModal({ isOpen, onClose, roles, showToast }: InviteMemberModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setInviteEmail("");
    setInviteRole("user");
    setSuccessLink(null);
    setCopied(false);
    onClose();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setLoading(true);
    const res = await inviteMemberAction(inviteEmail, inviteRole);
    setLoading(false);

    if (res.error) {
      showToast(res.error, "info");
    } else {
      const signupUrl = `${window.location.origin}/sign-up?email=${encodeURIComponent(inviteEmail)}&invite=${encodeURIComponent(res.token || "")}`;
      setSuccessLink(signupUrl);
      showToast(`Đã tạo lời mời pending cho ${inviteEmail}`, "success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-220 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <div className="flex items-center justify-between p-4 border-b border-border select-none">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <UserPlus size={16} className="text-primary" />
            Mời thành viên mới
          </h3>
          <button
            onClick={handleClose}
            className="group p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {successLink ? (
          <div className="p-6 space-y-4 text-center select-none">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-500">
              <Check size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Đã tạo lời mời pending!</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tài khoản lời mời của <strong className="text-foreground">{inviteEmail}</strong> đã được lưu trên hệ thống. 
                Hãy sao chép liên kết đăng ký dưới đây và gửi cho thành viên của bạn để họ có thể hoàn tất tạo tài khoản:
              </p>
            </div>
            <div className="flex gap-2 items-center rounded-lg border border-border bg-muted/20 p-2 text-left">
              <input
                type="text"
                readOnly
                value={successLink}
                className="w-full bg-transparent text-[11px] text-foreground focus:outline-none select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(successLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 hover:bg-muted rounded text-primary hover:text-primary-hover shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Clipboard size={14} />}
              </button>
            </div>
            <button
              onClick={handleClose}
              className="w-full h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer mt-4"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Địa chỉ Email</label>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="VD: member@sinomedia.vn"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Chỉ định Vai trò</label>
              <DropdownSelect
                value={inviteRole}
                onChange={setInviteRole}
                options={roles.map(r => ({ value: r.roleId, label: r.roleName }))}
                fullWidth
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-2 select-none">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading && <span className="h-3 w-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />}
                Mời thành viên
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
