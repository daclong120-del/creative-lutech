import React, { Suspense } from "react";
import { searchAds } from "@/lib/services/creative.service";
import NewCreativesClient from "./new-client";

export default async function NewCreativesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const platform = params.platform || "all";
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 60;

  const result = await searchAds({
    platform: platform !== "all" ? platform : undefined,
    sort: "newest",
    page,
    limit,
  });

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải creative mới...</div>}>
      <NewCreativesClient
        initialData={result}
        initialFilters={{
          platform,
          page,
          limit,
        }}
      />
    </Suspense>
  );
}
