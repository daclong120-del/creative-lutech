"use client";

import React, { useState, useEffect } from "react";
import DropdownSelect from "@/components/dashboard/DropdownSelect";
import { saveSettingsAction, get2CaptchaBalanceAction } from "@/lib/actions/settings.actions";

interface SettingsClientProps {
  initialSettings: {
    use2Captcha: boolean;
    captchaApiKeyConfigured: boolean;
    captchaApiKeyPreview: string;
    collectComments: boolean;
    collectReplies: boolean;
    headlessMode: boolean;
    defaultPriority: string;
    maxConcurrentTasks: number;
    maxRetries: number;
    defaultWebhookUrlConfigured: boolean;
    defaultWebhookUrlPreview: string;
    notifyOnSuccess: boolean;
    alertOnFailure: boolean;
  };
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [apiKey, setApiKey] = useState("");
  const [captchaApiKeyConfigured, setCaptchaApiKeyConfigured] = useState(initialSettings.captchaApiKeyConfigured);
  const [captchaApiKeyPreview, setCaptchaApiKeyPreview] = useState(initialSettings.captchaApiKeyPreview);
  const [showKey, setShowKey] = useState(false);
  const [balance, setBalance] = useState(0.0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [use2Captcha, setUse2Captcha] = useState(initialSettings.use2Captcha);
  const [collectComments, setCollectComments] = useState(initialSettings.collectComments);
  const [collectReplies, setCollectReplies] = useState(initialSettings.collectReplies);
  const [headlessMode, setHeadlessMode] = useState(initialSettings.headlessMode);
  const [defaultPriority, setDefaultPriority] = useState(initialSettings.defaultPriority);

  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(initialSettings.maxConcurrentTasks);
  const [maxRetries, setMaxRetries] = useState(initialSettings.maxRetries);
  
  // Trạng thái Webhook tương tự như API Key
  const [defaultWebhookUrl, setDefaultWebhookUrl] = useState("");
  const [defaultWebhookUrlConfigured, setDefaultWebhookUrlConfigured] = useState(initialSettings.defaultWebhookUrlConfigured);
  const [defaultWebhookUrlPreview, setDefaultWebhookUrlPreview] = useState(initialSettings.defaultWebhookUrlPreview);

  const [notifyOnSuccess, setNotifyOnSuccess] = useState(initialSettings.notifyOnSuccess);
  const [alertOnFailure, setAlertOnFailure] = useState(initialSettings.alertOnFailure);

  const [saving, setSaving] = useState(false);

  // Tự động tải số dư 2Captcha ở phía client từ server-side khi component mount
  useEffect(() => {
    if (use2Captcha && captchaApiKeyConfigured) {
      get2CaptchaBalanceAction()
        .then((result) => {
          if (result.balance !== undefined) {
            setBalance(result.balance);
          }
        })
        .catch((err) => {
          console.error("Failed to load initial balance:", err);
        });
    }
  }, [use2Captcha, captchaApiKeyConfigured]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        use2Captcha,
        apiKey, // Sẽ trống nếu user không chỉnh sửa
        collectComments,
        collectReplies,
        headlessMode,
        defaultPriority,
        maxConcurrentTasks,
        maxRetries,
        defaultWebhookUrl, // Sẽ trống nếu user không chỉnh sửa
        notifyOnSuccess,
        alertOnFailure,
      };
      
      const result = await saveSettingsAction(payload);
      if (result.error) {
        alert(result.error);
        return;
      }

      alert("Đã lưu cài đặt hệ thống thành công.");
      
      // Cập nhật lại UI state nếu người dùng vừa mới nhập Key mới thành công
      if (apiKey !== "") {
        setCaptchaApiKeyConfigured(true);
        setCaptchaApiKeyPreview(apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "****");
        setApiKey("");
      }

      // Cập nhật lại UI state nếu người dùng vừa mới nhập Webhook mới thành công
      if (defaultWebhookUrl !== "") {
        setDefaultWebhookUrlConfigured(true);
        try {
          const parsed = new URL(defaultWebhookUrl);
          const domain = parsed.host;
          const pathPart = parsed.pathname.length > 12 ? parsed.pathname.slice(0, 12) + "..." : parsed.pathname;
          setDefaultWebhookUrlPreview(`${parsed.protocol}//${domain}${pathPart}`);
        } catch {
          setDefaultWebhookUrlPreview(defaultWebhookUrl.length > 15 ? `${defaultWebhookUrl.slice(0, 15)}...` : "****");
        }
        setDefaultWebhookUrl("");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Lỗi khi lưu cài đặt hệ thống.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const result = await get2CaptchaBalanceAction();
      if (result.error) {
        alert(result.error);
      } else if (result.balance !== undefined) {
        setBalance(result.balance);
      }
    } catch (err) {
      console.error("Error fetching 2Captcha balance:", err);
      alert("Không thể tải số dư 2Captcha.");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Cài đặt hệ thống</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Cấu hình tham số crawler, tích hợp bên thứ ba và thông báo</p>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* Anti-bot & CAPTCHA */}
        <section className="bg-card rounded-xl border border-border">
          <div className="px-4 py-3 border-b border-border bg-muted/20 rounded-t-xl">
            <h3 className="text-xs font-bold text-card-foreground">Anti-bot & CAPTCHA Integration</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tự động vượt slide/image CAPTCHA khi tài khoản crawler gặp checkpoint</p>
          </div>
          <div className="p-4 space-y-4 text-xs">
            {/* Toggle Switch/Checkbox */}
            <label className="flex items-center gap-2 text-card-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={use2Captcha}
                onChange={(e) => setUse2Captcha(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary size-4"
              />
              <span className="font-semibold">Tự động vượt CAPTCHA qua 2Captcha</span>
            </label>

            {/* Conditionally active fields */}
            <div className={`space-y-4 transition-opacity duration-200 ${use2Captcha ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
              {/* 2Captcha API Key */}
              <div className="space-y-1">
                <span className="font-medium text-foreground">2Captcha API Key</span>
                <div className="flex gap-2 max-w-md">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    disabled={!use2Captcha}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={captchaApiKeyConfigured ? `Đã cấu hình: ${captchaApiKeyPreview}` : "Nhập 2Captcha API Key..."}
                    className="w-full h-8 px-3 border border-border rounded-lg bg-background text-foreground font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    disabled={!use2Captcha}
                    className="h-8 px-3 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              {/* 2Captcha Balance */}
              <div className="flex items-center gap-4 py-2 border-y border-border/50">
                <div>
                  <p className="text-muted-foreground font-medium">Số dư 2Captcha</p>
                  <p className="text-sm font-bold text-foreground font-mono mt-0.5">${balance.toFixed(2)} USD</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshBalance}
                  disabled={isLoadingBalance || !use2Captcha}
                  className="h-7 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 text-[11px] font-medium disabled:opacity-50"
                >
                  {isLoadingBalance ? "Đang tải..." : "🔄 Cập nhật số dư"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Task Queue & Concurrency */}
        <section className="bg-card rounded-xl border border-border">
          <div className="px-4 py-3 border-b border-border bg-muted/20 rounded-t-xl">
            <h3 className="text-xs font-bold text-card-foreground">Hàng đợi & Luồng chạy song song</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Giới hạn tài nguyên thực thi của crawler engine</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1 block">
              <span className="font-medium text-foreground">Số task chạy song song tối đa</span>
              <input type="number" value={maxConcurrentTasks} onChange={(e) => setMaxConcurrentTasks(parseInt(e.target.value, 10) || 0)} className="w-full h-8 px-2 border border-border rounded-lg bg-background text-foreground" />
            </label>
            <label className="space-y-1 block">
              <span className="font-medium text-foreground">Số lần thử lại tối đa</span>
              <input type="number" value={maxRetries} onChange={(e) => setMaxRetries(parseInt(e.target.value, 10) || 0)} className="w-full h-8 px-2 border border-border rounded-lg bg-background text-foreground" />
            </label>
            <div className="space-y-2 col-span-1 sm:col-span-2 pt-2 border-t border-border/50">
              <span className="block font-medium text-foreground mb-1">Cấu hình luồng chạy & thu thập</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 text-card-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectComments}
                    onChange={(e) => {
                      setCollectComments(e.target.checked);
                      if (!e.target.checked) setCollectReplies(false);
                    }}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Thu thập bình luận</span>
                </label>
                <label className={`flex items-center gap-2 select-none cursor-pointer transition-opacity duration-150 ${collectComments ? "text-card-foreground" : "text-muted-foreground opacity-50 pointer-events-none"
                  }`}>
                  <input
                    type="checkbox"
                    checked={collectReplies}
                    disabled={!collectComments}
                    onChange={(e) => setCollectReplies(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Bình luận phụ</span>
                </label>
                <label className="flex items-center gap-2 text-card-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headlessMode}
                    onChange={(e) => setHeadlessMode(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Chế độ headless</span>
                </label>
              </div>
            </div>
            <div className="space-y-1 col-span-1 sm:col-span-2">
              <span className="block font-medium text-foreground">Mức ưu tiên mặc định</span>
              <DropdownSelect
                value={defaultPriority}
                onChange={setDefaultPriority}
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                  { value: "low", label: "Low" }
                ]}
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-card rounded-xl border border-border">
          <div className="px-4 py-3 border-b border-border bg-muted/20 rounded-t-xl">
            <h3 className="text-xs font-bold text-card-foreground">Thông báo & Webhooks</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Nhận thông báo khi crawler hoàn thành tác vụ</p>
          </div>
          <div className="p-4 space-y-4 text-xs">
            <label className="space-y-1 block">
              <span className="font-medium text-foreground">Default Webhook URL</span>
              <input
                type="url"
                value={defaultWebhookUrl}
                onChange={(e) => setDefaultWebhookUrl(e.target.value)}
                placeholder={defaultWebhookUrlConfigured ? `Đã cấu hình: ${defaultWebhookUrlPreview}` : "https://api.telegram.org/bot.../sendMessage hoặc Discord Webhook"}
                className="w-full max-w-xl h-8 px-3 border border-border rounded-lg bg-background text-foreground font-mono focus:outline-none"
              />
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-card-foreground">
                <input type="checkbox" checked={notifyOnSuccess} onChange={(e) => setNotifyOnSuccess(e.target.checked)} className="rounded" />
                Gửi thông báo khi tác vụ hoàn thành thành công
              </label>
              <label className="flex items-center gap-2 text-card-foreground">
                <input type="checkbox" checked={alertOnFailure} onChange={(e) => setAlertOnFailure(e.target.checked)} className="rounded" />
                Gửi cảnh báo lập tức nếu task cào thất bại
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={() => window.location.reload()} className="h-8 px-4 text-xs font-medium rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
          Hủy
        </button>
        <button onClick={handleSaveSettings} disabled={saving} className="h-8 px-4 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer">
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}
