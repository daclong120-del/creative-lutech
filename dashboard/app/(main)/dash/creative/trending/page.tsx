"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getTrending, getAdvertisers } from "@/lib/actions/creative.actions";
import type { CreativeAd, CreativeAdvertiser } from "@/types";
import { PlatformBadge } from "@/components/dashboard/Badges";
import CreativeDetailView from "@/components/dashboard/CreativeDetailView";
import { formatNumber, timeAgo, cn } from "@/lib/utils";

// Dynamic SVG Sparkline Component
function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length < 2) return <div className="text-[10px] text-muted-foreground">-</div>;
  const counts = data.map((d) => d.count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const range = max - min || 1;
  
  const width = 100;
  const height = 24;
  const padding = 2;
  const usableHeight = height - padding * 2;
  const step = width / (data.length - 1);
  
  const points = data
    .map((d, i) => {
      const x = i * step;
      const y = height - padding - ((d.count - min) / range) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function TrendingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewId = searchParams.get("viewId") || "";

  const [ads, setAds] = useState<CreativeAd[]>([]);
  const [advertisers, setAdvertisers] = useState<CreativeAdvertiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [adsResult, advertisersResult] = await Promise.all([
          getTrending(100),
          getAdvertisers({ limit: 100 }),
        ]);
        setAds(adsResult);
        setAdvertisers(advertisersResult.data);
      } catch (err) {
        console.error("Error loading creative data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const [period, setPeriod] = useState("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const filtered = ads.filter((ad) => {
    const matchesPlatform = selectedPlatform === "all" || ad.platform === selectedPlatform;
    return matchesPlatform;
  });

  // Sort by view count descending for trending ranking
  const ranked = [...filtered].sort((a, b) => b.view_count - a.view_count);

  const top3 = ranked.slice(0, 3);

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-500 text-white shadow-amber-500/30";
      case 2:
        return "bg-zinc-400 text-white shadow-zinc-400/30";
      case 3:
        return "bg-amber-700 text-white shadow-amber-700/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return "🥇 TOP 1";
    if (rank === 2) return "🥈 TOP 2";
    if (rank === 3) return "🥉 TOP 3";
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs text-muted-foreground">
        Đang tải dữ liệu Creative Hub...
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">BXH Creative — Xu hướng mới nhất</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Bảng xếp hạng các ad creative có lượt tiếp cận và tương tác nhanh nhất</p>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card rounded-xl border border-border p-4">
        {/* Period selection */}
        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
          {[
            { value: "7d", label: "7 Ngày" },
            { value: "30d", label: "30 Ngày" },
            { value: "90d", label: "90 Ngày" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                period === item.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Platform filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedPlatform("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              selectedPlatform === "all"
                ? "bg-foreground border-foreground text-background"
                : "bg-background border-border text-foreground hover:bg-muted"
            )}
          >
            Tất cả
          </button>
          {["douyin", "kuaishou", "xhs", "bilibili", "weibo", "zhihu", "tieba", "tiktok"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
                selectedPlatform === p
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border text-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 Featured Area */}
      {top3.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <svg className="size-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Top 3 Tiêu Điểm
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3.map((ad, idx) => {
              const rank = idx + 1;
              const adv = advertisers.find((a) => a.id === ad.author_id);
              return (
                <div
                  key={ad.id}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-[border-color,box-shadow] duration-250 ease-out flex flex-col relative"
                >
                  {/* Rank Badge overlay */}
                  <div className={cn(
                    "absolute top-3 right-3 z-20 px-2 py-0.5 rounded text-[10px] font-bold shadow-md uppercase tracking-wider",
                    getRankBadgeStyle(rank)
                  )}>
                    {getRankLabel(rank)}
                  </div>

                  {/* Aspect Ratio 16/9 for wide layout */}
                  <Link
                    href={`/dash/creative/${ad.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCardClick(ad.id);
                    }}
                    className="block relative aspect-[16/9] bg-zinc-950/90 dark:bg-black overflow-hidden border-b border-border"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none text-zinc-400 dark:text-zinc-600 transition-transform duration-250 ease-out group-hover:scale-[1.03]">
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
                    <div className="space-y-1">
                      <Link
                        href={`/dash/creative/${ad.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleCardClick(ad.id);
                        }}
                        className="block"
                      >
                        <p className="text-xs text-foreground font-semibold line-clamp-2 hover:text-primary transition-colors leading-relaxed">
                          {ad.caption || "Không có chú thích."}
                        </p>
                      </Link>
                    </div>

                    <div className="space-y-2.5 border-t border-border/55 pt-2.5">
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-mono">
                        <div>
                          <span className="text-xs text-foreground font-bold block">{formatNumber(ad.view_count)}</span>
                          <span className="text-[8px] text-muted-foreground uppercase">Views</span>
                        </div>
                        <div>
                          <span className="text-xs text-foreground font-bold block">{formatNumber(ad.like_count)}</span>
                          <span className="text-[8px] text-muted-foreground uppercase">Likes</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] border-t border-border/30 pt-2">
                        <Link
                          href={`/dash/creative/advertisers/${ad.author_id}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          {adv ? adv.nickname : "Advertiser"}
                        </Link>
                        <span className="text-muted-foreground shrink-0">{timeAgo(ad.published_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard DataTable */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Bảng Xếp Hạng</h3>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Tự động cập nhật 24h</span>
        </div>

        {ranked.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold text-muted-foreground bg-muted/20 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4 w-20">Creative</th>
                  <th className="p-4">Nội dung</th>
                  <th className="p-4 w-28">Nền tảng</th>
                  <th className="p-4 w-44">Advertiser</th>
                  <th className="p-4 w-28 text-right">Views</th>
                  <th className="p-4 w-28 text-right">Likes</th>
                  <th className="p-4 w-36 text-center">Xu hướng 7 ngày</th>
                  <th className="p-4 w-28 text-right">Ngày đăng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {ranked.map((ad, idx) => {
                  const rank = idx + 1;
                  const adv = advertisers.find((a) => a.id === ad.author_id);
                  return (
                    <tr
                      key={ad.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => handleCardClick(ad.id)}
                    >
                      <td className="p-4 text-center font-bold font-mono">
                        <span className={cn(
                          "inline-flex items-center justify-center size-5 rounded text-[10px]",
                          rank <= 3 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        )}>
                          {rank}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="w-12 aspect-[16/9] rounded bg-muted/80 border border-border/60 overflow-hidden relative select-none flex items-center justify-center text-[8px] text-muted-foreground font-semibold uppercase">
                          Thumbnail
                        </div>
                      </td>
                      <td className="p-4 max-w-[280px]">
                        <p className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {ad.caption}
                        </p>
                      </td>
                      <td className="p-4">
                        <PlatformBadge platform={ad.platform} />
                      </td>
                      <td className="p-4">
                        {adv ? (
                          <Link
                            href={`/dash/creative/advertisers/${ad.author_id}`}
                            className="text-primary hover:underline font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {adv.nickname}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-foreground">
                        {formatNumber(ad.view_count)}
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        {formatNumber(ad.like_count)}
                      </td>
                      <td className="p-4 text-center flex justify-center items-center">
                        <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
                          <Sparkline data={ad.views_history} />
                        </div>
                      </td>
                      <td className="p-4 text-right text-muted-foreground shrink-0 font-mono">
                        {timeAgo(ad.published_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            Không tìm thấy dữ liệu xu hướng nào.
          </div>
        )}
      </div>

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

export default function TrendingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải bảng xếp hạng...</div>}>
      <TrendingPageContent />
    </Suspense>
  );
}
