# PhactoryFit 1.8.0

PhactoryFit is a local-first, installable fitness and nutrition Progressive Web App designed by Tech Phactory Solutions LLC. It supports daily food and macro tracking, barcode scanning, packaged-food search, workouts, habits, weight trends, backups, and explainable coaching without requiring an account.

## New in 1.8.0: restaurant discovery

Version 1.8.0 adds a curated U.S. restaurant-menu catalog so common chain items do not depend on a grocery-product database.

- 43 searchable menu records across McDonald's, Chick-fil-A, Starbucks, and Taco Bell
- McDonald's breakfast coverage including Hash Browns, Egg McMuffin, McGriddles, biscuits, burrito, oatmeal, hotcakes, bagel, and breakfast platters
- Search normalization for punctuation and aliases such as `McDonald's`, `McDonalds`, `mcd`, and `mickey ds`
- Restaurant + meal searches such as `McDonald's breakfast`
- Per-serving Nutrition Facts and adjustable serving quantities
- Transparent handling of partial nutrition records: unavailable macros display as a dash and are identified before logging
- “Strong fit,” “Good fit,” “Fits with planning,” and “Higher-calorie choice” guidance based on the user's remaining calories and protein
- Smarter alternatives from the same restaurant and menu category
- Optional state code used only to label U.S. menu results; no GPS permission or location service
- Restaurant catalog is bundled locally and available offline

The recommendation score is planning guidance. It does not evaluate allergies, medical conditions, every customization, price, or individual dietary restrictions.

## Core features

- Daily calories, protein, carbohydrates, fat, fiber, sugar, and sodium
- Meal-based diary with fractional and multiple servings
- Custom foods and saved products
- Brand and packaged-food search through optional Open Food Facts lookups
- Rear-camera UPC/EAN scanning and barcode-photo fallback
- Local barcode memory
- Workouts, water, steps, sleep, and weigh-ins
- Weight trends and consistency scoring
- Adaptive calorie guidance
- JSON export/import
- Offline PWA installation
- Local-first storage with no account, analytics SDK, or advertising SDK

## Deployment

1. Upload every file in this package to the repository root, including `.github`.
2. Keep `.nojekyll` in the root.
3. Enable GitHub Pages from the production branch.
4. Enforce HTTPS.
5. Wait for deployment to complete.
6. Open the Pages URL in Safari and refresh twice.
7. Fully close and reopen the installed Home Screen app.
8. Confirm **Settings → Version 1.8.0**.

Existing 1.7.0 local data is normalized automatically. Export a backup before replacing a production deployment.

## Testing

```bash
npm run test:static
npm run test:service-worker
npm run test:browser-security
npm run test:restaurant
npm audit --omit=dev --audit-level=high
node --check app.js
node --check restaurant-foods.js
node --check service-worker.js
```

Playwright and Chromium are required for the browser tests. The production app itself has no Node.js runtime requirement.

## Data accuracy

Restaurant records are based on standard U.S. nutrition published by the named restaurants and include a verification date. Restaurant availability, formulation, portion size, and customizations can change. Packaged-food data from Open Food Facts is community-contributed. Users should confirm critical nutrition and allergen information with the restaurant or package label.

## Security and privacy

See:

- `SECURITY.md`
- `PRIVACY.md`
- `THREAT_MODEL.md`
- `AUDIT_REPORT.md`
- `RESTAURANT_DATA_SOURCES.md`

Do not add private API keys to this repository. Any future accounts, cloud synchronization, health-platform integration, body-photo storage, payments, or AI backend require a new threat model and security audit.
