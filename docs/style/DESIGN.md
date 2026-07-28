---
version: alpha
name: SinoMedia-dashboard-design-analysis
description: An authoritative design specification for SinoMedia Crawler & Release Ops Dashboard — a high-density, professional multi-platform social media intelligence and Google Play release management platform. Built on a crisp, high-contrast dark/light design system with signature SinoMedia Orange (#f97316), high-visibility blue primary actions (#3b82f6), 2.0 stroke technical icon metrics, dense data tables, and centered rounded-2xl modal dialogs.

colors:
  primary: "#3b82f6"
  primary-deep: "#2563eb"
  primary-soft: "#60a5fa"
  brand-orange: "#f97316"
  brand-orange-deep: "#ea580c"
  ink: "#0f172a"
  ink-secondary: "#1e293b"
  ink-mute: "#64748b"
  ink-mute-2: "#94a3b8"
  ink-faint: "#cbd5e1"
  on-primary: "#ffffff"
  on-dark: "#f8fafc"
  canvas: "#ffffff"
  canvas-soft: "#f8fafc"
  canvas-dark: "#090d16"
  canvas-card-dark: "#0f172a"
  hairline: "#e2e8f0"
  hairline-dark: "#1e293b"
  hairline-strong: "#cbd5e1"
  status-emerald: "#10b981"
  status-amber: "#f59e0b"
  status-rose: "#f43f5e"
  status-purple: "#8b5cf6"

typography:
  display-xl:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.75px
  display-lg:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.5px
  heading-lg:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.25px
  heading-md:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  caption:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  micro:
    fontFamily: "Inter, 'Outfit', system-ui, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0.2px
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 24px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 48px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 6px 12px
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 6px 12px
  sidebar-parent-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    fontWeight: 600
    rounded: "{rounded.md}"
    padding: 8px 12px
  sidebar-child-active:
    backgroundColor: "rgba(226, 232, 240, 0.8)"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    fontWeight: 700
    rounded: "{rounded.md}"
    padding: 6px 12px
  card-standard:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 16px
  modal-popup:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.2xl}"
    padding: 24px
  badge-provenance:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  badge-status-emerald:
    backgroundColor: "rgba(16, 185, 129, 0.1)"
    textColor: "{colors.status-emerald}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: 2px 8px
---

## Overview

SinoMedia Dashboard's design language is built specifically for high-density operational clarity, data transparency, and safety-gated execution control. Designed for managing multi-platform social media crawlers (Douyin, Weibo, Bilibili, Xiaohongshu) and Google Play release pipelines across 102+ mobile apps, the application features an unyielding commitment to high-contrast typography, explicit data provenance, and clear visual hierarchy.

The brand identity centers around **SinoMedia Orange** (`{colors.brand-orange}` — `#f97316`) for core platform branding and the Spider logo, coupled with an operational **Action Blue** (`{colors.primary}` — `#3b82f6`) for primary interactive controls. Semantic status colors — **Emerald** for live/success, **Amber** for review/warnings, **Rose/Red** for policy blocks/failures, and **Purple** for automation — provide instant visual triage.

Rather than relying on decorative gradients or soft low-contrast greys, SinoMedia enforces **bold, crisp typography** (`font-semibold` to `font-bold` throughout), 2.0 stroke SVG icons, explicit 5-point data provenance tags (`Play API`, `CI Webhook`, `Manual Action`), and centered `rounded-2xl` modal popups with backdrop blur.

**Key Characteristics:**
- **Dual Brand Palette**: SinoMedia Orange brand anchor (`#f97316`) + Action Blue execution primary (`#3b82f6`).
- **High Contrast Typography**: High-contrast text hierarchy (`font-semibold` menu labels, `font-bold` headings) using Inter/Outfit font stacks for maximum legibility.
- **Explicit Data Provenance**: Every metric card and data table explicitly renders data origin tags (`Play API`, `CI Webhook`, `Manual Action`, `Live 10s`) to ensure operators never act on unverified data.
- **Centered Rounded-24px Modal Dialogs**: Detailed inspect views (Release Readiness Gate, ASO GEO Warning Details, Batch Previews) use centered `rounded-2xl` popup modals with backdrop blur (`backdrop-blur-xs`) and clean circular close controls.
- **Safety-Gated Action Controls**: Destructive or high-risk actions (Rollout increase, Halt, Commit) require business justification, ticket/PR references, idempotency keys, and explicit before/after state delta previews.
- **Standardized Page Layout**: All subviews are contained within `<div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">` with single-level page headers and breadcrumb pathing in the sticky top header (`Header.tsx`).

