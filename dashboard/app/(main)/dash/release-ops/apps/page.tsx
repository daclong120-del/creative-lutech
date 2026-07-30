"use client";

import React, { useState, useEffect } from 'react';
import { getApps } from '@/lib/actions/release-ops.actions';
import { AppRegistryItem } from '@/types/release-ops';

export default function AppsRegistryPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAppSpec, setSelectedAppSpec] = useState<AppRegistryItem | null>(null);
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getApps();
        setApps(data);
      } catch (err) {
        console.error("Failed to load apps:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Standard Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Danh mục Ứng dụng (App Registry & Onboarding)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý metadata 102 ứng dụng, đội ngũ sở hữu (Team Owner), Data Safety, Privacy Policy URL & quy trình Onboard Google Play Console
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Onboard App Mới
        </button>
      </div>

      {/* ─── App Registry Table ─── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tên App & Package</th>
                <th className="py-3 px-4">Đội ngũ Sở hữu (Team Owner)</th>
                <th className="py-3 px-4">Thể loại & Ads</th>
                <th className="py-3 px-4">Tài khoản Dev</th>
                <th className="py-3 px-4">Target SDK</th>
                <th className="py-3 px-4">Privacy & Data Safety</th>
                <th className="py-3 px-4">Checklist Google Play</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-foreground block">{app.appName}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{app.packageName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-foreground">{app.teamOwner}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span className="text-foreground block">{app.category}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${app.hasAds ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                        {app.hasAds ? 'Có Quảng cáo (Ads)' : 'Không Ads'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-foreground">{app.accountName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    API {app.targetSdk}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <a
                        href={app.privacyPolicyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-[11px] font-medium block truncate max-w-[150px]"
                      >
                        🔗 Privacy Policy
                      </a>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${app.dataSafetyStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {app.dataSafetyStatus === 'verified' ? 'Data Safety Verified' : 'Action Required'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-24 space-y-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(app.checklistProgress.completed / app.checklistProgress.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {app.checklistProgress.completed}/{app.checklistProgress.total} Hoàn thành
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedAppSpec(app)}
                      className="px-2.5 py-1 text-[11px] border border-border rounded-md hover:bg-muted font-medium"
                    >
                      Checklist & Spec
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── App Spec Modal ─── */}
      {selectedAppSpec && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedAppSpec.appName}</h3>
                <span className="font-mono text-xs text-muted-foreground">{selectedAppSpec.packageName}</span>
              </div>
              <button onClick={() => setSelectedAppSpec(null)} className="text-muted-foreground text-sm font-bold">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Owner:</span>
                  <span className="font-bold text-foreground">{selectedAppSpec.teamOwner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold text-foreground">{selectedAppSpec.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target SDK:</span>
                  <span className="font-mono font-bold text-emerald-600">API {selectedAppSpec.targetSdk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Privacy Policy URL:</span>
                  <a href={selectedAppSpec.privacyPolicyUrl} target="_blank" rel="noreferrer" className="font-mono text-primary underline truncate max-w-[220px]">
                    {selectedAppSpec.privacyPolicyUrl}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setSelectedAppSpec(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Onboarding Checklist Modal ─── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Onboard App Mới (Google Play Checklist)</h3>
              <button onClick={() => setShowWizard(false)} className="text-muted-foreground text-sm font-bold">&times;</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-700 dark:text-blue-400">
                Quy trình Onboard bao gồm phân định rõ tác vụ <strong>Tự động (Automated)</strong> và tác vụ <strong>Thủ công (Manual)</strong>.
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 bg-muted/30 border border-border rounded-lg justify-between">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" defaultChecked className="mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">1. Khởi tạo App ID & Package Name</span>
                      <span className="text-muted-foreground">Đã tạo bản ghi trong SinoMedia Registry</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                    TỰ ĐỘNG
                  </span>
                </div>

                <div className="flex items-start gap-2 p-2 bg-muted/30 border border-border rounded-lg justify-between">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" defaultChecked className="mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">2. Đăng ký OAuth Token Service Account</span>
                      <span className="text-muted-foreground">Đã xác minh quyền Google Play API</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                    TỰ ĐỘNG
                  </span>
                </div>

                <div className="flex items-start gap-2 p-2 bg-muted/30 border border-border rounded-lg justify-between">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">3. Khai báo Data Safety Form & Privacy Policy</span>
                      <span className="text-muted-foreground">Điền thông tin thu thập dữ liệu người dùng trên Console</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                    THỦ CÔNG
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setShowWizard(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
