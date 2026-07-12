# PhactoryFit Security Policy

## Supported release

Security fixes are applied to the latest published release only. The supported release in this package is **PhactoryFit 1.12.0**.

## Architecture and security boundary

PhactoryFit 1.12.0 remains a static, local-first Progressive Web App. It has no account system, server database, authentication cookie, payment flow, or client-side private API key. Nutrition and activity data are stored in the browser under the app's web origin. An optional, separately deployed Food Cloud search gateway can hold provider credentials server-side; it receives only bounded search queries and does not store the user diary.

The static app has no SQL, sessions, or user database. The optional Food Cloud introduces a small server-side network boundary and must retain strict provider allowlists, query limits, exact-origin CORS, no-store responses, secret management, rate limiting, and provider-license review. Authentication, cloud sync, payments, uploads, or user-data storage would require a substantially broader penetration test.

## Built-in controls

- Restrictive Content Security Policy with no `unsafe-inline` or `unsafe-eval`
- Same-origin executable scripts only; no runtime CDN JavaScript
- Exact vendored scanner version and SHA-256 integrity lock
- HTML escaping and URL allowlists for community-supplied product data
- API-origin and product-image host allowlists
- Request timeouts, omitted credentials, no-referrer requests, and bounded JSON responses
- Backup, barcode-photo, image-dimension, query-length, and data-count limits
- Anti-framing runtime guard
- Scope-limited, allowlist-only service-worker caching
- JSON import normalization and prototype-pollution regression tests
- Automated secret scan, syntax checks, dependency audit, and vendored-file comparison
- Dependabot configuration for npm and GitHub Actions

## Public GitHub deployment checklist

1. Publish only the files in the audited release package.
2. Enable GitHub Pages HTTPS enforcement.
3. Prefer a dedicated custom domain or subdomain for PhactoryFit. Do not host unrelated, untrusted applications on the same web origin.
4. Verify the custom domain in the GitHub organization or account before publishing it.
5. Enable push protection and secret scanning for the repository.
6. Enable private vulnerability reporting in the repository's Security settings.
7. Keep the included security workflow and Dependabot configuration enabled.
8. Require pull-request review and passing security checks before merging changes to the deployment branch.
9. Never place secrets in `config.js`, HTML, JavaScript, repository Actions variables exposed to the client, or any other GitHub Pages asset.

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** function when private vulnerability reporting is enabled. Include:

- affected version and deployment address;
- reproduction steps;
- expected and actual behavior;
- impact assessment;
- screenshots or a minimal proof of concept that does not expose another person's data.

Do not publish exploit details in a public issue before a fix is available. For ordinary non-security bugs, use the normal issue tracker.

## Known residual risks

No security audit can prove that an application has zero vulnerabilities. The current residual risks are:

- Browser storage is not encrypted at rest. Anyone with access to the unlocked device/browser profile can read or delete it.
- Storage is isolated by web origin, not by repository path. A dedicated domain is strongly preferred over sharing one `github.io` origin with unrelated applications.
- GitHub Pages does not provide application-controlled response headers. This release uses a CSP meta policy and a JavaScript anti-frame guard; hosting behind a platform that supports security response headers can add `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` at the HTTP layer.
- Open Food Facts is external and community-contributed. Its availability and data accuracy are outside PhactoryFit's security boundary.
- Safari voice recognition is browser/platform functionality and may use online speech processing after the user accepts the disclosure.
- A compromised browser, malicious extension, jailbroken device, compromised GitHub account, or compromised deployment domain can bypass client-side protections.

## Security-sensitive change rule

Run a new audit before adding accounts, cloud synchronization, health-record imports, body-photo upload, Apple Health/HealthKit, payments, AI tool execution, administrative panels, or any server-side component.

## Restaurant catalog security in 1.12.0

`restaurant-foods.js` and `restaurant-foods-expanded.js` are same-origin, read-only static assets included in the explicit service-worker allowlist. It does not execute third-party code, require credentials, or contact restaurant websites at runtime. All catalog text is normalized and escaped through the same rendering defenses used for imported and external product data. Updating the catalog requires normal repository review and the security workflow.


## Food Cloud security in 1.12.0

The public app permits only same-origin HTTPS endpoints and dedicated `workers.dev` endpoints through both CSP and runtime validation. Provider credentials must be stored as server secrets. The reference gateway uses exact-origin CORS, bounded query/response sizes, `no-store`, provider destination constants, and no diary storage. Deployers must add production rate limiting and may need fixed outbound IP hosting for providers that require registered proxy IPs.