## Colors

### Brand & Accent
- **SinoMedia Orange** (`{colors.brand-orange}` — `#f97316`): Primary brand identity anchor, spider logo mark, brand highlight.
- **Action Blue** (`{colors.primary}` — `#3b82f6`): Primary action buttons, active tab states, interactive focus rings.
- **Action Blue Deep** (`{colors.primary-deep}` — `#2563eb`): Hover/active state for primary interactive elements.
- **Status Emerald** (`{colors.status-emerald}` — `#10b981`): Live store, rollout health passed, pre-check success.
- **Status Amber** (`{colors.status-amber}` — `#f59e0b`): In-review SLA pending, key expiration warning, restricted action alert.
- **Status Rose** (`{colors.status-rose}` — `#f43f5e`): Policy blocked, ANR/Crash threshold failure, emergency halt recommendation.
- **Status Purple** (`{colors.status-purple}` — `#8b5cf6`): Automated batch jobs, canary rollout group indicators.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): Light mode background surface.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f8fafc`): Light grey background for alternate rows and cards.
- **Canvas Dark** (`{colors.canvas-dark}` — `#090d16`): Dark mode main backdrop.
- **Canvas Card Dark** (`{colors.canvas-card-dark}` — `#0f172a`): Dark mode card and modal surface.
- **Hairline** (`{colors.hairline}` — `#e2e8f0`): 1px subtle divider and card borders.
- **Hairline Dark** (`{colors.hairline-dark}` — `#1e293b`): Dark mode card and table borders.

### Text
- **Ink** (`{colors.ink}` — `#0f172a`): Primary heading text. Crisp, near-black slate.
- **Ink Secondary** (`{colors.ink-secondary}` — `#1e293b`): Body copy and menu items (`font-semibold`).
- **Ink Mute** (`{colors.ink-mute}` — `#64748b`): Subtitles, helper text, and table header labels.
- **On Primary** (`{colors.on-primary}` — `#ffffff`): White text on Action Blue buttons.

## Typography

### Font Family
- Display & UI: **Inter** / **Outfit** / System Sans (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`).
- Monospace Data (VersionCode, Commit SHA, PackageName, Timestamp): **System Mono** (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`).

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 32px | 700 | 1.2 | -0.75px | System section titles |
| `{typography.display-lg}` | 24px | 700 | 1.25 | -0.5px | Overview summary titles |
| `{typography.heading-lg}` | 18px | 700 | 1.3 | -0.25px | Page main header (`h1`) |
| `{typography.heading-md}` | 15px | 600 | 1.35 | 0 | Section & card titles |
| `{typography.body-md}` | 14px | 400 | 1.5 | 0 | Standard UI text |
| `{typography.body-sm}` | 13px | 400 | 1.45 | 0 | Compact card body |
| `{typography.caption}` | 12px | 500 | 1.4 | 0 | Button labels & subtitle (`p`) |
| `{typography.micro}` | 11px | 600 | 1.35 | 0.2px | Status pills & badge labels |
| `{typography.code}` | 11px | 500 | 1.45 | 0 | VersionCodes, PackageNames, SHAs |

## Layout

### Container Scale
- **Max Width**: `1400px` (`max-w-[1400px] mx-auto`).
- **Page Padding**: `px-4 md:px-8 py-6`.
- **Sidebar Width**: `290px` expanded, `64px` collapsed.
- **Header Height**: `56px` fixed sticky top bar.

