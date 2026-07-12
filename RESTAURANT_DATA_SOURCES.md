# Restaurant Data Sources

**Catalog verification date:** July 12, 2026  
**Market:** Standard U.S. menu nutrition

The restaurant catalog is maintained as a first-party static data file so the public GitHub Pages app does not need secret API credentials. Values should be reviewed periodically because menus, portions, recipes, and availability change.

## McDonald's

Official U.S. product pages were used for menu names and nutrition, including:

- https://www.mcdonalds.com/us/en-us/product/hash-browns.html
- https://www.mcdonalds.com/us/en-us/product/egg-mcmuffin.html
- https://www.mcdonalds.com/us/en-us/product/sausage-mcmuffin.html
- https://www.mcdonalds.com/us/en-us/product/sausage-mcmuffin-with-egg.html
- https://www.mcdonalds.com/us/en-us/product/bacon-egg-cheese-biscuit.html
- https://www.mcdonalds.com/us/en-us/product/sausage-biscuit-with-egg.html
- https://www.mcdonalds.com/us/en-us/product/bacon-egg-cheese-mcgriddles.html
- https://www.mcdonalds.com/us/en-us/product/sausage-egg-cheese-mcgriddles.html
- https://www.mcdonalds.com/us/en-us/product/hotcakes.html
- https://www.mcdonalds.com/us/en-us/product/big-breakfast.html
- https://www.mcdonalds.com/us/en-us/product/big-breakfast-with-hotcakes.html
- https://www.mcdonalds.com/us/en-us/product/fruit-maple-oatmeal.html
- https://www.mcdonalds.com/us/en-us/product/bacon-egg-cheese-bagel.html
- https://www.mcdonalds.com/us/en-us/product/mcchicken-biscuit.html

## Chick-fil-A

Official U.S. menu and nutrition pages were used:

- https://www.chick-fil-a.com/menu/breakfast
- https://www.chick-fil-a.com/menu/breakfast/egg-white-grill
- https://www.chick-fil-a.com/menu/breakfast/chicken-biscuit
- https://www.chick-fil-a.com/menu/breakfast/spicy-chicken-biscuit
- https://www.chick-fil-a.com/menu/breakfast/chicken-egg-cheese-biscuit
- https://www.chick-fil-a.com/menu/entrees/grilled-chicken-sandwich
- https://www.chick-fil-a.com/menu/entrees/chick-fil-a-chicken-sandwich
- https://www.chick-fil-a.com/menu/entrees/grilled-nuggets
- https://www.chick-fil-a.com/menu/sides/kale-crunch-side

## Starbucks

Official U.S. item and nutrition pages were used. Some Starbucks records expose only selected nutrients in the public result; PhactoryFit marks those records partial rather than filling missing fields with zero.

- https://www.starbucks.com/menu/product/368/single/nutrition
- https://www.starbucks.com/menu/product/367/single/nutrition
- https://www.starbucks.com/menu/product/369/single/nutrition

## Taco Bell

Official U.S. menu pages were used. Where complete macronutrients were not available in the public page response, the record is intentionally calories-only.

- https://www.tacobell.com/food/tacos/crunchy-taco
- https://www.tacobell.com/food/tacos/soft-taco
- https://www.tacobell.com/food/tacos/soft-taco-supreme
- https://www.tacobell.com/food/burritos/bean-burrito
- https://www.tacobell.com/food/burritos/burrito-supreme
- https://www.tacobell.com/food/burritos/beefy-5-layer-burrito
- https://www.tacobell.com/food/specialties/crunchwrap-supreme
- https://www.tacobell.com/food/specialties/black-bean-crunchwrap-supreme
- https://www.tacobell.com/food/quesadillas/chicken-quesadilla

## Maintenance rule

A catalog update should include:

1. An official U.S. source.
2. A new `verifiedAt` date.
3. Per-serving units.
4. `availableNutrients` when any field is missing.
5. Browser regression tests for search, serving multiplication, and partial-data display.
6. A security workflow run before publishing.
