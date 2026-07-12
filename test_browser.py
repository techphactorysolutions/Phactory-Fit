import asyncio
import base64
import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://phactoryfit.test'
BARCODE_PATH = Path(__file__).resolve().parent / 'fixtures' / 'ean13-test.png'
BARCODE_DATA_URL = 'data:image/png;base64,' + base64.b64encode(BARCODE_PATH.read_bytes()).decode()
PRODUCT = {
    'status': 1,
    'product': {
        'product_name': 'Nutella test',
        'brands': 'Ferrero',
        'serving_size': '2 tbsp (37 g)',
        'serving_quantity': 37,
        'nutriments': {
            'energy-kcal_100g': 539,
            'proteins_100g': 6.3,
            'carbohydrates_100g': 57.5,
            'fat_100g': 30.9,
            'saturated-fat_100g': 10.6,
            'trans-fat_100g': 0.1,
            'cholesterol_100g': 0.012,
            'fiber_100g': 0,
            'sugars_100g': 56.3,
            'sodium_100g': 0.042,
        },
    },
}

SEARCH_RESPONSE = {
    'count': 2,
    'page': 1,
    'page_size': 24,
    'products': [
        {
            'code': '028400090896',
            'product_name': 'Nacho Cheese Flavored Tortilla Chips',
            'brands': 'Doritos',
            'serving_size': '1 oz (28 g)',
            'serving_quantity': 28,
            'nutriments': {
                'energy-kcal_100g': 536,
                'proteins_100g': 7.1,
                'carbohydrates_100g': 57.1,
                'fat_100g': 28.6,
                'saturated-fat_100g': 3.6,
                'fiber_100g': 3.6,
                'sugars_100g': 3.6,
                'sodium_100g': 0.607,
            },
        },
        {
            'code': '012000001017',
            'product_name': 'Pepsi Cola',
            'brands': 'Pepsi',
            'serving_size': '1 can (355 ml)',
            'serving_quantity': 355,
            'nutriments': {
                'energy-kcal_serving': 150,
                'proteins_serving': 0,
                'carbohydrates_serving': 41,
                'fat_serving': 0,
                'sugars_serving': 41,
                'sodium_serving': 0.03,
            },
        },
    ],
}



def build_inline_html() -> str:
    import re
    html = (ROOT / 'index.html').read_text()
    css = (ROOT / 'styles.css').read_text()
    config = (ROOT / 'config.js').read_text()
    zxing = (ROOT / 'vendor/zxing-browser.min.js').read_text()
    app = (ROOT / 'app.js').read_text()
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
    html = html.replace('</head>', storage_shim + '</head>')
    html = html.replace('<link rel="stylesheet" href="styles.css?v=1.6.0">', '<style>' + css + '</style>')
    html = html.replace('<script src="config.js?v=1.6.0"></script>', '<script>' + config + '</script>')
    html = html.replace('<script src="vendor/zxing-browser.min.js?v=1.6.0"></script>', '<script>' + zxing + '</script>')
    html = html.replace('<script src="app.js?v=1.6.0" defer></script>', '<script>' + app + '</script>')
    return html

INLINE_HTML = build_inline_html()

async def install_product_route(context, product_mode='found', product_counter=None):
    async def off_route(route):
        if product_counter is not None:
            product_counter['count'] += 1
        if product_mode == 'found':
            await route.fulfill(status=200, content_type='application/json', body=json.dumps(PRODUCT))
        elif product_mode == 'missing':
            await route.fulfill(status=200, content_type='application/json', body=json.dumps({'status': 0, 'status_verbose': 'product not found'}))
        else:
            await route.fulfill(status=503, content_type='application/json', body=json.dumps({'error':'offline'}))
    await context.route('https://world.openfoodfacts.org/api/v2/product/**', off_route)

    async def search_route(route):
        await route.fulfill(status=200, content_type='application/json', body=json.dumps(SEARCH_RESPONSE))
    await context.route('https://world.openfoodfacts.org/cgi/search.pl?**', search_route)
    await context.route('https://world.openfoodfacts.org/api/v2/search?**', search_route)

    async def image_route(route):
        await route.fulfill(status=404, body='')
    await context.route('https://images.openfoodfacts.org/**', image_route)

