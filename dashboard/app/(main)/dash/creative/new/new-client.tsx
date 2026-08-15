"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CreativeCard from "@/components/dashboard/CreativeCard";
import Pagination from "@/components/dashboard/Pagination";
import CreativeDetailView from "@/components/dashboard/CreativeDetailView";
import { cn } from "@/lib/utils";
import type { CreativeAd } from "@/types";

interface NewCreativesClientProps {
  initialData: {
    data: CreativeAd[];
    page: number;
    limit: number;
    total: number;
  };
  initialFilters: {
    platform: string;
    page: number;
    limit: number;
  };
}

export default function NewCreativesClient({ initialData, initialFilters }: NewCreativesClientProps) {
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

  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialFilters.platform);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialFilters.page);
  const [pageSize, setPageSize] = useState(initialFilters.limit);

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
    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));

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
  }, [selectedPlatform, currentPage, pageSize, router, currentQueryString]);

  // Reset page when platform changes
  const handlePlatformChange = (p: string) => {
    setSelectedPlatform(p);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(initialData.total / pageSize));

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Creative mới</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Dòng thời gian các creative vừa được hệ thống crawler phát hiện và thu thập</p>
        </div>
      </div>

      {/* Platform filters */}
      <div className="flex flex-wrap gap-1.5 bg-card rounded-xl border border-border p-4">
        <button
          onClick={() => handlePlatformChange("all")}
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
            onClick={() => handlePlatformChange(p)}
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

      {/* Grid creative results */}
      {isPending ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          Đang tải creative mới...
        </div>
      ) : initialData.data.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {initialData.data.map((ad) => {
              const nickname = ad.author?.nickname || "Không rõ";
              return (
                <div key={ad.id} className="relative">
                  <div className="absolute top-2 right-2 z-20 pointer-events-none">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white shadow-sm uppercase">
                      Mới
                    </span>
                  </div>
                  <CreativeCard
                    creative={ad}
                    advertiserName={nickname}
                    onClick={() => handleCardClick(ad.id)}
                  />
                </div>
              );
            })}
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground">Chưa có creative mới</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Creative sẽ tự động xuất hiện tại đây khi crawler của bạn thu thập dữ liệu mới.
          </p>
        </div>
      )}

      {/* Detail view Modal */}
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
