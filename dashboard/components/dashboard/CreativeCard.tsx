"use client";

import React from "react";
import Link from "next/link";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { CreativeAd } from "@/types";
import { PlatformBadge } from "./Badges";

interface CreativeCardProps {
  creative: CreativeAd;
  advertiserName?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function CreativeCard({ creative, advertiserName, className, onClick }: CreativeCardProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (creative.media_type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (creative.media_type === "video" && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  const [mediaError, setMediaError] = React.useState(false);
  const mediaUnavailable =
    creative.media_status === "failed" ||
    creative.media_status === "expired" ||
    creative.media_status === "unavailable";
  const thumbnailUrl =
    creative.media_type === "video"
      ? creative.cover_url || ""
      : creative.cover_url || creative.media_urls?.[0] || "";
  const canShowThumbnail = !mediaError && Boolean(thumbnailUrl);
  const canPreviewVideo =
    !mediaError &&
    !mediaUnavailable &&
    creative.media_type === "video" &&
    creative.media_source === "r2" &&
    creative.media_status === "cached" &&
    Boolean(creative.media_urls?.[0]);

  // Determine media type icon
  const renderMediaTypeIcon = () => {
    switch (creative.media_type) {
      case "video":
        return (
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        );
      case "image":
        return (
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
        );
      case "carousel":
        return (
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="16" height="16" rx="2" /><rect x="6" y="6" width="16" height="16" rx="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 active:scale-[0.98] flex flex-col h-full",
        className
      )}
    >
      {/* Thumbnail Container */}
      <Link
        href={`/dash/creative/${creative.id}`}
        className="relative block aspect-square bg-zinc-950/90 dark:bg-black overflow-hidden shrink-0 border-b border-border"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {canShowThumbnail ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Remote crawler media URLs are dynamic; next/image domains are not locked yet. */}
            <img
              src={thumbnailUrl}
              alt={creative.title || "Creative Thumbnail"}
              referrerPolicy="no-referrer"
              onError={() => setMediaError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03] will-change-transform"
            />
          </>
        ) : canPreviewVideo ? (
          <video
            ref={videoRef}
            src={`${creative.media_urls[0]}#t=0.001`}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setMediaError(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-250 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          /* Mock Cover Placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-400 dark:text-zinc-500 transition-transform duration-250 ease-out group-hover:scale-[1.03]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <svg className="size-8 mb-2 stroke-[1.2] opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {creative.media_type === "video" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              )}
            </svg>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/90 backdrop-blur-sm">{creative.platform} {creative.media_type}</span>
            <span className="text-[10px] text-zinc-400 mt-2 max-w-[130px] line-clamp-2 leading-relaxed px-2 font-medium">
              {creative.caption || creative.title || "No Caption"}
            </span>
          </div>
        )}

        {/* Badges on Thumbnail */}
        <div className="absolute top-2 left-2 z-10">
          <PlatformBadge platform={creative.platform} className="shadow-sm backdrop-blur-sm" />
        </div>
        {mediaUnavailable && (
          <div className="absolute top-2 right-2 z-20 rounded-md bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-black shadow-sm">
            Media chưa sẵn sàng
          </div>
        )}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
          <span className="h-5 px-1.5 rounded bg-zinc-900/80 text-white text-[10px] font-semibold flex items-center justify-center gap-1 backdrop-blur-sm shadow-sm">
            {renderMediaTypeIcon()}
            <span className="capitalize">{creative.media_type}</span>
          </span>
        </div>

        {/* Growth badge */}
        {creative.growth_rate > 0 && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
              <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>
              +{creative.growth_rate}%
            </span>
          </div>
        )}
      </Link>

      {/* Body Content */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <Link href={`/dash/creative/${creative.id}`} className="block" onClick={handleClick}>
            <p className="text-xs text-foreground font-semibold line-clamp-2 hover:text-primary transition-colors leading-relaxed">
              {creative.caption || "Không có chú thích."}
            </p>
          </Link>
          <div className="flex flex-wrap gap-1">
            {[...new Set(creative.tags)].slice(0, 3).map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-border/50 pt-2.5">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground font-mono">
            <div>
              <span className="block text-foreground font-bold">{formatNumber(creative.view_count)}</span>
              <span className="text-[8px] text-muted-foreground uppercase">Views</span>
            </div>
            <div>
              <span className="block text-foreground font-bold">{formatNumber(creative.like_count)}</span>
              <span className="text-[8px] text-muted-foreground uppercase">Likes</span>
            </div>
            <div>
              <span className="block text-foreground font-bold">{formatNumber(creative.comment_count)}</span>
              <span className="text-[8px] text-muted-foreground uppercase">Cmts</span>
            </div>
          </div>

          {/* Advertiser & Time */}
          <div className="flex items-center justify-between text-[10px] border-t border-border/30 pt-2">
            <Link
              href={`/dash/creative/advertisers/${creative.author_id}`}
              className="text-primary hover:underline font-medium truncate max-w-[110px]"
              title={advertiserName || "Xem Advertiser"}
            >
              {advertiserName || "Advertiser"}
            </Link>
            <span className="text-muted-foreground shrink-0">{timeAgo(creative.published_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
