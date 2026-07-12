'use strict';

// Optional production overrides for Open Food Facts lookups.
// Security default: leave both blank and use PhactoryFit's direct read-only endpoint.
// A proxy must be HTTPS, same-origin, return JSON, and be added to both
// ALLOWED_API_ORIGINS in app.js and connect-src in index.html's CSP.
// Never place API secrets in this public file or anywhere in a GitHub Pages build.
window.PHACTORYFIT_CONFIG = Object.freeze({
  offProxyUrl: '',
  offSearchProxyUrl: ''
});
