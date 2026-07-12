# Changelog

## v1.13.0 — 422-Brand Search and Live Menu Provider Upgrade

- Added a hidden, deduplicated registry containing all 422 restaurant brands requested for U.S. search.
- Added common aliases and punctuation-insensitive restaurant recognition.
- Removed the restaurant directory and restaurant quick-search chip list beneath the search input.
- Changed blank search to show only contextual/recent food content rather than a chain directory.
- Added canonical restaurant-name enrichment before live provider searches.
- Added restaurant-aware ranking for online results.
- Added a recognized-restaurant status panel only after a search is entered.
- Added a Food Cloud status card in Settings.
- Added Nutritionix restaurant-food integration to the secure Cloudflare Worker.
- Retained FatSecret and USDA provider integrations and Open Food Facts fallback.
- Added optional Worker rate-limiter binding support.
- Added 422-brand registry, Food Cloud provider, security, offline-cache, and browser regressions.
- Updated the service-worker shell and all versioned assets to 1.13.0.

## v1.12.0

- Added the layered universal-food foundation, 1,348 offline restaurant records, provider-quality labels, and the initial Food Cloud gateway.
