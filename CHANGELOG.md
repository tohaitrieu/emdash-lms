# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-06

### Added

- **Astro Integration** — `lmsIntegration()` for automatic page injection
- **Frontend Templates** — 5 ready-to-use pages:
  - `/academy` — Course listing
  - `/course/[slug]` — Course detail with curriculum
  - `/lesson/[slug]` — Lesson viewer with navigation
  - `/plans` — Membership pricing page
  - `/checkout/[id]` — Checkout flow
- **Style Modes** — Choose between full, theme-inherit, or minimal CSS
- **CSS Variables** — Customizable design tokens for theming
- **Layout System** — Templates integrate with user's layout via virtual module
- **Override Mechanism** — User can override any template by creating file at same path

### Changed

- Package exports updated to include `/astro`, `/pages/*`, `/styles/*`
- Added `astro` as peer dependency

## [0.1.0] - 2026-04-01

### Added

- Initial release
- Plugin API with 3 modes (membership, lms, full)
- Payment providers (Stripe, Sepay)
- Access control system
- Admin pages and API routes
- Seed data files
