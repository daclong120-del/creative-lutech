import React, { Suspense } from "react";
import { searchAds, getAdvertisers } from "@/lib/services/creative.service";
import CalendarClient from "./calendar-client";

export default async function CalendarPage() {
  // Fetch ban đầu từ services, server-side
  const [creativesRes, advertisersRes] = await Promise.all([
    searchAds({ limit: 250 }),
    getAdvertisers({ limit: 100 }),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải lịch tiếp thị...</div>}>
      <CalendarClient
        initialCreatives={creativesRes.data}
        initialAdvertisers={advertisersRes.data}
      />
    </Suspense>
  );
}
