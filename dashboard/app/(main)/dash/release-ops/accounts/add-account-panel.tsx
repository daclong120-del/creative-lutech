"use client";

import React, { useState } from "react";
import { X, Key, Upload, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createPlayAccount } from "@/lib/actions/release-ops.actions";
import type { PlayAccountItem } from "@/types/release-ops";

interface AddAccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAccount?: PlayAccountItem) => void;
}

export function AddAccountPanel({ isOpen, onClose, onSuccess }: AddAccountPanelProps) {
  const [developerId, setDeveloperId] = useState("");
  const [email, setEmail] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [jsonKeyContent, setJsonKeyContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "https://www.googleapis.com/auth/androidpublisher",
    "https://www.googleapis.com/auth/devstorage.read_write"
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setDeveloperId("");
    setEmail("");
    setBucketName("");
    setJsonKeyContent("");
    setFileName("");
    setErrorMsg(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonKeyContent(content);
      try {
        const json = JSON.parse(content);
        if (json.client_email && !email) {
          setEmail(json.client_email);
        }
        if (json.project_id && !developerId) {
          setDeveloperId(`dev-${json.project_id}`);
        }
      } catch {
        // Ignored if invalid json format
      }
    };
    reader.readAsText(file);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerId.trim()) {
      setErrorMsg("Vui lòng nhập Tên / Developer ID.");
      return;
    }
    if (!bucketName.trim()) {
      setErrorMsg("Vui lòng nhập tên GCS Bucket.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await createPlayAccount({
        developer_id: developerId.trim(),
        bucket_name: bucketName.trim(),
        service_account_key_file: jsonKeyContent || fileName || null,
      });

      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      const newAcc: PlayAccountItem = {
        id: `acc-${Date.now()}`,
        name: developerId.trim(),
        email: email.trim() || `${developerId.trim()}@gserviceaccount.com`,
        status: 'healthy',
        totalApps: 0,
        lastSyncAt: 'Vừa xong',
        quotaUsedPercentage: 2,
        keyAgeDays: 1,
        credentialExpiryDate: new Date(Date.now() + 365 * 86400 * 1000).toISOString().split('T')[0],
        scopes: selectedScopes.map(s => ({ scopeName: s, granted: true })),
      };

      onSuccess(newAcc);
      handleClose();
    } catch (err: unknown) {
      console.error("Failed to create play account:", err);
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo tài khoản Developer.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Thêm Tài khoản Google Play Developer</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Thêm Service Account Key & cấu hình hạn mức API</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs animate-in fade-in duration-150">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Developer ID / Account Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block tracking-tight">
              Tên Developer Account / ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: SinoMedia-PlayDev-01"
              value={developerId}
              onChange={(e) => setDeveloperId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background/80 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs font-medium transition-all"
            />
          </div>

          {/* Service Account Email */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block tracking-tight">
              Email Service Account
            </label>
            <input
              type="email"
              placeholder="VD: play-bot@sinomedia-app.iam.gserviceaccount.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background/80 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs font-mono transition-all"
            />
          </div>

          {/* Bucket Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block tracking-tight">
              Google Cloud Storage Bucket (APK/AAB) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: sinomedia-release-artifacts-prod"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background/80 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs font-mono transition-all"
            />
          </div>

          {/* Service Account Key JSON Upload */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block tracking-tight">
              Service Account Key (.json)
            </label>
            <div className="border border-dashed border-border/80 rounded-xl p-4 bg-muted/20 text-center hover:border-primary/50 transition-colors relative cursor-pointer active:scale-[0.99] duration-150">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-1">
                <Upload size={20} className="text-primary mb-1" />
                <span className="font-semibold text-foreground">
                  {fileName ? `File đã chọn: ${fileName}` : "Nhấp hoặc kéo thả file Service Account Key JSON"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Chấp nhận file JSON do Google Cloud Console cấp
                </span>
              </div>
            </div>
          </div>

          {/* Scopes Selection */}
          <div className="space-y-2 pt-1">
            <label className="font-bold text-foreground block flex items-center gap-1.5 tracking-tight">
              <ShieldCheck size={14} className="text-emerald-500" />
              Cấu hình OAuth Scopes & API Permissions
            </label>
            <div className="space-y-1.5">
              <div
                onClick={() => toggleScope("https://www.googleapis.com/auth/androidpublisher")}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] ${
                  selectedScopes.includes("https://www.googleapis.com/auth/androidpublisher")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/20 border-border/80 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] font-semibold block">androidpublisher</span>
                  <span className="text-[10px] text-muted-foreground block">Quản lý Releases, Tracks, App Edit API</span>
                </div>
                {selectedScopes.includes("https://www.googleapis.com/auth/androidpublisher") && (
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                )}
              </div>

              <div
                onClick={() => toggleScope("https://www.googleapis.com/auth/devstorage.read_write")}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98] ${
                  selectedScopes.includes("https://www.googleapis.com/auth/devstorage.read_write")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/20 border-border/80 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] font-semibold block">devstorage.read_write</span>
                  <span className="text-[10px] text-muted-foreground block">Quyền ghi Artifact GCS Storage</span>
                </div>
                {selectedScopes.includes("https://www.googleapis.com/auth/devstorage.read_write") && (
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 font-semibold rounded-xl border border-border/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.97] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Đang lưu..." : "Xác nhận Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
