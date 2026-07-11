# Changelog

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
