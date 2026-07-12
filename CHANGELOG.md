# Changelog

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
