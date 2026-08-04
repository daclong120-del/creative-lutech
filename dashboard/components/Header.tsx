"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAccount } from "@/lib/account-context";
import { UserIcon, ChevronDownIcon } from "@/components/icons";
import { signOutAction } from "@/lib/actions/auth.actions";

import { useUIStore } from "@/lib/stores/use-ui-store";

// ─── Breadcrumb mapping ──────────────────────────────────────
const ROUTE_LABELS: Record<string, string[]> = {
  "/dash/home": ["Creative Lutech", "Crawler Controller", "Giám sát crawler"],
  "/dash/tasks": ["Creative Lutech", "Crawler Controller", "Nhiệm vụ cào"],
  "/dash/accounts": ["Creative Lutech", "Crawler Controller", "Tài khoản"],
  "/dash/proxies": ["Creative Lutech", "Crawler Controller", "Proxy Pool"],
  "/dash/data/authors": ["Creative Lutech", "Data Explorer", "Tác giả"],
  "/dash/data/posts": ["Creative Lutech", "Data Explorer", "Bài viết"],
  "/dash/data/management": ["Creative Lutech", "Data Explorer", "Quản lý dữ liệu"],
  "/dash/audit-logs": ["Creative Lutech", "Admin", "Audit Logs"],
  "/dash/settings": ["Creative Lutech", "Admin", "Cài đặt"],
  "/dash/settings/permissions": ["Creative Lutech", "Admin", "Cài đặt", "Phân quyền"],
  "/dash/creative/search": ["Creative Lutech", "Creative Hub", "Tìm Creative"],
  "/dash/creative/trending": ["Creative Lutech", "Creative Hub", "BXH", "Xu hướng mới nhất"],
  "/dash/creative/growth": ["Creative Lutech", "Creative Hub", "BXH", "Tăng trưởng nhanh"],
  "/dash/creative/new": ["Creative Lutech", "Creative Hub", "BXH", "Creative mới"],
  "/dash/creative/calendar": ["Creative Lutech", "Creative Hub", "Lịch tiếp thị"],
  "/dash/creative/advertisers": ["Creative Lutech", "Creative Hub", "Phân tích Advertiser"],
  "/dash/release-ops": ["Creative Lutech", "Release Ops", "Tổng quan Ops"],
  "/dash/release-ops/overview": ["Creative Lutech", "Release Ops", "Tổng quan Ops"],
  "/dash/release-ops/releases": ["Creative Lutech", "Release Ops", "Phát hành & Build", "Danh sách Release"],
  "/dash/release-ops/upload": ["Creative Lutech", "Release Ops", "Phát hành & Build", "Upload AAB"],
  "/dash/release-ops/batch": ["Creative Lutech", "Release Ops", "Phát hành & Build", "Batch Ops"],
  "/dash/release-ops/apps": ["Creative Lutech", "Release Ops", "Quản lý App & ASO", "Danh mục App"],
  "/dash/release-ops/aso": ["Creative Lutech", "Release Ops", "Quản lý App & ASO", "Phân tích ASO"],
  "/dash/release-ops/sdk": ["Creative Lutech", "Release Ops", "Quản lý App & ASO", "Target SDK"],
  "/dash/release-ops/accounts": ["Creative Lutech", "Release Ops", "Tài khoản Play"],
};


interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeAccount } = useAccount();

  const [hasMounted, setHasMounted] = useState(false);
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const timer = setTimeout(() => setHasMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isDark = hasMounted
    ? (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches))
    : false;

  const getBreadcrumbs = () => {
    if (pathname.startsWith("/dash/manage-account")) {
      return ["Creative Lutech", "Quản trị", "Quản lý thành viên"];
    }
    if (pathname.startsWith("/dash/creative/advertisers/")) {
      return ["Creative Lutech", "Creative Hub", "Advertiser", "Hồ sơ"];
    }
    if (pathname.startsWith("/dash/creative/") && !ROUTE_LABELS[pathname]) {
      return ["Creative Lutech", "Creative Hub", "Creative", "Chi tiết"];
    }
    return ROUTE_LABELS[pathname] || ["Creative Lutech"];
  };


  const breadcrumb = getBreadcrumbs();



  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    const html = document.documentElement;
    if (nextTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 shrink-0 relative z-30 select-none">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button onClick={onMenuToggle} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted lg:hidden text-muted-foreground transition-all duration-120 active:scale-90" aria-label="Mở menu">
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 overflow-hidden">
          {breadcrumb.map((segment, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-border mx-0.5">/</span>}
              <span className={cn(
                "truncate transition-colors duration-120",
                i === breadcrumb.length - 1 ? "text-foreground font-medium" : "hover:text-foreground cursor-default"
              )}>
                {segment}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:rotate-180"
          title={isDark ? "Chế độ sáng" : "Chế độ tối"}
        >
          {isDark ? (
            <svg className="size-4 animate-in zoom-in-90 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg className="size-4 animate-in zoom-in-90 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-8 items-center gap-1.5 px-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none cursor-pointer active-press-subtle"
            aria-expanded={isProfileOpen}
          >
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              <UserIcon size={12} className="text-primary" />
            </div>
            <span className="hidden sm:inline font-medium">{activeAccount}</span>
            <ChevronDownIcon size={12} className={cn("transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]", isProfileOpen && "rotate-180")} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-1.5 w-60 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-160 popover-origin-right">
              <div className="px-3 py-2 border-b border-border mb-1 select-none">
                <p className="text-xs text-muted-foreground">Đăng nhập bằng</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {activeAccount.includes("@") ? activeAccount : `${activeAccount}@gmail.com`}
                </p>
              </div>

              <Link
                href="/dash/home"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100"
              >
                Tổng quan tài khoản
              </Link>
              <Link
                href="/dash/manage-account/members"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100"
              >
                Quản lý tài khoản
              </Link>
              <Link
                href="/dash/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-foreground hover:bg-muted transition-colors duration-100"
              >
                Cài đặt hệ thống
              </Link>
              
              <div className="h-px bg-border my-1" />

              <button
                onClick={async () => {
                  console.log("Logging out active user account:", activeAccount);
                  setIsProfileOpen(false);
                  await signOutAction();
                  localStorage.removeItem("sinomedia_active_account");
                  router.push("/login");
                  router.refresh();
                }}
                className="flex items-center w-full px-3 py-1.5 text-xs rounded-md text-destructive hover:bg-destructive/5 transition-colors duration-100 text-left font-medium cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
