'use strict';

/**
 * Phactory Food Cloud — Cloudflare Worker reference deployment.
 *
 * Secrets stay in Worker environment variables and are never shipped to the PWA.
 * Supported optional providers:
 *   - FatSecret Platform API: FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET
 *   - USDA FoodData Central: USDA_API_KEY
 *   - Nutritionix: NUTRITIONIX_APP_ID / NUTRITIONIX_API_KEY
 *
 * Review each provider's current license and storage rules before production use.
 */

const MAX_QUERY = 120;
const MAX_RESULTS = 50;
const MAX_UPSTREAM_BYTES = 2 * 1024 * 1024;

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      ...headers
    }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = String(env.APP_ORIGIN || '').trim();
  if (!allowed || origin !== allowed) return {};
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin'
  };
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function compact(value, max = 200) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function boundedJson(response) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_UPSTREAM_BYTES) throw new Error('Upstream response too large');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_UPSTREAM_BYTES) throw new Error('Upstream response too large');
  return JSON.parse(text);
}

function firstServing(food) {
  const servingValue = food?.servings?.serving;
  if (Array.isArray(servingValue)) return servingValue[0] || {};
  return servingValue && typeof servingValue === 'object' ? servingValue : {};
}

function normalizeFatSecret(food, index) {
  const serving = firstServing(food);
  const name = compact(food?.food_name);
  if (!name) return null;
  return {
    id: `fatsecret-${compact(food?.food_id || index, 80)}`,
    name,
    brand: compact(food?.brand_name || food?.food_type || 'Restaurant / brand'),
    serving: compact(serving?.serving_description || serving?.measurement_description || '1 listed serving'),
    calories: number(serving?.calories),
    protein: number(serving?.protein),
    carbs: number(serving?.carbohydrate),
    fat: number(serving?.fat),
    fiber: number(serving?.fiber),
    sugar: number(serving?.sugar),
    saturatedFat: number(serving?.saturated_fat),
    transFat: number(serving?.trans_fat),
    cholesterol: number(serving?.cholesterol),
    sodium: number(serving?.sodium),
    restaurant: true,
    region: 'US',
    source: 'FatSecret Platform API',
    dataQuality: 'live-provider',
    availability: 'Provider result. Verify current restaurant location, recipe, serving, and customization.'
  };
}

