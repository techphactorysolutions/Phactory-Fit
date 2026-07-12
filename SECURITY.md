# PhactoryFit Security Policy

**Supported release:** PhactoryFit 1.13.0

PhactoryFit is a static, local-first PWA. It has no account system, payment flow, authentication cookie, cloud diary database, analytics SDK, or client-side private API key.

## Public deployment model

- The app is hosted as static files on GitHub Pages or another HTTPS static host.
- Diary/profile data is stored in browser storage under the app origin.
- The optional Phactory Food Cloud is deployed separately and receives only bounded food-search queries.
- Provider credentials stay in Worker secrets and are never sent to the browser.

## Security controls

- Restrictive CSP with same-origin scripts and no `unsafe-inline` or `unsafe-eval`.
- Vendored barcode decoder with pinned dependency and integrity record.
- Strict API-origin and image-host allowlists.
- Bounded API responses, backup imports, barcode images, search strings, and saved records.
- Escaped external/imported text before DOM rendering.
- Service-worker cache allowlist to prevent arbitrary response caching.
- Food Cloud exact-origin CORS, method restrictions, output limits, `no-store`, redirect rejection, and optional rate-limiter binding.
- Search providers are isolated with `Promise.allSettled`; one provider failure does not corrupt app data.
- No restaurant-provider secret appears in `config.js`, HTML, JavaScript, or the GitHub package.

## Reporting a vulnerability

Do not publish exploit details in a public issue. Use GitHub private vulnerability reporting when enabled, or contact Tech Phactory Solutions through the repository's designated security contact.

Include the affected version, reproduction steps, impact, browser/device, and any proof-of-concept that does not expose real user data.

## Scope requiring a new audit

A new security review is required before adding accounts, cloud diary sync, progress-photo storage, Apple Health/Google Health Connect, payments, AI agents with tool access, or any provider credential in client code.
