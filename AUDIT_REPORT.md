# PhactoryFit v1.6.1 — iPhone Barcode Camera Hotfix Audit

## Reported failure

On iPhone Safari, tapping **Use camera** immediately returned:

> The bundled barcode scanner did not load.

That message can only be produced by the `ScannerLibraryUnavailable` path. The camera permission itself was not the primary failure. The decoder global (`window.ZXingBrowser`) was unavailable when the live decode loop started.

## Root cause

The previous release depended on `vendor/zxing-browser.min.js`, a required file inside a nested folder. If that folder was omitted during a GitHub mobile upload, served from an older service-worker cache, or failed to load, the app still requested the camera stream. The first decoding pass then threw `ScannerLibraryUnavailable`; the catch path stopped the stream, making the camera appear to open and immediately close.

## Repairs

### P0 — Scanner engine deployment failure

- Embedded the ZXing barcode engine directly in `index.html`.
- The scanner no longer depends on a nested folder to start.
- Added a second root-level `zxing-browser.min.js` recovery copy.
- Added an asynchronous recovery loader that retries the root copy and then the legacy `vendor/` path.
- Changed camera startup order so the decoder is verified **before** Safari is asked for camera access.
- Added a visible **Retry scanner engine** action if initialization ever fails again.

### P1 — GitHub/iPhone deployment reliability

- Flattened every required runtime asset to the repository root.
- Updated the web manifest to use root-level icons.
- Removed nested `assets/` and `vendor/` paths from required service-worker installation.
- Made optional cache population use `Promise.allSettled`, so one missing icon or recovery asset cannot prevent a new service worker from installing.
- Changed JavaScript and CSS fetches to network-first, reducing stale-code persistence.
- Added a one-time reload when a newly installed service worker takes control.
- Added the displayed version number in Settings so the deployed build can be verified as **1.6.1**.

## Verification

### Browser and feature suite

- 17/17 existing browser, barcode, nutrition, import, chart, and camera lifecycle tests passed.
- Embedded scanner initialization passed.
- Root scanner recovery after deleting `window.ZXingBrowser` passed.
- Camera startup no longer entered the `ScannerLibraryUnavailable` path.
- Real EAN-13 photo decoding remained functional.
- Simulated live camera decoding, permission denial, delayed permission cleanup, Safari preview recovery, torch UI, and camera switching remained functional.

### Static and deployment audit

- 61/61 checks passed.
- JavaScript syntax passed for the app, service worker, configuration, and scanner engine.
- Manifest and all root icons validated.
- Every HTML runtime reference resolved to an included file.
- Scanner license included.
- Credential/private-key scan passed.

## Remaining physical-device validation

The development environment cannot operate the physical iPhone camera or reproduce Apple’s exact installed-PWA cache. After deployment, confirm:

1. Settings displays **Version 1.6.1**.
2. Safari asks for camera permission.
3. The rear-camera preview remains open.
4. A UPC/EAN barcode populates the number and generates nutrition.

If Settings still shows an older version, Safari is loading the previous deployment rather than this hotfix.
