# Component Specification — SeeWhatsNew

## HTML Structure
- Flex/Grid container: Splits text column on the left and vector graphics on the right.
- Left column:
  - Title: "See what's new"
  - Description: "Stay up to date with the latest product updates, news, and announcements."
  - Button Row: "Cloudflare blog", "Changelog", "Press releases".
- Right column:
  - Decorative floating illustrations (three document/icon blocks with floating/bobbing animations).

## Computed CSS
- Background: None (takes parent background, but container borders/padding define structure).
- Gap: `24px`.
- Button styles: Rounded borders, flex alignment of icon and text.

## Content & Assets
- SVGs:
  - Floating animations SVG (defined in `extraction.json` with class `.wn-float-1`, `.wn-float-2`, `.wn-float-3` and `@keyframes float` styles!).
  - Blog book icon, changelog wrench icon, press releases document icon.

## Interactive Behaviors
- The right-side illustrations have a CSS-driven keyframe floating animation (`transform: translateY(-8px)`).
- Hovering CTA buttons increases opacity/adds subtle background highlight.

## Responsive Behavior
- On mobile (width < 768px), the floating graphics on the right are hidden (`hidden sm:block`).
- Text content and CTA buttons wrap/center align for readability.
