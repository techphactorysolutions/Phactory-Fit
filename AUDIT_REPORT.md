# PhactoryFit 1.8.0 Restaurant Search Audit

**Audit date:** July 12, 2026  
**Base:** PhactoryFit 1.7.0 security-hardened public release  
**Result:** Restaurant search, serving calculations, partial-data handling, security controls, and offline deployment tests passed.

## Objective

Repair the gap between grocery-product search and real restaurant logging. The previous Open Food Facts workflow was useful for barcoded packaged foods but did not reliably return restaurant menu items such as McDonald's Hash Browns or Egg McMuffin.

## Root cause

Open Food Facts is primarily a packaged-product database. PhactoryFit had no first-party restaurant catalog, restaurant intent parser, restaurant category metadata, or ranking model. Therefore a query such as `McDonald's breakfast` could return few or no useful menu results.

## Implemented repair

- Added a bundled, frozen U.S. restaurant catalog.
- Added normalized search for restaurant names, punctuation, aliases, menu categories, and item tags.
- Added immediate offline restaurant results before optional packaged-food network search.
- Added serving-level Nutrition Facts and live multiple-serving totals.
- Added optional state-code labeling without collecting GPS coordinates.
- Added explainable eating-out plan-fit guidance.
- Chain/category searches rank the strongest plan-fit choices first while exact item searches retain textual relevance.
- Added same-restaurant alternatives.
- Added field-level nutrition completeness metadata and visible partial-data warnings.
- Preserved the 1.7.0 CSP, origin allowlists, XSS defenses, bounded imports, cache allowlist, and vendored scanner integrity.

## Catalog scope

- 43 standard U.S. menu records
- McDonald's
- Chick-fil-A
- Starbucks
- Taco Bell

This is a curated starter catalog rather than a live store-inventory system. Availability, preparation, ingredients, and nutrition can vary by location and customization.

## Verification

- 4/4 restaurant search and serving tests passed
- 5/5 malicious-input browser security tests passed
- 6/6 service-worker cache-security tests passed
- 84/84 static, CSP, secret, dependency-integrity, and deployment checks passed
- JavaScript syntax validation passed for `app.js`, `restaurant-foods.js`, and `service-worker.js`
- Dependency audit found no known critical, high, moderate, or low vulnerabilities

## Tested scenarios

1. Search `McDonald's breakfast`, find the major breakfast menu items, and verify higher-protein/calorie-efficient choices rank above breakfast platters.
2. Select Egg McMuffin, set two servings, and verify 620 calories and 34 g protein before and after diary logging.
3. Use a Chick-fil-A shortcut and retrieve Egg White Grill and Chicken Biscuit.
4. Search Taco Bell and retrieve tacos, burritos, Crunchwrap, and quesadilla results.
5. Open a calories-only restaurant record and confirm missing macros are not rendered as zero.
6. Set the local profile state to Missouri and confirm the result label displays `United States · MO`.
7. Search common aliases such as `mcd breakfast tonight`.

## Residual limitations

- The catalog does not confirm whether an item is currently stocked at a specific restaurant.
- Restaurant customizations are not automatically calculated.
- Some official restaurant pages expose calories but not complete macros; those records are clearly marked partial.
- Restaurant data must be reviewed periodically as menus change.
- Recommendations do not account for allergies, medical conditions, sodium restrictions, religious requirements, price, or personal food tolerances.

## Release decision

PhactoryFit 1.8.0 is suitable for public beta deployment within its current static, local-first scope. It materially improves restaurant search without introducing private API credentials or a new backend attack surface.
