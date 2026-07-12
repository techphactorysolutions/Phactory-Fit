# PhactoryFit 1.9.0 Release Validation Plan

## Automated

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

Expected results:

- 84/84 static checks
- 6/6 service-worker checks
- 5/5 browser security checks
- 4/4 restaurant workflow checks
- zero npm audit vulnerabilities

## Manual restaurant validation

1. Open **Log Food**.
2. Search `McDonald's breakfast`.
3. Confirm Hash Browns, Egg McMuffin, Sausage McMuffin, biscuits, McGriddles, oatmeal, hotcakes, and breakfast platters appear.
4. Open Egg McMuffin and verify one serving shows 310 calories, 17 g protein, 30 g carbohydrates, and 13 g fat.
5. Change servings to 2 and confirm the preview shows 620 calories and 34 g protein.
6. Add it to Breakfast and verify diary totals.
7. Search `Chick-fil-A breakfast`, `Starbucks breakfast`, and `Taco Bell`.
8. Confirm each restaurant item shows a plan-fit badge or a calories-only label.
9. Open a partial record such as McChicken Biscuit and confirm missing macros display as unavailable rather than 0.
10. In Settings, enter `MO` as the state and confirm restaurant results show `United States · MO`.

## iPhone PWA regression

1. Deploy all package files to GitHub Pages.
2. Open the site in Safari and refresh twice.
3. Confirm Settings displays Version 1.9.0.
4. Test restaurant search online and offline.
5. Test rear-camera barcode scanning after allowing permission.
6. Close and reopen the Home Screen app and verify the restaurant catalog still works offline.
7. Export a backup, add a restaurant item, import the backup, and confirm previous data is restored.

## v1.9 UI validation additions

1. Confirm the header reads “Designed by Tech Phactory Solutions” and displays the slogan “Build better. Fuel smarter. Live stronger.”
2. Confirm calories, protein, carbohydrates, and fat each display a circular gauge with correct percentage, consumed amount, goal, and remaining/over amount.
3. Scroll the Today view and verify cards reveal smoothly without flicker or horizontal movement.
4. Enable iOS Reduce Motion and confirm all information appears immediately with no moving starfield or reveal delay.
5. Test Today, Diary, Log, Progress, Coach, and Settings at iPhone and iPad widths.
6. Confirm the hero “Log your first meal” button opens Add food.
7. Confirm the rear-camera scanner remains open after permission and still closes its tracks when the scanner is explicitly dismissed.
