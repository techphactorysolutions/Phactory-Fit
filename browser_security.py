#!/usr/bin/env python3
"""Browser security regression tests. Requires Playwright and Chromium.

The harness inlines first-party assets because this controlled environment blocks all
browser navigation. Production CSP and script-origin rules are verified separately by
security_static.py; these tests exercise runtime sanitization and defensive logic.
"""
from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]

MALICIOUS_PRODUCT = {
    "count": 1,
    "products": [{
        "code": "028400090896",
        "product_name": '<img id="xss-product" src=x onerror="window.__xss=1">',
        "brands": '</button><script>window.__xss=2</script>',
        "serving_size": "1 oz (28 g)",
        "serving_quantity": 28,
        "image_front_small_url": "https://evil.example/track.png",
        "nutriments": {
            "energy-kcal_100g": 536,
            "proteins_100g": 7.1,
            "carbohydrates_100g": 57.1,
            "fat_100g": 28.6,
            "sodium_100g": 0.607,
        },
    }],
}


def build_inline_html() -> str:
    html = (ROOT / "index.html").read_text()
    css = (ROOT / "styles.css").read_text()
    config = (ROOT / "config.js").read_text()
    zxing = (ROOT / "zxing-browser.min.js").read_text()
    app = (ROOT / "app.js").read_text()
    storage_shim = r"""
    <script>
      (() => {
        const data = new Map();
        const storage = {
          getItem:key => data.has(String(key)) ? data.get(String(key)) : null,
          setItem:(key,value) => data.set(String(key), String(value)),
          removeItem:key => data.delete(String(key)),
          clear:() => data.clear(),
          key:index => [...data.keys()][index] ?? null,
          get length(){ return data.size; }
        };
        try { Object.defineProperty(window, 'localStorage', {configurable:true, value:storage}); } catch {}
        try { Object.defineProperty(window, 'isSecureContext', {configurable:true, value:true}); } catch {}
      })();
    </script>
    """
    html = re.sub(r'\s*<meta http-equiv="Content-Security-Policy"[^>]+>', '', html, count=1)
    html = html.replace('</head>', storage_shim + '</head>')
    html = html.replace('<link rel="stylesheet" href="styles.css?v=1.7.0">', '<style>' + css + '</style>')
    html = html.replace('<script src="config.js?v=1.7.0" defer></script>', '<script>' + config + '</script>')
    html = html.replace('<script src="zxing-browser.min.js?v=1.7.0" defer></script>', '<script>' + zxing + '</script>')
    html = html.replace('<script src="app.js?v=1.7.0" defer></script>', '<script>' + app + '</script>')
    return html


INLINE_HTML = build_inline_html()


async def new_page(browser, *, malicious_search=False):
    context = await browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )
    observed = {"evil_requests": [], "search_queries": [], "off_requests": []}

    async def off_router(route):
        url = urlparse(route.request.url)
        observed["off_requests"].append(route.request.url)
        qs = parse_qs(url.query)
        query = (qs.get("search_terms") or qs.get("brands_tags") or [""])[0]
        observed["search_queries"].append(query)
        body = MALICIOUS_PRODUCT if malicious_search else {"count": 0, "products": []}
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(body))

    async def evil_router(route):
        observed["evil_requests"].append(route.request.url)
        await route.abort()

    await context.route("https://world.openfoodfacts.org/**", off_router)
    await context.route("https://evil.example/**", evil_router)
    page = await context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    await page.set_content(INLINE_HTML, wait_until="domcontentloaded")
    await page.wait_for_selector("#app")
    return context, page, observed, errors


async def test_imported_xss_is_rendered_as_text(browser):
    context, page, observed, errors = await new_page(browser)
    payload = '<img id="xss-import" src=x onerror="window.__importXss=1"><script>window.__importXss=2</script>'
    result = await page.evaluate("""async ({payload}) => {
      window.__importXss = 0;
      const today = localDateKey();
      const backup = defaultState();
      backup.profile.name = payload;
      backup.days[today].foods.push({
        id:'evil', logId:'evil-log', name:payload, brand:payload, serving:'1', meal:'Breakfast',
        quantity:1, calories:10, protein:1, carbs:1, fat:1, imageUrl:'javascript:alert(1)'
      });
      const file = new File([JSON.stringify(backup)], 'backup.json', {type:'application/json'});
      await importData(file);
      navigate('diary');
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        xss: window.__importXss,
        injectedNode: Boolean(document.querySelector('#xss-import')),
        textVisible: document.body.textContent.includes('<img id="xss-import"'),
        unsafeImage: document.querySelectorAll('img[src^="javascript:"]').length,
      };
    }""", {"payload": payload})
    assert result == {"xss": 0, "injectedNode": False, "textVisible": True, "unsafeImage": 0}, result
    assert not observed["evil_requests"], observed
    assert not errors, errors
    await context.close()


