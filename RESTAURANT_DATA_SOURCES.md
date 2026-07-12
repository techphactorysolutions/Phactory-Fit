# Restaurant Data Sources

**Release catalog:** PhactoryFit 1.11.0  
**Market:** Standard U.S. menu nutrition  
**Catalog size:** 250 records across 11 chains

The catalog is a first-party static data file so a public GitHub Pages deployment does not require a secret commercial nutrition API key. Values must be reviewed periodically because menus, portions, recipes, and availability change. Restaurant entries include a `verifiedAt` date and use `availableNutrients` whenever an official source does not expose every field.

## McDonald's

Official U.S. product pages were used for the included breakfast products, including Hash Browns, Egg McMuffin, Sausage McMuffins, biscuits, McGriddles, breakfast burrito, oatmeal, hotcakes, bagel, and breakfast platters.

- https://www.mcdonalds.com/us/en-us/full-menu/breakfast.html
- https://www.mcdonalds.com/us/en-us/product/hash-browns.html
- https://www.mcdonalds.com/us/en-us/product/egg-mcmuffin.html

## Chick-fil-A

Official U.S. menu and nutrition pages were used for breakfast, sandwiches, nuggets, and sides.

- https://www.chick-fil-a.com/menu/breakfast
- https://www.chick-fil-a.com/menu/entrees
- https://www.chick-fil-a.com/menu/sides

## Starbucks

Official U.S. item and nutrition pages were used. Publicly available records that expose only selected nutrients are marked partial instead of filling missing fields with zero.

- https://www.starbucks.com/menu/food/hot-breakfast

## Taco Bell

Official U.S. menu pages were used. Entries with calories but without a complete public nutrient record are intentionally calories-only.

- https://www.tacobell.com/food

## Subway

The official U.S. nutrition guide dated January 2026 was used for standard 6-inch sandwiches and breakfast products. The guide states that standard footlong values are twice the corresponding 6-inch values; PhactoryFit stores separate size-aware records rather than asking the user to guess a multiplier.

- https://media.subway.com/dam/urn%3Aaaid%3Aaem%3A2278372c-147b-42f2-8edc-7d8d94d1f07e/original/as/us-nutrition-en.pdf

## Arby's

The official U.S. Nutrition & Allergen Guide dated April 2026 was used for roast beef sandwiches, chicken, gyros, wraps, sliders, fries, and sides.

- https://assets.ctfassets.net/30q5w5l98nbx/7LQsbLEL9fddQLuduDbA0k/7c1dd5a56d515c154298a00ce0668ff1/Arbys_Nutritional_and_Allergen_APR_2026.pdf

## Sonic Drive-In

The official U.S. Fall 2025 nutrition brochure was used for burgers, chicken, hot dogs, breakfast sandwiches, breakfast burritos, breakfast toasters, and selected sides.

- https://assets.ctfassets.net/2iottqjdrp5h/65XT3FGLAwpNbHl1HpDh3Y/e51df0cbbe1224e12bc7d5abfc271205/58778-3_F25_NAT_NutritionalBrochure_FA_rg_Spread_WCAG__1_.pdf

## Five Guys

Official U.S. menu pages were used for current listed calories. Because those public pages do not expose complete macros for every item, these records are intentionally calories-only.

- https://www.fiveguys.com/menu/burgers/
- https://www.fiveguys.com/menu/dogs/
- https://www.fiveguys.com/menu/sandwiches/
- https://www.fiveguys.com/menu/fries/

## Buffalo Wild Wings

The official 2026 nutrition guide was used for the included appetizers, sandwiches, and street tacos.

- https://assets.ctfassets.net/6dxmiqksdkqb/4WACoRDzMah36duJPDyTJ9/a9e9b891dbd27a7042e0e7499080501e/26_BWW_2320050_IS_AW2_Nutrition_Guide.pdf

## Chipotle

The official U.S. nutrition guide was used for tortillas, rice, beans, vegetables, proteins, salsas, dairy toppings, guacamole, queso, chips, vinaigrette, and the Double High Protein Bowl. Component records allow users to assemble a closer estimate of a customized order instead of logging one generic bowl.

- https://www.chipotle.com/content/dam/chipotle/menu/nutrition/US-Nutrition-Facts-Paper-Menu-3-2025.pdf
- https://www.chipotle.com/nutrition-calculator

## Panera Bread

The official U.S. nutrition guide effective June 17, 2026 was used for the included breakfast products, half and whole sandwiches, soups, mac & cheese, and salads.

- https://www.panerabread.com/content/dam/panerabread/documents/c6-26-nutrition-guide.pdf
- https://www.panerabread.com/en-us/menu/nutrition.html

## Maintenance rule

Every catalog update must include:

1. An official U.S. source whenever available.
2. A new `verifiedAt` date.
3. A precise per-serving description.
4. `availableNutrients` when any field is missing.
5. Unique stable IDs and nonnegative numeric fields.
6. Search, serving multiplication, partial-data, and security regression tests.
7. A complete security workflow before publication.
