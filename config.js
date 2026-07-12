'use strict';

// Optional production endpoints. This file is public on GitHub Pages.
// NEVER place API keys, OAuth client secrets, passwords, or bearer tokens here.
//
// foodCloudUrl may point to:
//   1) a same-origin /food-api deployment, or
//   2) a dedicated HTTPS *.workers.dev endpoint deployed from food-cloud/worker.js.
// Leave blank to use the 1,348-item offline restaurant catalog plus Open Food Facts.
window.PHACTORYFIT_CONFIG = Object.freeze({
  foodCloudUrl: '',
  offProxyUrl: '',
  offSearchProxyUrl: ''
});
