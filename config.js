// Optional production overrides for Open Food Facts lookups.
// Leave blank to use PhactoryFit's direct, read-only public endpoints.
// offProxyUrl should accept ?barcode=UPC_OR_EAN.
// offSearchProxyUrl should accept ?q=SEARCH_TEXT and return { products: [...] }.
window.PHACTORYFIT_CONFIG = {
  offProxyUrl: '',
  offSearchProxyUrl: ''
};
