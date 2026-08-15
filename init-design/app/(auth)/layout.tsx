"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudflareLogo, ChevronDownIcon, GlobeIcon } from "@/components/icons";

const LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "vi-VN", name: "Tiếng Việt" },
];


const CONSENT_DICT = {
  "en-US": {
    prefix: "By continuing, I agree to Cloudflare's ",
    terms: "terms",
    and: ", ",
    privacy: "privacy policy",
    and2: ", and ",
    cookies: "cookie policy",
    period: ".",
  },
  "vi-VN": {
    prefix: "Bằng việc tiếp tục, tôi đồng ý với ",
    terms: "các điều khoản",
    and: ", ",
    privacy: "chính sách bảo mật",
    and2: " và ",
    cookies: "chính sách cookie",
    period: " của Cloudflare.",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedLangCode, setSelectedLangCode] = useState("en-US");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const updateLang = () => {
      const savedLang = localStorage.getItem("preferred_language");
      if (savedLang) {
        setSelectedLangCode(savedLang);
      } else {
        setSelectedLangCode("en-US");
      }
    };

    updateLang();
    window.addEventListener("storage", updateLang);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", updateLang);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLangSelect = (code: string) => {
    setSelectedLangCode(code);
    localStorage.setItem("preferred_language", code);
    window.dispatchEvent(new Event("storage"));
    setIsDropdownOpen(false);
  };

  const isSignUpPage = pathname?.includes("/sign-up");
  const topRightLink = isSignUpPage ? "/login" : "/sign-up";
  const topRightText = isSignUpPage
    ? (selectedLangCode === "vi-VN" ? "Đăng nhập" : "Sign in")
    : (selectedLangCode === "vi-VN" ? "Đăng ký" : "Sign up");

  const hasConsentText = pathname === "/login" || pathname === "/sign-up" || pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0c0c0d] text-foreground selection:bg-primary/20 font-sans">
      {/* Header */}
      <header className="h-16 px-6 md:px-10 flex items-center justify-between bg-transparent select-none">
        <Link href="/login" className="flex items-center gap-2 cursor-pointer" aria-label="Cloudflare Home">
          <CloudflareLogo size={32} className="text-[#F6821F] dark:text-[#FBAD41]" />
        </Link>

        {/* Header Right Menu */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer select-none"
            >
              <GlobeIcon size={14} className="text-neutral-500 dark:text-neutral-400" />
              <span>{selectedLangCode === "vi-VN" ? "Tiếng Việt" : "English"}</span>
              <ChevronDownIcon size={10} className="text-neutral-400 mt-[1px]" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangSelect(lang.code)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-zinc-800 font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer select-none"
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <Link
            href={topRightLink}
            className="px-4 py-1.5 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-all shadow-sm"
          >
            {topRightText}
          </Link>
        </div>
      </header>

      {/* Main content wrapper */}
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-[490px] bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-10 transition-all">
          {children}
        </div>

        {/* Consent footnote outside the card */}
        {hasConsentText && (
          <p className="mt-6 text-center text-[11px] text-neutral-500 dark:text-neutral-400 max-w-[390px] leading-relaxed select-none">
            {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].prefix}
            <a href="#" className="underline hover:text-primary transition-colors">
              {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].terms}
            </a>
            {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].and}
            <a href="#" className="underline hover:text-primary transition-colors">
              {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].privacy}
            </a>
            {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].and2}
            <a href="#" className="underline hover:text-primary transition-colors">
              {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].cookies}
            </a>
            {CONSENT_DICT[selectedLangCode === "vi-VN" ? "vi-VN" : "en-US"].period}
          </p>
        )}
      </main>
    </div>
  );
}
