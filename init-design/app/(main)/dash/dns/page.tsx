"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import { useLanguage } from "@/lib/language-context";
import React, { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import DropdownSelect from "@/components/DropdownSelect";

// --- Types & Interfaces ---
interface DnsRecord {
  id: string;
  type: "A" | "CNAME" | "TXT" | "MX";
  name: string;
  content: string;
  ttl: string;
  proxied: boolean;
}

interface TunnelItem {
  id: string;
  name: string;
  connectorId: string;
  status: "Active" | "Inactive" | "Degraded";
  connections: number;
  created: string;
}

// Proxied cloud SVG icon component
const CloudIcon = ({ proxied, className }: { proxied: boolean; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    className={`${proxied ? "text-cloudflare-orange" : "text-muted-foreground"} ${className || ""}`}
  >
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
);

// --- SUB-VIEW: DNS Overview (Original Manager) ---
function DnsOverview() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("cloudflare-emulation.com");

  // Form State
  const [recordType, setRecordType] = useState<"A" | "CNAME" | "TXT" | "MX">("A");
  const [recordName, setRecordName] = useState("");
  const [recordContent, setRecordContent] = useState("");
  const [recordTtl, setRecordTtl] = useState("Auto");
  const [recordProxied, setRecordProxied] = useState(true);

  // Edit Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editProxied, setEditProxied] = useState(true);

  const [, startTransition] = useTransition();

  // Initial Mock Records
  const [records, setRecords] = useState<DnsRecord[]>([
    { id: "rec_1", type: "A", name: "@", content: "192.0.2.1", ttl: "Auto", proxied: true },
    { id: "rec_2", type: "A", name: "api", content: "192.0.2.25", ttl: "Auto", proxied: true },
    { id: "rec_3", type: "CNAME", name: "www", content: "example-project.pages.dev", ttl: "Auto", proxied: true },
    { id: "rec_4", type: "TXT", name: "@", content: "google-site-verification=mock-token-cloudflare-emulation-2026", ttl: "Auto", proxied: false },
    { id: "rec_5", type: "MX", name: "@", content: "mail.cloudflare-emulation.com (Priority: 10)", ttl: "Auto", proxied: false }
  ]);

  const domains = [
    "cloudflare-emulation.com",
    "example-project.pages.dev",
    "test-api-domain.net",
    "my-personal-blog.org"
  ];

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordName || !recordContent) return;

    const newRecord: DnsRecord = {
      id: `rec_${Date.now()}`,
      type: recordType,
      name: recordName === "" ? "@" : recordName,
      content: recordContent,
      ttl: recordTtl,
      proxied: recordType === "TXT" || recordType === "MX" ? false : recordProxied
    };

    setRecords([newRecord, ...records]);
    setRecordName("");
    setRecordContent("");
    setRecordTtl("Auto");
    setRecordProxied(true);
    setIsFormOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((rec) => rec.id !== id));
  };

  const startEditing = (record: DnsRecord) => {
    setEditingId(record.id);
    setEditContent(record.content);
    setEditProxied(record.proxied);
  };

  const saveEdit = (id: string) => {
    setRecords(
      records.map((rec) =>
        rec.id === id ? { ...rec, content: editContent, proxied: editProxied } : rec
      )
    );
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const filteredRecords = records.filter(
    (rec) =>
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">
              DNS Management
            </h1>
            <DropdownSelect
              value={selectedDomain}
              onChange={(val) => {
                startTransition(() => {
                  setSelectedDomain(val);
                });
              }}
              options={domains}
              buttonClassName="py-1 px-2 border-border bg-card"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Configure DNS records for routing traffic, verifying domain ownership, or setting up mail delivery.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          {isFormOpen ? "Cancel Add" : "Add record"}
        </button>
      </div>

      {/* Add Record Form Area */}
      {isFormOpen && (
        <form
          onSubmit={handleAddRecord}
          className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-150"
        >
          <h2 className="text-sm font-bold text-foreground">Add new DNS record</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</label>
              <DropdownSelect
                value={recordType}
                onChange={(val) => setRecordType(val as "A" | "CNAME" | "TXT" | "MX")}
                options={["A", "CNAME", "TXT", "MX"]}
                buttonClassName="h-9 border-border bg-background"
                fullWidth
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name (e.g. @ or www)</label>
              <input
                type="text"
                placeholder="@"
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {recordType === "A" ? "IPv4 Address" : recordType === "MX" ? "Mail Server (Content)" : "Target"}
              </label>
              <input
                type="text"
                placeholder={recordType === "A" ? "192.0.2.1" : recordType === "MX" ? "mail.example.com" : "target.example.com"}
                value={recordContent}
                onChange={(e) => setRecordContent(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TTL</label>
              <DropdownSelect
                value={recordTtl}
                onChange={(val) => setRecordTtl(val)}
                options={["Auto", "2 min", "5 min", "15 min", "1 hour"]}
                buttonClassName="h-9 border-border bg-background"
                fullWidth
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
            {recordType !== "TXT" && recordType !== "MX" ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRecordProxied(!recordProxied)}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-muted/40 transition-colors"
                  aria-label="Toggle proxy status"
                >
                  <CloudIcon proxied={recordProxied} />
                </button>
                <div className="leading-none select-none">
                  <p className="text-xs font-semibold text-foreground">
                    Proxy status: <span className={recordProxied ? "text-cloudflare-orange" : "text-muted-foreground"}>
                      {recordProxied ? "Proxied" : "DNS only"}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Accelerate performance and protect with Cloudflare proxy routing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                Proxying is not supported for TXT and MX record types.
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Save record
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search and Records Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm space-y-4 p-4">
        <div className="relative flex items-center rounded-lg border border-border bg-muted/20 px-3 h-9 max-w-xs shadow-sm hover:border-muted-foreground/30 focus-within:border-primary focus-within:bg-card transition-all">
          <SearchIcon size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search DNS records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-2 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Content</th>
                <th className="py-3 px-4">TTL</th>
                <th className="py-3 px-4">Proxy status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-border/60">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const isEditing = editingId === rec.id;
                  let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
                  if (rec.type === "A") badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
                  if (rec.type === "CNAME") badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
                  if (rec.type === "MX") badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";

                  return (
                    <tr key={rec.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-semibold text-[10px] ${badgeClass}`}>
                          {rec.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-foreground">
                        {rec.name}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-foreground max-w-[200px] md:max-w-[400px] truncate">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:border-primary"
                          />
                        ) : (
                          rec.content
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        {rec.ttl}
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          rec.type !== "TXT" && rec.type !== "MX" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditProxied(!editProxied)}
                                className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-muted/40 transition-colors"
                              >
                                <CloudIcon proxied={editProxied} />
                              </button>
                              <span className="text-[10px] font-semibold">
                                {editProxied ? "Proxied" : "DNS only"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">DNS only</span>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <CloudIcon proxied={rec.proxied} />
                            <span className="font-semibold">
                              {rec.proxied ? "Proxied" : "DNS only"}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(rec.id)}
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              Save
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                              onClick={cancelEditing}
                              className="text-[11px] font-medium text-muted-foreground hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEditing(rec)}
                              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground select-none">
                    No DNS records match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: DNS Insights ---
function DnsInsightsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total DNS Queries</span>
          <p className="text-2xl font-extrabold text-foreground pt-1 font-mono">1,245,280</p>
          <p className="text-[10px] text-muted-foreground">Over the last 24 hours</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Response Time</span>
          <p className="text-2xl font-extrabold text-foreground pt-1 font-mono">12 ms</p>
          <p className="text-[10px] text-muted-foreground">Inspected from Anycast edge</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query Success Rate</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 pt-1 font-mono">99.98%</p>
          <p className="text-[10px] text-muted-foreground">No resolution errors registered</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cached Queries Ratio</span>
          <p className="text-2xl font-extrabold text-primary pt-1 font-mono">68.2%</p>
          <p className="text-[10px] text-muted-foreground">Resolved from local edge cache</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-foreground">Query Volume Breakdown by Type</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>A (IPv4 Host Mapping)</span>
                <span className="font-mono">72% (896.6K queries)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "72%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>CNAME (Canonical Aliases)</span>
                <span className="font-mono">18% (224.1K queries)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: "18%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>TXT (Domain Verifications)</span>
                <span className="font-mono">8% (99.6K queries)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "8%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>MX (Mail Exchange Exchange)</span>
                <span className="font-mono">2% (24.9K queries)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-cloudflare-orange h-1.5 rounded-full" style={{ width: "2%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-foreground">Response Codes Metrics</h3>
          <div className="divide-y divide-border/60">
            <div className="flex justify-between py-2 text-xs">
              <span className="font-semibold text-foreground">NOERROR (Successfully Resolved)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">99.42%</span>
            </div>
            <div className="flex justify-between py-2 text-xs">
              <span className="font-semibold text-foreground">NXDOMAIN (Domain Not Found)</span>
              <span className="font-mono text-muted-foreground">0.52%</span>
            </div>
            <div className="flex justify-between py-2 text-xs">
              <span className="font-semibold text-foreground">SERVFAIL (Nameserver Error)</span>
              <span className="font-mono text-red-500">0.05%</span>
            </div>
            <div className="flex justify-between py-2 text-xs">
              <span className="font-semibold text-foreground">REFUSED (Query Rejected)</span>
              <span className="font-mono text-muted-foreground">0.01%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Argo Tunnels ---
function ArgoTunnelsView() {
  const [tunnels, setTunnels] = useState<TunnelItem[]>([
    { id: "tun_1", name: "Main Application API Gateway", connectorId: "0b12c89f-24d1-419b-b0b3-f09b2e21c3fa", status: "Active", connections: 4, created: "2026-06-20" },
    { id: "tun_2", name: "Dockerized Portainer Registry", connectorId: "8fd31a98-89c0-424f-bc14-c112e34fa980", status: "Active", connections: 2, created: "2026-06-25" },
    { id: "tun_3", name: "Staging Test Lab Client", connectorId: "cd13f890-bc4f-4221-8ff8-e4b2e88a38c2", status: "Inactive", connections: 0, created: "2026-07-01" }
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTunnelName, setNewTunnelName] = useState("");

  const handleCreateTunnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTunnelName) return;

    const newTun: TunnelItem = {
      id: `tun_${Date.now()}`,
      name: newTunnelName,
      connectorId: `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 14)}`,
      status: "Active",
      connections: 1,
      created: new Date().toISOString().split("T")[0]
    };

    setTunnels([newTun, ...tunnels]);
    setNewTunnelName("");
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">Cloudflare Tunnels (Argo Tunnel)</h3>
          <p className="text-xs text-muted-foreground">
            Connect your origin server directly to the Cloudflare network without opening public ports or configuring firewall rules.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Create a Tunnel
        </button>
      </div>

      {isCreateOpen && (
        <form onSubmit={handleCreateTunnel} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-150 max-w-md">
          <h4 className="text-xs font-bold text-foreground">Name Your Tunnel</h4>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tunnel Name</label>
            <input
              type="text"
              placeholder="e.g. production-origin-daemon"
              value={newTunnelName}
              onChange={(e) => setNewTunnelName(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-8 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Save Tunnel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4">Tunnel Name</th>
                <th className="py-3 px-4">Tunnel ID (UUID)</th>
                <th className="py-3 px-4 text-center">Active Connectors</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tunnels.map((tun) => (
                <tr key={tun.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{tun.name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{tun.connectorId}</td>
                  <td className="py-3 px-4 text-center font-bold text-foreground">{tun.connections}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono">{tun.created}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tun.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
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
  );
}

// --- SUB-VIEW: Magic WAN / Mesh ---
function MagicWANMeshView() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="space-y-1.5 select-none">
        <h3 className="text-base font-bold text-foreground">Magic WAN & Connectivity Mesh</h3>
        <p className="text-xs text-muted-foreground leading-normal">
          Create secure, fast connectivity meshes between office locations, data centers, and cloud infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="border border-border rounded-xl p-4 bg-muted/20 text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Overlay Connections</span>
          <p className="text-2xl font-black text-foreground font-mono pt-1">12 / 12</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Healthy mesh topology</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-muted/20 text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Magic Tunnels (GRE/IPsec)</span>
          <p className="text-2xl font-black text-foreground font-mono pt-1">4</p>
          <p className="text-[10px] text-muted-foreground mt-1">Direct interconnect fibers mapped</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-muted/20 text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Total Routed Volume</span>
          <p className="text-2xl font-black text-primary font-mono pt-1">1.8 TB</p>
          <p className="text-[10px] text-muted-foreground mt-1">Transferred over Anycast WAN</p>
        </div>
      </div>

      <div className="border border-border/80 rounded-lg p-5 bg-card space-y-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Simulated Mesh Connection Nodes</h4>
        <div className="space-y-3 divide-y divide-border/60">
          <div className="flex items-center justify-between pt-3 first:pt-0">
            <div>
              <span className="text-xs font-bold text-foreground">HQ Office (San Francisco)</span>
              <span className="text-[10px] text-muted-foreground block">WAN Interface: gre01.sfo (10.0.1.1)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">CONNECTED</span>
          </div>
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold text-foreground">AWS Virtual Private Cloud (us-east-1)</span>
              <span className="text-[10px] text-muted-foreground block">WAN Interface: gre02.aws (10.0.2.1)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">CONNECTED</span>
          </div>
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold text-foreground">EU Branch (London Hub)</span>
              <span className="text-[10px] text-muted-foreground block">WAN Interface: ipsec01.lhr (10.0.3.1)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">CONNECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Static Routes ---
function RoutingConfigView() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">Static Routing & virtual networks</h3>
          <p className="text-xs text-muted-foreground">Manage network level routes and static routing policies for internal Anycast prefixes.</p>
        </div>
        <button
          onClick={() => alert("Static Route configuration is simulated.")}
          className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Add Route
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <th className="p-3">CIDR Destination</th>
              <th className="p-3">Gateway Interface</th>
              <th className="p-3">Priority Metric</th>
              <th className="p-3 text-right">Route status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-mono font-bold text-foreground">10.0.0.0/16</td>
              <td className="p-3 font-mono text-muted-foreground">SF-GRE-Tunnel-01</td>
              <td className="p-3 font-mono">100</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Active</span>
              </td>
            </tr>
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-mono font-bold text-foreground">192.168.12.0/24</td>
              <td className="p-3 font-mono text-muted-foreground">AWS-IPsec-Tunnel-02</td>
              <td className="p-3 font-mono">200</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUB-VIEW: IP Address Prefixes ---
function IpAddressesView() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">IP Prefixes & BGP Routing</h3>
          <p className="text-xs text-muted-foreground">Advertise or withdraw your own BYOIP (Bring Your Own IP) subnet prefixes to Cloudflare Anycast edge.</p>
        </div>
        <button
          onClick={() => alert("BYOIP prefix registration is simulated.")}
          className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Register Prefix
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <th className="p-3">Subnet Prefix</th>
              <th className="p-3">ASN Assignment</th>
              <th className="p-3">BGP Status</th>
              <th className="p-3 text-right">Advertisement status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-mono font-bold text-foreground">203.0.113.0/24</td>
              <td className="p-3 font-mono text-muted-foreground">AS13335 (Cloudflare)</td>
              <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold select-none">ESTABLISHED</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">ADVERTISED</span>
              </td>
            </tr>
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-mono font-bold text-foreground">198.51.100.0/24</td>
              <td className="p-3 font-mono text-muted-foreground">AS13335 (Cloudflare)</td>
              <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold select-none">ESTABLISHED</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">WITHDRAWN</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Caching Configuration ---
function CachingView() {
  const [cacheLevel, setCacheLevel] = useState("Standard");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Purge Cache controls */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Purge Cache</h3>
        <p className="text-xs text-muted-foreground leading-normal">
          Clear cached files instantly from the Cloudflare edge network to force requests to fetch the newest version from your origin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => alert("Simulated: Purged everything successfully.")}
            className="flex-1 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer text-center"
          >
            Purge Everything
          </button>
          <button
            onClick={() => alert("Simulated: Purge individual URLs is not supported in this mockup.")}
            className="flex-1 h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Purge Individual Paths
          </button>
        </div>
      </div>

      {/* Cache Level selector & analytics */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Cache Level Settings</h3>
          <p className="text-xs text-muted-foreground leading-normal">
            Determine how much of your website&apos;s static contents Cloudflare will cache at the edge.
          </p>

          <div className="pt-1.5">
            <DropdownSelect
              value={cacheLevel}
              onChange={(val) => setCacheLevel(val)}
              options={["No Query String", "Ignore Query String", "Standard"]}
              buttonClassName="h-9 border-border bg-background"
              fullWidth
            />
          </div>
        </div>

        <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border text-xs select-none">
          <span className="text-muted-foreground">Global Cache Hit Ratio (24h)</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">78.4%</span>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Speed Optimization ---
function SpeedView() {
  const [brotli, setBrotli] = useState(true);
  const [rocket, setRocket] = useState(true);
  const [minifyHtml, setMinifyHtml] = useState(true);
  const [minifyCss, setMinifyCss] = useState(true);
  const [minifyJs, setMinifyJs] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* File Minification */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Auto Minify Codes</h3>
        <p className="text-xs text-muted-foreground leading-normal">
          Remove unnecessary characters (such as comments and whitespaces) from web page source code to reduce transfer size.
        </p>

        <div className="space-y-3 pt-1 select-none">
          <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={minifyHtml}
              onChange={() => setMinifyHtml(!minifyHtml)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>HTML Minification</span>
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={minifyCss}
              onChange={() => setMinifyCss(!minifyCss)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>CSS Minification</span>
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={minifyJs}
              onChange={() => setMinifyJs(!minifyJs)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>JavaScript Minification</span>
          </label>
        </div>
      </div>

      {/* Speed optimization metrics */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">Performance Optimization</h3>
          
          <div className="space-y-3.5 select-none">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Brotli Compression</span>
                <span className="text-[10px] text-muted-foreground block">Speed up page load times using Brotli compression.</span>
              </div>
              <button
                onClick={() => setBrotli(!brotli)}
                className={`h-5 w-9 rounded-full transition-colors cursor-pointer border relative flex items-center shrink-0 ${
                  brotli ? "bg-primary border-primary justify-end" : "bg-muted border-border justify-start"
                }`}
              >
                <div className="h-3.5 w-3.5 rounded-full bg-white shadow-sm border border-border/20 mx-0.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Rocket Loader™</span>
                <span className="text-[10px] text-muted-foreground block">Improve paint times for pages containing JavaScript.</span>
              </div>
              <button
                onClick={() => setRocket(!rocket)}
                className={`h-5 w-9 rounded-full transition-colors cursor-pointer border relative flex items-center shrink-0 ${
                  rocket ? "bg-primary border-primary justify-end" : "bg-muted border-border justify-start"
                }`}
              >
                <div className="h-3.5 w-3.5 rounded-full bg-white shadow-sm border border-border/20 mx-0.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-xs select-none">
          <span className="text-primary font-bold">Simulated Performance Score Boost</span>
          <span className="font-bold text-primary font-mono text-sm">+25 points</span>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Load Balancing ---
function LoadBalancingView() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">Global Load Balancer & Origin Pools</h3>
          <p className="text-xs text-muted-foreground">Distribute request traffic across multiple origin servers with active health checking.</p>
        </div>
        <button
          onClick={() => alert("Load Balancer setup is simulated.")}
          className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Create Balancer
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <th className="p-3">Origin Pool Name</th>
              <th className="p-3">Endpoint Target</th>
              <th className="p-3">Health Path Check</th>
              <th className="p-3 text-right">Pool status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-bold text-foreground">US-West-Origin-Pool</td>
              <td className="p-3 font-mono text-muted-foreground">sfo.origin-servers.net</td>
              <td className="p-3 font-mono">HTTPS: /health</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Healthy</span>
              </td>
            </tr>
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-bold text-foreground">EU-West-Backup-Pool</td>
              <td className="p-3 font-mono text-muted-foreground">ams.origin-servers.net</td>
              <td className="p-3 font-mono">HTTPS: /health</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Healthy</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUB-VIEW: URL Redirect Rules ---
function RedirectRulesView() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">URL Redirect Page Rules</h3>
          <p className="text-xs text-muted-foreground">Map request paths to new target URLs using 301 Permanent or 302 Temporary redirects.</p>
        </div>
        <button
          onClick={() => alert("URL Redirect page rule creation is simulated.")}
          className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Add Page Rule
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <th className="p-3">Source Route Match</th>
              <th className="p-3">Destination Route Target</th>
              <th className="p-3">Redirect Type</th>
              <th className="p-3 text-right">Rule status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="p-3 font-mono font-bold text-foreground">*domain.com/blog/*</td>
              <td className="p-3 font-mono text-muted-foreground">https://blog.domain.com/$2</td>
              <td className="p-3 font-semibold">301 (Permanent)</td>
              <td className="p-3 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Enabled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MAIN DNS/NETWORKING WRAPPER ---
function DnsManagerContent() {
  const { activeAccount } = useAccount();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  // Breadcrumbs title mapping
  const tabBreadcrumbs: Record<string, string> = {
    overview: "DNS Overview",
    insights: "DNS Insights & Volume",
    tunnels: "Argo Tunnels Manager",
    mesh: "Magic WAN Mesh Connectivity",
    routes: "Static Routing Settings",
    ip: "IP Prefix Allocations",
    caching: "Caching Settings",
    speed: "Speed & Brotli Minification",
    "load-balancing": "Load Balancing Origin Pools",
    redirects: "URL Page Redirect Rules"
  };

  const currentBreadcrumb = tabBreadcrumbs[tab] || "DNS Overview";

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="hover:text-foreground cursor-pointer transition-colors">Websites</span>
        <span>/</span>
        <span className="text-muted-foreground">{currentBreadcrumb}</span>
      </div>

      {/* Tab Views Rendering */}
      {tab === "overview" && <DnsOverview />}
      {tab === "insights" && <DnsInsightsView />}
      {tab === "tunnels" && <ArgoTunnelsView />}
      {tab === "mesh" && <MagicWANMeshView />}
      {tab === "routes" && <RoutingConfigView />}
      {tab === "ip" && <IpAddressesView />}
      {tab === "caching" && <CachingView />}
      {tab === "speed" && <SpeedView />}
      {tab === "load-balancing" && <LoadBalancingView />}
      {tab === "redirects" && <RedirectRulesView />}
    </div>
  );
}

// --- DEFAULT EXPORT WITH SUSPENSE ---
export default function DnsManager() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <DnsManagerContent />
    </Suspense>
  );
}
