"use client";

import React, { useState, useEffect } from 'react';
import ReleaseOpsNavTabs from '@/components/dashboard/release-ops/ReleaseOpsNavTabs';
import { getASOMetrics, getOverviewStats } from '@/lib/actions/release-ops.actions';

// Helper function to build a smooth cubic bezier spline curve through points
function buildSmoothSplinePath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

interface ASOMetricRow {
  id: string;
  app_id: string;
  report_date: string;
  country_code: string | null;
  store_listing_visitors: number | null;
  store_listing_acquisitions: number | null;
  store_listing_conversion_rate: number | null;
  peer_benchmark_cr: number | null;
  app?: { id: string; app_name: string; package_name: string } | null;
}

export default function ASOAnalyticsPage() {
  const [activeWarningDetail, setActiveWarningDetail] = useState<{ appGeo: string; reason: string; suggestedAction: string } | null>(null);
  const [metrics, setMetrics] = useState<ASOMetricRow[]>([]);
  const [headerStats, setHeaderStats] = useState({ totalApps: 0, totalAccounts: 0 });

  useEffect(() => {
    Promise.all([
      getASOMetrics(),
      getOverviewStats(),
    ]).then(([asoData, statsData]) => {
      setMetrics(asoData as unknown as ASOMetricRow[]);
      setHeaderStats({ totalApps: statsData.totalApps, totalAccounts: statsData.totalAccounts });
    }).catch(() => {});
  }, []);

  // Build CR trend from live data (group by report_date, avg CR)
  const trendPoints = (() => {
    if (metrics.length === 0) return [{ date: '—', cr: 0 }];
    const byDate = new Map<string, number[]>();
    for (const m of metrics) {
      if (m.store_listing_conversion_rate != null) {
        const d = new Date(m.report_date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
        const arr = byDate.get(d) ?? [];
        arr.push(m.store_listing_conversion_rate);
        byDate.set(d, arr);
      }
    }
    return Array.from(byDate.entries())
      .map(([date, crs]) => ({ date, cr: crs.reduce((a, b) => a + b, 0) / crs.length }))
      .slice(-10);
  })();

  // CR per app table from live data
  const crAppRows = (() => {
    const byApp = new Map<string, { visitors: number; acquisitions: number; cr: number; peerCr: number }>();
    for (const m of metrics) {
      const name = m.app?.app_name ?? m.app_id;
      const entry = byApp.get(name) ?? { visitors: 0, acquisitions: 0, cr: 0, peerCr: 0 };
      entry.visitors += m.store_listing_visitors ?? 0;
      entry.acquisitions += m.store_listing_acquisitions ?? 0;
      if (m.store_listing_conversion_rate != null) entry.cr = m.store_listing_conversion_rate;
      if (m.peer_benchmark_cr != null) entry.peerCr = m.peer_benchmark_cr;
      byApp.set(name, entry);
    }
    return Array.from(byApp.entries())
      .map(([app, d]) => {
        const cr = d.cr;
        const vsPeers = cr - d.peerCr;
        const fmtVisitors = d.visitors >= 1000000 ? `${(d.visitors / 1000000).toFixed(1)}M` : d.visitors >= 1000 ? `${Math.round(d.visitors / 1000)}K` : String(d.visitors);
        return { app, visitors: fmtVisitors, cr: `${cr.toFixed(1)}%`, vsPeers: `${vsPeers >= 0 ? '+' : ''}${vsPeers.toFixed(1)}%`, isPositive: vsPeers >= 0 };
      })
      .slice(0, 10);
  })();

  // GEO scan — low CR markets
  const geoScanRows = (() => {
    return metrics
      .filter((m) => m.country_code && (m.store_listing_conversion_rate ?? 100) < 20 && (m.store_listing_visitors ?? 0) > 10000)
      .map((m) => ({
        appGeo: `${m.app?.app_name ?? m.app_id} - ${m.country_code}`,
        visitors: `${Math.round((m.store_listing_visitors ?? 0) / 1000)}K`,
        cr: `${(m.store_listing_conversion_rate ?? 0).toFixed(1)}%`,
        note: 'CR dưới ngưỡng',
        action: 'Tối ưu bản địa hóa store listing',
      }))
      .slice(0, 5);
  })();

  const minCr = Math.min(...trendPoints.map(p => p.cr), 0) - 2;
  const maxCr = Math.max(...trendPoints.map(p => p.cr), 1) + 4;
  const range = maxCr - minCr || 1;
  const svgW = 1000;
  const svgH = 220;
  const padLeft = 35;
  const padRight = 0;
  const padTop = 25;
  const padBottom = 25;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const pts = trendPoints.map((pt, idx) => {
    const x = padLeft + (idx / Math.max(trendPoints.length - 1, 1)) * chartW;
    const y = padTop + chartH - ((pt.cr - minCr) / range) * chartH;
    return { x, y };
  });

  const smoothLineD = buildSmoothSplinePath(pts);
  const bottomY = padTop + chartH;
  const smoothAreaD = pts.length > 1 ? `${smoothLineD} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z` : '';

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header Strip & Sub-nav Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Creative Lutech Release Ops</h1>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-muted border border-border">{headerStats.totalApps} apps</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded bg-muted border border-border">{headerStats.totalAccounts} dev accounts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      <ReleaseOpsNavTabs />

      {/* ─── Main Chart: CR trend — Home AI · US · organic search ─── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">CR trend &mdash; Home AI &bull; US &bull; organic search</h3>
            <span className="text-xs text-muted-foreground block">
              Nguồn: GCS store_performance export &bull; <strong className="text-amber-600 font-semibold">vạch cam = ngày thay listing (từ release timeline)</strong>
            </span>
          </div>
        </div>

        {/* Smooth Area Line Chart SVG */}
        <div className="relative border-t border-border pt-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto max-h-64" preserveAspectRatio="none">
            <defs>
              <linearGradient id="crGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#047857" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[22, 24, 28, 32, 36].map((tick) => {
              const y = padTop + chartH - ((tick - minCr) / range) * chartH;
              return (
                <g key={tick}>
                  <line x1={padLeft} y1={y} x2={svgW} y2={y} stroke="currentColor" strokeDasharray="2 2" className="text-border" strokeWidth="1" />
                  <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Under Curve */}
            <path d={smoothAreaD} fill="url(#crGradient)" />

            {/* Smooth Spline Curve Line */}
            <path d={smoothLineD} fill="none" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />



            {/* X-Axis Date Labels */}
            {trendPoints.map((pt, idx) => {
              const x = padLeft + (idx / Math.max(trendPoints.length - 1, 1)) * chartW;
              return (
                <text key={pt.date} x={x} y={svgH - 6} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
                  {pt.date}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ─── Bottom Row: CR theo app & GEO scan ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Table 1: CR theo app - 28 ngày */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">CR theo app &mdash; 28 ngày</h3>
            <span className="text-xs text-muted-foreground block">
              Visitors &rarr; acquisitions, so với peer benchmark của Google
            </span>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">APP</th>
                  <th className="py-2.5 px-3 font-mono">VISITORS</th>
                  <th className="py-2.5 px-3 font-mono">CR</th>
                  <th className="py-2.5 px-3 font-mono">VS PEERS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {crAppRows.map(row => (
                  <tr key={row.app} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-foreground">{row.app}</td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{row.visitors}</td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{row.cr}</td>
                    <td className={`py-2.5 px-3 font-bold ${row.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.vsPeers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: GEO scan - visitors cao, CR thấp */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">GEO scan &mdash; visitors cao, CR thấp</h3>
            <span className="text-xs text-muted-foreground block">
              Ứng viên custom store listing / sửa bản dịch
            </span>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">APP &bull; GEO</th>
                  <th className="py-2.5 px-3 font-mono">VISITORS</th>
                  <th className="py-2.5 px-3 font-mono">CR</th>
                  <th className="py-2.5 px-3">CẢNH BÁO / GỢI Ý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {geoScanRows.map(row => (
                  <tr
                    key={row.appGeo}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setActiveWarningDetail({ appGeo: row.appGeo, reason: row.note, suggestedAction: row.action })}
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground">{row.appGeo}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">{row.visitors}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600">{row.cr}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {row.note}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warning Detail Centered Modal Popup */}
      {activeWarningDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Chi tiết Gợi ý GEO &mdash; {activeWarningDetail.appGeo}</h3>
              <button
                onClick={() => setActiveWarningDetail(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted font-semibold text-base"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1">
                <span className="font-bold text-amber-700 dark:text-amber-400 block">Hiện trạng / Vấn đề:</span>
                <p className="text-muted-foreground">{activeWarningDetail.reason}</p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">Đề xuất Hành động:</span>
                <p className="text-muted-foreground">{activeWarningDetail.suggestedAction}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setActiveWarningDetail(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
