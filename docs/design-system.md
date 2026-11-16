# GreenLedger Design System & UI Specification

## 1. Visual Identity & Brand Philosophy

**GreenLedger** is a commercial-grade, decentralized peer-to-peer (P2P) renewable energy trading platform and verified Renewable Energy Certificate (REC) settlement protocol.

### Brand Tagline
> **"Powering a Fairer, Greener Energy Future."**

### Visual Philosophy
1. **Fintech Precision**: Crisp, high-contrast numeric displays, clear metric trends, and structured transaction ledgers inspired by enterprise financial platforms (Stripe, Mercury, Linear).
2. **Renewable Clean Aesthetics**: Fresh, vibrant emerald green primary accents (`#16A34A`), deep forest greens (`#15803D`, `#14532D`), paired with deep navy (`#0F172A`) and crisp slate surfaces.
3. **Web3 Transparency**: Dedicated on-chain Sepolia status indicators, truncated wallet pills (`0x7099...79C8`), cryptographic hash previews, and ERC-721 token badges.
4. **Information Hierarchy**: Intentional spacing, minimal visual clutter, clear card groupings, and subtle hover interactions.

---

## 2. Logo Design Specification

The GreenLedger logo combines:
- **Hexagonal Ledger Node**: Represents decentralized, distributed microgrid topologies.
- **Renewable Lightning Ray**: Represents clean electrical generation (Solar, Wind, Hydro).
- **Cryptographic Vertices**: Six corner nodes illustrating immutable peer-to-peer verification.
- **Typography**: "Green" in dark navy (or crisp white in dark mode) paired with "Ledger" in bold emerald green (`#16A34A`).

Implemented as a vector SVG component in `frontend/components/ui/Logo.tsx` with variants:
- `full`: Logo mark + stylized typography + optional tagline.
- `icon`: Standalone hexagonal mark for app bars and favicons.
- `stacked`: Vertically centered mark and typography for auth screens.

---

## 3. Color System & Semantic Tokens

| Token Name | Hex Code | Tailwind Token | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `#16A34A` | `brand-600` | Primary buttons, active highlights, key values |
| **Dark Green** | `#15803D` | `brand-700` | Hover states on primary buttons, dark badges |
| **Vibrant Green** | `#22C55E` | `brand-500` | Live status pulse dots, dark mode primary text |
| **Deep Forest Green** | `#14532D` | `brand-900` | Split-screen auth panel gradient, branded cards |
| **Dark Navy** | `#0F172A` | `navy-900` | Primary dark background, high-contrast headings |
| **Deep Dark Background**| `#0B0F19` | `navy-950` | Full dark theme canvas background |
| **Light Canvas** | `#F8FAFC` | `slate-50` | Public landing & light dashboard background |
| **Card White** | `#FFFFFF` | `white` | Light mode card surfaces and inputs |
| **Dark Surface** | `#131C2E` | `navy-900/90` | Dark mode card containers and popovers |
| **Secondary Text** | `#64748B` | `navy-500` | Subtitles, labels, table headers, descriptions |
| **Border Light** | `#E2E8F0` | `navy-200` | Light mode card and table borders |
| **Border Dark** | `#1E293B` | `navy-800` | Dark mode card and table borders |
| **Solar Energy** | `#F59E0B` | `energy-solar` | Solar PV telemetry, amber badges, generation charts |
| **Wind Energy** | `#0284C7` | `energy-wind` | Wind turbine telemetry, sky blue badges |
| **Hydro Energy** | `#06B6D4` | `energy-hydro` | Hydroelectric telemetry, cyan badges |

---

## 4. Typography Hierarchy

GreenLedger uses **Inter** (sans-serif) as the primary font family:

| Level | Size / Leading | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `text-5xl` to `text-7xl` | `font-black` (900) | `tracking-tight` | Landing hero title ("Trade Energy, Power Change") |
| **Page Title** | `text-2xl` to `text-3xl` | `font-extrabold` (800) | `tracking-tight` | Dashboard page titles, modal titles |
| **Section Title** | `text-lg` to `text-xl` | `font-bold` (700) | `tracking-tight` | Card titles, table section headers |
| **Statistic Value** | `text-2xl` to `text-3xl` | `font-extrabold` (800) | `tracking-tight` | KPI metrics (e.g. `142.30 kWh`, `1.0625 ETH`) |
| **Body Standard** | `text-sm` (14px) | `font-medium` (500) | `normal` | Form inputs, table cells, general copy |
| **Secondary / Meta**| `text-xs` (12px) | `font-medium` (500) | `normal` | Subtitles, helper text, breadcrumbs |
| **Eyebrow / Overline**| `text-xs` (11-12px) | `font-bold` (700) | `tracking-wider` | Uppercase category labels, status badges |
| **Code / Hash** | `text-xs` font-mono | `font-semibold` (600) | `normal` | Ethereum addresses (`0x7099...`), trade hashes |

