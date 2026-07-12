# PhactoryFit 1.11.0 Release Validation Plan

## Automated

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

Expected results:

- 84/84 static checks
- 6/6 service-worker checks
- 5/5 browser security checks
- 11/11 restaurant catalog, fuzzy-search, serving, and fallback checks
- 5/5 UI and diary-editing checks
- 3/3 iPhone camera lifecycle checks
- zero npm audit vulnerabilities

## Manual restaurant validation

1. Open **Log Food** and confirm the restaurant directory lists eleven chains and 250 local records.
2. Search `McDonald's breakfast` and confirm breakfast sandwiches, Hash Browns, oatmeal, hotcakes, and platters are discoverable.
3. Search `subawy turkey 6 inch` and confirm **6-inch Oven-Roasted Turkey** appears despite the typo.
4. Search `subway foot long turkey` and confirm footlong turkey choices appear with footlong serving nutrition.
5. Search `arbys roastbeef` and confirm Classic, Double, and Half Pound Roast Beef results.
6. Search `sonic breakfast burrito` and confirm bacon and sausage burritos.
7. Search `fiveguys little cheese burger` and confirm Little Cheeseburger ranks first.
8. Search `bdubs mozzarella` and confirm Buffalo Wild Wings Mozzarella Sticks.
9. Search `chipotle high protein bowl` and confirm Double High Protein Bowl appears.
10. Search `chipotle chicken` and confirm the Chicken component appears with per-serving nutrition.
11. Search `panera broccoli cheddar cup` and confirm the cup serving appears before bowl and bread-bowl variants.
12. Search `panera chipotle chicken avo half` and confirm the half sandwich appears.
13. Open a full nutrition record and change servings to 2; confirm all available totals double.
14. Open a partial record such as Five Guys Cheeseburger and confirm missing macros display as unavailable, not zero.
15. Enter `MO` in Settings and confirm restaurant results display `United States · MO`.
16. Search an unsupported chain while online and confirm the community food database is attempted without replacing official local results.

## iPhone PWA regression

1. Deploy all package files to GitHub Pages.
2. Open the site in Safari and refresh twice.
3. Confirm Settings displays Version 1.11.0.
4. Test restaurant search online and offline.
5. Test rear-camera barcode scanning after allowing permission.
6. Close and reopen the Home Screen app and verify the restaurant catalog still works offline.
7. Export a backup, add a restaurant item, import the backup, and confirm previous data is restored.

## Cosmic UI validation

1. Confirm the header reads “Designed by Tech Phactory Solutions” and displays the slogan “Build better. Fuel smarter. Live stronger.”
2. Confirm calories, protein, carbohydrates, and fat each display a circular gauge with correct percentage, consumed amount, goal, and remaining/over amount.
3. Scroll the Today view and verify cards reveal smoothly without flicker or horizontal movement.
4. Enable iOS Reduce Motion and confirm all information appears immediately with no moving starfield or reveal delay.
5. Test Today, Diary, Log, Progress, Coach, and Settings at iPhone and iPad widths.
6. Confirm the hero “Log your first meal” button opens Add food.
7. Confirm the rear-camera scanner remains open after permission and still closes its tracks when the scanner is explicitly dismissed.

## Diary editing validation

1. Log or scan a food and open **Diary**.
2. Confirm the entry displays its local logging time and an **Edit** action.
3. Open the editor and change the meal period from Morning / Breakfast to Evening / Dinner.
4. Change the exact time and confirm the entry is sorted chronologically in the destination section.
5. Change servings to 1.5 and confirm calories, protein, carbohydrates, and fat update before saving.
6. Save, close, and reopen the app; confirm the meal period, time, and portion persist.
7. Open the editor again, delete the entry, and confirm daily totals update immediately.
8. Import a v1.9 backup containing entries without time and confirm they display **Time not set** rather than failing.
