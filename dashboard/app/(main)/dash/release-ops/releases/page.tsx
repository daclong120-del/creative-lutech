"use client";

import React, { useState, useEffect } from 'react';
import { getReleases } from '@/lib/actions/release-ops.actions';
import DropdownSelect from '@/components/dashboard/DropdownSelect';
import { AppReleaseItem, ReleaseStatus, TrackType } from '@/types/release-ops';
import ReleaseOpsNavTabs from '@/components/dashboard/release-ops/ReleaseOpsNavTabs';

function StatusBadge({ status }: { status: ReleaseStatus }) {
  const map: Record<ReleaseStatus, { label: string; style: string }> = {
    draft: { label: 'Bản nháp', style: 'bg-muted text-muted-foreground border-border' },
    building: { label: 'Đang Build', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    in_review: { label: 'Chờ duyệt Play', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    rolling_out: { label: 'Staged Rollout', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    live: { label: 'Live Store', style: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
    rejected: { label: 'Từ chối', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
    halted: { label: 'Tạm dừng', style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
    failed: { label: 'Lỗi Build', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
    policy_blocked: { label: 'Khóa Chính sách', style: 'bg-red-500/15 text-red-700 dark:text-red-400 font-bold border-red-500/30' },
  };

  const item = map[status] || { label: status, style: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
}

function TrackBadge({ track }: { track: TrackType }) {
  const map: Record<TrackType, string> = {
    production: 'Production',
    beta: 'Open Beta',
    alpha: 'Closed Alpha',
    internal: 'Internal Test',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
      {map[track]}
    </span>
  );
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<AppReleaseItem[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<AppReleaseItem | null>(null);
  const [actionTarget, setActionTarget] = useState<{ release: AppReleaseItem; action: 'increase' | 'live' | 'halt' } | null>(null);
  const [businessReason, setBusinessReason] = useState('');
  const [ticketRef, setTicketRef] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getReleases();
        setReleases(data);
      } catch (err) {
        console.error('Failed to load releases:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ─── Filters ───
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedGate, setSelectedGate] = useState<string>('all');

  const filteredReleases = releases.filter(r => {
    const matchesSearch = r.appName.toLowerCase().includes(searchQuery.toLowerCase()) || r.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesTrack = selectedTrack === 'all' || r.track === selectedTrack;
    const matchesAccount = selectedAccount === 'all' || r.accountName === selectedAccount;
    const matchesHealth = selectedHealth === 'all' || r.healthGuard.recommendation === selectedHealth;
    const matchesGate = selectedGate === 'all' || (selectedGate === 'passed' ? r.readinessGate.precheckPassed : !r.readinessGate.precheckPassed);

    return matchesSearch && matchesStatus && matchesTrack && matchesAccount && matchesHealth && matchesGate;
  });

  const confirmAction = () => {
    if (!actionTarget) return;
    const { release, action } = actionTarget;

    setReleases(prev => prev.map(r => {
      if (r.id !== release.id) return r;
      if (action === 'increase') {
        const nextPct = Math.min(100, r.rolloutPercentage + 20);
        return {
          ...r,
          rolloutPercentage: nextPct,
          status: nextPct === 100 ? 'live' : 'rolling_out',
          updatedAt: 'Vừa cập nhật (Audit OK)',
        };
      }
      if (action === 'live') {
        return { ...r, rolloutPercentage: 100, status: 'live', updatedAt: 'Vừa cập nhật (Audit OK)' };
      }
      if (action === 'halt') {
        return { ...r, status: 'halted', updatedAt: 'Vừa cập nhật (Audit OK)' };
      }
      return r;
    }));

    setActionTarget(null);
    setBusinessReason('');
    setTicketRef('');
    if (selectedRelease?.id === release.id) {
      setSelectedRelease(null);
    }
  };

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Standard Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Danh sách Bản phát hành (Releases & Rollouts)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý staged rollouts, kiểm tra Readiness Gate & Health Guard trước khi tăng tỷ lệ phát hành
          </p>
        </div>

        <input
          type="text"
          placeholder="Tìm theo tên app, package..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64"
        />
      </div>

      {/* ─── Multi-Filter Control Bar ─── */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Trạng thái:</span>
          <DropdownSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'Tất cả Status' },
              { value: 'rolling_out', label: 'Rolling Out' },
              { value: 'in_review', label: 'In Review' },
              { value: 'live', label: 'Live' },
              { value: 'halted', label: 'Halted' },
              { value: 'policy_blocked', label: 'Policy Blocked' },
            ]}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Track:</span>
          <DropdownSelect
            value={selectedTrack}
            onChange={setSelectedTrack}
            options={[
              { value: 'all', label: 'Tất cả Tracks' },
              { value: 'production', label: 'Production' },
              { value: 'beta', label: 'Open Beta' },
              { value: 'alpha', label: 'Closed Alpha' },
              { value: 'internal', label: 'Internal' },
            ]}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Account:</span>
          <DropdownSelect
            value={selectedAccount}
            onChange={setSelectedAccount}
            options={[
              { value: 'all', label: 'Tất cả Account' },
              { value: 'Creative Lutech Dev Alpha', label: 'Creative Lutech Dev Alpha' },
              { value: 'Creative Lutech Global Studio', label: 'Creative Lutech Global Studio' },
              { value: 'SinoMedia Ops HK', label: 'SinoMedia Ops HK' },
            ]}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Health Signal:</span>
          <DropdownSelect
            value={selectedHealth}
            onChange={setSelectedHealth}
            options={[
              { value: 'all', label: 'Tất cả Health' },
              { value: 'safe_to_increase', label: 'Safe to Increase' },
              { value: 'halt_recommended', label: 'Halt Recommended' },
              { value: 'hold', label: 'Hold' },
            ]}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Gate Status:</span>
          <DropdownSelect
            value={selectedGate}
            onChange={setSelectedGate}
            options={[
              { value: 'all', label: 'Tất cả Gate' },
              { value: 'passed', label: 'Gate Passed' },
              { value: 'failed', label: 'Gate Failed' },
            ]}
          />
        </div>

        <span className="ml-auto font-mono text-muted-foreground font-semibold">
          {filteredReleases.length} / {releases.length} kết quả
        </span>
      </div>

      {/* ─── Dense Releases Table ─── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Ứng dụng / Package</th>
                <th className="py-3 px-4">Tài khoản Console</th>
                <th className="py-3 px-4">Track / Version</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Readiness & Health Guard</th>
                <th className="py-3 px-4">Rollout %</th>
                <th className="py-3 px-4 text-right">Thao tác Safety</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReleases.map(r => {
                const isHaltRecommended = r.healthGuard.recommendation === 'halt_recommended';
                const isActionBlocked = !!r.actionDisabledReason;

                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedRelease(r)}
                        className="font-semibold text-foreground hover:text-primary text-left block"
                      >
                        {r.appName}
                      </button>
                      <span className="font-mono text-[11px] text-muted-foreground">{r.packageName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-foreground">{r.accountName}</span>
                      <span className="text-[10px] text-muted-foreground block font-mono">Sync: {r.provenance.lastSyncAt}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <TrackBadge track={r.track} />
                        <span className="font-mono text-[11px] text-foreground block">v{r.versionName} ({r.versionCode})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <StatusBadge status={r.status} />
                        {isActionBlocked && (
                          <span className="text-[10px] text-amber-600 block font-medium">⚠️ Restricted</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${r.readinessGate.precheckPassed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[11px] font-semibold text-foreground">
                            {r.readinessGate.precheckPassed ? 'Gate Passed' : 'Gate Failed'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Crash: {r.healthGuard.crashRatePct}% | ANR: {r.healthGuard.anrRatePct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-foreground">{r.rolloutPercentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-[width] duration-450 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${r.rolloutPercentage}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedRelease(r)}
                        className="px-2.5 py-1 text-[11px] font-medium border border-border rounded-md hover:bg-muted"
                      >
                        Chi tiết & Gate
                      </button>
                      {isActionBlocked ? (
                        <span className="px-2 py-1 text-[11px] font-medium bg-muted text-muted-foreground rounded-md cursor-not-allowed" title={r.actionDisabledReason}>
                          Bị khóa
                        </span>
                      ) : isHaltRecommended ? (
                        <button
                          onClick={() => setActionTarget({ release: r, action: 'halt' })}
                          className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700 animate-pulse"
                          title="Halt Recommended do chỉ số ANR/Crash tăng cao!"
                        >
                          ⚠️ Halt Recommended
                        </button>
                      ) : (
                        r.status === 'rolling_out' && (
                          <button
                            onClick={() => setActionTarget({ release: r, action: 'increase' })}
                            className="px-2.5 py-1 text-[11px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                          >
                            +20% Rollout
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Centered Modal Popup / Readiness Gate Panel ─── */}
      {selectedRelease && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedRelease.appName}</h3>
                <span className="font-mono text-xs text-muted-foreground">{selectedRelease.packageName}</span>
              </div>
              <button
                onClick={() => setSelectedRelease(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-base font-semibold"
                aria-label="Đóng popup"
              >
                &times;
              </button>
            </div>

            {/* Restricted Reason Warning */}
            {selectedRelease.actionDisabledReason && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
                <strong>Lý do khóa thao tác:</strong> {selectedRelease.actionDisabledReason}
              </div>
            )}

            {/* 1. Release Timeline Trace */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Vòng đời Phát hành (Release Timeline Trace)</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedRelease.timeline.map((t, idx) => (
                  <div key={idx} className={`p-2 rounded-lg border ${t.completed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted/30 border-border text-muted-foreground'}`}>
                    <span className="font-semibold block">{t.label}</span>
                    <span className="text-[10px] font-mono block">{t.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Release Readiness Gate Checklist (Real Pass/Fail Dynamic Render) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Bảng Kiểm duyệt Cổng Readiness (Dynamic Readiness Gate)</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>1. Automated Pre-checks</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.precheckPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRelease.readinessGate.precheckPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>2. Ngưỡng Crash Rate (Thực tế: {selectedRelease.readinessGate.crashRatePct}%)</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.crashRatePct < 0.1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRelease.readinessGate.crashRatePct < 0.1 ? 'PASSED (< 0.1%)' : 'FAILED (>= 0.1%)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>3. Ngưỡng ANR Rate (Thực tế: {selectedRelease.readinessGate.anrRatePct}%)</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.anrRatePct < 0.4 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRelease.readinessGate.anrRatePct < 0.4 ? 'PASSED (< 0.4%)' : 'FAILED (>= 0.4%)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>4. Trạng thái Chính sách Google Play</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.policyStatus === 'clean' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRelease.readinessGate.policyStatus === 'clean' ? 'CLEAN (PASSED)' : 'BLOCKED (FAILED)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>5. Data Safety Form Compliance</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.dataSafetyComplete ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRelease.readinessGate.dataSafetyComplete ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>6. Release Notes Multi-locale ({selectedRelease.readinessGate.releaseNotesLocalesCount} locales)</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.releaseNotesLocalesCount >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedRelease.readinessGate.releaseNotesLocalesCount >= 10 ? 'READY' : 'INCOMPLETE'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <span>7. VersionCode Snapshot Match ({selectedRelease.versionCode})</span>
                  <span className={`font-bold ${selectedRelease.readinessGate.snapshotMatched ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRelease.readinessGate.snapshotMatched ? 'MATCHED' : 'MISMATCH'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Rollout Health Guard & AI Signal */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Chỉ số Sức khỏe (Rollout Health Guard)</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Lượt cài đặt ở % hiện tại:</span>
                <span className="font-bold text-foreground">{selectedRelease.healthGuard.installVolumeAtCurrent.toLocaleString()} installs</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tín hiệu Khuyến nghị:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${selectedRelease.healthGuard.recommendation === 'safe_to_increase' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                  {selectedRelease.healthGuard.recommendation === 'safe_to_increase' ? '✅ Tốt để Tăng Rollout' : '⚠️ Khuyến nghị Tạm dừng (Halt)'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {!selectedRelease.actionDisabledReason && (
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  onClick={() => setActionTarget({ release: selectedRelease, action: 'halt' })}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                >
                  Tạm dừng Release (Halt)
                </button>
                <button
                  onClick={() => setActionTarget({ release: selectedRelease, action: 'live' })}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Phát hành Live 100%
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Approval & Audit Confirmation Modal ─── */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Xác nhận Thao tác Safety & Ghi Audit</h3>
              <button onClick={() => setActionTarget(null)} className="text-muted-foreground text-sm font-bold">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ứng dụng:</span>
                  <span className="font-bold text-foreground">{actionTarget.release.appName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hành động:</span>
                  <span className="font-bold text-primary uppercase">{actionTarget.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thay đổi Delta:</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {actionTarget.release.rolloutPercentage}% &rarr; {actionTarget.action === 'increase' ? Math.min(100, actionTarget.release.rolloutPercentage + 20) : actionTarget.action === 'live' ? 100 : 0}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Lý do thay đổi nghiệp vụ (Bắt buộc):</label>
                <textarea
                  value={businessReason}
                  onChange={(e) => setBusinessReason(e.target.value)}
                  placeholder="Ví dụ: Đã verify crash rate < 0.05%, duyệt tăng rollout thêm 20%..."
                  className="w-full h-16 p-2 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Mã Ticket / PR tham chiếu (Tùy chọn):</label>
                <input
                  type="text"
                  value={ticketRef}
                  onChange={(e) => setTicketRef(e.target.value)}
                  placeholder="Ví dụ: #RELEASE-1042 / PR-892"
                  className="w-full p-2 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setActionTarget(null)}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted font-medium"
              >
                Hủy bỏ
              </button>
              <button
                disabled={!businessReason.trim()}
                onClick={confirmAction}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Xác nhận & Ghi Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
