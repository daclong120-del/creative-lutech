"use client";

import { useAccount } from "@/lib/account-context";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";

interface SupportCase {
  id: string;
  subject: string;
  category: string;
  status: "Open" | "Awaiting reply" | "Resolved";
  lastUpdated: string;
  description: string;
  createdAt: string;
  replies?: Array<{
    id: string;
    sender: "user" | "support";
    text: string;
    createdAt: string;
  }>;
}

const defaultCases: SupportCase[] = [
  {
    id: "#829103",
    subject: "DNS query timeout on secondary nameservers",
    category: "DNS",
    status: "Open",
    lastUpdated: "2 hours ago",
    description: "We are observing intermittent DNS query timeouts on our secondary nameservers (ns2.cloudflare.com) for our zone domain.com. Please investigate if there is any ongoing route leakage or DDoS attack targeting this edge location.",
    createdAt: "2026-07-02T08:00:00.000Z",
    replies: [
      {
        id: "r1",
        sender: "user",
        text: "We are observing intermittent DNS query timeouts on our secondary nameservers (ns2.cloudflare.com) for our zone domain.com. Please investigate if there is any ongoing route leakage or DDoS attack targeting this edge location.",
        createdAt: "2026-07-02T08:00:00.000Z"
      }
    ]
  },
  {
    id: "#802913",
    subject: "Unable to deploy Worker with ES Modules format",
    category: "Workers",
    status: "Awaiting reply",
    lastUpdated: "1 day ago",
    description: "When deploying our wrangler project using ES modules format, we receive the error: 'Unexpected token export'. The wrangler version is 3.55.0. Need help verifying the package.json config.",
    createdAt: "2026-07-01T10:00:00.000Z",
    replies: [
      {
        id: "r2",
        sender: "user",
        text: "When deploying our wrangler project using ES modules format, we receive the error: 'Unexpected token export'. The wrangler version is 3.55.0. Need help verifying the package.json config.",
        createdAt: "2026-07-01T10:00:00.000Z"
      },
      {
        id: "r3",
        sender: "support",
        text: "Hello! This error typically occurs when your project is missing the 'type': 'module' declaration in package.json, or if wrangler is not configured to bundle ES modules. Could you please share your wrangler.toml configuration file and your package.json?",
        createdAt: "2026-07-01T14:30:00.000Z"
      }
    ]
  },
  {
    id: "#817290",
    subject: "Pro Plan monthly invoice discrepancy",
    category: "Billing",
    status: "Resolved",
    lastUpdated: "2 days ago",
    description: "Our invoice was charged twice this month for the Pro subscription ($20 x 2). Please refund the extra charge back to our payment method.",
    createdAt: "2026-06-30T09:00:00.000Z",
    replies: [
      {
        id: "r4",
        sender: "user",
        text: "Our invoice was charged twice this month for the Pro subscription ($20 x 2). Please refund the extra charge back to our payment method.",
        createdAt: "2026-06-30T09:00:00.000Z"
      },
      {
        id: "r5",
        sender: "support",
        text: "I have processed the refund for the duplicate charge. It should appear back on your credit card within 5-10 business days. I will close this case now, feel free to reply if you need any other billing assistance.",
        createdAt: "2026-06-30T16:00:00.000Z"
      }
    ]
  }
];

