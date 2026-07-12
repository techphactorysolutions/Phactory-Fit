#!/usr/bin/env python3
"""Restaurant discovery, serving math, and smart-pick regression tests."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright
from browser_security import INLINE_HTML


CHROMIUM_EXECUTABLE = "/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None

async def new_page(browser):
    context = await browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )

    async def off_router(route):
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
    assert "Hash Browns" in text, text
    assert "Egg McMuffin" in text, text
    assert "Sausage McMuffin" in text, text
    assert "Big Breakfast" in text, text
    assert "Strong fit" in text or "Good fit" in text, text

    await page.locator('[data-food-id="restaurant-mcd-egg-mcmuffin"]').click()
    assert "310" in await page.locator(".nutrition-calories").inner_text()
    await page.fill("#foodQuantityInput", "2")
    preview = await page.locator("#servingTotalPreview").inner_text()
    assert "620" in preview, preview
    assert "34g" in preview.replace(" ", ""), preview
    await page.locator("#addFoodForm button[type='submit']").click()
    assert await page.locator("#caloriesConsumed").inner_text() == "620"
    assert await page.locator("#proteinConsumed").inner_text() == "34"
    assert not errors, errors
    await context.close()


async def test_restaurant_shortcuts_and_chain_coverage(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate("openModal('food')")
    await page.locator('[data-food-search-query="Chick-fil-A breakfast"]').click()
    await page.wait_for_selector('[data-food-id="restaurant-cfa-egg-white-grill"]')
    text = await page.locator("#foodResults").inner_text()
    assert "Egg White Grill" in text, text
    assert "Chicken Biscuit" in text, text

    await page.fill("#foodSearch", "Taco Bell")
    await page.wait_for_selector('[data-food-id="restaurant-tb-crunchwrap-supreme"]')
    text = await page.locator("#foodResults").inner_text()
    assert "Crunchy Taco" in text, text
    assert "Burrito Supreme" in text, text
    assert "Chicken Quesadilla" in text, text
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
    assert "Total Fat" not in facts, facts
    assert "Protein" not in facts, facts
    warning = await page.locator(".restaurant-data-warning").inner_text()
    assert "Partial nutrition record" in warning, warning
    preview = await page.locator("#servingTotalPreview").inner_text()
    assert "—" in preview, preview
    assert not errors, errors
    await context.close()


async def test_location_label_and_normalized_alias_search(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""() => {
      state.profile.stateCode = 'MO';
      const matches = restaurantSearchResults('mcd breakfast tonight');
      return {label:restaurantLocationLabel(), names:matches.slice(0, 10).map(item => item.name)};
    }""")
    assert result["label"] == "United States · MO", result
    assert "Hash Browns" in result["names"] or "Egg McMuffin" in result["names"], result
    assert not errors, errors
    await context.close()


async def main():
    tests = [
        test_mcdonalds_breakfast_search_and_log,
        test_restaurant_shortcuts_and_chain_coverage,
        test_partial_nutrition_never_looks_like_verified_zero,
        test_location_label_and_normalized_alias_search,
    ]
    async with async_playwright() as playwright:
        launch_options = {
            "headless": True,
            "args": ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
        }
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
