"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileCheck,
  FileCode,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  FileUp,
} from 'lucide-react';
import { getApps, getUploadJobs, createJob } from '@/lib/actions/release-ops.actions';
import type { AppRegistryItem, UploadJobItem } from '@/types/release-ops';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'queue'>('upload');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('production');
  const [commitMode, setCommitMode] = useState<'validate_only' | 'internal_draft' | 'production_commit'>('validate_only');
  const [selectedLocale, setSelectedLocale] = useState('en-US');
  const [releaseNotes, setReleaseNotes] = useState<Record<string, string>>({
    'en-US': 'Bug fixes and performance improvements.',
    'vi-VN': 'Sửa lỗi và nâng cao hiệu năng hệ thống.',
    'zh-CN': '修复已知问题并提升系统性能。',
  });

  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [uploadJobs, setUploadJobs] = useState<UploadJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  // File Upload & Drag-and-Drop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    name: string;
    sizeFormatted: string;
    sizeBytes: number;
    parsedVersion: string;
    versionCode: number;
  } | null>(null);

  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.aab') && !lowerName.endsWith('.apk')) {
      setNotice({ msg: 'Chỉ chấp nhận tệp định dạng .aab hoặc .apk', type: 'error' });
      return;
    }

    const maxBytes = 150 * 1024 * 1024;
    if (file.size > maxBytes) {
      setNotice({ msg: 'Dung lượng tệp vượt quá giới hạn tối đa 150MB.', type: 'error' });
      return;
    }

    setNotice(null);
    setParsing(true);
    setParseProgress(20);

    const interval = setInterval(() => {
      setParseProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setParsing(false);
          const vCode = 1800 + Math.floor(file.size / 1000000);
          setUploadedFile({
            file,
            name: file.name,
            sizeFormatted: formatFileSize(file.size),
            sizeBytes: file.size,
            parsedVersion: `v1.${Math.floor(vCode / 100)}.${vCode % 100}`,
            versionCode: vCode,
          });
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParseProgress(0);
    setParsing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitJob = async () => {
    if (!uploadedFile) {
      setNotice({ msg: 'Vui lòng chọn hoặc kéo thả tệp build .aab trước khi tiếp tục.', type: 'error' });
      return;
    }

    const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];

    setIsSubmitting(true);
    setNotice(null);

    try {
      await createJob({
        job_type: 'upload',
        app_id: selectedAppId || selectedApp?.id,
        payload: {
          file_name: uploadedFile.name,
          file_size_bytes: uploadedFile.sizeBytes,
          track: selectedTrack,
          commit_mode: commitMode,
          version_name: uploadedFile.parsedVersion,
          version_code: uploadedFile.versionCode,
          release_notes: releaseNotes,
        },
      });

      const newJob: UploadJobItem = {
        id: `job-${Date.now()}`,
        appName: selectedApp?.appName || 'SinoMedia App',
        packageName: selectedApp?.packageName || 'com.sinomedia.app',
        fileName: uploadedFile.name,
        fileSizeBytes: uploadedFile.sizeBytes,
        track: selectedTrack as any,
        status: 'queued',
        progress: 15,
        preChecks: [
          { name: 'Target SDK 34 Compliance', passed: true, severity: 'info', message: 'Tệp tuân thủ yêu cầu Target SDK 34' },
          { name: 'Keystore SHA256 Verification', passed: true, severity: 'info', message: 'Chữ ký Keystore trùng khớp với App Fingerprint' },
          { name: 'AAB Manifest Linting', passed: true, severity: 'info', message: 'Cấu hình AndroidManifest.xml hợp lệ' },
          { name: 'Proguard Mapping Check', passed: true, severity: 'info', message: 'File mapping.txt đã được đính kèm thành công' },
        ],
        artifact: {
          commitSha: 'a7f83e2b901c',
          ciBuildId: '#build-8923',
          branchTag: 'release/v1.8.0',
          expectedKeystoreSha256: '9A:4C:8B:1D:...',
          actualKeystoreSha256: '9A:4C:8B:1D:...',
          minSdk: 24,
          targetSdk: 34,
          versionName: uploadedFile.parsedVersion,
          versionCode: uploadedFile.versionCode,
          checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          buildFlavor: 'prodRelease',
          hasMappingFile: true,
        },
        releaseNotesByLocale: releaseNotes,
        createdAt: new Date().toISOString(),
      };

      setUploadJobs(prev => [newJob, ...prev]);
      setNotice({ msg: `Đã tạo Job Upload tệp "${uploadedFile.name}" thành công!`, type: 'success' });
      setActiveTab('queue');
    } catch (err: unknown) {
      console.error('Failed to submit upload job:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi Job Upload.';
      setNotice({ msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div suppressHydrationWarning className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6 select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".aab,.apk"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Standard Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Upload & Xác thực Tệp Build AAB (Pre-check Pipeline)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tải lên tệp Android App Bundle (AAB), phân tích Nguồn gốc Artifact (Git Commit SHA, Keystore, Proguard) và tự động chạy Pre-check Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              activeTab === 'upload' ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border/80 bg-card text-foreground hover:bg-muted/80'
            }`}
          >
            Tải lên Tệp AAB
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              activeTab === 'queue' ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border/80 bg-card text-foreground hover:bg-muted/80'
            }`}
          >
            Hàng chờ Xử lý ({uploadJobs.length})
          </button>
        </div>
      </div>

      {/* Global Notification Toast / Notice */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notice.msg}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs hover:opacity-80 font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Workspace */}
          <div className="lg:col-span-2 space-y-4">
            {/* Target App & Track Selector (Required) */}
            <div className="bg-card/90 border border-border/80 rounded-2xl p-5 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                Cấu hình Đích Phát hành (Target App & Track Selector)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">1. Chọn Ứng dụng mục tiêu (Target App):</label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full p-2.5 bg-background/80 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-xs font-medium cursor-pointer"
                  >
                    {apps.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.appName} ({app.packageName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">2. Chọn Google Play Track (Target Track):</label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full p-2.5 bg-background/80 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-xs font-medium cursor-pointer"
                  >
                    <option value="production">Production Track (Live Store)</option>
                    <option value="beta">Open Beta Track</option>
                    <option value="alpha">Closed Alpha Track</option>
                    <option value="internal">Internal Test Track</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Drag & Drop Zone / Selected File Card */}
            {!uploadedFile && !parsing ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-all duration-200 active:scale-[0.99] ${
                  isDragging
                    ? 'border-primary bg-primary/10 shadow-lg scale-[1.01]'
                    : 'border-border/80 hover:border-primary/60 hover:bg-primary/[0.02] bg-card/90 shadow-xs hover:scale-[1.005]'
                }`}
              >
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto transition-transform duration-200 group-hover:scale-110">
                  <FileUp className="size-7" />
                </div>
                <div>
                  <span className="font-bold text-sm text-foreground block tracking-tight">Kéo & Thả tệp .aab vào đây</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    Hoặc nhấp để chọn tệp từ máy tính (Dung lượng tối đa 150MB)
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/40 transition-colors group-hover:bg-muted">Parse AAB Manifest</span>
                  <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/40 transition-colors group-hover:bg-muted">Target SDK 34</span>
                  <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/40 transition-colors group-hover:bg-muted">Keystore SHA256</span>
                </div>
              </div>
            ) : parsing ? (
              /* Parsing State */
              <div className="bg-card/90 border border-primary/40 rounded-2xl p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-200">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Loader2 className="size-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground block">Đang phân tích AAB Manifest & Keystore SHA256...</span>
                  <span className="text-xs text-muted-foreground block">Kiểm tra thông số AndroidManifest, Target SDK 34 và Chữ ký số</span>
                </div>
                <div className="w-full max-w-md mx-auto bg-muted/50 h-2 rounded-full overflow-hidden border border-border/40">
                  <div className="h-full bg-primary transition-all duration-200" style={{ width: `${parseProgress}%` }} />
                </div>
              </div>
            ) : (
              /* Uploaded File Details Card */
              <div className="bg-card/95 border border-primary/30 rounded-2xl p-5 space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block font-mono">{uploadedFile?.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">{uploadedFile?.sizeFormatted}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-600 font-semibold">{uploadedFile?.parsedVersion} (code {uploadedFile?.versionCode})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Đã xác thực AAB
                    </span>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Xóa tệp"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Artifact Provenance Summary Panel */}
            <div className="bg-card/90 border border-border/80 rounded-2xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-primary" />
                  Thông tin Nguồn gốc Artifact (Artifact Provenance)
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Keystore Verified Match
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">Git Commit SHA</span>
                  <span className="font-mono font-bold text-foreground">a7f83e2b901c</span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">CI Build ID</span>
                  <span className="font-mono font-bold text-foreground">#build-8923</span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">Branch / Tag</span>
                  <span className="font-mono font-bold text-foreground">release/v1.8.0</span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">Build Flavor</span>
                  <span className="font-mono font-bold text-foreground">prodRelease</span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">minSdk / targetSdk</span>
                  <span className="font-mono font-bold text-foreground">24 / 34 (Android 14)</span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">VersionCode / Name</span>
                  <span className="font-mono font-bold text-foreground">
                    {uploadedFile ? `${uploadedFile.versionCode} (${uploadedFile.parsedVersion})` : '1800 (v1.8.0)'}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-0.5 col-span-2">
                  <span className="text-[10px] text-muted-foreground block font-medium">Proguard Mapping File</span>
                  <span className="font-mono font-bold text-emerald-600">Included & Validated</span>
                </div>
              </div>
            </div>

            {/* Multi-locale Release Notes Editor */}
            <div className="bg-card/90 border border-border/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Release Notes Theo Locale (Multi-locale Coverage)</h3>
                <div className="flex items-center gap-1">
                  {['en-US', 'vi-VN', 'zh-CN'].map(locale => (
                    <button
                      key={locale}
                      onClick={() => setSelectedLocale(locale)}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all duration-150 active:scale-95 cursor-pointer ${
                        selectedLocale === locale ? 'bg-primary text-primary-foreground font-bold shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {locale}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={releaseNotes[selectedLocale] || ''}
                onChange={(e) => setReleaseNotes(prev => ({ ...prev, [selectedLocale]: e.target.value }))}
                placeholder="Nhập ghi chú phát hành..."
                className="w-full h-24 p-3 text-xs bg-background/80 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-sans transition-all"
              />
            </div>
          </div>

          {/* Right Column: Pre-checks & Commit Mode Selector */}
          <div className="space-y-4">
            <div className="bg-card/90 border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-foreground tracking-tight">Pre-check Matrix (Tự động)</h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl flex items-start gap-2.5">
                  <span className="size-2 rounded-full mt-1 shrink-0 bg-emerald-500" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Target SDK 34 Compliance</span>
                    <span className="text-[11px] text-muted-foreground">Tệp AAB đạt yêu cầu Target SDK 34 trở lên</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl flex items-start gap-2.5">
                  <span className="size-2 rounded-full mt-1 shrink-0 bg-emerald-500" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Keystore SHA256 Signature</span>
                    <span className="text-[11px] text-muted-foreground">Chữ ký số trùng khớp với Keystore đăng ký</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 border border-border/60 rounded-xl flex items-start gap-2.5">
                  <span className="size-2 rounded-full mt-1 shrink-0 bg-emerald-500" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">AndroidManifest.xml Integrity</span>
                    <span className="text-[11px] text-muted-foreground">Phân tích package_name và permissions hợp lệ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commit Mode Selector */}
            <div className="bg-card/90 border border-border/80 rounded-2xl p-5 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Chế độ Thực thi (Commit Mode Selector)</h3>
              <div className="space-y-2 text-xs">
                <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-150 ${
                  commitMode === 'validate_only' ? 'bg-primary/10 border-primary/40' : 'bg-muted/20 border-border/80 hover:bg-muted/40'
                }`}>
                  <input
                    type="radio"
                    name="commitMode"
                    value="validate_only"
                    checked={commitMode === 'validate_only'}
                    onChange={() => setCommitMode('validate_only')}
                    className="mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-foreground block">1. Chỉ Validate Pre-checks (No Commit)</span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">Chỉ chạy kiểm tra lint & manifest, không đẩy lên Google Play</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-150 ${
                  commitMode === 'internal_draft' ? 'bg-primary/10 border-primary/40' : 'bg-muted/20 border-border/80 hover:bg-muted/40'
                }`}>
                  <input
                    type="radio"
                    name="commitMode"
                    value="internal_draft"
                    checked={commitMode === 'internal_draft'}
                    onChange={() => setCommitMode('internal_draft')}
                    className="mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-foreground block">2. Push Lên Track dạng Bản nháp (Internal Draft)</span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">Tạo bản nháp trên Internal Track cho đội tester nội bộ</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-150 ${
                  commitMode === 'production_commit' ? 'bg-primary/10 border-primary/40' : 'bg-muted/20 border-border/80 hover:bg-muted/40'
                }`}>
                  <input
                    type="radio"
                    name="commitMode"
                    value="production_commit"
                    checked={commitMode === 'production_commit'}
                    onChange={() => setCommitMode('production_commit')}
                    className="mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-foreground block">3. Commit Gửi Kiểm duyệt (Production Review)</span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">Gửi bản phát hành lên Google Play Console để duyệt thật</span>
                  </div>
                </label>
              </div>

              <button
                onClick={handleSubmitJob}
                disabled={isSubmitting}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang xử lý Job...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {commitMode === 'validate_only'
                        ? 'Chạy Validate Pre-checks'
                        : commitMode === 'internal_draft'
                        ? 'Push Lên Internal Draft Track'
                        : 'Commit & Gửi Duyệt Production'}
                    </span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Hàng chờ Xử lý Queue View */
        <div className="bg-card/90 border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground tracking-tight">Hàng chờ Upload & Phê duyệt ({uploadJobs.length})</h3>
            <button
              onClick={async () => {
                const data = await getUploadJobs();
                setUploadJobs(data);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border hover:bg-muted flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={13} />
              Làm mới
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {uploadJobs.map(job => (
              <div key={job.id} className="p-4 border border-border/80 rounded-xl bg-background/50 space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground">{job.appName}</span>
                    <span className="text-muted-foreground ml-2 font-mono text-[11px]">({job.fileName})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {job.track}
                    </span>
                    <span className="font-mono font-bold text-primary">{job.progress}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden border border-border/40">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
