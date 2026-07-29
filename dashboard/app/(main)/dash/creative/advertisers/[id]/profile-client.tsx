"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import CreativeCard from "@/components/dashboard/CreativeCard";
import { PlatformBadge } from "@/components/dashboard/Badges";
import CreativeDetailView from "@/components/dashboard/CreativeDetailView";
import { formatNumber, cn } from "@/lib/utils";
import type { CreativeAd, CreativeAdvertiser } from "@/types";

interface AdvertiserProfileClientProps {
  advertiser: CreativeAdvertiser;
  advertiserCreatives: CreativeAd[];
}

export default function AdvertiserProfileClient({ advertiser, advertiserCreatives }: AdvertiserProfileClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewId = searchParams.get("viewId") || "";

  const handleCardClick = (id: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("viewId", id);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("viewId");
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleNavigateModal = (targetId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("viewId", targetId);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const [activeTab, setActiveTab] = useState<"creatives" | "trends" >("creatives");

  // Aggregate views trend data for the chart
  const trendData = useMemo(() => {
    if (advertiserCreatives.length === 0) return [];
    
    // Aggregate by date
    const dateMap: Record<string, number> = {};
    advertiserCreatives.forEach((ad) => {
      ad.views_history.forEach((h: { date: string; count: number }) => {
        dateMap[h.date] = (dateMap[h.date] || 0) + h.count;
      });
    });

    // Sort by date chronologically
    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [advertiserCreatives]);

  const hasRealHistory = useMemo(() => {
    return advertiserCreatives.some((ad) => ad.historySource === "snapshot");
  }, [advertiserCreatives]);

  // Render SVG Line Chart for trends
  const renderTrendChart = () => {
    if (trendData.length < 2) {
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-xs bg-muted/10 rounded-xl border border-dashed border-border p-6">
          Chưa có đủ dữ liệu lịch sử để vẽ biểu đồ xu hướng.
        </div>
      );
    }

    const counts = trendData.map((d) => d.count);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const range = max - min || 1;

    const width = 800;
    const height = 300;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const step = chartWidth / (trendData.length - 1);

    const points = trendData
      .map((d, i) => {
        const x = paddingLeft + i * step;
        const y = paddingTop + chartHeight - ((d.count - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    // Generate area points for gradient fill
    const areaPoints = `${paddingLeft},${paddingTop + chartHeight} ${points} ${paddingLeft + chartWidth},${paddingTop + chartHeight}`;

    return (
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Tổng lượt xem theo thời gian</h3>
          {hasRealHistory ? (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider scale-[0.9]">Thực tế</span>
          ) : (
            <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider scale-[0.9]">Ước tính</span>
          )}
        </div>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-[300px] overflow-visible select-none">
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
              const y = paddingTop + chartHeight * val;
              const gridVal = max - (max - min) * val;
              return (
                <g key={idx} className="opacity-40 dark:opacity-20">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={paddingLeft + chartWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-border"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-muted-foreground"
                  >
                    {formatNumber(gridVal)}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            <polygon points={areaPoints} fill="url(#area-grad)" />

            {/* Line Path */}
            <polyline
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Data Dots */}
            {trendData.map((d, i) => {
              const x = paddingLeft + i * step;
              const y = paddingTop + chartHeight - ((d.count - min) / range) * chartHeight;
              return (
                <g key={i} className="group/dot cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    className="stroke-background stroke-2 transition-[r] group-hover/dot:r-6"
                  />
                  {/* Tooltip Overlay */}
                  <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200">
                    <rect
                      x={x - 50}
                      y={y - 35}
                      width="100"
                      height="24"
                      rx="4"
                      fill="black"
                      className="dark:fill-zinc-800"
                    />
                    <text
                      x={x}
                      y={y - 20}
                      textAnchor="middle"
                      fill="white"
                      className="text-[9px] font-mono font-bold"
                    >
                      {formatNumber(d.count)} views
                    </text>
                  </g>
                </g>
              );
            })}

            {/* X Axis Labels */}
            {trendData.map((d, i) => {
              if (i % Math.ceil(trendData.length / 6) !== 0 && i !== trendData.length - 1) return null;
              const x = paddingLeft + i * step;
              const formattedDate = new Date(d.date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
              return (
                <text
                  key={i}
                  x={x}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-muted-foreground"
                >
                  {formattedDate}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const handleExport = () => {
    alert("Tính năng đang được phát triển: Xuất tất cả creative của advertiser này.");
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dash/creative/advertisers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          <svg className="size-3 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Phân tích Advertiser
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex gap-4 items-start">
          <div className="size-16 rounded-xl bg-primary/10 border border-border flex items-center justify-center text-primary font-bold text-lg uppercase select-none">
            {advertiser.nickname.charAt(0)}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground leading-none">{advertiser.nickname}</h1>
              <PlatformBadge platform={advertiser.platform} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {advertiser.description || "Không có mô tả chi tiết."}
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Xuất creative
        </button>
      </div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Số Creative", value: formatNumber(advertiser.creative_count) },
          { label: "Tổng Lượt Xem", value: formatNumber(advertiser.total_views) },
          { label: "Tổng Lượt Thích", value: formatNumber(advertiser.total_likes) },
          { label: "Followers", value: formatNumber(advertiser.fans_count) },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</span>
            <p className="text-lg font-bold text-foreground mt-1 font-mono leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border/80 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("creatives")}
          className={cn(
            "pb-3 text-xs font-bold transition-colors relative",
            activeTab === "creatives" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Creative ({advertiserCreatives.length})
          {activeTab === "creatives" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={cn(
            "pb-3 text-xs font-bold transition-colors relative",
            activeTab === "trends" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Xu hướng hiệu suất
          {activeTab === "trends" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "creatives" ? (
          advertiserCreatives.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {advertiserCreatives.map((ad) => (
                <CreativeCard
                  key={ad.id}
                  creative={ad}
                  advertiserName={advertiser.nickname}
                  onClick={() => handleCardClick(ad.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Không tìm thấy creative nào của advertiser này.
            </div>
          )
        ) : (
          renderTrendChart()
        )}
      </div>

      {/* Bottom section: Top Featured Creative Row */}
      {advertiserCreatives.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            🥇 Top Creative Nổi Bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advertiserCreatives
              .sort((a, b) => b.view_count - a.view_count)
              .slice(0, 3)
              .map((ad) => (
                <div
                  key={ad.id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-[border-color,box-shadow] flex flex-col relative"
                >
                  <Link
                    href={`/dash/creative/${ad.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCardClick(ad.id);
                    }}
                    className="block relative aspect-[16/9] bg-zinc-950/90 dark:bg-black overflow-hidden border-b border-border"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none text-zinc-400 dark:text-zinc-600">
                      <svg className="size-8 mb-1.5 stroke-[1.2] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5z" />
                      </svg>
                      <span className="text-[9px] uppercase font-bold tracking-wider">{ad.platform} video</span>
                    </div>
                    <div className="absolute top-3 left-3 z-10">
                      <PlatformBadge platform={ad.platform} />
                    </div>
                  </Link>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <Link
                      href={`/dash/creative/${ad.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCardClick(ad.id);
                      }}
                      className="block"
                    >
                      <p className="text-xs text-foreground font-semibold line-clamp-2 hover:text-primary transition-colors leading-relaxed">
                        {ad.caption}
                      </p>
                    </Link>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-mono border-t border-border/55 pt-2.5">
                      <div>
                        <span className="text-xs text-foreground font-bold block">{formatNumber(ad.view_count)}</span>
                        <span className="text-[8px] text-muted-foreground uppercase">Views</span>
                      </div>
                      <div>
                        <span className="text-xs text-foreground font-bold block">{formatNumber(ad.like_count)}</span>
                        <span className="text-[8px] text-muted-foreground uppercase">Likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal Creative Detail View */}
      {viewId && (
        <CreativeDetailView
          id={viewId}
          isModal={true}
          onClose={handleCloseModal}
          onNavigate={handleNavigateModal}
        />
      )}
    </div>
  );
}
