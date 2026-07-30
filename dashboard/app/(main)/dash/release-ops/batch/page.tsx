"use client";

import React, { useState, useEffect } from 'react';
import ReleaseOpsNavTabs from '@/components/dashboard/release-ops/ReleaseOpsNavTabs';
import { getBatchOperations, getOverviewStats } from '@/lib/actions/release-ops.actions';

interface BatchOp {
  id: string;
  title: string;
  operationType: string;
  status: string;
  planPayload: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  jobCounts: { succeeded: number; running: number; failed: number; pending: number; total: number };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    running: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    failed: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    pending: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };
  return map[status] ?? map.pending;
}

export default function BatchOpsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [rollbackPlanInput, setRollbackPlanInput] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [operations, setOperations] = useState<BatchOp[]>([]);
  const [headerStats, setHeaderStats] = useState({ totalApps: 0, totalAccounts: 0 });

  useEffect(() => {
    Promise.all([
      getBatchOperations(),
      getOverviewStats(),
    ]).then(([batchData, statsData]) => {
      setOperations(batchData as BatchOp[]);
      setHeaderStats({ totalApps: statsData.totalApps, totalAccounts: statsData.totalAccounts });
    }).catch(() => {});
  }, []);

  const openModal = () => {
    setModalStep(1);
    setRollbackPlanInput('');
    setShowCreateModal(true);
  };

  const handleBatchAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header Strip & Sub-nav Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Creative Lutech Release Ops</h1>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-muted border border-border">{headerStats.totalApps} apps</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded bg-muted border border-border">{headerStats.totalAccounts} dev accounts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          ✅ {actionNotice}
        </div>
      )}

      {/* Sub-nav Tabs */}
      <ReleaseOpsNavTabs />

      {/* ─── Batch Jobs Grid from DB ─── */}
      {operations.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
          <div className="text-4xl">📦</div>
          <h3 className="text-sm font-bold text-foreground">Chưa có Batch Operation nào</h3>
          <p className="text-xs text-muted-foreground">Tạo batch mới để thực hiện thao tác hàng loạt trên nhiều apps cùng lúc.</p>
          <button
            onClick={openModal}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Tạo Batch Operation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {operations.map((op) => {
            const total = op.jobCounts.total || 1;
            const successPct = (op.jobCounts.succeeded / total) * 100;
            const runningPct = (op.jobCounts.running / total) * 100;
            const failedPct = (op.jobCounts.failed / total) * 100;
            const pendingPct = (op.jobCounts.pending / total) * 100;

            return (
              <div key={op.id} className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{op.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusBadge(op.status)}`}>
                      {op.status}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground block">
                    {op.operationType} &bull; {op.jobCounts.total} jobs
                  </span>

                  {/* Segmented Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      {successPct > 0 && <div className="h-full bg-emerald-700 dark:bg-emerald-500" style={{ width: `${successPct}%` }} />}
                      {runningPct > 0 && <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${runningPct}%` }} />}
                      {failedPct > 0 && <div className="h-full bg-rose-600 dark:bg-rose-500" style={{ width: `${failedPct}%` }} />}
                      {pendingPct > 0 && <div className="h-full bg-slate-300 dark:bg-zinc-700" style={{ width: `${pendingPct}%` }} />}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono font-semibold text-muted-foreground flex-wrap">
                      {op.jobCounts.succeeded > 0 && (
                        <span className="flex items-center gap-1"><span className="size-2 rounded-xs bg-emerald-700" /> success {op.jobCounts.succeeded}</span>
                      )}
                      {op.jobCounts.running > 0 && (
                        <span className="flex items-center gap-1"><span className="size-2 rounded-xs bg-blue-600" /> running {op.jobCounts.running}</span>
                      )}
                      {op.jobCounts.failed > 0 && (
                        <span className="flex items-center gap-1"><span className="size-2 rounded-xs bg-rose-600" /> failed {op.jobCounts.failed}</span>
                      )}
                      {op.jobCounts.pending > 0 && (
                        <span className="flex items-center gap-1"><span className="size-2 rounded-xs bg-slate-300" /> pending {op.jobCounts.pending}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">
                    {new Date(op.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <div className="flex items-center gap-2 font-semibold">
                    {op.jobCounts.failed > 0 && (
                      <button
                        onClick={() => handleBatchAction(`Đã yêu cầu retry ${op.jobCounts.failed} jobs thất bại`)}
                        className="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted"
                      >
                        Retry failed
                      </button>
                    )}
                    {op.jobCounts.pending > 0 && (
                      <button
                        onClick={() => handleBatchAction('Đã hủy các jobs pending còn lại')}
                        className="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-rose-600"
                      >
                        Cancel pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Batch Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Tạo Batch Operation (Bước {modalStep}/2)</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted font-semibold text-base"
              >
                &times;
              </button>
            </div>

            {modalStep === 1 ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground block">Loại Batch Job:</label>
                  <select className="w-full p-2 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none">
                    <option>Canary Staged Rollout (20%)</option>
                    <option>Mass Promote to 100% Live</option>
                    <option>Emergency Halt All Rollouts</option>
                    <option>Dependency Bump</option>
                    <option>Target SDK Update</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground block">Kế hoạch Rollback tự động:</label>
                  <textarea
                    value={rollbackPlanInput}
                    onChange={(e) => setRollbackPlanInput(e.target.value)}
                    placeholder="Ví dụ: Tự động Halt toàn bộ batch nếu crash rate > 0.1%..."
                    className="w-full h-20 p-2 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400">
                  <strong>Preview:</strong> Batch sẽ được tạo và gửi sang Worker để xử lý.
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-border">
              {modalStep === 2 ? (
                <button onClick={() => setModalStep(1)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted font-medium">
                  &larr; Quay lại
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted font-medium">
                  Đóng
                </button>
                {modalStep === 1 ? (
                  <button
                    onClick={() => setModalStep(2)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Xem Preview &rarr;
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowCreateModal(false); handleBatchAction('Đã phê duyệt và kích hoạt Batch Job thành công'); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Xác nhận &amp; Khởi chạy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
