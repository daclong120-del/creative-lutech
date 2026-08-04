"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_TABS = [
  { id: 'overview', label: 'Tổng quan Ops', href: '/dash/release-ops/overview' },
  { id: 'releases', label: 'Danh sách Release', href: '/dash/release-ops/releases' },
  { id: 'upload', label: 'Upload AAB', href: '/dash/release-ops/upload' },
  { id: 'apps', label: 'Danh mục App', href: '/dash/release-ops/apps' },
  { id: 'aso', label: 'Phân tích ASO', href: '/dash/release-ops/aso' },
  { id: 'batch', label: 'Batch Ops', href: '/dash/release-ops/batch' },
  { id: 'sdk', label: 'Target SDK', href: '/dash/release-ops/sdk' },
  { id: 'accounts', label: 'Tài khoản Play', href: '/dash/release-ops/accounts' },
];

export default function ReleaseOpsSubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-background border-b border-border px-6 overflow-x-auto scrollbar-none">
      <div className="flex space-x-1 py-2">
        {NAV_TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.id === 'overview' && pathname === '/dash/release-ops');
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap active-press-subtle",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
