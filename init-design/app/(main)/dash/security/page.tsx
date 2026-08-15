"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppSecurityIcon } from "@/components/icons";

// --- Types ---
interface WafRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface AttackLog {
  id: string;
  time: string;
  ip: string;
  country: string;
  countryCode: string;
  rule: string;
  action: "Block" | "Challenge" | "Log";
}

interface TurnstileWidget {
  id: string;
  name: string;
  domain: string;
  sitekey: string;
  secret: string;
  status: "Active" | "Testing" | "Suspended";
  solveRate: string;
  challenges: number;
}

// --- SUB-VIEW: WAF & DDoS Simulator ---
function WafView() {
  const [analyzedCount, setAnalyzedCount] = useState(128452);
  const [blockedCount, setBlockedCount] = useState(3124);
  const [isSimulating, setIsSimulating] = useState(false);
  const [trafficData, setTrafficData] = useState<number[]>([
    12, 15, 14, 18, 16, 12, 15, 19, 13, 14, 16, 15, 18, 14, 12, 15, 17, 14, 13, 15
  ]);
  const [rules, setRules] = useState<WafRule[]>([
    { id: "sqli", name: "SQL Injection Protection (SQLi)", description: "Detects and blocks malicious SQL syntax patterns inside query strings and request bodies.", enabled: true },
    { id: "xss", name: "Cross-Site Scripting Mitigation (XSS)", description: "Filters script tag injections, HTML payload manipulation, and javascript: scheme URIs.", enabled: true },
    { id: "cred", name: "Credential Stuffing Shield", description: "Checks authentication endpoints against databases of known compromised credentials.", enabled: true },
    { id: "bot", name: "Malicious User-Agent Filtering", description: "Identifies and restricts access for headless scrapers, spam bots, and command line client headers.", enabled: true },
    { id: "rate", name: "API Endpoint Rate Limiting", description: "Restricts clients exceeding threshold capacity of 100 requests/minute per source IP.", enabled: true }
  ]);
  const [logs, setLogs] = useState<AttackLog[]>([
    { id: "1", time: "10:45:12", ip: "198.51.100.42", country: "United States", countryCode: "🇺🇸", rule: "XSS Injection Prevented", action: "Block" },
    { id: "2", time: "10:41:05", ip: "203.0.113.88", country: "China", countryCode: "🇨🇳", rule: "API Endpoint Rate Limiting", action: "Challenge" },
    { id: "3", time: "10:38:59", ip: "45.234.12.91", country: "Vietnam", countryCode: "🇻🇳", rule: "SQL Injection Protection", action: "Block" },
    { id: "4", time: "10:30:14", ip: "185.220.101.4", country: "Germany", countryCode: "🇩🇪", rule: "Malicious User-Agent Filtering", action: "Block" },
    { id: "5", time: "10:24:45", ip: "89.207.132.18", country: "Russia", countryCode: "🇷🇺", rule: "SQL Injection Protection", action: "Block" }
  ]);

  const wafStatus = rules.some((r) => r.enabled) ? "Active" : "Bypass";

  const toggleRule = (id: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setAnalyzedCount((prev) => prev + Math.floor(Math.random() * 250) + 150);
        setBlockedCount((prev) => prev + Math.floor(Math.random() * 80) + 40);
      }, 500);
    } else {
      interval = setInterval(() => {
        setAnalyzedCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
        if (Math.random() > 0.85) setBlockedCount((prev) => prev + 1);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficData((prev) => {
        let newPoint = 0;
        if (isSimulating) {
          newPoint = Math.floor(Math.random() * 18) + 80;
        } else {
          newPoint = Math.floor(Math.random() * 12) + 10;
        }
        return [...prev.slice(1), newPoint];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    if (!isSimulating) return;
    const ips = ["103.22.200.45", "195.12.89.102", "45.234.12.9", "180.76.15.134", "89.207.132.88", "193.106.31.25", "77.247.110.12"];
    const countries = [
      { name: "Vietnam", flag: "🇻🇳" },
      { name: "China", flag: "🇨🇳" },
      { name: "Russia", flag: "🇷🇺" },
      { name: "United States", flag: "🇺🇸" },
      { name: "Brazil", flag: "🇧🇷" }
    ];
    const rulesList = ["SQL Injection Protection (SQLi)", "Cross-Site Scripting Mitigation (XSS)", "Malicious User-Agent Filtering", "API Endpoint Rate Limiting"];
    
    const interval = setInterval(() => {
      const randomIp = ips[Math.floor(Math.random() * ips.length)];
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      const randomRule = rulesList[Math.floor(Math.random() * rulesList.length)];
      const randomAction = Math.random() > 0.7 ? "Challenge" : "Block";
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      const newLog: AttackLog = {
        id: Date.now().toString(),
        time: timeStr,
        ip: randomIp,
        country: randomCountry.name,
        countryCode: randomCountry.flag,
        rule: randomRule,
        action: randomAction
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const width = 500;
  const height = 140;
  const points = trafficData.map((val, idx) => {
    const x = (idx / (trafficData.length - 1)) * width;
    const y = height - (val / 100) * height;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="space-y-6">
      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm relative overflow-hidden">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WAF Protection Status</span>
          <div className="flex items-center gap-2 pt-1">
            <div className={`h-2.5 w-2.5 rounded-full ${wafStatus === "Active" ? "bg-emerald-500 animate-ping" : "bg-yellow-500"}`} />
            <span className="text-2xl font-extrabold text-foreground tracking-tight">{wafStatus}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">All active security profiles are shielding web ports.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analyzed Requests (24h)</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-foreground font-mono transition-all duration-300">
              {analyzedCount.toLocaleString('en-US')}
            </span>
            {isSimulating && <span className="text-[10px] text-red-500 font-bold font-mono animate-bounce">+42K/s</span>}
          </div>
          <p className="text-[10px] text-muted-foreground">Decrypted and inspected edge sessions</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm relative overflow-hidden">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mitigated Threats</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-foreground font-mono text-red-500 transition-all duration-300">
              {blockedCount.toLocaleString('en-US')}
            </span>
            {isSimulating && <span className="text-[10px] text-red-500 font-bold font-mono">Spiking</span>}
          </div>
          <p className="text-[10px] text-muted-foreground">Blocked malicious attacks or rate limits hit</p>
        </div>
      </div>

      {/* Main Content Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground">DDoS Attack Simulator</h3>
                <p className="text-xs text-muted-foreground">Launch simulated high-traffic botnets to test firewall mitigations.</p>
              </div>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer select-none ${
                  isSimulating ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {isSimulating ? "Stop Simulation" : "Simulate DDoS Attack"}
              </button>
            </div>

            <div className="space-y-2 select-none">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                <span>Traffic Load (Requests / Second)</span>
                <span className={isSimulating ? "text-red-500 font-bold font-mono animate-pulse" : "text-emerald-500 font-bold"}>
                  {isSimulating ? "Status: Under Active Attack (45k req/s)" : "Status: Normal (80 req/s)"}
                </span>
              </div>
              <div className="relative border border-border/60 bg-muted/20 dark:bg-zinc-950/20 rounded-lg p-2 h-[160px] overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="currentColor" strokeWidth="0.5" className="text-border/40" strokeDasharray="3" />
                  <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="currentColor" strokeWidth="0.5" className="text-border/40" strokeDasharray="3" />
                  <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="currentColor" strokeWidth="0.5" className="text-border/40" strokeDasharray="3" />
                  <path d={areaD} fill={isSimulating ? "url(#attackGrad)" : "url(#normalGrad)"} className="transition-all duration-300" />
                  <path d={pathD} fill="none" stroke={isSimulating ? "#ef4444" : "#10b981"} strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-300" />
                </svg>
                <div className="absolute left-2.5 top-2.5 text-[9px] font-bold text-muted-foreground font-mono uppercase bg-card/65 px-1 rounded">50K</div>
                <div className="absolute left-2.5 bottom-2.5 text-[9px] font-bold text-muted-foreground font-mono uppercase bg-card/65 px-1 rounded">0</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground select-none">Mitigated Attack Stream</h4>
              <div className="h-[200px] border border-border bg-zinc-950 text-[11px] font-mono text-zinc-300 rounded-lg p-4 overflow-y-auto space-y-1.5 scrollbar-thin select-all">
                {isSimulating ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <span className="text-zinc-500 font-bold">[{log.time}]</span>
                      <span className="text-red-500 font-bold">[BLOCKED]</span>
                      <span className="text-zinc-400 font-medium">IP:</span>
                      <span className="text-white font-bold">{log.ip}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-zinc-400 font-medium">Geo:</span>
                      <span className="text-amber-500 font-bold">{log.countryCode} {log.country}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-zinc-400 font-medium">Rule:</span>
                      <span className="text-emerald-400 font-bold">{log.rule}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-zinc-400 font-medium">Action:</span>
                      <span className="px-1.5 py-0.2 rounded bg-red-950/60 border border-red-900/50 text-red-400 font-extrabold text-[9px]">{log.action}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500 select-none flex-col gap-2">
                    <span>Console idle. Start simulation to stream real-time events.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground select-none pb-2 border-b border-border/40">WAF Rule Profile Configuration</h3>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex gap-4 items-start justify-between border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground block">{rule.name}</span>
                    <p className="text-[11px] text-muted-foreground leading-normal">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`h-5 w-9 rounded-full transition-colors cursor-pointer border relative flex items-center shrink-0 select-none ${
                      rule.enabled ? "bg-primary border-primary justify-end" : "bg-muted border-border justify-start"
                    }`}
                  >
                    <div className="h-3.5 w-3.5 rounded-full bg-white shadow-sm border border-border/20 mx-0.5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm space-y-3 p-5">
            <h3 className="text-sm font-bold text-foreground select-none pb-1">Firewall Activity Log</h3>
            <div className="border border-border/80 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[300px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <th className="p-3">Time</th>
                    <th className="p-3">Source IP / Geo</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground select-none">{log.time}</td>
                      <td className="p-3 space-y-0.5">
                        <span className="font-semibold text-foreground block font-mono">{log.ip}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 select-none">
                          <span className="text-xs">{log.countryCode}</span>
                          {log.country}
                        </span>
                      </td>
                      <td className="p-3 text-right select-none">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Security Insights ---
function SecurityInsightsView() {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Security Level</span>
          <p className="text-2xl font-extrabold text-foreground pt-1 flex items-center gap-2">
            High <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </p>
          <p className="text-[10px] text-muted-foreground">Optimal config defenses enabled</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inspected Bots</span>
          <p className="text-2xl font-extrabold text-foreground pt-1 font-mono">24,801</p>
          <p className="text-[10px] text-muted-foreground">18% classified as automated scrapers</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Encrypted Requests</span>
          <p className="text-2xl font-extrabold text-foreground pt-1 font-mono">99.8%</p>
          <p className="text-[10px] text-muted-foreground">Enforced HTTPS-only edge traffic</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Threats Stopped</span>
          <p className="text-2xl font-extrabold text-red-500 pt-1 font-mono">14,204</p>
          <p className="text-[10px] text-muted-foreground">Over the past 7 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat breakdown card */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground">Top Security Threat Vectors</h3>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>SQL Injection (SQLi)</span>
                <span className="font-mono">42% (5,965 blocks)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-cloudflare-orange h-2 rounded-full" style={{ width: "42%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>DDoS Shield Mitigations</span>
                <span className="font-mono">28% (3,977 blocks)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "28%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Bad User-Agents & Crawlers</span>
                <span className="font-mono">20% (2,840 blocks)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: "20%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>XSS Attacks Prevented</span>
                <span className="font-mono">10% (1,422 blocks)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Threat Geo Map list */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground">Top Threat Origins</h3>
          <div className="divide-y divide-border/60">
            <div className="flex justify-between items-center py-2 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>🇺🇸</span> United States
              </span>
              <span className="font-mono text-muted-foreground">3,842 requests</span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>🇨🇳</span> China
              </span>
              <span className="font-mono text-muted-foreground">2,912 requests</span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>🇷🇺</span> Russia
              </span>
              <span className="font-mono text-muted-foreground">1,822 requests</span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>🇩🇪</span> Germany
              </span>
              <span className="font-mono text-muted-foreground">940 requests</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Infrastructure Security ---
function InfrastructureView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Origin Shield Certificate status */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Origin Protection Shield</h3>
        <p className="text-xs text-muted-foreground leading-normal">
          Cloudflare wraps your origin web server in an encrypted tunnel, making it impossible for attackers to bypass Cloudflare and scan your origin IP directly.
        </p>

        <div className="space-y-3.5 bg-muted/40 p-4 border border-border rounded-lg">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Anycast Route Shielding</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">ACTIVE & ROUTED</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Origin Cloaking status</span>
            <span className="font-bold text-foreground">IP HIDDEN</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">SSL Encryption mode</span>
            <span className="font-bold text-foreground">FULL (STRICT)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Edge Certificates Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">ACTIVE (Universal SSL)</span>
          </div>
        </div>
      </div>

      {/* Latency / Network routing optimization */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Argo Smart Routing</h3>
          <p className="text-xs text-muted-foreground leading-normal">
            Argo uses real-time network latency telemetry of over 200 million web assets to dynamically route your traffic around internet congestion.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg flex-1">
              <span className="text-2xl font-black text-primary font-mono block">32.5%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Latency reduction</span>
            </div>
            <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">99.99%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Uptime</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => alert("Argo Smart Routing configurations are simulated.")}
          className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer self-end"
        >
          Configure Routing Settings
        </button>
      </div>
    </div>
  );
}

// --- SUB-VIEW: Turnstile ---
function TurnstileView() {
  const [widgets, setWidgets] = useState<TurnstileWidget[]>([
    {
      id: "ts_1",
      name: "Customer Login Form Widget",
      domain: "cloudflare-emulation.com",
      sitekey: "0x4AAAAAAABbbbbbbbbbbbbb",
      secret: "0x4AAAAAAABbbbbbb_secret_key_12345",
      status: "Active",
      solveRate: "98.5%",
      challenges: 14205
    },
    {
      id: "ts_2",
      name: "Contact Form Feedback",
      domain: "example-project.pages.dev",
      sitekey: "0x4AAAAAAACccccccccccccc",
      secret: "0x4AAAAAAACcccc_secret_key_54321",
      status: "Active",
      solveRate: "99.1%",
      challenges: 2840
    }
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetDomain, setNewWidgetDomain] = useState("");

  const handleAddWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidgetName || !newWidgetDomain) return;

    const newWidget: TurnstileWidget = {
      id: `ts_${Date.now()}`,
      name: newWidgetName,
      domain: newWidgetDomain,
      sitekey: `0x4AAAAAAA${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      secret: `0x4AAAAAAA_secret_${Math.random().toString(36).substring(2, 10)}`,
      status: "Active",
      solveRate: "100.0%",
      challenges: 0
    };

    setWidgets([newWidget, ...widgets]);
    setNewWidgetName("");
    setNewWidgetDomain("");
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">Turnstile Widgets</h3>
          <p className="text-xs text-muted-foreground">
            Non-intrusive alternative to CAPTCHA widgets. Verify user requests without rendering traditional puzzle challenges.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Add site widget
        </button>
      </div>

      {isAddOpen && (
        <form onSubmit={handleAddWidget} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-150 max-w-xl">
          <h4 className="text-xs font-bold text-foreground">Create Turnstile Widget</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Widget Name</label>
              <input
                type="text"
                placeholder="e.g. Member Login"
                value={newWidgetName}
                onChange={(e) => setNewWidgetName(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain Match</label>
              <input
                type="text"
                placeholder="e.g. domain.com"
                value={newWidgetDomain}
                onChange={(e) => setNewWidgetDomain(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="h-8 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Generate Sitekey
            </button>
          </div>
        </form>
      )}

      {/* Widgets list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4">Widget Name</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Sitekey</th>
                <th className="py-3 px-4 text-center">Solve Rate</th>
                <th className="py-3 px-4 text-right">Challenges</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {widgets.map((widget) => (
                <tr key={widget.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{widget.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{widget.domain}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-foreground">{widget.sitekey}</td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">{widget.solveRate}</td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">{widget.challenges.toLocaleString('en-US')}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {widget.status}
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

// --- MAIN SECURITY CONTENT WRAPPER ---
function SecurityPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "insights";

  // Breadcrumb mapping based on dynamic tabs
  const tabBreadcrumbs: Record<string, string> = {
    insights: "Security Insights",
    waf: "WAF & DDoS Firewall",
    infrastructure: "Infrastructure Protection",
    turnstile: "Turnstile CAPTCHAs"
  };

  const currentBreadcrumb = tabBreadcrumbs[tab] || "Security Insights";

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AppSecurityIcon size={24} className="text-orange-500" />
            {currentBreadcrumb}
          </h1>
          <p className="text-xs text-muted-foreground">
            {tab === "insights" && "Monitor network threat volume and filter security alerts globally."}
            {tab === "waf" && "Configure WAF security rules and launch simulated DDoS stress-testing."}
            {tab === "infrastructure" && "Secure origin infrastructure interfaces using universal Anycast shields."}
            {tab === "turnstile" && "Manage privacy-preserving captchas and smart challenge verification."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            Enterprise Shield Active
          </span>
        </div>
      </div>

      {/* Tab content rendering */}
      {tab === "insights" && <SecurityInsightsView />}
      {tab === "waf" && <WafView />}
      {tab === "infrastructure" && <InfrastructureView />}
      {tab === "turnstile" && <TurnstileView />}
    </div>
  );
}

// --- DEFAULT EXPORT WITH SUSPENSE ---
export default function SecurityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SecurityPageContent />
    </Suspense>
  );
}
