"use client";

import React, { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import PlatformHealthCard from "@/components/dashboard/PlatformHealthCard";
import { PlatformBadge, StatusBadge } from "@/components/dashboard/Badges";
import {
  getDashboardMetrics, getPlatformDistribution,
  getPlatformHealth, getPostsPerDay
} from "@/lib/actions/dashboard.actions";
import { getTasks } from "@/lib/actions/crawler.actions";
import type { DashboardMetrics, PlatformHealthItem } from "@/lib/services/dashboard.service";
import { formatNumber, timeAgo } from "@/lib/utils";
import Link from "next/link";
import type { CrawlerTask } from "@/types";

// ─── SVG Icons inline ────────────────────────────────────────
const DocIcon = () => <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>;
const UsersIcon = () => <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const PlayIcon = () => <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>;
const KeyIcon = () => <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>;

// ─── Simple Line Chart (SVG thuần) ───────────────────────────
function SimpleLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] border border-dashed border-border rounded-xl text-xs text-muted-foreground">
        Không có dữ liệu xu hướng trong 7 ngày qua
      </div>
    );
  }
  const maxVal = Math.max(...data.map((d) => d.count));
  const minVal = Math.min(...data.map((d) => d.count));
  const range = maxVal - minVal || 1;
  const w = 600;
  const h = 200;
  const padX = 50;
  const padY = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((d.count - minVal) / range) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padY + chartH - f * chartH;
        const val = Math.round(minVal + f * range);
        return (
          <g key={f}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={padX - 8} y={y + 3} textAnchor="end" className="text-muted-foreground fill-current" fontSize="10">{val}</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaD} fill="rgb(0, 81, 195)" fillOpacity="0.08" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="rgb(0, 81, 195)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + Labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="rgb(0, 81, 195)" stroke="white" strokeWidth="2" />
          <text x={p.x} y={h - 8} textAnchor="middle" className="text-muted-foreground fill-current" fontSize="10">{p.date}</text>
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-current text-foreground" fontSize="9" fontWeight="600">{p.count}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Simple Donut Chart (SVG thuần) ──────────────────────────
function SimpleDonutChart({ data }: { data: { platform: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground w-full border border-dashed border-border rounded-xl">
        Chưa có dữ liệu bài viết
      </div>
    );
  }
  const cx = 100;
  const cy = 100;
  const r = 75;
  const r2 = 50;
  type Slice = { platform: string; count: number; color: string; startAngle: number; angle: number };

  const slices = data.reduce<Slice[]>((acc, item) => {
    const previous = acc.at(-1);
    const startAngleVal = previous ? previous.startAngle + previous.angle : -90;
    const angle = (item.count / total) * 360;
    acc.push({ ...item, startAngle: startAngleVal, angle });
    return acc;
  }, []);

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (sa: number, ea: number, outerR: number, innerR: number) => {
    const sx = cx + outerR * Math.cos(toRad(sa));
    const sy = cy + outerR * Math.sin(toRad(sa));
    const ex = cx + outerR * Math.cos(toRad(ea));
    const ey = cy + outerR * Math.sin(toRad(ea));
    const ix = cx + innerR * Math.cos(toRad(ea));
    const iy = cy + innerR * Math.sin(toRad(ea));
    const isx = cx + innerR * Math.cos(toRad(sa));
    const isy = cy + innerR * Math.sin(toRad(sa));
    const largeArc = ea - sa > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ex} ${ey} L ${ix} ${iy} A ${innerR} ${innerR} 0 ${largeArc} 0 ${isx} ${isy} Z`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="size-40 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.startAngle, s.startAngle + s.angle - 0.5, r, r2)} fill={s.color} className="transition-opacity hover:opacity-80" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-current text-foreground" fontSize="18" fontWeight="700">{formatNumber(total)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-current text-muted-foreground" fontSize="9">Tổng bài viết</text>
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {data.map((d) => (
          <div key={d.platform} className="flex items-center gap-2 text-[11px]">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-card-foreground font-medium truncate flex-1">{d.platform}</span>
            <span className="text-muted-foreground tabular-nums">{formatNumber(d.count)}</span>
            <span className="text-muted-foreground tabular-nums w-10 text-right">{((d.count / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────
export default function HomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPosts: 0, totalAuthors: 0, runningTasks: 0, pendingTasks: 0,
    activeAccounts: 0, totalAccounts: 0, postsTrend: 0, authorsTrend: 0,
  });
  const [distribution, setDistribution] = useState<{ platform: string; count: number; color: string }[]>([]);
  const [recentTasks, setRecentTasks] = useState<CrawlerTask[]>([]);
  const [postsPerDayData, setPostsPerDayData] = useState<{ date: string; count: number }[]>([]);
  const [platformHealthData, setPlatformHealthData] = useState<PlatformHealthItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          getDashboardMetrics(),
          getPlatformDistribution(),
          getTasks(),
          getPostsPerDay(),
          getPlatformHealth(),
        ]);

        const m = results[0].status === "fulfilled" ? results[0].value : null;
        const d = results[1].status === "fulfilled" ? results[1].value : [];
        const t = results[2].status === "fulfilled" ? results[2].value : [];
        const pData = results[3].status === "fulfilled" ? results[3].value : [];
        const hData = results[4].status === "fulfilled" ? results[4].value : [];

        if (m) {
          setMetrics(m);
        }
        setDistribution(d);
        setRecentTasks(t.slice(0, 5));
        setPostsPerDayData(pData);
        setPlatformHealthData(hData);
      } catch (err) {
        console.warn("Error loading home metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs text-muted-foreground">
        Đang tải thông tin tổng quan...
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Giám sát Crawler</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Giám sát sức khỏe crawler và dữ liệu thu thập</p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Bài viết đã cào"
          value={metrics.totalPosts}
          icon={<DocIcon />}
          color="blue"
          trend={metrics.postsTrend}
          className="animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 0 } as React.CSSProperties}
        />
        <MetricCard
          label="Tác giả / KOL"
          value={metrics.totalAuthors}
          icon={<UsersIcon />}
          color="violet"
          trend={metrics.authorsTrend}
          className="animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 1 } as React.CSSProperties}
        />
        <MetricCard
          label="Task đang chạy"
          value={metrics.runningTasks}
          icon={<PlayIcon />}
          color="emerald"
          subtitle={`${metrics.pendingTasks} đang chờ`}
          className="animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 2 } as React.CSSProperties}
        />
        <MetricCard
          label="Tài khoản hoạt động"
          value={`${metrics.activeAccounts}/${metrics.totalAccounts}`}
          icon={<KeyIcon />}
          color="orange"
          subtitle={`${metrics.totalAccounts > 0 ? Math.round((metrics.activeAccounts / metrics.totalAccounts) * 100) : 0}% tỷ lệ sống`}
          className="animate-in fade-in slide-in-from-bottom-2 stagger-item" style={{ '--stagger-index': 3 } as React.CSSProperties}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 stagger-item duration-300" style={{ '--stagger-index': 4 } as React.CSSProperties}>
        {/* Line Chart — spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-card-foreground mb-3">Bài viết cào mới theo ngày</h3>
          <SimpleLineChart data={postsPerDayData} />
        </div>
        {/* Donut Chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-card-foreground mb-3">Phân bổ theo nền tảng</h3>
          <SimpleDonutChart data={distribution.length > 0 ? distribution : [{platform:'loading',count:1,color:'#666'}]} />
        </div>
      </div>

      {/* Platform Health Cards */}
      <div className="animate-in fade-in slide-in-from-bottom-4 stagger-item duration-300" style={{ '--stagger-index': 5 } as React.CSSProperties}>
        <h3 className="text-xs font-semibold text-foreground mb-3">Sức khỏe Pool Cookie</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {platformHealthData.map((ph) => (
            <PlatformHealthCard key={ph.platform} {...ph} />
          ))}
        </div>
      </div>

      {/* Recent Tasks Feed */}
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 stagger-item duration-300" style={{ '--stagger-index': 6 } as React.CSSProperties}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-card-foreground">Hoạt động gần đây</h3>
          <Link href="/dash/tasks" className="text-[11px] text-primary hover:underline font-medium">
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Nền tảng</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Loại</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Target</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Trạng thái</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <tr key={task.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5"><PlatformBadge platform={task.platform} /></td>
                  <td className="px-4 py-2.5 capitalize text-card-foreground">{task.command}</td>
                  <td className="px-4 py-2.5 text-card-foreground max-w-[200px] truncate">{task.target}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{timeAgo(task.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
