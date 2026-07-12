'use strict';

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const source = fs.readFileSync(path.join(root, 'food-cloud', 'worker.js'), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const worker = (await import(moduleUrl)).default;
const calls = [];

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  calls.push({url, init});
  if (url.startsWith('https://trackapi.nutritionix.com/v2/search/instant')) {
    return new Response(JSON.stringify({branded:[
      {food_name:'10 Wings, Lemon Pepper', brand_name:'Wingstop', nix_item_id:'wingstop-10-lemon', serving_qty:1, serving_unit:'order'},
      {food_name:'Seasoned Fries, Regular', brand_name:'Wingstop', nix_item_id:'wingstop-fries', serving_qty:1, serving_unit:'order'}
    ]}), {status:200, headers:{'content-type':'application/json'}});
  }
  if (url.includes('nix_item_id=wingstop-10-lemon')) {
    return new Response(JSON.stringify({foods:[{food_name:'10 Wings, Lemon Pepper',brand_name:'Wingstop',nix_item_id:'wingstop-10-lemon',serving_qty:1,serving_unit:'order',serving_weight_grams:300,nf_calories:750,nf_protein:60,nf_total_carbohydrate:5,nf_total_fat:55,nf_saturated_fat:15,nf_cholesterol:260,nf_sodium:3200}]}), {status:200});
  }
  if (url.includes('nix_item_id=wingstop-fries')) {
    return new Response(JSON.stringify({foods:[{food_name:'Seasoned Fries, Regular',brand_name:'Wingstop',nix_item_id:'wingstop-fries',serving_qty:1,serving_unit:'order',serving_weight_grams:250,nf_calories:500,nf_protein:7,nf_total_carbohydrate:68,nf_total_fat:22,nf_sodium:900}]}), {status:200});
  }
  throw new Error(`Unexpected fetch ${url}`);
};

const env = {
  APP_ORIGIN:'https://example.github.io',
  NUTRITIONIX_APP_ID:'server-only-id',
  NUTRITIONIX_API_KEY:'server-only-key'
};

const health = await worker.fetch(new Request('https://food.example/health', {headers:{origin:env.APP_ORIGIN}}), env);
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.equal(healthBody.providers.nutritionix, true);
assert.equal(healthBody.providers.fatSecret, false);

const response = await worker.fetch(new Request('https://food.example/v1/search?q=Wingstop%20lemon%20pepper&limit=10', {headers:{origin:env.APP_ORIGIN}}), env);
assert.equal(response.status, 200);
assert.equal(response.headers.get('access-control-allow-origin'), env.APP_ORIGIN);
assert.equal(response.headers.get('cache-control'), 'no-store');
const body = await response.json();
assert.equal(body.foods.length, 2);
assert.equal(body.foods[0].brand, 'Wingstop');
assert.equal(body.foods[0].calories, 750);
assert.equal(body.foods[0].protein, 60);
assert.equal(body.foods[0].carbs, 5);
assert.equal(body.foods[0].fat, 55);
assert.equal(body.foods[0].source, 'Nutritionix Restaurant Database');
assert(body.foods[0].availableNutrients.includes('protein'));
assert(calls.every(call => call.init.headers['x-app-key'] === 'server-only-key' || call.url.includes('/health') === false));
assert(!JSON.stringify(body).includes('server-only-key'));
console.log('PASSED 12/12 Food Cloud Nutritionix provider checks');
