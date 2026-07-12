# PhactoryFit 1.13.0 — 422-Brand Restaurant Search Audit

Audit date: 2026-07-12

## Executive assessment

Version 1.13.0 implements every restaurant name supplied for search recognition, removes the browse-all restaurant directory beneath the search bar, and adds a secure live-menu architecture suitable for a public GitHub Pages deployment.

The implementation deliberately does not claim that a static ZIP permanently contains every current menu item from all 422 brands. Restaurant menus, portion definitions, regional availability, limited-time products, recipes, and nutrition values change. PhactoryFit therefore uses three layers:

1. A validated 1,348-record offline catalog for immediate use.
2. A hidden 422-brand registry for spelling, punctuation, aliases, and canonical provider queries.
3. An optional server-side Phactory Food Cloud that queries Nutritionix, FatSecret, and USDA without exposing provider credentials in the public repository.

No critical or high-severity application defect was found in the final test pass.

## Delivered changes

- Added exactly 422 unique restaurant brands to `restaurant-brands.js`.
- Added selected aliases and punctuation-insensitive matching.
- Added canonical provider routing for shorthand such as `bdubs` and typo-tolerant search terms.
- Removed the restaurant directory and quick-search brand chips from the food-search modal.
- Blank search now displays instructions/recent foods rather than a chain list.
- Restaurant recognition appears contextually only after the user types a query.
- Added restaurant-aware relevance scoring for live provider results.
- Added a Food Cloud status card in Settings.
- Added server-side Nutritionix instant search and item-detail lookup.
- Retained FatSecret and USDA provider adapters.
- Retained Open Food Facts as a packaged-food fallback.
- Added bounded responses, exact-origin CORS, server-only secrets, no-store responses, and optional rate limiting.
- Updated the service-worker shell and release metadata to 1.13.0.

## Data coverage

- Requested brand registry: 422/422 names represented
- Unique brand names: 422
- Offline menu records: 1,348
- Offline chains: 18
- Unique offline record IDs: 1,348
- Duplicate offline IDs: 0
- Live providers supported: Nutritionix, FatSecret, USDA FoodData Central

Recognition is not the same as guaranteed provider coverage. The live providers determine which current menu records are returned for a particular restaurant and query. PhactoryFit labels live, curated, archived, and community data so users can judge source quality.

## Test results

| Test group | Result |
|---|---:|
| Static, CSP, secret, asset, and deployment checks | 95/95 passed |
| Service-worker cache security | 7/7 passed |
| Restaurant brand registry | 13/13 passed |
| Food Cloud Nutritionix adapter | 12/12 passed |
| Restaurant search, ranking, serving, and logging | 15/15 passed |
| Offline restaurant data integrity | 1,348 records validated |
| Browser malicious-input security | 5/5 passed |
| UI, responsive layout, gauges, and diary editing | 5/5 passed |
| iPhone Safari camera lifecycle | 3/3 passed |
| HTML structure | 5/5 passed |
| JavaScript production-file syntax | 6/6 passed |
| npm dependency audit | 0 known vulnerabilities |
| Combined browser/workflow scenarios | 28/28 passed |
| ZIP integrity | Passed |

## Security controls verified

- No provider API key or client secret is present in public files.
- Content Security Policy excludes `unsafe-inline` and `unsafe-eval`.
- Production scripts are same-origin and version-pinned.
- Third-party API destinations are HTTPS allowlisted.
- Browser requests omit credentials and referrers.
- Search, imports, images, and JSON responses are size-bounded.
- Service-worker caching is restricted to an explicit same-origin shell.
- Unknown API responses and cross-origin responses are not cached.
- Imported and provider-supplied text is escaped before HTML rendering.
- Food Cloud enforces an exact application origin when configured correctly.
- Food Cloud responses use `no-store` and do not persist diary/profile data.
- Optional edge rate limiting is supported.

## Remaining operational requirements

Broad live menu coverage is not active until the Food Cloud Worker is deployed and at least one provider is configured. The public launch owner must:

1. Register for the selected provider(s) and accept their current terms.
2. Store provider credentials only as Worker secrets.
3. Set `APP_ORIGIN` to the exact production origin.
4. Configure rate limiting and quota monitoring.
5. Put the deployed Worker URL in root `config.js`.
6. Verify Settings reports the expected live providers.
7. Periodically review provider response formats, licenses, and menu freshness.

USDA is useful for branded-food fallback but is not a complete chain-restaurant menu source. Nutritionix and FatSecret are the primary restaurant-oriented adapters in this release.

## Final assessment

The client application, hidden 422-brand search index, offline catalog, and secure provider gateway are production-ready for a controlled public beta. The package is honest about the boundary between locally bundled data and live provider coverage. It should not be advertised as containing every permanently current U.S. restaurant menu unless the deployed providers demonstrably supply that coverage.