export default function MyCases() {
  const { activeAccount } = useAccount();
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Open" | "Awaiting reply" | "Resolved">("All");
  const [replyText, setReplyText] = useState("");

  // Load cases from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cloudflare_cases");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTimeout(() => setCases(parsed), 0);
      } catch {
        setTimeout(() => setCases(defaultCases), 0);
        localStorage.setItem("cloudflare_cases", JSON.stringify(defaultCases));
      }
    } else {
      setTimeout(() => setCases(defaultCases), 0);
      localStorage.setItem("cloudflare_cases", JSON.stringify(defaultCases));
    }
  }, []);

  // Filter cases based on search and active tab
  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "All" || item.status === activeTab;

    return matchesSearch && matchesTab;
  });

  // Handle sending a mock reply to a ticket
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedCase) return;

    const newReply = {
      id: Math.random().toString(36).substr(2, 9),
      sender: "user" as const,
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    // Update case list and change status to Open (since user replied)
    const updatedCases = cases.map((c) => {
      if (c.id === selectedCase.id) {
        const updatedReplies = [...(c.replies || []), newReply];
        return {
          ...c,
          status: "Open" as const,
          lastUpdated: "Just now",
          replies: updatedReplies,
        };
      }
      return c;
    });

    setCases(updatedCases);
    localStorage.setItem("cloudflare_cases", JSON.stringify(updatedCases));

    // Update active detailed view
    const foundCase = updatedCases.find((c) => c.id === selectedCase.id);
    if (foundCase) {
      setSelectedCase(foundCase);
    }
    setReplyText("");
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-6 w-full text-left select-none relative">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Link href="/" className="hover:text-foreground transition-colors">
          {activeAccount}
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-foreground transition-colors">
          Support
        </Link>
        <span>/</span>
        <span className="text-foreground">My cases</span>
      </div>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            My cases
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your open tickets and history with Cloudflare support team.
          </p>
        </div>

        <Link
          href="/support/submit"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/95 focus-visible:outline-none"
        >
          Submit a case
        </Link>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex border-b border-border text-xs font-medium">
        {(["All", "Open", "Awaiting reply", "Resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 border-b-2 -mb-px transition-colors duration-150 ${
              activeTab === tab
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-semibold">
              {tab === "All"
                ? cases.length
                : cases.filter((c) => c.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search and filter action bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by case ID or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border bg-card rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-150"
          />
        </div>

        <div className="flex items-center gap-2 border border-border bg-card px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-muted/50 transition-colors">
          <span>Sort by: Last Updated</span>
          <ChevronDownIcon size={12} className="text-muted-foreground" />
        </div>
      </div>

      {/* Cases Table Grid */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="p-4 w-[120px]">Case ID</th>
                <th className="p-4">Subject</th>
                <th className="p-4 w-[120px]">Category</th>
                <th className="p-4 w-[150px]">Status</th>
                <th className="p-4 w-[150px] text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-8 text-muted-foreground/50"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h3.75M9 15h3.375c.9 0 1.625-.724 1.625-1.618V13.5c0-.9-.725-1.618-1.625-1.618H9m11.536 2.88a9.075 9.075 0 0 1-3.203 3.577m-3.79-16.066C14.28 2.584 15.63 2.25 17.18 2.25c1.47 0 2.87.234 4.18.665a.5.5 0 0 1 .316.592c-.394 1.5-.785 3.033-1.127 4.587A9.01 9.01 0 0 0 16.5 6.75c-1.39 0-2.7.316-3.87.88a9.054 9.054 0 0 0-4.086 4.086c-.563 1.17-.88 2.48-.88 3.87 0 1.096.196 2.148.555 3.127-.342.34-.7.662-1.077.962a.498.498 0 0 1-.692-.057c-1.1-1.168-1.95-2.584-2.502-4.148a.499.499 0 0 1 .306-.615c1.41-.456 2.878-.813 4.385-1.074"
                        />
                      </svg>
                      <span className="font-semibold text-foreground">No cases found</span>
                      <p className="text-[11px]">We couldn&apos;t find any cases matching your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="p-4 font-semibold text-foreground select-text">{c.id}</td>
                    <td className="p-4 font-medium text-foreground group-hover:text-primary transition-colors max-w-[300px] sm:max-w-md truncate">
                      {c.subject}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-semibold">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.status === "Open"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : c.status === "Awaiting reply"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === "Open"
                              ? "bg-blue-500"
                              : c.status === "Awaiting reply"
                              ? "bg-amber-500"
                              : "bg-muted-foreground"
                          }`}
                        />
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground font-medium">{c.lastUpdated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Drawer (Slide-over Panel) */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedCase(null)} />

          {/* Panel content */}
          <div className="relative w-full max-w-lg md:max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-bold tracking-wider uppercase select-text">
                    Case {selectedCase.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedCase.status === "Open"
                        ? "bg-blue-500/10 text-blue-500"
                        : selectedCase.status === "Awaiting reply"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selectedCase.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-tight truncate max-w-[340px] md:max-w-md">
                  {selectedCase.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {/* Initial details panel */}
              <div className="border border-border bg-card rounded-lg p-3 text-xs space-y-2 shadow-xs">
                <div className="flex justify-between border-b border-border pb-2 text-[11px] text-muted-foreground font-medium">
                  <div>
                    Category: <span className="font-bold text-foreground">{selectedCase.category}</span>
                  </div>
                  <div>
                    Created: <span className="font-bold text-foreground">{new Date(selectedCase.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap select-text">
                  {selectedCase.description}
                </p>
              </div>

              {/* Chat Thread */}
              {selectedCase.replies && selectedCase.replies.length > 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">
                      Activity Thread
                    </span>
                  </div>
                  {selectedCase.replies.slice(1).map((reply) => (
                    <div
                      key={reply.id}
                      className={`flex flex-col max-w-[85%] space-y-1 ${
                        reply.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                        <span>{reply.sender === "user" ? "You" : "Cloudflare Support"}</span>
                        <span>•</span>
                        <span>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`rounded-xl px-3 py-2 text-xs leading-relaxed select-text shadow-xs ${
                          reply.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Input Form */}
            {selectedCase.status !== "Resolved" ? (
              <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-card space-y-2">
                <textarea
                  placeholder="Type your message to support..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-2 border border-border bg-background rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                  rows={3}
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Solve the case immediately in the simulation!
                      const updated = cases.map((c) =>
                        c.id === selectedCase.id
                          ? { ...c, status: "Resolved" as const, lastUpdated: "Just now" }
                          : c
                      );
                      setCases(updated);
                      localStorage.setItem("cloudflare_cases", JSON.stringify(updated));
                      setSelectedCase({ ...selectedCase, status: "Resolved" as const });
                    }}
                    className="h-8 items-center justify-center rounded-lg border border-border px-3 text-[11px] font-medium hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    type="submit"
                    className="h-8 items-center justify-center rounded-lg bg-primary px-4 text-[11px] font-semibold text-primary-foreground hover:bg-primary/95 shadow transition-colors"
                  >
                    Send reply
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-border bg-muted/10 text-center text-xs text-muted-foreground font-medium">
                This case has been resolved and closed. If you still need help, please{" "}
                <button
                  onClick={() => {
                    const updated = cases.map((c) =>
                      c.id === selectedCase.id
                        ? { ...c, status: "Open" as const, lastUpdated: "Just now" }
                        : c
                    );
                    setCases(updated);
                    localStorage.setItem("cloudflare_cases", JSON.stringify(updated));
                    setSelectedCase({ ...selectedCase, status: "Open" as const });
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  reopen the case
                </button>
                .
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
