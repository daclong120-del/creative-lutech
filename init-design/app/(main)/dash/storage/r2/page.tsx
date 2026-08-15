"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { StorageIcon } from "@/components/icons";

interface R2Bucket {
  id: string;
  name: string;
  region: string;
  storageClass: string;
}

interface BucketFile {
  name: string;
  size: string;
  modified: string;
}

function R2PageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");

  // --- Trạng thái quản lý R2 Object Storage ---
  const [buckets] = useState<R2Bucket[]>([
    { id: "r2-1", name: "emulation-assets-bucket", region: "WNAM (Oregon)", storageClass: "Standard" }
  ]);
  const [selectedR2Id] = useState("r2-1");
  const [bucketFiles, setBucketFiles] = useState<BucketFile[]>([
    { name: "logo-transparent.svg", size: "12.4 KB", modified: "2026-07-02 09:12" },
    { name: "hero-video-compress.mp4", size: "4.8 MB", modified: "2026-07-01 11:45" },
    { name: "schema-draft.pdf", size: "1.2 MB", modified: "2026-06-28 14:02" }
  ]);

  // Giả lập tải file mới lên bucket R2
  const handleMockUploadFile = () => {
    const mockFiles = [
      "user-profile-avatar.jpg",
      "analytics-data-dump.json",
      "cloudflare-presentation.pptx",
      "billing-invoice-june.pdf"
    ];
    const randFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    const randSize = `${(Math.random() * 4 + 0.1).toFixed(1)} MB`;
    
    const newFile: BucketFile = {
      name: `${Date.now()}-${randFile}`,
      size: randSize,
      modified: "Just now"
    };

    setBucketFiles((prev) => [newFile, ...prev]);
  };

  const activeR2Bucket = buckets.find((b) => b.id === selectedR2Id) || buckets[0];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 w-full animate-in fade-in duration-200">
      {/* Hero Header chính */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 select-none">
          <StorageIcon size={24} className="text-cloudflare-orange" />
          {sectionParam === "workers" ? "Workers & Pages" : "Storage & Databases"}
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage fast KV namespaces, query serverless SQL tables via D1, and upload raw assets into R2 object storage.
        </p>
      </div>

      {/* Các tab chuyển hướng */}
      <div className="flex border-b border-border select-none">
        <Link
          href={`/dash/storage/kv${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-transparent text-muted-foreground hover:text-foreground"
        >
          Workers KV
        </Link>
        <Link
          href={`/dash/storage/d1${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-transparent text-muted-foreground hover:text-foreground"
        >
          D1 SQL Databases
        </Link>
        <Link
          href={`/dash/storage/r2${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-primary text-foreground"
        >
          R2 Object Storage
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột hiển thị chi tiết R2 Bucket */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground">Bucket Details</h2>
          <div className="p-5 border border-border bg-card rounded-xl space-y-4 shadow-sm select-none">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bucket name</span>
              <h3 className="text-xs font-bold text-foreground font-mono">{activeR2Bucket.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground">Region</span>
                <p className="font-bold text-foreground">{activeR2Bucket.region}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Class</span>
                <p className="font-bold text-foreground">{activeR2Bucket.storageClass}</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <span className="text-[10px] text-muted-foreground">Total Object Storage Size</span>
              <p className="text-xl font-extrabold text-foreground font-mono">1.82 GB</p>
            </div>
          </div>
        </div>

        {/* Khung Explorer đối tượng tệp tin */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Object Explorer</h2>
            <button
              onClick={handleMockUploadFile}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              Upload File
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground font-semibold select-none">
                  <th className="p-4 font-semibold">Object Key</th>
                  <th className="p-4 font-semibold">Size</th>
                  <th className="p-4 font-semibold text-right">Modified Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bucketFiles.length > 0 ? (
                  bucketFiles.map((file, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground font-mono truncate max-w-[280px]" title={file.name}>
                        {file.name}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono">{file.size}</td>
                      <td className="p-4 text-right text-muted-foreground font-semibold">{file.modified}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      No files in bucket. Click Upload File.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function R2Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <R2PageContent />
    </Suspense>
  );
}
