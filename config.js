// Optional production override for barcode product lookup.
// Leave blank to use PhactoryFit's direct, read-only public Open Food Facts lookup.
// When set, this proxy is attempted first and should accept ?barcode=UPC_OR_EAN,
// returning either an Open Food Facts response or a normalized product object.
window.PHACTORYFIT_CONFIG = {
  offProxyUrl: ''
};
