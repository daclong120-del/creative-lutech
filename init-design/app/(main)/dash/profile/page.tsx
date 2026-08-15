"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DropdownSelect from "@/components/DropdownSelect";

interface ApiToken {
  id: string;
  name: string;
  value: string;
  created: string;
  lastUsed: string;
  permissions: string;
}

function ProfilePageContent() {
  const { activeAccount } = useAccount();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"Profile" | "API Tokens">("Profile");

  // Keep state in sync with URL search parameter
  React.useEffect(() => {
    if (tabParam === "API Tokens" || tabParam === "Tokens") {
      setActiveTab("API Tokens");
    } else {
      setActiveTab("Profile");
    }
  }, [tabParam]);

  const handleTabChange = (tabName: "Profile" | "API Tokens") => {
    setActiveTab(tabName);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabName === "API Tokens" ? "Tokens" : "Profile");
      window.history.pushState(null, "", url.pathname + url.search);
    }
  };

  // Profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(activeAccount);
  const [profileEmail, setProfileEmail] = useState(`${activeAccount}@cloudflare.com`);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  // Sync profile settings with active account switcher
  React.useEffect(() => {
    setProfileName(activeAccount);
    setProfileEmail(`${activeAccount}@cloudflare.com`);
  }, [activeAccount]);

  const accountId = "cfacc_a1b2c3d4e5f6";

  // API Tokens states
  const [tokens, setTokens] = useState<ApiToken[]>([
    {
      id: "tok_1",
      name: "Default Read Token",
      value: "cf_e68c92a95c478a2e2d93e1b7c8f49b5b",
      created: "2026-06-15",
      lastUsed: "2 hours ago",
      permissions: "All zones (Read)",
    },
  ]);

  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenPerm, setNewTokenPerm] = useState("Read");

  const copyToClipboard = (text: string, type: "id" | "token", tokenId?: string) => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === "token" && tokenId) {
      setCopiedTokenId(tokenId);
      setTimeout(() => setCopiedTokenId(null), 2000);
    }
  };

  const handleEditProfile = () => {
    setTempName(profileName);
    setTempEmail(profileEmail);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) setProfileName(tempName);
    if (tempEmail.trim()) setProfileEmail(tempEmail);
    setIsEditingProfile(false);
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    // Generate random 32-char hex string
    const hex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    const newToken: ApiToken = {
      id: `tok_${Date.now()}`,
      name: newTokenName,
      value: `cf_${hex}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      permissions: `All zones (${newTokenPerm})`,
    };

    setTokens([newToken, ...tokens]);
    setNewTokenName("");
    setIsCreateTokenOpen(false);
  };

  const handleRevokeToken = (id: string) => {
    if (confirm("Are you sure you want to revoke this API token? Any applications using this token will fail to authenticate.")) {
      setTokens(tokens.filter((tok) => tok.id !== id));
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">My Profile</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4 select-none">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your personal profile settings, configurations, and API authorization tokens.
        </p>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-border text-sm font-semibold select-none">
        {(["Profile", "API Tokens"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2.5 -mb-px border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab Panel */}
      {activeTab === "Profile" && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-border/40 pb-5 select-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cloudflare-orange to-amber-500 text-white font-black text-lg shadow-inner">
                {profileName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{profileName}</h3>
                <p className="text-xs text-muted-foreground">User account administrator</p>
              </div>
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground" htmlFor="edit-name">
                      Full Name
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground" htmlFor="edit-email">
                      Email address
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end pt-2 select-none">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block select-none">Full Name</span>
                    <span className="font-semibold text-foreground">{profileName}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block select-none">Email address</span>
                    <span className="font-semibold text-foreground">{profileEmail}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block select-none">Language</span>
                    <span className="font-semibold text-foreground">English (US)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block select-none">2-Factor Authentication</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Enabled
                    </span>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-muted-foreground block select-none">Account ID</span>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted/60 border border-border rounded font-mono text-[11px] text-foreground select-all">
                        {accountId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(accountId, "id")}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative"
                        title="Copy Account ID"
                        aria-label="Copy Account ID"
                      >
                        {copiedId ? (
                          <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 256 256"
                            fill="currentColor"
                          >
                            <path d="M216,40V168h-48V120a16,16,0,0,0-16-16H104V40ZM152,120v96H40V120ZM168,120a16,16,0,0,0-16-16H104V88h64a16,16,0,0,1,16,16Z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 flex select-none">
                  <button
                    onClick={handleEditProfile}
                    className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Edit profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Tokens Tab Panel */}
      {activeTab === "API Tokens" && (
        <div className="space-y-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground font-semibold">Active Access Keys</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Create and manage secure API authorization tokens to automate requests to Cloudflare services.
              </p>
            </div>
            <button
              onClick={() => setIsCreateTokenOpen(true)}
              className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Create Token
            </button>
          </div>

          {/* Tokens list table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <span className="w-1/4">Token Name</span>
              <span className="w-1/3">Value / Secret</span>
              <span className="w-1/6 text-right">Created</span>
              <span className="w-1/6 text-right">Actions</span>
            </div>

            {tokens.length > 0 ? (
              <div className="divide-y divide-border/60">
                {tokens.map((tok) => (
                  <div key={tok.id} className="flex items-center justify-between p-4 text-xs">
                    {/* Name */}
                    <div className="w-1/4 font-semibold text-foreground truncate pr-3">
                      {tok.name}
                      <span className="block text-[9px] text-muted-foreground font-normal">
                        {tok.permissions}
                      </span>
                    </div>

                    {/* Value with copy */}
                    <div className="w-1/3 flex items-center gap-1.5 min-w-0">
                      <code className="font-mono text-[10px] text-muted-foreground truncate select-all">
                        {tok.value.slice(0, 8)}••••••••••••••••{tok.value.slice(-4)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tok.value, "token", tok.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative flex-shrink-0"
                        title="Copy full token"
                        aria-label="Copy token"
                      >
                        {copiedTokenId === tok.id ? (
                          <span className="text-[9px] text-emerald-500 font-bold select-none">Copied!</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 256 256"
                            fill="currentColor"
                          >
                            <path d="M216,40V168h-48V120a16,16,0,0,0-16-16H104V40ZM152,120v96H40V120ZM168,120a16,16,0,0,0-16-16H104V88h64a16,16,0,0,1,16,16Z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Created Date */}
                    <span className="w-1/6 text-right font-mono text-muted-foreground">{tok.created}</span>

                    {/* Actions */}
                    <div className="w-1/6 text-right select-none">
                      <button
                        onClick={() => handleRevokeToken(tok.id)}
                        className="text-red-500 hover:text-red-600 font-bold text-[11px] cursor-pointer hover:underline"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 select-none">
                <p className="text-sm font-medium text-foreground">No active tokens</p>
                <p className="text-xs text-muted-foreground">
                  Create an API token to allow programmatic access.
                </p>
              </div>
            )}
          </div>

          {/* Create Token Modal Dialog */}
          {isCreateTokenOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCreateTokenOpen(false)}
              />

              <form
                onSubmit={handleCreateToken}
                className="relative bg-card border border-border rounded-xl max-w-sm w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-1 select-none">
                  <h2 className="text-lg font-bold text-foreground">Create API Token</h2>
                  <p className="text-xs text-muted-foreground">
                    Set properties for the new API authorization secret.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground" htmlFor="token-name-input">
                      Token identifier name
                    </label>
                    <input
                      id="token-name-input"
                      type="text"
                      placeholder="My custom token"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground" htmlFor="token-perm-select">
                      Access Permissions
                    </label>
                    <DropdownSelect
                      id="token-perm-select"
                      value={newTokenPerm}
                      onChange={(val) => setNewTokenPerm(val)}
                      options={[
                        { value: "Read", label: "Zone Read Only" },
                        { value: "Read & Write", label: "Zone Edit (Read & Write)" },
                      ]}
                      buttonClassName="h-9 border-border bg-background"
                      fullWidth
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 select-none pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateTokenOpen(false)}
                    className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTokenName.trim()}
                    className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Generate Token
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
