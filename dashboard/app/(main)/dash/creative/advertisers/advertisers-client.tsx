"use client";

import React, { useState, useEffect, useMemo, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatformBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import type { Platform, CreativeAdvertiser } from "@/types";

interface AdvertisersClientProps {
  initialData: CreativeAdvertiser[];
  initialTotal: number;
  initialFilters: {
    q: string;
    platform: Platform[];
    sortBy: string;
  };
}

const ADVERTISER_PLATFORMS: Platform[] = ["douyin", "xhs", "bilibili", "weibo", "kuaishou", "zhihu", "tieba", "tiktok"];

export default function AdvertisersClient({ initialData, initialTotal, initialFilters }: AdvertisersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const [isPending, startTransition] = useTransition();
  const currentQueryString = searchParams.toString();

  const [search, setSearch] = useState(initialFilters.q);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(initialFilters.platform);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);

  const [prevFilters, setPrevFilters] = useState(initialFilters);
  const platformKey = initialFilters.platform.join(",");
  const prevPlatformKey = prevFilters.platform.join(",");

  if (initialFilters.q !== prevFilters.q || 
      platformKey !== prevPlatformKey || 
      initialFilters.sortBy !== prevFilters.sortBy) {
    setPrevFilters(initialFilters);
    setSearch(initialFilters.q);
    setSelectedPlatforms(initialFilters.platform);
    setSortBy(initialFilters.sortBy);
  }

  // Synchronize state filters to URL
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedPlatforms.length > 0) {
      params.set("platform", selectedPlatforms.join(","));
    }
    params.set("sortBy", sortBy);

    const nextQueryString = params.toString();
    if (nextQueryString === currentQueryString) {
      return;
    }

    startTransition(() => {
      router.push(`?${nextQueryString}`, { scroll: false });
    });
  }, [search, selectedPlatforms, sortBy, router, currentQueryString]);

  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleExport = () => {
    alert("Tính năng đang được phát triển: Xuất danh sách advertiser dưới dạng CSV/Excel.");
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedPlatforms([]);
    setSortBy("creative_count_desc");
  };

  const displayedData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filteredData = initialData.filter((adv) => {
      const matchesSearch =
        !normalizedSearch ||
        adv.nickname.toLowerCase().includes(normalizedSearch) ||
        adv.description.toLowerCase().includes(normalizedSearch) ||
        adv.platform_uid.toLowerCase().includes(normalizedSearch);
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(adv.platform);
      return matchesSearch && matchesPlatform;
    });

    return filteredData.sort((a, b) => {
      if (sortBy === "total_views_desc") return b.total_views - a.total_views;
      if (sortBy === "last_active_desc") {
        return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
      }
      return b.creative_count - a.creative_count;
    });
  }, [initialData, search, selectedPlatforms, sortBy]);

  const hasActiveFilters = search.trim() !== "" || selectedPlatforms.length > 0 || sortBy !== "creative_count_desc";

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Phân tích Advertiser</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Quản lý và thống kê chi tiết các đơn vị sản xuất và phân phối nội dung quảng cáo</p>
        </div>
        <button
          onClick={handleExport}
          className="h-8 px-3 text-xs font-medium rounded-lg bg-card border border-border text-card-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Xuất danh sách
        </button>
      </div>

      {/* Filter and controls */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Tìm kiếm</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên advertiser..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Platforms select */}
          <div className="md:col-span-2 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Nền tảng</span>
            <div className="flex flex-wrap gap-2">
              {ADVERTISER_PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 capitalize",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sorting selection bar */}
        <div className="pt-2 border-t border-border/55 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Sắp xếp theo</span>
            <DropdownSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "creative_count_desc", label: "Số creative nhiều nhất" },
                { value: "total_views_desc", label: "Tổng views cao nhất" },
                { value: "last_active_desc", label: "Hoạt động gần đây nhất" },
              ]}
              fullWidth
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-8 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors self-end sm:self-auto"
            >
              Xóa lọc
            </button>
          )}
          <div className="text-xs text-muted-foreground self-end sm:self-auto font-mono">
            Kết quả: <span className="font-bold text-foreground">{displayedData.length}</span>
            {initialTotal > displayedData.length && (
              <span className="text-muted-foreground"> / {formatNumber(initialTotal)}</span>
            )} advertisers
          </div>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {displayedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={cn("w-full text-left border-collapse text-xs transition-opacity", isPending && "opacity-70")}>
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold text-muted-foreground bg-muted/20 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">Avatar</th>
                  <th className="p-4">Tên Advertiser</th>
                  <th className="p-4 w-28">Nền tảng</th>
                  <th className="p-4 w-28 text-right">Số Creative</th>
                  <th className="p-4 w-28 text-right">Tổng Views</th>
                  <th className="p-4 w-28 text-right">Tổng Likes</th>
                  <th className="p-4 w-32 text-right">Hoạt động cuối</th>
                  <th className="p-4 w-20 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {displayedData.map((adv) => (
                  <tr
                    key={adv.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/dash/creative/advertisers/${adv.id}`)}
                  >
                    <td className="p-4 text-center">
                      <div className="size-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] uppercase select-none mx-auto border border-border">
                        {adv.nickname.charAt(0)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/dash/creative/advertisers/${adv.id}`}
                          className="font-bold text-foreground group-hover:text-primary transition-colors text-xs hover:underline block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {adv.nickname}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[320px] mt-0.5" title={adv.description}>
                          {adv.description || "Không có mô tả."}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <PlatformBadge platform={adv.platform} />
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-foreground">
                      {formatNumber(adv.creative_count)}
                    </td>
                    <td className="p-4 text-right font-mono text-muted-foreground">
                      {formatNumber(adv.total_views)}
                    </td>
                    <td className="p-4 text-right font-mono text-muted-foreground">
                      {formatNumber(adv.total_likes)}
                    </td>
                    <td className="p-4 text-right text-muted-foreground shrink-0 font-mono">
                      {timeAgo(adv.last_active_at)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dash/creative/advertisers/${adv.id}`}
                          className="px-2 py-1 bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground font-semibold text-[10px] rounded transition-colors"
                          title="Xem hồ sơ"
                        >
                          Hồ sơ
                        </Link>
                        <Link
                          href={`/dash/creative/search?q=${encodeURIComponent(adv.nickname)}`}
                          className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] rounded transition-colors"
                          title="Xem creatives"
                        >
                          Creatives
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-card p-12 text-center text-muted-foreground space-y-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-foreground">Không tìm thấy advertiser nào</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dữ liệu advertiser sẽ tự động được thêm khi crawler thu thập thêm creatives.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
