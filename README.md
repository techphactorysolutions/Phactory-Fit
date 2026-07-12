# PhactoryFit v1.4.0

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. It provides barcode food logging, calorie and macro tracking, weight progress, workouts, habits, local backup, and an installable iPhone-friendly PWA without copying MyFitnessPal branding, code, or interface assets.

## v1.4.0 — Automatic nutrition facts

After a UPC or EAN barcode is scanned, PhactoryFit now automatically:

1. Stops the camera after a stable barcode read.
2. Looks up the product in the configured product database.
3. Converts per-100 g nutrition into the product's listed serving size when necessary.
4. Generates a complete Nutrition Facts-style card inside the app.
5. Lets the user select a meal and number of servings.
6. Adds the product to the diary with one tap.
7. Saves the product locally for faster future scans and offline reuse.

Generated facts include:

- Serving size
- Calories
- Total fat
- Saturated fat
- Trans fat
- Cholesterol
- Sodium
- Total carbohydrates
- Dietary fiber
- Total sugars
- Protein

A **Correct nutrition** action opens a prefilled form so community-sourced values can be matched to the physical package label. The corrected record replaces the online result on that device.

## Barcode workflow

- Live rear-camera barcode scanning
- Center-frame scanning guide
- Stable two-read confirmation
- Torch control when supported
- Front/rear camera switching when supported
- Barcode-photo fallback
- Manual UPC/EAN entry fallback
- UPC-A/EAN-13 leading-zero compatibility
- Direct read-only Open Food Facts product lookup
- Optional proxy-first lookup through `config.js`
- Local product memory after a successful lookup or correction

A barcode identifies a product; it does not directly contain the nutrition panel. Automatic generation therefore depends on a matching product record. When a product is missing or the database is unavailable, PhactoryFit offers a one-time nutrition entry and remembers it for later scans.

## Other included features

- Daily calories, protein, carbohydrates, and fat goals
- Protein-floor protection and protein-rescue shortcuts
- Breakfast, lunch, dinner, and snack diary
- Starter food library and custom foods
- Workout, water, steps, sleep, and weight logging
- Daily consistency score
- Weight chart and trend-aware calorie guidance
- Local data validation and repair
- JSON backup export and validated import
- Installable PWA shell with offline app caching
- GitHub Pages compatibility with no build step

## GitHub Pages deployment

1. Upload all files and folders in this package to the repository root, replacing the prior version.
2. Confirm GitHub Pages deploys from the `main` branch and `/ (root)`.
3. Wait for deployment to complete.
4. Open the GitHub Pages address in Safari.
5. Refresh twice so the `phactoryfit-v1.4.0` cache replaces older files.
6. Fully close and reopen the installed Home Screen app.
7. Approve camera access when prompted.

Existing diary data remains compatible because the local storage key is unchanged.

## Camera requirements

- The app must be served over HTTPS, such as GitHub Pages.
- Camera access will not work when opening `index.html` directly from the Files app.
- Safari camera permission must be enabled for the deployed site.
- Keep the full barcode inside the green guide, roughly 6–10 inches from the camera.
- Avoid glare and move slightly farther away when the bars look blurry.

## Product lookup configuration

By default, PhactoryFit performs a public read-only Open Food Facts lookup after a successful scan. No API key, password, or private credential is included.

`config.js` contains an optional `offProxyUrl`. When populated, that endpoint is attempted before the direct public lookup and should accept a `barcode` query parameter.

## Limitations

- Community product data should be compared with the package label.
- Products absent from the database require one-time manual nutrition entry.
- Camera focus and permission behavior vary by iPhone model and iOS/Safari version.
- Automated tests simulate a real MediaStream and decode a generated EAN-13 image, but a physical-device smoke test is still required after deployment.
- Apple Health requires a later native wrapper because a normal website cannot directly access HealthKit.
- Fitness recommendations are general guidance and are not medical care.
- Clearing Safari website data removes local entries unless a backup was exported.

## Ownership

Copyright © 2026 Tech Phactory Solutions LLC. All rights reserved.
