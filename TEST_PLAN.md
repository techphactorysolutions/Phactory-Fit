# PhactoryFit 1.7.0 Release Validation Plan

## Automated release gates

Run from the repository root:

```bash
python3 tests/security_static.py
python3 tests/browser_security.py
node tests/service_worker_security.js
node --check app.js
node --check service-worker.js
npm ci --ignore-scripts
cmp --silent zxing-browser.min.js node_modules/@zxing/browser/umd/zxing-browser.min.js
npm audit --omit=dev --audit-level=high
```

The release audit also runs the full 17-case barcode, camera, nutrition, search, import, chart, and calculation regression suite used during development.

## Security cases

- malicious imported profile and food text does not execute;
- malicious external product fields remain inert text;
- unapproved tracking image URL is removed;
- untrusted API origins, URL credentials, and redirects are rejected;
- API response size limit is enforced;
- oversized backup is rejected without replacing current state;
- prototype-pollution input does not affect `Object.prototype`;
- search text is bounded before network transmission;
- service worker does not cache external APIs, unknown paths, or arbitrary query variants;
- scanner bundle matches the exact pinned npm artifact;
- no secret/private-key pattern is present in publishable files.

## Required GitHub deployment validation

1. Upload the complete release package, including hidden `.github` files.
2. Confirm the Security checks workflow passes.
3. Confirm Dependabot is active.
4. Enforce HTTPS in GitHub Pages.
5. Configure and verify a dedicated custom domain or subdomain.
6. Enable push protection, secret scanning, private vulnerability reporting, and branch protection.
7. Open the deployed app in Safari and confirm **Version 1.7.0**.
8. Inspect the browser network log and verify runtime requests are limited to the app origin and Open Food Facts.
9. Confirm no console CSP errors occur during normal app use.
10. Confirm offline reload loads the app shell but does not return cached API search results as if they were current network data.

## Required physical iPhone test

1. Open **Log → Barcode → Use camera** and grant permission.
2. Confirm the preview remains open after the permission sheet closes.
3. Scan one UPC-A and one EAN-13 code.
4. Verify generated nutrition against each physical label.
5. Background and resume Safari; use **Start preview** if Safari pauses video.
6. Close the scanner and confirm the camera indicator turns off.
7. Test a saved food while offline.
8. Export a backup, reset with test data only, and re-import it.
9. Revoke camera permission and confirm the app displays a safe error without repeated permission loops.
