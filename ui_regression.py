#!/usr/bin/env python3
"""Visual-system and mobile interaction regression checks for PhactoryFit v1.10."""
from __future__ import annotations

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from browser_security import INLINE_HTML


CHROMIUM_EXECUTABLE = "/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None

async def new_page(browser, *, width=390, height=844, reduced_motion='no-preference'):
    context = await browser.new_context(
        viewport={"width": width, "height": height},
        is_mobile=width <= 520,
        has_touch=width <= 520,
        device_scale_factor=2,
        reduced_motion=reduced_motion,
    )

    async def off_router(route):
        await route.fulfill(status=200, content_type="application/json", body='{"count":0,"products":[]}')

    await context.route("https://world.openfoodfacts.org/**", off_router)
    page = await context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    await page.set_content(INLINE_HTML, wait_until="domcontentloaded")
    await page.wait_for_selector("#app")
    return context, page, errors


async def seed_dashboard(page):
    await page.evaluate("""() => {
      const today = localDateKey();
      state.profile.name = 'Sean';
      state.profile.calorieGoal = 2300;
      state.profile.proteinGoal = 200;
      state.profile.carbGoal = 230;
      state.profile.fatGoal = 64;
      state.days[today] = {
        ...emptyDay(),
        foods:[{
          id:'ui-sample', logId:'ui-sample-log', name:'UI sample', brand:'', serving:'1 serving',
          meal:'Breakfast', quantity:1, calories:920, protein:22, carbs:156, fat:4,
          fiber:0, sugar:0, sodium:0
        }]
      };
      state.selectedDate = today;
      render();
    }""")
    await page.wait_for_timeout(750)


async def test_cosmic_dashboard_and_all_four_gauges(browser):
    context, page, errors = await new_page(browser)
    await seed_dashboard(page)
    result = await page.evaluate("""() => ({
      version:APP_VERSION,
      slogan:document.querySelector('.brand-slogan')?.textContent.trim(),
      studio:document.querySelector('.brand-studio')?.textContent.trim(),
      width:[document.documentElement.scrollWidth, document.documentElement.clientWidth],
      gauges:['calorieGauge','proteinGauge','carbGauge','fatGauge'].map(id => ({
        id,
        value:document.getElementById(id)?.style.getPropertyValue('--value'),
        angle:document.getElementById(id)?.style.getPropertyValue('--angle'),
        label:document.getElementById(id)?.getAttribute('aria-label')
      })),
      values:{
        calories:document.querySelector('#caloriesRemaining')?.textContent,
        protein:document.querySelector('#proteinRemaining')?.textContent,
        carbs:document.querySelector('#carbRemaining')?.textContent,
        fat:document.querySelector('#fatRemaining')?.textContent,
      },
      theme:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      motion:document.documentElement.classList.contains('motion-ready')
    })""")
    assert result["version"] == "1.10.0", result
    assert result["slogan"] == "Build better. Fuel smarter. Live stronger.", result
    assert result["studio"] == "Tech Phactory Solutions", result
    assert result["width"][0] == result["width"][1], result
    assert all(g["value"].endswith("%") and g["angle"].endswith("deg") for g in result["gauges"]), result
    assert result["values"] == {"calories":"1380 left","protein":"178g left","carbs":"74g left","fat":"60g left"}, result
    assert result["theme"] == "#020817", result
    assert result["motion"] is True, result
    assert not errors, errors
    await context.close()


async def test_navigation_and_hero_action(browser):
    context, page, errors = await new_page(browser)
    await page.click('#heroLogButton')
    assert await page.locator('#modal').evaluate('(el) => el.open') is True
    assert await page.locator('#modalTitle').inner_text() == 'Add food'
    await page.click('#modalClose')
    for view in ['diary','log','progress','coach','settings','today']:
        await page.click(f'[data-view-target="{view}"]')
        await page.wait_for_timeout(80)
        active = await page.locator(f'.view[data-view="{view}"]').evaluate("el => el.classList.contains('active') && getComputedStyle(el).display !== 'none'")
        assert active, view
        overflow = await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        assert overflow == 0, {"view":view,"overflow":overflow}
    assert not errors, errors
    await context.close()


async def test_scroll_reveal_and_reduced_motion(browser):
    context, page, errors = await new_page(browser)
    await seed_dashboard(page)
    await page.locator('.insight-card').scroll_into_view_if_needed()
    await page.wait_for_timeout(650)
    assert await page.locator('.insight-card').evaluate("el => el.classList.contains('is-visible')")
    assert not errors, errors
    await context.close()

    reduced_context, reduced_page, reduced_errors = await new_page(browser, reduced_motion='reduce')
    await reduced_page.wait_for_timeout(150)
    hidden = await reduced_page.evaluate("""() => [...document.querySelectorAll('.reveal-item')].filter(el => Number.parseFloat(getComputedStyle(el).opacity) < .99).length""")
    assert hidden == 0, hidden
    assert not reduced_errors, reduced_errors
    await reduced_context.close()


