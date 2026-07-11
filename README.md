# PhactoryFit v1

PhactoryFit is an original, mobile-first nutrition and fitness tracker designed by **Tech Phactory Solutions LLC**. It is functionally inspired by modern calorie trackers but does not copy MyFitnessPal branding, code, or interface assets.

## Included in this build

- Daily calorie, protein, carbohydrate, and fat targets
- Protein-floor protection and protein rescue suggestions
- Breakfast, lunch, dinner, and snack diary
- Starter food library and custom foods
- Local-learning barcode library: scan or enter a UPC/EAN, create the product once, and reuse it offline
- Experimental camera barcode detection when the browser supports `BarcodeDetector`
- Browser voice-to-search logging when speech recognition is supported
- Workout, water, steps, sleep, and weight logging
- Daily consistency score
- Weight trend chart and cautious adaptive calorie recommendations
- Local-first storage, JSON export/import, and reset controls
- Installable Progressive Web App with offline app-shell caching
- GitHub Pages compatible; no build tools required

## GitHub Pages deployment

1. Create a new GitHub repository.
2. Upload **all files and folders inside this directory** to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Open the generated GitHub Pages URL in Safari on iPhone.
7. Tap **Share → Add to Home Screen**.

## Important limitations

- Custom and barcode-linked nutrition should be verified against the product package.
- `config.js` includes an optional blank `offProxyUrl`. A future production Open Food Facts integration should use a compliant backend/proxy so requests can include the required identifying User-Agent and observe caching/rate limits. Open Food Facts data is community-contributed and licensed under ODbL.
- Camera barcode detection and browser speech recognition are not uniformly supported across browsers. Manual entry remains available.
- The adaptive engine intentionally waits for multiple weigh-ins and adequate food logs before suggesting changes.
- This app provides general fitness guidance and is not a substitute for medical care or individualized dietetic advice.
- Data remains in the current browser unless manually exported. Clearing browser site data removes local entries.

## Next production phases

- Compliant Open Food Facts proxy with caching and attribution
- Supabase account sync and end-to-end row-level security
- USDA FoodData Central search integration through a protected backend
- Recipe builder and meal templates
- Apple Health integration through a native Capacitor wrapper
- Progress photos and body measurements
- Strength-program builder with sets, reps, rest timers, and personal records
- AI photo meal estimation with explicit confidence ranges and user correction learning
- Subscription layer only for cloud-heavy features; core diary and barcode logging remain free

## Ownership

Copyright © 2026 Tech Phactory Solutions LLC. All rights reserved.
