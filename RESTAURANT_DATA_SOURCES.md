# Restaurant and Food Data Sources — PhactoryFit 1.12.0

## Curated local catalog

`restaurant-foods.js` contains 250 hand-curated U.S. menu records across 11 chains. These records preserve source labels, verification dates where available, and partial-nutrient handling.

## Supplemental open restaurant archive

`restaurant-foods-expanded.js` contains 1,098 source records from the MIT-licensed `captn3m0/restaurant-nutrition-data` project. It adds Burger King, Dairy Queen, Hardee's, Little Caesars, Taco John's, Wendy's, and White Castle.

The source repository describes the files as nutrition data from popular restaurants and fast-food chains imported into FoodNoms. The original license is included as `RESTAURANT_ARCHIVE_LICENSE.txt`.

These records are labeled **Archive** in the interface. They are not represented as current official menus. Some original datasets use source-listed portions or older menu terminology. Users should verify current serving sizes and nutrition with the restaurant.

## Open Food Facts

Open Food Facts remains the packaged-food and barcode source. It is a collaborative product-label database and is not treated as a complete restaurant-menu system.

## Optional Phactory Food Cloud

The reference Worker in `food-cloud/` can query:

- FatSecret Platform API for searchable food and restaurant records.
- USDA FoodData Central for branded-food records.

The Worker stores credentials server-side, returns a normalized schema, applies query and response bounds, disables caching, and restricts browser access to the configured app origin. Provider terms, attribution, quotas, and storage restrictions remain the deployer's responsibility.

## Release totals

- Curated local records: 250
- Supplemental archived records: 1,098
- Total offline records: 1,348
- Offline chains: 18
- Duplicate record IDs: 0
