"use client";

import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";

// --- Inline SVGs for Clean, Lightweight Icons ---
const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 inline ml-1 align-baseline text-blue-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0019 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const IPAddressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-zinc-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const DomainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-zinc-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
);

const UrlIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-zinc-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18M2.25 13.5l1.125-11.25A2.25 2.25 0 015.62 1.5h12.76a2.25 2.25 0 012.246 2.025l1.125 11.25m-18 0v7.5A2.25 2.25 0 004.75 22.5h14.5a2.25 2.25 0 002.25-2.25v-7.5" />
  </svg>
);

const ASNIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-zinc-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
  </svg>
);

const HashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-zinc-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-zinc-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-emerald-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// --- Threat Intelligence Report Presets ---
interface ReportData {
  target: string;
  type: string;
  score: number;
  location: string;
  asn: string;
  category: string;
  details: string;
  vendorStats: string;
  curlCommand: string;
}

const PRESETS: Record<string, ReportData> = {
  "1.1.1.1": {
    target: "1.1.1.1",
    type: "IP Address",
    score: 0,
    location: "Australia (AU) - CDN Anycast Network",
    asn: "AS13335 (Cloudflare, Inc.)",
    category: "Trusted Public DNS Resolver, Anycast CDN Node",
    details: "This IP is the public, privacy-focused Anycast DNS resolver operated by Cloudflare in partnership with APNIC. It is universally trusted, maintains valid DNSSEC validation, and shows zero malicious telemetry or botnet C2 activity.",
    vendorStats: "0 / 68 security engines flagged this IP as malicious",
    curlCommand: 'curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/ip?ip=1.1.1.1" \\\n  -H "Authorization: Bearer <API_TOKEN>"'
  },
  "8.8.8.8": {
    target: "8.8.8.8",
    type: "IP Address",
    score: 0,
    location: "United States (US) - Google Edge Network",
    asn: "AS15169 (Google LLC)",
    category: "Trusted Public DNS Resolver, Anycast Network",
    details: "This IP is the primary public DNS resolver operated by Google LLC. It serves global DNS requests, shows no signs of hosting exploit payloads, and is marked completely clean across all vendor consensus lists.",
    vendorStats: "0 / 68 security engines flagged this IP as malicious",
    curlCommand: 'curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/ip?ip=8.8.8.8" \\\n  -H "Authorization: Bearer <API_TOKEN>"'
  },
  "google.com": {
    target: "google.com",
    type: "Domain Name",
    score: 0,
    location: "United States (US)",
    asn: "AS15169 (Google LLC)",
    category: "Search Engine, SaaS Hub",
    details: "Core web portal for Google Search and related workspace services. The domain is registered with MarkMonitor Inc., utilizes DNSSEC signing, and features clean reputation ratings across all global threat intelligence registers.",
    vendorStats: "0 / 68 security engines flagged this domain as malicious",
    curlCommand: 'curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/domain?domain=google.com" \\\n  -H "Authorization: Bearer <API_TOKEN>"'
  },
  "cloudflare.com": {
    target: "cloudflare.com",
    type: "Domain Name",
    score: 0,
    location: "United States (US)",
    asn: "AS13335 (Cloudflare, Inc.)",
    category: "Corporate Portal, Cybersecurity & CDN Services",
    details: "Primary corporate domain for Cloudflare, Inc. It features enterprise-level SSL encryption, advanced WAF rules, DNSSEC security protocols, and is verified completely clean of any security hazards.",
    vendorStats: "0 / 68 security engines flagged this domain as malicious",
    curlCommand: 'curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/domain?domain=cloudflare.com" \\\n  -H "Authorization: Bearer <API_TOKEN>"'
  }
};

const SCAN_STEPS = [
  "Initializing threat intelligence scanners...",
  "Querying Whois, DNS records, and IP geolocation...",
  "Retrieving vendor reputation databases consensus...",
  "Inspecting SSL/TLS certificate history...",
  "Compiling intelligence risk scoring report..."
];

