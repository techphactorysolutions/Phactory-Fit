# PhactoryFit v1.6.0 Production Audit Report

**Audit date:** July 12, 2026  
**Baseline:** PhactoryFit v1.5.0  
**Target:** Static GitHub Pages deployment, iPhone Safari, and installable iPhone PWA

## A. Executive summary

The v1.5.0 application was functional and its existing test suite passed, but the production review found correctness and resilience gaps that could misstate nutrition, distort progress trends, accept unsafe imported data, or destabilize barcode scanning on iPhone Safari.

The highest-risk defect was product normalization: incomplete online records could silently become zero-valued macros. Serving-unit parsing also had weak paths for mixed household/metric labels and non-gram units. These were repaired in v1.6.0, together with import normalization, trend calculations, adherence logic, camera lifecycle handling, and mobile accessibility.

The implemented v1.5.0 feature set was treated as the source of truth. Placeholder examples from the supplied audit prompt—supplement scheduling, body photos, wearable synchronization, progressive-overload set tracking, and local AI coaching—were not represented as completed features.

**Automated result:**

- **17/17 browser and calculation tests passed**
- **83/83 static, PWA, asset, security, and accessibility checks passed**
- No embedded API keys, passwords, access tokens, or private keys were detected

The package is suitable for deployment testing. Final release approval still requires a physical iPhone camera test and an offline reload test on the deployed HTTPS origin because those device/browser conditions cannot be reproduced in this execution environment.

## B. Issues found and repaired

| Severity | Area | Original behavior / impact | Root cause | Repair |
|---|---|---|---|---|
| P0 | Nutrition data | Products missing protein, carbohydrate, or fat could be accepted and shown as zero, creating materially wrong diary totals. | Missing values were normalized through generic numeric fallbacks. | Added a core-macro completeness gate. Incomplete products now require a verified manual record. |
| P0 | Serving math | Mixed labels and uncommon units could produce the wrong per-serving multiplier. | Parsing relied mainly on simple gram/milliliter patterns and could select a household number such as `1` instead of `28 g`. | Added normalized conversion for g, kg, mg, ml, l, oz, lb, and fl oz; explicit metric quantities take precedence. |
| P0 | Imported weight data | A future-dated weigh-in in a backup could become the current weight and affect progress guidance. | Backup normalization bounded numeric values but did not reject future dates. | Future weigh-ins are filtered during normalization and current-weight selection. |
| P1 | Energy conversion | Products reporting energy only in kilojoules could lack calories. | No kJ fallback path. | Convert kJ to kcal using `kJ / 4.184`. |
| P1 | Sodium/cholesterol | Milligram display could be off by 1,000× when sources already supplied milligram fields. | Conversion assumed gram-based source values. | Added unit-aware nutrient extraction and conversion. |
| P1 | Voice search | Spoken brand names searched only local foods. | Voice handler populated the input but did not trigger online search. | Voice input now calls the packaged-food search scheduler. |
| P1 | Weight chart | Irregular weigh-ins were spaced evenly, visually misrepresenting time. | X positions were based on array index. | X positions now use actual date deltas. |
| P1 | Adherence guidance | An incomplete current day could lower the seven-day adherence score. | The calculation included today before it was complete. | The engine now evaluates the last seven completed days. |
| P1 | iPhone camera | Safari visibility transitions could stop or churn the camera lifecycle. | Visibility handling treated transient hidden states as authoritative closure. | The stream remains active; decode work pauses while hidden; explicit close and page exit still stop tracks. |
| P1 | Duplicate foods | Imports could retain duplicate saved products and create ambiguous search results. | Normalization validated records independently without identity de-duplication. | De-duplicate by normalized ID and barcode. |
| P2 | Resource bounds | Repeated additive entries could grow cumulative daily values without defensive limits. | Individual inputs were bounded, but totals were not consistently clamped. | Added caps to cumulative workout, exercise-calorie, water, custom-food, and daily-entry values. |
| P2 | External images | Product image fields could preserve non-HTTPS schemes. | URL strings were not protocol-gated. | Only valid HTTPS product images are retained. |
| P2 | Mobile accessibility | Some iPhone inputs could trigger Safari zoom; chart meaning was unavailable to screen readers. | Small control fonts and visual-only chart output. | Set 16 px modal controls, added chart `aria-label`, focus-visible styles, and reduced-motion handling. |

## C. Codebase and architecture assessment

### Implemented and verified

- Local-first daily diary and macro aggregation
- Typed, voice, and online packaged-food search
- Manual barcode lookup, live camera scanning, and barcode-photo decoding
- Nutrition Facts generation and serving multiplication
- Custom-food correction and local product memory
- Workout minutes, exercise calories, water, steps, sleep, and weight logs
- Daily score, weight trend, calorie guidance, and protein-rescue suggestions
- Validated JSON export/import
- PWA manifest, icons, service worker, and GitHub Pages-compatible paths

### Not implemented in this release