let tokenCache = {token: '', expiresAt: 0};
async function fatSecretToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  if (!env.FATSECRET_CLIENT_ID || !env.FATSECRET_CLIENT_SECRET) return '';
  const basic = btoa(`${env.FATSECRET_CLIENT_ID}:${env.FATSECRET_CLIENT_SECRET}`);
  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {'authorization': `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded'},
    body: 'grant_type=client_credentials&scope=basic',
    redirect: 'error'
  });
  if (!response.ok) throw new Error(`FatSecret auth ${response.status}`);
  const payload = await boundedJson(response);
  tokenCache = {token: compact(payload.access_token, 4000), expiresAt: Date.now() + number(payload.expires_in || 3600) * 1000};
  return tokenCache.token;
}

async function searchFatSecret(query, env, limit) {
  const token = await fatSecretToken(env);
  if (!token) return [];
  const url = new URL('https://platform.fatsecret.com/rest/foods/search/v3');
  url.searchParams.set('search_expression', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('region', 'US');
  url.searchParams.set('max_results', String(Math.min(limit, 50)));
  url.searchParams.set('page_number', '0');
  const response = await fetch(url, {headers: {authorization: `Bearer ${token}`, accept: 'application/json'}, redirect: 'error'});
  if (!response.ok) throw new Error(`FatSecret search ${response.status}`);
  const payload = await boundedJson(response);
  const rows = payload?.foods_search?.results?.food || payload?.foods?.food || [];
  return (Array.isArray(rows) ? rows : [rows]).map(normalizeFatSecret).filter(Boolean);
}


function nutritionixHeaders(env) {
  if (!env.NUTRITIONIX_APP_ID || !env.NUTRITIONIX_API_KEY) return null;
  return {
    'x-app-id': String(env.NUTRITIONIX_APP_ID),
    'x-app-key': String(env.NUTRITIONIX_API_KEY),
    'x-remote-user-id': 'phactoryfit-public',
    accept: 'application/json'
  };
}

function normalizeNutritionix(food, index) {
  const name = compact(food?.food_name || food?.name);
  if (!name) return null;
  const servingQty = number(food?.serving_qty || 1) || 1;
  const servingUnit = compact(food?.serving_unit || 'serving', 40);
  const servingWeight = number(food?.serving_weight_grams);
  const serving = servingWeight
    ? `${servingQty} ${servingUnit} (${servingWeight} g)`
    : `${servingQty} ${servingUnit}`;
  const availableNutrients = [];
  const fieldMap = {
    calories:'nf_calories', protein:'nf_protein', carbs:'nf_total_carbohydrate', fat:'nf_total_fat',
    fiber:'nf_dietary_fiber', sugar:'nf_sugars', saturatedFat:'nf_saturated_fat',
    transFat:'nf_trans_fatty_acid', cholesterol:'nf_cholesterol', sodium:'nf_sodium'
  };
  Object.entries(fieldMap).forEach(([key, field]) => {
    if (Number.isFinite(Number(food?.[field]))) availableNutrients.push(key);
  });
  return {
    id: `nutritionix-${compact(food?.nix_item_id || food?.tag_id || index, 100)}`,
    name,
    brand: compact(food?.brand_name || 'Nutritionix restaurant / brand'),
    serving,
    calories: number(food?.nf_calories),
    protein: number(food?.nf_protein),
    carbs: number(food?.nf_total_carbohydrate),
    fat: number(food?.nf_total_fat),
    fiber: number(food?.nf_dietary_fiber),
    sugar: number(food?.nf_sugars),
    saturatedFat: number(food?.nf_saturated_fat),
    transFat: number(food?.nf_trans_fatty_acid),
    cholesterol: number(food?.nf_cholesterol),
    sodium: number(food?.nf_sodium),
    restaurant: true,
    region: 'US',
    source: 'Nutritionix Restaurant Database',
    dataQuality: 'live-provider',
    availableNutrients,
    availability: 'Live provider result. Verify the current restaurant location, size, recipe, and customizations.'
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await mapper(items[index], index); }
      catch (error) { results[index] = null; }
    }
  });
  await Promise.all(workers);
  return results;
}

async function nutritionixItem(item, env) {
  const headers = nutritionixHeaders(env);
  if (!headers || !item?.nix_item_id) return item;
  const url = new URL('https://trackapi.nutritionix.com/v2/search/item');
  url.searchParams.set('nix_item_id', compact(item.nix_item_id, 120));
  const response = await fetch(url, {headers, redirect:'error'});
  if (!response.ok) throw new Error(`Nutritionix item ${response.status}`);
  const payload = await boundedJson(response);
  return Array.isArray(payload?.foods) && payload.foods[0] ? payload.foods[0] : item;
}

async function searchNutritionix(query, env, limit) {
  const headers = nutritionixHeaders(env);
  if (!headers) return [];
  const url = new URL('https://trackapi.nutritionix.com/v2/search/instant');
  url.searchParams.set('query', query);
  url.searchParams.set('branded', 'true');
  url.searchParams.set('common', 'false');
  url.searchParams.set('self', 'false');
  const response = await fetch(url, {headers, redirect:'error'});
  if (!response.ok) throw new Error(`Nutritionix search ${response.status}`);
  const payload = await boundedJson(response);
  const rows = (Array.isArray(payload?.branded) ? payload.branded : []).slice(0, Math.min(limit, 18));
  const details = await mapWithConcurrency(rows, 4, async row => {
    const hasMacros = ['nf_calories','nf_protein','nf_total_carbohydrate','nf_total_fat'].every(field => Number.isFinite(Number(row?.[field])));
    return hasMacros ? row : nutritionixItem(row, env);
  });
  return details.map(normalizeNutritionix).filter(food => food && food.calories > 0);
}

function nutrientValue(food, names) {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  for (const nutrient of nutrients) {
    const label = compact(nutrient?.nutrientName || nutrient?.nutrient?.name).toLowerCase();
    if (names.some(name => label === name || label.includes(name))) return number(nutrient?.value ?? nutrient?.amount);
  }
  return 0;
}

function normalizeUsda(food, index) {
  const name = compact(food?.description);
  if (!name) return null;
  return {
    id: `usda-${compact(food?.fdcId || index, 80)}`,
    name,
    brand: compact(food?.brandOwner || food?.brandName || 'USDA Branded Food'),
    serving: food?.servingSize ? `${number(food.servingSize)} ${compact(food.servingSizeUnit || 'g', 20)}` : '1 listed serving',
    calories: nutrientValue(food, ['energy']),
    protein: nutrientValue(food, ['protein']),
    carbs: nutrientValue(food, ['carbohydrate']),
    fat: nutrientValue(food, ['total lipid', 'total fat']),
    fiber: nutrientValue(food, ['fiber']),
    sugar: nutrientValue(food, ['total sugars', 'sugars']),
    saturatedFat: nutrientValue(food, ['saturated']),
    transFat: nutrientValue(food, ['trans fat']),
    cholesterol: nutrientValue(food, ['cholesterol']),
    sodium: nutrientValue(food, ['sodium']),
    restaurant: true,
    region: 'US',
    source: 'USDA FoodData Central',
    dataQuality: 'live-provider',
    availability: 'USDA branded-food result. Verify current restaurant menu, serving size, and customization.'
  };
}

async function searchUsda(query, env, limit) {
  if (!env.USDA_API_KEY) return [];
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('api_key', env.USDA_API_KEY);
  const response = await fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json'},
    body: JSON.stringify({query, dataType: ['Branded'], pageSize: Math.min(limit, 50), pageNumber: 1}),
    redirect: 'error'
  });
  if (!response.ok) throw new Error(`USDA search ${response.status}`);
  const payload = await boundedJson(response);
  return (Array.isArray(payload?.foods) ? payload.foods : []).map(normalizeUsda).filter(Boolean);
}

function dedupe(foods) {
  const seen = new Set();
  return foods.filter(food => {
    const key = `${food.brand}|${food.name}|${food.serving}`.toLowerCase();
    if (seen.has(key) || !food.calories) return false;
    seen.add(key);
    return true;
  });
}


async function rateLimitAllowed(request, env) {
  if (!env.RATE_LIMITER || typeof env.RATE_LIMITER.limit !== 'function') return true;
  const key = compact(request.headers.get('CF-Connecting-IP') || 'unknown', 100);
  try {
    const result = await env.RATE_LIMITER.limit({key});
    return Boolean(result?.success);
  } catch (error) {
    return true;
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
    if (request.method !== 'GET') return json({error: 'Method not allowed'}, 405, cors);

    const url = new URL(request.url);
    if (!(await rateLimitAllowed(request, env))) return json({error:'Rate limit exceeded'}, 429, {...cors, 'retry-after':'60'});
    if (url.pathname === '/health') return json({ok: true, providers: {nutritionix: Boolean(env.NUTRITIONIX_APP_ID && env.NUTRITIONIX_API_KEY), fatSecret: Boolean(env.FATSECRET_CLIENT_ID && env.FATSECRET_CLIENT_SECRET), usda: Boolean(env.USDA_API_KEY)}}, 200, cors);
    if (url.pathname !== '/v1/search') return json({error: 'Not found'}, 404, cors);

    const query = compact(url.searchParams.get('q'), MAX_QUERY);
    const limit = Math.max(1, Math.min(MAX_RESULTS, Number(url.searchParams.get('limit')) || 50));
    if (query.length < 2) return json({foods: [], query}, 200, cors);

    const settled = await Promise.allSettled([
      searchNutritionix(query, env, limit),
      searchFatSecret(query, env, limit),
      searchUsda(query, env, limit)
    ]);
    const foods = dedupe(settled.flatMap(result => result.status === 'fulfilled' ? result.value : [])).slice(0, limit);
    const errors = settled.filter(result => result.status === 'rejected').map(result => compact(result.reason?.message || 'Provider error'));
    return json({query, foods, partial: errors.length > 0, providerErrors: errors}, 200, cors);
  }
};