async def new_page(browser, product_mode='found', product_counter=None):
    context = await browser.new_context(
        viewport={'width': 390, 'height': 844},
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )
    await install_product_route(context, product_mode, product_counter)
    page = await context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(f'pageerror: {error}'))
    page.on('console', lambda msg: errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
    await page.set_content(INLINE_HTML, wait_until='domcontentloaded')
    await page.wait_for_function('document.readyState === "interactive" || document.readyState === "complete"')
    return context, page, errors


async def open_barcode(page):
    await page.click('[data-view-target="log"]')
    await page.click('[data-modal="barcode"]')
    await page.wait_for_selector('#barcodeInput')


async def test_load_and_layout(browser):
    context, page, errors = await new_page(browser)
    assert await page.title() == 'PhactoryFit'
    overflow = await page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    assert overflow <= 1, overflow
    assert not errors, errors
    await context.close()


async def test_manual_lookup_serving_math_and_local_cache(browser):
    counter = {'count': 0}
    context, page, errors = await new_page(browser, product_counter=counter)
    await open_barcode(page)
    await page.fill('#barcodeInput', '3017624010701')
    await page.press('#barcodeInput', 'Enter')
    await page.wait_for_selector('#addBarcodeFood')
    text = await page.locator('#barcodeResult').inner_text()
    assert 'Nutrition Facts' in text, text
    assert 'Calories\n199' in text or 'Calories 199' in text, text
    assert 'Protein\n2.3g' in text or 'Protein 2.3g' in text, text
    assert 'Saturated Fat' in text and '3.9g' in text, text
    assert 'Cholesterol' in text and '4mg' in text, text
    assert counter['count'] == 1, counter
    await page.click('#addBarcodeFood')
    await page.click('[data-view-target="diary"]')
    assert 'Nutella test' in await page.locator('[data-view="diary"]').inner_text()

    await open_barcode(page)
    await page.fill('#barcodeInput', '3017624010701')
    await page.click('#lookupBarcode')
    await page.wait_for_selector('#addBarcodeFood')
    assert counter['count'] == 1, 'Local remembered product unexpectedly triggered another network lookup'
    assert not errors, errors
    await context.close()


async def test_real_photo_decode(browser):
    context, page, errors = await new_page(browser)
    await open_barcode(page)
    await page.set_input_files('#barcodePhotoInput', str(BARCODE_PATH))
    await page.wait_for_selector('#addBarcodeFood', timeout=20000)
    assert await page.input_value('#barcodeInput') == '3017624010701'
    assert 'Nutella test' in await page.locator('#barcodeResult').inner_text()
    assert not errors, errors
    await context.close()


async def install_canvas_camera(page, initially_blank=True, delayed=False):
    return await page.evaluate(
        '''async ({src, initiallyBlank, delayed}) => {
          const canvas = document.createElement('canvas');
          canvas.width = 1280; canvas.height = 720;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          const image = new Image(); image.src = src; await image.decode();
          const draw = () => { ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,200,220,880,260); };
          if (!initiallyBlank) draw();
          document.body.appendChild(canvas); canvas.hidden = true;
          let tick = 0;
          setInterval(() => { tick += 1; ctx.fillStyle = tick % 2 ? '#fff' : '#fefefe'; ctx.fillRect(0,0,2,2); }, 50);
          let stream = null;
          let stopCount = 0;
          let calls = 0;
          const makeStream = () => {
            stream = canvas.captureStream(30);
            const track = stream.getVideoTracks()[0];
            const originalStop = track.stop.bind(track);
            track.stop = () => { stopCount += 1; originalStop(); };
            track.getCapabilities = () => ({focusMode:['continuous'],zoom:{min:1,max:3},torch:true});
            track.getSettings = () => ({deviceId:'rear-1',width:1280,height:720});
            track.applyConstraints = async constraints => { window.__lastCameraConstraints = constraints; };
            return stream;
          };
          const getUserMedia = async () => {
            calls += 1;
            if (delayed) await new Promise(resolve => setTimeout(resolve, 400));
            return makeStream();
          };
          Object.defineProperty(navigator, 'mediaDevices', {configurable:true, value:{
            getUserMedia,
            enumerateDevices:async () => [
              {kind:'videoinput',deviceId:'rear-1',label:'Back Camera'},
              {kind:'videoinput',deviceId:'front-1',label:'Front Camera'}
            ]
          }});
          window.__drawBarcode = draw;
          window.__cameraStats = () => ({stopCount,calls,trackState:stream?.getVideoTracks?.()[0]?.readyState || 'none'});
          return true;
        }''',
        {'src': BARCODE_DATA_URL, 'initiallyBlank': initially_blank, 'delayed': delayed},
    )


async def test_live_camera_decode_torch_and_switch_ui(browser):
    context, page, errors = await new_page(browser)
    await install_canvas_camera(page, initially_blank=True)
    await open_barcode(page)
    await page.click('#cameraBarcode')
    await page.wait_for_function("document.querySelector('#barcodeResult')?.textContent.includes('Scanning')", timeout=10000)
    assert await page.locator('#barcodeTorch').is_visible()
    assert await page.locator('#barcodeSwitchCamera').is_visible()
    await page.click('#barcodeTorch')
    assert await page.locator('#barcodeTorch').get_attribute('aria-pressed') == 'true'
    await page.evaluate('window.__drawBarcode()')
    await page.wait_for_selector('#addBarcodeFood', timeout=20000)
    assert await page.input_value('#barcodeInput') == '3017624010701'
    assert 'Nutella test' in await page.locator('#barcodeResult').inner_text()
    assert not errors, errors
    await context.close()


async def test_permission_error(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate('''Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{throw new DOMException('Denied','NotAllowedError')},enumerateDevices:async()=>[]}})''')
    await open_barcode(page)
    await page.click('#cameraBarcode')
    await page.wait_for_function("document.querySelector('#barcodeResult')?.textContent.includes('permission is blocked')")
    assert 'permission is blocked' in (await page.locator('#barcodeResult').inner_text()).lower()
    assert not errors, errors
    await context.close()


async def test_close_during_camera_request_stops_late_stream(browser):
    context, page, errors = await new_page(browser)
    await install_canvas_camera(page, initially_blank=True, delayed=True)
    await open_barcode(page)
    await page.click('#cameraBarcode')
    await page.click('#modalClose')
    await page.wait_for_timeout(4200)
    stats = await page.evaluate('window.__cameraStats()')
    assert stats['stopCount'] >= 1, stats
    assert stats['trackState'] == 'ended', stats
    assert not errors, errors
    await context.close()


async def test_missing_and_offline_product_fallback(browser):
    context, page, errors = await new_page(browser, product_mode='missing')
    await open_barcode(page)
    await page.fill('#barcodeInput', '3017624010701')
    await page.click('#lookupBarcode')
    await page.wait_for_selector('#teachBarcodeFood')
    assert 'not in the food database' in (await page.locator('#barcodeResult').inner_text()).lower()
    assert not errors, errors
    await context.close()

    context, page, errors = await new_page(browser, product_mode='offline')
    await open_barcode(page)
    await page.fill('#barcodeInput', '3017624010701')
    await page.click('#lookupBarcode')
    await page.wait_for_selector('#teachBarcodeFood')
    assert 'could not be reached' in (await page.locator('#barcodeResult').inner_text()).lower()
    # Chromium reports the intentionally simulated 503 as a resource error.
    assert all('503 (Service Unavailable)' in item for item in errors), errors
    await context.close()


async def test_correct_generated_nutrition(browser):
    context, page, errors = await new_page(browser)
    await open_barcode(page)
    await page.fill('#barcodeInput', '3017624010701')
    await page.click('#lookupBarcode')
    await page.wait_for_selector('#editBarcodeNutrition')
    await page.click('#editBarcodeNutrition')
    await page.wait_for_selector('#customFoodForm')
    assert await page.input_value('#customFoodForm input[name="name"]') == 'Nutella test'
    assert await page.input_value('#customFoodForm input[name="calories"]') == '199.43'
    await page.fill('#customFoodForm input[name="calories"]', '210')
    await page.click('#customFoodForm button[type="submit"]')
    await page.wait_for_selector('#addFoodForm')
    text = await page.locator('#modalContent').inner_text()
    assert 'Calories' in text and '210' in text, text
    assert not errors, errors
    await context.close()


async def test_online_brand_search_servings_and_diary(browser):
    context, page, errors = await new_page(browser)
    await page.click('[data-view-target="log"]')
    await page.click('[data-modal="food"]')
    await page.fill('#foodSearch', 'Doritos')
    await page.wait_for_selector('.online-food-result', timeout=10000)
    results_text = await page.locator('#foodResults').inner_text()
    assert 'Doritos' in results_text, results_text
    assert 'Nacho Cheese Flavored Tortilla Chips' in results_text, results_text
    await page.locator('.online-food-result').first.click()
    await page.wait_for_selector('#addFoodForm')
    details = await page.locator('#modalContent').inner_text()
    assert 'Nutrition Facts' in details, details
    assert 'Serving size' in details and '1 oz (28 g)' in details, details
    assert 'Calories' in details and '150' in details, details
    await page.fill('#foodQuantityInput', '2')
    preview = await page.locator('#servingTotalPreview').inner_text()
    assert '300' in preview, preview
    await page.click('#addFoodForm button[type="submit"]')
    await page.click('[data-view-target="diary"]')
    diary = await page.locator('[data-view="diary"]').inner_text()
    assert 'Nacho Cheese Flavored Tortilla Chips' in diary, diary
    assert not errors, errors
    await context.close()


async def test_short_visibility_change_does_not_close_camera(browser):
    context, page, errors = await new_page(browser)
    await install_canvas_camera(page, initially_blank=True)
    await open_barcode(page)
    await page.click('#cameraBarcode')
    await page.wait_for_function("document.querySelector('#barcodeResult')?.textContent.includes('Scanning')", timeout=10000)
    await page.evaluate("""
      Object.defineProperty(document, 'hidden', {configurable:true, value:true});
      document.dispatchEvent(new Event('visibilitychange'));
    """)
    await page.wait_for_timeout(900)
    stats = await page.evaluate('window.__cameraStats()')
    assert stats['trackState'] == 'live', stats
    assert await page.locator('#barcodeCameraShell').is_visible()
    await page.evaluate("""
      Object.defineProperty(document, 'hidden', {configurable:true, value:false});
      document.dispatchEvent(new Event('visibilitychange'));
    """)
    await page.click('#barcodeStopCamera')
    await page.wait_for_timeout(100)
    stats = await page.evaluate('window.__cameraStats()')
    assert stats['trackState'] == 'ended', stats
    assert not errors, errors
    await context.close()


async def test_camera_preview_play_recovery_keeps_stream(browser):
    context, page, errors = await new_page(browser)
    await install_canvas_camera(page, initially_blank=True)
    await page.evaluate("""
      const originalPlay = HTMLMediaElement.prototype.play;
      let barcodePlayCalls = 0;
      HTMLMediaElement.prototype.play = function() {
        if (this.id === 'barcodeVideo' && barcodePlayCalls++ === 0) {
          return Promise.reject(new DOMException('User gesture required', 'NotAllowedError'));
        }
        if (!(this instanceof HTMLMediaElement)) return Promise.resolve();
        return Reflect.apply(originalPlay, this, []);
      };
    """)
    await open_barcode(page)
    await page.click('#cameraBarcode')
    await page.wait_for_selector('#resumeBarcodePreview:not([hidden])', timeout=10000)
    stats = await page.evaluate('window.__cameraStats()')
    assert stats['trackState'] == 'live', stats
    await page.click('#resumeBarcodePreview')
    await page.wait_for_function("document.querySelector('#barcodeResult')?.textContent.includes('Scanning')", timeout=10000)
    stats = await page.evaluate('window.__cameraStats()')
    assert stats['trackState'] == 'live', stats
    await page.click('#barcodeStopCamera')
    assert not errors, errors
    await context.close()


async def test_voice_search_reaches_packaged_foods(browser):
    context, page, errors = await new_page(browser)
    await page.evaluate("""
      (() => {
        class MockRecognition {
          start() {
            setTimeout(() => {
              this.onresult?.({results:[[{transcript:'Doritos'}]]});
              this.onend?.();
            }, 10);
          }
        }
        window.SpeechRecognition = MockRecognition;
      })()
    """)
    await page.click('[data-view-target="diary"]')
    await page.click('#voiceLogButton')
    await page.wait_for_selector('#foodSearch')
    await page.wait_for_function("document.querySelector('#foodSearch')?.value === 'Doritos'")
    await page.wait_for_selector('.online-food-result', timeout=10000)
    text = await page.locator('#foodResults').inner_text()
    assert 'Doritos' in text and 'Packaged foods' in text, text
    assert not errors, errors
    await context.close()


async def test_nutrition_math_units_and_incomplete_rejection(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""
      (() => {
        const product = {
          product_name:'Unit test chips', brands:'Test',
          serving_size:'1 oz (28 g)', serving_quantity:1, serving_quantity_unit:'serving',
          nutriments:{
            'energy-kcal_100g':500,
            'proteins_100g':10,
            'carbohydrates_100g':50,
            'fat_100g':20,
            'sodium_100g':500,
            'sodium_unit':'mg',
            'cholesterol_100g':20,
            'cholesterol_unit':'mg'
          }
        };
        const normalized = normalizeOpenFoodFactsProduct(product, '12345678');
        const incomplete = normalizeOpenFoodFactsProduct({
          product_name:'Incomplete',
          nutriments:{'energy-kcal_100g':100,'proteins_100g':2,'carbohydrates_100g':10}
        }, '87654321');
        const kjOnly = normalizeOpenFoodFactsProduct({
          product_name:'Kilojoule item', serving_size:'100 g',
          nutriments:{'energy-kj_100g':418.4,'proteins_100g':2,'carbohydrates_100g':10,'fat_100g':1}
        }, '11111111');
        return {normalized,incomplete,kjOnly};
      })()
    """)
    food = result['normalized']
    assert round(food['calories'], 2) == 140
    assert round(food['protein'], 2) == 2.8
    assert round(food['sodium'], 2) == 140
    assert round(food['cholesterol'], 2) == 5.6
    assert result['incomplete'] is None
    assert round(result['kjOnly']['calories'], 2) == 100
    assert not errors, errors
    await context.close()


async def test_import_normalization_filters_future_and_duplicates(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""
      (() => {
        const today = localDateKey();
        const past = new Date(); past.setDate(past.getDate() - 3);
        const future = new Date(); future.setDate(future.getDate() + 10);
        const raw = {
          profile:{name:'Test',currentWeight:999,goalWeight:175,calorieGoal:2300,proteinGoal:200,carbGoal:230,fatGoal:77,weeklyGoal:-1},
          days:{[today]:emptyDay()},
          weights:[
            {date:localDateKey(past),weight:205},
            {date:today,weight:202},
            {date:localDateKey(future),weight:100}
          ],
          customFoods:[
            {id:'same',name:'One',serving:'1',calories:1,protein:1,carbs:1,fat:1,barcode:'12345678'},
            {id:'same',name:'Duplicate ID',serving:'1',calories:2,protein:2,carbs:2,fat:2,barcode:'87654321'},
            {id:'other',name:'Duplicate barcode',serving:'1',calories:3,protein:3,carbs:3,fat:3,barcode:'12345678'},
            {id:'unsafe-image',name:'Safe image test',serving:'1',calories:1,protein:1,carbs:1,fat:1,imageUrl:'javascript:alert(1)'}
          ]
        };
        return normalizeState(raw);
      })()
    """)
    assert len(result['weights']) == 2, result['weights']
    assert result['profile']['currentWeight'] == 202
    assert len(result['customFoods']) == 2, result['customFoods']
    unsafe = next(food for food in result['customFoods'] if food['id'] == 'unsafe-image')
    assert unsafe['imageUrl'] == ''
    assert not errors, errors
    await context.close()


async def test_chart_uses_real_date_spacing_and_accessible_summary(browser):
    context, page, errors = await new_page(browser)
    result = await page.evaluate("""
      (() => {
        const canvas = document.querySelector('#weightChart');
        Object.defineProperty(canvas, 'clientWidth', {configurable:true,value:400});
        const arcs = [];
        const context = {
          setTransform(){},clearRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},
          arc(x,y){arcs.push([x,y]);},
          set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set lineJoin(v){},set font(v){},set textAlign(v){}
        };
        canvas.getContext = () => context;
        renderWeightChart([
          {date:'2026-01-01',weight:200},
          {date:'2026-01-02',weight:199.8},
          {date:'2026-01-11',weight:198}
        ]);
        return {arcs,label:canvas.getAttribute('aria-label')};
      })()
    """)
    assert len(result['arcs']) == 3, result
    assert result['arcs'][1][0] < 120, result['arcs']
    assert '3 weigh-ins' in result['label'], result['label']
    assert not errors, errors
    await context.close()


async def test_adherence_uses_completed_days(browser):
    context, page, errors = await new_page(browser)
    value = await page.evaluate("""
      (() => {
        state.profile.calorieGoal = 2000;
        state.days = {[localDateKey()]:emptyDay()};
        for (let index = 1; index <= 7; index += 1) {
          const date = new Date(); date.setDate(date.getDate() - index);
          state.days[localDateKey(date)] = {...emptyDay(), foods:[{
            id:`food-${index}`,logId:`log-${index}`,name:'Complete day',brand:'Test',serving:'1',meal:'Dinner',quantity:1,
            calories:1600,protein:200,carbs:100,fat:50,fiber:0,sugar:0,sodium:0
          }]};
        }
        return diaryAdherence(7);
      })()
    """)
    assert value == 1, value
    assert not errors, errors
    await context.close()


async def test_cumulative_values_are_clamped(browser):
    context, page, errors = await new_page(browser)
    values = await page.evaluate("""
      (() => {
        const day = getDay();
        day.water = 1000;
        day.workoutMinutes = 1400;
        day.exerciseCalories = 19900;
        return true;
      })()
    """)
    await page.click('#waterHabit')
    await page.click('[data-view-target="log"]')
    await page.click('[data-modal="workout"]')
    await page.fill('input[name="minutes"]', '100')
    await page.fill('input[name="calories"]', '500')
    await page.click('#workoutForm button[type="submit"]')
    state_values = await page.evaluate("({water:getDay().water,minutes:getDay().workoutMinutes,calories:getDay().exerciseCalories})")
    assert state_values == {'water':1000,'minutes':1440,'calories':20000}, state_values
    assert not errors, errors
    await context.close()


async def main():
    tests = [
        test_load_and_layout,
        test_manual_lookup_serving_math_and_local_cache,
        test_real_photo_decode,
        test_live_camera_decode_torch_and_switch_ui,
        test_permission_error,
        test_close_during_camera_request_stops_late_stream,
        test_missing_and_offline_product_fallback,
        test_correct_generated_nutrition,
        test_online_brand_search_servings_and_diary,
        test_short_visibility_change_does_not_close_camera,
        test_camera_preview_play_recovery_keeps_stream,
        test_voice_search_reaches_packaged_foods,
        test_nutrition_math_units_and_incomplete_rejection,
        test_import_normalization_filters_future_and_duplicates,
        test_chart_uses_real_date_spacing_and_accessible_summary,
        test_adherence_uses_completed_days,
        test_cumulative_values_are_clamped,
    ]
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
        )
        passed = 0
        for test in tests:
            try:
                await test(browser)
                passed += 1
                print(f'PASS {test.__name__}')
            except Exception as exc:
                print(f'FAIL {test.__name__}: {type(exc).__name__}: {exc}')
                raise
        await browser.close()
        print(f'PASSED {passed}/{len(tests)} browser and calculation tests')


if __name__ == '__main__':
    asyncio.run(main())
