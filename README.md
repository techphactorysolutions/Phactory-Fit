# PhactoryFit v1.6.0

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. The current release is a static Progressive Web App intended for GitHub Pages, iPhone Safari, and installation to the iPhone Home Screen.

## Current production scope

The v1.6.0 audit uses the implemented v1.5.0 feature set as the source of truth. Placeholder examples from the audit prompt—such as supplement cycling, body photos, wearable synchronization, and a local AI agent—were not treated as existing requirements because they are not implemented in this codebase.

### Nutrition and food logging

- Breakfast, lunch, dinner, and snack diary
- Daily calories, protein, carbohydrates, fat, fiber, sugar, and sodium
- Configurable calorie and macro targets
- Protein-floor tracking
- Starter foods and user-created foods
- Online packaged-food and brand search
- Barcode number lookup, live camera scanning, and barcode-photo scanning
- Generated Nutrition Facts display
- Decimal serving quantities and quick serving controls
- Local product memory after a successful log
- Manual correction workflow for incomplete or inaccurate product records

### Fitness and progress

- Workout minutes and exercise-calorie logging
- Water, steps, sleep, and weight entries
- Daily consistency score
- Weight chart using actual date spacing
- Trend-aware calorie guidance
- Protein-rescue suggestions

### Data ownership and deployment

- Local-first browser storage
- Validated JSON backup export and import
- Installable PWA shell
- Offline application asset caching
- No build step
- No embedded API keys, passwords, or private credentials

## v1.6.0 production-audit repairs

### Nutrition correctness

- Product records are no longer accepted when calories, protein, carbohydrates, or fat are missing. Missing macros are not silently converted to zero.
- Serving conversion now handles grams, kilograms, milligrams, milliliters, liters, ounces, pounds, and fluid ounces.
- Labels containing both household and metric quantities—such as `1 oz (28 g)`—prefer the explicit metric quantity.
- Energy reported only in kilojoules is converted to kilocalories using 4.184 kJ per kcal.
- Sodium and cholesterol conversion now respects whether the source value is expressed in grams or milligrams.
- Voice food entry now reaches the same online packaged-food search used by typed searches.

### Data integrity

- Imported future weigh-ins are discarded and cannot replace the current weight.
- Duplicate saved foods are removed by normalized food ID and barcode.
- Daily food-entry counts and cumulative workout, exercise-calorie, water, and custom-food values are bounded to defensive limits.
- External product images are accepted only from HTTPS URLs.

### Progress accuracy

- The weight chart spaces points according to the actual interval between dates instead of distributing irregular weigh-ins evenly.
- The chart now includes an accessible text summary.
- Adaptive adherence calculations use the last seven completed days and do not penalize an unfinished current day.

### iPhone and Safari behavior

- Transient Safari visibility changes no longer stop the camera stream.
- Barcode decoding pauses while the page is hidden and resumes when visible.
- Camera tracks are still stopped on explicit scanner close and real page exit.
- Form controls use a 16 px minimum font size to prevent unwanted Safari input zoom.
- Keyboard focus, reduced-motion, touch-action, and safe-area behavior were improved.

## Food-search workflow

1. Open **Log → Food**.
2. Choose Breakfast, Lunch, Dinner, or Snacks.
3. Search for a food, product, or brand such as Doritos, Pepsi, or Coke.
4. Select a packaged-food result.
5. Verify the serving size and Nutrition Facts against the package.
6. Select the number of servings consumed.
7. Tap **Add to diary**.

Products already saved on the device remain available offline. New online searches require a network connection.

## Barcode workflow

1. Open **Log → Barcode**.
2. Type the UPC/EAN, use the camera, or take a barcode photo.
3. Keep the entire barcode inside the target guide and avoid glare.
4. Review the generated Nutrition Facts.
5. Choose the meal and serving quantity.
6. Add the product to the diary.

A barcode identifies a product; it does not contain the nutrition data itself. The app retrieves nutrition from the configured product database and requires a manual verified entry when core nutrition is incomplete.

## GitHub Pages deployment

1. Upload every file and folder from this package to the repository root.
2. Keep the `assets`, `vendor`, and `tests` folders intact.
3. Configure GitHub Pages to deploy from the `main` branch and repository root.
4. Wait for deployment to complete.
5. Open the HTTPS GitHub Pages address in Safari.
6. Refresh twice so the `phactoryfit-v1.6.0` service-worker cache replaces the previous release.
7. Fully close and reopen Safari or the installed Home Screen app.
8. Grant camera access when requested.

Existing local data remains compatible because the local-storage key is unchanged. Export a backup before replacing a public deployment.

## Run the audit suite

Requirements: Python 3.11+, Node.js, and Chromium for Playwright.

```bash
python -m pip install -r requirements-test.txt
playwright install chromium
python tests/static_audit.py
python tests/test_browser.py
```

Expected result:

- `83/83` static, PWA, asset, security, and accessibility checks
- `17/17` browser, barcode, calculation, import, chart, and camera-lifecycle tests

The browser suite uses mocked product responses and a generated EAN-13 fixture. It does not upload diary or body-weight data.

## Required physical iPhone verification

The automated environment cannot operate a real iPhone camera or reproduce every Safari permission state. Before public release, test the deployed HTTPS site on the target iPhone:

1. Grant camera permission and scan one UPC-A and one EAN-13 package.
2. Leave the camera permission sheet open for several seconds and confirm the scanner remains active afterward.
3. Compare calories and macros against the physical package label.
4. Background and resume the app, then verify the preview resumes or offers **Start preview**.
5. Close the scanner and confirm the camera indicator turns off.
6. Test saved-food logging without a network connection.
7. Export, reset, and re-import a backup.

## Product lookup configuration

By default, PhactoryFit uses direct, read-only Open Food Facts requests. `config.js` also supports optional production proxies:

- `offProxyUrl`: accepts `?barcode=UPC_OR_EAN`
- `offSearchProxyUrl`: accepts `?q=SEARCH_TEXT` and returns a `products` array

No secret should be placed in this public client-side file.

## Current limitations

- Community product records can be incomplete or inaccurate; package-label verification remains necessary.
- Physical camera autofocus and permission behavior remain device-dependent.
- Local browser storage is not encrypted and is removed when Safari website data is cleared.
- Multi-device synchronization, authentication, body photos, supplement scheduling, workout set/repetition progression, wearable integration, and AI coaching are not part of v1.6.0.
- Apple Health requires a future native wrapper with HealthKit entitlements.
- Fitness guidance is general information and is not medical advice.

## Ownership

Copyright © 2026 Tech Phactory Solutions LLC. All rights reserved.
