import React from "react";

/**
 * # Component Footer
 * Chân trang Cloudflare Support Portal hiển thị bản quyền, các liên kết pháp lý và tùy chọn cookie.
 */
export default function Footer() {
  const links = [
    { name: "Cloudflare Website", href: "#" },
    { name: "Terms of Use", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Contact Support", href: "#" },
  ];

  return (
    <footer className="w-full border-t border-border bg-background py-6 mt-12">
      <div className="flex flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between text-xs text-muted-foreground">
        <div>
          <span>© 2026 Cloudflare, Inc. All rights reserved.</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link.href}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 border-t border-border pt-3 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary shrink-0"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
            <a
              href="#"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Cookie Preferences
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
