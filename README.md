# PhactoryFit v1.3.0

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. It provides a streamlined calorie-tracker workflow without copying MyFitnessPal branding, code, or interface assets.

## v1.3.0 barcode repair

This release replaces the earlier barcode workflow with a more reliable iPhone-oriented scanner and product lookup path.

### Scanner improvements

- Scans the center barcode region at higher effective resolution instead of relying only on the entire camera frame.
- Confirms the same code twice before accepting it, reducing partial and false reads.
- Tries multiple rear-camera constraint profiles when iPhone Safari rejects an advanced profile.
- Requests continuous focus and a light zoom only when the camera reports that those features are supported.
- Adds a flashlight control when the active camera exposes torch support.
- Adds camera switching when more than one video input is available.
- Uses both the browser-native barcode detector, when available, and the bundled ZXing 1D decoder.
- Extends the scan timeout to 45 seconds and provides clearer positioning guidance.
- Stops a late camera stream correctly when the scanner is closed while permission is still pending.

### Photo and product improvements

- Barcode photos are decoded through several full-frame, center-crop, and contrast-enhanced passes.
- Unknown codes now attempt a direct public Open Food Facts lookup even when no custom proxy is configured.
- `config.js` still supports an optional proxy override for production control.
- Serving-size nutrition is calculated from the product's actual serving quantity instead of incorrectly treating per-100-gram values as one serving.
- Successfully retrieved products are cached locally for later offline scans.
- Missing or unavailable online products still fall back to “Create and remember food.”

## Included

- Daily calories, protein, carbohydrates, and fat goals
- Protein-floor protection and exact protein-rescue shortcuts
- Breakfast, lunch, dinner, and snack diary
- Starter food library and custom foods
- Local barcode learning
- Bundled live barcode scanning for iPhone/Safari-compatible browsers
- “Take barcode photo” fallback
- Public product lookup with optional proxy override
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
3. Wait for the deployment to finish.
4. Open the GitHub Pages URL in Safari—not the downloaded HTML file.
5. Refresh twice so the `phactoryfit-v1.3.0` cache replaces the previous scanner files.
6. Close and reopen the installed PhactoryFit Home Screen app.
7. Approve camera access when prompted.

Existing diary data remains compatible because the browser storage key is unchanged.

## Camera requirements

- The app must be served through HTTPS, such as GitHub Pages.
- Camera access will not work when opening `index.html` directly from the Files app.
- Safari camera permission must be allowed for the GitHub Pages site.
- Keep the full barcode inside the green frame, roughly 6–10 inches from the camera.
- Avoid glare and do not place the camera so close that the bars become blurry.
- Use **Turn on light** in dim conditions when the camera supports it.
- “Take barcode photo” remains available as a fallback.

## Product lookup configuration

By default, PhactoryFit performs a public read-only Open Food Facts lookup after a successful scan. No API key or password is included.

`config.js` contains an optional `offProxyUrl` value. Set it only when you want requests routed through your own compliant serverless endpoint. When present, the proxy is attempted before the public endpoint.

## Important limitations

- Community food data must be compared with the package label before use.
- Camera focus and permission behavior vary by iPhone model and iOS/Safari version.
- The simulated browser test used a real MediaStream and a generated EAN-13 barcode, but the final deployed package still requires a physical-device smoke test.
- Apple Health requires a later native Capacitor wrapper; a normal website cannot directly access HealthKit.
- Fitness recommendations are general guidance and are not medical care.
- Clearing Safari website data removes local entries unless a backup was exported.

## Ownership

Copyright © 2026 Tech Phactory Solutions LLC. All rights reserved.
