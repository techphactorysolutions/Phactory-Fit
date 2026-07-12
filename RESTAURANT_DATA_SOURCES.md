# Restaurant and Food Data Sources — PhactoryFit 1.13.0

PhactoryFit uses layered sources because no single static dataset can accurately represent every current U.S. restaurant menu.

## 1. Curated offline records

`restaurant-foods.js` contains selected U.S. menu records reviewed for the app. These are labeled **Verified** in the interface. Menu availability, preparation, and nutrition can still vary by location and customization.

## 2. Supplemental offline archive

`restaurant-foods-expanded.js` contains a larger MIT-licensed historical restaurant dataset used by the FoodNoms ecosystem. These records are explicitly labeled **Archive** so older nutrition is not presented as current official restaurant data. See `RESTAURANT_ARCHIVE_LICENSE.txt`.

## 3. Hidden 422-brand registry

`restaurant-brands.js` contains the 422 restaurant names supplied for this project, plus normalized aliases. It is used only for search recognition and provider routing. It contains no fabricated nutrition values and is not rendered as a browse-all directory.

## 4. Phactory Food Cloud live providers

The optional server gateway in `food-cloud/` can query:

- Nutritionix restaurant and branded-food data.
- FatSecret restaurant, branded, and common foods.
- USDA FoodData Central branded foods.

Provider credentials are stored as server secrets. Live results are labeled **Live** and are not persisted by the Worker. Review provider terms before production deployment.

## 5. Open Food Facts

Open Food Facts remains a community packaged-food and barcode fallback. It is not treated as an authoritative restaurant-menu source. Community data should be checked against the package or restaurant nutrition listing.

## Accuracy rules

- Missing nutrients remain unavailable rather than being silently converted to zero.
- Serving size and quantity are displayed before diary logging.
- Source quality appears with search results.
- Current restaurant recipes, limited-time items, region-specific menus, and customizations can change nutrition.
- The app must not claim universal current-menu completeness unless a provider contract and ongoing verification process support that claim.
