"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getOverviewStats } from '@/lib/actions/release-ops.actions';

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  '/dash/release-ops/overview': {
    title: 'Tổng quan Release Operations',
    subtitle: 'Tổng quan chỉ số vòng đời phát hành, pipeline status và cảnh báo khẩn cấp cho toàn bộ ứng dụng.',
  },
  '/dash/release-ops/releases': {
    title: 'Danh sách Release & Staged Rollouts',
    subtitle: 'Quản lý trạng thái bản phát hành, tỷ lệ phân phối rollout và kiểm soát các thao tác release khẩn cấp.',
  },
  '/dash/release-ops/upload': {
    title: 'Upload Tệp AAB & Pre-check Matrix',
    subtitle: 'Khởi tạo quy trình tải lên Android App Bundle và tự động kiểm tra versionCode, chữ ký số SHA256 & Target SDK.',
  },
  '/dash/release-ops/apps': {
    title: 'Danh mục Ứng dụng & Onboarding Checklist',
    subtitle: 'Quản lý danh sách ứng dụng trên Google Play và tiến độ Onboarding ứng dụng mới.',
  },
  '/dash/release-ops/aso': {
    title: 'Phân tích ASO & Chất lượng Store Listing',
    subtitle: 'Theo dõi tỷ lệ chuyển đổi Store Listing (CR), cảnh báo GEO và so sánh tài nguyên giao diện với đối thủ.',
  },
  '/dash/release-ops/batch': {
    title: 'Điều phối Release Hàng loạt (Batch Ops)',
    subtitle: 'Lập kế hoạch phát hành Canary Rollout hàng loạt, Mass Promote và kiểm soát rủi ro phát hành quy mô lớn.',
  },
  '/dash/release-ops/sdk': {
    title: 'Tuân thủ Target SDK 34 Mandate',
    subtitle: 'Theo dõi hạn chót nâng cấp Target SDK Level 34 (Android 14) cho toàn bộ danh mục ứng dụng.',
  },
  '/dash/release-ops/accounts': {
    title: 'Quản lý Tài khoản Google Play Developer',
    subtitle: 'Quản lý tài khoản phát hành, trạng thái OAuth Service Account token và hạn mức Google Play Publishing API.',
  },
};

export default function ReleaseOpsHeader() {
  const pathname = usePathname();
  const meta = ROUTE_META[pathname] || {
    title: 'Google Play Release Operations',
    subtitle: 'Quản lý vòng đời phát hành, kiểm duyệt AAB, và tuân thủ Google Play Console trên toàn bộ tài khoản Developer.',
  };

  const [stats, setStats] = useState({ totalApps: 0, totalAccounts: 0, activeRollouts: 0, lastPlaySyncAt: '' });

  useEffect(() => {
    getOverviewStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-background border-b border-border px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {meta.title}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Creative Lutech Ops Center
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-4 bg-muted/40 border border-border rounded-lg px-3 py-1.5">
            <div>
              <span className="text-muted-foreground">Ứng dụng: </span>
              <span className="font-semibold text-foreground">{stats.totalApps}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div>
              <span className="text-muted-foreground">Tài khoản Dev: </span>
              <span className="font-semibold text-foreground">{stats.totalAccounts}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div>
              <span className="text-muted-foreground">Đang Rollout: </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.activeRollouts}</span>
            </div>
          </div>

          {stats.lastPlaySyncAt && (
            <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-[sync-pulse_2.5s_ease-in-out_infinite]" />
              <span>Đồng bộ: {new Date(stats.lastPlaySyncAt).toLocaleString('vi-VN')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
