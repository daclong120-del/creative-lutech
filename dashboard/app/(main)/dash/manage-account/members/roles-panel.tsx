"use client";

import React, { useState } from "react";
import { Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createRoleAction, updateRolePermissionsAction, deleteRoleAction } from "@/lib/actions/member.actions";
import { RoleItem, PermissionFlags } from "@/lib/services/member.service";

interface RolesPanelProps {
  roles: RoleItem[];
  showToast: (msg: string, type?: "success" | "info") => void;
}

export function RolesPanel({ roles, showToast }: RolesPanelProps) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  
  // Custom Dynamic Roles Management state
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState({
    tasks: false,
    accounts: false,
    proxies: false,
    settings: false,
    members: false,
    logs: true
  });

  const [loading, setLoading] = useState(false);

  // Local state for modified permissions mapped by roleName to avoid prop mutation
  const [localPermissions, setLocalPermissions] = useState<Record<string, PermissionFlags>>({});

  const activeRole = Array.isArray(roles) && roles.length > 0 ? (roles[selectedRoleIndex] || roles[0]) : null;
  
  const currentPermissions = activeRole 
    ? (localPermissions[activeRole.roleName] || { ...activeRole.permissions })
    : {
        tasks: false,
        accounts: false,
        proxies: false,
        settings: false,
        members: false,
        logs: true
      };

  const handleAddRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    setLoading(true);
    const res = await createRoleAction(newRoleName, newRoleDescription, newRolePermissions);
    setLoading(false);

    if (res.error) {
      showToast(res.error, "info");
    } else {
      showToast(`Đã thêm vai trò mới: ${newRoleName}`, "success");
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRolePermissions({ tasks: false, accounts: false, proxies: false, settings: false, members: false, logs: true });
      setIsAddRoleOpen(false);
      setSelectedRoleIndex(roles.length); // Select new role
    }
  };

  const handleDeleteRole = async () => {
    if (!activeRole || activeRole.isLocked) return;

    if (confirm(`Bạn có chắc chắn muốn xóa vai trò ${activeRole.roleName}?`)) {
      setLoading(true);
      const res = await deleteRoleAction(activeRole.roleId);
      setLoading(false);

      if (res.error) {
        showToast(res.error, "info");
      } else {
        showToast(`Đã xóa vai trò: ${activeRole.roleName}`, "success");
        setSelectedRoleIndex(0);
      }
    }
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;

    setLoading(true);
    const res = await updateRolePermissionsAction(activeRole.roleId, currentPermissions);
    setLoading(false);

    if (res.error) {
      showToast(res.error, "info");
    } else {
      showToast(`Đã lưu thay đổi quyền hạn cho vai trò ${activeRole.roleName}`, "success");
    }
  };

  const handleCheckboxChange = (key: keyof PermissionFlags, checked: boolean) => {
    if (!activeRole || activeRole.isLocked) return;
    setLocalPermissions(prev => ({
      ...prev,
      [activeRole.roleName]: {
        ...currentPermissions,
        [key]: checked
      }
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Roles List Card */}
      <div className="md:col-span-1 bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm select-none">
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Danh sách vai trò</h3>
          <button
            onClick={() => setIsAddRoleOpen(true)}
            className="p-1 hover:bg-muted rounded text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer text-[10px] font-bold transition-colors"
          >
            <Plus size={12} /> Thêm vai trò
          </button>
        </div>
        <div className="space-y-1">
          {roles.map((role, idx) => (
            <button
              key={role.roleName}
              onClick={() => setSelectedRoleIndex(idx)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors text-xs flex flex-col gap-1 cursor-pointer",
                selectedRoleIndex === idx
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="font-bold">{role.roleName}</span>
              <span className="text-[10px] opacity-90 truncate max-w-xs">{role.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Detail Card */}
      {activeRole && (
        <div className="md:col-span-2 bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="border-b border-border pb-3 mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">{activeRole.roleName}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeRole.description}
                </p>
              </div>
            </div>

            {/* Permissions List */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Quyền hạn chi tiết</h4>
              
              {/* Task Permission */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="text-xs font-bold text-foreground">Tác vụ crawler</p>
                  <p className="text-[10px] text-muted-foreground">Tạo mới, khởi chạy, tạm dừng, thay đổi và xóa các chiến dịch cào dữ liệu mạng xã hội.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPermissions.tasks}
                  disabled={activeRole.isLocked || loading}
                  onChange={(e) => handleCheckboxChange("tasks", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Accounts Permission */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="text-xs font-bold text-foreground">Tài khoản crawler</p>
                  <p className="text-[10px] text-muted-foreground">Quản lý kho tài khoản dùng để đăng nhập cào tin, kiểm tra trạng thái sống chết của cookie.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPermissions.accounts}
                  disabled={activeRole.isLocked || loading}
                  onChange={(e) => handleCheckboxChange("accounts", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Proxies Permission */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="text-xs font-bold text-foreground">Proxy và Mạng</p>
                  <p className="text-[10px] text-muted-foreground">Thêm, xóa và cấu hình các proxy máy chủ để tránh bị chặn IP khi thực hiện crawl diện rộng.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPermissions.proxies}
                  disabled={activeRole.isLocked || loading}
                  onChange={(e) => handleCheckboxChange("proxies", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Settings Permission */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="text-xs font-bold text-foreground">Cấu hình hệ thống</p>
                  <p className="text-[10px] text-muted-foreground">Thay đổi tham số luồng crawl, giới hạn tài nguyên máy chủ, cài đặt webhook và 2Captcha.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPermissions.settings}
                  disabled={activeRole.isLocked || loading}
                  onChange={(e) => handleCheckboxChange("settings", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Members Permission */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="text-xs font-bold text-foreground">Quản trị thành viên và API</p>
                  <p className="text-[10px] text-muted-foreground">Mời người dùng mới vào hệ thống, điều chỉnh vai trò và tạo mới/thu hồi các mã khóa truy cập API.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPermissions.members}
                  disabled={activeRole.isLocked || loading}
                  onChange={(e) => handleCheckboxChange("members", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Audit Logs Permission */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="text-xs font-bold text-foreground">Nhật ký hoạt động</p>
                  <p className="text-[10px] text-muted-foreground">Xem toàn bộ lịch sử thao tác của các thành viên khác để kiểm soát bảo mật hệ thống.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentPermissions.logs}
                  disabled={activeRole.isLocked || loading}
                  onChange={(e) => handleCheckboxChange("logs", e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-border pt-4 mt-6 flex justify-between items-center">
            <div>
              {!activeRole.isLocked && activeRole.roleId !== "user" && activeRole.roleId !== "admin" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDeleteRole}
                  className="h-8 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/20 text-xs font-semibold cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={12} /> Xóa vai trò
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeRole.isLocked || loading}
                onClick={handleSavePermissions}
                className="h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                Lưu quyền hạn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border select-none">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-primary" />
                Thêm vai trò mới
              </h3>
              <button
                onClick={() => setIsAddRoleOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddRoleSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tên vai trò mới</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="VD: Nhân viên hỗ trợ"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Mô tả vai trò mới</label>
                <textarea
                  disabled={loading}
                  placeholder="Mô tả tóm tắt trách nhiệm của vai trò này"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full h-20 p-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none disabled:opacity-50"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 select-none">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsAddRoleOpen(false)}
                  className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Thêm vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
