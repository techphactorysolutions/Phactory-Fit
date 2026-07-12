#!/usr/bin/env python3
"""Restaurant discovery, fuzzy matching, serving math, and smart-pick regression tests."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright
from browser_security import INLINE_HTML

CHROMIUM_EXECUTABLE = "/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None

async def new_page(browser, *, capture_requests=None):
    context = await browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )

    async def off_router(route):
        if capture_requests is not None:
            capture_requests.append(route.request.url)
        await route.fulfill(status=200, content_type="application/json", body=json.dumps({"count": 0, "products": []}))

    await context.route("https://world.openfoodfacts.org/**", off_router)
    page = await context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    await page.set_content(INLINE_HTML, wait_until="domcontentloaded")
    await page.wait_for_selector("#app")
    return context, page, errors

async def test_mcdonalds_breakfast_search_and_log(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate("openModal('food', {meal:'Breakfast'})")
    await page.fill("#foodSearch", "McDonald's breakfast")
    await page.wait_for_selector(".restaurant-food-result")
    text = await page.locator("#foodResults").inner_text()
    first_result = await page.locator(".restaurant-food-result").first.inner_text()
    assert "Sausage McMuffin with Egg" in first_result or "Egg McMuffin" in first_result, first_result
    names = await page.evaluate("restaurantSearchResults(\"McDonald\'s breakfast\").map(item => item.name)")
    assert "Hash Browns" in names and "Big Breakfast" in names, names
    assert "Strong fit" in text or "Good fit" in text, text

    await page.locator('[data-food-id="restaurant-mcd-egg-mcmuffin"]').click()
    assert "310" in await page.locator(".nutrition-calories").inner_text()
    await page.fill("#foodQuantityInput", "2")
    preview = await page.locator("#servingTotalPreview").inner_text()
    assert "620" in preview and "34g" in preview.replace(" ", ""), preview
    await page.locator("#addFoodForm button[type='submit']").click()
    assert await page.locator("#caloriesConsumed").inner_text() == "620"
    assert await page.locator("#proteinConsumed").inner_text() == "34"
    assert not errors, errors
    await context.close()

async def test_restaurant_directory_and_chain_coverage(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate("openModal('food')")
    directory = await page.locator(".restaurant-directory").inner_text()
    for brand in ["McDonald", "Chick-fil-A", "Taco Bell", "Subway", "Arby", "Sonic", "Five Guys", "Buffalo Wild Wings", "Starbucks", "Chipotle", "Panera Bread"]:
        assert brand in directory, directory
    count = await page.evaluate("restaurantFoods().length")
    assert count >= 250, count
    assert not errors, errors
    await context.close()

async def test_subway_fuzzy_size_and_footlong(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""() => ({
      fuzzy: restaurantSearchResults('subawy turkey 6 inch').slice(0,8).map(item => item.name),
      footlong: restaurantSearchResults('subway foot long turkey').slice(0,8).map(item => item.name)
    })""")
    assert any("6-inch Oven-Roasted Turkey" == name for name in result["fuzzy"]), result
    assert any("Footlong" in name and "Turkey" in name for name in result["footlong"]), result
    assert not errors, errors
    await context.close()

async def test_arbys_alias_and_roast_beef(browser):
    context, page, errors = await new_page(browser)
    names = await page.evaluate("restaurantSearchResults('arbys roastbeef').slice(0,10).map(item => item.name)")
    assert "Classic Roast Beef" in names, names
    assert "Double Roast Beef" in names, names
    assert not errors, errors
    await context.close()

async def test_sonic_breakfast_search(browser):
    context, page, errors = await new_page(browser)
    names = await page.evaluate("restaurantSearchResults('sonic breakfast burrito').slice(0,10).map(item => item.name)")
    assert "Breakfast Burrito with Bacon" in names, names
    assert "Breakfast Burrito with Sausage" in names, names
    assert not errors, errors
    await context.close()

async def test_five_guys_spacing_and_item_alias(browser):
    context, page, errors = await new_page(browser)
    names = await page.evaluate("restaurantSearchResults('fiveguys little cheese burger').slice(0,10).map(item => item.name)")
    assert names and names[0] == "Little Cheeseburger", names
    assert not errors, errors
    await context.close()

