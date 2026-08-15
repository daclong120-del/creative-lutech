"use client";

import React, { useState, useMemo } from "react";
import { PlatformBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { CreativeAd, CreativeAdvertiser } from "@/types";

interface CalendarClientProps {
  initialCreatives: CreativeAd[];
  initialAdvertisers: CreativeAdvertiser[];
}

export default function CalendarClient({ initialCreatives, initialAdvertisers }: CalendarClientProps) {
  // Calendar date view (default July 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 6 = July (0-indexed)
  
  // Filters state
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState("all");
  
  // Slide drawer state
  const [selectedDay, setSelectedDay] = useState<{ day: number; month: number; year: number } | null>(null);

  const [creatives] = useState<CreativeAd[]>(initialCreatives);
  const [advertisers] = useState<CreativeAdvertiser[]>(initialAdvertisers);

  // Month names translation
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate days for 6-week calendar grid (42 days)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotal = new Date(currentYear, currentMonth, 0).getDate();
    
    const list = [];
    
    // Padding from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      list.push({
        day: prevMonthTotal - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      list.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }
    
    // Padding for next month
    const nextPadding = 42 - list.length;
    for (let i = 1; i <= nextPadding; i++) {
      list.push({
        day: i,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false
      });
    }
    
    return list;
  }, [currentYear, currentMonth]);

  // Filter ads based on platform & advertiser selection
  const filteredAds = useMemo(() => {
    return creatives.filter((ad) => {
      const matchesPlatform = selectedPlatform === "all" || ad.platform === selectedPlatform;
      const matchesAdvertiser = selectedAdvertiser === "all" || ad.author_id === selectedAdvertiser;
      return matchesPlatform && matchesAdvertiser;
    });
  }, [creatives, selectedPlatform, selectedAdvertiser]);

  // Group filtered ads by absolute date key (d-m-y)
  const adsByDate = useMemo(() => {
    const map: Record<string, CreativeAd[]> = {};
    filteredAds.forEach((ad) => {
      const d = new Date(ad.published_at);
      const key = `${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(ad);
    });
    return map;
  }, [filteredAds]);

  // Get ads for the selected day in drawer
  const drawerAds = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.day}-${selectedDay.month}-${selectedDay.year}`;
    return adsByDate[key] || [];
  }, [selectedDay, adsByDate]);

  const handleExport = () => {
    alert("Tính năng đang được phát triển: Xuất lịch tiếp thị CSV/Excel.");
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto space-y-6 relative">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Lịch tiếp thị</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Theo dõi lịch phát hành quảng cáo và phân bố chiến dịch theo thời gian</p>
        </div>
        <button
          onClick={handleExport}
          className="h-8 px-3 text-xs font-medium rounded-lg bg-card border border-border text-card-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Xuất lịch
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="h-8 w-8 flex items-center justify-center border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-colors"
          >
            ◀
          </button>
          <span className="text-sm font-bold text-foreground min-w-[120px] text-center">
            {monthNames[currentMonth]}, {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="h-8 w-8 flex items-center justify-center border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Platform Select */}
          <div className="w-full sm:w-44">
            <DropdownSelect
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              options={[
                { value: "all", label: "Tất cả nền tảng" },
                { value: "douyin", label: "Douyin" },
                { value: "kuaishou", label: "Kuaishou" },
                { value: "xhs", label: "XHS" },
                { value: "bilibili", label: "Bilibili" },
                { value: "weibo", label: "Weibo" },
                { value: "zhihu", label: "Zhihu" },
                { value: "tieba", label: "Tieba" },
                { value: "tiktok", label: "TikTok" }
              ]}
              fullWidth
            />
          </div>

          {/* Advertiser Select */}
          <div className="w-full sm:w-56">
            <DropdownSelect
              value={selectedAdvertiser}
              onChange={setSelectedAdvertiser}
              options={[
                { value: "all", label: "Tất cả Advertiser" },
                ...advertisers.map((adv) => ({ value: adv.id, label: adv.nickname }))
              ]}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Calendar Headers */}
        <div className="grid grid-cols-7 border-b border-border text-center text-[10px] font-bold text-muted-foreground uppercase bg-muted/20 py-2">
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
          <div>CN</div>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60 bg-muted/5 border-l border-t border-border/10">
          {calendarDays.map((d, index) => {
            const key = `${d.day}-${d.month}-${d.year}`;
            const dayAds = adsByDate[key] || [];
            
            const isToday =
              new Date().getDate() === d.day &&
              new Date().getMonth() === d.month &&
              new Date().getFullYear() === d.year;

            return (
              <div
                key={index}
                onClick={() => dayAds.length > 0 && setSelectedDay(d)}
                className={cn(
                  "min-h-[100px] p-2 flex flex-col justify-between transition-colors hover:bg-muted/30 cursor-pointer",
                  !d.isCurrentMonth ? "opacity-35 hover:opacity-50" : "",
                  dayAds.length > 0 ? "bg-card" : "bg-muted/5 hover:bg-muted/10"
                )}
              >
                {/* Day number & Today Highlight */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold font-mono size-5 flex items-center justify-center rounded-full",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {d.day}
                  </span>
                  
                  {dayAds.length > 0 && (
                    <span className="text-[9px] bg-primary/10 text-primary font-bold px-1 py-0.2 rounded">
                      {dayAds.length}
                    </span>
                  )}
                </div>

                {/* Day Thumbnails */}
                <div className="flex items-center gap-1 mt-2">
                  {dayAds.slice(0, 2).map((ad) => (
                    <div
                      key={ad.id}
                      className="size-7 rounded bg-muted border border-border/50 overflow-hidden relative shrink-0"
                      title={ad.caption}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-[7px] text-muted-foreground uppercase font-bold select-none">
                        Ad
                      </div>
                    </div>
                  ))}
                  {dayAds.length > 2 && (
                    <span className="text-[8px] text-muted-foreground font-mono font-bold">
                      +{dayAds.length - 2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide Drawer for Selected Day Details */}
      {selectedDay && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDay(null)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-[420px] bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Creative ngày {selectedDay.day}/{selectedDay.month + 1}/{selectedDay.year}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tìm thấy {drawerAds.length} creative được xuất bản</p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="size-6 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerAds.map((ad) => {
                const nickname = ad.author?.nickname || "Advertiser";
                return (
                  <div
                    key={ad.id}
                    className="p-3 bg-muted/20 border border-border/60 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl flex gap-3 cursor-pointer group transition-colors"
                    onClick={() => window.location.href = `/dash/creative/${ad.id}`}
                  >
                    {/* Tiny thumbnail */}
                    <div className="w-14 aspect-[9/16] rounded bg-muted border border-border shrink-0 flex items-center justify-center text-[7px] text-muted-foreground select-none font-bold uppercase relative">
                      ad
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <PlatformBadge platform={ad.platform} />
                          <span className="text-[9px] text-muted-foreground">{timeAgo(ad.published_at)}</span>
                        </div>
                        <p className="text-[11px] text-foreground font-semibold line-clamp-2 mt-1.5 leading-relaxed group-hover:text-primary transition-colors">
                          {ad.caption}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] border-t border-border/30 pt-1.5 mt-2">
                        <span className="font-mono text-muted-foreground">Views: {formatNumber(ad.view_count)}</span>
                        <span className="text-primary font-bold">{nickname}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
