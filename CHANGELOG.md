# Changelog

## v1.10.0 — July 12, 2026

### Editable food diary entries
- Added a dedicated editor for every logged food entry.
- Added meal-period reassignment between Morning / Breakfast, Afternoon / Lunch, Evening / Dinner, and Snacks.
- Added editable exact local logging time with 12-hour display in the diary.
- Added serving/portion editing with live recalculated calories and macros.
- Added deletion from inside the editor while preserving the existing quick-delete action.
- New food and barcode entries now record the local time automatically.
- Existing v1.9 diary data remains compatible; older entries without a saved time display “Time not set” until edited.
- Diary items sort chronologically inside each meal section while preserving stable order for entries without a time.

### Reliability and interface
- Added secure validation for meal period, time, serving amount, and entry identifiers.
- Added mobile-sized Edit and Delete controls that match the cosmic visual system.
- Added automated browser coverage for edit, move, time, portion, totals, persistence, and deletion workflows.
- Updated the PWA cache and asset versions to 1.10.0.

## v1.9.0 — July 12, 2026

### Complete visual overhaul
- Rebuilt the application around an original cosmic performance design with a dark animated starfield, nebula lighting, and layered navy glass surfaces.
- Replaced the old header with a “Designed by Tech Phactory Solutions” brand lockup.
- Added the slogan **Build better. Fuel smarter. Live stronger.**
- Rebuilt the daily-readiness hero, macro cards, healthy-habits panel, coach insight card, and bottom navigation.
- Added distinct neon visual identities for calories, protein, carbohydrates, fat, water, steps, workouts, and sleep.

### Macro gauges and calculation presentation
- Added circular gauges for calories, protein, carbohydrates, and fat.
- Added percentage, remaining, consumed, goal, and plan-status text to all four macro panels.
- Preserved accurate over-goal messaging rather than clipping or presenting negative remaining values.
- Added accessible gauge labels and maintained the existing hidden linear-progress state for compatibility.

### Motion and mobile performance
- Added view-entry and IntersectionObserver-based scroll-reveal animations.
- Added an animated CSS-only background with no remote media dependency.
- Added `prefers-reduced-motion` handling that removes all decorative movement and reveal delays.
- Reduced expensive blur/filter use to protect iPhone Safari performance.
- Added responsive iPhone, narrow-screen, and iPad layouts with zero horizontal overflow in regression tests.

### Compatibility and quality
- Preserved v1.8 restaurant search, Open Food Facts search, barcode scanning, diary, progress, coaching, backups, security controls, and local storage schema.
- Updated manifest colors, service-worker cache keys, versioned assets, package metadata, and public documentation.
- Added four UI regression tests and three iPhone camera lifecycle regression checks.
- Confirmed 84/84 static/security checks, 6/6 service-worker checks, 5/5 browser-security checks, 4/4 restaurant checks, 4/4 UI checks, and 3/3 camera checks.

## v1.8.0 — July 12, 2026

### Restaurant search
- Added a same-origin, offline U.S. restaurant catalog with 43 records across McDonald's, Chick-fil-A, Starbucks, and Taco Bell.
- Added McDonald's breakfast search for Hash Browns, McMuffins, McGriddles, biscuits, burrito, oatmeal, hotcakes, bagel, and breakfast platters.
- Added restaurant/meal intent matching and alias normalization for punctuation and common shorthand.
- Added one-tap restaurant search chips.
- Added state-code labeling without GPS access.

### Smarter eating-out guidance
- Added an explainable plan-fit score using remaining calories, remaining protein, and protein density.
- Chain/category searches such as `McDonald's breakfast` now rank plan-fit recommendations before high-calorie platters.
- Added same-restaurant alternatives ranked for the current day.
- Added visible limitations so recommendations are not presented as medical or allergy guidance.

### Nutrition integrity
- Added per-field nutrient availability metadata.
- Partial records no longer display missing macros as verified zeroes.
- Diary previews use an em dash for unavailable nutrients and warn which totals will be incomplete.
- Added verification dates and location/customization caveats to restaurant records.

### PWA and testing
- Added `restaurant-foods.js` to the required offline shell and cache allowlist.
- Added four restaurant browser regression tests.
- Expanded static security checks to cover the catalog.

## v1.7.0 — July 12, 2026

### Public security hardening

