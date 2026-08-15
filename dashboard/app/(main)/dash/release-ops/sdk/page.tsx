"use client";

import React, { useState, useEffect } from 'react';
import { getTargetSDKStatus } from '@/lib/actions/release-ops.actions';
import type { TargetSDKItem, TargetSDKPolicyConfig } from '@/types/release-ops';

// Policy config tĩnh theo Google Play mandate — không cần load từ DB
const SDK_POLICY: TargetSDKPolicyConfig = {
  policySource: 'Google Play Developer Policy (Mandate August 2026)',
  requiredApiLevel: 34,
  deadlineDate: '2026-08-31',
  gracePeriodDays: 30,
  isMandatory: true,
};

export default function TargetSDKPage() {
  const [createdBatchMsg, setCreatedBatchMsg] = useState<string | null>(null);
  const [sdkItems, setSdkItems] = useState<TargetSDKItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTargetSDKStatus();
        setSdkItems(data);
      } catch (err) {
        console.error('Failed to load SDK status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  const handleCreateBatchUpgrade = (appName: string) => {
    setCreatedBatchMsg(`Đã khởi tạo Batch Job nâng cấp Target SDK 34 cho ứng dụng "${appName}"`);
    setTimeout(() => setCreatedBatchMsg(null), 4000);
  };

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Standard Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Tuân thủ Target SDK Mandate (Google Play Compliance)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu hình Chính sách Mandate, đếm ngược ngày còn lại & điều phối Batch Job nâng cấp Target SDK 34 (Android 14)
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          Hạn chót Mandate: {SDK_POLICY.deadlineDate}
        </span>
      </div>

      {createdBatchMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          ✅ {createdBatchMsg}
        </div>
      )}

      {/* ─── Policy Config Panel ─── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Cấu hình Chính sách Mandate (Policy Config)</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Mandatory Policy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] text-muted-foreground block">Nguồn Chính sách</span>
            <span className="font-semibold text-foreground">{SDK_POLICY.policySource}</span>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] text-muted-foreground block">Yêu cầu Yêu cầu tối thiểu</span>
            <span className="font-mono font-bold text-emerald-600 text-sm">Target SDK {SDK_POLICY.requiredApiLevel} (Android 14)</span>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] text-muted-foreground block">Hạn chót Áp dụng (Deadline)</span>
            <span className="font-mono font-bold text-rose-600 text-sm">{SDK_POLICY.deadlineDate}</span>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] text-muted-foreground block">Thời gian gia hạn (Grace Period)</span>
            <span className="font-semibold text-foreground">{SDK_POLICY.gracePeriodDays} ngày thêm</span>
          </div>
        </div>
      </div>

      {/* ─── SDK Compliance Table ─── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tên App & Package</th>
                <th className="py-3 px-4">Target SDK Hiện tại</th>
                <th className="py-3 px-4">Mục tiêu SDK Yêu cầu</th>
                <th className="py-3 px-4">Trạng thái Tuân thủ</th>
                <th className="py-3 px-4">Đếm ngược Hạn chót</th>
                <th className="py-3 px-4 text-right">Thao tác Nâng cấp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sdkItems.map(sdk => (
                <tr key={sdk.packageName} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-foreground block">{sdk.appName}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{sdk.packageName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    API {sdk.currentSdk}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    API {sdk.targetSdk}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${sdk.status === 'compliant' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                      {sdk.status === 'compliant' ? 'Đã Tuân thủ (Compliant)' : 'Khẩn cấp Nâng cấp (Urgent)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {sdk.daysRemaining > 0 ? (
                      <span className="text-rose-600">⏳ Còn {sdk.daysRemaining} ngày ({sdk.deadline})</span>
                    ) : (
                      <span className="text-emerald-600">✅ {sdk.deadline}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {sdk.status !== 'compliant' ? (
                      <button
                        onClick={() => handleCreateBatchUpgrade(sdk.appName)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        + Tạo Batch Upgrade
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Không cần thao tác</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
