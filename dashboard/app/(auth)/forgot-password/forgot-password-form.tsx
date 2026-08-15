"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const ENGLISH_DICT = {
  title: "Forgot password?",
  description: "Enter your email address and we'll send you a link to reset your password.",
  emailLabel: "Email address",
  emailPlaceholder: "name@example.com",
  submitBtn: "Send password reset link",
  sendingBtn: "Sending...",
  backToLogin: "Return to login",
  emailRequired: "Email address is required",
  emailInvalid: "Please enter a valid email address",
  successMsg: "If a matching account exists for that email, we have sent password reset instructions.",
};

const DICT: Record<string, typeof ENGLISH_DICT> = {
  "English (US)": ENGLISH_DICT,
  "Tiếng Việt": {
    title: "Quên mật khẩu?",
    description: "Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.",
    emailLabel: "Địa chỉ email",
    emailPlaceholder: "name@example.com",
    submitBtn: "Gửi liên kết đặt lại mật khẩu",
    sendingBtn: "Đang gửi...",
    backToLogin: "Quay lại đăng nhập",
    emailRequired: "Vui lòng nhập địa chỉ email",
    emailInvalid: "Địa chỉ email không hợp lệ",
    successMsg: "Nếu tài khoản khớp với địa chỉ email đó tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
  }
};

export default function ForgotPasswordForm() {
  const [lang, setLang] = useState("English (US)");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const updateLang = () => {
      const preferred = localStorage.getItem("preferred_language");
      if (preferred === "vi-VN") {
        setLang("Tiếng Việt");
      } else {
        setLang("English (US)");
      }
    };
    updateLang();
    window.addEventListener("storage", updateLang);
    return () => window.removeEventListener("storage", updateLang);
  }, []);

  useEffect(() => {
    document.title = (lang === "Tiếng Việt" ? "Quên mật khẩu" : "Forgot password") + " | Creative Lutech";
  }, [lang]);

  const d = DICT[lang] || DICT["English (US)"];

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      return d.emailRequired;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return d.emailInvalid;
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const err = validateEmail(email);
    setEmailError(err);

    if (err) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-semibold text-neutral-900 dark:text-white text-left tracking-tight select-none">
        {d.title}
      </h2>

      {isSuccess ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            {d.successMsg}
          </div>
          
          <Link
            href="/login"
            className="block w-full text-center bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-200 text-sm font-semibold py-2.5 rounded-lg border border-neutral-300 dark:border-zinc-700 transition-colors cursor-pointer select-none"
          >
            {d.backToLogin}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold select-none leading-relaxed">
            {d.description}
          </p>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-neutral-800 dark:text-zinc-200 select-none">
              {d.emailLabel}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              placeholder={d.emailPlaceholder}
              className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-800 text-sm font-medium transition-colors outline-none focus:ring-1 focus:ring-primary ${
                emailError ? "border-destructive focus:ring-destructive" : "border-neutral-300 dark:border-zinc-700 hover:border-neutral-400 focus:border-primary"
              }`}
              disabled={isLoading}
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError && (
              <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {emailError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#0051c3] hover:bg-[#0040a1] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm"
            disabled={isLoading || !email || validateEmail(email) !== ""}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{d.sendingBtn}</span>
              </>
            ) : (
              <span>{d.submitBtn}</span>
            )}
          </button>

          {/* Separator Line */}
          <div className="border-t border-neutral-200 dark:border-zinc-800 my-6"></div>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-primary hover:underline hover:text-primary/90 transition-colors select-none"
            >
              {d.backToLogin}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
