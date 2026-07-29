"use client";

import React, { useState } from "react";
import { Users, Key, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MembersTable } from "./members-table";
import { ApiTokensPanel } from "./api-tokens-panel";
import { RolesPanel } from "./roles-panel";
import { InviteMemberModal } from "./invite-member-modal";
import { MemberItem, RoleItem, ApiTokenItem } from "@/lib/services/member.service";

interface MembersClientProps {
  initialMembers: MemberItem[];
  initialRoles: RoleItem[];
  initialTokens: ApiTokenItem[];
}

export function MembersClient({ initialMembers, initialRoles, initialTokens }: MembersClientProps) {
  const [activeTab, setActiveTab] = useState<"members" | "tokens" | "roles">("members");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  // Toast notifications
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "info" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200 relative">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg bg-card text-foreground animate-in slide-in-from-top-4 duration-300 border-primary/20">
          <div className={cn("h-2 w-2 rounded-full animate-ping", notification.type === "success" ? "bg-emerald-500" : "bg-amber-500")} />
          <p className="text-xs font-semibold">{notification.message}</p>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))} 
            className="ml-2 hover:bg-muted p-0.5 rounded text-muted-foreground hover:text-foreground font-semibold"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border pb-4 select-none">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Quản lý thành viên
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Quản lý phân quyền truy cập của đội ngũ vận hành hệ thống crawler và các khóa cấu hình API.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-border pb-px text-sm font-semibold select-none">
        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "px-4 py-2 border-b-2 -mb-[2px] transition-colors cursor-pointer flex items-center gap-1.5",
            activeTab === "members"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users size={14} />
          Thành viên hệ thống
        </button>
        <button
          onClick={() => setActiveTab("tokens")}
          className={cn(
            "px-4 py-2 border-b-2 -mb-[2px] transition-colors cursor-pointer flex items-center gap-1.5",
            activeTab === "tokens"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Key size={14} />
          Khóa truy cập API
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={cn(
            "px-4 py-2 border-b-2 -mb-[2px] transition-colors cursor-pointer flex items-center gap-1.5",
            activeTab === "roles"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldCheck size={14} />
          Vai trò & Quyền hạn
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === "members" && (
        <MembersTable 
          members={initialMembers} 
          roles={initialRoles} 
          showToast={showToast} 
          onInviteClick={() => setIsInviteOpen(true)} 
        />
      )}

      {activeTab === "tokens" && (
        <ApiTokensPanel 
          tokens={initialTokens} 
          roles={initialRoles} 
          showToast={showToast} 
        />
      )}

      {activeTab === "roles" && (
        <RolesPanel 
          roles={initialRoles} 
          showToast={showToast} 
        />
      )}

      {/* MODALS */}
      <InviteMemberModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        roles={initialRoles} 
        showToast={showToast} 
      />
    </div>
  );
}
