'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'restaurant-brands.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'food-cloud', 'worker.js'), 'utf8');
const sandbox = {window:{}};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {filename:'restaurant-brands.js'});
const brands = sandbox.window.PHACTORYFIT_RESTAURANT_BRANDS;

assert(Array.isArray(brands), 'registry must be an array');
assert.equal(brands.length, 422, 'registry must contain the 422 requested restaurant brands');
const names = brands.map(row => row.name);
assert.equal(new Set(names).size, 422, 'restaurant names must be unique');
for (const required of ["McDonald’s", 'Wingstop', 'Lion’s Choice', 'Waffle House', 'Zippy’s', '&pizza', 'CAVA', 'Whataburger']) {
  assert(names.includes(required), `missing requested brand: ${required}`);
}
assert(brands.every(row => typeof row.name === 'string' && row.name.trim() && Array.isArray(row.aliases)), 'every brand must have a valid schema');
assert(index.includes('restaurant-brands.js?v=1.13.0'), 'registry must load before app.js');
assert(!app.includes('restaurantDirectoryMarkup'), 'restaurant directory renderer must be removed');
assert(!app.includes('Browse restaurant menus'), 'browse-all restaurant list must be removed');
assert(app.includes('function recognizedRestaurantBrand'), 'brand-aware query recognition must exist');
assert(app.includes('restaurantProviderQuery'), 'provider query enrichment must exist');
assert(worker.includes('searchNutritionix'), 'Food Cloud must support Nutritionix restaurant search');
assert(worker.includes('NUTRITIONIX_APP_ID') && worker.includes('NUTRITIONIX_API_KEY'), 'Nutritionix credentials must be server-side environment variables');
assert(worker.includes('searchFatSecret') && worker.includes('searchUsda'), 'fallback providers must remain enabled');
console.log('PASSED 13/13 restaurant brand registry checks');
