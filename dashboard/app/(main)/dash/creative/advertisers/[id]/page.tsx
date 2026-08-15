import React, { Suspense } from "react";
import Link from "next/link";
import { getAdvertiserById } from "@/lib/services/creative.service";
import AdvertiserProfileClient from "./profile-client";

export default async function AdvertiserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdvertiserById(id);

  if (!result || !result.advertiser) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-base font-bold text-foreground">Không tìm thấy Advertiser</h2>
        <p className="text-xs text-muted-foreground">Mã ID advertiser không hợp lệ hoặc đã bị xóa khỏi hệ thống.</p>
        <Link href="/dash/creative/advertisers" className="inline-block text-xs text-primary hover:underline font-semibold">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải hồ sơ advertiser...</div>}>
      <AdvertiserProfileClient
        advertiser={result.advertiser}
        advertiserCreatives={result.ads}
      />
    </Suspense>
  );
}