---

## 5. Reusable UI Component Library (22 Components)

All components are implemented in `frontend/components/ui/`:

1. **`Button`**: Primary, secondary, outline, ghost, and danger variants with loading spinner, disabled states, and icon slots.
2. **`Input`**: Text/password/number inputs with floating labels, start/end icons, error feedback, and helper text.
3. **`Select`**: Native-compliant custom styled dropdown with chevron icon and error styling.
4. **`Textarea`**: Multi-line input with character counter and error states.
5. **`Card`**: Structured card container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`, plus accent borders (`green`, `blue`, `amber`, `purple`).
6. **`StatisticCard`**: Fintech KPI card with large numerical values, change percentages, trend indicators (`up`, `down`, `neutral`), and iconography.
7. **`DataTable`**: Generic responsive data table with custom column renderers, empty state fallback, and skeleton loaders.
8. **`Modal`**: Accessible dialog overlay with backdrop blur, Escape key listener, header, body, and action footer.
9. **`ConfirmationDialog`**: Alert dialog for high-consequence operations (clearing cycles, certificate retirement).
10. **`Toast`**: Non-blocking toast notification system (`success`, `error`, `warning`, `info`) with auto-dismiss.
11. **`StatusBadge`**: Pill badges for microgrid sources (`SOLAR`, `WIND`, `HYDRO`), market states (`ACTIVE`, `PENDING`, `SETTLED`, `FAILED`), and priority tiers (`CRITICAL`, `COMMERCIAL`, `STANDARD`).
12. **`SearchBar`**: Fast search input with keyboard shortcut hint (`⌘K`) and clear button.
13. **`FilterDropdown`**: Multi-option filter popover with active count badge and reset trigger.
14. **`Pagination`**: Pagination controls with numbered buttons, active indicator, and ellipsis.
15. **`Sidebar`**: Left navigation bar supporting role-specific menus for **Producer**, **Consumer**, and **Administrator**, with collapsible mobile drawer.
16. **`Navbar`**: Top bar with mobile hamburger trigger, quick view switcher pills, Sepolia network badge, notification bell, theme toggle, and Web3 wallet button.
17. **`PageHeader`**: Standard page header containing breadcrumbs, title, subtitle, and action buttons.
18. **`LoadingSkeleton`**: Animated placeholder blocks for cards, tables, and typography.
19. **`EmptyState`**: Minimalist illustration with headline, description, and primary CTA.
20. **`ErrorState`**: Diagnostic banner with error message and retry button.
21. **`ChartContainer`**: Financial card wrapper for charts with timeframe selector tabs (`24H`, `7D`, `30D`, `1Y`).
22. **`WalletButton`**: Web3 wallet connector displaying truncated address, testnet balance, Sepolia badge, and disconnect menu.

---

## 6. Layout Architectures

### 6.1. Public Layout (`PublicLayout.tsx`)
- Fixed header with brand logo, public navigation links, and "Launch Portal" CTA.
- Responsive hero, metrics showcase, microgrid energy cards, and role feature sections.
- Comprehensive footer with protocol links and regulatory compliance indicators.

### 6.2. Authentication Layout (`AuthLayout.tsx`)
- **Split-Screen Layout** (directly inspired by user visual reference):
  - **Left Form Area**: Clean white background, minimalist logo, email/password inputs with show/hide password toggle, remember-me checkbox, role toggle for sign-up, and direct Web3 wallet sign-in option.
  - **Right Branded Panel**: Deep forest green gradient (`#14532D` to `#0F172A`) with a floating microgrid telemetry preview card featuring mini charts, live metrics (`48.5k kWh`, `34.0t CO2`, `128 RECs`), and brand messaging.

### 6.3. Dashboard Layout (`DashboardLayout.tsx`)
- Responsive sidebar with independent navigation structures for:
  - **Producer**: Generation Feeds, Energy Listings, Settlements & Payouts, Microgrid Settings.
  - **Consumer**: Clean Energy Market, Demands & Allocations, My REC Certificates, Carbon Profile.
  - **Administrator**: System Monitor, Double Auction Clearing, TOU & Dynamic Pricing, Meter Directory, Audit Trail.
- Sticky top navigation with Sepolia network verification, theme switcher, and Web3 wallet management.

---

## 7. Light and Dark Theme Implementation

The design system incorporates high-contrast light and dark themes using Tailwind's `darkMode: "class"` configuration and CSS variables:
- **Light Theme**: Clean, professional daylight aesthetic with `#F8FAFC` slate background, pure white cards, `#0F172A` text, and crisp `#E2E8F0` borders.
- **Dark Theme**: Deep nocturnal fintech aesthetic with `#0B0F19` navy canvas, `#131C2E` elevated card surfaces, `#F8FAFC` text, and subtle `#1E293B` borders.
- Persistent state saved to `localStorage` and reactive to system OS preferences (`prefers-color-scheme`).
