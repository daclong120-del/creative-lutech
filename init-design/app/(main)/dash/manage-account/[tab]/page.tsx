"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import {
  Search,
  Plus,
  Users,
  Settings2,
  Lock,
  Shield,
  MoreHorizontal,
  Check,
  Settings,
  ArrowUpDown,
  X,
  Info,
  Globe,
  Sliders,
  FileText,
  Activity,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberItem {
  name: string;
  email: string;
  role: string;
  status: "Active" | "Pending";
  isSuperAdmin?: boolean;
}

interface GroupItem {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  createdDate: string;
}

interface BillingItem {
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Failed";
}

export default function ManageAccountPage() {
  const params = useParams();
  const { activeAccount } = useAccount();
  const currentTab = (params?.tab as string) || "members";

  const activeEmail = activeAccount.includes("@") ? activeAccount : `${activeAccount}@gmail.com`;

  // Invited/custom members state
  const [invitedMembers, setInvitedMembers] = useState<MemberItem[]>([
    { name: "Security Auditor", email: "auditor@cloudflare.com", role: "Read Only Administrator", status: "Active", isSuperAdmin: false },
    { name: "Dev Engineer", email: "engineer@cloudflare.com", role: "Developer", status: "Pending", isSuperAdmin: false }
  ]);

  // Compute total members list (with current active account as Super Admin at index 0)
  const members: MemberItem[] = [
    { name: "Super Admin", email: activeEmail, role: "Super Administrator", status: "Active", isSuperAdmin: true },
    ...invitedMembers
  ];

  // Sub-tabs for Members
  const [memberSubTab, setMemberSubTab] = useState<"all" | "groups" | "settings">("all");

  // Filter/Search states
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Administrator");

  // Groups state
  const [groups, setGroups] = useState<GroupItem[]>([
    { id: "g1", name: "Developers", description: "Read/write access to Cloudflare Workers and static assets", membersCount: 2, createdDate: "2026-03-12" },
    { id: "g2", name: "Security Admins", description: "Full control over WAF rules, DNS, and IP access policies", membersCount: 1, createdDate: "2026-04-18" }
  ]);

  // Create Group Modal State
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // Settings states
  const [require2FA, setRequire2FA] = useState(false);
  const [sessionDuration, setSessionDuration] = useState("24h");
  const [ssoConfigured, setSsoConfigured] = useState(false);

  // Billing states
  const [billingHistory, setBillingHistory] = useState<BillingItem[]>([
    { date: "2026-06-15", description: "Subscription Plan - Free", amount: "$0.00", status: "Paid" },
    { date: "2026-05-15", description: "Subscription Plan - Free", amount: "$0.00", status: "Paid" },
    { date: "2026-04-15", description: "Subscription Plan - Free", amount: "$0.00", status: "Paid" }
  ]);
  const [isUpgraded, setIsUpgraded] = useState(false);

  // Custom Notifications
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

  // Handlers
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    if (members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      showToast("A member with this email already exists.", "info");
      return;
    }

    const newMember: MemberItem = {
      name: inviteRole === "Super Administrator" ? "Super Admin" : "Team Member",
      email: inviteEmail,
      role: inviteRole,
      status: "Pending",
      isSuperAdmin: inviteRole === "Super Administrator"
    };

    setInvitedMembers([...invitedMembers, newMember]);
    setInviteEmail("");
    setIsInviteOpen(false);
    showToast(`Successfully sent invitation to ${inviteEmail}`);
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const newGroup: GroupItem = {
      id: `g-${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc || "No description provided",
      membersCount: 0,
      createdDate: new Date().toISOString().split("T")[0]
    };

    setGroups([...groups, newGroup]);
    setNewGroupName("");
    setNewGroupDesc("");
    setIsCreateGroupOpen(false);
    showToast(`Group "${newGroupName}" has been successfully created`);
  };

  const handleRevokeMember = (email: string) => {
    if (email === activeEmail) {
      showToast("You cannot revoke access for your own active account.", "info");
      return;
    }
    setInvitedMembers(invitedMembers.filter(m => m.email !== email));
    showToast(`Access revoked for ${email}`);
  };

  const handleUpgradePlan = () => {
    setIsUpgraded(true);
    setBillingHistory([
      { date: new Date().toISOString().split("T")[0], description: "Subscription Plan - Pro (Upgraded)", amount: "$20.00", status: "Paid" },
      ...billingHistory
    ]);
    showToast("Successfully upgraded to Pro Plan! Premium features are now active.");
  };

  // Filter members list based on query
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
                          m.role.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesRole = roleFilter === "All roles" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Breadcrumbs helper
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "members": return "Members";
      case "billing": return "Billing";
      case "tokens": return "Account API tokens";
      case "oauth": return "OAuth clients";
      case "audit": return "Audit logs";
      case "notifications": return "Notifications";
      case "shared-config": return "Shared config";
      case "blocked": return "Blocked content";
      case "abuse": return "Abuse reports";
      case "carbon": return "Carbon Impact Report";
      case "configurations": return "Configurations";
      case "tagged-resources": return "Tagged Resources";
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200 relative">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg bg-card text-foreground animate-in slide-in-from-top-4 duration-300 border-primary/20">
          <div className="h-2 w-2 rounded-full bg-cloudflare-orange animate-ping" />
          <p className="text-xs font-semibold">{notification.message}</p>
          <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-2 hover:bg-muted p-0.5 rounded text-muted-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">
          {activeAccount}
        </Link>
        <span>/</span>
        <span className="text-muted-foreground flex items-center gap-1">
          Manage Account <Settings size={12} className="inline text-muted-foreground/60" />
        </span>
        <span>/</span>
        <span className="text-foreground font-semibold">{getTabTitle(currentTab)}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4 select-none">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {getTabTitle(currentTab)}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {currentTab === "members" && "Manage organization team members, assign custom roles, organize them into teams, and customize authentication rules."}
          {currentTab === "billing" && "View your subscription plans, invoice history, payment card methods, and simulate service tier upgrades."}
          {currentTab === "tokens" && "Generate API access keys and tokens to authorize automated API clients to configure your cloud infrastructures."}
          {currentTab === "oauth" && "Register, configure, and monitor external OAuth applications granted access to your Cloudflare account resources."}
          {currentTab === "audit" && "Track organization activity with absolute records of login trials, rule changes, zone configurations, and administrative shifts."}
          {currentTab === "notifications" && "Configure alert rules to deliver webhooks, emails, and pager notifications on traffic spikes or configuration shifts."}
          {currentTab === "shared-config" && "Share common configurations, custom SSL/TLS certificates, or WAF custom rule templates across sub-accounts."}
          {currentTab === "blocked" && "Manage domains, CIDR IP blocks, or user agents blacklisted from accessing dashboard configuration scopes."}
          {currentTab === "abuse" && "File abuse reports, manage incoming complaints, and check compliance actions relating to hosted platform content."}
          {currentTab === "carbon" && "Analyze your cloud computing footprint and review real-time estimations of savings by using Cloudflare's green datacenters."}
          {currentTab === "configurations" && "Review account-wide configuration sets, default rules, cache control presets, and global defaults."}
          {currentTab === "tagged-resources" && "Organize resources by mapping keys and tags to your zones, workers, and storage blocks for structured billing."}
        </p>
      </div>

      {/* RENDER MEMBERS TAB */}
      {currentTab === "members" && (
        <div className="space-y-6">
          {/* Sub-tabs Pills */}
          <div className="flex gap-2 border-b border-border pb-px text-sm font-semibold select-none">
            <button
              onClick={() => setMemberSubTab("all")}
              className={cn(
                "px-4 py-2 border-b-2 -mb-[2px] transition-all cursor-pointer",
                memberSubTab === "all"
                  ? "border-cloudflare-orange text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              All members
            </button>
            <button
              onClick={() => setMemberSubTab("groups")}
              className={cn(
                "px-4 py-2 border-b-2 -mb-[2px] transition-all cursor-pointer",
                memberSubTab === "groups"
                  ? "border-cloudflare-orange text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Groups
            </button>
            <button
              onClick={() => setMemberSubTab("settings")}
              className={cn(
                "px-4 py-2 border-b-2 -mb-[2px] transition-all cursor-pointer",
                memberSubTab === "settings"
                  ? "border-cloudflare-orange text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Settings
            </button>
          </div>

          {/* Sub-tab Panels */}
          {memberSubTab === "all" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 h-9">
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search by email..."
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="All roles">All roles</option>
                    <option value="Super Administrator">Super Admin</option>
                    <option value="Read Only Administrator">Read Only Admin</option>
                    <option value="Developer">Developer</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex h-9 items-center justify-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Invite members
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                  <span className="w-1/3 flex items-center gap-1">Name <ArrowUpDown size={10} /></span>
                  <span className="w-1/12 text-center">Super admin</span>
                  <span className="w-1/12 text-center">Groups</span>
                  <span className="w-1/6 text-center">API access</span>
                  <span className="w-1/12 text-center">2FA</span>
                  <span className="w-1/12 text-center">Status</span>
                  <span className="w-1/12 text-right">Actions</span>
                </div>

                <div className="divide-y divide-border/60">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 text-xs hover:bg-muted/10 transition-colors">
                        <div className="w-1/3 pr-3">
                          <p className="font-semibold text-foreground truncate">{member.email}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
                        </div>
                        <div className="w-1/12 flex justify-center text-center">
                          {member.isSuperAdmin ? (
                            <Check size={14} className="text-emerald-500 font-bold" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        <div className="w-1/12 text-center text-muted-foreground">—</div>
                        <div className="w-1/6 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">Default</span>
                        </div>
                        <div className="w-1/12 text-center text-muted-foreground">—</div>
                        <div className="w-1/12 flex justify-center text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                            member.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", member.status === "Active" ? "bg-emerald-500" : "bg-amber-500")} />
                            {member.status}
                          </span>
                        </div>
                        <div className="w-1/12 text-right flex justify-end">
                          <div className="relative group/action">
                            <button className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                              <MoreHorizontal size={14} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 z-30 hidden group-hover/action:block bg-card border border-border shadow-lg rounded-lg p-1 w-28 text-left animate-in fade-in duration-100">
                              <button
                                onClick={() => showToast(`Editing roles for ${member.email} (simulated)`)}
                                className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted text-foreground cursor-pointer font-medium"
                              >
                                Edit roles
                              </button>
                              <button
                                onClick={() => handleRevokeMember(member.email)}
                                className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 cursor-pointer font-medium"
                              >
                                Revoke access
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground select-none">
                      No members match your search query.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {memberSubTab === "groups" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-4 border border-border rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Organize members into groups</p>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Groups allow you to group multiple members together and assign them access permissions as a single entity.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="flex h-9 items-center justify-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} /> Create group
                </button>
              </div>

              {/* Groups Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                  <span className="w-1/3">Group Name</span>
                  <span className="w-5/12">Description</span>
                  <span className="w-1/12 text-center">Members</span>
                  <span className="w-1/12 text-right">Actions</span>
                </div>

                <div className="divide-y divide-border/60">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-4 text-xs hover:bg-muted/10 transition-colors">
                      <div className="w-1/3">
                        <p className="font-semibold text-foreground">{group.name}</p>
                        <p className="text-[10px] text-muted-foreground">Created on {group.createdDate}</p>
                      </div>
                      <span className="w-5/12 text-muted-foreground truncate pr-4">{group.description}</span>
                      <div className="w-1/12 text-center font-semibold text-foreground">{group.membersCount}</div>
                      <div className="w-1/12 text-right">
                        <button
                          onClick={() => showToast(`Managing group "${group.name}" settings (simulated)`)}
                          className="text-primary hover:underline font-semibold cursor-pointer text-xs"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {memberSubTab === "settings" && (
            <div className="max-w-3xl space-y-6">
              {/* 2FA Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-start justify-between select-none">
                  <div className="space-y-1 pr-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Lock size={15} className="text-cloudflare-orange" /> Require 2-Factor Authentication
                    </h3>
                    <p className="text-xs text-muted-foreground leading-normal">
                      When enabled, all members must configure and verify with two-factor authentication (TOTP or security keys) before access is permitted to this dashboard.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRequire2FA(!require2FA);
                      showToast(`2FA organization enforcement turned ${!require2FA ? "ON" : "OFF"}`);
                    }}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      require2FA ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                        require2FA ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* SSO SAML Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-start justify-between select-none">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Shield size={15} className="text-primary" /> Single Sign-On (SSO / SAML)
                    </h3>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Federate identity providers (e.g. Okta, Entra ID, Google Workspace) to manage organization login credentials centrally.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSsoConfigured(!ssoConfigured);
                      showToast(ssoConfigured ? "SSO SAML link disconnected" : "SAML Okta Provider linked successfully");
                    }}
                    className={cn(
                      "h-8 px-3 rounded-lg border text-xs font-semibold shadow-sm transition-colors cursor-pointer",
                      ssoConfigured
                        ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                        : "border-border hover:bg-muted text-foreground"
                    )}
                  >
                    {ssoConfigured ? "Disconnect SAML" : "Configure SSO"}
                  </button>
                </div>

                {ssoConfigured && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg max-w-md animate-in fade-in duration-200">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">SAML Authentication Active</p>
                      <p className="text-[10px] text-muted-foreground">Provider: Okta SSO | Redirects enforced.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Session Duration Selector */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between select-none">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Settings2 size={15} className="text-muted-foreground" /> Member Session Duration
                    </h3>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Set maximum idle session timeouts after which users are automatically logged out.
                    </p>
                  </div>
                  <select
                    value={sessionDuration}
                    onChange={(e) => {
                      setSessionDuration(e.target.value);
                      showToast(`Session limit updated to ${e.target.value}`);
                    }}
                    className="h-8 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="8h">8 hours</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER BILLING TAB */}
      {currentTab === "billing" && (
        <div className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2 select-none">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all",
                  isUpgraded ? "bg-cloudflare-orange/10 text-cloudflare-orange" : "bg-primary/10 text-primary"
                )}>
                  {isUpgraded ? "Pro Plan" : "Free Plan"}
                </span>
                <h3 className="text-sm font-bold text-foreground">Current Subscription</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  {isUpgraded 
                    ? "You are currently subscribed to Cloudflare Pro. Enjoy enhanced security analytics, advanced Web Application Firewall rules, and priority DNS routing."
                    : "You are currently using the Cloudflare Free Plan. Features include basic DDoS defense, global CDN caching, and one active website profile mapping."
                  }
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-between items-center select-none mt-4">
                <span className="text-sm font-bold text-foreground">{isUpgraded ? "$20.00 / month" : "$0.00 / month"}</span>
                {!isUpgraded ? (
                  <button
                    onClick={handleUpgradePlan}
                    className="h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Upgrade
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <Check size={14} /> Enforced Active
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2 select-none">
                <h3 className="text-sm font-bold text-foreground">Payment Method</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Your monthly invoice subscription charges are processed through the card on file.
                </p>

                <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-lg max-w-xs mt-2">
                  <div className="flex h-7 w-10 items-center justify-center rounded bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-white tracking-widest uppercase select-none">
                    Visa
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Visa ending in 4242</p>
                    <p className="text-[10px] text-muted-foreground">Expires 12/2028</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end select-none mt-4">
                <button
                  onClick={() => showToast("Payment configuration changes (Visa/Mastercard) are simulated.")}
                  className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                >
                  Update method
                </button>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground select-none">Billing History</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                <span className="w-1/4">Invoice Date</span>
                <span className="w-1/3">Description</span>
                <span className="w-1/6 text-right">Amount</span>
                <span className="w-1/6 text-right">Status</span>
              </div>
              <div className="divide-y divide-border/60">
                {billingHistory.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 text-xs hover:bg-muted/10 transition-colors">
                    <span className="w-1/4 text-muted-foreground font-mono">{bill.date}</span>
                    <span className="w-1/3 font-semibold text-foreground">{bill.description}</span>
                    <span className="w-1/6 text-right font-mono text-foreground font-semibold">{bill.amount}</span>
                    <div className="w-1/6 text-right font-semibold">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOCK SUB-TABS RENDER */}
      {currentTab !== "members" && currentTab !== "billing" && (
        <div className="space-y-6 max-w-4xl">
          <div className="border border-border/80 rounded-xl bg-card p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {currentTab === "tokens" && <Lock size={22} />}
              {currentTab === "oauth" && <UserCheck size={22} />}
              {currentTab === "audit" && <FileText size={22} />}
              {currentTab === "notifications" && <Activity size={22} />}
              {currentTab === "shared-config" && <Globe size={22} />}
              {currentTab === "blocked" && <Shield size={22} />}
              {currentTab === "abuse" && <Info size={22} />}
              {currentTab === "carbon" && <Globe size={22} />}
              {currentTab === "configurations" && <Sliders size={22} />}
              {currentTab === "tagged-resources" && <Users size={22} />}
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-base font-bold text-foreground">Interactive Simulator Active</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                This dashboard console controls mock services. Changes in configuration variables, rulesets, and records will update here instantly.
              </p>
            </div>

            <button
              onClick={() => showToast(`Action triggers simulation for tab: ${getTabTitle(currentTab)}`)}
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Configure simulation settings
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border select-none">
              <h3 className="text-sm font-bold text-foreground">Invite members</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. member@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Assign Account Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Super Administrator">Super Administrator (Full Access)</option>
                  <option value="Developer">Developer (Workers, Assets)</option>
                  <option value="Read Only Administrator">Read Only Admin</option>
                </select>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Administrator role grants access to modify specific zones. Super Administrator grants complete root workspace access.
                </p>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Send invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border select-none">
              <h3 className="text-sm font-bold text-foreground">Create member group</h3>
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateGroupSubmit} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workers Developers"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  placeholder="Group access policies details..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Create group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
