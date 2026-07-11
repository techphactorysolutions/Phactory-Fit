# PhactoryFit v1.1.0 Audit Report

**Audit date:** July 11, 2026  
**Target:** Mobile-first static PWA for GitHub Pages and iPhone Home Screen installation

## Final status

**PASS — the repaired application loads, renders, persists data, and completes the tested core workflows without uncaught browser errors.**

## Test coverage completed

### Automated integration suite — 14/14 passed

- Initial render and local-state initialization
- Food search, selected-meal preservation, and serving multiplication
- Custom food creation, logging, and diary removal
- Local barcode learning and repeat lookup
- Open Food Facts proxy serving-size normalization
- Coach action routing
- Exact protein-rescue food selection
- Backdated and current weight behavior
- Settings and weight-history synchronization
- Water, workouts, steps, sleep, and date switching
- Backup import and invalid-backup rejection
- Corrupt/legacy local-state repair
- Over-target coaching language
- Future weigh-in rejection

### Chromium mobile browser audit — 9/9 passed

Tested at a 390 × 844 mobile viewport using the Chromium browser engine:

- Initial application render
- State persistence
- No horizontal page overflow
- Food addition to the selected meal
- Calorie calculation update
- Workout and habit persistence
- Protein-rescue mapping
- Backdated weight handling
- Progress-screen navigation and chart rendering

No uncaught runtime errors or browser-console errors were detected during the Chromium flow.

### PWA and static checks

- JavaScript syntax checks: passed
- ESLint undefined-variable and unreachable-code checks: passed
- HTML validation and accessibility structure: passed
- Manifest JSON parsing: passed
- Service-worker install cache: passed
- Old-cache cleanup on activation: passed
- Online navigation and offline fallback behavior: passed
- Cross-origin request bypass: passed
- Required file-reference verification: passed
- Credential and secret scan: passed

## Defects found and repaired

1. **Food serving submission was blocked in real browsers.** The serving input used `min="0.01"` with `step="0.25"`, which made normal values such as 1 and 2 invalid. The input now uses compatible hundredth-serving increments.
2. **“Update sleep” opened the food logger.** Coach actions now use explicit action routing and open the habits form correctly.
3. **Protein-rescue buttons could select the wrong food or do nothing.** Each recommendation now maps to an exact food ID.
4. **Backdated weigh-ins could replace the current weight.** Current weight is now derived from the most recent dated entry; future weigh-ins are rejected.
5. **Custom and barcode foods lost the selected meal.** Meal context now survives food creation, barcode teaching, lookup, and final diary entry.
6. **Malformed backups or legacy browser data could crash rendering.** A state-normalization and migration layer now validates dates, numbers, foods, days, weights, and profile goals.
7. **External barcode serving calculations could parse “1 bottle (414 ml)” as 1 gram.** Serving normalization now extracts the actual gram or milliliter amount and rounds stored nutrient values.
8. **Camera streams could continue after the modal closed.** Active tracks are now stopped during close, timeout, error, and successful detection.
9. **The trend-rate calculation understated weight change.** The adaptive engine now uses linear regression over recent dated weigh-ins and requires an adequate date span.
10. **Over-target displays could show confusing negative remaining calories.** The dashboard now reports calories “over,” and coaching avoids negative remaining values.
11. **Progress rendering created unused empty diary days.** Read-only trend calculations no longer mutate local data.
12. **The original service worker could hold stale application files too aggressively.** The cache was versioned to v1.1.0 and now refreshes static assets while preserving offline fallback.
13. **Input and accessibility metadata was incomplete.** Buttons now have explicit types, settings have safe bounds, the score and chart have appropriate accessible labels, and iPhone standalone metadata was added.

## Security and privacy review

- No API keys, passwords, access tokens, private credentials, or backend secrets are included.
- The optional external food proxy is disabled by default in `config.js`.
- User-entered and external product text is escaped before HTML rendering.
- Imported data is validated and bounded before use.
- Local reset requires confirmation.
- Data remains in the browser unless the user exports a backup.

## Environment limitations

The camera barcode workflow requires a supported browser and physical camera, and voice logging requires browser speech-recognition support. Those hardware-permission paths could not be fully exercised in this sandbox; their unsupported/error fallbacks were reviewed. The optional Open Food Facts path was tested with a mocked compliant proxy response because no production proxy URL is configured.

After deployment, perform one final iPhone smoke test over the generated GitHub Pages HTTPS URL: open the app, add one food, reload, add it to the Home Screen, enable Airplane Mode, and confirm the installed shell opens.
