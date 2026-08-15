import React, { Suspense } from "react";
import { getAdvertisers } from "@/lib/services/creative.service";
import AdvertisersClient from "./advertisers-client";
import type { Platform } from "@/types";

export default async function AdvertisersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const platformStr = params.platform || "";
  const platform = platformStr ? (platformStr.split(",") as Platform[]) : [];
  const sortBy = params.sortBy || "creative_count_desc";

  // Gọi service getAdvertisers trực tiếp server-side
  const result = await getAdvertisers({
    platform: platformStr !== "" ? platformStr : undefined,
    search: q || undefined,
    limit: 100, // Top 100
  });

  // Tái thực hiện logic sort tương tự client cũ
  const sortedData = [...result.data];
  if (sortBy === "creative_count_desc") {
    sortedData.sort((a, b) => b.creative_count - a.creative_count);
  } else if (sortBy === "total_views_desc") {
    sortedData.sort((a, b) => b.total_views - a.total_views);
  } else if (sortBy === "last_active_desc") {
    sortedData.sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime());
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải phân tích advertiser...</div>}>
      <AdvertisersClient
        initialData={sortedData}
        initialTotal={result.total}
        initialFilters={{
          q,
          platform,
          sortBy,
        }}
      />
    </Suspense>
  );
}
