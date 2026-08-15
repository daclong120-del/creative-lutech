"use client";

import React, { useState, useEffect } from 'react';
import { getApps, createApp, getPlayAccounts } from '@/lib/actions/release-ops.actions';
import { AppRegistryItem, PlayAccountItem } from '@/types/release-ops';

export default function AppsRegistryPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAppSpec, setSelectedAppSpec] = useState<AppRegistryItem | null>(null);
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [accounts, setAccounts] = useState<PlayAccountItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for Onboard App Wizard
  const [packageName, setPackageName] = useState('');
  const [appName, setAppName] = useState('');
  const [playAccountId, setPlayAccountId] = useState('');
  const [targetSdk, setTargetSdk] = useState(34);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [appsData, accountsData] = await Promise.all([
        getApps(),
        getPlayAccounts(),
      ]);
      setApps(appsData);
      setAccounts(accountsData);
      if (accountsData.length > 0) {
        setPlayAccountId(accountsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load apps:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim() || !appName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Package Name và Tên App.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await createApp({
        package_name: packageName.trim(),
        app_name: appName.trim(),
        play_account_id: playAccountId || null,
        target_sdk: Number(targetSdk),
      });
      await loadData();
      setPackageName('');
      setAppName('');
      setShowWizard(false);
    } catch (err) {
      console.error('Create app failed:', err);
      setFormError(err instanceof Error ? err.message : 'Tạo app mới thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* ─── Onboarding Checklist & Form Modal ─── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Onboard App Mới (Google Play Console)</h3>
              <button onClick={() => setShowWizard(false)} className="text-muted-foreground text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Package Name (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="com.example.myapp"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Tên App (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="My Application Name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Tài khoản Google Play Developer</label>
                  <select
                    value={playAccountId}
                    onChange={(e) => setPlayAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {accounts.length === 0 && <option value="">Chưa có account (Tự động gán mặc định)</option>}
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Target SDK</label>
                  <input
                    type="number"
                    value={targetSdk}
                    onChange={(e) => setTargetSdk(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1.5">
                <span className="font-semibold text-foreground block">Quy trình tự động hóa:</span>
                <p className="text-muted-foreground text-[11px]">
                  Tệp cấu hình OAuth Token, Data Safety snapshot & Checklists sẽ được khởi tạo tự động trong DB SinoMedia sau khi bấm đăng ký.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Xác nhận Onboard App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
