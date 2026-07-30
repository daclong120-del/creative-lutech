"use client";

import React, { useState, useEffect } from 'react';
import { getApps, getUploadJobs } from '@/lib/actions/release-ops.actions';
import type { AppRegistryItem, UploadJobItem } from '@/types/release-ops';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'queue'>('upload');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('production');
  const [commitMode, setCommitMode] = useState<'validate_only' | 'internal_draft' | 'production_commit'>('validate_only');
  const [selectedLocale, setSelectedLocale] = useState('en-US');
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [uploadJobs, setUploadJobs] = useState<UploadJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [appsData, jobsData] = await Promise.all([
          getApps(),
          getUploadJobs(),
        ]);
        setApps(appsData);
        setUploadJobs(jobsData);
        if (appsData.length > 0) {
          setSelectedAppId(appsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load upload data:', err);
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
          <h1 className="text-lg font-bold text-foreground">Upload & Xác thực Tệp Build AAB (Pre-check Pipeline)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tải lên tệp Android App Bundle (AAB), phân tích Nguồn gốc Artifact (Git Commit SHA, Keystore, Proguard) và tự động chạy Pre-check Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'upload' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground hover:bg-muted'}`}
          >
            Tải lên Tệp AAB
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'queue' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground hover:bg-muted'}`}
          >
            Hàng chờ Xử lý ({uploadJobs.length})
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Workspace */}
          <div className="lg:col-span-2 space-y-4">
            {/* Target App & Track Selector (Required) */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Cấu hình Đích Phát hành (Target App & Track Selector)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground block">1. Chọn Ứng dụng mục tiêu (Target App):</label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {apps.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.appName} ({app.packageName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block">2. Chọn Google Play Track (Target Track):</label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="production">Production Track (Live Store)</option>
                    <option value="beta">Open Beta Track</option>
                    <option value="alpha">Closed Alpha Track</option>
                    <option value="internal">Internal Test Track</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div className="border-2 border-dashed border-border hover:border-primary/50 bg-card rounded-xl p-8 text-center space-y-3 cursor-pointer transition-colors">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground block">Kéo & Thả tệp .aab vào đây</span>
                <span className="text-xs text-muted-foreground">Hoặc nhấp để chọn tệp từ máy tính (Dung lượng tối đa 150MB)</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span className="px-2 py-0.5 rounded bg-muted">Parse AAB Manifest</span>
                <span className="px-2 py-0.5 rounded bg-muted">Target SDK 34</span>
                <span className="px-2 py-0.5 rounded bg-muted">Keystore SHA256</span>
              </div>
            </div>

            {/* Artifact Provenance Summary Panel */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Thông tin Nguồn gốc Artifact (Artifact Provenance)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Keystore Verified Match
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg">
                  <span className="text-[10px] text-muted-foreground block">Git Commit SHA</span>
                  <span className="font-mono font-bold text-foreground">a7f83e2b901c</span>
                </div>
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg">
                  <span className="text-[10px] text-muted-foreground block">CI Build ID</span>
                  <span className="font-mono font-bold text-foreground">#build-8923</span>
                </div>
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg">
                  <span className="text-[10px] text-muted-foreground block">Branch / Tag</span>
                  <span className="font-mono font-bold text-foreground">release/v1.8.0</span>
                </div>
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg">
                  <span className="text-[10px] text-muted-foreground block">Build Flavor</span>
                  <span className="font-mono font-bold text-foreground">prodRelease</span>
                </div>
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg">
                  <span className="text-[10px] text-muted-foreground block">minSdk / targetSdk</span>
                  <span className="font-mono font-bold text-foreground">24 / 34 (Android 14)</span>
                </div>
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg">
                  <span className="text-[10px] text-muted-foreground block">VersionCode / Name</span>
                  <span className="font-mono font-bold text-foreground">1800 (v1.8.0)</span>
                </div>
                <div className="p-2.5 bg-muted/30 border border-border rounded-lg col-span-2">
                  <span className="text-[10px] text-muted-foreground block">Proguard Mapping File</span>
                  <span className="font-mono font-bold text-emerald-600">Included & Validated</span>
                </div>
              </div>
            </div>

            {/* Multi-locale Release Notes Editor */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Release Notes Theo Locale (Multi-locale Coverage)</h3>
                <div className="flex items-center gap-1">
                  {['en-US', 'vi-VN', 'zh-CN'].map(locale => (
                    <button
                      key={locale}
                      onClick={() => setSelectedLocale(locale)}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded ${selectedLocale === locale ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}
                    >
                      {locale}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={uploadJobs[0]?.releaseNotesByLocale[selectedLocale] || ''}
                onChange={() => {}}
                placeholder="Nhập ghi chú phát hành..."
                className="w-full h-20 p-2.5 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>
          </div>

          {/* Right Column: Pre-checks & Commit Mode Selector */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Pre-check Matrix (Tự động)</h3>

              <div className="space-y-2">
                {(uploadJobs[0]?.preChecks ?? []).map((check, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 border border-border rounded-lg flex items-start gap-2.5">
                    <span className={`size-2 rounded-full mt-1 shrink-0 ${check.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <span className="font-semibold text-xs text-foreground block">{check.name}</span>
                      <span className="text-[11px] text-muted-foreground">{check.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commit Mode Selector */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Chế độ Thực thi (Commit Mode Selector)</h3>
              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 p-2 bg-muted/20 border border-border rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="commitMode"
                    value="validate_only"
                    checked={commitMode === 'validate_only'}
                    onChange={() => setCommitMode('validate_only')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-foreground block">1. Chỉ Validate Pre-checks (No Commit)</span>
                    <span className="text-muted-foreground text-[11px]">Chỉ chạy kiểm tra lint & manifest, không đẩy lên Google Play</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-muted/20 border border-border rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="commitMode"
                    value="internal_draft"
                    checked={commitMode === 'internal_draft'}
                    onChange={() => setCommitMode('internal_draft')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-foreground block">2. Push Lên Track dạng Bản nháp (Internal Draft)</span>
                    <span className="text-muted-foreground text-[11px]">Tạo bản nháp trên Internal Track cho đội tester nội bộ</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-muted/20 border border-border rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="commitMode"
                    value="production_commit"
                    checked={commitMode === 'production_commit'}
                    onChange={() => setCommitMode('production_commit')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-foreground block">3. Commit Gửi Kiểm duyệt (Production Review)</span>
                    <span className="text-muted-foreground text-[11px]">Gửi bản phát hành lên Google Play Console để duyệt thật</span>
                  </div>
                </label>
              </div>

              <button className="w-full py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2">
                {commitMode === 'validate_only' ? 'Chạy Validate Pre-checks' : commitMode === 'internal_draft' ? 'Push Lên Internal Draft Track' : 'Commit & Gửi Duyệt Production'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Hàng chờ Upload & Phê duyệt</h3>
          <div className="space-y-3">
            {uploadJobs.map(job => (
              <div key={job.id} className="p-3 border border-border rounded-lg bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-foreground">{job.appName}</span>
                    <span className="text-xs text-muted-foreground ml-2">({job.fileName})</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary">{job.progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
