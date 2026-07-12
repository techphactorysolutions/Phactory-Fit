# PhactoryFit 1.7.0 Public Security Audit

## Executive assessment

PhactoryFit was audited as a public static PWA, not as a backend service. The audit found several material client-side weaknesses in 1.6.2, especially the absence of a restrictive Content Security Policy, an oversized inline third-party decoder, broadly accepted remote image URLs, unbounded external/import payloads, and overly permissive service-worker caching behavior.

Those issues have been repaired in 1.7.0. No critical or high-severity finding remains open within the implemented static-app scope. This does not prove that the application has zero vulnerabilities. Residual platform, origin-isolation, browser-storage, repository-account, and third-party-data risks are documented below and in `SECURITY.md`.

## Scope

Reviewed:

- HTML, CSS, JavaScript, PWA manifest, configuration, and service worker
- local-storage state and backup import/export
- Open Food Facts search/barcode integrations
- camera and barcode-photo handling
- DOM rendering of local and community data
- vendored barcode scanner supply chain
- GitHub Pages deployment model
- public repository secret exposure
- browser security, data-size, and cache-abuse cases

Not present and therefore not penetration-tested:

- authentication, passwords, sessions, OAuth, payment processing
- server database, SQL, SSRF, server file uploads, cloud sync
- administrative API, multi-tenant authorization, or AI tool execution

## Findings and fixes

| Severity | Finding in 1.6.2 | Impact | Resolution in 1.7.0 |
|---|---|---|---|
| High | No restrictive CSP; decoder embedded inline | A future DOM injection would have a larger execution path; external script restrictions could not be strict | Added restrictive CSP without `unsafe-inline`/`unsafe-eval`; moved decoder to a same-origin external file |
| High | Product image URLs accepted from arbitrary HTTPS hosts | Tracking requests and untrusted remote content could be introduced through community product data | Restricted images to the official Open Food Facts image host; removed credentials/fragments; added no-referrer loading |
| High | External API destination/proxy trust was insufficiently constrained | Misconfiguration or redirect could send queries to an attacker-controlled origin | Added HTTPS origin allowlist, credential rejection, final-redirect validation, credential omission, no-referrer, and CSP `connect-src` |
| High | API JSON, imports, and barcode images lacked strict resource ceilings | Memory exhaustion, UI lockup, storage abuse, and image decompression pressure | Added 2 MB API response, 5 MB backup, 10 MB photo, 40 MP image, query, history, and record-count limits |
| High | Service worker could cache more same-origin content than required and preserve arbitrary query variants | Cache poisoning/stale-document risk and cache growth | Replaced with explicit shell-path allowlist, canonical cache keys, scope/origin checks, and network-only handling for unknown paths |
| Medium | Community and imported strings reached many `innerHTML` templates | Stored/DOM XSS risk if one field bypassed escaping | Retained explicit escaping, normalized field lengths, URL sanitization, added malicious import/API browser tests, and CSP defense in depth |
| Medium | No explicit anti-framing protection available on GitHub Pages | Clickjacking/deceptive overlays | Added runtime top-frame refusal and documented the stronger response-header option on compatible hosting |
| Medium | Scanner dependency was vendored without machine-readable version/hash checks | Dependency drift or accidental replacement | Pinned exact npm versions, added SHA-256 lock, license metadata, CI comparison, npm audit, and Dependabot |
| Medium | Voice search lacked a persistent privacy disclosure | Users might not understand Safari/platform speech processing | Added first-use confirmation and Settings privacy disclosure |
| Medium | Local-storage origin isolation was not documented | Other applications on a shared origin may access the same origin's storage | Added dedicated custom-domain release requirement and privacy/threat-model documentation |
| Low | Developer-specific first-run profile values remained in public code | Unnecessary personal information and confusing defaults | Replaced with generic first-run profile and consistent initial weight |
| Low | Production camera diagnostics exposed internal runtime state | Unnecessary attack-surface and fingerprinting detail | Removed production diagnostics global |
| Low | Backup/food text and identifiers could grow without consistent bounds | Storage and rendering degradation | Added field, array, date, numeric, and uniqueness normalization |

## Verification performed

### Functional regression

- 17/17 browser, barcode, camera-lifecycle, nutrition-unit, food-search, serving, import, chart, adherence, and clamping tests passed.

### Security browser tests

- malicious backup strings remained inert text;
- malicious Open Food Facts product names/brands did not create elements or execute code;
- unapproved image destinations produced no network request;
- API and image URL allowlists rejected credentials and untrusted origins;
- oversized JSON was rejected;
- 500-character search input was truncated to 120 characters before transmission;
- oversized backup was rejected without state replacement;
- prototype-pollution payload did not modify `Object.prototype`;
- embedded-frame execution was refused.

Result: **5/5 security browser tests passed**.

### Static and supply-chain checks

- production CSP, no inline event handlers, no remote scripts, no dynamic code execution primitives;
- exact app/service-worker/version references;
- service-worker origin/scope/path controls;
- input/resource ceilings and network privacy options;
- secret patterns and private-key markers;
- exact ZXing SHA-256 match against `@zxing/browser` 0.2.1;
- npm dependency audit: 0 known vulnerabilities at audit time;
- JavaScript syntax and ZIP integrity.

The final exact check counts are recorded in `STATIC_AUDIT_RESULTS.txt`, `SECURITY_TEST_RESULTS.txt`, and `DEPENDENCY_AUDIT_RESULTS.txt`.

## Residual risk and required deployment controls

1. **No zero-vulnerability guarantee:** automated tests and review reduce known risk but cannot prove absence of all defects.
2. **Unencrypted local storage:** anyone with access to the unlocked browser profile can inspect or delete records.
3. **Origin isolation:** use a dedicated custom domain/subdomain; repository paths do not create separate storage origins.
4. **GitHub Pages headers:** the app uses a meta CSP and runtime frame guard. Strong response-level `frame-ancestors`, `X-Content-Type-Options`, and `Permissions-Policy` require hosting/proxy support beyond ordinary Pages files.
5. **Repository compromise:** an attacker with repository/deployment access can replace the entire application. Enable MFA, branch protection, push protection, secret scanning, private vulnerability reporting, and required CI.
6. **Third-party data:** Open Food Facts can be unavailable or inaccurate. Users must compare nutrition to package labels.
7. **Physical device boundary:** final camera permission, autofocus, camera indicator, offline install, and Safari resume behavior must be verified on a real iPhone.
8. **Future scope:** accounts, cloud sync, body photos, HealthKit, payments, AI agents, or a backend require a new security review before release.

## Final disposition

**Approved for controlled public beta as a static, local-first PWA after the deployment checklist in `SECURITY.md` is completed.** It should not be represented as invulnerable, medically certified, or suitable for storing highly sensitive clinical records.
