'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.createContext(context);
for (const filename of ['restaurant-foods.js','restaurant-foods-expanded.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), context, {filename});
}
const curated = context.window.PHACTORYFIT_RESTAURANT_FOODS;
const expanded = context.window.PHACTORYFIT_EXPANDED_RESTAURANT_FOODS;
assert(Array.isArray(curated) && Object.isFrozen(curated));
assert(Array.isArray(expanded) && Object.isFrozen(expanded));
assert.equal(curated.length, 250);
assert.equal(expanded.length, 1098);

const all = [...curated, ...expanded];
const ids = new Set();
const brands = new Set();
for (const food of all) {
  assert.equal(typeof food.id, 'string');
  assert(food.id.length > 2 && !ids.has(food.id), `duplicate/invalid id ${food.id}`);
  ids.add(food.id);
  assert.equal(typeof food.name, 'string');
  assert(food.name.trim().length > 0);
  assert.equal(typeof food.brand, 'string');
  brands.add(food.brand);
  assert(Number.isFinite(Number(food.calories)) && Number(food.calories) >= 0, `${food.id} invalid calories`);
  for (const field of ['protein','carbs','fat']) {
    if (food[field] === undefined || food[field] === null) continue;
    assert(Number.isFinite(Number(food[field])) && Number(food[field]) >= 0, `${food.id} invalid ${field}`);
  }
  assert(food.restaurant === true);
  assert(food.region === 'US');
}
for (const brand of ["McDonald's",'Burger King',"Wendy's",'Dairy Queen',"Hardee's",'Little Caesars',"Taco John's",'White Castle','Chick-fil-A','Taco Bell','Subway',"Arby's",'Sonic Drive-In','Five Guys','Buffalo Wild Wings','Starbucks','Chipotle','Panera Bread']) {
  assert(brands.has(brand), `missing chain ${brand}`);
}
assert(expanded.every(food => food.dataQuality === 'archived-menu'));
assert(expanded.every(food => food.sourceUrl === 'https://github.com/captn3m0/restaurant-nutrition-data'));
console.log(`PASSED restaurant data audit: ${all.length} records, ${brands.size} chains, ${ids.size} unique IDs`);
