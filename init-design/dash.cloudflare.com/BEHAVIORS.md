# Design Tokens & Behaviors — Cloudflare Support Portal

## Global Design Tokens

### Color Palette (Computed)
- **Backgrounds**:
  - Primary Page Background: `oklch(0.9875 0 0)` (approx. `#fafafa`) with a subtle `bg-dot-grid` dotted grid overlay (`radial-gradient` using `--border` color).
  - Sidebar Background: `bg-sidebar` (independent solid surface, not displaying grid dots).
  - Card Backgrounds: `#ffffff` (solid card style that covers background dots).
  - Status Pill Alert Background: `rgb(255, 250, 245)` (approx. light orange `#fffaf5`).
  - Sections: Rounded boxes with dashed borders wrapping main titles and topic lists to match the original structure.
- **Text & Borders**:
  - Primary Text: `rgb(49, 49, 49)` (approx. `#313131`)
  - Accent / Focus Blue: `rgb(0, 81, 195)` (approx. `#0051c3`)
  - Orange Warning Accent: `rgb(228, 94, 46)` (approx. `#e45e2e`)
  - Default Card Border: `1px solid oklch(0.145 0 0 / 0.1)` (subtle gray)
  - Card Hover Border: `1px solid rgb(0, 81, 195)` (blue)

### Typography
- **Primary Font Family**: `"Inter Variable", ui-sans-serif, system-ui, sans-serif`
- **Headings**:
  - "What can we help you with?": `fontSize: 30px`, `fontWeight: 600` (semibold)
  - Card Titles: `fontSize: 16px`, `fontWeight: 600`
  - Browse categories: `fontSize: 14px`, `fontWeight: 600`

---

## Interactive Behaviors

### 1. Navigation Cards (e.g., "My cases", "Submit a case")
- **Hover State**:
  - Border transitions from light gray `oklch(0.145 0 0 / 0.1)` to focus blue `rgb(0, 81, 195)`.
  - The right chevron arrow (`->`) transitions to the right slightly (micro-animation).
  - Left icon opacity transitions from `0.4` to `1.0`.
- **Active / Click State**:
  - Performs SPA routing or external navigation.

### 2. Status Alert Pill
- **Animation**:
  - Pulsing status indicator or static chevron hover state pointing to details.

### 3. Sidebar Expand / Collapse
- **Action**:
  - A small arrow toggle at the bottom-left allows collapsing the sidebar.
  - When collapsed, text labels hide and only the icon remains visible with tooltip.
  - Fully hidden behind hamburger menu on viewport width < 1024px.

---

## Asset Manifest

### SVGs / Icons
- All SVGs have been extracted and mapped into `docs/research/dash.cloudflare.com/extraction.json`.
- These icons will be exported as React components in `src/components/icons.tsx` for easy import.

### Fonts
- Standard system font fallbacks or Inter variable weights.
