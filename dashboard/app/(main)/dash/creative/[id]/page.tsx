"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import CreativeDetailView from "@/components/dashboard/CreativeDetailView";

function CreativeDetailPageContent() {
  const params = useParams();
  const id = params?.id as string;

  return <CreativeDetailView id={id} isModal={false} />;
}

export default function CreativeDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải chi tiết creative...</div>}>
      <CreativeDetailPageContent />
    </Suspense>
  );
}
