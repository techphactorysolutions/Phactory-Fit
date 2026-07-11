# PhactoryFit v1.2.0

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. It provides a streamlined calorie-tracker workflow without copying MyFitnessPal branding, code, or interface assets.

## v1.2.0 repairs

This release specifically fixes the two iPhone problems reported during testing:

- **Home Screen icon:** iOS now receives a dedicated 180 × 180 Apple touch icon instead of generating a fallback letter tile.
- **Barcode camera:** Safari and installed iPhone PWAs no longer depend only on the unsupported native `BarcodeDetector` API. PhactoryFit now includes a local ZXing scanner and a camera-photo fallback.

## Included

- Daily calories, protein, carbohydrates, and fat goals
- Protein-floor protection and exact protein-rescue shortcuts
- Breakfast, lunch, dinner, and snack diary
- Starter food library and custom foods
- Local barcode learning
- Bundled live barcode scanning for modern iPhone/Safari browsers
- “Take barcode photo” fallback for devices that cannot maintain a live scanner
- Optional Open Food Facts lookup through a configurable proxy
- Browser voice-to-search logging where supported
- Workout, water, steps, sleep, and weight logging
- Daily consistency score
- Weight chart and trend-aware calorie guidance
- Validated local storage with legacy/corrupt-data repair
- JSON backup export and validated import
- Installable PWA shell with offline caching
- GitHub Pages compatibility with no build step

## GitHub Pages deployment

1. Upload **all files and folders inside this package** to the repository root, replacing the earlier version.
2. Confirm GitHub Pages is deploying from the `main` branch and `/ (root)`.
3. Open the GitHub Pages URL in Safari—not the downloaded HTML file.
4. Refresh the page twice so the v1.2.0 service worker and scanner library replace the old cached version.
5. Delete the existing PhactoryFit Home Screen shortcut. iOS normally does not refresh an already-installed shortcut icon.
6. In Safari, use **Share → Add to Home Screen** again.
7. Open the newly installed icon and approve camera access when prompted.

Existing diary data remains compatible because the browser storage key is unchanged.

## Camera requirements

- The app must be served through HTTPS, such as GitHub Pages.
- Camera access will not work when opening `index.html` directly from the Files app.
- Safari camera permission must be allowed for the GitHub Pages site.
- Live scanning uses the rear camera. “Take barcode photo” remains available as a fallback.

## Optional barcode proxy

`config.js` contains an empty `offProxyUrl` value. Leave it empty for local barcode learning only. A production Open Food Facts integration should use a compliant server-side or serverless proxy rather than exposing private credentials in this public repository.

## Important limitations

- Community food data must be verified against the product label.
- Physical camera permissions and autofocus must still be confirmed on the deployed iPhone.
- Apple Health requires a later native Capacitor wrapper; a normal website cannot directly access HealthKit.
- Fitness recommendations are general guidance and are not medical care.
- Clearing Safari website data removes local entries unless a backup was exported.

## Ownership

Copyright © 2026 Tech Phactory Solutions LLC. All rights reserved.
