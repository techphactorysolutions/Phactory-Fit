# Changelog

## v1.12.0 — Universal Food Database Foundation

### Added

- Expanded the offline U.S. restaurant catalog from 250 to 1,348 source-labeled records.
- Added Burger King, Dairy Queen, Hardee's, Little Caesars, Taco John's, Wendy's, and White Castle.
- Added common chain aliases including BK, DQ, Wendy, LittleCaesars, TacoJohns, and WhiteCastle.
- Added **Verified**, **Archive**, and **Live** source-confidence badges.
- Added an optional secure Phactory Food Cloud search layer.
- Added a Cloudflare Worker reference adapter for FatSecret and USDA FoodData Central.
- Added server-secret deployment documentation and a Wrangler example.
- Added the supplemental restaurant archive's MIT license.
- Added a dedicated 1,348-record data-integrity test.

### Changed

- Increased the normalized restaurant-catalog ceiling from 1,000 to 5,000 records.
- Combined local restaurant, Food Cloud, and Open Food Facts results with deterministic deduplication.
- Updated restaurant-search explanations so archived records are never described as current official nutrition.
- Updated the service worker to precache the expanded offline catalog.
- Updated Content Security Policy to permit a configured `workers.dev` Food Cloud endpoint while preserving the runtime destination allowlist.
- Updated all app, cache, package, test, and documentation versions to 1.12.0.

### Security

- API credentials remain excluded from GitHub Pages and `config.js`.
- Food Cloud requests use HTTPS, omit credentials and referrers, and accept only same-origin or `workers.dev` destinations.
- Worker responses are bounded and `no-store`; browser access is restricted by exact configured origin.
- Existing XSS, import, cache-poisoning, barcode, camera, and CSP protections remain active.

### Limitations

- “Every restaurant and every menu item” cannot be guaranteed by a static bundle because menus change continuously and provider licensing differs.
- The supplemental archive is intentionally labeled as archived.
- Broad, current commercial coverage requires configuring a licensed provider through Food Cloud.
