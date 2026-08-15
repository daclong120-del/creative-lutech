# Component Specification — Footer

## HTML Structure
- Outer container: `<footer>` (flex or grid).
- Left Section: Copyright note: "© 2026 Cloudflare, Inc.".
- Right Section: Flat list of links: "Support", "System Status", "Careers", "Terms of Use", "Report Security Issues", "Privacy Policy", "Cookie Preferences".

## Computed CSS
- Background: `rgb(248, 248, 248)` or transparent (matching page bottom color).
- Border-top: `1px solid oklch(0.145 0 0 / 0.05)`.
- Height: `60px`.
- Padding: `0 24px`.
- Font size: `12px` to `13px`.
- Link color: `rgb(0, 81, 195)`.

## Content & Assets
- Text & Links: "Support", "System Status", "Careers", "Terms of Use", "Report Security Issues", "Privacy Policy", "Cookie Preferences".
- SVG: Shield/checkmark privacy icon for "Cookie Preferences".

## Interactive Behaviors
- Hovering footer links adds underlining and active color highlights.

## Responsive Behavior
- Desktop: Single flex-row with items justified between.
- Mobile: Links wrap onto multiple lines or center align under the main layout.
