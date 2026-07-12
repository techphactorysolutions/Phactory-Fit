# PhactoryFit 1.10.0

## New in 1.10.0 — Editable diary entries

Open **Diary**, then tap **Edit** beside any food to change its meal period, exact time, or number of servings. Nutrition totals update immediately. Entries can also be deleted from the editor. Newly logged and scanned foods automatically receive the current local time.

**Build better. Fuel smarter. Live stronger.**

PhactoryFit is an installable, local-first fitness and nutrition Progressive Web App designed by Tech Phactory Solutions. It combines daily calorie and macro tracking, branded-food and restaurant search, barcode scanning, workouts, habits, weight trends, backups, and explainable coaching without requiring an account.

## New in 1.9.0 — Cosmic UI overhaul

- Complete dark cosmic visual system based on the supplied design direction
- Animated local-only starfield and nebula background
- Layered navy glass cards with neon teal, blue, purple, orange, and gold accents
- New PhactoryFit brand lockup and slogan
- Circular gauges for calories, protein, carbohydrates, and fat
- Accurate remaining, consumed, goal, and percentage values on every macro card
- Rebuilt daily-readiness card, healthy-habits panel, coach insight, and bottom navigation
- Smooth view transitions and scroll-reveal choreography
- Reduced-motion support for users who disable animation
- Responsive iPhone and iPad layouts with no horizontal overflow
- Performance-conscious effects: no remote visual assets and reduced filter load on mobile

All existing restaurant search, barcode scanning, nutrition calculations, security controls, offline behavior, and locally stored user data remain compatible.

## Core features

- Daily calories, protein, carbohydrates, fat, fiber, sugar, and sodium
- Meal-based diary with fractional and multiple servings
- Custom foods and locally remembered products
- Branded packaged-food search through optional Open Food Facts lookups
- Curated U.S. restaurant search for McDonald's, Chick-fil-A, Starbucks, and Taco Bell
- Explainable smarter eating-out suggestions based on remaining calories and protein
- Rear-camera UPC/EAN scanning and barcode-photo fallback
- Workouts, water, steps, sleep, weigh-ins, and weight trends
- Adaptive calorie guidance and consistency scoring
- JSON backup and restore
- Installable offline PWA
- No account, analytics SDK, advertising SDK, or private API key

## GitHub Pages deployment

1. Export a backup from the current app before replacing production files.
2. Upload every file and folder from this package to the repository root, including `.github`, `tests`, and `.nojekyll`.
3. Allow GitHub Pages to finish deploying.
4. Keep **Enforce HTTPS** enabled.
5. Open the Pages URL directly in Safari and refresh twice.
6. Fully close and reopen the Home Screen app.
7. Confirm **Settings → Version 1.10.0**.

The service worker uses a new `phactoryfit-v1.10.0` cache, so the older visual bundle is removed during activation.

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

Restaurant records represent standard U.S. menu nutrition and are not live store inventory. Menu availability, preparation, serving size, and customizations can change. Open Food Facts records are community-contributed. Users should verify critical nutrition and allergen information against the restaurant or package label.

Diary data stays in the browser unless exported. Camera frames and barcode photos are processed locally. See `PRIVACY.md`, `SECURITY.md`, `THREAT_MODEL.md`, and `AUDIT_REPORT.md` for the complete public-release boundaries.
