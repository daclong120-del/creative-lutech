"use client";

import { useAccount } from "@/lib/account-context";
import { useLanguage } from "@/lib/language-context";

import React, { useState } from "react";
import Link from "next/link";
import { SearchIcon, ChevronRightIcon, DomainsIcon, SparklesIcon, ArrowRightIcon } from "@/components/icons";

interface Website {
  id: string;
  domain: string;
  status: "Active" | "Pending Nameserver Update";
  plan: "Free" | "Pro" | "Enterprise";
  created: string;
}

export default function DashHome() {
  const { activeAccount } = useAccount();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const initialWebsites: Website[] = [
    {
      id: "1",
      domain: "cloudflare-emulation.com",
      status: "Active",
      plan: "Free",
      created: "2026-06-15"
    },
    {
      id: "2",
      domain: "example-project.pages.dev",
      status: "Active",
      plan: "Free",
      created: "2026-06-20"
    },
    {
      id: "3",
      domain: "test-api-domain.net",
      status: "Pending Nameserver Update",
      plan: "Pro",
      created: "2026-06-28"
    },
    {
      id: "4",
      domain: "my-personal-blog.org",
      status: "Active",
      plan: "Free",
      created: "2026-07-01"
    }
  ];

  const filteredWebsites = initialWebsites.filter((site) =>
    site.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">{t("Home", "sidebar")}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Website List (70%) */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">
              {t("Websites", "dash_home")}
            </h1>

            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative flex items-center rounded-lg border border-border bg-card px-3 h-9 w-64 shadow-sm hover:border-muted-foreground/30 focus-within:border-primary transition-colors">
                <SearchIcon size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder={t("Search websites...", "dash_home")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ml-2 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              {/* Add Site Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {t("Add a site", "dash_home")}
              </button>
            </div>
          </div>

          {/* Websites Table Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between select-none">
              <span className="text-xs font-semibold text-muted-foreground">{t("Domain name", "dash_home")}</span>
              <span className="text-xs font-semibold text-muted-foreground hidden sm:block">{t("Status", "dash_home")}</span>
            </div>

            {filteredWebsites.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredWebsites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/dash/dns?domain=${site.domain}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <DomainsIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                          {site.domain}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {t(`${site.plan} Plan`, "dash_plans")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            site.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="text-xs text-foreground">
                          {t(site.status, "dash_home")}
                        </span>
                      </div>
                      <ChevronRightIcon
                        size={14}
                        className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 select-none">
                <p className="text-sm font-medium text-foreground">{t("No websites found", "dash_home")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Try adjusting your search terms or add a new website to manage.", "dash_home")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Discover & Resources Sidebar (30%) */}
        <div className="w-full lg:w-[320px] space-y-6 select-none">
          {/* Discover Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5 px-1">
              <SparklesIcon size={14} className="text-cloudflare-orange" />
              {t("Discover", "dash_home")}
            </h2>

            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-foreground">
                  {t("Build serverless with Workers", "dash_home")}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  {t("Deploy serverless code instantly to the Cloudflare network. No servers to configure or maintain.", "dash_home")}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline mt-1.5"
                >
                  {t("Create a Worker", "dash_home")}
                  <ArrowRightIcon size={10} />
                </a>
              </div>

              <div className="border-t border-border pt-4 space-y-1">
                <h3 className="text-xs font-bold text-foreground">
                  {t("Secure traffic with Zero Trust", "dash_home")}
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  {t("Stop data loss, manage employee access, and secure networks at remote scale.", "dash_home")}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline mt-1.5"
                >
                  {t("Configure Gateway", "dash_home")}
                  <ArrowRightIcon size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Resources Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted-foreground tracking-wider uppercase px-1">
              {t("Resources", "dash_home")}
            </h2>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm divide-y divide-border">
              <div className="pb-3 space-y-1">
                <a href="#" className="text-xs font-semibold text-foreground hover:text-primary transition-colors block">
                  {t("Cloudflare API Reference", "dash_home")}
                </a>
                <p className="text-[11px] text-muted-foreground">
                  {t("Manage configuration via automated REST API endpoints.", "dash_home")}
                </p>
              </div>
              <div className="py-3 space-y-1">
                <a href="#" className="text-xs font-semibold text-foreground hover:text-primary transition-colors block">
                  {t("Developer Documentation", "dash_home")}
                </a>
                <p className="text-[11px] text-muted-foreground">
                  {t("Guides, tutorials, and templates for building on Cloudflare.", "dash_home")}
                </p>
              </div>
              <div className="py-3 space-y-1">
                <a href="#" className="text-xs font-semibold text-foreground hover:text-primary transition-colors block">
                  {t("Community Forum", "dash_home")}
                </a>
                <p className="text-[11px] text-muted-foreground">
                  {t("Connect with fellow engineers and developer teams.", "dash_home")}
                </p>
              </div>
              <div className="pt-3 space-y-1">
                <a href="#" className="text-xs font-semibold text-foreground hover:text-primary transition-colors block">
                  {t("System Status", "dash_home")}
                </a>
                <p className="text-[11px] text-muted-foreground">
                  {t("Check current operational uptime of Cloudflare edge services.", "dash_home")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Add Site Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          {/* Modal content box */}
          <div className="relative bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">
                {t("Add a site to Cloudflare", "dash_home")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("Enter your site's apex domain name (e.g., example.com) to begin setup.", "dash_home")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="domain-input">
                  {t("Site address (domain name)", "dash_home")}
                </label>
                <input
                  id="domain-input"
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="rounded-lg bg-muted/30 border border-border p-3">
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {t("Note: In this emulation template, clicking \"Add site\" is a visual demo only. The new domain will not persist to the active list.", "dash_home")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("Cancel", "common")}
              </button>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewDomain("");
                }}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {t("Add site", "dash_home")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