async def test_tablet_layout(browser):
    context, page, errors = await new_page(browser, width=768, height=1024)
    await seed_dashboard(page)
    metrics = await page.evaluate("""() => ({
      overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
      columns:getComputedStyle(document.querySelector('.macro-grid')).gridTemplateColumns.split(' ').length,
      navWidth:document.querySelector('.bottom-nav').getBoundingClientRect().width,
    })""")
    assert metrics["overflow"] == 0, metrics
    assert metrics["columns"] == 2, metrics
    assert metrics["navWidth"] <= 820, metrics
    assert not errors, errors
    await context.close()


async def test_diary_entry_edit_move_time_portion_and_delete(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate("""() => {
      const today = localDateKey();
      state.days[today] = {
        ...emptyDay(),
        foods:[{
          id:'editable-food', logId:'editable-log', name:'Editable meal', brand:'Test Kitchen',
          serving:'1 sandwich', meal:'Breakfast', quantity:1, loggedTime:'08:15',
          calories:320, protein:24, carbs:30, fat:12, fiber:2, sugar:4, sodium:500
        }]
      };
      state.selectedDate = today;
      render();
      navigate('diary');
    }""")
    await page.click('[data-edit-food="editable-log"]')
    assert await page.locator('#modalTitle').inner_text() == 'Edit entry'
    assert await page.locator('select[name="meal"]').input_value() == 'Breakfast'
    assert await page.locator('input[name="loggedTime"]').input_value() == '08:15'
    assert await page.locator('#editFoodQuantityInput').input_value() == '1'

    await page.select_option('select[name="meal"]', 'Dinner')
    await page.fill('input[name="loggedTime"]', '19:45')
    await page.fill('#editFoodQuantityInput', '1.5')
    await page.locator('#editFoodQuantityInput').dispatch_event('input')
    preview = await page.locator('#servingTotalPreview').inner_text()
    assert '480' in preview and '36' in preview, preview
    await page.click('#editDiaryFoodForm button[type="submit"]')

    result = await page.evaluate("""() => {
      const entry = getDay().foods.find(food => food.logId === 'editable-log');
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const savedEntry = saved.days[state.selectedDate].foods.find(food => food.logId === 'editable-log');
      return {
        entry:{meal:entry.meal,quantity:entry.quantity,loggedTime:entry.loggedTime},
        saved:{meal:savedEntry.meal,quantity:savedEntry.quantity,loggedTime:savedEntry.loggedTime},
        breakfast:document.querySelectorAll('.meal-section')[0].textContent,
        dinner:document.querySelectorAll('.meal-section')[2].textContent,
      };
    }""")
    expected = {'meal':'Dinner','quantity':1.5,'loggedTime':'19:45'}
    assert result['entry'] == expected, result
    assert result['saved'] == expected, result
    assert 'Editable meal' not in result['breakfast'], result
    assert 'Editable meal' in result['dinner'] and '7:45 PM' in result['dinner'] and '480 kcal' in result['dinner'], result
    overflow = await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow == 0, overflow

    await page.click('[data-edit-food="editable-log"]')
    await page.click('[data-delete-diary-food="editable-log"]')
    deleted = await page.evaluate("() => !getDay().foods.some(food => food.logId === 'editable-log')")
    assert deleted is True
    assert await page.locator('[data-edit-food="editable-log"]').count() == 0

    await page.evaluate("() => { openModal('food', {meal:'Lunch'}); showFoodQuantity(findFoodById('egg'), 'Lunch'); }")
    await page.fill('#foodQuantityInput', '2')
    await page.click('#addFoodForm button[type="submit"]')
    new_entry = await page.evaluate("() => getDay().foods.at(-1)")
    assert new_entry['meal'] == 'Lunch' and new_entry['quantity'] == 2, new_entry
    assert len(new_entry.get('loggedTime', '')) == 5 and new_entry['loggedTime'][2] == ':', new_entry
    assert not errors, errors
    await context.close()


async def main():
    tests = [
        test_cosmic_dashboard_and_all_four_gauges,
        test_navigation_and_hero_action,
        test_scroll_reveal_and_reduced_motion,
        test_tablet_layout,
        test_diary_entry_edit_move_time_portion_and_delete,
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
    print(f"PASSED {passed}/{len(tests)} UI regression tests")


if __name__ == "__main__":
    asyncio.run(main())
