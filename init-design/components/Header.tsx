"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SparklesIcon, QuestionCircleIcon, UserIcon, ChevronDownIcon, CloudflareLogo, ChevronRightIcon } from "./icons";
import { cn } from "@/lib/utils";
import { useAccount } from "@/lib/account-context";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useLanguage, Language } from "@/lib/language-context";

interface HeaderProps {
  onMenuToggle?: () => void;
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const languages: { code: "en" | "vi"; name: string }[] = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
];

const timezones = [
  { code: "local", name: "Local Time" },
  { code: "utc", name: "UTC" },
];

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { activeAccount, setIsAskAiOpen, isAskAiOpen } = useAccount();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "">("");
  const [activeSubmenu, setActiveSubmenu] = useState<"appearance" | "language" | "timezone" | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const [timezone, setTimezone] = useState<string>("local");

  const isDashboard = pathname ? pathname.startsWith("/dash") : false;

  const getBreadcrumbs = () => {
    if (!isDashboard) return null;
    const tab = searchParams.get("tab") || "";
    const section = searchParams.get("section") || "";

    if (pathname === "/dash/home") {
      return ["Home"];
    }
    if (pathname.startsWith("/dash/investigate")) {
      const parent = section === "security" ? "Application security" : "Observe";
      return [parent, "Investigate"];
    }
    if (pathname.startsWith("/dash/security")) {
      const tabNames: Record<string, string> = {
        waf: "WAF",
        insights: "Security insights",
        infrastructure: "Infrastructure",
        turnstile: "Turnstile",
      };
      return ["Application security", tabNames[tab] || "Security insights"];
    }
    if (pathname.startsWith("/dash/analytics")) {
      return ["Observe", "Analytics"];
    }
    if (pathname.startsWith("/dash/workers")) {
      return ["Workers & Pages", "Overview"];
    }
    if (pathname.startsWith("/dash/storage/kv")) {
      const parent = section === "workers" ? "Workers & Pages" : "Storage & databases";
      return [parent, "KV"];
    }
    if (pathname.startsWith("/dash/storage/d1")) {
      const parent = section === "workers" ? "Workers & Pages" : "Storage & databases";
      return [parent, "D1 Databases"];
    }
    if (pathname.startsWith("/dash/storage/r2")) {
      const parent = section === "workers" ? "Workers & Pages" : "Storage & databases";
      return [parent, "R2 Object Storage"];
    }
    if (pathname.startsWith("/dash/ai")) {
      return ["Workers & Pages", "AI"];
    }
    if (pathname.startsWith("/dash/media")) {
      return ["Media & images", tab === "images" ? "Images Optimization" : "Stream"];
    }
    if (pathname.startsWith("/dash/zero-trust")) {
      return ["Protect & Connect", "Zero Trust"];
    }
    if (pathname.startsWith("/dash/dns")) {
      const perfTabs = ["caching", "speed", "load-balancing", "redirects"];
      if (perfTabs.includes(tab)) {
        const labels: Record<string, string> = {
          caching: "Caching",
          speed: "Speed",
          "load-balancing": "Load Balancing",
          redirects: "Redirects",
        };
        return ["Delivery & performance", labels[tab] || "Caching"];
      } else {
        const labels: Record<string, string> = {
          overview: "Overview",
          insights: "Insights",
          tunnels: "Tunnels",
          mesh: "Mesh",
          routes: "Routes",
          ip: "IP addresses",
        };
        return ["Networking", labels[tab] || "Overview"];
      }
    }
    if (pathname.startsWith("/dash/manage-account/")) {
      const sub = pathname.replace("/dash/manage-account/", "");
      const labels: Record<string, string> = {
        members: "Members",
        billing: "Billing",
        tokens: "Account API tokens",
        oauth: "OAuth clients",
        audit: "Audit logs",
        notifications: "Notifications",
        "shared-config": "Shared config",
        blocked: "Blocked content",
        abuse: "Abuse reports",
        carbon: "Carbon Impact Report",
        configurations: "Configurations",
        "tagged-resources": "Tagged Resources",
      };
      return ["Manage account", labels[sub] || "Members"];
    }
    return ["Dashboard"];
  };

  // Sync initial theme and timezone on client mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const timer = setTimeout(() => {
      setTheme(isDark ? "dark" : "light");
      if (typeof window !== "undefined") {
        if (localStorage.timezone) {
          setTimezone(localStorage.timezone);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setActiveSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 backdrop-blur-sm select-none transition-[padding-right] duration-300 ease-out",
      isDashboard ? "border-b border-transparent bg-background/40" : "border-b border-border bg-background/80",
      isAskAiOpen && "lg:pr-[400px]"
    )}>
      {/* Left zone: Logo and Portal Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger menu */}
        <button
          onClick={onMenuToggle}
          className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted lg:hidden text-muted-foreground focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Small Logo for Header Title */}
        {isDashboard ? (
          <>
            {/* On Mobile: Cloudflare Logo, On Desktop: Breadcrumbs */}
            <div className="flex items-center gap-2 lg:hidden">
              <CloudflareLogo size={28} className="text-cloudflare-orange" />
            </div>
            
            {/* Desktop Breadcrumbs */}
            <div className="hidden lg:flex items-center gap-1 text-xs select-none">
              {getBreadcrumbs()?.map((crumb, idx, arr) => (
                <React.Fragment key={crumb}>
                  <span className={cn(
                    "font-medium",
                    idx === arr.length - 1 ? "text-foreground" : "text-muted-foreground/70"
                  )}>
                    {t(crumb, "sidebar")}
                  </span>
                  {idx < arr.length - 1 && (
                    <span className="text-muted-foreground/40 mx-1.5 font-normal">&gt;</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <CloudflareLogo size={28} className="text-cloudflare-orange" />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:block">
              {t("Support Portal", "header")}
            </span>
          </div>
        )}
      </div>

      {/* Right zone: Actions */}
      <div className="flex items-center gap-2">
        {/* Ask AI button */}
        <button
          onClick={() => setIsAskAiOpen(true)}
          className={cn(
            "group flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-primary shadow-sm transition-all duration-150",
            "hover:border-primary hover:bg-primary/5 active:bg-primary/10 cursor-pointer"
          )}
        >
          <SparklesIcon size={14} className="text-cloudflare-orange animate-pulse" />
          <span>{t("Ask AI", "header")}</span>
        </button>

        {/* Support Help link */}
        <Link
          href="/"
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
        >
          <QuestionCircleIcon size={14} />
          <span className="hidden md:inline">{t("Help Center", "header")}</span>
        </Link>

        {/* User avatar dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              if (isProfileOpen) {
                setIsProfileOpen(false);
                setActiveSubmenu(null);
              } else {
                setIsProfileOpen(true);
              }
            }}
            className="flex h-8 items-center gap-1 rounded-lg border border-transparent p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted transition-colors duration-150 focus:outline-none"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/15 text-muted-foreground">
              <UserIcon size={12} />
            </div>
            <ChevronDownIcon size={12} className={cn("transition-transform duration-150", isProfileOpen && "rotate-180")} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div 
              className="absolute right-0 mt-1.5 w-60 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150"
              onMouseLeave={() => setActiveSubmenu(null)}
            >
              <div className="px-3 py-2 border-b border-border mb-1 select-none">
                <p className="text-xs text-muted-foreground">{t("Logged in as", "header")}</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {activeAccount.includes("@") ? activeAccount : `${activeAccount}@gmail.com`}
                </p>
              </div>

              <Link
                href="/dash/home"
                onMouseEnter={() => setActiveSubmenu(null)}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100"
              >
                {t("Account Home", "header")}
              </Link>
              <Link
                href="/dash/profile"
                onMouseEnter={() => setActiveSubmenu(null)}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100"
              >
                {t("Profile", "header")}
              </Link>
              <Link
                href="/dash/settings?tab=Billing"
                onMouseEnter={() => setActiveSubmenu(null)}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100"
              >
                {t("Billing", "sidebar")}
              </Link>
              
              <div className="h-px bg-border my-1" />

              {/* Appearance Menu Item */}
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveSubmenu("appearance")}
                  onClick={() => setActiveSubmenu(activeSubmenu === "appearance" ? null : "appearance")}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" />
                        <path d="M12 20v2" />
                        <path d="m4.93 4.93 1.41 1.41" />
                        <path d="m17.66 17.66 1.41 1.41" />
                        <path d="M2 12h2" />
                        <path d="M20 12h2" />
                        <path d="m6.34 17.66-1.41 1.41" />
                        <path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    )}
                    <span>{t("Appearance", "header")}</span>
                  </div>
                  <ChevronRightIcon size={12} className="text-muted-foreground/60" />
                </button>

                {/* Appearance Submenu */}
                {activeSubmenu === "appearance" && (
                  <div className="absolute right-full top-0 mr-0.5 w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-right-1 duration-150">
                    <button
                      onClick={() => {
                        setTheme("light");
                        localStorage.theme = "light";
                        document.documentElement.classList.remove("dark");
                      }}
                      className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                    >
                      <span>Light</span>
                      {theme === "light" && <CheckIcon className="text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => {
                        setTheme("dark");
                        localStorage.theme = "dark";
                        document.documentElement.classList.add("dark");
                      }}
                      className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                    >
                      <span>Dark</span>
                      {theme === "dark" && <CheckIcon className="text-muted-foreground" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Language Menu Item */}
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveSubmenu("language")}
                  onClick={() => setActiveSubmenu(activeSubmenu === "language" ? null : "language")}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>{t("Language", "header")}</span>
                  </div>
                  <ChevronRightIcon size={12} className="text-muted-foreground/60" />
                </button>

                {/* Language Submenu */}
                {activeSubmenu === "language" && (
                  <div className="absolute right-full top-0 mr-0.5 w-44 max-h-[250px] overflow-y-auto origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-right-1 duration-150 custom-scrollbar select-none">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          localStorage.language = lang.code;
                          localStorage.setItem("preferred_language", lang.code === "vi" ? "vi-VN" : "en-US");
                          window.dispatchEvent(new Event("storage"));
                        }}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                      >
                        <span>{lang.name}</span>
                        {language === lang.code && <CheckIcon className="text-muted-foreground" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Timezone Menu Item */}
              <div className="relative">
                <button
                  onMouseEnter={() => setActiveSubmenu("timezone")}
                  onClick={() => setActiveSubmenu(activeSubmenu === "timezone" ? null : "timezone")}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{t("Timezone", "header")}</span>
                  </div>
                  <ChevronRightIcon size={12} className="text-muted-foreground/60" />
                </button>

                {/* Timezone Submenu */}
                {activeSubmenu === "timezone" && (
                  <div className="absolute right-full top-0 mr-0.5 w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-right-1 duration-150">
                    {timezones.map((tz) => (
                      <button
                        key={tz.code}
                        onClick={() => {
                          setTimezone(tz.code);
                          localStorage.timezone = tz.code;
                        }}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100 text-left cursor-pointer"
                      >
                        <span>{tz.name}</span>
                        {timezone === tz.code && <CheckIcon className="text-muted-foreground" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-border my-1" />

              <button
                onMouseEnter={() => setActiveSubmenu(null)}
                onClick={() => {
                  console.log("Logging out active user account:", activeAccount);
                  setIsProfileOpen(false);
                  localStorage.removeItem("cloudflare_active_account");
                  router.push("/login");
                }}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-destructive hover:bg-destructive/5 transition-colors duration-100 text-left font-medium"
              >
                {t("Log out", "header")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

