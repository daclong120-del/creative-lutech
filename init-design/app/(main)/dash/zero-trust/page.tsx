"use client";

import Link from "next/link";

import React, { useState } from "react";
import { ZeroTrustIcon } from "@/components/icons";
import { useAccount } from "@/lib/account-context";

interface SecurityService {
  id: string;
  name: string;
  description: string;
  status: boolean; // true = Active, false = Disabled
  metrics: { label: string; value: string }[];
  details: string;
}

export default function ZeroTrustPage() {
  const { activeAccount } = useAccount();
  const [activeTab, setActiveTab] = useState("Overview");

  const [services, setServices] = useState<SecurityService[]>([
    {
      id: "srv_gateway",
      name: "Gateway",
      description: "Secure and filter outbound internet traffic at DNS and HTTP layers.",
      status: true,
      metrics: [
        { label: "Active Policies", value: "4" },
        { label: "Queries Blocked (24h)", value: "1,204" },
      ],
      details: "Enforces DNS content filtering and malware blocking for connected devices.",
    },
    {
      id: "srv_access",
      name: "Access",
      description: "B2B security policies to authenticate users before connecting to internal tools.",
      status: true,
      metrics: [
        { label: "Secured Apps", value: "2" },
        { label: "Active Sessions", value: "12" },
      ],
      details: "Secures internal web endpoints behind single-sign-on integration layers.",
    },
    {
      id: "srv_tunnels",
      name: "Tunnels",
      description: "Secure ingress tunnels connecting your local services directly to Cloudflare.",
      status: true,
      metrics: [
        { label: "Tunnels Online", value: "1" },
        { label: "Tunnel Name", value: "k8s-cluster-tunnel" },
      ],
      details: "Exposes private services without open public firewall ports.",
    },
  ]);

  const [usersInfo] = useState({
    totalUsers: 8,
    activeSessions: 3,
  });

  // Gateway Policies State
  const [gatewayTab, setGatewayTab] = useState<"DNS" | "HTTP" | "Network">("DNS");
  const [gatewayRules, setGatewayRules] = useState([
    { id: "rule_1", name: "Malware & Security Blocks", type: "DNS", category: "Security (Malware, Phishing, Spam)", action: "Block", status: true },
    { id: "rule_2", name: "Block Unwanted Media", type: "DNS", category: "Media (Pornography, Gambling)", action: "Block", status: true },
    { id: "rule_3", name: "Bypass Developer Tools", type: "HTTP", category: "Developer (GitHub, NPM)", action: "Allow", status: false },
    { id: "rule_4", name: "Block Cryptomining", type: "DNS", category: "Security (Cryptomining)", action: "Block", status: true },
  ]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("Security (Phishing)");
  const [newRuleType, setNewRuleType] = useState<"DNS" | "HTTP" | "Network">("DNS");
  const [newRuleAction, setNewRuleAction] = useState<"Block" | "Allow">("Block");

  // Access Applications State
  const [accessApps, setAccessApps] = useState([
    { id: "app_1", name: "Grafana Portal", domain: "grafana.corp.cloudflareaccess.com", providers: ["Google", "GitHub"], status: "Active" },
    { id: "app_2", name: "Internal Wiki", domain: "wiki.corp.cloudflareaccess.com", providers: ["Okta"], status: "Bypassed" },
    { id: "app_3", name: "K8s Dashboard", domain: "k8s.corp.cloudflareaccess.com", providers: ["Google"], status: "Active" },
  ]);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppSubdomain, setNewAppSubdomain] = useState("");
  const [newAppStatus, setNewAppStatus] = useState<"Active" | "Bypassed">("Active");

  // Tunnels State
  const [tunnels, setTunnels] = useState([
    { id: "tun_1", name: "k8s-cluster-tunnel", status: "Active", uuid: "tunnel-8f9d-82a1-b3b4", connectors: 2, uptime: "12 days" },
    { id: "tun_2", name: "dev-local-tunnel", status: "Inactive", uuid: "tunnel-12e4-98bc-a4f1", connectors: 0, uptime: "--" },
  ]);
  const [isCreatingTunnel, setIsCreatingTunnel] = useState(false);
  const [newTunnelName, setNewTunnelName] = useState("");

  // Settings State
  const [accessDomainText, setAccessDomainText] = useState("");
  const [isDomainSaved, setIsDomainSaved] = useState(false);
  const [providers, setProviders] = useState([
    { name: "Google", connected: true },
    { name: "GitHub", connected: true },
    { name: "Okta", connected: false },
    { name: "OneLogin", connected: false },
  ]);

  const domainName = accessDomainText || `${activeAccount}.cloudflareaccess.com`;

  // Initialize domain text
  React.useEffect(() => {
    if (activeAccount && !accessDomainText) {
      setAccessDomainText(`${activeAccount}.cloudflareaccess.com`);
    }
  }, [activeAccount, accessDomainText]);

  const toggleService = (id: string) => {
    setServices(
      services.map((srv) => (srv.id === id ? { ...srv, status: !srv.status } : srv))
    );
  };

  const toggleRule = (id: string) => {
    setGatewayRules(
      gatewayRules.map((rule) => (rule.id === id ? { ...rule, status: !rule.status } : rule))
    );
  };

  const deleteRule = (id: string) => {
    setGatewayRules(gatewayRules.filter((rule) => rule.id !== id));
  };

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    const newRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName,
      type: newRuleType,
      category: newRuleCategory,
      action: newRuleAction,
      status: true,
    };
    setGatewayRules([newRule, ...gatewayRules]);
    setNewRuleName("");
    setIsAddingRule(false);
  };

  const toggleAppStatus = (id: string) => {
    setAccessApps(
      accessApps.map((app) =>
        app.id === id
          ? { ...app, status: app.status === "Active" ? "Bypassed" : "Active" }
          : app
      )
    );
  };

  const addApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const subdomain = newAppSubdomain.trim() || newAppName.toLowerCase().replace(/\s+/g, "-");
    const newApp = {
      id: `app_${Date.now()}`,
      name: newAppName,
      domain: `${subdomain}.corp.cloudflareaccess.com`,
      providers: ["Google"],
      status: newAppStatus,
    };
    setAccessApps([newApp, ...accessApps]);
    setNewAppName("");
    setNewAppSubdomain("");
    setIsAddingApp(false);
  };

  const createTunnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTunnelName.trim()) return;
    const hex = Math.random().toString(16).substring(2, 6);
    const newTun = {
      id: `tun_${Date.now()}`,
      name: newTunnelName.toLowerCase().replace(/\s+/g, "-"),
      status: "Active",
      uuid: `tunnel-${hex}-82a1-b3b4`,
      connectors: 1,
      uptime: "Just now",
    };
    setTunnels([newTun, ...tunnels]);
    setNewTunnelName("");
    setIsCreatingTunnel(false);
  };

  const toggleProvider = (name: string) => {
    setProviders(
      providers.map((p) => (p.name === name ? { ...p, connected: !p.connected } : p))
    );
  };

  const navItems = [
    { name: "Overview", count: null },
    { name: "Gateway Policies", count: gatewayRules.length },
    { name: "Access Applications", count: accessApps.length },
    { name: "Tunnels Connection", count: tunnels.filter(t => t.status === "Active").length },
    { name: "Zero Trust Settings", count: null },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Zero Trust</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ZeroTrustIcon size={24} className="text-blue-500" />
            Zero Trust Overview
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Access domain: <span className="underline">{domainName}</span>
          </p>
        </div>
        <button
          onClick={() => setActiveTab("Gateway Policies")}
          className="flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          Set up policies
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar (Sub-navigation) */}
        <aside className="w-full md:w-60 shrink-0 space-y-1 select-none">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === item.name
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{item.name}</span>
              {item.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === item.name
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 w-full space-y-6">
          {activeTab === "Overview" && (
            <>
              {/* Top Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                <div className="rounded-xl border border-border bg-card p-4 space-y-1 shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
                  <p className="text-2xl font-black text-foreground">{usersInfo.totalUsers}</p>
                  <p className="text-[10px] text-muted-foreground">Authorized access seats</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-1 shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Sessions</span>
                  <p className="text-2xl font-black text-foreground">{usersInfo.activeSessions}</p>
                  <p className="text-[10px] text-emerald-500 font-semibold">Active now</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-1 shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Security State</span>
                  <p className="text-2xl font-black text-blue-500">Secure</p>
                  <p className="text-[10px] text-muted-foreground">Gateway & Access protecting</p>
                </div>
              </div>

              {/* Security Services Grid */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground select-none">Secure Services Status</h2>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className={`rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between transition-all duration-300 ${
                        srv.status ? "opacity-100 border-border" : "opacity-60 bg-muted/20 border-border/60"
                      }`}
                    >
                      {/* Top Row: Name and Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 select-none">
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            {srv.name}
                            <span className={`h-2 w-2 rounded-full ${
                              srv.status ? "bg-emerald-500" : "bg-muted-foreground"
                            }`} />
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            srv.status ? "text-emerald-500" : "text-muted-foreground"
                          }`}>
                            {srv.status ? "Active" : "Disabled"}
                          </span>
                        </div>

                        {/* Interactive toggle switch */}
                        <button
                          onClick={() => toggleService(srv.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            srv.status ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-800"
                          }`}
                          aria-label={`Toggle ${srv.name}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              srv.status ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-normal select-none">
                        {srv.description}
                      </p>

                      {/* Custom Info Box for the service */}
                      <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2 select-none">
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          {srv.details}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30">
                          {srv.metrics.map((met) => (
                            <div key={met.label}>
                              <span className="text-[9px] text-muted-foreground block truncate">
                                {met.label}
                              </span>
                              <span className="text-xs font-bold text-foreground font-mono">
                                {srv.status ? met.value : "--"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "Gateway Policies" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Gateway Policies</h2>
                  <p className="text-xs text-muted-foreground">
                    Create and manage policies to inspect and filter network traffic.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRule(true)}
                  className="flex items-center justify-center h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start"
                >
                  Add a rule
                </button>
              </div>

              {/* Add Rule Modal/Form inline */}
              {isAddingRule && (
                <form onSubmit={addRule} className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs font-bold text-foreground">New Gateway Rule</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingRule(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Rule Name</label>
                      <input
                        type="text"
                        required
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        placeholder="e.g. Block Malware Sites"
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Traffic Type</label>
                      <select
                        value={newRuleType}
                        onChange={(e) => setNewRuleType(e.target.value as "DNS" | "HTTP" | "Network")}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      >
                        <option value="DNS">DNS</option>
                        <option value="HTTP">HTTP</option>
                        <option value="Network">Network</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Category / Filter</label>
                      <input
                        type="text"
                        value={newRuleCategory}
                        onChange={(e) => setNewRuleCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Action</label>
                      <select
                        value={newRuleAction}
                        onChange={(e) => setNewRuleAction(e.target.value as "Block" | "Allow")}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      >
                        <option value="Block">Block</option>
                        <option value="Allow">Allow</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Create Rule
                  </button>
                </form>
              )}

              {/* Sub tabs inside Gateway */}
              <div className="flex border-b border-border gap-4 text-xs font-semibold">
                {(["DNS", "HTTP", "Network"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGatewayTab(tab)}
                    className={`pb-2 border-b-2 transition-all cursor-pointer ${
                      gatewayTab === tab ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab} Rules
                  </button>
                ))}
              </div>

              {/* Gateway Rules List */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase">
                        <th className="p-3">Rule Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Action</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {gatewayRules.filter(r => r.type === gatewayTab).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No active {gatewayTab} rules.
                          </td>
                        </tr>
                      ) : (
                        gatewayRules
                          .filter((rule) => rule.type === gatewayTab)
                          .map((rule) => (
                            <tr key={rule.id} className="hover:bg-muted/10">
                              <td className="p-3 font-semibold text-foreground">{rule.name}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px]">{rule.type}</span></td>
                              <td className="p-3 text-muted-foreground">{rule.category}</td>
                              <td className="p-3">
                                <span className={`font-semibold ${rule.action === "Block" ? "text-red-500" : "text-emerald-500"}`}>
                                  {rule.action}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => toggleRule(rule.id)}
                                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      rule.status ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-800"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        rule.status ? "translate-x-3" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => deleteRule(rule.id)}
                                  className="text-[10px] text-red-500 hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Access Applications" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Access Applications</h2>
                  <p className="text-xs text-muted-foreground">
                    Secure private applications with zero-trust policies, SSO, and device posture.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingApp(true)}
                  className="flex items-center justify-center h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start"
                >
                  Add Application
                </button>
              </div>

              {/* Add Application Form */}
              {isAddingApp && (
                <form onSubmit={addApp} className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs font-bold text-foreground">New Access Application</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingApp(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Application Name</label>
                      <input
                        type="text"
                        required
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        placeholder="e.g. Grafana Portal"
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Subdomain</label>
                      <input
                        type="text"
                        value={newAppSubdomain}
                        onChange={(e) => setNewAppSubdomain(e.target.value)}
                        placeholder="e.g. grafana"
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Status</label>
                      <select
                        value={newAppStatus}
                        onChange={(e) => setNewAppStatus(e.target.value as "Active" | "Bypassed")}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Bypassed">Bypassed</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              {/* Apps List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {accessApps.map((app) => (
                  <div key={app.id} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 select-none">
                        <h3 className="text-sm font-bold text-foreground">{app.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-none">{app.domain}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        app.status === "Active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground mr-1">SSO:</span>
                        {app.providers.map(prov => (
                          <span key={prov} className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[9px] font-mono">{prov}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => toggleAppStatus(app.id)}
                        className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                      >
                        Toggle Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Tunnels Connection" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Cloudflare Tunnels</h2>
                  <p className="text-xs text-muted-foreground">
                    Connect applications, servers, or databases to Cloudflare without opening public ports.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingTunnel(true)}
                  className="flex items-center justify-center h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start"
                >
                  Create a tunnel
                </button>
              </div>

              {/* Create Tunnel Modal */}
              {isCreatingTunnel && (
                <form onSubmit={createTunnel} className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs font-bold text-foreground">Create Cloudflare Tunnel</h3>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTunnel(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Tunnel Name</label>
                    <input
                      type="text"
                      required
                      value={newTunnelName}
                      onChange={(e) => setNewTunnelName(e.target.value)}
                      placeholder="e.g. prod-api-tunnel"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Provision Tunnel
                  </button>
                </form>
              )}

              {/* Tunnels Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase">
                        <th className="p-3">Tunnel Name</th>
                        <th className="p-3">ID / UUID</th>
                        <th className="p-3">Connectors</th>
                        <th className="p-3">Uptime</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tunnels.map((tun) => (
                        <tr key={tun.id} className="hover:bg-muted/10">
                          <td className="p-3 font-semibold text-foreground">{tun.name}</td>
                          <td className="p-3 font-mono text-muted-foreground text-[10px]">{tun.uuid}</td>
                          <td className="p-3 text-foreground font-mono">{tun.connectors}</td>
                          <td className="p-3 text-muted-foreground">{tun.uptime}</td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              tun.status === "Active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-600"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                tun.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                              }`} />
                              {tun.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Zero Trust Settings" && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold text-foreground">Zero Trust Settings</h2>
                <p className="text-xs text-muted-foreground">
                  Manage login methods, access domain, and global account-wide controls.
                </p>
              </div>

              {/* Access Domain Config */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Access Organization Domain</h3>
                  <p className="text-xs text-muted-foreground">The custom URL your users will visit to authenticate.</p>
                </div>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={accessDomainText}
                    onChange={(e) => {
                      setAccessDomainText(e.target.value);
                      setIsDomainSaved(false);
                    }}
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setIsDomainSaved(true)}
                    className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    {isDomainSaved ? "Saved" : "Save"}
                  </button>
                </div>
                {isDomainSaved && (
                  <p className="text-[10px] text-emerald-500 font-semibold">Access domain updated successfully.</p>
                )}
              </div>

              {/* Identity Providers Config */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">SSO Identity Providers</h3>
                  <p className="text-xs text-muted-foreground">Manage authentication methods for user access enrollment.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {providers.map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                      <button
                        onClick={() => toggleProvider(p.name)}
                        className={`h-7 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          p.connected
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        {p.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
