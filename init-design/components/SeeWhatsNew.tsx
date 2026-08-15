"use client";

import React from "react";
import { BlogIcon, ChangelogIcon, PressReleasesIcon, WhatsNewIllustrationIcon } from "./icons";

export default function SeeWhatsNew() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl border border-border bg-card p-6 shadow-sm select-none">
      {/* Left panel: Context and CTAs */}
      <div className="flex-1 space-y-4 text-left">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            See what&apos;s new
          </h2>
          <p className="mt-1 text-xs text-muted-foreground leading-normal max-w-lg">
            Stay up to date with Cloudflare. Explore our product updates, blog posts, developer changelogs, and recent news releases.
          </p>
        </div>

        {/* CTA buttons row */}
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="#"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            <BlogIcon size={14} className="text-muted-foreground" />
            <span>Blog</span>
          </a>
          <a
            href="#"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            <ChangelogIcon size={14} className="text-muted-foreground" />
            <span>Changelog</span>
          </a>
          <a
            href="#"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            <PressReleasesIcon size={14} className="text-muted-foreground" />
            <span>Press Releases</span>
          </a>
        </div>
      </div>

      {/* Right panel: Animated SVG Illustration */}
      <div className="flex shrink-0 items-center justify-center bg-muted/20 rounded-lg p-3 border border-border/50 min-h-[110px] w-full md:w-auto">
        <WhatsNewIllustrationIcon className="text-muted-foreground/80 dark:text-muted-foreground/50 max-w-[200px]" />
      </div>
    </div>
  );
}
