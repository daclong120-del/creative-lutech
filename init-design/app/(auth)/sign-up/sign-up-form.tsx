"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ENGLISH_DICT = {
  title: "Create a Cloudflare account",
  emailLabel: "Email address",
  emailPlaceholder: "name@example.com",
  passwordLabel: "Password",
  signUp: "Sign up",
  signingUp: "Creating account...",
  alreadyHaveAccount: "Already have an account?",
  logIn: "Sign in",
  termsPrefix: "By clicking \"Sign up\", you agree to Cloudflare's",
  termsLink: "Self-Serve Subscription Agreement",
  termsAnd: "and",
  privacyLink: "Privacy Policy",
  emailRequired: "Email address is required",
  emailInvalid: "Please enter a valid email address",
  passRequired: "Password is required",
  passTooShort: "Password must be at least 8 characters",
  verifying: "Verifying you are human...",
  verified: "Success!",
  criteriaLength: "At least 8 characters",
  criteriaNumber: "At least one number (0-9)",
  criteriaSpecial: "At least one special character",
};

const VIETNAMESE_DICT = {
  title: "Tạo tài khoản Cloudflare",
  emailLabel: "Địa chỉ email",
  emailPlaceholder: "name@example.com",
  passwordLabel: "Mật khẩu",
  signUp: "Đăng ký",
  signingUp: "Đang tạo tài khoản...",
  alreadyHaveAccount: "Đã có tài khoản?",
  logIn: "Đăng nhập",
  termsPrefix: "Bằng việc nhấn vào \"Đăng ký\", bạn đồng ý với",
  termsLink: "Thỏa thuận đăng ký tự phục vụ",
  termsAnd: "và",
  privacyLink: "Chính sách bảo mật",
  emailRequired: "Vui lòng nhập địa chỉ email",
  emailInvalid: "Địa chỉ email không hợp lệ",
  passRequired: "Vui lòng nhập mật khẩu",
  passTooShort: "Mật khẩu phải từ 8 ký tự trở lên",
  verifying: "Đang xác minh...",
  verified: "Đã xác minh",
  criteriaLength: "Ít nhất 8 ký tự",
  criteriaNumber: "Ít nhất một chữ số (0-9)",
  criteriaSpecial: "Ít nhất một ký tự đặc biệt",
};

