# PhactoryFit 1.11.0

**Build better. Fuel smarter. Live stronger.**

PhactoryFit is an installable, local-first fitness and nutrition Progressive Web App designed by Tech Phactory Solutions. It combines calorie and macro tracking, restaurant and packaged-food search, barcode scanning, editable timed diary entries, workouts, habits, weight trends, backups, and transparent coaching without requiring an account.

## New in 1.11.0 — Expanded restaurant discovery

- Expanded the offline U.S. restaurant catalog from 43 to **250 menu records and components** across **11 chains**.
- Supported chains: McDonald's, Chick-fil-A, Starbucks, Taco Bell, Subway, Arby's, Sonic Drive-In, Five Guys, Buffalo Wild Wings, Chipotle, and Panera Bread.
- Added size-aware Subway entries, Chipotle ingredients and a high-protein bowl, and Panera breakfast, sandwiches, soups, salads, and mac & cheese.
- Added a restaurant browser showing each supported chain and local item count.
- Added weighted fuzzy matching for spelling mistakes, punctuation, aliases, plural forms, chain shorthand, and common menu phrasing.
- Searches such as `subawy turkey 6 inch`, `arbys roastbeef`, `fiveguys little cheese burger`, `bdubs mozzarella`, `chipotle high protein bowl`, and `panera broccoli cheddar cup` resolve to useful results.
- Restaurant-like searches also query the optional Open Food Facts community database so unsupported chains can still produce supplemental matches when online.
- Broad chain searches rank choices using today's remaining calories and protein; exact menu searches prioritize textual relevance.

Restaurant data represents standard U.S. menu nutrition, not live store inventory. Availability, recipes, portions, limited-time products, and customizations can vary by restaurant.

## Existing core features

- Daily calories, protein, carbohydrates, fat, fiber, sugar, and sodium
- Meal diary with exact time, editable serving quantity, meal reassignment, and deletion
- Custom foods and locally remembered products
- Online packaged-food search through Open Food Facts
- Smarter eating-out suggestions based on remaining calories and protein
- Rear-camera UPC/EAN scanning and barcode-photo fallback
- Workouts, water, steps, sleep, weigh-ins, and weight trends
- Adaptive calorie guidance and consistency scoring
- JSON backup and restore
- Animated cosmic UI with reduced-motion support
- Installable offline PWA
- No account, analytics SDK, advertising SDK, or private API key

## GitHub Pages deployment

1. Export a backup from the current app before replacing production files.
2. Upload every file and folder from this package to the repository root, including `.github`, `tests`, and `.nojekyll`.
3. Allow GitHub Pages to finish deploying.
4. Keep **Enforce HTTPS** enabled.
5. Open the Pages URL directly in Safari and refresh twice.
6. Fully close and reopen the Home Screen app.
7. Confirm **Settings → Version 1.11.0**.

The service worker uses a new `phactoryfit-v1.11.0` cache so older application assets are replaced during activation.

## Repeatable tests

```bash
npm run test:static
npm run test:service-worker
npm run test:browser-security
npm run test:restaurant
npm run test:ui
npm run test:camera
npm audit --omit=dev --audit-level=high
node --check app.js
node --check restaurant-foods.js
node --check service-worker.js
```

Playwright and Chromium are required only for the repository test suite. The deployed application has no Node.js runtime requirement.

## Data accuracy and privacy

The local catalog uses documented standard U.S. menu values and records a verification date. Missing nutrients remain unavailable rather than being converted to false zeroes. Open Food Facts records are community-contributed. Verify critical nutrition, allergen, and ingredient information against the current restaurant listing or package label.

Diary data stays in the browser unless exported. Camera frames and barcode photos are processed locally. See `PRIVACY.md`, `SECURITY.md`, `THREAT_MODEL.md`, `RESTAURANT_DATA_SOURCES.md`, and `AUDIT_REPORT.md` for release boundaries.
