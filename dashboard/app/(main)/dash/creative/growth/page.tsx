import React, { Suspense } from "react";
import { searchAds } from "@/lib/services/creative.service";
import GrowthClient from "./growth-client";

export default async function GrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const platform = params.platform || "all";
  const sortBy = params.sortBy || "growth_pct_desc";

  // Gọi service searchAds trực tiếp server-side
  const result = await searchAds({
    platform: platform !== "all" ? platform : undefined,
    sort: sortBy === "growth_pct_desc" ? "views" : "views", // growth rates map
    limit: 100, // Top 100
  });

  // Tái thực hiện logic sort tương tự client cũ
  const sortedData = [...result.data];
  if (sortBy === "growth_pct_desc") {
    sortedData.sort((a, b) => b.growth_rate - a.growth_rate);
  } else {
    sortedData.sort((a, b) => b.view_count - a.view_count);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải bảng xếp hạng tăng trưởng...</div>}>
      <GrowthClient
        initialData={sortedData}
        initialFilters={{
          platform,
          sortBy,
        }}
      />
    </Suspense>
  );
}