async def test_malicious_api_fields_do_not_execute_or_track(browser):
    context, page, observed, errors = await new_page(browser, malicious_search=True)
    await page.evaluate("window.__xss = 0")
    await page.click("[data-view-target='log']")
    await page.click("[data-modal='food']")
    await page.fill("#foodSearch", "Doritos")
    await page.wait_for_selector(".online-food-result", timeout=10000)
    result = await page.evaluate("""({
      xss: window.__xss,
      injectedNode: Boolean(document.querySelector('#xss-product')),
      visibleEscapedText: document.querySelector('#foodResults').textContent.includes('<img id="xss-product"'),
      remoteImages: [...document.images].map(img => img.src).filter(src => src.includes('evil.example'))
    })""")
    assert result["xss"] == 0, result
    assert result["injectedNode"] is False, result
    assert result["visibleEscapedText"] is True, result
    assert result["remoteImages"] == [], result
    assert not observed["evil_requests"], observed
    assert not errors, errors
    await context.close()


async def test_url_allowlists_and_bounded_json(browser):
    context, page, observed, errors = await new_page(browser)
    result = await page.evaluate("""async () => {
      const unsafeApi = safeApiUrl('https://evil.example/steal');
      const credentialApi = safeApiUrl('https://user:pass@world.openfoodfacts.org/api');
      const allowedApi = safeApiUrl('https://world.openfoodfacts.org/api/v2/product/123');
      const unsafeImage = sanitizeImageUrl('https://evil.example/pixel.png');
      const allowedImage = sanitizeImageUrl('https://images.openfoodfacts.org/images/a.png');
      let bounded = false;
      try {
        await readBoundedJson(new Response(JSON.stringify({x:'a'.repeat(100)}), {headers:{'content-length':'101'}}), 16);
      } catch (error) { bounded = /size limit/.test(String(error.message)); }
      let fetchRejected = false;
      try { await fetchWithTimeout('https://evil.example/steal', 100); }
      catch (error) { fetchRejected = true; }
      return {
        unsafeApi: unsafeApi === null,
        credentialApi: credentialApi === null,
        allowedApi: allowedApi?.origin,
        unsafeImage,
        allowedImage,
        bounded,
        fetchRejected,
      };
    }""")
    assert result["unsafeApi"] and result["credentialApi"] and result["fetchRejected"], result
    assert result["allowedApi"] == "https://world.openfoodfacts.org", result
    assert result["unsafeImage"] == "", result
    assert result["allowedImage"].startswith("https://images.openfoodfacts.org/"), result
    assert result["bounded"], result
    assert not observed["evil_requests"], observed
    assert not errors, errors
    await context.close()


async def test_query_and_import_limits(browser):
    context, page, observed, errors = await new_page(browser)
    await page.evaluate("fetchOnlineFoodSearch('A'.repeat(500)).catch(() => [])")
    await page.wait_for_timeout(250)
    assert observed["search_queries"], observed
    assert max(len(value) for value in observed["search_queries"]) <= 120, observed["search_queries"]
    result = await page.evaluate("""async () => {
      const before = JSON.stringify(state);
      const huge = new File([new Uint8Array(MAX_BACKUP_BYTES + 1)], 'too-large.json', {type:'application/json'});
      await importData(huge);
      const prototypePayload = JSON.parse('{"profile":{"name":"Athlete"},"days":{},"__proto__":{"polluted":true}}');
      const normalized = normalizeState(prototypePayload);
      return {
        unchanged: JSON.stringify(state) === before,
        polluted: ({}).polluted === true,
        normalizedPrototype: Object.prototype.hasOwnProperty.call(normalized, 'polluted')
      };
    }""")
    assert result == {"unchanged": True, "polluted": False, "normalizedPrototype": False}, result
    assert not errors, errors
    await context.close()


async def test_frame_guard(browser):
    # Run the production guard in a child frame. The rest of app.js should never execute.
    context = await browser.new_context()
    page = await context.new_page()
    app = (ROOT / "app.js").read_text().replace("</script>", "<\\/script>")
    child = f"<!doctype html><body><script>{app}</script></body>"
    await page.set_content("<!doctype html><iframe id='victim'></iframe>")
    frame = page.frames[1]
    await frame.set_content(child)
    await page.wait_for_timeout(200)
    text = await frame.locator("body").inner_text()
    assert "cannot run inside an embedded frame" in text, text
    await context.close()


async def main():
    tests = [
        test_imported_xss_is_rendered_as_text,
        test_malicious_api_fields_do_not_execute_or_track,
        test_url_allowlists_and_bounded_json,
        test_query_and_import_limits,
        test_frame_guard,
    ]
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path="/usr/bin/chromium",
            args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
        )
        passed = 0
        for test in tests:
            try:
                await test(browser)
                passed += 1
                print(f"PASS {test.__name__}")
            except Exception as exc:
                print(f"FAIL {test.__name__}: {type(exc).__name__}: {exc}")
                raise
        await browser.close()
    print(f"PASSED {passed}/{len(tests)} browser security tests")


if __name__ == "__main__":
    asyncio.run(main())