- Added a restrictive Content Security Policy with no `unsafe-inline` or `unsafe-eval`.
- Removed the embedded inline scanner bundle and restored a same-origin external scanner file.
- Restricted executable scripts to the application origin.
- Restricted API traffic to same-origin HTTPS and Open Food Facts.
- Restricted remote product images to the official Open Food Facts image host.
- Added redirect validation, credential omission, no-referrer requests, and no-store API behavior.
- Added response, backup, photo, image-pixel, query, field, and record-count limits.
- Reworked service-worker caching around an explicit shell allowlist and canonical cache keys.
- Added an anti-framing runtime guard.
- Added first-use Safari voice-processing disclosure and detailed privacy UI.
- Replaced developer-specific first-run profile data with generic defaults.
- Removed production camera diagnostics.
- Corrected the generic profile's initial weight-history value.

### Supply-chain and repository controls

- Pinned `@zxing/browser` 0.2.1 and transitive versions in `package-lock.json`.
- Added `VENDOR_LOCK.json` with the exact scanner SHA-256.
- Added GitHub Actions static, syntax, dependency, and vendored-file verification.
- Added Dependabot configuration for npm and GitHub Actions.
- Added best-effort secret scanning to the static audit.

### Documentation

- Added `SECURITY.md`, `PRIVACY.md`, and `THREAT_MODEL.md`.
- Replaced the release audit with a public security assessment and residual-risk report.
- Added reproducible runtime and static security test suites.

### Validation

- 17/17 full browser and calculation regressions passed.
- 5/5 malicious-input and runtime security browser tests passed.
- Exact static check count and npm audit results are recorded in the release result files.
- Physical iPhone camera and deployed-origin validation remain required release gates.

## v1.6.2 — iPhone Safari camera lifecycle repair

- Removed `pagehide` camera teardown because iPhone Safari can emit that lifecycle event while presenting or dismissing the camera permission UI.
- Requests minimal rear-camera constraints first on iPhone, then applies optional focus/zoom optimizations after the stream is live.
- Keeps a granted live stream open when Safari delays or pauses the `<video>` preview.
- Adds a manual **Start preview** recovery path without forcing another permission request.
- Reattaches the stream after transient visibility changes.
- Detects muted/ended camera tracks and performs one controlled reconnect instead of silently closing the scanner.
- Adds runtime camera diagnostics for support testing.

## 1.6.2 — iPhone Scanner Engine Hotfix

- Moved all required runtime assets to the repository root for reliable GitHub mobile uploads.
- Embedded the ZXing scanner engine directly in `index.html`, so the camera decoder is available whenever the page loads.
- Added a root `zxing-browser.min.js` recovery copy and dynamic retry loader.
- Loads the scanner engine before requesting camera permission, preventing the iPhone preview from opening and immediately closing.
- Added an in-app scanner retry action with a precise deployment error.
- Made service-worker installation resilient and changed JavaScript/CSS to network-first updates.
- Automatically reloads once when the updated service worker takes control.
- Flattened manifest icons to avoid missing nested folders during iPhone GitHub uploads.


## v1.6.2 — July 12, 2026

### Corrected nutrition calculations
- Reject packaged-food records that omit any core macro instead of silently treating missing values as zero
- Added serving conversion for g, kg, mg, ml, l, oz, lb, and fl oz
- Prefer explicit metric quantities in mixed labels such as `1 oz (28 g)`
- Added kilojoule-to-kilocalorie fallback conversion
- Made sodium and cholesterol milligram conversion source-unit aware
- Routed voice food searches through online packaged-food search

### Protected data integrity
- Filter future weigh-ins during backup import and local-state normalization
- Remove duplicate saved foods by normalized ID and barcode
- Clamp cumulative workout minutes, exercise calories, water, custom foods, and daily food-entry counts
- Reject non-HTTPS external product images

### Improved progress accuracy
- Space weight-chart points by actual calendar dates
- Add an accessible chart summary for screen readers
- Calculate adherence from completed days rather than an unfinished current day

### Hardened iPhone Safari behavior
- Keep the camera stream alive during transient visibility changes
- Pause barcode decoding while hidden and resume when visible
- Retain authoritative cleanup on explicit close and `pagehide`
- Prevent Safari input auto-zoom with 16 px modal controls
- Added stronger focus-visible, reduced-motion, touch-action, and safe-area behavior