const DICT: Record<string, typeof ENGLISH_DICT> = {
  "English (US)": ENGLISH_DICT,
  "Tiếng Việt": VIETNAMESE_DICT,
};

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState("English (US)");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileState, setTurnstileState] = useState<"loading" | "success">("loading");

  // Field errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

    // Simulate Cloudflare Turnstile verification after 1.2 seconds
    const timer = setTimeout(() => {
      setTurnstileState("success");
    }, 1200);

    return () => {
      window.removeEventListener("storage", updateLang);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.title = (lang === "Tiếng Việt" ? "Tạo tài khoản" : "Create account") + " | Cloudflare";
  }, [lang]);

  const d = DICT[lang] || DICT["English (US)"];

  // Real-time password strength indicators
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecial;

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      return d.emailRequired;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return d.emailInvalid;
    }
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) {
      return d.passRequired;
    }
    if (!isPasswordValid) {
      return d.passTooShort;
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (turnstileState !== "success") {
      return;
    }

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passErr);

    if (emailErr || passErr) {
      return;
    }

    setIsLoading(true);

    // Simulate registration redirect after 1.5s
    setTimeout(() => {
      if (email) {
        localStorage.setItem("cloudflare_active_account", email.split("@")[0]);
      }
      const redirectUri = searchParams.get("redirect_uri");
      if (redirectUri) {
        try {
          const decoded = decodeURIComponent(redirectUri);
          if (decoded.startsWith("http://") || decoded.startsWith("https://") || decoded.startsWith("/")) {
            if (decoded.includes("dash.cloudflare.com")) {
              router.push("/dash/home");
            } else {
              router.push(decoded);
            }
            return;
          }
        } catch {}
      }
      router.push("/dash/home");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-semibold text-neutral-900 dark:text-white text-left tracking-tight select-none">
        {d.title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-800 text-sm font-medium transition-all outline-none focus:ring-1 focus:ring-primary ${
              emailError ? "border-destructive focus:ring-destructive" : "border-neutral-300 dark:border-zinc-700 hover:border-neutral-400 focus:border-primary"
            }`}
            disabled={isLoading}
            autoComplete="email"
          />
          {emailError && (
            <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-neutral-800 dark:text-zinc-200 select-none">
            {d.passwordLabel}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              placeholder="••••••••"
              className={`w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-zinc-800 text-sm font-medium transition-all outline-none focus:ring-1 focus:ring-primary ${
                passwordError ? "border-destructive focus:ring-destructive" : "border-neutral-300 dark:border-zinc-700 hover:border-neutral-400 focus:border-primary"
              }`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer select-none"
              disabled={isLoading}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {passwordError}
            </p>
          )}

          {/* Password Strength Checklist */}
          {password.length > 0 && (
            <div className="mt-3 space-y-2 p-3 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-800/40 text-xs select-none animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasMinLength ? "bg-green-500 text-white" : "bg-[#fafafa] dark:bg-[#2d2d2d] border border-neutral-300 dark:border-zinc-700 text-transparent"
                }`}>
                  ✓
                </span>
                <span className={hasMinLength ? "text-green-600 dark:text-green-400 font-medium" : "text-neutral-500 dark:text-neutral-400"}>
                  {d.criteriaLength}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasNumber ? "bg-green-500 text-white" : "bg-[#fafafa] dark:bg-[#2d2d2d] border border-neutral-300 dark:border-zinc-700 text-transparent"
                }`}>
                  ✓
                </span>
                <span className={hasNumber ? "text-green-600 dark:text-green-400 font-medium" : "text-neutral-500 dark:text-neutral-400"}>
                  {d.criteriaNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasSpecial ? "bg-green-500 text-white" : "bg-[#fafafa] dark:bg-[#2d2d2d] border border-neutral-300 dark:border-zinc-700 text-transparent"
                }`}>
                  ✓
                </span>
                <span className={hasSpecial ? "text-green-600 dark:text-green-400 font-medium" : "text-neutral-500 dark:text-neutral-400"}>
                  {d.criteriaSpecial}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cloudflare Turnstile Simulator Widget */}
        <div className="flex items-center justify-between border border-neutral-200 dark:border-zinc-800 rounded-lg p-3 bg-neutral-50 dark:bg-zinc-800/40 h-[65px] select-none my-5">
          <div className="flex items-center gap-3">
            {turnstileState === "loading" ? (
              <div className="w-5 h-5 rounded-full border-2 border-[#0051c3] border-t-transparent animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white animate-in zoom-in duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-all">
              {turnstileState === "loading" ? d.verifying : d.verified}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-semibold">
            <div className="flex items-center gap-1">
              <span className="text-[#F6821F] dark:text-[#FBAD41]">Cloudflare</span>
              <span>Turnstile</span>
            </div>
            <a href="#" className="hover:underline hover:text-primary transition-colors text-[8px]">
              Privacy - Terms
            </a>
          </div>
        </div>

        {/* Legal Agreements disclaimer */}
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal select-none">
          {d.termsPrefix}{" "}
          <a href="#" className="text-primary hover:underline hover:text-primary/90 transition-colors">
            {d.termsLink}
          </a>{" "}
          {d.termsAnd}{" "}
          <a href="#" className="text-primary hover:underline hover:text-primary/90 transition-colors">
            {d.privacyLink}
          </a>.
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#0051c3] hover:bg-[#0040a1] text-white text-sm font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm"
          disabled={isLoading || turnstileState !== "success" || !isPasswordValid || !email || validateEmail(email) !== ""}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{d.signingUp}</span>
            </>
          ) : (
            <span>{d.signUp}</span>
          )}
        </button>
      </form>

      {/* Separator Line */}
      <div className="border-t border-neutral-200 dark:border-zinc-800 my-6"></div>

      {/* Redirect back to Login */}
      <div className="text-center text-xs font-semibold select-none">
        <span className="text-neutral-500 dark:text-neutral-400 mr-1.5">{d.alreadyHaveAccount}</span>
        <Link href="/login" className="text-primary hover:underline hover:text-primary/90 transition-colors">
          {d.logIn}
        </Link>
      </div>
    </div>
  );
}
