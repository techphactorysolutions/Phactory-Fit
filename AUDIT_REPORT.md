# PhactoryFit v1.2.0 Repair Report

**Repair date:** July 11, 2026  
**Target:** iPhone Safari and installed GitHub Pages PWA

## Final status

**PASS — the reported Home Screen icon and barcode-camera compatibility defects were repaired in the deployable package.**

## Root causes

### 1. iPhone Home Screen showed a generic “P” tile

iOS had installed a generated fallback shortcut icon instead of the intended PhactoryFit artwork. Existing iPhone Home Screen shortcuts also normally retain the icon captured at installation time rather than refreshing it automatically.

### 2. “Use camera” reported that scanning was unsupported

The earlier packaged release depended on the browser-native `BarcodeDetector` API. iPhone Safari may provide camera access but not that detector API, so the old code rejected the camera workflow before opening a usable scanner.

## Repairs completed

- Added a dedicated root-level `apple-touch-icon.png` file.
- Added an explicit 180 × 180 Apple touch icon declaration.
- Added standard 192 × 192 and 512 × 512 PWA icons.
- Added separate maskable icon declarations.
- Added a 32 × 32 browser favicon.
- Updated service-worker caching to `phactoryfit-v1.2.0`.
- Added cache-versioned application scripts and styles.
- Bundled the ZXing browser barcode reader locally.
- Added live rear-camera scanning for browsers without native `BarcodeDetector` support.
- Added a `Take barcode photo` fallback using `capture="environment"`.
- Added camera permission, unavailable-device, timeout, and secure-context messages.
- Added stream and camera-control cleanup on close, timeout, failure, and successful scan.
- Included the ZXing license file.

## Verification completed

### Static and package checks — 39/39 passed

- JavaScript syntax validation
- Service-worker syntax validation
- HTML parsing
- Apple touch icon declaration
- Manifest declaration and JSON parsing
- Standard and maskable icon declarations
- Icon-file existence and exact pixel dimensions
- Root Apple icon existence and 180 × 180 dimensions
- Favicon dimensions
- ZXing script inclusion
- ZXing bundle presence
- ZXing image-decoding method presence
- Live-camera fallback implementation
- Camera-photo fallback implementation
- Removal of the old unsupported-browser-only rejection
- Camera-track cleanup implementation
- Service-worker cache version
- Every service-worker asset reference
- Basic credential and secret scan

### HTTP deployment smoke test — passed

A local static server returned HTTP 200 for:

- Application root
- `app.js`
- Bundled ZXing scanner
- Apple touch icon
- Web app manifest
- Service worker

## Required iPhone refresh procedure

The old Home Screen shortcut must be deleted after deploying v1.2.0. Then open the refreshed GitHub Pages site in Safari and add it to the Home Screen again. The already-installed shortcut is not expected to replace its cached icon automatically.

The live physical camera, autofocus, and Safari permission prompt cannot be fully exercised in this sandbox. The code paths, packaged scanner, image-capture fallback, static references, and secure-context handling were verified. A final device smoke test should confirm camera permission and barcode focus after deployment.
