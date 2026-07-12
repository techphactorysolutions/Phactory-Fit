# Changelog

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
- Updated the application and service-worker cache version to v1.3.0

## v1.2.0 — July 11, 2026

- Replaced the iPhone Home Screen fallback letter with explicit PhactoryFit icon assets
- Added a dedicated 180 × 180 Apple touch icon and root-level iOS fallback file
- Added standard and maskable PWA icon variants
- Added icon cache busting and updated the service-worker cache to v1.2.0
- Added a bundled ZXing barcode reader for iPhone/Safari browsers without the native BarcodeDetector API
- Added a rear-camera live barcode scanner path
- Added a “Take barcode photo” fallback using the iPhone camera capture picker
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
- Prevented trend rendering from creating empty diary records
- Improved service-worker updating and offline fallback
- Added input limits, explicit button types, accessible labels, and iPhone PWA metadata