- User authentication or cloud synchronization
- Multi-device conflict resolution
- Progress-photo storage
- Body-measurement tracking beyond weight
- Workout sets, repetitions, load history, estimated 1RM, or PR detection
- Supplement schedules or medical interaction logic
- Apple Health, Google Fit, Garmin, or MyFitnessPal integration
- AI coaching or local-agent execution
- Encrypted local data at rest

### Maintainability observations

The application remains a single large `app.js` file. It is deployable without a build system, but future feature growth should separate pure nutrition calculations, state validation, persistence, barcode infrastructure, and UI rendering into modules. The new tests provide a safety net for that refactor.

## D. Verification performed

### Browser and calculation suite — 17/17 passed

1. App load and mobile horizontal-overflow check
2. Manual barcode lookup, serving calculation, diary insertion, and local reuse
3. Real generated EAN-13 image decoding
4. Simulated live camera decode, torch, and camera-switch controls
5. Camera permission-denied handling
6. Late camera permission resolution after scanner closure
7. Missing-product and offline-database fallbacks
8. Corrected generated-nutrition workflow
9. Online brand search, serving multiplication, and diary insertion
10. Short Safari-style visibility transition without camera shutdown
11. Preview-play rejection recovery while preserving the stream
12. Voice search reaching packaged-food results
13. Unit conversion, kilojoule conversion, and incomplete-record rejection
14. Import filtering of future weigh-ins and duplicate foods
15. Real-date weight-chart spacing and accessible summary
16. Completed-day adherence calculation
17. Cumulative-value clamping

### Static, PWA, security, and accessibility audit — 83/83 passed

The audit verifies:

- JavaScript syntax
- Required deployment files
- Manifest structure and icon sizes
- Unique static HTML IDs and accessible viewport behavior
- v1.6.0 asset versioning
- Service-worker cache references, navigation fallback, and old-cache removal
- Food-search endpoints, debounce, cancellation, normalization, and voice route
- Nutrition completeness, unit conversion, kJ conversion, and mg handling
- Import normalization, de-duplication, data caps, and HTTPS images
- Chart spacing and accessibility summary
- Camera acquisition, decoding, recovery, cleanup, and hidden-page behavior
- ZXing bundle and license
- iOS input sizing, keyboard focus, reduced motion, and safe areas
- Public-code credential scan

Complete machine-readable console logs are included as:

- `BROWSER_TEST_RESULTS.txt`
- `STATIC_AUDIT_RESULTS.txt`

## E. Run, test, and verify

From the project root:

```bash
python -m pip install -r requirements-test.txt
playwright install chromium
python tests/static_audit.py
python tests/test_browser.py
```

For a local visual smoke test, serve the directory through an HTTP server rather than opening `index.html` directly:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`. Camera APIs generally require HTTPS or a browser-recognized local secure context. The production camera test should be performed on the HTTPS GitHub Pages deployment.

### Manual acceptance path

1. Set a 2,300 kcal goal and 200 g protein target.
2. Search for a packaged food, select it, set 1.5 servings, and verify totals multiply correctly.
3. Scan a physical package and compare every generated core macro with the label.
4. Log water, steps, sleep, a workout, and weight.
5. Add irregularly spaced weigh-ins and confirm the chart reflects the date gaps.
6. Export a backup, inspect that it contains only app data, reset, and re-import it.
7. Attempt to import a future weigh-in and duplicate product; confirm both are normalized safely.
8. Test the installed PWA with the network disabled after the app shell and foods have been cached.

## F. Remaining risks and recommendations

1. **Physical-device release gate:** Test live camera permission, autofocus, background/resume, and camera indicator shutdown on the exact target iPhone and iOS build.
2. **Offline release gate:** Validate a true deployed-origin offline reload and service-worker update cycle. Static cache integrity passed, but this environment blocked localhost/browser-origin navigation.
3. **Data privacy:** Local storage is private to the browser origin but is not encrypted. Do not add progress photos or sensitive medical data without explicit consent, retention controls, and stronger storage architecture.
4. **Nutrition provenance:** Display source and verification state more prominently. Community records should never be treated as clinically authoritative.
5. **Modularization:** Extract calculation and normalization functions into independently tested modules before adding cloud sync, body composition, supplement logic, or AI recommendations.
6. **Cloud sync:** Add authentication, row-level security, encryption in transit, conflict resolution, deletion/export controls, and a privacy policy before syncing user data.
7. **Observability:** Add privacy-preserving error telemetry only with user consent; never transmit diary content by default.

## G. Detailed changelog

See `CHANGELOG.md` for version-by-version history. The v1.6.0 entry records every production-audit change and its validation status.

## Final assessment

**PASS FOR DEPLOYMENT TESTING.** Core logging, nutrition math, barcode flows, import normalization, progress calculations, and mobile browser behavior passed the automated audit. Production release should follow only after the listed physical iPhone and deployed-origin offline checks are completed.
