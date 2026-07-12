# PhactoryFit v1.6.1 Validation Plan

## Automated checks completed

- JavaScript syntax and asset-reference validation
- Embedded ZXing engine initialization
- Dynamic root recovery loader
- Camera startup without scanner-global failure
- Live simulated barcode decoding
- Barcode photo decoding
- Camera permission denial handling
- Delayed permission cleanup
- Safari preview recovery
- Barcode nutrition lookup and serving calculations
- Product search and diary logging
- Import normalization, chart spacing, adherence, and input bounds

## Required iPhone test

1. Deploy every file from the flat ZIP to the GitHub repository root.
2. Wait for GitHub Pages deployment to finish.
3. Open the Pages URL directly in Safari.
4. Open Settings and confirm **Version 1.6.1**.
5. Open Log → Barcode → Use camera.
6. Allow camera access.
7. Hold a UPC/EAN barcode inside the green frame, 6–10 inches away.
8. Confirm the barcode number fills automatically.
9. Confirm the Nutrition Facts panel appears.
10. Select servings and add the product to the diary.
