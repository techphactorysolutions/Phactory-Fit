# PhactoryFit 1.13.0 Test Plan

## Restaurant search

- Verify all 422 requested brands load from the hidden registry.
- Verify registry names are unique.
- Verify no restaurant directory or brand-chip grid appears under a blank search field.
- Verify shorthand and typo searches resolve to a canonical brand.
- Verify provider-only brands show the recognized-restaurant status.
- Verify exact item terms outrank loose matches.
- Verify serving changes recalculate calories and macros.
- Verify live results can be logged and edited in the diary.

## Food Cloud

- Verify Nutritionix credentials are read only from Worker environment variables.
- Verify instant search and bounded item details normalize correctly.
- Verify FatSecret and USDA provider failures do not suppress other providers.
- Verify CORS permits only the exact configured app origin.
- Verify unsupported methods and oversized queries are rejected.
- Verify response caching is disabled.
- Verify provider secrets never appear in client responses.

## Security and offline behavior

- Run static CSP, secret, dependency, and asset checks.
- Test stored/provider XSS payloads as inert text.
- Test URL allowlists, oversized JSON, oversized backups, and anti-framing.
- Verify the service worker caches only the explicit same-origin app shell.
- Verify unknown and cross-origin resources are not cached.

## Existing application regressions

- Test all four macro gauges and responsive layouts.
- Test diary time, meal period, serving, and deletion editing.
- Test barcode scanner and iPhone camera lifecycle behavior.
- Test import/export and local persistence.
- Confirm no horizontal overflow at iPhone and iPad widths.
