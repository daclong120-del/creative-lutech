"use client";

import React, { useState, useEffect } from "react";
import { PlatformBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { getAuthors } from "@/lib/actions/data.actions";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import type { CrawledAuthor } from "@/types";

export default function AuthorsPage() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [location, setLocation] = useState("all");
  const [minFans, setMinFans] = useState(0);
  const [authors, setAuthors] = useState<CrawledAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getAuthors({ limit: 100 });
      setAuthors(result.data);
      setLoading(false);
    }
    load();
  }, []);

  // Extract unique locations for filter
  const locations = Array.from(new Set(authors.map((a) => a.ip_location).filter(Boolean)));

  const filtered = authors.filter((a) => {
    const matchesSearch =
      a.nickname.toLowerCase().includes(search.toLowerCase()) ||
      a.platform_uid.toLowerCase().includes(search.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platform === "all" || a.platform === platform;
    const matchesLocation = location === "all" || a.ip_location === location;
    const matchesFans = a.fans_count >= minFans;
    return matchesSearch && matchesPlatform && matchesLocation && matchesFans;
  });

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Khám phá Tác giả & KOL</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Danh sách creator/KOL được phát hiện và thu thập</p>
        </div>
        <button className="h-8 px-3 text-xs font-medium rounded-lg bg-card border border-border text-card-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Xuất dữ liệu Excel
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground">Tìm kiếm tên / ID / Bio</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="w-full h-8 px-3 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground">Nền tảng</span>
          <DropdownSelect
            value={platform}
            onChange={setPlatform}
            options={[
              { value: "all", label: "Tất cả nền tảng" },
              { value: "douyin", label: "Douyin" },
              { value: "xhs", label: "Tiểu Hồng Thư" },
              { value: "bilibili", label: "Bilibili" },
              { value: "weibo", label: "Weibo" },
              { value: "kuaishou", label: "Kuaishou" },
              { value: "tiktok", label: "TikTok" }
            ]}
            fullWidth
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground">Địa điểm IP</span>
          <DropdownSelect
            value={location}
            onChange={setLocation}
            options={[
              { value: "all", label: "Tất cả địa điểm" },
              ...locations.map((loc) => ({ value: loc, label: loc }))
            ]}
            fullWidth
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground flex justify-between">
            <span>Fans tối thiểu</span>
            <span className="text-primary font-mono tabular-nums">{formatNumber(minFans)}</span>
          </span>
          <input
            type="range"
            min="0"
            max="2000000"
            step="50000"
            value={minFans}
            onChange={(e) => setMinFans(Number(e.target.value))}
            className="w-full h-8 accent-primary cursor-pointer"
          />
        </label>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          Đang tải danh sách tác giả...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((author) => (
            <div key={author.id} className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header card info */}
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0 uppercase">
                    {author.nickname.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-card-foreground truncate leading-snug">{author.nickname}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">UID: {author.platform_uid}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={author.platform} />
                  {author.ip_location && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      📍 {author.ip_location}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                  {author.description || "Chưa có mô tả chi tiết."}
                </p>
              </div>

              {/* Metrics & Actions */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="text-[10px] leading-tight">
                  <p className="text-muted-foreground">Người theo dõi</p>
                  <p className="text-xs font-bold text-foreground mt-0.5 font-mono tabular-nums">{formatNumber(author.fans_count)}</p>
                </div>
                <Link href={`/dash/data/posts?author=${author.platform_uid}`} className="h-7 px-2.5 text-[10px] font-medium rounded bg-primary/10 text-primary hover:bg-primary/15 transition-colors flex items-center gap-1">
                  Xem bài viết
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
              Không tìm thấy tác giả nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
