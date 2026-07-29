"use client";

import React, { useState, useEffect } from "react";
import { getExports } from "@/lib/actions/system.actions";
import type { ExportedFile } from "@/types";
import { formatNumber, formatFileSize, timeAgo } from "@/lib/utils";

export default function ManagementClient() {
  const [tags, setTags] = useState<{ id: string; name: string; color: string; description: string; usage_count: number; created_at: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [newTagDesc, setNewTagDesc] = useState("");

  const [exportedFiles, setExportedFiles] = useState<ExportedFile[]>([]);
  const [loadingExported, setLoadingExported] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      setLoadingExported(true);
      try {
        const list = await getExports();
        setExportedFiles(list);
      } catch (err) {
        console.error("Error loading exported files:", err);
      } finally {
        setLoadingExported(false);
      }
    }
    loadFiles();
  }, []);

  const handleAddTag = () => {
    if (!newTagName) return;
    const newTag = {
      id: `TG-${Date.now()}`,
      name: newTagName,
      color: newTagColor,
      description: newTagDesc,
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
    setTags([newTag, ...tags]);
    setShowModal(false);
    setNewTagName("");
    setNewTagDesc("");
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Quản lý dữ liệu nâng cao</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Giám sát dung lượng, dọn dẹp dữ liệu cũ và quản lý phân loại</p>
      </div>

      {/* Storage & DB Monitors */}
      <div className="grid grid-cols-1 gap-4">
        {/* Supabase DB Storage */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h3 className="text-xs font-bold text-card-foreground">Dung lượng Cơ sở Dữ liệu</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-muted-foreground">Đã dùng: 145 MB / 500 MB</span>
              <span className="text-foreground font-semibold">29%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "29%" }} />
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground leading-normal font-mono">
            - Table crawled_posts: 24,839 rows - 45 MB<br />
            - Table crawled_comments: 140,210 rows - 82 MB<br />
            - Khác: 18 MB
          </div>
        </div>
      </div>

      {/* Data Clean-up Tools */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-4">
        <h3 className="text-xs font-bold text-card-foreground">Công cụ dọn dẹp dữ liệu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 border border-border bg-muted/20 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Xóa bài viết cũ</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Xóa toàn bộ bài viết đã cào cũ hơn số ngày cấu hình.</p>
            </div>
            <div className="mt-3 flex gap-2">
              <input type="number" defaultValue={60} className="w-16 h-8 px-2 text-xs border border-border rounded-lg bg-background text-foreground text-center" />
              <button className="flex-1 h-8 text-[11px] font-medium rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors">Xóa bài viết</button>
            </div>
          </div>

          <div className="p-3 border border-border bg-muted/20 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Xóa bài viết kém tương tác</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Xóa các bài viết có số lượng Like = 0 để giải phóng bộ nhớ.</p>
            </div>
            <button className="w-full h-8 mt-3 text-[11px] font-medium rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors">Dọn dẹp ngay</button>
          </div>
        </div>
      </div>

      {/* Tag Manager & Export History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tag Manager */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold text-card-foreground">Phân loại & Nhãn dán bài viết</h3>
            <button onClick={() => setShowModal(true)} className="h-7 px-2.5 text-[11px] font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Thêm nhãn mới</button>
          </div>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-2.5 border border-border/50 rounded-lg hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <div>
                    <p className="text-xs font-bold text-card-foreground">#{tag.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-normal">{tag.description || "Không có mô tả."}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-medium text-foreground tabular-nums">{formatNumber(tag.usage_count)} bài</p>
                  <button className="text-[10px] text-destructive hover:underline mt-0.5">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exported Files History */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold text-card-foreground">Lịch sử xuất tệp Excel / CSV</h3>
            <span className="text-[10px] text-muted-foreground">Lưu trữ 30 ngày gần nhất</span>
          </div>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {loadingExported ? (
              <div className="text-center py-8 text-muted-foreground text-xs">Đang tải lịch sử xuất file...</div>
            ) : exportedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">Không có lịch sử xuất file.</div>
            ) : (
              exportedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2.5 border border-border/50 rounded-lg hover:bg-muted/10 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-card-foreground truncate">{file.filename}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Tạo bởi: {file.created_by} • {timeAgo(file.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{formatFileSize(file.size_bytes)}</span>
                    <a href={file.download_url} className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5">
                      📥 Tải xuống
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Tag Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-card-foreground">Thêm nhãn phân loại mới</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Tên nhãn *</span>
                <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="VD: skincare" className="w-full h-8 px-2 text-xs border border-border rounded-lg bg-background text-foreground" />
              </label>
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Màu nhãn *</span>
                <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-full h-10 px-1 py-1 border border-border rounded-lg bg-background cursor-pointer" />
              </label>
              <label className="space-y-1 block"><span className="text-[11px] font-medium text-muted-foreground">Mô tả nhãn</span>
                <textarea rows={3} value={newTagDesc} onChange={(e) => setNewTagDesc(e.target.value)} placeholder="Nhập mô tả ngắn về nhãn này..." className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground resize-none" />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="h-8 px-4 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted">Hủy</button>
              <button onClick={handleAddTag} className="h-8 px-4 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Tạo nhãn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