### Added production test assets
- Added a reproducible 17-test Playwright browser/calculation suite
- Added an 83-check static, PWA, asset, security, and accessibility audit
- Added a generated EAN-13 test fixture, test requirements, test plan, and captured result logs

### Validation
- 17/17 browser and calculation tests passed
- 83/83 static, PWA, asset, security, and accessibility checks passed
- A physical iPhone camera and deployed HTTPS offline reload remain required release checks

## v1.5.0 — July 11, 2026

### Added
- Online food and brand search from the Food logger
- Packaged-food results for searches such as Doritos, Pepsi, and Coke
- Complete Nutrition Facts detail before logging
- Serving quick picks for 0.5, 1, 1.5, and 2 servings
- Live calorie and macro totals for the selected serving quantity
- Search-result caching and local product memory after logging
- Optional `offSearchProxyUrl` configuration
- Full-screen iPhone barcode-camera mode
- Safari **Start preview** recovery control
- Dedicated **Close camera** control

### Fixed
- Brief Safari visibility changes no longer immediately stop the camera
- Camera video playback now explicitly applies inline and muted playback properties
- A rejected or stalled Safari preview no longer destroys the active stream
- Online search requests are debounced, cached, and cancelled when the logger closes
- Search results preserve meal selection and serving calculations

### Validation
- 11/11 browser and barcode integration tests passed
- 70/70 static, PWA, asset, scanner, search, and security checks passed

## v1.4.0 — July 11, 2026

- Added automatic Nutrition Facts generation after a successful barcode scan or manual barcode lookup
- Added a Nutrition Facts-style result card with serving size, calories, fat, saturated fat, trans fat, cholesterol, sodium, carbohydrates, fiber, sugars, and protein
- Added meal and serving controls directly beneath the generated nutrition facts
- Changed the barcode flow to add a scanned product to the diary in one tap
- Added a prefilled **Correct nutrition** workflow for inaccurate community data
- Corrected custom-food replacement so user-verified barcode data replaces the prior online result instead of creating duplicates
- Added extended nutrition fields to saved foods and diary entries
- Added UPC-A/EAN-13 leading-zero lookup compatibility
- Kept successful barcode products stored locally for later offline reuse
- Updated Open Food Facts field selection and application version metadata
- Fixed generated decimal nutrition values being blocked by HTML number-step validation
- Updated cache-busted assets and the service-worker cache to `phactoryfit-v1.4.0`

## v1.3.0 — July 11, 2026

- Replaced full-frame-only live decoding with a high-resolution center-crop scan loop
- Added two-read barcode confirmation to reduce partial and false detections
- Added rear-camera constraint fallbacks for iPhone Safari
- Added conditional continuous-focus and zoom optimization
- Added flashlight control when torch support is available
- Added camera switching when multiple video inputs are available
- Added native detector plus bundled ZXing fallback scanning
- Added multi-pass barcode photo decoding with crop and contrast attempts
- Added direct read-only Open Food Facts lookup when no proxy is configured
- Kept optional proxy-first behavior through `config.js`
- Corrected per-serving nutrition calculations from per-100-gram data
- Added clearer scan status, positioning, lighting, and timeout guidance
- Fixed a late-stream cleanup race when the modal closes during camera permission

## v1.2.0 — July 11, 2026

- Replaced the iPhone Home Screen fallback letter with explicit PhactoryFit icon assets
- Added a dedicated 180 × 180 Apple touch icon and root-level iOS fallback file
- Added standard and maskable PWA icon variants
- Added a bundled ZXing barcode reader for iPhone/Safari browsers without the native BarcodeDetector API
- Added a rear-camera live barcode scanner path
- Added a barcode-photo fallback using the iPhone camera capture picker
- Added barcode camera timeout, permission guidance, and stream cleanup
- Added the ZXing open-source license to the package

## v1.1.0 — July 11, 2026

- Repaired browser-blocking serving quantity validation
- Fixed coach action routing and protein-rescue selections
- Preserved meal selection through custom-food and barcode workflows
- Corrected current-weight handling for backdated entries
- Added future weigh-in prevention
- Added robust local-data and backup normalization
- Corrected external serving-size nutrient calculations
- Added camera-stream cleanup
- Improved weight-trend calculation
- Improved over-target calorie messaging
- Improved service-worker updating and offline fallback
- Added input limits, explicit button types, accessible labels, and iPhone PWA metadata