function InvestigatePageContent() {
  const [inputVal, setInputVal] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-detect targets and generate realistic report profiles
  const generateMockReport = (target: string): ReportData => {
    const cleaned = target.trim().toLowerCase();
    
    // Check if preset exists
    if (PRESETS[cleaned]) {
      return PRESETS[cleaned];
    }

    // IP detection
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(cleaned)) {
      const isMalicious = cleaned.startsWith("198") || cleaned.startsWith("45") || cleaned.includes("66");
      const score = isMalicious ? 78 : 12;
      return {
        target,
        type: "IP Address",
        score,
        location: isMalicious ? "Netherlands (NL) - Hosting Server" : "United States (US) - Cloud Provider Node",
        asn: isMalicious ? "AS20473 (Choopa, LLC)" : "AS16509 (Amazon.com, Inc.)",
        category: isMalicious ? "Malware Distribution Host, Scanning Botnet" : "Commercial Web Cloud Server",
        details: isMalicious 
          ? `Suspicious outbound connections detected. Host has triggered multiple threat alerts for brute-forcing HTTP credentials and scanning open database ports (3306, 5432). Vendor registers categorize this space as unsafe.`
          : `Clean cloud IP host instance. No active security incidents or spam triggers are linked to this address range in the last 60 days. Standard traffic routing.`,
        vendorStats: isMalicious ? "46 / 68 security engines flagged this IP as malicious" : "0 / 68 security engines flagged this IP as malicious",
        curlCommand: `curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/ip?ip=${target}" \\\n  -H "Authorization: Bearer <API_TOKEN>"`
      };
    }

    // ASN detection
    if (cleaned.startsWith("as") && /^\d+$/.test(cleaned.substring(2))) {
      return {
        target: target.toUpperCase(),
        type: "Autonomous System Number (ASN)",
        score: 4,
        location: "Global Routing Protocol Space",
        asn: `${target.toUpperCase()} Network Range`,
        category: "ISP Network Autonomous routing block",
        details: `Autonomous system network infrastructure node. Routes network packets, hosts diverse prefix pools. Health diagnostics show clean route advertisements with no recent BGP hijack warnings.`,
        vendorStats: "0 / 68 security engines flagged this ASN as malicious",
        curlCommand: `curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/asn?asn=${cleaned.substring(2)}" \\\n  -H "Authorization: Bearer <API_TOKEN>"`
      };
    }

    // Hash detection
    const isHash = cleaned.length === 32 || cleaned.length === 40 || cleaned.length === 64;
    if (isHash) {
      const score = 94;
      return {
        target,
        type: "File Hash",
        score,
        location: "N/A - Executable Payload",
        asn: "N/A",
        category: "Ransomware Variant / Spyware Trojan",
        details: `File payload matches signatures for Wannacry exploit variants or malicious credential scrapers. Highly dangerous payload. Triggers severe file system modification events and attempts system API hooks.`,
        vendorStats: "62 / 68 security engines flagged this hash as malicious",
        curlCommand: `curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/hash?hash=${target}" \\\n  -H "Authorization: Bearer <API_TOKEN>"`
      };
    }

    // Default to Domain/URL
    const isMaliciousDomain = cleaned.includes("phish") || cleaned.includes("malware") || cleaned.includes("virus") || cleaned.includes("click");
    const score = isMaliciousDomain ? 86 : 8;
    return {
      target,
      type: "Domain Name",
      score,
      location: isMaliciousDomain ? "Seychelles (SC)" : "United States (US)",
      asn: isMaliciousDomain ? "AS4808 (China169 Network)" : "AS13335 (Cloudflare, Inc.)",
      category: isMaliciousDomain ? "Phishing Landing Page, Credential Theft Portal" : "Domain Landing page",
      details: isMaliciousDomain 
        ? `This domain features an actively deceptive page layout designed to spoof administrative web portals. High risk of user credential leakage. Registered using masked proxy contact lists.`
        : `Safe domain hosting node. Maintains healthy SSL certificate rotation, clean DNS resolution trees, and zero threat registry flags. Suitable for secure connection.`,
      vendorStats: isMaliciousDomain ? "53 / 68 security engines flagged this domain as malicious" : "0 / 68 security engines flagged this domain as malicious",
      curlCommand: `curl -X GET "https://api.cloudflare.com/client/v4/accounts/61ef6f7c6215df3616424def03fa7070/intel/domain?domain=${target}" \\\n  -H "Authorization: Bearer <API_TOKEN>"`
    };
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setIsScanning(true);
    setReport(null);
  };

  // Cycle scanning loading steps
  useEffect(() => {
    if (!isScanning) return;
    
    let stepIdx = 0;
    setScanStep(SCAN_STEPS[0]);

    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < SCAN_STEPS.length) {
        setScanStep(SCAN_STEPS[stepIdx]);
      } else {
        clearInterval(stepInterval);
        setReport(generateMockReport(inputVal));
        setIsScanning(false);
      }
    }, 450);

    return () => clearInterval(stepInterval);
  }, [isScanning, inputVal]);

  const handleCopyCurl = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.curlCommand);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      
      {/* Title Header */}
      {!report && !isScanning && (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground select-none">
              Investigate
            </h1>
            <p className="text-sm text-muted-foreground select-none">
              Dig into traffic sources, domain reputation, URL details, and more
            </p>
          </div>
          
          <div className="border-b border-border pb-2" />
        </>
      )}

      {/* --- State 1: Default Search Layout --- */}
      {!isScanning && !report && (
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          
          {/* Card 1: Input Lookup */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-md">
            <div>
              <h2 className="text-base font-semibold text-foreground">Scan an IP, domain, hash, URL, or ASN</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Get a detailed risk report and an API curl. Scans are unlisted by default.
              </p>
            </div>
            
            <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
              <span className="font-semibold block text-foreground mb-0.5">URL Scan reports remaining this month:</span>
              <span>500 unlisted URL Scan Reports, and 5,000 public URL Scan Reports remaining.</span>
            </div>
            
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative flex items-center bg-background border border-border rounded-lg px-4 py-2.5 focus-within:border-orange-500 transition-colors">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="e.g. 1.1.1.1"
                  className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 p-0"
                />
              </div>
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0 select-none"
              >
                Scan Target
              </button>
            </form>
          </div>

          {/* Card 2: Educational list of scan targets */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-md">
            <div>
              <h2 className="text-base font-semibold text-foreground">What can I scan?</h2>
              <Link
                href="https://developers.cloudflare.com/radar/investigate"
                target="_blank"
                className="text-xs text-blue-500 hover:underline flex items-center mt-1 select-none"
              >
                Learn more about investigating threats <ExternalLinkIcon />
              </Link>
            </div>
            
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="flex gap-3.5 items-start">
                <div className="mt-0.5 p-1.5 bg-muted rounded border border-border">
                  <IPAddressIcon />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">IP addresses</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Get information about a traffic source.</p>
                </div>
              </div>
              
              <div className="flex gap-3.5 items-start">
                <div className="mt-0.5 p-1.5 bg-muted rounded border border-border">
                  <DomainIcon />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Domains</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Assess domain reputation and historical changes.</p>
                </div>
              </div>
              
              <div className="flex gap-3.5 items-start">
                <div className="mt-0.5 p-1.5 bg-muted rounded border border-border">
                  <UrlIcon />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">URLs</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Get security, performance, technology, and network details.</p>
                </div>
              </div>
              
              <div className="flex gap-3.5 items-start">
                <div className="mt-0.5 p-1.5 bg-muted rounded border border-border">
                  <ASNIcon />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Autonomous System Numbers (ASNs)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Understand network infrastructure.</p>
                </div>
              </div>
              
              <div className="flex gap-3.5 items-start">
                <div className="mt-0.5 p-1.5 bg-muted rounded border border-border">
                  <HashIcon />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Hashes</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Explore file integrity and potential security threats.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- State 2: Simulated Scan Loading Console --- */}
      {isScanning && (
        <div className="bg-card border border-border rounded-lg p-8 max-w-4xl flex flex-col items-center justify-center space-y-6 min-h-[350px] shadow-lg">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Accent rings */}
            <div className="absolute h-20 w-20 rounded-full border border-orange-500/20 animate-ping" />
            <div className="absolute h-16 w-16 rounded-full border border-orange-500/40 animate-pulse" />
            <div className="h-12 w-12 rounded-full border-2 border-border border-t-orange-500 animate-spin" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-sm font-semibold text-foreground font-mono select-none">
              Scanning target: <span className="text-orange-500">{inputVal}</span>
            </h3>
            <p className="text-xs text-muted-foreground animate-pulse transition-all duration-200">
              {scanStep}
            </p>
          </div>
        </div>
      )}

      {/* --- State 3: Intel Report Dashboard --- */}
      {report && !isScanning && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Back button & Title line */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setReport(null);
                  setInputVal("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-medium border border-border hover:bg-muted bg-card px-3 py-1.5 rounded-lg transition-colors cursor-pointer select-none"
              >
                &larr; Scan another target
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded font-mono select-all">
                Radar ID: 61ef6f7c6215
              </span>
            </div>
          </div>

          {/* Heading Target Info banner */}
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md select-text">
            <div>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-1">
                {report.type}
              </span>
              <h2 className="text-2xl font-bold font-mono text-foreground tracking-tight break-all">
                {report.target}
              </h2>
            </div>
            
            <div className="px-3 py-1.5 rounded bg-muted/50 border border-border">
              <span className="text-xs font-semibold text-muted-foreground">Scan Status: </span>
              <span className="text-xs font-bold text-emerald-500">Verified Complete</span>
            </div>
          </div>

          {/* Main 2-column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column Left (2/3 width) - Security Indicators & Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Risk Assessment Card */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-md">
                <h3 className="text-sm font-semibold text-foreground select-none border-b border-border pb-2">
                  Risk & Threat Score Analysis
                </h3>
                
                <div className="flex flex-col md:flex-row items-center gap-6 select-none">
                  {/* Circular Risk Score Gauge */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        className="text-border"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke={report.score > 50 ? "#ef4444" : report.score > 10 ? "#f59e0b" : "#10b981"}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - report.score / 100)}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-extrabold text-foreground font-mono leading-none">
                        {report.score}
                      </span>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                        Score
                      </span>
                    </div>
                  </div>

                  {/* Classification info block */}
                  <div className="flex-1 space-y-2 select-text">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${
                        report.score > 50 ? "bg-red-500" : report.score > 10 ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        {report.score > 50 ? "High Risk Alert" : report.score > 10 ? "Medium Risk Profile" : "Low Risk / Clean"}
                      </h4>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-normal">
                      {report.score > 50 
                        ? "This target has active threat flags. Multiple external engines and Cloudflare Honey-net telemetry verified malicious behavior matching known security threats."
                        : "No malicious flags detected. DNS resolver configurations are legitimate and host is classified clean under vendor and system intelligence registries."}
                    </p>
                    
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground">Security consensus: </span>
                      <span className={`text-xs font-bold font-mono ${report.score > 50 ? "text-red-500" : "text-emerald-500"}`}>
                        {report.vendorStats}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intelligence detail grid card */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-md select-text">
                <h3 className="text-sm font-semibold text-foreground select-none border-b border-border pb-2">
                  Threat Intelligence Properties
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Network Location</span>
                    <p className="text-foreground font-semibold">{report.location}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Autonomous System (ASN)</span>
                    <p className="text-foreground font-semibold font-mono">{report.asn}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Classification Categories</span>
                    <p className="text-foreground font-semibold">{report.category}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">Last Threat Registry Scan</span>
                    <p className="text-foreground font-semibold font-mono">Just Now (Real-time edge cache)</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2 text-xs">
                  <span className="text-muted-foreground font-semibold block uppercase tracking-wider text-[10px]">
                    Detailed Analyst Evaluation
                  </span>
                  <p className="text-foreground leading-relaxed font-normal bg-muted/20 border border-border rounded-lg p-3.5">
                    {report.details}
                  </p>
                </div>
              </div>
            </div>

            {/* Column Right (1/3 width) - Curl Command & Recommendations */}
            <div className="space-y-6">
              
              {/* API Integration Curl Code Box */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-md select-text">
                <div>
                  <h3 className="text-sm font-semibold text-foreground select-none">
                    Cloudflare Radar API
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 select-none">
                    Query this intel record programmatically using your Cloudflare account auth token.
                  </p>
                </div>
                
                <div className="relative border border-border bg-muted/70 rounded-lg p-3 pt-4 overflow-x-auto select-all">
                  <pre className="text-[10px] font-mono text-foreground whitespace-pre leading-relaxed scrollbar-thin">
                    {report.curlCommand}
                  </pre>
                  
                  <button
                    onClick={handleCopyCurl}
                    className="absolute right-2 top-2 p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs transition-colors cursor-pointer select-none flex items-center justify-center"
                    title="Copy to Clipboard"
                  >
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
                
                {isCopied && (
                  <div className="text-[10px] text-emerald-500 text-right font-medium animate-pulse select-none">
                    Copied curl command to clipboard!
                  </div>
                )}
              </div>

              {/* Security Policy Recommendations */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-md select-text">
                <h3 className="text-sm font-semibold text-foreground select-none border-b border-border pb-2">
                  System Recommendation
                </h3>
                
                <div className="space-y-3 text-xs leading-relaxed">
                  <p className="text-muted-foreground">
                    {report.score > 50 
                      ? "To secure your edge application, we recommend deploying a custom WAF block rule targeting this IP space, or configuring a rate-limit threshold profile."
                      : "No explicit block policies are recommended. However, you can monitor requests via analytics logs if this traffic originates from unrecognized source regions."}
                  </p>
                  
                  <div className="pt-2">
                    <Link
                      href="/dash/security?tab=waf"
                      className="inline-flex items-center text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors select-none"
                    >
                      Configure custom WAF rules &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Bọc component bằng Suspense để tránh lỗi Pre-render (CSR bails out) do useSearchParams
export default function InvestigatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <InvestigatePageContent />
    </Suspense>
  );
}
