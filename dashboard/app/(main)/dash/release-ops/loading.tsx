"use client";

import React from "react";

export default function ReleaseOpsLoading() {
  return (
    <div className="w-full h-full p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-150 select-none">
      {/* Top Instant Progress Line Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-primary animate-pulse" />

      {/* Release Ops Top Header Strip Skeleton */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-56 bg-muted/70 rounded-lg animate-pulse" />
          <div className="h-5 w-32 bg-muted/40 rounded-lg animate-pulse" />
        </div>
        <div className="h-4 w-40 bg-muted/40 rounded-lg animate-pulse" />
      </div>

      {/* Sub-nav Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted/50 rounded-xl animate-pulse shrink-0" />
        ))}
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-card/90 border border-border/80 space-y-2 shadow-xs">
            <div className="h-8 w-16 bg-muted/60 rounded-md animate-pulse" />
            <div className="h-3.5 w-24 bg-muted/40 rounded-md animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Workspace Skeleton */}
      <div className="bg-card/90 border border-border/80 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-muted/60 rounded-md animate-pulse" />
          <div className="h-8 w-32 bg-muted/50 rounded-xl animate-pulse" />
        </div>
        <div className="h-48 w-full bg-muted/20 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
