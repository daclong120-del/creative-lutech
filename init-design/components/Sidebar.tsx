"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  CloudflareLogo,
  SearchIcon,
  HomeIcon,
  RecentsIcon,
  InvestigateIcon,
  AnalyticsIcon,
  ComputeIcon,
  AiIcon,
  StorageIcon,
  MediaIcon,
  AppSecurityIcon,
  ZeroTrustIcon,
  NetworkingIcon,
  ManageAccountIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PerformanceIcon
} from "./icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAccount } from "@/lib/account-context";
import { useLanguage } from "@/lib/language-context";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SidebarMenuItem {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  children?: {
    name: string;
    subtitle?: string;
    badge?: string;
    href: string;
    hasArrow?: boolean;
  }[];
}

interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeAccount } = useAccount();
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track manually expanded/collapsed state for nested menus
  const [manualExpanded, setManualExpanded] = useState<Record<string, boolean>>({});
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setManualExpanded({});
  }

  // Focus search input on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hàm kiểm tra xem một đường dẫn (href) có đang active không
  const isItemActive = (href: string) => {
    if (href === "#") return false;

    // Phân tách href thành path và query parameters
    const [hrefPath, hrefQuery] = href.split("?");
    const hrefParams = new URLSearchParams(hrefQuery || "");

    // Kiểm tra xem base pathname có khớp không (khớp trực tiếp hoặc khớp tiền tố cho route động)
    const isPathMatch = pathname === hrefPath || 
      (hrefPath !== "/dash/home" && pathname.startsWith(hrefPath));

    if (!isPathMatch) return false;

    // Phân giải section mặc định cho các trang dùng chung path
    const resolveSection = (path: string, sectionParam: string | null) => {
      if (sectionParam) return sectionParam;
      if (path.startsWith("/dash/storage")) return "storage";
      if (path.startsWith("/dash/investigate")) return "observe";
      return null;
    };

    // Phân giải tab mặc định nếu thiếu query tab trên URL
    const resolveTab = (path: string, tabParam: string | null) => {
      if (tabParam) return tabParam;
      if (path.startsWith("/dash/storage/kv")) return "kv";
      if (path.startsWith("/dash/storage/d1")) return "d1";
      if (path.startsWith("/dash/storage/r2")) return "r2";
      if (path.startsWith("/dash/storage")) return "kv";
      if (path.startsWith("/dash/media")) return "stream";
      if (path.startsWith("/dash/security")) return "insights";
      if (path.startsWith("/dash/dns")) return "overview";
      if (path.startsWith("/dash/ai")) return "hub";
      return null;
    };

    const currentSection = resolveSection(pathname, searchParams.get("section"));
    const itemSection = resolveSection(hrefPath, hrefParams.get("section"));

    const currentActiveTab = resolveTab(pathname, currentTab);
    const itemTab = resolveTab(hrefPath, hrefParams.get("tab"));

    return currentSection === itemSection && currentActiveTab === itemTab;
  };

  // Sidebar navigation menu definition
  const menuGroups: SidebarMenuGroup[] = [
    {
      title: "Observe",
      items: [
        { name: "Home", icon: HomeIcon, href: "/dash/home" },
        {
          name: "Recents",
          icon: RecentsIcon,
          children: [
            { name: "WAF", subtitle: "Application security", href: "/dash/security?tab=waf" },
            { name: "Security insights", subtitle: "Application security", href: "/dash/security?tab=insights" },
            { name: "Plans", subtitle: "Stream", href: "/dash/manage-account/billing" },
            { name: "Investigate", subtitle: "Application security", href: "/dash/investigate?section=security" },
            { name: "Zero Trust", subtitle: "Protect & Connect", href: "/dash/zero-trust" }
          ]
        },
        { name: "Investigate", icon: InvestigateIcon, href: "/dash/investigate?section=observe" },
        { name: "Analytics", icon: AnalyticsIcon, href: "/dash/analytics" }
      ]
    },
    {
      title: "Build",
      items: [
        {
          name: "Workers & Pages",
          icon: ComputeIcon,
          children: [
            { name: "Overview", href: "/dash/workers" },
            { name: "KV", href: "/dash/storage/kv?section=workers" },
            { name: "D1", href: "/dash/storage/d1?section=workers" },
            { name: "R2", href: "/dash/storage/r2?section=workers" }
          ]
        },
        {
          name: "AI",
          icon: AiIcon,
          children: [
            { name: "Workers AI Hub", href: "/dash/ai?tab=hub" },
            { name: "Vectorize", href: "/dash/ai?tab=vectorize" },
            { name: "AI Gateway", href: "/dash/ai?tab=gateway" }
          ]
        },
        {
          name: "Storage & Databases",
          icon: StorageIcon,
          children: [
            { name: "KV", href: "/dash/storage/kv?section=storage" },
            { name: "D1 Databases", href: "/dash/storage/d1?section=storage" },
            { name: "R2 Object Storage", href: "/dash/storage/r2?section=storage" }
          ]
        },
        {
          name: "Media & Images",
          icon: MediaIcon,
          children: [
            { name: "Stream", href: "/dash/media?tab=stream" },
            { name: "Images Optimization", href: "/dash/media?tab=images" }
          ]
        }
      ]
    },
    {
      title: "Protect & Connect",
      items: [
        {
          name: "Application Security",
          icon: AppSecurityIcon,
          children: [
            { name: "Security insights", href: "/dash/security?tab=insights" },
            { name: "WAF", href: "/dash/security?tab=waf" },
            { name: "Investigate", href: "/dash/investigate?section=security" },
            { name: "Infrastructure", href: "/dash/security?tab=infrastructure" },
            { name: "Turnstile", href: "/dash/security?tab=turnstile" }
          ]
        },
        { name: "Zero Trust", icon: ZeroTrustIcon, href: "/dash/zero-trust" },
        {
          name: "Networking",
          icon: NetworkingIcon,
          children: [
            { name: "Overview", href: "/dash/dns?tab=overview", badge: "New" },
            { name: "Insights", href: "/dash/dns?tab=insights", hasArrow: true },
            { name: "Tunnels", href: "/dash/dns?tab=tunnels" },
            { name: "Mesh", href: "/dash/dns?tab=mesh", badge: "Beta" },
            { name: "Routes", href: "/dash/dns?tab=routes", badge: "New" },
            { name: "IP addresses", href: "/dash/dns?tab=ip", hasArrow: true }
          ]
        },
        {
          name: "Delivery & performance",
          icon: PerformanceIcon,
          children: [
            { name: "Caching", href: "/dash/dns?tab=caching" },
            { name: "Speed", href: "/dash/dns?tab=speed" },
            { name: "Load Balancing", href: "/dash/dns?tab=load-balancing" },
            { name: "Redirects", href: "/dash/dns?tab=redirects" }
          ]
        }
      ]
    },
    {
      title: "",
      items: [
        {
          name: "Manage account",
          icon: ManageAccountIcon,
          children: [
            { name: "Members", href: "/dash/manage-account/members" },
            { name: "Billing", href: "/dash/manage-account/billing" },
            { name: "Account API tokens", href: "/dash/manage-account/tokens" },
            { name: "OAuth clients", href: "/dash/manage-account/oauth" },
            { name: "Audit logs", href: "/dash/manage-account/audit" },
            { name: "Notifications", href: "/dash/manage-account/notifications" },
            { name: "Shared config", href: "/dash/manage-account/shared-config", badge: "Alpha" },
            { name: "Blocked content", href: "/dash/manage-account/blocked" },
            { name: "Abuse reports", href: "/dash/manage-account/abuse", badge: "Beta" },
            { name: "Carbon Impact Report", href: "/dash/manage-account/carbon" },
            { name: "Configurations", href: "/dash/manage-account/configurations" },
            { name: "Tagged Resources", href: "/dash/manage-account/tagged-resources", badge: "Beta" }
          ]
        }
      ]
    }
  ];

  const toggleExpand = (name: string) => {
    setManualExpanded((prev) => {
      const currentlyExpanded = prev[name] !== undefined
        ? prev[name]
        : (menuGroups.flatMap(g => g.items).find(i => i.name === name)?.children?.some(child => isItemActive(child.href)) ?? false);
      return {
        ...prev,
        [name]: !currentlyExpanded,
      };
    });
  };

  const isItemExpanded = (itemName: string) => {
    if (manualExpanded[itemName] !== undefined) {
      return manualExpanded[itemName];
    }
    if (itemName === "Recents") {
      return false;
    }
    const item = menuGroups.flatMap((g) => g.items).find((i) => i.name === itemName);
    if (item && item.children) {
      return item.children.some((child) => isItemActive(child.href));
    }
    return false;
  };

  const filteredGroups = menuGroups
    .map((group) => {
      const items = group.items
        .map((item) => {
          if (item.children) {
            const filteredChildren = item.children.filter(
              (child) =>
                child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            return { ...item, children: filteredChildren };
          }
          return item;
        })
        .filter((item) => {
          if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return true;
          }
          if (item.children && item.children.length > 0) {
            return true;
          }
          return false;
        });
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile Sidebar Backdrop overlay */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-45 bg-black/40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={cn(
          "fixed bottom-0 top-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out select-none",
          // Desktop styles
          "lg:sticky lg:top-0 lg:h-screen lg:z-30",
          isCollapsed ? "lg:w-16" : "lg:w-[290px] shrink-0",
          // Mobile responsive states
          isMobileOpen ? "translate-x-0 w-[290px]" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header Branding Zone (No Account Switcher) */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border relative shrink-0">
          <div className="flex flex-1 items-center gap-2 overflow-hidden text-left min-w-0">
            <CloudflareLogo size={32} className="text-cloudflare-orange shrink-0" />
            <div
              className={cn(
                "flex items-center gap-1 min-w-0 transition-all duration-200",
                isCollapsed && "lg:opacity-0 lg:w-0 lg:hidden"
              )}
            >
              <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                {activeAccount.includes("@") ? activeAccount : `${activeAccount}@gmail.com`}
              </span>
            </div>
          </div>

          {/* Close button for Mobile only */}
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted lg:hidden text-muted-foreground focus:outline-none shrink-0"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mock Search input zone */}
        <div className="px-3 mb-2">
          <div
            onClick={() => searchInputRef.current?.focus()}
            className={cn(
              "relative flex items-center rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-text",
              isCollapsed ? "lg:justify-center lg:h-9" : "h-9 px-3"
            )}
          >
            <SearchIcon size={14} className="text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={cn(
                "ml-2 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none",
                isCollapsed && "lg:hidden lg:w-0"
              )}
            />
            <kbd
              className={cn(
                "hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[9px] font-medium text-muted-foreground pointer-events-none shrink-0",
                isCollapsed && "lg:hidden"
              )}
            >
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Scrollable menu items */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {groupIdx > 0 && !group.title && (
                <div className="h-px bg-border/40 my-2 mx-1" />
              )}
              {/* Group Title label */}
              {group.title && (
                <h3
                  className={cn(
                    "px-3 text-[10px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase transition-all duration-200",
                    isCollapsed && "lg:opacity-0 lg:h-0 lg:overflow-hidden lg:mb-0"
                  )}
                >
                  {t(group.title, "sidebar")}
                </h3>
              )}

              {/* Group Items list */}
              <ul className="space-y-0.5">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const hasChildren = !!item.children;
                  const isExpanded = isItemExpanded(item.name);
                  // Thằng cha có children thì không nên tô màu highlight như thằng con được chọn.
                  // Vì vậy active của thằng cha (có children) sẽ luôn là false.
                  const active = item.name !== "Recents" && item.href ? isItemActive(item.href) : false;

                  return (
                    <li key={itemIdx} className="space-y-0.5">
                      {hasChildren ? (
                        <button
                          onClick={() => !isCollapsed && toggleExpand(item.name)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer",
                            active
                              ? "bg-primary/10 text-primary hover:bg-primary/15"
                              : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                            isCollapsed && "lg:justify-center lg:px-0"
                          )}
                          title={t(item.name, "sidebar")}
                        >
                          <Icon
                            size={16}
                            className={cn(
                              "shrink-0 transition-colors",
                              active ? "text-primary" : "text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
                            )}
                          />
                          <span
                            className={cn(
                              "flex-1 transition-all duration-200 truncate",
                              isCollapsed && "lg:opacity-0 lg:w-0 lg:hidden"
                            )}
                          >
                            {t(item.name, "sidebar")}
                          </span>
                          {!isCollapsed && (
                            <ChevronDownIcon
                              size={12}
                              className={cn(
                                "text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100 shrink-0 transition-transform duration-150",
                                isExpanded ? "rotate-0" : "-rotate-90"
                              )}
                            />
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href || "#"}
                          onClick={onMobileClose}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary hover:bg-primary/15"
                              : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                            isCollapsed && "lg:justify-center lg:px-0"
                          )}
                          title={t(item.name, "sidebar")}
                        >
                          <Icon
                            size={16}
                            className={cn(
                              "shrink-0 transition-colors",
                              active ? "text-primary" : "text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
                            )}
                          />
                          <span
                            className={cn(
                              "transition-all duration-200 truncate",
                              isCollapsed && "lg:opacity-0 lg:w-0 lg:hidden"
                            )}
                          >
                            {t(item.name, "sidebar")}
                          </span>
                        </Link>
                      )}

                      {/* Nested Children list for expandable menu items */}
                      {hasChildren && isExpanded && !isCollapsed && item.children && (
                        <div className="relative pl-4 ml-[21px] border-l border-border/40 space-y-1 mt-1 mb-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          {item.children.map((child, childIdx) => {
                            // Loại trừ con của nhóm Recents khỏi trạng thái active
                            const childActive = item.name !== "Recents" && isItemActive(child.href);
                            const isNew = child.badge?.toLowerCase() === "new";
                            const isBeta = child.badge?.toLowerCase() === "beta";
                            const isAlpha = child.badge?.toLowerCase() === "alpha";
                            
                            return (
                              <Link
                                key={childIdx}
                                href={child.href}
                                onClick={onMobileClose}
                                className={cn(
                                  "group flex items-center justify-between transition-colors py-1.5 px-3 rounded-md w-full",
                                  childActive
                                    ? "bg-muted text-foreground font-semibold"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-muted/30 hover:text-zinc-950 dark:hover:text-zinc-50"
                                )}
                              >
                                <div className="flex-1 min-w-0 flex items-center gap-1.5 justify-between pr-1">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs transition-colors truncate">
                                      {t(child.name, "sidebar")}
                                    </p>
                                    {child.subtitle && (
                                      <p className="text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors truncate mt-0.5">
                                        {t(child.subtitle, "sidebar")}
                                      </p>
                                    )}
                                  </div>
                                  {child.badge && (
                                    <span className={cn(
                                      "shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90",
                                      isNew && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                                      isBeta && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                                      isAlpha && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                                      !isNew && !isBeta && !isAlpha && "bg-muted/80 text-muted-foreground border border-border border-dashed"
                                    )}>
                                      {child.badge}
                                    </span>
                                  )}
                                </div>
                                {child.hasArrow && (
                                  <ChevronRightIcon size={10} className="text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100 shrink-0 ml-1.5" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Collapse toggle bottom footer bar */}
        <div className="border-t border-border p-2 hidden lg:block bg-sidebar">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-full items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-muted hover:text-zinc-950 dark:hover:text-zinc-50 transition-all duration-150 focus:outline-none"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle Sidebar Collapse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className={cn("size-4 transition-transform duration-300", isCollapsed && "rotate-180")}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
