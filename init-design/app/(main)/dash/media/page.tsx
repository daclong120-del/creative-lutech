"use client";

import Link from "next/link";

import { useAccount } from "@/lib/account-context";
import { useSearchParams } from "next/navigation";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { MediaIcon } from "@/components/icons";

interface VideoItem {
  id: string;
  name: string;
  duration: string;
  views: string;
  bandwidth: string;
}

function MediaPageContent() {
  const { activeAccount } = useAccount();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = (tabParam === "stream" || tabParam === "images") ? tabParam : "stream";

  // --- Stream State ---
  const [selectedVideoId, setSelectedVideoId] = useState("video-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(25); // Simulated starting percentage
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const videos: VideoItem[] = [
    {
      id: "video-1",
      name: "cloudflare-workers-introduction.mp4",
      duration: "03:45",
      views: "12,402",
      bandwidth: "420 GB"
    },
    {
      id: "video-2",
      name: "developer-keynote-recap.mp4",
      duration: "12:10",
      views: "5,190",
      bandwidth: "1.2 TB"
    },
    {
      id: "video-3",
      name: "edge-caching-speed-comparison.mp4",
      duration: "01:30",
      views: "24,809",
      bandwidth: "890 GB"
    }
  ];

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || videos[0];

  // Handle simulated video playing progress
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 300);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handlePlayToggle = () => {
    setIsPlaying((prev) => !prev);
  };

  // --- Image Optimization States ---
  const [imageQuality, setImageQuality] = useState(80);
  const [imageWidth, setImageWidth] = useState(1200);

  // Original image baseline
  const originalSizeMB = 2.84;
  // Estimated size based on dimensions and quality
  const scaleFactor = (imageQuality / 100) * (imageWidth / 1920);
  const estimatedSizeMB = Math.max(0.05, originalSizeMB * scaleFactor);
  const sizeSavingsPercent = Math.max(0, Math.round(((originalSizeMB - estimatedSizeMB) / originalSizeMB) * 100));

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 w-full animate-in fade-in duration-200">
      {/* Header Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Media & Images</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 select-none">
          <MediaIcon size={24} className="text-cloudflare-orange" />
          Media & Images
        </h1>
        <p className="text-xs text-muted-foreground">
          Stream high-quality videos globally with playback analytics, and dynamically transform/compress web assets.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border select-none">
        <Link
          href="/dash/media?tab=stream"
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "stream" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Cloudflare Stream
        </Link>
        <Link
          href="/dash/media?tab=images"
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "images" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Images Optimization
        </Link>
      </div>

      {/* --- Stream Tab Content --- */}
      {activeTab === "stream" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Video list selection) (1/3) */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">Video Library</h2>
            <div className="flex flex-col gap-3">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    setSelectedVideoId(vid.id);
                    setIsPlaying(false);
                    setPlayProgress(25);
                  }}
                  className={`p-4 border rounded-xl cursor-pointer text-left transition-all duration-200 shadow-sm ${
                    selectedVideoId === vid.id
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <h3 className="text-xs font-bold text-foreground truncate">{vid.name}</h3>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground font-semibold">
                    <span>Duration: {vid.duration}</span>
                    <span>Views: {vid.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Video Player mockup & stats) (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Cloudflare Player</h2>

            <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
              {/* Media Player Visual Box */}
              <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex flex-col justify-between p-4 shadow-inner group">
                {/* Background visual graphics simulation */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-orange-900/30 pointer-events-none" />

                <span className="text-[10px] font-bold text-white/50 bg-black/40 rounded px-2 py-1 self-start select-none font-mono">
                  {selectedVideo.name}
                </span>

                {/* Simulated playback visual */}
                {isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="h-10 w-10 rounded-full border-2 border-white/60 border-t-white/10 animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm transition-all duration-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 text-white ml-0.5"
                      >
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Control bar */}
                <div className="w-full space-y-2 mt-auto bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                  {/* Progress Line Bar */}
                  <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-cloudflare-orange transition-all duration-300"
                      style={{ width: `${playProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePlayToggle}
                      className="text-xs font-bold text-white hover:text-cloudflare-orange cursor-pointer transition-colors"
                    >
                      {isPlaying ? "PAUSE" : "PLAY"}
                    </button>
                    <span className="text-[10px] text-white/70 font-mono">
                      {isPlaying ? "Streaming live..." : "Paused"} ({playProgress}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Băng thông và Số liệu thống kê */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none border-t border-border pt-6">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Bandwidth</span>
                  <p className="text-xl font-extrabold text-foreground font-mono mt-1">{selectedVideo.bandwidth}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Aggregate Views</span>
                  <p className="text-xl font-extrabold text-foreground font-mono mt-1">{selectedVideo.views}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Video Duration</span>
                  <p className="text-xl font-extrabold text-foreground font-mono mt-1">{selectedVideo.duration}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Images Tab Content --- */}
      {activeTab === "images" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image sliders / Controls */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">Transformation Parameters</h2>
            <div className="rounded-xl border border-border bg-card p-5 space-y-6 shadow-sm select-none">
              
              {/* Quality slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Compression Quality</label>
                  <span className="text-xs font-bold text-primary font-mono">{imageQuality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Fast/Low Size</span>
                  <span>Lossless/Original</span>
                </div>
              </div>

              {/* Width setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Target Render Width</label>
                  <span className="text-xs font-bold text-primary font-mono">{imageWidth}px</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Mobile (200px)</span>
                  <span>Desktop (2000px)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Analytics & Preview box */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Compression Efficiency Analyzer</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stats Savings Card */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm select-none flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Bandwidth Saved</span>
                  <div className="text-4xl font-extrabold text-emerald-500 font-mono">-{sizeSavingsPercent}%</div>
                </div>

                <div className="space-y-2 border-t border-border pt-4 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Original Size:</span>
                    <span className="text-foreground font-mono">{originalSizeMB} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Optimized Size:</span>
                    <span className="text-primary font-bold font-mono">{estimatedSizeMB.toFixed(2)} MB</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Accents */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3 flex flex-col justify-center">
                <h3 className="text-xs font-bold text-foreground">Dynamic Transformation Active</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cloudflare Images analyzes the client browser support (e.g. WebP or AVIF compatibility) and compresses images on-the-fly. No pre-generating of responsive sizes required.
                </p>
                <div className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <span>● Active Edge Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <MediaPageContent />
    </Suspense>
  );
}
