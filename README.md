# PhactoryFit v1.1.0

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. It provides a streamlined calorie-tracker workflow without copying MyFitnessPal branding, code, or interface assets.

## Included

- Daily calories, protein, carbohydrates, and fat goals
- Protein-floor protection and exact protein-rescue shortcuts
- Breakfast, lunch, dinner, and snack diary
- Starter food library and custom foods
- Local barcode learning
- Optional Open Food Facts lookup through a configurable proxy
- Experimental camera barcode detection where supported
- Browser voice-to-search logging where supported
- Workout, water, steps, sleep, and weight logging
- Daily consistency score
- Weight chart and trend-aware calorie guidance
- Validated local storage with legacy/corrupt-data repair
- JSON backup export and validated import
- Installable PWA shell with offline caching
- GitHub Pages compatibility with no build step

## GitHub Pages deployment

1. Create or open the GitHub repository for PhactoryFit.
2. Upload **all files and folders inside this directory** to the repository root, replacing the earlier version.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Open the generated GitHub Pages URL in Safari on iPhone.
7. Refresh once after the new service worker installs, then use **Share → Add to Home Screen**.

Existing local diary data remains compatible because the storage key is unchanged and the new version migrates older data automatically.

## Optional barcode proxy

`config.js` contains an empty `offProxyUrl` value. Leave it empty for local barcode learning only. A production Open Food Facts integration should use a compliant server-side or serverless proxy rather than exposing private credentials in this public repository.

## Important limitations

- Community food data must be verified against the product label.
- Camera barcode detection and speech recognition vary by browser and device.
- Apple Health requires a later native Capacitor wrapper; a normal website cannot directly access HealthKit.
- Fitness recommendations are general guidance and are not medical care.
- Clearing Safari website data removes local entries unless a backup was exported.

## Verification

See `AUDIT_REPORT.md` for the repaired defects, automated test coverage, browser checks, security review, and remaining hardware-dependent validation.

## Ownership

Copyright © 2026 Tech Phactory Solutions LLC. All rights reserved.
