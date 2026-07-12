#!/usr/bin/env python3
"""Restaurant catalog, fuzzy matching, source labels, serving math, and Food Cloud regressions."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright
from browser_security import INLINE_HTML

CHROMIUM_EXECUTABLE = "/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None

async def main():
    async with async_playwright() as playwright:
        options = {"headless": True, "args": ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"]}
        if CHROMIUM_EXECUTABLE:
            options["executable_path"] = CHROMIUM_EXECUTABLE
        browser = await playwright.chromium.launch(**options)
        context = await browser.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, device_scale_factor=3)
        requests: list[str] = []

        async def off_router(route):
            requests.append(route.request.url)
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({"count":0,"products":[]}))
        await context.route("https://world.openfoodfacts.org/**", off_router)

        page = await context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.set_content(INLINE_HTML, wait_until="domcontentloaded")
        await page.wait_for_selector("#app")
        passed = 0

        # 1. Catalog breadth, provenance, and exact counts.
        catalog = await page.evaluate("""() => ({
          count: restaurantFoods().length,
          archiveCount: restaurantFoods().filter(item => item.dataQuality === 'archived-menu').length,
          officialCount: restaurantFoods().filter(item => item.dataQuality === 'official').length,
          brands: [...new Set(restaurantFoods().map(item => item.brand))].sort()
        })""")
        assert catalog["count"] >= 1348, catalog
        assert catalog["archiveCount"] == 1098, catalog
        assert catalog["officialCount"] >= 250, catalog
        for brand in ["McDonald's","Burger King","Wendy's","Dairy Queen","Hardee's","Little Caesars","Taco John's","White Castle","Chick-fil-A","Taco Bell","Subway","Arby's","Sonic Drive-In","Five Guys","Buffalo Wild Wings","Starbucks","Chipotle","Panera Bread"]:
            assert brand in catalog["brands"], (brand, catalog["brands"])
        passed += 1; print("PASS catalog breadth and provenance")

        # 2-10. Search quality across aliases, typos, meals, and sizes.
        cases = [
          ("mcdonlds breakfast tonight", ["Hash Browns", "Egg McMuffin"]),
          ("bk whopper", ["Whopper Sandwich"]),
          ("wendys baconator", ["Baconator"]),
          ("dq peanut buster parfait", ["Peanut Buster Parfait"]),
          ("hardees sausage biscuit", ["Sausage Biscuit"]),
          ("little caesars pepperoni", ["Pepperoni"]),
          ("taco johns crispy taco beef", ["Crispy Taco"]),
          ("white castle original slider", ["Original Slider"]),
          ("subawy turkey 6 inch", ["6-inch Oven-Roasted Turkey"]),
          ("panera broccoli cheddar cup", ["Broccoli Cheddar Soup — Cup"]),
        ]
        for query, expected in cases:
            names = await page.evaluate("q => restaurantSearchResults(q).slice(0,25).map(item => item.name)", query)
            assert any(any(fragment.lower() in name.lower() for fragment in expected) for name in names), (query, names[:10])
            passed += 1; print(f"PASS search: {query}")

        # 12. Search UI removes the browse-all directory, recognizes the requested brand, and labels archived data.
        await page.evaluate("openModal('food')")
        assert await page.locator('.restaurant-directory').count() == 0
        assert await page.locator('.restaurant-quick-search').count() == 0
        await page.fill('#foodSearch', 'bk whopper')
        await page.wait_for_selector('.recognized-restaurant')
        recognized = await page.locator('.recognized-restaurant').inner_text()
        assert 'Burger King' in recognized, recognized
        await page.wait_for_selector('.food-source-badge.archived-menu')
        badge = await page.locator('.food-source-badge.archived-menu').first.evaluate('(el) => ({text:el.textContent, html:el.outerHTML})')
        assert 'Archive' in badge['text']
        passed += 1; print("PASS brand recognition, hidden directory, and source-quality badge")

        # 13. A provider-only requested brand is recognized and canonicalized without rendering a directory.
        await page.fill('#foodSearch', 'Wingstop lemon pepper')
        await page.wait_for_selector('.recognized-restaurant')
        provider_only = await page.evaluate("""() => ({
          recognized: document.querySelector('.recognized-restaurant')?.textContent || '',
          providerQuery: restaurantProviderQuery('bdubs boneless wings'),
          directoryCount: document.querySelectorAll('.restaurant-directory, .restaurant-quick-search').length
        })""")
        assert 'Wingstop' in provider_only['recognized'], provider_only
        assert provider_only['providerQuery'].startswith('Buffalo Wild Wings'), provider_only
        assert provider_only['directoryCount'] == 0, provider_only
        passed += 1; print("PASS provider-only brand recognition and canonical query routing")

        # 14. Official item serving math and diary logging remain correct.
        await page.fill('#foodSearch', "McDonald's breakfast")
        await page.locator('[data-food-id="restaurant-mcd-egg-mcmuffin"]').click()
        await page.fill('#foodQuantityInput', '2')
        preview = await page.locator('#servingTotalPreview').inner_text()
        assert '620' in preview and '34g' in preview.replace(' ', ''), preview
        await page.locator('#addFoodForm button[type="submit"]').click()
        assert await page.locator('#caloriesConsumed').inner_text() == '620'
        passed += 1; print("PASS serving math and diary log")

        # 15. Food Cloud configuration stays off by default and blocks unsafe origins.
        cloud = await page.evaluate("""() => {
          const original = window.PHACTORYFIT_CONFIG;
          const unsafe = configuredFoodCloudUrl();
          return {unsafe, defaultUrl: original.foodCloudUrl, workersAllowed: Boolean(safeApiUrl('https://example.workers.dev/v1/search')),
                  evilBlocked: safeApiUrl('https://evil.example/v1/search') === null};
        }""")
        assert cloud == {"unsafe":"", "defaultUrl":"", "workersAllowed":True, "evilBlocked":True}, cloud
        passed += 1; print("PASS Food Cloud URL controls")

        assert not errors, errors
        await context.close()
        await browser.close()
        print(f"PASSED {passed}/{passed} restaurant database tests")

if __name__ == '__main__':
    asyncio.run(main())
