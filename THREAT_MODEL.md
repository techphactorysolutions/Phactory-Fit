# PhactoryFit 1.13.0 Threat Model

## Assets

- Local nutrition, weight, workout, and habit records.
- User-created foods and exported backups.
- Camera permission and barcode stream.
- Food-provider credentials stored in the optional server Worker.
- Provider quotas and billing exposure.

## Trust boundaries

1. Browser UI and local storage.
2. Service worker and offline cache.
3. Open Food Facts network requests.
4. Optional Phactory Food Cloud.
5. Nutritionix, FatSecret, and USDA upstream providers.
6. Public GitHub repository and deployment pipeline.

## Primary threats and mitigations

- **Stored/DOM XSS from community or imported food text:** output escaping, CSP, no inline executable code, malicious-input browser tests.
- **Credential theft from public source:** all private provider keys are server-only secrets; public config stores only an HTTPS Worker URL.
- **Worker quota abuse:** bounded queries/results, exact-origin CORS, optional rate-limiter binding, provider monitoring.
- **Cache poisoning:** explicit same-origin cache allowlist and canonical versioned keys.
- **Oversized response/import/image denial of service:** strict byte, dimension, count, and string limits.
- **False restaurant nutrition:** source-quality labels, unavailable nutrient handling, live-provider routing, archive disclosure, serving review.
- **Search-result confusion:** hidden 422-brand recognition, canonical provider queries, brand-aware ranking, duplicate suppression.
- **Camera lifecycle leaks:** camera tracks stop on explicit scanner close and remain alive through iPhone Safari permission transitions.
- **Cross-project browser-storage exposure:** dedicated custom domain recommended for public deployment.

## Out of scope

Compromise of a user's device/browser, malicious browser extensions, provider database errors, restaurant recipe changes, or credentials intentionally disclosed by the deployer cannot be fully prevented by this static package.
