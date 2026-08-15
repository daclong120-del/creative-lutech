"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import React from "react";
import SupportGrid from "@/components/SupportGrid";
import SeeWhatsNew from "@/components/SeeWhatsNew";
import BrowseByTopic from "@/components/BrowseByTopic";
import Footer from "@/components/Footer";

/**
 * # Trang chủ cổng hỗ trợ Cloudflare Support Portal
 * Hiển thị thanh dẫn đường, danh sách tính năng chính, tin tức mới và chủ đề hỗ trợ.
 */
export default function Home() {
  const { activeAccount } = useAccount();
  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-8 w-full">
      {/* Portal Welcome Header / Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none animate-in fade-in slide-in-from-top-1 duration-200">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Support</span>
      </div>

      {/* Cloudflare Status Pill */}
      <div className="flex justify-center pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/20 px-3 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 shadow-sm hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Cloudflare Status: 1 active issue</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-3 text-amber-600 dark:text-amber-400"
          >
            <path
              fillRule="evenodd"
              d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>

      {/* Support Center Dashed Box */}
      <div className="border border-dashed border-border/80 rounded-2xl p-6 md:p-10 bg-transparent text-center space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground select-none">
          What can we help you with?
        </h1>
        <SupportGrid />
      </div>

      {/* See What's New section */}
      <SeeWhatsNew />

      {/* Browse By Topic section */}
      <BrowseByTopic />

      {/* Footer section */}
      <Footer />
    </div>
  );
}