async def test_buffalo_wild_wings_alias(browser):
    context, page, errors = await new_page(browser)
    names = await page.evaluate("restaurantSearchResults('bdubs mozzarella').slice(0,10).map(item => item.name)")
    assert names == ["Mozzarella Sticks"], names
    assert not errors, errors
    await context.close()

async def test_chipotle_component_and_high_protein_search(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""() => ({
      chicken: restaurantSearchResults('chipotle chicken').slice(0,10).map(item => item.name),
      protein: restaurantSearchResults('chipotle high protein bowl').slice(0,10).map(item => item.name)
    })""")
    assert "Chicken" in result["chicken"], result
    assert "Double High Protein Bowl" in result["protein"], result
    assert not errors, errors
    await context.close()

async def test_panera_alias_soup_and_sandwich_search(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""() => ({
      soup: restaurantSearchResults('panera broccoli cheddar cup').slice(0,10).map(item => item.name),
      sandwich: restaurantSearchResults('panera chipotle chicken avo half').slice(0,10).map(item => item.name)
    })""")
    assert "Broccoli Cheddar Soup — Cup" in result["soup"], result
    assert any("Chipotle Chicken Avocado Melt" in name and "Half" in name for name in result["sandwich"]), result
    assert not errors, errors
    await context.close()

async def test_partial_nutrition_never_looks_like_verified_zero(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate("openModal('food')")
    await page.fill("#foodSearch", "McChicken Biscuit")
    await page.wait_for_selector('[data-food-id="restaurant-mcd-mcchicken-biscuit"]')
    await page.locator('[data-food-id="restaurant-mcd-mcchicken-biscuit"]').click()
    facts = await page.locator(".nutrition-label").inner_text()
    assert "Calories\n420" in facts, facts
    assert "Total Fat" not in facts and "Protein" not in facts, facts
    warning = await page.locator(".restaurant-data-warning").inner_text()
    assert "Partial nutrition record" in warning, warning
    preview = await page.locator("#servingTotalPreview").inner_text()
    assert "—" in preview, preview
    assert not errors, errors
    await context.close()

async def test_location_label_typo_and_online_supplement(browser):
    requests: list[str] = []
    context, page, errors = await new_page(browser, capture_requests=requests)
    result = await page.evaluate("""() => {
      state.profile.stateCode = 'MO';
      const matches = restaurantSearchResults('mcdonlds breakfast tonight');
      return {label:restaurantLocationLabel(), names:matches.slice(0,10).map(item => item.name)};
    }""")
    assert result["label"] == "United States · MO", result
    assert "Hash Browns" in result["names"] or "Egg McMuffin" in result["names"], result

    await page.evaluate("openModal('food')")
    await page.fill("#foodSearch", "Wendys grilled chicken sandwich")
    await page.wait_for_timeout(900)
    assert requests, "Restaurant-like searches must still supplement the local catalog with the online community database"
    assert not errors, errors
    await context.close()

async def main():
    tests = [
        test_mcdonalds_breakfast_search_and_log,
        test_restaurant_directory_and_chain_coverage,
        test_subway_fuzzy_size_and_footlong,
        test_arbys_alias_and_roast_beef,
        test_sonic_breakfast_search,
        test_five_guys_spacing_and_item_alias,
        test_buffalo_wild_wings_alias,
        test_chipotle_component_and_high_protein_search,
        test_panera_alias_soup_and_sandwich_search,
        test_partial_nutrition_never_looks_like_verified_zero,
        test_location_label_typo_and_online_supplement,
    ]
    async with async_playwright() as playwright:
        launch_options = {"headless": True, "args": ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"]}
        if CHROMIUM_EXECUTABLE:
            launch_options["executable_path"] = CHROMIUM_EXECUTABLE
        browser = await playwright.chromium.launch(**launch_options)
        passed = 0
        for test in tests:
            await test(browser)
            passed += 1
            print(f"PASS {test.__name__}")
        await browser.close()
    print(f"PASSED {passed}/{len(tests)} restaurant search tests")

if __name__ == "__main__":
    asyncio.run(main())
