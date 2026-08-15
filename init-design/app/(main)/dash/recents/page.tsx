"use client";

import Link from "next/link";

import { useAccount } from "@/lib/account-context";

import React, { useState } from "react";
import { SearchIcon } from "@/components/icons";
import DropdownSelect from "@/components/DropdownSelect";

interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: "Success" | "Failed";
}

export default function RecentsPage() {
  const { activeAccount } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Failed">("All");

  const auditLogs: AuditLog[] = [
    {
      id: "1",
      time: "2026-07-02 10:45:12",
      user: `${activeAccount}@cloudflare.com`,
      action: "Zone DNS Record Created",
      resource: "cloudflare-emulation.com (A -> 192.0.2.1)",
      ipAddress: "203.0.113.195",
      status: "Success",
    },
    {
      id: "2",
      time: "2026-07-02 09:12:43",
      user: `${activeAccount}@cloudflare.com`,
      action: "API Token Generated",
      resource: "Token: Edit Workers",
      ipAddress: "203.0.113.195",
      status: "Success",
    },
    {
      id: "3",
      time: "2026-07-01 18:34:02",
      user: `${activeAccount}@cloudflare.com`,
      action: "Worker Script Updated",
      resource: "my-first-worker",
      ipAddress: "198.51.100.42",
      status: "Success",
    },
    {
      id: "4",
      time: "2026-07-01 15:22:10",
      user: "backup-admin@cloudflare.com",
      action: "Zone DNS Record Deleted",
      resource: "example-project.pages.dev (CNAME)",
      ipAddress: "198.51.100.89",
      status: "Success",
    },
    {
      id: "5",
      time: "2026-07-01 11:05:55",
      user: `${activeAccount}@cloudflare.com`,
      action: "API Token Generation Failed",
      resource: "Unauthorized Request",
      ipAddress: "203.0.113.195",
      status: "Failed",
    },
    {
      id: "6",
      time: "2026-06-30 14:15:30",
      user: `${activeAccount}@cloudflare.com`,
      action: "Zero Trust Service Disabled",
      resource: "Gateway Tunnels",
      ipAddress: "203.0.113.195",
      status: "Success",
    },
    {
      id: "7",
      time: "2026-06-29 08:52:14",
      user: "billing-system@cloudflare.com",
      action: "Invoice Payment Succeeded",
      resource: "Pro Plan Subscription",
      ipAddress: "127.0.0.1",
      status: "Success",
    },
    {
      id: "8",
      time: "2026-06-28 16:40:22",
      user: "backup-admin@cloudflare.com",
      action: "Zone DNS Record Update Failed",
      resource: "test-api-domain.net (TXT)",
      ipAddress: "198.51.100.89",
      status: "Failed",
    }
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Audit Logs</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">
          Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground">
          Track configuration changes, security adjustments, and resource operations on your account.
        </p>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex items-center rounded-lg border border-border bg-card px-3 h-9 w-full sm:w-72 shadow-sm hover:border-muted-foreground/30 focus-within:border-primary transition-colors">
            <SearchIcon size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search by action, user or resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Status Dropdown */}
          <DropdownSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as "All" | "Success" | "Failed")}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Success", label: "Success" },
              { value: "Failed", label: "Failed" },
            ]}
            buttonClassName="h-9 border-border hover:border-muted-foreground/30 bg-card"
          />
        </div>

        <div className="text-[11px] text-muted-foreground font-medium select-none self-end sm:self-center">
          Showing {filteredLogs.length} of {auditLogs.length} events
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold select-none">
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold hidden md:table-cell">User</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Resource</th>
                <th className="p-4 font-semibold hidden sm:table-cell">IP Address</th>
                <th className="p-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-muted-foreground whitespace-nowrap font-medium">{log.time}</td>
                    <td className="p-4 text-foreground hidden md:table-cell max-w-[200px] truncate" title={log.user}>
                      {log.user}
                    </td>
                    <td className="p-4 text-foreground font-bold">{log.action}</td>
                    <td className="p-4 text-muted-foreground font-medium max-w-[240px] truncate" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell font-mono">{log.ipAddress}</td>
                    <td className="p-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === "Success"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No audit events match your filter criteria.
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
