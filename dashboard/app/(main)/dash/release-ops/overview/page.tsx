"use client";

import React, { useState, useEffect } from 'react';
import { getReleases, getOverviewStats } from '@/lib/actions/release-ops.actions';
import { ReleaseStatus, AppReleaseItem } from '@/types/release-ops';
import ReleaseOpsNavTabs from '@/components/dashboard/release-ops/ReleaseOpsNavTabs';

function StatusBadge({ status }: { status: ReleaseStatus }) {
  const map: Record<ReleaseStatus, { label: string; style: string }> = {
    draft: { label: 'Bản nháp', style: 'bg-muted text-muted-foreground border-border' },
    building: { label: 'Đang Build', style: 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse' },
    in_review: { label: 'Chờ duyệt Play', style: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    rolling_out: { label: 'Đang Staged Rollout', style: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    live: { label: 'Đã Live Store', style: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' },
    rejected: { label: 'Bị Từ chối', style: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
    halted: { label: 'Đã Tạm dừng', style: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    failed: { label: 'Lỗi Build', style: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
    policy_blocked: { label: 'Khóa Chính sách', style: 'bg-red-600/15 text-red-700 font-bold border-red-600/30' },
  };

  const item = map[status] || { label: status, style: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
}

// Time range option types
type TimeRangeType = '7d' | '14d' | '30d' | '90d';

interface BuildPoint {
  day: string;
  success: number;
  failed: number;
  duration: string;
}

const BUILD_DATASET: Record<TimeRangeType, BuildPoint[]> = {
  '7d': [
    { day: '28/6', success: 15, failed: 3, duration: '3m 40s' },
    { day: '29/6', success: 18, failed: 4, duration: '4m 10s' },
    { day: '30/6', success: 12, failed: 1, duration: '3m 15s' },
    { day: '1/7', success: 16, failed: 2, duration: '3m 50s' },
    { day: '2/7', success: 14, failed: 2, duration: '4m 05s' },
    { day: '3/7', success: 5, failed: 1, duration: '2m 50s' },
    { day: '4/7', success: 8, failed: 1, duration: '3m 20s' },
  ],
  '14d': [
    { day: '21/6', success: 11, failed: 1, duration: '3m 30s' },
    { day: '22/6', success: 14, failed: 3, duration: '4m 15s' },
    { day: '23/6', success: 9, failed: 0, duration: '3m 05s' },
    { day: '24/6', success: 16, failed: 4, duration: '4m 30s' },
    { day: '25/6', success: 13, failed: 1, duration: '3m 40s' },
    { day: '26/6', success: 4, failed: 0, duration: '2m 45s' },
    { day: '27/6', success: 2, failed: 0, duration: '2m 10s' },
    { day: '28/6', success: 15, failed: 3, duration: '3m 40s' },
    { day: '29/6', success: 18, failed: 4, duration: '4m 10s' },
    { day: '30/6', success: 12, failed: 1, duration: '3m 15s' },
    { day: '1/7', success: 16, failed: 2, duration: '3m 50s' },
    { day: '2/7', success: 14, failed: 2, duration: '4m 05s' },
    { day: '3/7', success: 5, failed: 1, duration: '2m 50s' },
    { day: '4/7', success: 8, failed: 1, duration: '3m 20s' },
  ],
  '30d': [
    { day: '5/6', success: 10, failed: 2, duration: '3m 45s' },
    { day: '8/6', success: 14, failed: 1, duration: '3m 50s' },
    { day: '11/6', success: 12, failed: 3, duration: '4m 00s' },
    { day: '14/6', success: 15, failed: 2, duration: '3m 30s' },
    { day: '17/6', success: 11, failed: 1, duration: '3m 20s' },
    { day: '20/6', success: 13, failed: 2, duration: '3m 40s' },
    { day: '23/6', success: 9, failed: 0, duration: '3m 05s' },
    { day: '26/6', success: 15, failed: 3, duration: '4m 10s' },
    { day: '29/6', success: 18, failed: 4, duration: '4m 25s' },
    { day: '2/7', success: 14, failed: 2, duration: '4m 05s' },
    { day: '4/7', success: 8, failed: 1, duration: '3m 20s' },
  ],
  '90d': [
    { day: 'Tháng 4', success: 142, failed: 18, duration: '3m 40s' },
    { day: 'Tháng 5', success: 198, failed: 22, duration: '3m 35s' },
    { day: 'Tháng 6', success: 245, failed: 31, duration: '3m 50s' },
    { day: 'Tháng 7', success: 43, failed: 5, duration: '3m 25s' },
  ],
};

export default function OverviewPage() {
  const [releases, setReleases] = useState<AppReleaseItem[]>([]);
  const [stats, setStats] = useState({ totalApps: 0, totalAccounts: 0, activeRollouts: 0, pendingReviews: 0, failedOrBlocked: 0, lastPlaySyncAt: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [releasesData, statsData] = await Promise.all([
          getReleases(),
          getOverviewStats(),
        ]);
        setReleases(releasesData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const rollouts = releases.filter(r => r.status === 'rolling_out');
  const reviews = releases.filter(r => r.status === 'in_review');
  const issues = releases.filter(r => r.status === 'rejected' || r.status === 'failed');

  // Time range selection state
  const [timeRange, setTimeRange] = useState<TimeRangeType>('14d');
  const [hoveredPoint, setHoveredPoint] = useState<BuildPoint | null>(null);
  const [selectedDayModal, setSelectedDayModal] = useState<BuildPoint | null>(null);
  const [modalClosing, setModalClosing] = useState(false);

  const handleOpenModal = (pt: BuildPoint) => {
    setSelectedDayModal(pt);
    setModalClosing(false);
  };

  const handleCloseModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setSelectedDayModal(null);
      setModalClosing(false);
    }, 200);
  };

  const activePoints = BUILD_DATASET[timeRange];

  // Calculate summary metrics for current active timeframe
  const totalSuccess = activePoints.reduce((acc, p) => acc + p.success, 0);
  const totalFailed = activePoints.reduce((acc, p) => acc + p.failed, 0);
  const totalBuilds = totalSuccess + totalFailed;
  const successRate = totalBuilds > 0 ? ((totalSuccess / totalBuilds) * 100).toFixed(1) : '0.0';

  const maxTotal = Math.max(...activePoints.map(b => b.success + b.failed), 1);
  const maxY = Math.ceil(maxTotal / 5) * 5 || 25;
  const ticksY = [maxY, Math.round(maxY * 0.8), Math.round(maxY * 0.6), Math.round(maxY * 0.4), Math.round(maxY * 0.2), 0];

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* ─── Top Header Strip (Creative Lutech Release Ops) ─── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Creative Lutech Release Ops</h1>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-muted border border-border">{stats.totalApps} apps</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded bg-muted border border-border">{stats.totalAccounts} dev accounts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          <span>play sync &bull; lần cuối 14:52</span>
        </div>
      </div>

      {/* ─── Pipeline Today Stage Counter Strip ─── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 0 } as React.CSSProperties}>
        <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">
          PIPELINE HÔM NAY &bull; RELEASES ĐANG DI CHUYỂN QUA CÁC STAGE
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
             <span className="text-2xl font-black text-foreground block">{stats.failedOrBlocked}</span>
             <span className="text-xs font-semibold text-muted-foreground block">ISSUES</span>
            <div className="flex items-center gap-1 pt-1">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/10 text-rose-600 border border-rose-500/20">build_failed 3</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/10 text-rose-600 border border-rose-500/20">rejected 2</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20">halted 1</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
             <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block">{releases.filter(r => r.status === 'building' || r.status === 'draft').length}</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block">BUILDING</span>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
             <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">{stats.pendingReviews}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">IN_REVIEW</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
             <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">{stats.activeRollouts}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">ROLLING_OUT</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1">
             <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block">{releases.filter(r => r.status === 'live').length}</span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">LIVE</span>
          </div>
        </div>
      </div>

      {/* ─── Hybrid Crisp Interactive CI Builds Chart ─── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 1 } as React.CSSProperties}>
        {/* Header Strip with Dynamic Timeframe Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Builds CI</span>
              <span className="text-xs font-normal text-muted-foreground font-mono">
                ({timeRange === '7d' ? '7 ngày qua' : timeRange === '14d' ? '14 ngày qua' : timeRange === '30d' ? '30 ngày qua' : '90 ngày qua'})
              </span>
            </h3>
            <span className="text-xs text-muted-foreground block mt-0.5">
              Thống kê tỷ lệ Success vs Failed từ webhook CI / GitHub Actions
            </span>
          </div>

          {/* Timeframe Selector Pill Bar */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
            {(['7d', '14d', '30d', '90d'] as TimeRangeType[]).map((rangeKey) => {
              const labels: Record<TimeRangeType, string> = {
                '7d': '7 ngày',
                '14d': '14 ngày',
                '30d': '30 ngày',
                '90d': '90 ngày',
              };
              const isActive = timeRange === rangeKey;
              return (
                <button
                  key={rangeKey}
                  onClick={() => setTimeRange(rangeKey)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 active-press ${
                    isActive
                      ? 'bg-background text-foreground shadow-xs border border-border font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  }`}
                >
                  {labels[rangeKey]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Metrics Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 border border-border rounded-lg p-3 text-xs">
          <div>
            <span className="text-muted-foreground block font-medium">Tổng số Builds:</span>
            <span className="text-base font-black font-mono text-foreground">{totalBuilds}</span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Tỷ lệ Thành công:</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {successRate}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Build Thất bại:</span>
            <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">{totalFailed}</span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Thời gian trung bình:</span>
            <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">3m 42s</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 text-xs font-semibold pt-1">
          <div className="flex items-center gap-1.5">
            <span className="size-3 bg-emerald-600" />
            <span className="text-muted-foreground">Success ({totalSuccess})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 bg-rose-600" />
            <span className="text-muted-foreground">Failed ({totalFailed})</span>
          </div>
        </div>

        {/* ─── Hybrid Chart Container ─── */}
        <div className="relative border-t border-border pt-4 space-y-2">
          {/* Y-Axis Title (Native HTML Text - 100% Crisp) */}
          <div className="text-xs font-bold text-foreground">
            ↑ Trục Y: Số lượng Builds CI
          </div>

          {/* Chart Flex Container: Left HTML Y-Axis Ticks + Stretched SVG Canvas */}
          <div className="flex gap-3 items-stretch">
            {/* Native HTML Y-Axis Numbers (100% Crisp, Un-squished) */}
            <div className="flex flex-col justify-between text-xs font-mono text-muted-foreground text-right w-6 py-1 select-none">
              {ticksY.map(v => (
                <span key={v} className="leading-none">{v}</span>
              ))}
            </div>

            {/* SVG Canvas for Grid Lines and Sharp Bars (100% Full Width Stretched) */}
            <div className="flex-1 relative">
              <svg viewBox="0 0 1000 220" className="w-full h-56" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="buildSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="buildFailedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct) => {
                  const y = Math.round(pct * 220);
                  return (
                    <line key={pct} x1="0" y1={y} x2="1000" y2={y} stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
                  );
                })}

                {/* Vertical Grid Lines & Sharp Square Bars (Fixed 36px Bar Width) */}
                {activePoints.map((pt, idx) => {
                  const slotW = 1000 / activePoints.length;
                  const colX = (idx + 0.5) * slotW;
                  const total = pt.success + pt.failed;
                  const totalH = (total / maxY) * 220;
                  const failedH = (pt.failed / maxY) * 220;
                  const successH = totalH - failedH;
                  const barY = 220 - totalH;
                  const colW = Math.min(slotW * 0.55, 38);
                  const barX = colX - colW / 2;
                  const isHovered = hoveredPoint?.day === pt.day;

                  return (
                    <g
                      key={pt.day}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => handleOpenModal(pt)}
                    >
                      {/* Vertical Grid Line */}
                      <line x1={colX} y1="0" x2={colX} y2="220" stroke="currentColor" strokeDasharray="2 4" className="text-border/30" strokeWidth="1" />

                      {/* Failed Portion (Top - Sharp Crimson Square rx=0) */}
                      {pt.failed > 0 && (
                        <rect
                          x={barX}
                          y={barY}
                          width={colW}
                          height={failedH}
                          rx="0"
                          fill="url(#buildFailedGrad)"
                          className={`transition-[fill,filter,height,y] duration-300 ease-out ${isHovered ? 'brightness-125' : ''}`}
                        />
                      )}

                      {/* Success Portion (Bottom - Sharp Emerald Square rx=0) */}
                      {pt.success > 0 && (
                        <rect
                          x={barX}
                          y={barY + failedH}
                          width={colW}
                          height={successH}
                          rx="0"
                          fill="url(#buildSuccessGrad)"
                          className={`transition-[fill,filter,height,y] duration-300 ease-out ${isHovered ? 'brightness-125' : ''}`}
                        />
                      )}

                      {/* Hover Outline Border with smooth transition */}
                      <rect
                        x={barX - 2}
                        y={barY - 2}
                        width={colW + 4}
                        height={totalH + 4}
                        rx="0"
                        fill="none"
                        stroke="currentColor"
                        className="text-primary transition-opacity duration-150 ease-out"
                        strokeWidth="2"
                        style={{ opacity: isHovered ? 1 : 0 }}
                      />
                    </g>
                  );
                })}

                {/* Bottom X-Axis Border Line */}
                <line x1="0" y1="220" x2="1000" y2="220" stroke="currentColor" className="text-border" strokeWidth="1.5" />
              </svg>

              {/* Total Build Numbers HTML Overlay above Bars with smooth sliding transition */}
              <div className="absolute inset-0 pointer-events-none">
                {activePoints.map((pt, idx) => {
                  const total = pt.success + pt.failed;
                  const totalH = (total / maxY) * 220;
                  const isHovered = hoveredPoint?.day === pt.day;
                  const leftPct = ((idx + 0.5) / activePoints.length) * 100;

                  return (
                    <div
                      key={pt.day}
                      className={`absolute -translate-x-1/2 font-sans text-xs font-black transition-[left,bottom,transform,color] duration-300 var(--ease-out) ${
                        isHovered ? 'text-primary scale-125 z-10' : 'text-foreground'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        bottom: `${totalH + 10}px`,
                      }}
                    >
                      {total}
                    </div>
                  );
                })}
              </div>

              {/* X-Axis HTML Date Labels (100% Crisp, Un-squished Native Font) */}
              <div className="flex justify-between pt-2.5 text-xs font-mono text-muted-foreground select-none">
                {activePoints.map((pt) => {
                  const isHovered = hoveredPoint?.day === pt.day;
                  return (
                    <span
                      key={pt.day}
                      className={`flex-1 text-center font-medium transition-colors duration-150 ${
                        isHovered ? 'text-primary font-bold' : 'text-muted-foreground'
                      }`}
                    >
                      {pt.day}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-Axis Title (Native HTML Text) */}
          <div className="text-center text-xs font-bold text-foreground pt-2">
            → Trục X: Ngày Build (Thời gian)
          </div>
        </div>
      </div>

      {/* ─── Day Build Detail Modal Popup ─── */}
      {selectedDayModal && (
        <div 
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 ${modalClosing ? 'animate-out fade-out' : ''}`}
          onClick={handleCloseModal}
        >
          <div 
            className={`bg-background border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ease-out ${modalClosing ? 'animate-out fade-out zoom-out-95' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Chi tiết CI Builds &mdash; Ngày {selectedDayModal.day}</h3>
                <span className="text-xs text-muted-foreground font-mono block mt-0.5">
                  Tổng {selectedDayModal.success + selectedDayModal.failed} builds &bull; {selectedDayModal.duration} avg
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted font-semibold text-base active-press cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Mock Build Runs list */}
            <div className="space-y-2 max-h-72 overflow-y-auto text-xs font-mono">
              {Array.from({ length: selectedDayModal.success }).map((_, i) => {
                const staggerIndex = i;
                return (
                  <div 
                    key={`s-${i}`} 
                    className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between animate-in fade-in slide-in-from-bottom-1 stagger-item"
                    style={{ '--stagger-index': staggerIndex } as React.CSSProperties}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">#BUILD-{1840 + i} &bull; QR Scanner Plus</span>
                      <span className="text-[10px] text-muted-foreground font-sans">commit main: 8f3a91c &bull; CI runner #4</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      SUCCESS ({selectedDayModal.duration})
                    </span>
                  </div>
                );
              })}

              {Array.from({ length: selectedDayModal.failed }).map((_, i) => {
                const staggerIndex = selectedDayModal.success + i;
                return (
                  <div 
                    key={`f-${i}`} 
                    className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-between animate-in fade-in slide-in-from-bottom-1 stagger-item"
                    style={{ '--stagger-index': staggerIndex } as React.CSSProperties}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">#BUILD-{1890 + i} &bull; Short Drama</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-sans">Exit Code 1: NullPointerException in AdMob init</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      FAILED
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={handleCloseModal}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active-press cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Operational Grid (Review Queue, Cần xử lý, Rollout đang chạy) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 2 } as React.CSSProperties}>
        {/* 1. Review queue */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">Review queue</h3>
            <span className="text-xs text-muted-foreground block">Đang chờ Google review, sắp theo thời gian chờ</span>
          </div>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {reviews.map(r => (
              <div key={r.id} className="p-3 hover:bg-muted/30 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{r.appName}</span>
                  <StatusBadge status={r.status} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground block">
                  v{r.versionName} &bull; Đang chờ {r.reviewLifecycle?.reviewAgeHours || 14}h (SLA &lt; 48h)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Cần xử lý */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">Cần xử lý</h3>
            <span className="text-xs text-muted-foreground block">Rejected &amp; build failed trong 48h</span>
          </div>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {issues.map(item => (
              <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{item.appName}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {item.rejectionReason || 'Build pipeline error (Exit code 1)'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Rollout đang chạy */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">Rollout đang chạy</h3>
            <span className="text-xs text-muted-foreground block">Staged rollout &lt; 100% trên production</span>
          </div>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {rollouts.map(r => (
              <div key={r.id} className="p-3 hover:bg-muted/30 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{r.appName}</span>
                  <span className="font-bold text-xs text-emerald-600">{r.rolloutPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-[width] duration-300 var(--ease-out)" style={{ width: `${r.rolloutPercentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
