# PhactoryFit 1.7.0

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. It is a static, local-first Progressive Web App for GitHub Pages, iPhone Safari, and iPhone Home Screen installation.

## Current features

### Nutrition

- Breakfast, lunch, dinner, and snack diary
- Calories, protein, carbohydrates, fat, fiber, sugar, and sodium
- Configurable calorie and macro targets with a protein floor
- Starter foods, custom foods, and recent foods
- Online packaged-food and brand search
- Manual UPC/EAN lookup, live camera scanning, and barcode-photo scanning
- Generated Nutrition Facts panel with fractional serving quantities
- Local product memory and package-label correction workflow

### Fitness and progress

- Water, steps, sleep, workout minutes, exercise calories, and weight logging
- Daily consistency score
- Weight history chart using real date spacing
- Trend-aware calorie guidance and protein-rescue suggestions

### Data ownership

- Local browser storage; no PhactoryFit account required
- JSON backup export and validated import
- Offline application shell
- No advertising, analytics SDK, payment system, or private API key

## Security-hardened public release

Version 1.7.0 adds a dedicated public-release security baseline:

- restrictive Content Security Policy;
- same-origin executable scripts only;
- no runtime JavaScript CDN;
- exact vendored ZXing dependency lock and SHA-256 verification;
- HTML escaping and API/image URL allowlists;
- bounded API responses, imports, photos, image dimensions, search input, and stored records;
- no-referrer, credential-free external requests;
- allowlist-only service-worker caching;
- anti-framing guard;
- generic first-run profile rather than developer-specific information;
- camera, barcode, voice, and external-data privacy disclosure;
- repeatable static, browser-security, regression, and dependency tests;
- GitHub Actions and Dependabot configuration.

Read [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), and [THREAT_MODEL.md](THREAT_MODEL.md) before public deployment.

## Barcode workflow

1. Open **Log → Barcode**.
2. Type a UPC/EAN, tap **Use camera**, or take a barcode photo.
3. Keep the complete barcode inside the target guide and avoid glare.
4. Review the generated Nutrition Facts and serving size.
5. Choose the meal and amount consumed.
6. Add the product to the diary.

Camera frames and barcode photos are decoded locally. Unknown barcode numbers are sent to Open Food Facts to retrieve community-contributed nutrition data.

## Food search workflow

1. Open **Log → Food**.
2. Choose a meal.
3. Search for a generic food, product, or brand such as Doritos, Pepsi, or Coke.
4. Select a packaged-food result.
5. Verify the package serving and Nutrition Facts.
6. Choose the number of servings and add it to the diary.

## GitHub Pages deployment

The release ZIP is ready to upload to a repository root.

1. Export a backup from the older app before replacing files.
2. Replace the repository files with the contents of the 1.7.0 ZIP.
3. Keep `.github/workflows/security.yml` and `.github/dependabot.yml` in the repository.
4. In GitHub Pages settings, deploy from the intended production branch and enforce HTTPS.
5. Prefer a dedicated, verified custom domain or subdomain for storage isolation.
6. Enable secret scanning, push protection, private vulnerability reporting, branch protection, and required security checks.
7. Open the deployed site in Safari and confirm Settings displays **Version 1.7.0**.
8. Close and reopen the installed Home Screen app so the new service worker takes control.

The app has no build requirement. `package.json` and `package-lock.json` exist only to make the vendored scanner dependency visible to automated security tooling.

## Local verification

### Static and syntax checks

```bash
python3 tests/security_static.py
node --check app.js
node --check service-worker.js
```

### Dependency verification

Use Node.js 24 or newer:

```bash
npm ci --ignore-scripts
cmp --silent zxing-browser.min.js node_modules/@zxing/browser/umd/zxing-browser.min.js
npm audit --omit=dev --audit-level=high
```

### Browser security checks

Install Playwright and ensure Chromium is available, then run:

```bash
python3 tests/browser_security.py
```

The complete functional/barcode suite used during this release is summarized in `BROWSER_TEST_RESULTS.txt`; the security-specific run is in `SECURITY_TEST_RESULTS.txt`.

## Required physical iPhone checks

Automated browser tests cannot operate a real iPhone camera or reproduce every Safari permission lifecycle. Before inviting public users:

1. scan one UPC-A and one EAN-13 package;
2. verify the camera remains open after permission is granted;
3. close the scanner and confirm the iPhone camera indicator turns off;
4. compare generated nutrition with the physical label;
5. test background/resume and **Start preview** recovery;
6. test saved-food logging offline;
7. export, reset, and import a backup with test data.

## Current limitations

- Local browser storage is readable by anyone with access to the unlocked device/browser profile and can be erased with website data.
- Open Food Facts availability and nutrition accuracy are external to PhactoryFit.
- Multi-device sync, authentication, cloud storage, body photos, supplements, workout set/repetition progression, Apple Health, payments, and AI coaching are not implemented.
- General fitness guidance is not medical advice.

## License and ownership

The PhactoryFit application is copyright © 2026 Tech Phactory Solutions LLC. The bundled ZXing component retains its separate open-source license in `ZXING_LICENSE.txt`.
