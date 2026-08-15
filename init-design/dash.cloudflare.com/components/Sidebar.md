# Component Specification — Sidebar

## HTML Structure
- Outer container: `<aside>`
- Header zone: Brand logo (Cloudflare) + Account switcher dropdown.
- Search zone: Input element styled with keyboard shortcuts helper (`Ctrl K`).
- Scrollable body:
  - Navigation links categorized under header categories ("Observe", "Build", "Protect & Connect").
  - Each item is a `<button>` or `<a>` with a SVG icon, label, and chevron arrow (if nested).
- Footer zone: Collapse/Expand toggle button at the bottom-left.

## Computed CSS
- Width: `240px` (when expanded), `64px` (when collapsed).
- Background: `#ffffff` or `oklch(0.9875 0 0)` (integrated with page theme).
- Font family: `Inter Variable`
- Text size: `14px` for navigation text, `12px` for group headers.
- Active/selected state: Subtle light blue background with dark blue indicator.

## Content & Assets
- SVGs for every sidebar icon: Mapped inside `extraction.json`.
- Text labels:
  - Account home, Recents, Domains.
  - Investigate, Analytics.
  - Compute, AI, Storage & databases, Media.
  - Application security, Zero Trust, Networking, Delivery & performance.
  - Manage account.

## Interactive Behaviors
- Hovering over a nav item shows a light grey background and makes the icon fully opaque.
- Clicking collapse/expand transitions the width smoothly from `240px` to `64px` and back.

## Responsive Behavior
- Hides completely on viewports `< 1024px`.
- Hamburger menu toggles a slide-out overlay drawer on mobile viewports.
