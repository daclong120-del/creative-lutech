"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PlatformBadge } from "@/components/dashboard/Badges";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { getPosts, getComments, getTags, deletePost, deletePosts } from "@/lib/actions/data.actions";
import { formatNumber, timeAgo, cn } from "@/lib/utils";
import type { CrawledPost, CrawledComment } from "@/types";

// ─── Confirmation Modal ────────────────────────────────────────
function DeleteConfirmModal({
  open,
  count,
  onConfirm,
  onCancel,
  deleting,
}: {
  open: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-xl border border-border shadow-lg p-6 w-[400px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="size-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-foreground text-center">Xác nhận xóa</h3>
        <p className="text-xs text-muted-foreground text-center leading-relaxed mt-2">
          Bạn có chắc muốn xóa{" "}
          <span className="font-semibold text-destructive">
            {count} bài viết
          </span>{" "}
          đã chọn? Hành động này không thể hoàn tác.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="h-8 px-4 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-medium transition-colors duration-150 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="h-8 px-4 rounded-lg bg-destructive text-white hover:bg-destructive/90 text-xs font-medium transition-colors duration-150 disabled:opacity-50 flex items-center gap-1.5"
          >
            {deleting ? (
              <>
                <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Xóa vĩnh viễn"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trash Icon SVG ────────────────────────────────────────────
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

// ─── Main Page Content ─────────────────────────────────────────
function PostsPageContent() {
  const searchParams = useSearchParams();
  const authorFilterParam = searchParams.get("author");

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedPost, setSelectedPost] = useState<CrawledPost | null>(null);
  const [posts, setPosts] = useState<CrawledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CrawledComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string; color: string; description: string; usage_count: number; created_at: string }[]>([]);

  // ─── Delete state ──────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null); // single delete
  const [deleting, setDeleting] = useState(false);

  // Fetch posts and tags from Supabase
  useEffect(() => {
    async function load() {
      try {
        const [postsResult, tagsResult] = await Promise.all([
          getPosts({ limit: 100 }),
          getTags()
        ]);
        setPosts(postsResult.data);
        setTags(tagsResult);
        if (postsResult.data.length > 0) {
          setSelectedPost(postsResult.data[0]);
        }
      } catch (err) {
        console.error("Error loading posts or tags:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let active = true;

    if (!selectedPost) {
      const timer = setTimeout(() => {
        if (active) setComments([]);
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
    async function loadComments() {
      setLoadingComments(true);
      try {
        const data = await getComments(selectedPost!.id);
        if (active) setComments(data);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        if (active) setLoadingComments(false);
      }
    }
    loadComments();

    return () => {
      active = false;
    };
  }, [selectedPost]);

  // Rebuild comment tree from flat DB structure
  const commentTree = useMemo(() => {
    const roots = comments.filter((c) => !c.parent_cid);
    const replies = comments.filter((c) => c.parent_cid);

    return roots.map((root) => {
      const childReplies = replies.filter((r) => r.parent_cid === root.id);
      return {
        ...root,
        replies: childReplies,
      };
    });
  }, [comments]);

  const filtered = posts.filter((post) => {
    const matchesSearch = post.caption.toLowerCase().includes(search.toLowerCase()) || (post.title || "").toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platform === "all" || post.platform === platform;
    const matchesTag = selectedTag === "all" || post.tags.includes(selectedTag);
    const matchesAuthor = !authorFilterParam || post.platform_uid === authorFilterParam;
    return matchesSearch && matchesPlatform && matchesTag && matchesAuthor;
  });

  // ─── Checkbox handlers ─────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }, [filtered, selectedIds.size]);

  // ─── Delete handlers ───────────────────────────────────────
  const openBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteTargetId(null);
    setShowDeleteModal(true);
  }, [selectedIds.size]);

  const openSingleDelete = useCallback((id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      if (deleteTargetId) {
        // Single delete
        await deletePost(deleteTargetId);
        setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId));
        if (selectedPost?.id === deleteTargetId) setSelectedPost(null);
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteTargetId); return next; });
      } else {
        // Bulk delete
        const ids = Array.from(selectedIds);
        await deletePosts(ids);
        setPosts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        if (selectedPost && selectedIds.has(selectedPost.id)) setSelectedPost(null);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error("Error deleting posts:", err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, selectedIds, selectedPost]);

  const deleteCount = deleteTargetId ? 1 : selectedIds.size;

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Kho Bài viết & Video</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kho lưu trữ nội dung cào từ các nền tảng mạng xã hội</p>
        </div>
        <div className="flex items-center gap-2">
          {authorFilterParam && (
            <button
              onClick={() => window.history.replaceState({}, "", "/dash/data/posts")}
              className="h-8 px-3 text-xs font-medium rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-600 border border-orange-200 dark:border-orange-900 transition-colors"
            >
              Hủy lọc Creator ✕
            </button>
          )}
          <button className="h-8 px-3 text-xs font-medium rounded-lg bg-card border border-border text-card-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground">Từ khóa tìm kiếm</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, tag..."
            className="w-full h-8 px-3 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground">Nền tảng</span>
          <DropdownSelect
            value={platform}
            onChange={setPlatform}
            options={[
              { value: "all", label: "Tất cả nền tảng" },
              { value: "douyin", label: "Douyin" },
              { value: "xhs", label: "XHS" },
              { value: "bilibili", label: "Bilibili" },
              { value: "weibo", label: "Weibo" },
              { value: "kuaishou", label: "Kuaishou" },
              { value: "tiktok", label: "TikTok" }
            ]}
            fullWidth
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-[11px] font-medium text-muted-foreground">Phân loại / Nhãn</span>
          <DropdownSelect
            value={selectedTag}
            onChange={setSelectedTag}
            options={[
              { value: "all", label: "Tất cả nhãn" },
              ...tags.map((tag) => ({ value: tag.name, label: tag.name }))
            ]}
            fullWidth
          />
        </label>
      </div>

      {/* Master Detail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Post Feed List */}
        <div className="lg:col-span-3 space-y-3">
          {/* Bulk Action Bar — hiện khi có checkbox được chọn */}
          {selectedIds.size > 0 && (
            <div className="bg-card rounded-xl border border-border p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-medium text-foreground">Chọn tất cả</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  Đã chọn <span className="font-semibold text-foreground">{selectedIds.size}</span> bài viết
                </span>
              </div>
              <button
                onClick={openBulkDelete}
                className="h-7 px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors duration-150 flex items-center gap-1.5"
              >
                <TrashIcon className="size-3.5" />
                Xóa đã chọn
              </button>
            </div>
          )}

          {/* Post list */}
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-3">
            {loading ? (
              <div className="py-20 text-center text-xs text-muted-foreground bg-card rounded-xl border border-border">
                <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                Đang tải danh sách bài viết...
              </div>
            ) : filtered.map((post) => (
              <div
                key={post.id}
                className={cn(
                  "group/card p-4 rounded-xl border transition-[border-color,box-shadow] cursor-pointer flex gap-4 bg-card relative",
                  selectedPost?.id === post.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-zinc-300 dark:hover:border-zinc-700",
                  selectedIds.has(post.id) && "bg-primary/[0.03] border-primary/30"
                )}
              >
                {/* Checkbox */}
                <div className="flex items-start pt-0.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(post.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="size-4 rounded border-border accent-primary cursor-pointer shrink-0"
                  />
                </div>

                {/* Cover mock */}
                <div
                  onClick={() => setSelectedPost(post)}
                  className="size-20 rounded bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-[10px] font-medium uppercase select-none border border-border"
                >
                  {post.platform} Cover
                </div>
                <div onClick={() => setSelectedPost(post)} className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <PlatformBadge platform={post.platform} />
                      <span className="text-[10px] text-muted-foreground">{timeAgo(post.published_at)}</span>
                    </div>
                    <p className="text-xs text-card-foreground line-clamp-2 mt-2 leading-relaxed">
                      {post.caption || "Không có chú thích."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground mt-2 border-t border-border/50 pt-2">
                    <span className="font-mono">Likes: {formatNumber(post.like_count)}</span>
                    <span className="font-mono">Views: {formatNumber(post.view_count)}</span>
                    <span className="font-mono">Creator ID: {post.platform_uid}</span>
                  </div>
                </div>

                {/* Trash icon — luôn hiển thị muted, sáng khi hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openSingleDelete(post.id);
                  }}
                  className="absolute top-3 right-3 size-7 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 opacity-0 group-hover/card:opacity-100"
                  title="Xóa bài viết"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-xs bg-card rounded-xl border border-border">
                Không tìm thấy bài viết nào.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Post Detail & Comments View */}
        <div className="lg:col-span-2">
          {selectedPost ? (
            <div className="bg-card rounded-xl border border-border p-4 sticky top-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                <PlatformBadge platform={selectedPost.platform} />
                <span className="text-[11px] text-muted-foreground font-mono">UID: {selectedPost.platform_uid}</span>
              </div>

              {/* Player mockup */}
              <div className="aspect-video w-full rounded bg-black flex flex-col items-center justify-center text-zinc-400 gap-1.5 p-4 text-center border border-border">
                <svg className="size-8 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect width="15" height="14" x="1" y="5" rx="2" ry="2" /></svg>
                <span className="text-[11px] font-semibold text-zinc-200">Video Player Mockup</span>
                <span className="text-[9px] text-zinc-500">Dữ liệu media được phát từ link gốc hoặc iframe embed</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-card-foreground">Chú thích gốc</h4>
                <p className="text-xs text-card-foreground leading-relaxed whitespace-pre-wrap">{selectedPost.caption}</p>
                <div className="flex gap-1 flex-wrap pt-1">
                  {selectedPost.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">#{t}</span>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border border-border/50 text-center font-mono">
                <div>
                  <p className="text-[9px] text-muted-foreground">Likes</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{formatNumber(selectedPost.like_count)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Views</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{formatNumber(selectedPost.view_count)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Comments</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{formatNumber(selectedPost.comment_count)}</p>
                </div>
              </div>

              {/* Comment Tree */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-card-foreground border-b border-border pb-2">Bình luận cào được</h4>
                <div className="space-y-3 text-[11px] leading-relaxed">
                  {loadingComments ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">Đang tải bình luận...</div>
                  ) : commentTree.length > 0 ? (
                    commentTree.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                            <span className="font-semibold text-foreground">{comment.author_nickname || "Anonymous"}</span>
                            <span>{timeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-card-foreground">{comment.content}</p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                            <span>❤️ {comment.like_count} likes</span>
                          </div>
                        </div>
                        {/* Replies */}
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="ml-5 bg-muted/20 p-2 rounded-lg border border-border/30">
                            <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                              <span className="font-semibold text-foreground">{reply.author_nickname || "Anonymous"}</span>
                              <span>{timeAgo(reply.created_at)}</span>
                            </div>
                            <p className="text-card-foreground">{reply.content}</p>
                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                              <span>❤️ {reply.like_count} likes</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">Chưa có bình luận nào cho bài đăng này.</div>
                  )}
                </div>
              </div>

              {/* Delete button in detail panel */}
              <div className="border-t border-border pt-4 mt-4">
                <button
                  onClick={() => openSingleDelete(selectedPost.id)}
                  className="w-full h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors duration-150 flex items-center justify-center gap-1.5"
                >
                  <TrashIcon className="size-3.5" />
                  Xóa bài viết này
                </button>
              </div>
            </div>
          ) : (
            <div className="h-40 rounded-xl border border-border border-dashed flex items-center justify-center text-muted-foreground text-xs bg-card">
              Chọn một bài viết để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        count={deleteCount}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeleteTargetId(null);
          }
        }}
        deleting={deleting}
      />
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải bài viết...</div>}>
      <PostsPageContent />
    </Suspense>
  );
}
