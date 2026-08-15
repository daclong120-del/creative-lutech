# Page Topology — Cloudflare Support Portal

## Hostname & Route
- **Target Hostname**: `dash.cloudflare.com`
- **Route**: `/:account_id/support`

## Layout Structure
The interface consists of two main zones:
1. **Sidebar Navigation (`<aside>`)**
   - Visible on Desktop (>= 1024px) with fixed width (240px when expanded).
   - Collapses to a compact icon-only state or is completely hidden on mobile/tablet viewports.
   - Contains navigation groups: Observe, Build, Protect & Connect, Manage Account.

2. **Main Panel Content (`<main>`)**
   - Flex container filling the remaining horizontal space.
   - Background color: `oklch(0.9875 0 0)` (off-white).
   - Contains the following zones:
     - **Header Bar**:
       - Left: "Support Portal" text / Logo.
       - Right: "Ask AI" button, "Support" help icon, Profile dropdown button.
       - Mobile: Adds Hamburger menu toggle on the far left.
     - **Notification Pill**:
       - Floating indicator for active issues: "Cloudflare Status: 1 active issue ->".
     - **Primary Section ("What can we help you with?")**:
       - Centered title.
       - 2x3 Grid of Navigation Cards (Stacks vertically on Mobile).
         - Cards: "My cases", "Submit a case", "Ask AI", "Report abuse", "Ask community".
     - **Promotional Section ("See what's new")**:
       - Layout: Text column on the left, floating graphics on the right.
       - Row of CTA buttons: "Cloudflare blog", "Changelog", "Press releases".
       - Mobile: Floating graphics hidden, buttons wrap.
     - **Topic Grid ("Browse by topic")**:
       - Tag: "Knowledge base".
       - 3-column Grid of categorized list links (Stacks to 1-column on Mobile).
       - Categories: Getting started, Billing, Security, Developer Platform, SASE, Caching, DNS, Network, Analytics, Reference Architecture.
     - **Footer Bar**:
       - Grid or horizontal list of utility links.
       - Copyright notice.
