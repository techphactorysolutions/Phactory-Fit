# PhactoryFit Test Plan

## Automated checks

From the repository root:

```bash
python -m pip install -r requirements-test.txt
playwright install chromium
python tests/static_audit.py
python tests/test_browser.py
```

The browser suite uses mocked Open Food Facts responses and a generated EAN-13 image. It does not send nutrition, body weight, or diary data to an external service.

## Required physical-device checks

A desktop test runner cannot reproduce every iPhone camera and permission state. Before a public release, verify on the deployed HTTPS GitHub Pages address:

1. Install from Safari using **Share → Add to Home Screen**.
2. Open **Log → Barcode → Use camera** and grant permission.
3. Leave the permission sheet open for at least five seconds; the scanner must remain active after returning.
4. Scan a UPC-A and EAN-13 package in portrait orientation.
5. Confirm the generated serving, calories, protein, carbohydrates, fat, and sodium against the package label.
6. Background the app for ten seconds, return, and verify the preview recovers or presents **Start preview**.
7. Close the scanner and confirm the iPhone camera indicator turns off.
8. Disable the network and verify saved foods and the existing diary remain usable.
9. Export a backup, reset local data, then import the backup and verify totals and weigh-ins.

## Calculation fixtures

The automated suite covers:

- 204–202 lb weight histories and future-date rejection
- 200 g protein targets
- decimal serving multipliers
- grams, milliliters, ounces, pounds, and kilojoule conversion paths
- sodium/cholesterol values reported in grams or milligrams
- incomplete nutrition records that must not be treated as zero
- irregular weigh-in spacing on the trend chart
- completed-day adherence calculations
- cumulative water, workout-minute, and exercise-calorie limits
