"use client";

import React from "react";

export default function MainLoading() {
  return (
    <div className="w-full h-full p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Instant Progress Line Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary/80 via-blue-500 to-emerald-500 animate-pulse shadow-sm" />

      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-muted/40 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-muted/60 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-card/80 border border-border/80 space-y-2 shadow-xs">
            <div className="h-7 w-12 bg-muted/60 rounded-md animate-pulse" />
            <div className="h-3 w-20 bg-muted/40 rounded-md animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Workspace Skeleton */}
      <div className="bg-card/80 border border-border/80 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="h-5 w-48 bg-muted/60 rounded-md animate-pulse" />
        <div className="h-40 w-full bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-10 bg-muted/40 rounded-xl animate-pulse" />
          <div className="h-10 bg-muted/40 rounded-xl animate-pulse" />
          <div className="h-10 bg-muted/40 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
