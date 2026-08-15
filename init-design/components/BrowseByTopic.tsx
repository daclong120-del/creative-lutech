"use client";

import React from "react";

interface Topic {
  category: string;
  links: string[];
}

export default function BrowseByTopic() {
  const topics: Topic[] = [
    {
      category: "Getting started",
      links: [
        "Create a Cloudflare account",
        "Change nameservers to Cloudflare",
        "Cloudflare SSL/TLS overview"
      ]
    },
    {
      category: "Billing",
      links: [
        "Cloudflare pricing & plans",
        "Understand billing & invoices",
        "Update billing information"
      ]
    },
    {
      category: "Security",
      links: [
        "Configure Web Application Firewall (WAF)",
        "Mitigate DDoS attacks",
        "Set up custom firewall rules"
      ]
    },
    {
      category: "Developer Platform",
      links: [
        "Get started with Workers",
        "Deploy a site on Pages",
        "KV & D1 databases"
      ]
    },
    {
      category: "SASE & Zero Trust",
      links: [
        "Configure Cloudflare Tunnel",
        "Set up Access policies",
        "Secure DNS requests (1.1.1.1)"
      ]
    },
    {
      category: "Caching & CDN",
      links: [
        "Understand default cache behavior",
        "Purge cached assets",
        "Customize Cache Rules"
      ]
    },
    {
      category: "DNS",
      links: [
        "Manage DNS records",
        "Configure DNSSEC",
        "Dynamic DNS setup"
      ]
    },
    {
      category: "Network",
      links: [
        "Configure Argo Smart Routing",
        "Set up Load Balancing",
        "Understand Network ports"
      ]
    },
    {
      category: "Analytics",
      links: [
        "Analyze Web Traffic metrics",
        "WAF Security analytics",
        "Export logs to third-party tools"
      ]
    },
    {
      category: "Reference Architecture",
      links: [
        "E-commerce architecture blueprint",
        "Serverless app architecture",
        "Zero Trust migration guide"
      ]
    }
  ];

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 md:p-8 space-y-6 text-left select-none shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Category header and badge */}
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-md bg-cloudflare-orange/10 px-2.5 py-0.5 text-xs font-semibold text-cloudflare-orange">
          Knowledge base
        </span>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Browse by topic
        </h2>
        <p className="text-xs text-muted-foreground">
          Look around in our knowledge base to find detailed guides and descriptions of our products.
        </p>
      </div>

      <div className="h-px bg-border/60" />

      {/* Grid containing categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
        {topics.map((topic, index) => (
          <div key={index} className="space-y-2.5">
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              {topic.category}
            </h3>
            <ul className="space-y-1.5">
              {topic.links.map((linkText, linkIndex) => (
                <li key={linkIndex}>
                  <a
                    href="#"
                    className="text-xs text-primary/90 hover:text-primary hover:underline transition-colors duration-150 block truncate leading-relaxed"
                    title={linkText}
                  >
                    {linkText}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
