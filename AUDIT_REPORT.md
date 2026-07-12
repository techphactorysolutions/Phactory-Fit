# PhactoryFit v1.3.0 Barcode Repair Report

**Repair date:** July 11, 2026  
**Target:** iPhone Safari and installed GitHub Pages PWA

## Final status

**PASS — the barcode camera, image decoder, product lookup, serving normalization, and cleanup paths were repaired and passed automated testing.**

## Defects found

### 1. Live scanning was not optimized for a small UPC/EAN inside a large camera frame

The earlier ZXing path decoded the complete video frame. A grocery barcode occupying only a small part of a portrait camera image could be difficult to resolve, particularly under glare or soft autofocus.

### 2. A single decoded value was accepted immediately

A partial or unstable read could be accepted without a second confirmation.

### 3. Unknown products appeared to fail after a successful scan

`offProxyUrl` was empty by default. As a result, a correctly decoded barcode that was not already stored locally skipped online product retrieval and immediately requested manual food creation. This could look like the reader itself had failed.

### 4. External nutrition could be calculated with the wrong serving basis

The earlier normalization could select a raw per-100-gram nutrient value before applying the product's serving factor. This could show an entire 100-gram amount as one labeled serving.

### 5. Photo decoding had only a narrow fallback path

The earlier photo workflow did not systematically try center crops and contrast-enhanced variants.

### 6. Closing during a pending permission request could leave a late stream active

If camera permission resolved after the modal had already closed, the newly returned stream needed explicit shutdown before exiting the stale scan session.

## Repairs completed

- Added a high-resolution center-region scan canvas aligned to the visible guide.
- Added periodic full-frame attempts for off-center barcodes.
- Added contrast-enhanced attempts without replacing the normal image path.
- Added two-read confirmation within a short time window.
- Added rear-camera constraints with progressively simpler fallbacks.
- Added optional continuous autofocus and modest zoom when supported.
- Added flashlight and camera-switch controls based on reported device capabilities.
- Added native `BarcodeDetector` use where available while keeping bundled ZXing as the main cross-browser fallback.
- Added 45-second live scanning with clearer distance, blur, glare, and lighting instructions.
- Added multi-pass photo decoding across full-frame and center-crop variants.
- Added a direct read-only Open Food Facts product lookup when no proxy is configured.
- Preserved optional proxy-first operation through `config.js`.
- Corrected serving-based calorie, macro, and sodium calculations.
- Cached successful product lookups locally by barcode.
- Preserved manual creation when a product is missing or the database is unavailable.
- Added explicit cleanup for late camera streams, dialog closing, successful scans, visibility changes, and errors.
- Updated cache-busted files and the service-worker cache to `phactoryfit-v1.3.0`.

## Browser and barcode tests — 7/7 passed

1. Mobile-width load and horizontal-overflow check
2. Manual barcode lookup, Enter-key submission, serving math, diary addition, and local product reuse
3. Real EAN-13 barcode decoding from a generated PNG using the bundled ZXing library
4. Live MediaStream decoding with the real ZXing decoder, torch UI, multi-camera UI, and product result
5. Camera permission-denied handling
6. Late stream shutdown when the modal closes during a delayed permission request
7. Product-missing and product-database-unavailable fallback handling

The generated EAN-13 test barcode decoded as `3017624010701`. For a 37-gram serving, the test product correctly normalized 539 kcal/100 g to approximately 199 kcal and 6.3 g protein/100 g to approximately 2.3 g protein.

## Static and package checks — 58/58 passed

The static audit passed:

- JavaScript syntax for the app, service worker, and configuration
- Required project files
- Manifest JSON, standalone mode, start URL, standard icons, and maskable icons
- Exact image dimensions for Apple, favicon, standard, and maskable assets
- Service-worker cache version and every shell asset reference
- Cache-busted application, style, and scanner references
- Apple touch-icon declaration
- Camera, center-crop, confirmation, photo, fallback-constraint, torch, camera-switch, and cleanup implementations
- Direct product lookup and optional proxy configuration
- Serving-based nutrient normalization
- Scanner guide styling
- Bundled ZXing reader and license
- Credential, token, private-key, and obvious embedded-password scan

## Remaining physical-device check

A sandbox cannot reproduce the exact autofocus behavior, camera selection, permission state, and glare conditions of the user's iPhone. The automated test did use a real browser MediaStream, the bundled ZXing decoder, and a generated EAN-13 image rather than merely mocking a returned barcode value. After deployment, one physical iPhone test should verify rear-camera focus and permission on the actual GitHub Pages origin.