### Layout Hierarchy
```
┌────────────────────────────────────────────────────────────────────────┐
│ Header (56px Sticky Top Bar: Breadcrumb + Theme Toggle + User Menu)   │
├─────────────┬──────────────────────────────────────────────────────────┤
│ Sidebar     │ Page Container (max-w-[1400px] mx-auto px-4 md:px-8)     │
│ (290px      │ ├─ Page Header (h1 title + p subtitle + top actions)     │
│ Sticky      │ ├─ Multi-Filter Control Bar                             │
│ Collapsible)│ ├─ Primary Data Table / Grid                              │
│             │ └─ Centered Modal Dialog Popup (on inspect action)       │
└─────────────┴──────────────────────────────────────────────────────────┘
```

## Shapes & Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Status badges, provenance tags |
| `{rounded.sm}` | 6px | Keyboard shortcut kbd tags, compact code pills |
| `{rounded.md}` | 8px | Action buttons, form select inputs, table row highlights |
| `{rounded.lg}` | 12px | Metric cards, container panels, upload dropzones |
| `{rounded.xl}` | 16px | Large composite overview cards |
| `{rounded.2xl}` | 24px | Centered modal popup dialogs |
| `{rounded.full}` | 9999px | Circular close buttons (`&times;`), avatar badges |

## Components

### 1. Sidebar Navigation Menu (`Sidebar.tsx`)
- **Parent Trigger**: `text-xs font-semibold text-slate-800 dark:text-zinc-100 hover:bg-muted`.
- **Icon Styling**: `size-4 stroke-[2] text-slate-700 dark:text-zinc-300` (technical 2.0 stroke width).
- **Nested Accordion**: `border-l-2 border-slate-200 dark:border-zinc-700 pl-3 ml-[21px]`.
- **Nested Active Item**: `bg-slate-200/80 dark:bg-zinc-800 text-slate-950 dark:text-white font-bold`.

### 2. Standard Page Header
- Single `<h1>` title in `text-lg font-bold text-foreground`.
- Subtitle `<p>` in `text-xs text-muted-foreground mt-0.5`.
- Header breadcrumb path driven automatically by route mapping (`ROUTE_LABELS` in `Header.tsx`).

### 3. Centered Modal Dialog Popup
- **Overlay**: `fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6`.
- **Container**: `bg-background border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto`.
- **Header Close Button**: `size-7 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted font-semibold`.

### 4. Safety-Gated Action Buttons & Audit Modal
- Action buttons validate readiness gate and rollout health before enabling.
- If `recommendation === 'halt_recommended'`, button converts to an urgent **`⚠️ Halt Recommended`** red alert.
- Audit confirmation modal enforces business reason input, ticket/PR link, idempotency key generation, and state delta comparison (`20% -> 40%`).

### 5. Multi-Filter Control Bar
- Provides instant real-time client-side filtering across Status, Track, Account, Health Signal, and Gate Status.

## Do's and Don'ts

### Do
- Always use `font-semibold` or `font-bold` for menu items, headers, and metric titles to maintain sharp readability.
- Maintain `strokeWidth="2.0"` for all SVG icons in navigation and action buttons.
- Render centered `rounded-2xl` modal popups for detailed inspection views rather than side drawers.
- Enforce data provenance tags (`Play API`, `CI Webhook`, `Manual Action`) on all data tables.
- Use monospace fonts (`font-mono`) for versionCodes, packageNames, commit SHAs, and timestamps.

### Don't
- Don't use parenthetical notes or inline explanation comments inside UI titles, menu item labels, breadcrumbs, or dropdown options (e.g., use "Giám sát Crawler" instead of "Giám sát Crawler (Sức khỏe system)"). Keep all UI labels clean, concise, and production-ready.
- Don't use light grey or faint text for menu items or section titles.
- Don't add redundant full-width header card wrappers inside subpages; rely on the global `Header.tsx` breadcrumb.
- Don't enable high-risk release actions (+20% rollout, live 100%) without safety gate checks.
- Don't use flat low-contrast modal overlays — always use `bg-black/60 backdrop-blur-xs` with `rounded-2xl` popups.

## Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop | ≥ 1024px | Sticky 290px sidebar, full 1400px page container, multi-column grids |
| Tablet | 768–1023px | Collapsible 64px icon-only sidebar, 2-column card grid |
| Mobile | < 768px | Slide-over mobile drawer sidebar, 1-column cards, scrollable data tables |
