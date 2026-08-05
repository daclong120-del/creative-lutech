"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  AppWindow,
  Rocket,
  UploadCloud,
  Users,
  LineChart,
  Layers,
  ShieldCheck,
  FileText,
  Cpu,
  History,
  Archive,
} from 'lucide-react';

const tabs = [
  { name: 'Overview', href: '/dash/release-ops/overview', icon: LayoutDashboard },
  { name: 'Reports (20 Cột)', href: '/dash/release-ops/reports', icon: BarChart3 },
  { name: 'Apps', href: '/dash/release-ops/apps', icon: AppWindow },
  { name: 'Releases', href: '/dash/release-ops/releases', icon: Rocket },
  { name: 'Upload Queue', href: '/dash/release-ops/upload', icon: UploadCloud },
  { name: 'Jobs', href: '/dash/release-ops/jobs', icon: FileText },
  { name: 'Workers', href: '/dash/release-ops/workers', icon: Cpu },
  { name: 'Accounts', href: '/dash/release-ops/accounts', icon: Users },
  { name: 'ASO Analytics', href: '/dash/release-ops/aso', icon: LineChart },
  { name: 'Audit Log', href: '/dash/release-ops/audit', icon: History },
  { name: 'Artifacts', href: '/dash/release-ops/artifacts', icon: Archive },
  { name: 'Batch Ops', href: '/dash/release-ops/batch', icon: Layers },
  { name: 'Target SDK', href: '/dash/release-ops/sdk', icon: ShieldCheck },
];

export default function ReleaseOpsNavTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/80 bg-background/50 backdrop-blur-xs mb-4">
      <div className="flex items-center gap-1 overflow-x-auto py-1.5 px-2 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
