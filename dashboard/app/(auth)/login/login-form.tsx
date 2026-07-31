"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleIcon } from "@/components/icons";
import { loginAction } from "@/lib/actions/auth.actions";
import { Turnstile } from "@marsidev/react-turnstile";

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
  title: "Sign in to Creative Lutech",
  emailLabel: "Email",
  emailPlaceholder: "name@example.com",
  passwordLabel: "Password",
  forgotPassword: "Forgot password?",
  logIn: "Sign in",
  loggingIn: "Signing in...",
  continueSSO: "Continue with SSO",
  continueWithGoogle: "Continue with Google",
  orSeparator: "or",
  noAccount: "Don't have an account?",
  signUp: "Sign up",
  emailRequired: "Email address is required",
  emailInvalid: "Please enter a valid email address",
  passRequired: "Password is required",
  passTooShort: "Password must be at least 8 characters",
  lastUsedBadge: "Last used",
};

const DICT: Record<string, typeof ENGLISH_DICT> = {
  "English (US)": ENGLISH_DICT,
  "Tiếng Việt": {
    title: "Đăng nhập vào Creative Lutech",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    logIn: "Đăng nhập",
    loggingIn: "Đang đăng nhập...",
    continueSSO: "Tiếp tục với SSO",
    continueWithGoogle: "Tiếp tục với Google",
    orSeparator: "hoặc",
    noAccount: "Chưa có tài khoản?",
    signUp: "Đăng ký",
    emailRequired: "Vui lòng nhập địa chỉ email",
    emailInvalid: "Địa chỉ email không hợp lệ",
    passRequired: "Vui lòng nhập mật khẩu",
    passTooShort: "Mật khẩu phải từ 8 ký tự trở lên",
    lastUsedBadge: "Dùng gần đây",
  }
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [lang, setLang] = useState("English (US)");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Field errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
    document.title = (lang === "Tiếng Việt" ? "Đăng nhập" : "Login") + " | Creative Lutech";
  }, [lang]);

  const d = DICT[lang] || DICT["English (US)"];

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
    if (val.length < 8) {
      return d.passTooShort;
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passErr);

    if (emailErr || passErr) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginAction(email, password, captchaToken || undefined);

      if (!res.success) {
        setPasswordError(res.error || "Đăng nhập thất bại.");
        return;
      }

      const activeUser = res.user?.email?.split("@")[0] || email.split("@")[0];
      
      localStorage.setItem("sinomedia_active_account", activeUser);

      const redirectUri = searchParams.get("redirect_uri");
      if (redirectUri) {
        try {
          const decoded = decodeURIComponent(redirectUri);
          if (decoded.startsWith("http://") || decoded.startsWith("https://") || decoded.startsWith("/")) {
            if (decoded.includes("dash.sinomedia.com")) {
              router.push("/dash/home");
            } else {
              router.push(decoded);
            }
            router.refresh();
            return;
          }
        } catch {}
      }
      router.push("/dash/home");
      router.refresh();
    } catch (err) {
      console.error("[Auth] Login error:", err);
      setPasswordError("Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-[22px] font-semibold text-neutral-900 dark:text-white text-left tracking-tight select-none">
        {d.title}
      </h2>

      {/* Social Login Row */}
      <div className="space-y-3 relative select-none">
        {/* Google Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-neutral-700 dark:text-zinc-200 hover:bg-neutral-50 dark:hover:bg-zinc-750 transition-colors shadow-sm cursor-pointer relative"
        >
          <GoogleIcon size={16} />
          <span>{d.continueWithGoogle}</span>
        </button>
      </div>

      {/* Separator Line */}
      <div className="relative flex items-center justify-center my-6 select-none">
        <div className="flex-grow border-t border-neutral-200 dark:border-zinc-800" />
        <span className="flex-shrink mx-4 text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider">
          {d.orSeparator}
        </span>
        <div className="flex-grow border-t border-neutral-200 dark:border-zinc-800" />
      </div>

      {/* Form */}
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
            className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-800 text-sm font-medium transition-colors outline-none focus:ring-1 focus:ring-primary ${
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
              className={`w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-zinc-800 text-sm font-medium transition-colors outline-none focus:ring-1 focus:ring-primary ${
                passwordError ? "border-destructive focus:ring-destructive" : "border-neutral-300 dark:border-zinc-700 hover:border-neutral-400 focus:border-primary"
              }`}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-transform duration-150 active:scale-90 cursor-pointer select-none"
              disabled={isLoading}
            >
              {showPassword ? (
                <div className="animate-in zoom-in-90 duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <EyeOffIcon />
                </div>
              ) : (
                <div className="animate-in zoom-in-90 duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <EyeIcon />
                </div>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]">
              {passwordError}
            </p>
          )}
        </div>

        {/* Invisible Turnstile — user không thấy gì */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            options={{ size: "invisible" }}
          />
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#0051c3] hover:bg-[#0040a1] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm active-press"
          disabled={isLoading || !email || !password}
        >

          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{d.loggingIn}</span>
            </>
          ) : (
            <span>{d.logIn}</span>
          )}
        </button>
      </form>

      {/* Links below form */}
      <div className="space-y-3.5 text-center text-xs font-semibold select-none pt-2">
        <div>
          <span className="text-neutral-500 dark:text-neutral-400 mr-1.5">{d.noAccount}</span>
          <Link href="/sign-up" className="text-primary hover:underline transition-colors">
            {d.signUp}
          </Link>
        </div>
        <div>
          <Link href="/forgot-password" className="text-primary hover:underline transition-colors">
            {d.forgotPassword}
          </Link>
        </div>
      </div>
    </div>
  );
}
