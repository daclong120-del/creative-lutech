"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReleaseOpsNavTabs from "@/components/dashboard/release-ops/ReleaseOpsNavTabs";
import { getStorePerformanceReport } from "@/lib/actions/release-ops.actions";
import type {
  StorePerformanceReportResult,
  StorePerformanceRow,
} from "@/lib/services/release-ops.service";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  DownloadCloud,
  Percent,
} from "lucide-react";

export default function StorePerformanceReportPage() {
  const [presetRange, setPresetRange] = useState("last30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("all");
  const [minVisitors, setMinVisitors] = useState<number | "">("");
  const [minAcquisitions, setMinAcquisitions] = useState<number | "">("");
  const [sortBy, setSortBy] = useState("totalVisitors");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<StorePerformanceReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStorePerformanceReport({
        presetRange,
        startDate: presetRange === "custom" ? startDate : undefined,
        endDate: presetRange === "custom" ? endDate : undefined,
        search,
        store: store === "all" ? undefined : store,
        minVisitors: typeof minVisitors === "number" ? minVisitors : undefined,
        minAcquisitions: typeof minAcquisitions === "number" ? minAcquisitions : undefined,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });
      setData(res);
    } catch (err) {
      console.error("Failed to load store performance report:", err);
    } finally {
      setLoading(false);
    }
  }, [presetRange, startDate, endDate, search, store, minVisitors, minAcquisitions, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="opacity-40 ml-1 inline" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-primary ml-1 inline font-bold" />
    ) : (
      <ArrowDown size={12} className="text-primary ml-1 inline font-bold" />
    );
  };

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1700px] mx-auto space-y-5">
      {/* Standard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Báo cáo Hiệu suất Store Performance (20 Cột V3)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Báo cáo chi tiết hiệu suất ASO, tỷ lệ chuyển đổi (Conversion Rate), lưu lượng Organic/Ads & so sánh đối thủ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Filter size={13} />
            <span>{showFilters ? "Ẩn Bộ lọc" : "Hiện Bộ lọc"}</span>
          </button>

          <button
            onClick={loadReport}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ReleaseOpsNavTabs />

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Bộ lọc Báo cáo (Filter Panel)
            </span>
            <button
              onClick={() => {
                setPresetRange("last30days");
                setStartDate("");
                setEndDate("");
                setSearch("");
                setStore("all");
                setMinVisitors("");
                setMinAcquisitions("");
                setPage(1);
              }}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
            >
              Đặt lại mặc định
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {/* Date Preset */}
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Khoảng Thời gian</label>
              <select
                value={presetRange}
                onChange={(e) => {
                  setPresetRange(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="today">Hôm nay (Today)</option>
                <option value="last7days">7 ngày qua</option>
                <option value="last30days">30 ngày qua</option>
                <option value="thisMonth">Tháng này</option>
                <option value="lastMonth">Tháng trước</option>
                <option value="thisQuarter">Quý này</option>
                <option value="lastQuarter">Quý trước</option>
                <option value="ytd">Từ đầu năm (YTD)</option>
                <option value="custom">Tùy chỉnh (Custom)</option>
              </select>
            </div>

            {/* Custom Date Pickers */}
            {presetRange === "custom" && (
              <>
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Search Box */}
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Tìm Tên / Package</label>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Lark, com.sinomedia..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Store Dropdown */}
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Nền tảng Store</label>
              <select
                value={store}
                onChange={(e) => {
                  setStore(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="all">Tất cả Stores</option>
                <option value="Google Play">Google Play</option>
                <option value="Apple App Store">Apple App Store</option>
              </select>
            </div>

            {/* Threshold Filters */}
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Lượt xem tối thiểu (Visitors)</label>
              <input
                type="number"
                placeholder="Ví dụ: 1000"
                value={minVisitors}
                onChange={(e) => {
                  setMinVisitors(e.target.value ? Number(e.target.value) : "");
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Cài đặt tối thiểu (Acquisitions)</label>
              <input
                type="number"
                placeholder="Ví dụ: 500"
                value={minAcquisitions}
                onChange={(e) => {
                  setMinAcquisitions(e.target.value ? Number(e.target.value) : "");
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Row */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Tổng Lượt xem Store</span>
              <Users size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {formatNumber(data.summary.totalVisitors)}
            </div>
            <span className="text-[11px] text-muted-foreground">Ví trị lượt truy cập trang chi tiết app</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Tổng Lượt Cài đặt</span>
              <DownloadCloud size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {formatNumber(data.summary.totalAcquisitions)}
            </div>
            <span className="text-[11px] text-muted-foreground">Tải xuống từ mọi nguồn trang Store</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Tỷ lệ Chuyển đổi (CR App Avg)</span>
              <Percent size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {data.summary.avgCrApp !== null ? `${data.summary.avgCrApp}%` : "—"}
            </div>
            <span className="text-[11px] text-muted-foreground">Trung bình trên {data.summary.totalAppsCount} ứng dụng</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Tỷ lệ Chuyển đổi Organic (CR Organic)</span>
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {data.summary.avgCrOrganic !== null ? `${data.summary.avgCrOrganic}%` : "—"}
            </div>
            <span className="text-[11px] text-muted-foreground">Lưu lượng tự nhiên từ Search & Explore</span>
          </div>
        </div>
      )}

      {/* 20-Column Data Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/60 border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider select-none">
              <tr>
                <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("store")}>
                  1. Store {renderSortIcon("store")}
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("appName")}>
                  2. Tên App & Package {renderSortIcon("appName")}
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("pic")}>
                  3. PIC (Owner) {renderSortIcon("pic")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("crAppYtd")}>
                  4. CR App YTD {renderSortIcon("crAppYtd")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("crCompetitorMedian")}>
                  5. CR Competitor {renderSortIcon("crCompetitorMedian")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("totalVisitors")}>
                  6. Total Visitors {renderSortIcon("totalVisitors")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("exploreVisitors")}>
                  7. Explore Visitors {renderSortIcon("exploreVisitors")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("searchVisitors")}>
                  8. Search Visitors {renderSortIcon("searchVisitors")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("totalAcquisitions")}>
                  9. Total Acq. {renderSortIcon("totalAcquisitions")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("exploreAcquisitions")}>
                  10. Explore Acq. {renderSortIcon("exploreAcquisitions")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("searchAcquisitions")}>
                  11. Search Acq. {renderSortIcon("searchAcquisitions")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("crDelta")}>
                  12. CR Delta {renderSortIcon("crDelta")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("organicVisitors")}>
                  13. Organic Visitors {renderSortIcon("organicVisitors")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("organicVisitorRatio")}>
                  14. Organic Vis % {renderSortIcon("organicVisitorRatio")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("organicAcquisitions")}>
                  15. Organic Acq. {renderSortIcon("organicAcquisitions")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("organicAcquisitionRatio")}>
                  16. Organic Acq % {renderSortIcon("organicAcquisitionRatio")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("crOrganic")}>
                  17. CR Organic {renderSortIcon("crOrganic")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("adsAcquisitions")}>
                  18. Ads Acq. {renderSortIcon("adsAcquisitions")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("crExplore")}>
                  19. CR Explore {renderSortIcon("crExplore")}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("crSearch")}>
                  20. CR Search {renderSortIcon("crSearch")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={20} className="py-12 text-center text-muted-foreground font-sans">
                    <RefreshCw size={20} className="animate-spin inline mr-2" />
                    Đang tải dữ liệu báo cáo Store Performance...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-12 text-center text-muted-foreground font-sans">
                    Không tìm thấy dữ liệu nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                data.items.map((row) => {
                  const isDeltaPositive = (row.crDelta ?? 0) >= 0;
                  return (
                    <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">
                        {row.store}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-foreground block truncate max-w-[180px]">
                          {row.appName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block truncate max-w-[180px]">
                          {row.packageName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-foreground">
                        {row.pic}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        {row.crAppYtd !== null ? `${row.crAppYtd}%` : "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {row.crCompetitorMedian !== null ? `${row.crCompetitorMedian}%` : "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        {formatNumber(row.totalVisitors)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {formatNumber(row.exploreVisitors)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {formatNumber(row.searchVisitors)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(row.totalAcquisitions)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {formatNumber(row.exploreAcquisitions)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {formatNumber(row.searchAcquisitions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {row.crDelta !== null ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isDeltaPositive
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}
                          >
                            {isDeltaPositive ? `+${row.crDelta}%` : `${row.crDelta}%`}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-foreground">
                        {formatNumber(row.organicVisitors)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {row.organicVisitorRatio}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-foreground">
                        {formatNumber(row.organicAcquisitions)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {row.organicAcquisitionRatio}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {row.crOrganic !== null ? `${row.crOrganic}%` : "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">
                        {formatNumber(row.adsAcquisitions)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {row.crExplore !== null ? `${row.crExplore}%` : "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {row.crSearch !== null ? `${row.crSearch}%` : "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data?.pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/30 text-xs">
            <div className="text-muted-foreground">
              Hiển thị{" "}
              <span className="font-bold text-foreground">
                {(data.pagination.page - 1) * data.pagination.pageSize + 1} -{" "}
                {Math.min(
                  data.pagination.page * data.pagination.pageSize,
                  data.pagination.totalCount
                )}
              </span>{" "}
              trên tổng số <span className="font-bold text-foreground">{data.pagination.totalCount}</span> ứng dụng
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Số dòng/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-mono font-bold text-foreground">
                  {page} / {data.pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="p-1.5 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
