"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AccountProvider } from "@/lib/account-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <AccountProvider>
      <div className="h-screen flex bg-background text-foreground overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <Header onMenuToggle={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background animate-in fade-in duration-300">
            {children}
          </main>
        </div>
      </div>
    </AccountProvider>
  );
}

