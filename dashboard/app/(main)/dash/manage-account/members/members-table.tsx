"use client";

import React, { useState } from "react";
import { Search, Plus, MoreHorizontal, ShieldCheck, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { updateMemberRoleAction, revokeMemberAction } from "@/lib/actions/member.actions";
import { MemberItem, RoleItem } from "@/lib/services/member.service";

interface MembersTableProps {
  members: MemberItem[];
  roles: RoleItem[];
  showToast: (msg: string, type?: "success" | "info") => void;
  onInviteClick: () => void;
}

export function MembersTable({ members, roles, showToast, onInviteClick }: MembersTableProps) {
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Role Modal State
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [editingRole, setEditingRole] = useState<string>("user");
  const [editLoading, setEditLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);

  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setEditLoading(true);
    const res = await updateMemberRoleAction(editingMember.id, editingRole);
    setEditLoading(false);

    if (res.error) {
      showToast(res.error, "info");
    } else {
      const targetRoleName = roles.find(r => r.roleId === editingRole)?.roleName || editingRole;
      showToast(`Đã cập nhật vai trò của ${editingMember.email} thành ${targetRoleName}`, "success");
      setEditingMember(null);
    }
  };

  const handleRevokeMember = async (member: MemberItem) => {
    if (confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của ${member.email}?`)) {
      setRevokeLoading(member.id);
      const res = await revokeMemberAction(member.id.includes("@") ? member.email : member.id);
      setRevokeLoading(null);

      if (res.error) {
        showToast(res.error, "info");
      } else {
        showToast(`Đã thu hồi quyền truy cập của ${member.email}`, "success");
      }
    }
  };

  const filteredMembers = (members || []).filter(m => {
    if (!m) return false;
    const email = m.email || "";
    const role = m.role || "";
    const matchesSearch = email.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
                          role.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesRole = roleFilter === "All roles" || m.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center select-none">
        <div className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 h-9">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={memberSearchQuery}
            onChange={(e) => setMemberSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo email..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "All roles", label: "Tất cả vai trò" },
              ...roles.map(r => ({ value: r.roleId, label: r.roleName }))
            ]}
          />
          <button
            onClick={onInviteClick}
            className="flex h-9 items-center justify-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} /> Mời thành viên
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 rounded-t-xl flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
          <span className="w-1/2">Email / Người dùng</span>
          <span className="w-1/4">Vai trò</span>
          <span className="w-1/6 text-center">Trạng thái</span>
          <span className="w-12 text-right"></span>
        </div>

        <div className="divide-y divide-border/60">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 text-xs hover:bg-muted/10 transition-colors">
                <div className="w-1/2 pr-3">
                  <p className="font-semibold text-foreground truncate">{member.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{member.name}</p>
                </div>
                <div className="w-1/4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium border",
                    member.isSuperAdmin
                      ? "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  )}>
                    {member.role}
                  </span>
                </div>
                <div className="w-1/6 flex justify-center text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    member.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    <span className={cn("h-1 w-1 rounded-full", member.status === "Active" ? "bg-emerald-500" : "bg-amber-500")} />
                    {member.status}
                  </span>
                </div>
                <div className="w-12 text-right flex justify-end">
                  {!member.isSuperAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                        disabled={revokeLoading === member.id}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {revokeLoading === member.id ? (
                          <span className="h-3.5 w-3.5 block rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                        ) : (
                          <MoreHorizontal size={14} />
                        )}
                      </button>
                      
                      {activeMenuId === member.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-30 bg-card border border-border shadow-lg rounded-lg p-1 w-32 text-left animate-in fade-in duration-100">
                            {member.status === "Active" && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingMember(member);
                                  setEditingRole(member.roleId);
                                }}
                                className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted text-foreground cursor-pointer font-medium"
                              >
                                Sửa vai trò
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleRevokeMember(member);
                              }}
                              className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 cursor-pointer font-medium flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Thu hồi quyền
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground select-none">
              Không có thành viên nào khớp với tìm kiếm.
            </div>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border select-none">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-primary" />
                Thay đổi vai trò thành viên
              </h3>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditRoleSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Địa chỉ Email</label>
                <input
                  type="email"
                  disabled
                  value={editingMember.email}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground focus:outline-none opacity-80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Chọn Vai trò mới</label>
                <DropdownSelect
                  value={editingRole}
                  onChange={setEditingRole}
                  options={roles.map(r => ({ value: r.roleId, label: r.roleName }))}
                  fullWidth
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 select-none">
                <button
                  type="button"
                  disabled={editLoading}
                  onClick={() => setEditingMember(null)}
                  className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editLoading && <span className="h-3 w-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
