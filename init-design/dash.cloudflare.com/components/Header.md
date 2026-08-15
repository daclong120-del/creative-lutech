# Component Specification — Header

## HTML Structure
- Outer container: `<header>` (flex-row, justify-between, items-center).
- Left Section: Breadcrumb or active portal label: "Support Portal".
- Right Section:
  - Button "Ask AI" (with sparkle icon, rounded border).
  - Help link "Support" (with question mark icon).
  - Profile dropdown button (with user profile/avatar icon).

## Computed CSS
- Height: `56px` or `64px`.
- Background: `oklch(0.9875 0 0)` (translucent background with blur/backdrop filter if needed, matching dashboard style).
- Padding: `0 24px`.
- Border-bottom: `1px solid oklch(0.145 0 0 / 0.1)`.

## Content & Assets
- Text: "Support Portal", "Ask AI", "Support".
- SVGs: Ask AI sparkle icon, Support question-mark icon, profile user icon.

## Interactive Behaviors
- Hovering "Ask AI" button changes background to a subtle grey or blue outline.
- Hovering "Support" help icon triggers color/underlining transition.
- Clicking profile icon opens the User Account settings/logout dropdown menu.

## Responsive Behavior
- On mobile (width < 1024px), a hamburger toggle menu button is added on the far-left.
- Breadcrumbs / title text sizes scale down.
