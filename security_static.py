#!/usr/bin/env python3
"""Repeatable, dependency-free security checks for the published static bundle."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "1.9.0"
EXPECTED_ZXING_SHA256 = "066bc34edfcdd4a33f0964aeec967752a0dea1ccaf36e58e319ac9fcb5070f6a"

checks: list[tuple[str, bool, str]] = []

def check(name: str, condition: bool, detail: str = "") -> None:
    checks.append((name, bool(condition), detail))


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")

index = read("index.html")
app = read("app.js")
restaurant_catalog = read("restaurant-foods.js")
worker = read("service-worker.js")
config = read("config.js")
manifest = json.loads(read("manifest.webmanifest"))
vendor_lock = json.loads(read("VENDOR_LOCK.json"))
package = json.loads(read("package.json"))
lock = json.loads(read("package-lock.json"))

required_files = [
    "index.html", "styles.css", "app.js", "config.js", "restaurant-foods.js", "service-worker.js",
    "manifest.webmanifest", "zxing-browser.min.js", "PRIVACY.md", "SECURITY.md",
    "THREAT_MODEL.md", "VENDOR_LOCK.json", "package.json", "package-lock.json",
]
for name in required_files:
    check(f"required file: {name}", (ROOT / name).is_file())

# Version and deployment consistency.
for name, text in (("index.html", index), ("app.js", app), ("service-worker.js", worker), ("package.json", json.dumps(package))):
    check(f"version {VERSION} in {name}", VERSION in text)
check("manifest start_url is relative", manifest.get("start_url") == "./")
check("manifest scope is relative", manifest.get("scope") == "./")
check("manifest standalone display", manifest.get("display") in {"standalone", "fullscreen"})

# CSP and browser hardening.
csp_match = re.search(r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"', index, re.I)
csp = csp_match.group(1) if csp_match else ""
check("CSP is present", bool(csp))
for directive in [
    "default-src 'self'", "base-uri 'none'", "object-src 'none'", "script-src 'self'",
    "style-src 'self'", "connect-src 'self' https://world.openfoodfacts.org",
    "form-action 'self'", "frame-src 'none'", "upgrade-insecure-requests",
    "block-all-mixed-content",
]:
    check(f"CSP directive: {directive}", directive in csp)
check("CSP has no unsafe-inline", "unsafe-inline" not in csp)
check("CSP has no unsafe-eval", "unsafe-eval" not in csp)
check("no inline executable script tags", not re.search(r'<script(?![^>]*\bsrc=)[^>]*>\s*\S', index, re.I | re.S))
check("no inline event handlers", not re.search(r'\son[a-z]+\s*=', index, re.I))
check("referrer policy is no-referrer", '<meta name="referrer" content="no-referrer">' in index)
check("anti-framing guard present", "window.top !== window.self" in app and "Blocked framed execution" in app)
check("external links use noopener", all('rel="noopener noreferrer"' in tag for tag in re.findall(r'<a\b[^>]*target="_blank"[^>]*>', index, re.I)))

# No remote executable code or dangerous dynamic execution in first-party code.
script_srcs = re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)', index, re.I)
check("all scripts are same-origin relative", bool(script_srcs) and all(not re.match(r'^[a-z]+:|^//', src, re.I) for src in script_srcs), str(script_srcs))
first_party = "\n".join([index, app, restaurant_catalog, worker, config])
for pattern, label in [
    (r'\beval\s*\(', "eval"),
    (r'\bnew\s+Function\s*\(', "new Function"),
    (r'\bdocument\.write\s*\(', "document.write"),
    (r'javascript\s*:', "javascript URL"),
]:
    check(f"no {label}", not re.search(pattern, first_party, re.I))
check("strict mode in app", app.startswith("'use strict';"))
check("strict mode in service worker", worker.startswith("'use strict';"))
check("configuration object frozen", "Object.freeze" in config)

# Data and network limits.
for token in [
    "MAX_FOOD_SEARCH_LENGTH", "MAX_API_RESPONSE_BYTES", "MAX_BACKUP_BYTES",
    "MAX_BARCODE_PHOTO_BYTES", "MAX_BARCODE_IMAGE_PIXELS", "ALLOWED_API_ORIGINS",
    "ALLOWED_IMAGE_HOSTS", "credentials:'omit'", "referrerPolicy:'no-referrer'",
]:
    check(f"security control present: {token}", token in app)
check("API response reads are bounded", "readBoundedJson" in app and "content-length" in app)
check("backup imports are bounded", "file.size > MAX_BACKUP_BYTES" in app)
check("barcode images are bounded", "file.size > MAX_BARCODE_PHOTO_BYTES" in app and "MAX_BARCODE_IMAGE_PIXELS" in app)
check("remote images use host allowlist", "ALLOWED_IMAGE_HOSTS.has(url.hostname)" in app)
check("API calls use origin allowlist", "ALLOWED_API_ORIGINS.has(url.origin)" in app)
check("HTML escaping helper exists", "function escapeHtml" in app)
check("default user profile is generic", "name:'Athlete'" in app and "name:'Sean'" not in app)
check("production diagnostics global removed", "__PHACTORYFIT_CAMERA_DIAGNOSTICS" not in app)

# Service-worker cache poisoning and privacy controls.
for token in ["CACHEABLE_PATHS", "canonicalCacheKey", "requestUrl.origin !== self.location.origin", "response.type !== 'basic'"]:
    check(f"service-worker control present: {token}", token in worker)
check("service worker does not cache unknown same-origin responses", "if (!CACHEABLE_PATHS.has(requestUrl.pathname))" in worker)
check("service worker does not cache cross-origin API responses", "requestUrl.origin !== self.location.origin" in worker)
check("scanner is in required offline shell", "'./zxing-browser.min.js?v=1.9.0'" in worker.split("const OPTIONAL_SHELL", 1)[0])
check("restaurant catalog is in required offline shell", "'./restaurant-foods.js?v=1.9.0'" in worker.split("const OPTIONAL_SHELL", 1)[0])
check("restaurant catalog is same-origin script", 'src="restaurant-foods.js?v=1.9.0"' in index)
check("restaurant catalog is frozen", "Object.freeze" in restaurant_catalog)

# Vendored dependency integrity and lock metadata.
vendor_bytes = (ROOT / "zxing-browser.min.js").read_bytes()
vendor_sha = hashlib.sha256(vendor_bytes).hexdigest()
check("ZXing bundle SHA-256 matches audited upstream", vendor_sha == EXPECTED_ZXING_SHA256, vendor_sha)
check("vendor lock hash matches file", vendor_lock["runtime_vendor"]["sha256"] == vendor_sha)
check("ZXing version pinned exactly", package["dependencies"].get("@zxing/browser") == "0.2.1")
check("package lock version matches", lock["packages"]["node_modules/@zxing/browser"]["version"] == "0.2.1")
check("package lock uses public registry", "packages.applied-caas" not in read("package-lock.json"))

# Best-effort secret scan. These patterns intentionally avoid package integrity hashes.
secret_files = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in {".js", ".html", ".css", ".json", ".md", ".yml", ".yaml", ".txt"} and p.name != "package-lock.json"]
secret_text = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in secret_files)
secret_patterns = {
    "private key": r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "GitHub token": r"\bgh[pousr]_[A-Za-z0-9]{30,}\b",
    "AWS access key": r"\bAKIA[0-9A-Z]{16}\b",
    "Google API key": r"\bAIza[0-9A-Za-z_-]{30,}\b",
    "generic hard-coded secret": r"(?i)(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*['\"][^'\"]{12,}['\"]",
}
for label, pattern in secret_patterns.items():
    check(f"no detected {label}", not re.search(pattern, secret_text))

passed = sum(ok for _, ok, _ in checks)
failed = [(name, detail) for name, ok, detail in checks if not ok]
for name, ok, detail in checks:
    suffix = f" — {detail}" if detail and not ok else ""
    print(f"{'PASS' if ok else 'FAIL'}: {name}{suffix}")
print(f"\nRESULT: {passed}/{len(checks)} checks passed")
if failed:
    print("\nFailures:")
    for name, detail in failed:
        print(f"- {name}: {detail}")
    sys.exit(1)
