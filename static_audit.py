from pathlib import Path
from PIL import Image
from bs4 import BeautifulSoup
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
checks = []

def check(name, condition, detail=''):
    checks.append((name, bool(condition), detail))

for filename in ['app.js', 'service-worker.js', 'config.js']:
    result = subprocess.run(['node', '--check', str(ROOT / filename)], capture_output=True, text=True)
    check(f'{filename} JavaScript syntax', result.returncode == 0, result.stderr.strip())

required = [
    'index.html', 'styles.css', 'app.js', 'config.js', 'service-worker.js',
    'manifest.webmanifest', 'apple-touch-icon.png', 'vendor/zxing-browser.min.js',
    'vendor/ZXING_LICENSE.txt'
]
for filename in required:
    check(f'{filename} exists', (ROOT / filename).is_file())

try:
    manifest = json.loads((ROOT / 'manifest.webmanifest').read_text())
    check('manifest JSON parses', True)
except Exception as error:
    manifest = {}
    check('manifest JSON parses', False, str(error))

check('manifest standalone display', manifest.get('display') == 'standalone')
check('manifest start URL', manifest.get('start_url') == './')
check('manifest scope', manifest.get('scope') == './')
icons = manifest.get('icons', [])
check('manifest standard 192 icon', any(icon.get('sizes') == '192x192' and 'any' in icon.get('purpose', 'any') for icon in icons))
check('manifest standard 512 icon', any(icon.get('sizes') == '512x512' and 'any' in icon.get('purpose', 'any') for icon in icons))
check('manifest maskable icons', sum('maskable' in icon.get('purpose', '') for icon in icons) >= 2)

expected_images = {
    'apple-touch-icon.png': (180, 180),
    'assets/apple-touch-icon-180.png': (180, 180),
    'assets/favicon-32.png': (32, 32),
    'assets/icon-192.png': (192, 192),
    'assets/icon-512.png': (512, 512),
    'assets/icon-maskable-192.png': (192, 192),
    'assets/icon-maskable-512.png': (512, 512),
}
for relative, expected in expected_images.items():
    try:
        actual = Image.open(ROOT / relative).size
    except Exception:
        actual = None
    check(f'{relative} dimensions', actual == expected, f'{actual} expected {expected}')

html = (ROOT / 'index.html').read_text()
app = (ROOT / 'app.js').read_text()
css = (ROOT / 'styles.css').read_text()
sw = (ROOT / 'service-worker.js').read_text()
config = (ROOT / 'config.js').read_text()
vendor = (ROOT / 'vendor/zxing-browser.min.js').read_text(errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
ids = [node.get('id') for node in soup.find_all(attrs={'id': True})]
check('HTML has no duplicate static IDs', len(ids) == len(set(ids)))
check('document language declared', soup.html and soup.html.get('lang') == 'en')
check('viewport permits accessibility zoom', 'user-scalable=no' not in (soup.find('meta', attrs={'name': 'viewport'}) or {}).get('content', ''))
check('app versioned JS reference', 'app.js?v=1.6.0' in html)
check('scanner versioned reference', 'zxing-browser.min.js?v=1.6.0' in html)
check('styles versioned reference', 'styles.css?v=1.6.0' in html)
check('Apple touch icon declared', 'rel="apple-touch-icon"' in html)

check('service-worker cache version', "phactoryfit-v1.6.0" in sw)
asset_refs = re.findall(r"'\./([^']+)'", sw)
for asset_ref in asset_refs:
    clean = asset_ref.split('?')[0]
    if clean:
        check(f'service-worker asset {clean}', (ROOT / clean).exists())
check('service-worker navigation fallback', "event.request.mode === 'navigate'" in sw and 'OFFLINE_PAGE' in sw)
check('service-worker removes old caches', 'caches.delete' in sw)

check('online keyword search endpoint', 'cgi/search.pl?search_terms=' in app)
check('structured brand fallback', 'api/v2/search?brands_tags=' in app)
check('food-search debounce', 'scheduleOnlineFoodSearch' in app and '550' in app)
check('voice logging triggers online search', 'scheduleOnlineFoodSearch(text)' in app)
check('core macro completeness guard', 'productHasNutrition(product)' in app and 'productNutrientExists' in app)
check('kilojoule-to-kcal conversion', "kjServing / 4.184" in app and "kj100 * factor / 4.184" in app)
check('ounce and metric serving parsing', '28.349523125' in app and 'matchAll' in app)
check('unit-aware milligram conversion', 'productNutrientMilligramsForServing' in app)
check('future weigh-ins filtered on import', 'entry.date > today' in app)
check('duplicate saved-food normalization', 'seenFoodIds' in app and 'seenFoodBarcodes' in app)
check('unsafe image schemes rejected', "url.protocol === 'https:'" in app)
check('daily entry cap', 'MAX_LOG_ENTRIES_PER_DAY' in app)
check('cumulative workout values clamped', 'clamp(day.workoutMinutes + minutes' in app)
check('real-date chart spacing', 'dateSpan' in app and 'const x = entry =>' in app)
check('chart accessibility summary', "canvas.setAttribute('aria-label'" in app)
check('completed-day adherence logic', 'for (let index = 1; index <= daysBack' in app)

check('live camera uses getUserMedia', 'getUserMedia' in app)
check('iPhone inline-video attributes', 'webkit-playsinline' in app and 'video.playsInline = true' in app)
check('Safari preview recovery', 'resumeBarcodePreview' in app and 'Start preview' in app)
check('visibility changes do not auto-stop stream', 'if (document.hidden && activeMediaStream)' not in app)
check('hidden camera decoding pauses', 'if (document.hidden)' in app and 'activeBarcodeLoop = setTimeout(resolve, 250)' in app)
check('pagehide camera cleanup', "pagehide', stopBarcodeCamera" in app)
check('camera track cleanup', 'activeMediaStream?.getTracks?.().forEach' in app)
check('center crop decoder', 'drawBarcodeRegion' in app)
check('stable scan confirmation', 'registerBarcodeCandidate' in app)
check('photo multi-attempt decoder', 'barcodePhotoCanvas' in app and 'attempts = [' in app)
check('ZXing 1D reader bundled', 'BrowserMultiFormatOneDReader' in vendor)
check('ZXing license included', (ROOT / 'vendor/ZXING_LICENSE.txt').stat().st_size > 500)

check('iOS input anti-zoom sizing', '.modal-shell input,.modal-shell select,.settings-form input{font-size:16px}' in css)
check('keyboard focus styling', ':focus-visible' in css)
check('reduced-motion support', 'prefers-reduced-motion:reduce' in css)
check('safe-area support', 'safe-area-inset' in css)
check('optional proxy remains configurable', 'offProxyUrl' in config and 'offSearchProxyUrl' in config)

secret_patterns = [
    r'AIza[0-9A-Za-z_-]{30,}', r'sk-[A-Za-z0-9]{20,}', r'ghp_[A-Za-z0-9]{20,}',
    r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    r'password\s*[:=]\s*["\'][^"\']+["\']'
]
text = '\n'.join(
    path.read_text(errors='ignore')
    for path in ROOT.rglob('*')
    if path.is_file() and path.suffix.lower() in {'.js', '.html', '.css', '.json', '.md', '.webmanifest'}
)
check('credential and private-key scan', not any(re.search(pattern, text, re.I) for pattern in secret_patterns))

failed = [item for item in checks if not item[1]]
for name, passed, detail in checks:
    print(('PASS' if passed else 'FAIL'), name, detail)
print(f'RESULT {len(checks) - len(failed)}/{len(checks)} passed')
sys.exit(1 if failed else 0)
