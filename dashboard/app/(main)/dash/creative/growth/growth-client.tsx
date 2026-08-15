"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CreativeCard from "@/components/dashboard/CreativeCard";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import CreativeDetailView from "@/components/dashboard/CreativeDetailView";
import { cn } from "@/lib/utils";
import type { CreativeAd } from "@/types";

interface GrowthClientProps {
  initialData: CreativeAd[];
  initialFilters: {
    platform: string;
    sortBy: string;
  };
}

export default function GrowthClient({ initialData, initialFilters }: GrowthClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isFirstRender = useRef(true);
  const [isPending, startTransition] = useTransition();

  const viewId = searchParams.get("viewId") || "";
  const currentQueryString = searchParams.toString();

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

  const [comparisonPeriod, setComparisonPeriod] = useState("7d_vs_7d");
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialFilters.platform);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);

  // Synchronize state filters to URL
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (selectedPlatform !== "all") {
      params.set("platform", selectedPlatform);
    }
    params.set("sortBy", sortBy);

    const currentParams = new URLSearchParams(currentQueryString);
    const currentViewId = currentParams.get("viewId");
    if (currentViewId) params.set("viewId", currentViewId);

    const nextQueryString = params.toString();
    if (nextQueryString === currentQueryString) {
      return;
    }

    startTransition(() => {
      router.push(`?${nextQueryString}`, { scroll: false });
    });
  }, [selectedPlatform, sortBy, router, currentQueryString]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Tăng trưởng nhanh</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Phát hiện các mẫu quảng cáo đang bứt phá về tương tác so với kỳ trước</p>
      </div>

      {/* Filter panel */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Comparison period */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Kỳ so sánh</span>
            <DropdownSelect
              value={comparisonPeriod}
              onChange={setComparisonPeriod}
              options={[
                { value: "7d_vs_7d", label: "7 ngày gần nhất vs 7 ngày trước" },
                { value: "30d_vs_30d", label: "30 ngày gần nhất vs 30 ngày trước" },
              ]}
              fullWidth
            />
          </div>

          {/* Metric Sort */}
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Sắp xếp theo chỉ số</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("growth_pct_desc")}
                className={cn(
                  "flex-1 h-8 rounded-lg text-xs font-semibold border transition-colors",
                  sortBy === "growth_pct_desc"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-background border-border text-foreground hover:bg-muted"
                )}
              >
                Tỷ lệ tăng trưởng (%)
              </button>
              <button
                onClick={() => setSortBy("growth_abs_desc")}
                className={cn(
                  "flex-1 h-8 rounded-lg text-xs font-semibold border transition-colors",
                  sortBy === "growth_abs_desc"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-background border-border text-foreground hover:bg-muted"
                )}
              >
                Tăng trưởng tuyệt đối
              </button>
            </div>
          </div>
        </div>

        {/* Platform chips */}
        <div className="space-y-1.5 pt-2 border-t border-border/55">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Nền tảng</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedPlatform("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
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
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
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
      </div>

      {/* Grid creative results */}
      {isPending ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          Đang tải dữ liệu tăng trưởng...
        </div>
      ) : initialData.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {initialData.map((ad) => {
            const nickname = ad.author?.nickname || "Không rõ";
            return (
              <CreativeCard
                key={ad.id}
                creative={ad}
                advertiserName={nickname}
                onClick={() => handleCardClick(ad.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <svg className="size-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground">Chưa có dữ liệu tăng trưởng</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tiếp tục chạy crawler để thu thập thêm dữ liệu so sánh cho kỳ gần nhất.
          </p>
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
