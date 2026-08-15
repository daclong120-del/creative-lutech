# Component Specification — BrowseByTopic

## HTML Structure
- Top tag/badge: "Knowledge base" (small rounded badge).
- Title: "Browse by topic"
- Subtitle: "Look around in our knowledge base to find detailed guides and descriptions of our products."
- Grid Container: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`.
- Topic Categories:
  - Each topic category contains a title (e.g. "Getting started") and a vertical list of anchor links.

## Computed CSS
- Categories are divided by subtle borders or clean padding.
- Title typography: `fontSize: 16px`, `fontWeight: 600`, color `rgb(0, 0, 0)`.
- Links typography: `fontSize: 14px`, color `rgb(0, 81, 195)` (or generic dark grey that transitions to blue on hover).
- Category container bottom/top border: `1px solid oklch(0.145 0 0 / 0.05)`.

## Content & Assets
- Full categorized topic list: Mapped exactly in `PAGE_TOPOLOGY.md`.
- No image assets required, fully text-driven with clean typography spacing.

## Interactive Behaviors
- Category links underline and change color to blue `rgb(0, 81, 195)` on hover.

## Responsive Behavior
- Desktop: `grid-cols-3`
- Tablet: `grid-cols-2`
- Mobile: `grid-cols-1` (all lists stack sequentially).
