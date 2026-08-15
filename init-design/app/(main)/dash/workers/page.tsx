"use client";

import Link from "next/link";

import { useAccount } from "@/lib/account-context";

import React, { useState } from "react";
import { SearchIcon, ComputeIcon } from "@/components/icons";

interface WorkerApp {
  id: string;
  name: string;
  status: "Active" | "Deploying" | "Error";
  routes: string[];
  requests24h: string;
  cpuMedian: string;
  lastUpdated: string;
}

export default function WorkersPage() {
  const { activeAccount } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [deployModal, setDeployModal] = useState<{
    isOpen: boolean;
    name: string;
    description: string;
    code: string;
  } | null>(null);

  const [newWorkerName, setNewWorkerName] = useState("");

  const [workers, setWorkers] = useState<WorkerApp[]>([
    {
      id: "w_1",
      name: "auth-service-worker",
      status: "Active",
      routes: ["auth-api.cloudflare-emulation.com/*"],
      requests24h: "1.2M",
      cpuMedian: "8.4ms",
      lastUpdated: "2 hours ago",
    },
    {
      id: "w_2",
      name: "image-optimizer-router",
      status: "Active",
      routes: ["images.cloudflare-emulation.com/*"],
      requests24h: "450K",
      cpuMedian: "12.1ms",
      lastUpdated: "1 day ago",
    },
    {
      id: "w_3",
      name: "analytics-aggregator",
      status: "Active",
      routes: ["analytics.cloudflare-emulation.com/*"],
      requests24h: "2.8M",
      cpuMedian: "5.2ms",
      lastUpdated: "3 days ago",
    },
  ]);

  const templates = [
    {
      name: "Hello World",
      description: "A basic HTTP handler that returns a JSON response greeting the visitor.",
      code: `export default {
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({
      message: "Hello World from Cloudflare Worker!"
    }), {
      headers: { "content-type": "application/json" }
    });
  }
};`,
    },
    {
      name: "HTTP Router",
      description: "Routes requests to different handlers depending on URL path matching patterns.",
      code: `export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/users") {
      return new Response("Users endpoint");
    }
    if (url.pathname === "/api/status") {
      return new Response("All systems operational");
    }
    return new Response("Route not found", { status: 404 });
  }
};`,
    },
    {
      name: "Scheduled Trigger",
      description: "Executes custom code periodically based on cron triggers/schedule settings.",
      code: `export default {
  async scheduled(event, env, ctx) {
    console.log("Scheduled task started at: " + event.scheduledTime);
    // Perform recurring operations, e.g. sync databases or clear caches
  }
};`,
    },
  ];

  const handleDeploy = () => {
    if (!newWorkerName.trim()) return;

    const newWorker: WorkerApp = {
      id: `w_${Date.now()}`,
      name: newWorkerName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      status: "Active",
      routes: [`${newWorkerName.toLowerCase()}.cloudflare-emulation.com/*`],
      requests24h: "0",
      cpuMedian: "0.0ms",
      lastUpdated: "Just now",
    };

    setWorkers([newWorker, ...workers]);
    setDeployModal(null);
    setNewWorkerName("");
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Workers & Pages</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ComputeIcon size={24} className="text-cloudflare-orange" />
            Workers & Pages
          </h1>
          <p className="text-xs text-muted-foreground">
            Build and deploy serverless functions, routers, and full-stack applications to the Cloudflare global network.
          </p>
        </div>
        <button
          onClick={() =>
            setDeployModal({
              isOpen: true,
              name: "custom-worker",
              description: "Create a new custom worker app to process edge traffic.",
              code: `export default {\n  async fetch(request, env, ctx) {\n    return new Response("Hello from your new worker!");\n  }\n};`,
            })
          }
          className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          Create application
        </button>
      </div>

      {/* Metrics Graphs Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Request Graph Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metrics</span>
              <h3 className="text-sm font-bold text-foreground">Total Requests</h3>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-foreground">4.45M</p>
              <p className="text-[10px] text-emerald-500 font-semibold">+12.4% last 24h</p>
            </div>
          </div>

          {/* SVG line chart */}
          <div className="h-32 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-requests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cloudflare-orange, #f6821f)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-cloudflare-orange, #f6821f)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-border/30" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" className="text-border/30" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="currentColor" className="text-border/30" strokeDasharray="4 4" />

              {/* Chart Line Path */}
              <path
                d="M 0 95 Q 50 80 100 88 T 200 50 T 300 70 T 400 35 T 500 20"
                fill="none"
                stroke="var(--color-cloudflare-orange, #f6821f)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Gradient Area under line */}
              <path
                d="M 0 95 Q 50 80 100 88 T 200 50 T 300 70 T 400 35 T 500 20 L 500 120 L 0 120 Z"
                fill="url(#gradient-requests)"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-muted-foreground pt-1 border-t border-border/40">
              <span>08:00 AM</span>
              <span>02:00 PM</span>
              <span>08:00 PM</span>
              <span>02:00 AM</span>
              <span>08:00 AM</span>
            </div>
          </div>
        </div>

        {/* CPU Graph Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Performance</span>
              <h3 className="text-sm font-bold text-foreground">Median CPU Time</h3>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-foreground">7.1ms</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Max 21.3ms (99th pct)</p>
            </div>
          </div>

          {/* SVG line chart */}
          <div className="h-32 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-cpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-border/30" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" className="text-border/30" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="currentColor" className="text-border/30" strokeDasharray="4 4" />

              {/* Chart Line Path */}
              <path
                d="M 0 60 Q 50 65 100 50 T 200 75 T 300 45 T 400 38 T 500 40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Gradient Area under line */}
              <path
                d="M 0 60 Q 50 65 100 50 T 200 75 T 300 45 T 400 38 T 500 40 L 500 120 L 0 120 Z"
                fill="url(#gradient-cpu)"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-muted-foreground pt-1 border-t border-border/40">
              <span>08:00 AM</span>
              <span>02:00 PM</span>
              <span>08:00 PM</span>
              <span>02:00 AM</span>
              <span>08:00 AM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Workers List */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <h2 className="text-base font-bold text-foreground">Active Services</h2>
            <div className="relative flex items-center rounded-lg border border-border bg-card px-3 h-9 w-64 shadow-sm hover:border-muted-foreground/30 focus-within:border-primary transition-colors">
              <SearchIcon size={14} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <span className="w-1/3">Worker Name</span>
              <span className="w-1/4 hidden sm:block">Status / Routes</span>
              <span className="w-1/6 text-right">24h Requests</span>
              <span className="w-1/6 text-right">Median CPU</span>
            </div>

            {filteredWorkers.length > 0 ? (
              <div className="divide-y divide-border/60">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
                  >
                    {/* Worker basic info */}
                    <div className="w-1/3 flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/20 text-cloudflare-orange shrink-0">
                        <ComputeIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-foreground block truncate">
                          {worker.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Updated {worker.lastUpdated}
                        </span>
                      </div>
                    </div>

                    {/* Status & Routes */}
                    <div className="w-1/4 hidden sm:flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-foreground font-semibold">{worker.status}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                        {worker.routes[0]}
                      </span>
                    </div>

                    {/* Request metric */}
                    <div className="w-1/6 text-right font-semibold text-foreground">
                      {worker.requests24h}
                    </div>

                    {/* CPU metric */}
                    <div className="w-1/6 text-right font-mono text-muted-foreground">
                      {worker.cpuMedian}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 select-none">
                <p className="text-sm font-medium text-foreground">No services found</p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your filters or deploy a new template.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Templates Gallery */}
        <div className="w-full lg:w-[360px] space-y-4 select-none">
          <h2 className="text-base font-bold text-foreground px-1">Templates</h2>

          <div className="grid grid-cols-1 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.name}
                className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/40 transition-colors shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-foreground">{tpl.name}</h3>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setDeployModal({
                      isOpen: true,
                      name: tpl.name.toLowerCase().replace(/\s+/g, "-") + "-app",
                      description: tpl.description,
                      code: tpl.code,
                    })
                  }
                  className="w-full flex items-center justify-center h-8 rounded-lg border border-border hover:bg-muted text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Deploy template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deploy Dialog Modal */}
      {deployModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDeployModal(null)}
          />

          <div className="relative bg-card border border-border rounded-xl max-w-lg w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="space-y-1.5 select-none shrink-0">
              <h2 className="text-lg font-bold text-foreground">
                Deploy application template
              </h2>
              <p className="text-xs text-muted-foreground">
                Give your worker service a unique identifier to initialize configuration.
              </p>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="worker-name-input">
                  Worker application name
                </label>
                <input
                  id="worker-name-input"
                  type="text"
                  placeholder="my-serverless-service"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Code viewer panel */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                  Script Code (Read Only)
                </span>
                <div className="rounded-lg bg-muted/60 border border-border p-3 font-mono text-[10px] text-foreground overflow-x-auto whitespace-pre leading-relaxed select-text">
                  {deployModal.code}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0 select-none">
              <button
                onClick={() => setDeployModal(null)}
                className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={!newWorkerName.trim()}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
