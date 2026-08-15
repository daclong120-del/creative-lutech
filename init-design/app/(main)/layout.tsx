"use client";

import React, { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AskAiDrawer from "@/components/AskAiDrawer";
import { AccountProvider, useAccount } from "@/lib/account-context";
import { cn } from "@/lib/utils";

/**
 * MainLayoutContent
 * Chứa cấu trúc chính của dashboard, sử dụng useAccount để biết trạng thái của Ask AI drawer.
 */
function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname ? pathname.startsWith("/dash") : false;
  const { isAskAiOpen } = useAccount();

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <Suspense fallback={<div className="w-[290px] border-r border-border bg-card shrink-0 hidden md:block" />}>
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </Suspense>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <Suspense fallback={<div className="h-14 border-b border-border bg-card shrink-0" />}>
          <Header onMenuToggle={() => setIsMobileSidebarOpen(true)} />
        </Suspense>

        {/* Main scrollable body */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-background transition-[padding-right] duration-300 ease-out",
          isDashboard ? "" : "bg-dot-grid",
          isAskAiOpen && "lg:pr-[400px]"
        )}>
          {children}
        </main>
      </div>
      
      {/* Global Ask AI Drawer */}
      <AskAiDrawer />
    </div>
  );
}

/**
 * # Layout chung MainLayout
 * Bọc qua AccountProvider để tất cả các component bên trong có thể truy cập context.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AccountProvider>
  );
}

