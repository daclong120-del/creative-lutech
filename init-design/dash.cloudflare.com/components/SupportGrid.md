# Component Specification — SupportGrid

## HTML Structure
- Grid container: `<div>` containing the primary navigation cards.
- Cards: Mapped to React cards containing:
  - Top-left Icon wrapper (inbox, document, sparkle, flag, group).
  - Title heading (e.g. "My cases").
  - Description body text.
  - Bottom-right or top-right indicator arrow (`->`).

## Computed CSS
- Layout: Grid with `grid-cols-2` on first row, `grid-cols-3` on second row (desktop). Or a general responsive grid that changes columns.
- Card padding: `22px`.
- Card border-radius: `10px`.
- Card border: `1px solid oklch(0.145 0 0 / 0.1)`.
- Gap: `16px`.

## Content & Assets
- Mapped items:
  1. **My cases**: "View and manage your open and resolved support cases."
  2. **Submit a case**: "Create a new support case for your issue."
  3. **Ask AI**: "Get instant answers from our AI-powered assistant."
  4. **Report abuse**: "Create and submit an abuse case."
  5. **Ask community**: "Questions and answers from fellow Cloudflare users."
- Icons: Extracted SVGs from `extraction.json`.

## Interactive Behaviors
- On card hover, border turns blue: `rgb(0, 81, 195)`.
- The chevron arrow in the card moves slightly to the right (`translateX(4px)`).

## Responsive Behavior
- On tablet, changes to `grid-cols-2`.
- On mobile (width < 640px), stacks vertically to `grid-cols-1`.
