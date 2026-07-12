# PhactoryFit 1.10.0 Threat Model

## System summary

PhactoryFit is a static PWA deployed from GitHub Pages. First-party HTML, CSS, JavaScript, icons, the manifest, and a vendored ZXing barcode decoder are served from the app origin. User records are stored in `localStorage`. The only intended runtime data service is Open Food Facts.

## Protected assets

1. Nutrition, weight, activity, sleep, and workout records
2. Custom foods and locally remembered barcode records
3. Camera access and temporary camera frames
4. Integrity of calorie/macro calculations and displayed product data
5. Integrity of the deployed JavaScript and service-worker cache
6. GitHub repository, deployment branch, and custom domain

## Trust boundaries

- **Device/browser boundary:** local records and camera access are controlled by the browser profile and operating system.
- **Application-origin boundary:** scripts and local storage are trusted only within the PhactoryFit origin.
- **External-data boundary:** Open Food Facts content is untrusted input and must be normalized, escaped, size-limited, and host-restricted.
- **Supply-chain boundary:** the vendored barcode library and GitHub Actions are third-party code and must be version-pinned and monitored.
- **Deployment boundary:** repository write access and domain configuration can replace the entire client application.

## Principal threats and controls

| Threat | Impact | Primary controls | Residual risk |
|---|---|---|---|
| Stored or DOM XSS through food names, brands, imports, or API responses | Theft/modification of local fitness records; camera abuse while permission is active | Output escaping, CSP, no inline handlers, URL allowlists, malicious-input browser tests | A future unsafe DOM sink could reintroduce XSS |
| Malicious external script or compromised CDN | Full application compromise | No runtime CDN scripts; same-origin `script-src`; exact vendored dependency hash | Compromise of repository or deployment origin remains critical |
| Untrusted redirect or proxy destination | Data disclosure or malicious responses | Explicit API-origin allowlist, HTTPS-only URLs, credential omission, redirect validation, CSP `connect-src` | A deliberately added trusted proxy becomes part of the security boundary |
| Tracking image or unsafe URL from product data | Privacy leakage or script execution attempt | Official image-host allowlist, HTTPS-only, no credentials, no-referrer images | Open Food Facts image host still observes image requests |
| Oversized API/import/photo payload | Memory exhaustion, browser crash, storage abuse | Response, file, pixel, query, entry, and history limits | Device-specific memory pressure can still occur below limits |
| Prototype pollution or malformed backup | State corruption or code-path manipulation | Schema normalization, explicit field selection, type/range limits, regression test | JSON backups are not cryptographically authenticated |
| Service-worker cache poisoning or unbounded cache growth | Persistent stale/malicious UI; storage exhaustion | Same-origin scope, explicit path allowlist, canonical cache keys, no API caching | Compromised same-origin deployment can replace cached files |
| Clickjacking/embedded UI | Deceptive logging or permission prompts | Runtime anti-frame guard and CSP `frame-src 'none'` | Strong `frame-ancestors` requires an HTTP response header unavailable in ordinary GitHub Pages configuration |
| Secret exposure in public repository | API/account compromise | No client secrets, secret scanning tests, GitHub push protection recommendation | Repository owners can still commit secrets outside audited files |
| Shared-origin local-storage access | Other same-origin app reads PhactoryFit data | Dedicated custom-domain recommendation | Cannot be fully corrected by repository-path isolation |
| Voice/camera privacy misunderstanding | Unexpected platform data processing or continued camera use | First-use voice disclosure, camera permission requirement, local frame processing, explicit track cleanup | Browser/platform behavior and permissions remain external dependencies |

## Attacker profiles considered

- anonymous user supplying malicious search/product text;
- malicious or corrupted backup file;
- attacker controlling a web page that embeds PhactoryFit;
- attacker attempting cross-origin network destinations or tracking images;
- dependency-supply-chain attacker;
- unauthorized GitHub collaborator or compromised maintainer account;
- person with local access to the unlocked device/browser profile.

## Out of scope for 1.10.0

There is no backend, account, password, session, SQL database, file-upload server, payment system, multi-tenant authorization layer, or cloud health-data store. Server-side authorization, CSRF, SQL injection, SSRF, password reset, OAuth, rate limiting, and tenant isolation must be added to the threat model if those components are introduced.

## Release gates

A public release should not ship unless:

- static, browser-security, calculation, barcode, and dependency checks pass;
- the vendored scanner hash matches `VENDOR_LOCK.json`;
- no high/critical npm advisory is present;
- GitHub Pages uses HTTPS;
- a dedicated origin is selected for real users;
- camera close behavior is verified on a physical iPhone;
- backup export/import is verified with non-production test data.

## 1.10.0 restaurant-data extension

The restaurant catalog adds integrity and staleness risk, not a new privileged backend. Mitigations include a frozen same-origin data file, field-length normalization, escaped rendering, explicit nutrient-availability metadata, verification dates, location/customization caveats, and automated regression tests. Incorrect or stale restaurant nutrition remains a residual data-quality risk and must be reviewed periodically against official U.S. sources.
