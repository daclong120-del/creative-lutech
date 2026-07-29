"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdById, getAdvertiserById, getSimilar } from "@/lib/actions/creative.actions";
import { PlatformBadge } from "./Badges";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import type { CreativeAd, CreativeAdvertiser } from "@/types";

interface CreativeDetailViewProps {
  id: string;
  onClose?: () => void;
  isModal?: boolean;
  onNavigate?: (id: string) => void;
}

export default function CreativeDetailView({
  id,
  onClose,
  isModal = false,
  onNavigate
}: CreativeDetailViewProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [creative, setCreative] = useState<CreativeAd | null>(null);
  const [advertiser, setAdvertiser] = useState<CreativeAdvertiser | null>(null);
  const [similarCreatives, setSimilarCreatives] = useState<CreativeAd[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);

  const [tags, setTags] = useState<string[]>(["Hot", "Viral", "Ad"]);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const loadDetail = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoadingDetail(true);
    try {
      const ad = await getAdById(id);
      setCreative(ad);
      if (ad) {
        setTags(ad.tags || ["Hot", "Viral", "Ad"]);

        if (ad.author_id) {
          const advResult = await getAdvertiserById(ad.author_id);
          setAdvertiser(advResult?.advertiser ?? null);
        } else {
          setAdvertiser(null);
        }

        const similar = await getSimilar(ad.platform, ad.id);
        setSimilarCreatives(similar);
      } else {
        setAdvertiser(null);
        setSimilarCreatives([]);
      }
    } catch (err: unknown) {
      console.error("Error loading creative detail:", err);
    } finally {
      if (showLoading) setLoadingDetail(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail(true);
  }, [loadDetail]);

  useEffect(() => {
    if (videoRef.current && creative) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch((err) => {
        console.log("Autoplay with audio was blocked or interrupted:", err);
      });
    }
  }, [creative]);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCopyLink = () => {
    const detailUrl = `${window.location.origin}/dash/creative/${creative?.id}`;
    navigator.clipboard.writeText(detailUrl);
    alert("Đã sao chép liên kết vào bộ nhớ tạm!");
  };

  const handleExport = () => {
    alert("Tính năng đang được phát triển: Xuất thông tin chi tiết creative dưới dạng PDF/JSON.");
  };

  const handleCreativeClick = (targetId: string) => {
    if (onNavigate) {
      onNavigate(targetId);
    } else {
      router.push(`/dash/creative/${targetId}`);
    }
  };

  // Close modal on escape key press
  useEffect(() => {
    if (!isModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModal, onClose]);

  if (!id) return null;

  if (loadingDetail) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-muted-foreground">
        Đang tải chi tiết Creative...
      </div>
    );
  }

  if (!creative) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-base font-bold text-foreground">Không tìm thấy Creative</h2>
        <p className="text-xs text-muted-foreground">ID creative này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        {onClose ? (
          <button onClick={onClose} className="inline-block text-xs text-primary hover:underline font-semibold">
            Đóng cửa sổ
          </button>
        ) : (
          <Link href="/dash/creative/search" className="inline-block text-xs text-primary hover:underline font-semibold">
            Quay lại trang tìm kiếm
          </Link>
        )}
      </div>
    );
  }

  const isBilibiliEmbed = creative.platform === "bilibili" && creative.platform_uid;
  const primaryMediaUrl = creative.media_urls?.[0] || "";
  const canRenderVideo = creative.media_type === "video" && (primaryMediaUrl || isBilibiliEmbed);
  const canRenderVideoCoverFallback = creative.media_type === "video" && !primaryMediaUrl && !isBilibiliEmbed && creative.cover_url;
  const canRenderImage =
    (creative.media_type === "image" || creative.media_type === "carousel") &&
    (primaryMediaUrl || creative.cover_url);

  const renderContent = () => (
    <>
      {/* Back button & Action buttons (only when NOT inside modal) */}
      {!isModal && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href="/dash/creative/search"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
          >
            <svg className="size-3 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại Tìm kiếm Creative
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Sao chép link
            </button>
            {isBilibiliEmbed ? (
              <a
                href={`https://www.bilibili.com/video/${creative.platform_uid}`}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Mở trên Bilibili
              </a>
            ) : (
              primaryMediaUrl && (
                <a
                  href={primaryMediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {creative.media_type === "video" ? "Tải video" : "Tải media"}
                </a>
              )
            )}
            <button
              onClick={handleExport}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất thông tin
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout: Player on Left, Info on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Side: Media Player (60% width span) */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center relative group w-full max-h-[70vh]">
          {(creative.media_status === "failed" || creative.media_status === "expired") && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-amber-500/90 text-black p-2.5 rounded-lg text-xs font-semibold backdrop-blur-sm flex items-center gap-2 shadow-lg">
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Cảnh báo: Media gốc đã {creative.media_status === "expired" ? "hết hạn" : "lỗi tải"}. Cần recrawl/backfill từ crawler pipeline.</span>
            </div>
          )}

          {canRenderVideo ? (
            creative.platform === "bilibili" ? (
              <iframe
                src={`https://player.bilibili.com/player.html?bvid=${creative.platform_uid}&high_quality=1&as_wide=1&autoplay=0`}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                className="w-full aspect-video max-h-[70vh] rounded-2xl border border-border shadow-xl bg-zinc-950 dark:bg-black"
              />
            ) : (
              <video
                ref={videoRef}
                src={primaryMediaUrl}
                poster={creative.cover_url}
                controls
                playsInline
                preload="auto"
                className="max-h-[70vh] max-w-full w-auto h-auto object-contain rounded-2xl border border-border shadow-xl bg-zinc-950 dark:bg-black"
              />
            )
          ) : canRenderVideoCoverFallback ? (
            <div className="relative w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- Remote crawler media URLs are dynamic */}
              <img
                src={creative.cover_url}
                alt={creative.title || "Creative cover"}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] max-w-full w-auto h-auto object-contain rounded-2xl border border-border shadow-xl bg-zinc-950 dark:bg-black"
              />
            </div>
          ) : canRenderImage ? (
            <div className="relative w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- Remote crawler media URLs are dynamic */}
              <img
                src={primaryMediaUrl || creative.cover_url}
                alt={creative.title || "Creative Media"}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] max-w-full w-auto h-auto object-contain rounded-2xl border border-border shadow-xl bg-zinc-950 dark:bg-black"
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-zinc-950 dark:bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center relative border border-border shadow-xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none text-zinc-400">
                <div className="size-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 transition-transform cursor-pointer">
                  <svg className="size-8 text-white fill-white translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-xs uppercase font-bold tracking-widest text-zinc-500">{creative.platform} media player</p>
                <span className="text-[10px] text-zinc-600 mt-1">Simulated Live Stream Content</span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/60 backdrop-blur-md p-3.5 rounded-xl border border-white/5 flex items-center justify-between text-white text-xs">
                <span className="font-mono text-[10px]">0:00 / 0:15</span>
                <div className="flex items-center gap-3">
                  <svg className="size-4 cursor-pointer hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <svg className="size-4 cursor-pointer hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Info Panel (40% width span) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action buttons inside Modal at top right */}
          {isModal && (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCopyLink}
                className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 w-full justify-center"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Sao chép link
              </button>
              {isBilibiliEmbed ? (
                <a
                  href={`https://www.bilibili.com/video/${creative.platform_uid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 w-full justify-center"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Mở trên Bilibili
                </a>
              ) : (
                primaryMediaUrl && (
                  <a
                    href={primaryMediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 w-full justify-center"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {creative.media_type === "video" ? "Tải video" : "Tải media"}
                  </a>
                )
              )}
              <button
                onClick={handleExport}
                className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 w-full justify-center"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Xuất thông tin
              </button>
            </div>
          )}



          {/* Platform & Author info */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 border border-border flex items-center justify-center font-bold text-xs text-primary uppercase select-none">
                {advertiser ? advertiser.nickname.charAt(0) : "A"}
              </div>
              <div>
                {advertiser ? (
                  <Link
                    href={`/dash/creative/advertisers/${advertiser.id}`}
                    className="font-bold text-foreground hover:text-primary hover:underline transition-colors block text-xs"
                  >
                    {advertiser.nickname}
                  </Link>
                ) : (
                  <span className="text-muted-foreground block text-xs">-</span>
                )}
                <span className="text-[10px] text-muted-foreground block capitalize mt-0.5">Nền tảng: {creative.platform}</span>
              </div>
            </div>
            <PlatformBadge platform={creative.platform} />
          </div>

          {/* Timestamps */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ngày đăng</span>
              <span className="font-semibold text-foreground font-mono">
                {new Date(creative.published_at).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Thu thập lúc</span>
              <span className="font-semibold text-foreground font-mono">
                {timeAgo(creative.crawled_at)}
              </span>
            </div>
          </div>

          {/* Metrics 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Views", value: formatNumber(creative.view_count), color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Likes", value: formatNumber(creative.like_count), color: "text-red-500", bg: "bg-red-500/10" },
              { label: "Comments", value: formatNumber(creative.comment_count || 0), color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Shares", value: formatNumber(creative.share_count || 0), color: "text-emerald-500", bg: "bg-emerald-500/10" },
            ].map((metric, idx) => (
              <div key={idx} className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{metric.label}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-bold text-foreground font-mono leading-none">{metric.value}</span>
                  <span className={cn("size-2 rounded-full", metric.color, metric.bg)} />
                </div>
              </div>
            ))}
          </div>

          {/* Caption block */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Nội dung văn bản</span>
            <p className="text-xs text-foreground leading-relaxed font-normal whitespace-pre-wrap">
              {creative.caption || "Không có chú thích nào."}
            </p>
          </div>

          {/* Tags block */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tags</span>
              <button
                onClick={() => setIsAddingTag(!isAddingTag)}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                + Gán tag
              </button>
            </div>

            {isAddingTag && (
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nhập tag mới..."
                  className="flex-1 h-8 px-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="h-8 px-3 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:opacity-90"
                >
                  Thêm
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground border border-border/40 group"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground hover:text-red-500 font-bold transition-colors ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related creatives carousel */}
      {similarCreatives.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Creative Tương Tự</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Danh sách các creative cùng nền tảng hoặc nhà quảng cáo</p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {similarCreatives.map((ad) => (
              <div
                key={ad.id}
                onClick={() => handleCreativeClick(ad.id)}
                className="w-44 bg-card border border-border rounded-xl p-2.5 space-y-2 shrink-0 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all group"
              >
                <div className="aspect-[9/16] rounded-lg bg-zinc-950 dark:bg-black overflow-hidden flex items-center justify-center text-[7px] text-zinc-500 uppercase font-bold relative">
                  {ad.cover_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Remote crawler media URLs are dynamic; next/image domains are not locked yet. */}
                      <img
                        src={ad.cover_url}
                        alt={ad.title || "Similar Creative"}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </>
                  ) : (
                    "Thumbnail"
                  )}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <PlatformBadge platform={ad.platform} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-foreground font-semibold line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
                    {ad.caption}
                  </p>
                  <div className="text-[9px] text-muted-foreground font-mono">
                    Views: {formatNumber(ad.view_count)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative bg-background border border-border rounded-2xl w-full max-w-[1300px] h-[90vh] flex flex-col shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
          {/* Sticky Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-50 shrink-0">
            <div>
              <h2 className="text-xs font-bold text-foreground truncate max-w-[300px] md:max-w-[500px]">
                Chi tiết Creative: {creative.id}
              </h2>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Đăng bởi {advertiser ? advertiser.nickname : "N/A"} • Nền tảng: {creative.platform}
              </p>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors flex items-center justify-center active-press"
              title="Đóng (Esc)"
            >

              <svg className="size-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content wrapper */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-8">
      {renderContent()}
    </div>
  );
}
