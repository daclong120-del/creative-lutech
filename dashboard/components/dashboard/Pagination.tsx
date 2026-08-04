import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 60,
  onPageSizeChange,
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState("");

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage("");
    }
  };

  // Generate page numbers to show (e.g., [1, 2, 3, '...', 100])
  const getPages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-border/40 mt-8 text-xs text-muted-foreground select-none">
      {/* Page Size & Stats Info */}
      <div className="flex items-center gap-4">
        <span>
          Hiển thị <span className="font-bold text-foreground">{(currentPage - 1) * pageSize + 1}</span> -{" "}
          <span className="font-bold text-foreground">{Math.min(currentPage * pageSize, totalPages * pageSize)}</span> của{" "}
          <span className="font-bold text-foreground">{totalPages * pageSize}</span> kết quả
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Dòng mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-1.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-[11px]"
            >
              {[20, 40, 60, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls & jump input */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="size-8 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-120 active:scale-90"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page buttons */}
        {getPages().map((page, index) => {
          if (page === "...") {
            return (
              <span key={`dots-${index}`} className="size-8 flex items-center justify-center font-mono">
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              type="button"
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={cn(
                "size-8 rounded-lg text-xs font-semibold border transition-all duration-120 flex items-center justify-center active:scale-90",
                isCurrent
                  ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold scale-105"
                  : "bg-card border-border text-foreground hover:bg-muted"
              )}
            >
              {page}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="size-8 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-120 active:scale-90"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Jump Form */}
        <form onSubmit={handleJump} className="flex items-center gap-1.5 pl-2 border-l border-border/60 ml-2">
          <span>Đến</span>
          <input
            type="text"
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ""))}
            placeholder=""
            className="h-8 w-11 rounded-lg border border-border bg-background text-foreground text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs transition-all duration-150"
          />
          <span>Trang</span>
        </form>
      </div>
    </div>
  );
}
