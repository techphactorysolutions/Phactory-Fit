# PhactoryFit v1.6.2 — iPhone Safari Camera Lifecycle Repair

## Reported failure

On iPhone Safari, **Use camera** requested rear-camera permission and then the scanner immediately closed. Manual barcode entry continued to work.

## Confirmed root cause

The previous build registered `stopBarcodeCamera()` on the global `pagehide` event. iPhone Safari can emit page lifecycle transitions while presenting or dismissing system permission/browser UI. The handler interpreted that transition as a real page exit, incremented the scanner session, stopped every camera track, cleared the video source, and hid the scanner immediately after permission was granted.

A second failure mode also existed: when Safari granted a live camera stream but delayed or rejected `<video>.play()`, startup treated the preview delay as fatal and closed the stream instead of preserving it for a user-gesture retry.

## Repairs

### P0 — Permission-sheet teardown

- Removed camera teardown from `pagehide`.
- Retained explicit track cleanup when the scanner/modal closes.
- Retained best-effort cleanup on `beforeunload`; browser document destruction also releases media tracks.
- Reattaches and resumes the same stream after transient visibility changes.

### P0 — Safari preview recovery

- Keeps a granted live stream open when Safari pauses or delays the video preview.
- Displays **Start preview** without requesting permission again.
- Does not hide the camera shell for a recoverable preview delay.
- Detects stream mute/unmute and attempts a controlled resume.
- Detects an unexpectedly ended track and performs one controlled reconnect, avoiding infinite retry loops.

### P1 — iPhone camera constraints

- Requests a minimal rear-camera constraint set first on iPhone Safari.
- Applies optional continuous focus and zoom only after the stream is live.
- Falls back to a generic camera request if the rear-camera preference is unavailable.

### P1 — Support diagnostics

- Added a runtime camera diagnostic object containing app version, permission state, stream state, track state, scanner session, and lifecycle note.
- Updated the visible Settings version to **1.6.2**.
- Updated the service-worker cache to `phactoryfit-v1.6.2`.

## Verification

### Full regression suite

- 17/17 browser, barcode, nutrition, food-search, serving-math, import, chart, and camera tests passed.

### Focused camera lifecycle suite

- Permission request survived a synthetic `pagehide` transition.
- Active camera stream survived a synthetic `pagehide` transition.
- iPhone user agent received minimal initial camera constraints.
- Simulated Safari `video.play()` rejection preserved the live stream and displayed **Start preview**.
- Explicit **Close camera** stopped the media track.

### Static/deployment audit

- 61/61 deployment checks passed.
- 83/83 source audit checks passed.
- JavaScript syntax passed.
- Required root files, manifest icons, scanner engine, service-worker references, and license passed.
- Credential/private-key scan passed.

## Testing boundary

The development environment cannot operate the physical camera on the user's iPhone or reproduce Apple's exact permission sheet and installed-PWA process. The exact teardown path was reproduced by dispatching the lifecycle event that previously stopped the stream, and the repaired build preserved the live track. Final verification still requires one scan on the deployed HTTPS site.

## On-device acceptance check

1. Open the deployed site directly in Safari.
2. Confirm Settings displays **Version 1.6.2**.
3. Open **Log → Barcode → Use camera**.
4. Tap **Allow**.
5. Confirm the camera view remains open.
6. If Safari pauses the preview, tap **Start preview**; no second permission request should be required.
7. Scan a UPC/EAN and confirm Nutrition Facts are generated.
8. Tap **Close camera** and confirm the iPhone camera indicator turns off.
