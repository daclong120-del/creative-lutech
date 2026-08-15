"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface BillingItem {
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Failed";
}

interface MemberItem {
  name: string;
  email: string;
  role: string;
  status: "Active" | "Pending";
}

function SettingsPageContent() {
  const { activeAccount } = useAccount();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"Billing" | "Members">("Billing");

  // Keep state in sync with URL search parameter
  React.useEffect(() => {
    if (tabParam === "Members") {
      setActiveTab("Members");
    } else {
      setActiveTab("Billing");
    }
  }, [tabParam]);

  const handleTabChange = (tabName: "Billing" | "Members") => {
    setActiveTab(tabName);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabName);
      window.history.pushState(null, "", url.pathname + url.search);
    }
  };

  // Billing states
  const [billingHistory] = useState<BillingItem[]>([
    { date: "2026-06-15", description: "Subscription Plan - Free", amount: "$0.00", status: "Paid" },
    { date: "2026-05-15", description: "Subscription Plan - Free", amount: "$0.00", status: "Paid" },
    { date: "2026-04-15", description: "Subscription Plan - Free", amount: "$0.00", status: "Paid" },
  ]);

  // Members states
  const [members] = useState<MemberItem[]>([
    { name: "Administrator", email: activeAccount.includes("@") ? activeAccount : `${activeAccount}@gmail.com`, role: "Super Administrator", status: "Active" },
    { name: "Security Auditor", email: "auditor@cloudflare.com", role: "Read Only Administrator", status: "Active" },
    { name: "Dev Engineer", email: "engineer@cloudflare.com", role: "Developer", status: "Pending" }
  ]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Account Settings</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4 select-none">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your organization billing details, subscriptions, invoices, and configurations.
        </p>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-border text-sm font-semibold select-none">
        {(["Billing", "Members"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2.5 -mb-px border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "Billing" ? "Billing & Subscription" : "Members & Access"}
          </button>
        ))}
      </div>

      {/* Billing Tab Panel */}
      {activeTab === "Billing" && (
        <div className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2 select-none">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  Free Plan
                </span>
                <h3 className="text-sm font-bold text-foreground">Current Subscription</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  You are currently using the Cloudflare Free Plan. Features include basic DDoS defense, global CDN caching, and one active website profile mapping.
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-between items-center select-none">
                <span className="text-sm font-bold text-foreground">$0.00 / month</span>
                <button
                  onClick={() => alert("Billing upgrade flows are simulated.")}
                  className="h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2 select-none">
                <h3 className="text-sm font-bold text-foreground">Payment Method</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Your monthly invoice subscription charges are processed through the card on file.
                </p>

                {/* Card display */}
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

              <div className="pt-4 border-t border-border/40 flex justify-end select-none">
                <button
                  onClick={() => alert("Payment configuration updates are simulated.")}
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
                  <div key={index} className="flex items-center justify-between p-4 text-xs">
                    <span className="w-1/4 text-muted-foreground font-mono">{bill.date}</span>
                    <span className="w-1/3 font-semibold text-foreground">{bill.description}</span>
                    <span className="w-1/6 text-right font-mono text-foreground font-semibold">{bill.amount}</span>
                    <div className="w-1/6 text-right">
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

      {/* Members Tab Panel */}
      {activeTab === "Members" && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground font-semibold">Account Members</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Invite team members and define their access control levels.
              </p>
            </div>
            <button
              onClick={() => alert("Invite member flows are simulated.")}
              className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Invite Member
            </button>
          </div>

          {/* Members list table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <span className="w-1/3">Name & Email</span>
              <span className="w-1/3">Role</span>
              <span className="w-1/6 text-right">Status</span>
              <span className="w-1/6 text-right">Actions</span>
            </div>

            <div className="divide-y divide-border/60">
              {members.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 text-xs">
                  <div className="w-1/3 pr-3">
                    <p className="font-semibold text-foreground truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <span className="w-1/3 text-muted-foreground">{member.role}</span>
                  <div className="w-1/6 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="w-1/6 text-right select-none">
                    <button
                      onClick={() => alert("Member actions are simulated.")}
                      className="text-primary hover:underline font-semibold cursor-pointer"
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
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
