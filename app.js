'use strict';

const STORAGE_KEY = 'phactoryfit.v1';
const APP_VERSION = '1.10.0';
const MAX_LOG_ENTRIES_PER_DAY = 5000;
const MAX_CUSTOM_FOODS = 10000;
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const VALID_VIEWS = new Set(['today', 'diary', 'log', 'progress', 'coach', 'settings']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const MAX_FOOD_SEARCH_LENGTH = 120;
const MAX_API_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const MAX_BARCODE_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_BARCODE_IMAGE_PIXELS = 40_000_000;
const ALLOWED_API_ORIGINS = new Set([window.location.origin, 'https://world.openfoodfacts.org']);
const ALLOWED_IMAGE_HOSTS = new Set(['images.openfoodfacts.org']);

// GitHub Pages cannot add frame-ancestors/X-Frame-Options on normal project sites.
// Refuse to run inside an iframe so an attacker cannot visually overlay the app.
if (window.top !== window.self) {
  document.body.replaceChildren();
  const message = document.createElement('main');
  message.setAttribute('role', 'alert');
  message.textContent = 'PhactoryFit cannot run inside an embedded frame. Open it directly in a new tab.';
  document.body.appendChild(message);
  throw new Error('Blocked framed execution');
}

const starterFoods = [
  {id:'egg',name:'Large egg',brand:'Generic',serving:'1 egg',calories:72,protein:6.3,carbs:.4,fat:4.8,fiber:0,sugar:.2,sodium:71,aliases:['egg','eggs']},
  {id:'chicken',name:'Chicken breast, cooked',brand:'Generic',serving:'4 oz',calories:187,protein:35,carbs:0,fat:4,fiber:0,sugar:0,sodium:80,aliases:['chicken','chicken breast']},
  {id:'rice',name:'White rice, cooked',brand:'Generic',serving:'1 cup',calories:205,protein:4.3,carbs:44.5,fat:.4,fiber:.6,sugar:.1,sodium:2,aliases:['rice','white rice']},
  {id:'potato',name:'Russet potato, baked',brand:'Generic',serving:'1 medium',calories:168,protein:4.6,carbs:37,fat:.2,fiber:4,sugar:1.9,sodium:24,aliases:['potato','baked potato']},
  {id:'oats',name:'Old-fashioned oats',brand:'Generic',serving:'1/2 cup dry',calories:150,protein:5,carbs:27,fat:3,fiber:4,sugar:1,sodium:0,aliases:['oats','oatmeal']},
  {id:'whey',name:'Whey protein powder',brand:'Generic',serving:'1 scoop',calories:120,protein:24,carbs:3,fat:1.5,fiber:0,sugar:1,sodium:120,aliases:['protein shake','whey','protein powder']},
  {id:'greek-yogurt',name:'Nonfat Greek yogurt',brand:'Generic',serving:'1 cup',calories:130,protein:23,carbs:9,fat:0,fiber:0,sugar:7,sodium:85,aliases:['greek yogurt','yogurt']},
  {id:'tuna',name:'Tuna in water, drained',brand:'Generic',serving:'1 can',calories:120,protein:26,carbs:0,fat:1,fiber:0,sugar:0,sodium:320,aliases:['tuna','tuna can']},
  {id:'turkey',name:'Lean ground turkey, cooked',brand:'Generic',serving:'4 oz',calories:170,protein:22,carbs:0,fat:8,fiber:0,sugar:0,sodium:85,aliases:['turkey','ground turkey']},
  {id:'beef',name:'93% lean ground beef, cooked',brand:'Generic',serving:'4 oz',calories:172,protein:23,carbs:0,fat:8,fiber:0,sugar:0,sodium:75,aliases:['beef','ground beef']},
  {id:'salmon',name:'Atlantic salmon, cooked',brand:'Generic',serving:'4 oz',calories:233,protein:25,carbs:0,fat:14,fiber:0,sugar:0,sodium:75,aliases:['salmon']},
  {id:'banana',name:'Banana',brand:'Generic',serving:'1 medium',calories:105,protein:1.3,carbs:27,fat:.4,fiber:3.1,sugar:14.4,sodium:1,aliases:['banana']},
  {id:'apple',name:'Apple',brand:'Generic',serving:'1 medium',calories:95,protein:.5,carbs:25,fat:.3,fiber:4.4,sugar:19,sodium:2,aliases:['apple']},
  {id:'broccoli',name:'Broccoli, cooked',brand:'Generic',serving:'1 cup',calories:55,protein:3.7,carbs:11.2,fat:.6,fiber:5.1,sugar:2.2,sodium:64,aliases:['broccoli']},
  {id:'olive-oil',name:'Olive oil',brand:'Generic',serving:'1 tbsp',calories:119,protein:0,carbs:0,fat:13.5,fiber:0,sugar:0,sodium:0,aliases:['olive oil','oil']},
  {id:'bread',name:'Whole-wheat bread',brand:'Generic',serving:'2 slices',calories:160,protein:8,carbs:28,fat:2,fiber:4,sugar:4,sodium:280,aliases:['bread','toast']},
  {id:'milk',name:'2% milk',brand:'Generic',serving:'1 cup',calories:122,protein:8.1,carbs:12,fat:4.8,fiber:0,sugar:12,sodium:115,aliases:['milk']},
  {id:'cottage',name:'Low-fat cottage cheese',brand:'Generic',serving:'1 cup',calories:180,protein:24,carbs:10,fat:5,fiber:0,sugar:8,sodium:700,aliases:['cottage cheese']},
  {id:'shrimp',name:'Shrimp, cooked',brand:'Generic',serving:'4 oz',calories:112,protein:24,carbs:.2,fat:1.7,fiber:0,sugar:0,sodium:224,aliases:['shrimp']},
  {id:'protein-milk',name:'Ultra-filtered protein milk',brand:'Generic',serving:'1 bottle',calories:150,protein:30,carbs:4,fat:2.5,fiber:0,sugar:2,sodium:230,aliases:['protein milk','fairlife']}
];

const rescueFoods = [
  {foodId:'whey',label:'Whey protein + water',protein:24,calories:120},
  {foodId:'tuna',label:'1 can tuna',protein:26,calories:120},
  {foodId:'chicken',label:'4 oz chicken breast',protein:35,calories:187},
  {foodId:'protein-milk',label:'Protein milk',protein:30,calories:150},
  {foodId:'greek-yogurt',label:'1 cup nonfat Greek yogurt',protein:23,calories:130},
  {foodId:'shrimp',label:'4 oz cooked shrimp',protein:24,calories:112}
];

function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function emptyDay() {
  return {foods:[],water:0,steps:0,workoutMinutes:0,exerciseCalories:0,sleep:0,notes:'',workoutName:'',workoutNotes:''};
}

function defaultState() {
  const today = localDateKey();
  return {
    version: 2,
    selectedDate: today,
    profile: {name:'Athlete',country:'US',stateCode:'',currentWeight:180,goalWeight:170,calorieGoal:2200,proteinGoal:160,carbGoal:220,fatGoal:73,weeklyGoal:-0.5,eatBackExercise:false},
    days: {[today]: emptyDay()},
    weights: [{date:today,weight:180}],
    customFoods: [],
    recentFoodIds: [],
    createdAt: new Date().toISOString()
  };
}

function toNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function isDateKey(value) {
  if (!DATE_PATTERN.test(String(value || ''))) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDateKey(date) === value;
}

function uid(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function currentLocalTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeLoggedTime(value) {
  const time = String(value || '').trim();
  return TIME_PATTERN.test(time) ? time : '';
}

function formatLoggedTime(value) {
  const time = normalizeLoggedTime(value);
  if (!time) return 'Time not set';
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function mealPeriodLabel(meal) {
  return ({Breakfast:'Morning', Lunch:'Afternoon', Dinner:'Evening', Snacks:'Any time'})[meal] || meal;
}

function loggedFoodById(logId) {
  return getDay().foods.find(food => food.logId === String(logId || '')) || null;
}

function normalizeFood(raw, fallbackId = uid('food')) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || raw.product_name || '').trim().slice(0, 200);
  if (!name) return null;
  return {
    id: String(raw.id || fallbackId).slice(0, 200),
    name,
    brand: (String(raw.brand || raw.brands || 'Custom').trim().slice(0, 200) || 'Custom'),
    serving: (String(raw.serving || raw.serving_size || '1 serving').trim().slice(0, 200) || '1 serving'),
    calories: round(toNumber(raw.calories, 0, 0, 100000), 4),
    protein: round(toNumber(raw.protein, 0, 0, 10000), 4),
    carbs: round(toNumber(raw.carbs, 0, 0, 10000), 4),
    fat: round(toNumber(raw.fat, 0, 0, 10000), 4),
    fiber: round(toNumber(raw.fiber, 0, 0, 10000), 4),
    sugar: round(toNumber(raw.sugar, 0, 0, 10000), 4),
    saturatedFat: round(toNumber(raw.saturatedFat ?? raw.saturated_fat, 0, 0, 10000), 4),
    transFat: round(toNumber(raw.transFat ?? raw.trans_fat, 0, 0, 10000), 4),
    cholesterol: round(toNumber(raw.cholesterol, 0, 0, 1000000), 4),
    sodium: round(toNumber(raw.sodium, 0, 0, 1000000), 4),
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(alias => String(alias).toLowerCase()).filter(Boolean).slice(0, 30) : [],
    barcode: raw.barcode ? String(raw.barcode).replace(/\D/g, '').slice(0, 14) : null,
    source: raw.source ? String(raw.source).slice(0, 80) : undefined,
    imageUrl: sanitizeImageUrl(raw.imageUrl || raw.image_front_small_url || raw.image_small_url || ''),
    restaurant: Boolean(raw.restaurant),
    category: raw.category ? String(raw.category).trim().slice(0, 80) : '',
    region: raw.region ? String(raw.region).trim().toUpperCase().slice(0, 8) : '',
    availability: raw.availability ? String(raw.availability).trim().slice(0, 500) : '',
    verifiedAt: DATE_PATTERN.test(String(raw.verifiedAt || '')) ? String(raw.verifiedAt) : '',
    tags: Array.isArray(raw.tags) ? raw.tags.map(tag => String(tag).toLowerCase().trim()).filter(Boolean).slice(0, 30) : [],
    availableNutrients: Array.isArray(raw.availableNutrients)
      ? [...new Set(raw.availableNutrients.map(value => String(value)).filter(value => ['calories','protein','carbs','fat','fiber','sugar','saturatedFat','transFat','cholesterol','sodium'].includes(value)))].slice(0, 10)
      : ['calories','protein','carbs','fat','fiber','sugar','saturatedFat','transFat','cholesterol','sodium']
  };
}

function normalizeLogEntry(raw) {
  const food = normalizeFood(raw, String(raw?.id || uid('logged-food')));
  if (!food) return null;
  return {
    ...food,
    meal: MEALS.includes(raw.meal) ? raw.meal : 'Breakfast',
    quantity: toNumber(raw.quantity, 1, 0.01, 1000),
    loggedTime: normalizeLoggedTime(raw.loggedTime || raw.time),
    logId: String(raw.logId || uid('log')).slice(0, 200)
  };
}

function normalizeDay(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    foods: Array.isArray(source.foods) ? source.foods.map(normalizeLogEntry).filter(Boolean).slice(0, 5000) : [],
    water: toNumber(source.water, 0, 0, 1000),
    steps: Math.round(toNumber(source.steps, 0, 0, 1000000)),
    workoutMinutes: toNumber(source.workoutMinutes, 0, 0, 1440),
    exerciseCalories: toNumber(source.exerciseCalories, 0, 0, 20000),
    sleep: toNumber(source.sleep, 0, 0, 24),
    notes: String(source.notes || '').slice(0, 5000),
    workoutName: String(source.workoutName || '').slice(0, 200),
    workoutNotes: String(source.workoutNotes || '').slice(0, 2000)
  };
}

function normalizeState(raw) {
  const base = defaultState();
  const source = raw && typeof raw === 'object' ? raw : {};
  const incomingProfile = source.profile && typeof source.profile === 'object' ? source.profile : {};
  const profile = {
    name: String(incomingProfile.name || base.profile.name).trim().slice(0, 80) || base.profile.name,
    country: String(incomingProfile.country || base.profile.country || 'US').trim().toUpperCase().slice(0, 2) || 'US',
    stateCode: String(incomingProfile.stateCode || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
    currentWeight: toNumber(incomingProfile.currentWeight, base.profile.currentWeight, 40, 1500),
    goalWeight: toNumber(incomingProfile.goalWeight, base.profile.goalWeight, 40, 1500),
    calorieGoal: Math.round(toNumber(incomingProfile.calorieGoal, base.profile.calorieGoal, 500, 10000)),
    proteinGoal: Math.round(toNumber(incomingProfile.proteinGoal, base.profile.proteinGoal, 1, 1000)),
    carbGoal: Math.round(toNumber(incomingProfile.carbGoal, base.profile.carbGoal, 0, 2000)),
    fatGoal: Math.round(toNumber(incomingProfile.fatGoal, base.profile.fatGoal, 0, 1000)),
    weeklyGoal: toNumber(incomingProfile.weeklyGoal, base.profile.weeklyGoal, -2, 2),
    eatBackExercise: Boolean(incomingProfile.eatBackExercise)
  };

  const days = {};
  if (source.days && typeof source.days === 'object' && !Array.isArray(source.days)) {
    Object.entries(source.days).slice(0, 5000).forEach(([date, day]) => {
      if (isDateKey(date)) days[date] = normalizeDay(day);
    });
  }

  const weightsByDate = new Map();
  const today = localDateKey();
  if (Array.isArray(source.weights)) {
    source.weights.slice(0, 10000).forEach(entry => {
      if (!entry || !isDateKey(entry.date) || entry.date > today) return;
      const weight = toNumber(entry.weight, NaN, 40, 1500);
      if (Number.isFinite(weight)) weightsByDate.set(entry.date, {date:entry.date,weight});
    });
  }
  if (!weightsByDate.size) weightsByDate.set(localDateKey(), {date:localDateKey(),weight:profile.currentWeight});
  const weights = [...weightsByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  profile.currentWeight = weights.at(-1).weight;

  const customFoods = [];
  const seenFoodIds = new Set();
  const seenFoodBarcodes = new Set();
  if (Array.isArray(source.customFoods)) {
    source.customFoods.slice(0, MAX_CUSTOM_FOODS).forEach((rawFood, index) => {
      const food = normalizeFood(rawFood, `custom-${index}-${Date.now()}`);
      if (!food || seenFoodIds.has(food.id) || (food.barcode && seenFoodBarcodes.has(food.barcode))) return;
      seenFoodIds.add(food.id);
      if (food.barcode) seenFoodBarcodes.add(food.barcode);
      customFoods.push(food);
    });
  }

  const selectedDate = isDateKey(source.selectedDate) ? source.selectedDate : localDateKey();
  if (!days[selectedDate]) days[selectedDate] = emptyDay();

  return {
    version: 2,
    selectedDate,
    profile,
    days,
    weights,
    customFoods,
    recentFoodIds: Array.isArray(source.recentFoodIds) ? [...new Set(source.recentFoodIds.map(value => String(value).slice(0, 200)))].slice(0, 12) : [],
    createdAt: typeof source.createdAt === 'string' && !Number.isNaN(Date.parse(source.createdAt)) ? source.createdAt.slice(0, 40) : base.createdAt
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  } catch (error) {
    console.error('Could not load state', error);
    return defaultState();
  }
}

let state = loadState();
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const modal = $('#modal');
let toastTimer;
let activeMediaStream = null;
let activeBarcodeControls = null;
let activeBarcodeTimeout = null;
let activeBarcodeReader = null;
let activeBarcodeLoop = null;
let barcodeScanSession = 0;
let barcodeCameraStarting = false;
let barcodeTorchOn = false;
let barcodeVideoDevices = [];
let preferredBarcodeDeviceId = '';
let barcodeCandidate = {code:'', seenAt:0, count:0};
let modalContext = {meal:'Breakfast', foodSearchQuery:''};
let onlineFoodResults = [];
let onlineFoodQuery = '';
let onlineFoodLoading = false;
let onlineFoodError = '';
let foodSearchTimer = null;
let foodSearchRequest = 0;
const onlineFoodSearchCache = new Map();
let cameraVisibilityTimer = null;
let barcodeDecodeRunning = false;
let barcodeLibraryLoadPromise = null;
let cameraPermissionInFlight = false;
let cameraUnexpectedEndRetries = 0;
let cameraLifecycleNote = '';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Could not save state', error);
    if ($('#toast')) toast('Storage is full or unavailable. Export a backup before continuing.');
    return false;
  }
}

function getDay(date = state.selectedDate) {
  if (!state.days[date]) state.days[date] = emptyDay();
  return state.days[date];
}

function peekDay(date = state.selectedDate) {
  return state.days[date] || emptyDay();
}

let normalizedRestaurantFoodsCache = null;

function restaurantFoods() {
  if (normalizedRestaurantFoodsCache) return normalizedRestaurantFoodsCache;
  const rawFoods = Array.isArray(window.PHACTORYFIT_RESTAURANT_FOODS) ? window.PHACTORYFIT_RESTAURANT_FOODS : [];
  normalizedRestaurantFoodsCache = rawFoods.map((food, index) => normalizeFood(food, `restaurant-${index}`)).filter(Boolean).slice(0, 1000);
  return normalizedRestaurantFoodsCache;
}

function allFoods() {
  return [...starterFoods, ...state.customFoods];
}

function findFoodById(id) {
  const key = String(id || '');
  return allFoods().find(food => food.id === key) || restaurantFoods().find(food => food.id === key) || onlineFoodResults.find(food => food.id === key) || null;
}

const RESTAURANT_SEARCH_STOP_WORDS = new Set(['a','an','and','at','food','foods','for','from','in','item','items','me','menu','near','of','order','restaurant','restaurants','the','tonight','today','tomorrow']);

function normalizeSearchText(value = '') {
  let text = String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  text = text.replace(/&/g, ' and ').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const replacements = [
    [/\bmickey\s*d(?:s)?\b/g, 'mcdonalds'],
    [/\bmcd(?:s|onalds)?\b/g, 'mcdonalds'],
    [/\bchickfila\b/g, 'chick fil a'],
    [/\bchic\s*fil\s*a\b/g, 'chick fil a']
  ];
  replacements.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
  return text.replace(/\s+/g, ' ').trim();
}

function foodSearchTokens(query) {
  return normalizeSearchText(query).split(' ').filter(token => token && !RESTAURANT_SEARCH_STOP_WORDS.has(token));
}

function nutrientAvailable(food, nutrient) {
  return !Array.isArray(food?.availableNutrients) || food.availableNutrients.includes(nutrient);
}

function restaurantLocationLabel() {
  if (state.profile.country !== 'US') return 'United States menu';
  return state.profile.stateCode ? `United States · ${state.profile.stateCode}` : 'United States';
}

function smartRestaurantFit(food) {
  if (!food?.restaurant || !nutrientAvailable(food, 'calories') || food.calories <= 0) {
    return {score:0,label:'Nutrition incomplete',tone:'neutral',detail:'Not enough verified nutrition is available to rank this item.'};
  }
  const totals = totalsFor();
  const caloriesLeft = Math.max(0, effectiveCalorieGoal(getDay()) - totals.calories);
  const proteinLeft = Math.max(0, state.profile.proteinGoal - totals.protein);
  const hasProtein = nutrientAvailable(food, 'protein');
  const protein = hasProtein ? food.protein : 0;
  const density = hasProtein ? protein / Math.max(1, food.calories) * 100 : 0;
  const calorieFit = caloriesLeft > 0 ? clamp(1 - Math.max(0, food.calories - caloriesLeft) / Math.max(300, caloriesLeft), 0, 1) : 0;
  const usefulProtein = proteinLeft > 0 ? clamp(protein / Math.max(20, proteinLeft), 0, 1) : clamp(density / 10, 0, 1);
  let score = calorieFit * 45 + usefulProtein * 30 + clamp(density / 10, 0, 1) * 25;
  if (!hasProtein) score = Math.min(score, 42);
  if (nutrientAvailable(food, 'sodium') && food.sodium > 1500) score -= 6;
  score = round(clamp(score, 0, 100));
  if (!hasProtein) return {score,label:'Calories only',tone:'neutral',detail:`Fits ${food.calories} calories into your remaining budget, but verified protein is unavailable.`};
  if (score >= 78) return {score,label:'Strong fit',tone:'strong',detail:`High protein for the calories and compatible with today’s remaining targets.`};
  if (score >= 60) return {score,label:'Good fit',tone:'good',detail:`A practical balance of calories and protein for today.`};
  if (score >= 42) return {score,label:'Fits with planning',tone:'plan',detail:`Can fit, but leaves less room for the rest of the day.`};
  return {score,label:'Higher-calorie choice',tone:'caution',detail:`Uses a large share of today’s remaining calories relative to its protein.`};
}

function hasStrongRestaurantIntent(query) {
  const normalized = normalizeSearchText(query);
  if (normalized.length < 2) return false;
  return restaurantFoods().some(food => {
    const brand = normalizeSearchText(food.brand);
    const name = normalizeSearchText(food.name);
    return normalized === name || normalized.includes(brand);
  });
}

function restaurantSearchResults(query) {
  const normalized = normalizeSearchText(query);
  const tokens = foodSearchTokens(query);
  if (normalized.length < 2 || !tokens.length) return [];

  // A chain/category browse such as “McDonald's breakfast” contains no
  // item-specific words. In that case, rank by today's plan fit first so the
  // user sees practical recommendations rather than whichever item happens to
  // repeat the word “breakfast” in its product name.
  const genericBrowse = restaurantFoods().some(food => {
    const brandTokens = foodSearchTokens(food.brand);
    const categoryTokens = foodSearchTokens(food.category);
    const browseVocabulary = new Set([...brandTokens, ...categoryTokens]);
    const identifiesBrand = brandTokens.length > 0 && brandTokens.every(token => tokens.includes(token));
    const identifiesCategory = categoryTokens.length > 0 && categoryTokens.some(token => tokens.includes(token));
    return identifiesBrand && identifiesCategory && tokens.every(token => browseVocabulary.has(token));
  });

  return restaurantFoods().map(food => {
    const fields = [food.name, food.brand, food.category, ...(food.aliases || []), ...(food.tags || [])].map(normalizeSearchText);
    const haystack = fields.join(' ');
    if (!tokens.every(token => haystack.includes(token))) return null;
    let relevance = 0;
    const name = normalizeSearchText(food.name);
    const brand = normalizeSearchText(food.brand);
    if (name === normalized) relevance += 120;
    if (name.startsWith(normalized)) relevance += 80;
    if (brand === normalized) relevance += 70;
    if (normalized.includes(brand)) relevance += 50;
    if (normalizeSearchText(food.category) && normalized.includes(normalizeSearchText(food.category))) relevance += 25;
    tokens.forEach(token => {
      if (name.includes(token)) relevance += 20;
      if (brand.includes(token)) relevance += 14;
      if ((food.aliases || []).some(alias => normalizeSearchText(alias).includes(token))) relevance += 8;
      if ((food.tags || []).some(tag => normalizeSearchText(tag).includes(token))) relevance += 4;
    });
    return {food,relevance,fit:smartRestaurantFit(food)};
  }).filter(Boolean).sort((first, second) => {
    if (genericBrowse) {
      return second.fit.score - first.fit.score || first.food.calories - second.food.calories || second.relevance - first.relevance;
    }
    return second.relevance - first.relevance || second.fit.score - first.fit.score || first.food.calories - second.food.calories;
  }).map(result => result.food);
}

function cacheOnlineFood(food) {
  const normalized = normalizeFood(food, String(food?.id || uid('food')));
  if (!normalized || starterFoods.some(item => item.id === normalized.id)) return normalized || food;
  const existingIndex = state.customFoods.findIndex(item => item.id === normalized.id || (normalized.barcode && item.barcode === normalized.barcode));
  if (existingIndex >= 0) state.customFoods[existingIndex] = normalized;
  else if (state.customFoods.length < MAX_CUSTOM_FOODS) state.customFoods.push(normalized);
  else toast('Saved-food storage is full. Export a backup and remove unused foods before saving more.');
  saveState();
  return normalized;
}

function round(value, places = 0) {
  const factor = 10 ** places;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function sanitizeImageUrl(value = '') {
  try {
    const url = new URL(String(value || ''), window.location.href);
    if (url.protocol !== 'https:' || url.username || url.password || !ALLOWED_IMAGE_HOSTS.has(url.hostname)) return '';
    url.hash = '';
    return url.href.slice(0, 2000);
  } catch {
    return '';
  }
}

function safeApiUrl(value) {
  try {
    const url = new URL(String(value || ''), window.location.href);
    if (url.username || url.password || url.protocol !== 'https:' || !ALLOWED_API_ORIGINS.has(url.origin)) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function configuredProxyUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const url = safeApiUrl(raw);
  if (!url) {
    console.warn('Ignored an unsafe food-data proxy URL. Use same-origin HTTPS or add the trusted origin to the CSP and allowlist.');
    return '';
  }
  return url.href;
}

async function readBoundedJson(response, maxBytes = MAX_API_RESPONSE_BYTES) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error('API response exceeded the safe size limit');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error('API response exceeded the safe size limit');
  return JSON.parse(text);
}

function totalsFor(date = state.selectedDate) {
  const day = peekDay(date);
  const totals = day.foods.reduce((accumulator, entry) => {
    const quantity = toNumber(entry.quantity, 1, 0, 1000);
    ['calories','protein','carbs','fat','fiber','sugar','sodium'].forEach(key => {
      accumulator[key] += toNumber(entry[key], 0, 0, 1000000) * quantity;
    });
    return accumulator;
  }, {calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0});
  Object.keys(totals).forEach(key => { totals[key] = round(totals[key], 1); });
  return totals;
}

function effectiveCalorieGoal(day = getDay()) {
  return Math.max(1, state.profile.calorieGoal + (state.profile.eatBackExercise ? Number(day.exerciseCalories || 0) : 0));
}

function dateLabel(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const today = localDateKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  return date.toLocaleDateString(undefined, {month:'short',day:'numeric'});
}

function latestWeight() {
  return [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1) || null;
}

function syncCurrentWeight() {
  const latest = latestWeight();
  if (latest) state.profile.currentWeight = latest.weight;
}

function recordWeight(date, weight) {
  const value = toNumber(weight, NaN, 40, 1500);
  if (!isDateKey(date) || date > localDateKey() || !Number.isFinite(value)) return false;
  state.weights = state.weights.filter(entry => entry.date !== date);
  state.weights.push({date,weight:value});
  state.weights.sort((a, b) => a.date.localeCompare(b.date));
  syncCurrentWeight();
  return true;
}

function computeScore() {
  const totals = totalsFor();
  const day = getDay();
  const calorieGoal = effectiveCalorieGoal(day);
  let score = 0;
  const calorieRatio = totals.calories / calorieGoal;
  if (totals.calories > 0) score += calorieRatio >= .9 && calorieRatio <= 1.1 ? 25 : clamp((1 - Math.abs(1 - calorieRatio)) * 25, 0, 22);
  score += clamp(totals.protein / Math.max(1, state.profile.proteinGoal), 0, 1) * 25;
  score += clamp(day.water / 8, 0, 1) * 10;
  score += clamp(day.steps / 8000, 0, 1) * 10;
  score += clamp(day.workoutMinutes / 30, 0, 1) * 15;
  score += clamp(day.sleep / 7, 0, 1) * 15;
  return round(score);
}

function coachInsight() {
  const totals = totalsFor();
  const day = getDay();
  const goal = effectiveCalorieGoal(day);
  const proteinLeft = Math.max(0, state.profile.proteinGoal - totals.protein);
  const caloriesLeft = goal - totals.calories;
  if (totals.calories === 0) return {title:'Start with your first meal',body:'Logging one meal is enough to begin. PhactoryFit will update your remaining calories and protect your protein minimum automatically.',actions:['Log breakfast','Scan a barcode']};
  if (totals.calories > goal * 1.1) return {title:'No punishment needed',body:`You are ${round(Math.abs(caloriesLeft))} calories over today’s target. Keep logging accurately and return to the normal plan tomorrow instead of crash-restricting.`,actions:['Review diary']};
  if (proteinLeft > 50 && caloriesLeft < 500) return {title:'Protein needs attention',body:`You have about ${round(proteinLeft)} g of protein left with ${Math.max(0, round(caloriesLeft))} calories remaining. Choose a lean protein source before adding calorie-dense extras.`,actions:['Open protein rescue','Log food']};
  if (totals.protein >= state.profile.proteinGoal && totals.calories <= goal) return {title:'Protein floor secured',body:`You reached ${round(totals.protein)} g of protein and still have ${Math.max(0, round(caloriesLeft))} calories available. Finish the day based on hunger and training needs.`,actions:['Review diary']};
  if (day.sleep > 0 && day.sleep < 6) return {title:'Recovery may limit performance',body:`You logged ${day.sleep} hours of sleep. Keep training flexible today and prioritize a normal bedtime rather than forcing extra volume.`,actions:['Update sleep']};
  return {title:'You are on track',body:`You have ${Math.max(0, round(caloriesLeft))} calories and ${round(proteinLeft)} g of protein remaining. Your next meal should be built around protein first.`,actions:['Log food','Open protein rescue']};
}

function render() {
  const day = getDay();
  const totals = totalsFor();
  const profile = state.profile;
  const calorieGoal = effectiveCalorieGoal(day);
  const score = computeScore();
  const insight = coachInsight();

  $('#dateButton').textContent = dateLabel(state.selectedDate);
  const hour = new Date().getHours();
  $('#greeting').textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${profile.name}`;
  $('#coachHeadline').textContent = score >= 80 ? 'Strong consistency today. Keep the finish simple.' : score >= 45 ? 'A few focused actions can turn this into a strong day.' : 'Start small: log the next thing you eat or drink.';
  $('#dailyScore').textContent = score;
  const scorePercent = clamp(score, 0, 100);
  $('#scoreRing').style.setProperty('--score', `${scorePercent}%`);
  $('#scoreRing').style.setProperty('--score-blue', `${scorePercent * .48}%`);
  $('#scoreRing').style.setProperty('--score-purple', `${scorePercent * .78}%`);
  $('#scoreRing').setAttribute('aria-label', `Daily score: ${score} percent`);

  const caloriePercent = clamp(totals.calories / Math.max(1, calorieGoal) * 100, 0, 100);
  const proteinPercent = clamp(totals.protein / Math.max(1, profile.proteinGoal) * 100, 0, 100);
  const carbPercent = clamp(totals.carbs / Math.max(1, profile.carbGoal) * 100, 0, 100);
  const fatPercent = clamp(totals.fat / Math.max(1, profile.fatGoal) * 100, 0, 100);
  const calorieOver = totals.calories > calorieGoal;
  const proteinOver = totals.protein > profile.proteinGoal;
  const carbOver = totals.carbs > profile.carbGoal;
  const fatOver = totals.fat > profile.fatGoal;

  setText('caloriesConsumed', round(totals.calories));
  setText('calorieGoal', round(calorieGoal));
  setText('caloriesRemaining', calorieOver ? `${round(totals.calories - calorieGoal)} over` : `${round(calorieGoal - totals.calories)} left`);
  setText('caloriePercent', `${round(caloriePercent)}%`);
  setText('calorieStatus', calorieOver ? 'Over goal' : 'On track');
  $('#calorieBar').style.width = `${caloriePercent}%`;
  setMetricGauge('calorieGauge', caloriePercent, `Calories: ${round(caloriePercent)} percent of goal`, calorieOver);

  setText('proteinConsumed', round(totals.protein));
  setText('proteinGoal', profile.proteinGoal);
  setText('proteinRemaining', proteinOver ? `${round(totals.protein - profile.proteinGoal)}g over` : `${Math.max(0, round(profile.proteinGoal - totals.protein))}g left`);
  setText('proteinPercent', `${round(proteinPercent)}%`);
  setText('proteinStatus', proteinOver ? 'Goal secured' : 'On track');
  $('#proteinBar').style.width = `${proteinPercent}%`;
  setMetricGauge('proteinGauge', proteinPercent, `Protein: ${round(proteinPercent)} percent of goal`, false);

  setText('carbConsumed', round(totals.carbs));
  setText('carbGoalValue', profile.carbGoal);
  setText('carbRemaining', carbOver ? `${round(totals.carbs - profile.carbGoal)}g over` : `${Math.max(0, round(profile.carbGoal - totals.carbs))}g left`);
  setText('carbPercent', `${round(carbPercent)}%`);
  setText('carbStatus', carbOver ? 'Over goal' : 'On track');
  setMetricGauge('carbGauge', carbPercent, `Carbohydrates: ${round(carbPercent)} percent of goal`, carbOver);

  setText('fatConsumed', round(totals.fat));
  setText('fatGoalValue', profile.fatGoal);
  setText('fatRemaining', fatOver ? `${round(totals.fat - profile.fatGoal)}g over` : `${Math.max(0, round(profile.fatGoal - totals.fat))}g left`);
  setText('fatPercent', `${round(fatPercent)}%`);
  setText('fatStatus', fatOver ? 'Over goal' : 'On track');
  setMetricGauge('fatGauge', fatPercent, `Fat: ${round(fatPercent)} percent of goal`, fatOver);
  setText('waterValue', round(day.water, 1));
  setText('stepsValue', Math.round(day.steps).toLocaleString());
  setText('workoutValue', round(day.workoutMinutes));
  setText('sleepValue', round(day.sleep, 2));
  setText('insightTitle', insight.title);
  setText('insightBody', insight.body);
  $('#coachActions').innerHTML = insight.actions.map(action => `<button class="chip" data-coach-action="${escapeHtml(action)}">${escapeHtml(action)}</button>`).join('');

  renderDiary();
  renderProgress();
  renderCoach();
  populateSettings();
  initializeMotionEffects();
  saveState();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setMetricGauge(id, percent, label, isOver = false) {
  const gauge = document.getElementById(id);
  if (!gauge) return;
  const normalized = clamp(percent, 0, 100);
  gauge.style.setProperty('--value', `${normalized}%`);
  gauge.style.setProperty('--angle', `${normalized * 3.6}deg`);
  gauge.classList.toggle('over-goal', Boolean(isOver));
  gauge.setAttribute('aria-label', label);
}

let motionObserver = null;

function initializeMotionEffects() {
  const selector = '.reveal-item, .view .section-card, .view .meal-section, .view .action-card, .view .stats-row article, .view .coach-card, .view .coach-item';
  const items = [...document.querySelectorAll(selector)].filter(item => item.dataset.motionBound !== 'true');
  if (!items.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(item => {
      item.dataset.motionBound = 'true';
      item.classList.add('is-visible');
    });
    return;
  }
  document.documentElement.classList.add('motion-ready');
  if (!motionObserver) {
    motionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        motionObserver.unobserve(entry.target);
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
  }
  items.forEach((item, index) => {
    item.dataset.motionBound = 'true';
    item.classList.add('scroll-reveal');
    item.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 45}ms`);
    motionObserver.observe(item);
  });
}

function renderDiary() {
  const day = getDay();
  $('#mealSections').innerHTML = MEALS.map(meal => {
    const entries = day.foods
      .filter(food => food.meal === meal)
      .map((entry, index) => ({entry,index}))
      .sort((a, b) => {
        const aTime = normalizeLoggedTime(a.entry.loggedTime) || '99:99';
        const bTime = normalizeLoggedTime(b.entry.loggedTime) || '99:99';
        return aTime.localeCompare(bTime) || a.index - b.index;
      })
      .map(item => item.entry);
    const calories = round(entries.reduce((sum, entry) => sum + entry.calories * entry.quantity, 0));
    const body = entries.length
      ? entries.map(entry => `<div class="food-row"><div class="food-row-copy"><h4>${escapeHtml(entry.name)}</h4><p><span class="food-time">${escapeHtml(formatLoggedTime(entry.loggedTime))}</span> · ${escapeHtml(entry.serving)} × ${round(entry.quantity, 2)} · ${round(entry.protein * entry.quantity)}g protein</p></div><div class="food-row-summary"><strong>${round(entry.calories * entry.quantity)} kcal</strong><div class="food-row-actions"><button type="button" class="edit-food" data-edit-food="${escapeHtml(entry.logId)}" aria-label="Edit ${escapeHtml(entry.name)}">Edit</button><button type="button" class="remove-food" data-remove-food="${escapeHtml(entry.logId)}" aria-label="Delete ${escapeHtml(entry.name)}">Delete</button></div></div></div>`).join('')
      : `<button type="button" class="empty-meal" data-add-meal="${meal}">+ Add ${meal.toLowerCase()}</button>`;
    return `<section class="meal-section"><div class="meal-header"><div><span>${meal}</span><small>${mealPeriodLabel(meal)}</small></div><small>${calories} kcal</small></div>${body}</section>`;
  }).join('');
}

function renderProgress() {
  const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = weights.at(-1)?.weight ?? state.profile.currentWeight;
  const first = weights[0]?.weight ?? latest;
  setText('currentWeight', `${round(latest, 1)} lb`);
  setText('goalWeight', `${round(state.profile.goalWeight, 1)} lb`);
  const change = round(latest - first, 1);
  setText('weightChange', `${change > 0 ? '+' : ''}${change} lb`);
  const recommendation = adaptiveRecommendation(weights);
  setText('adaptiveRecommendation', recommendation.body);
  setText('trendLabel', recommendation.label);
  renderWeightChart(weights.slice(-30));
  renderConsistency();
}

function linearWeeklyRate(weights) {
  if (weights.length < 2) return 0;
  const start = new Date(`${weights[0].date}T12:00:00`).getTime();
  const points = weights.map(entry => ({x:(new Date(`${entry.date}T12:00:00`).getTime() - start) / 86400000,y:entry.weight}));
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (!denominator) return 0;
  const slope = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator;
  return slope * 7;
}

function adaptiveRecommendation(weights) {
  if (weights.length < 4) return {label:'Need data',body:'Log at least four morning weigh-ins and keep your food diary reasonably complete. No calorie adjustment will be suggested until the trend is meaningful.'};
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-14);
  const spanDays = (new Date(`${recent.at(-1).date}T12:00:00`) - new Date(`${recent[0].date}T12:00:00`)) / 86400000;
  if (spanDays < 5) return {label:'Learning',body:'Your weigh-ins cover fewer than five days. Keep calories stable while the trend engine learns your normal fluctuations.'};
  const weeklyRate = linearWeeklyRate(recent);
  const desired = Number(state.profile.weeklyGoal);
  const adherence = diaryAdherence(7);
  const rateText = `${weeklyRate > 0 ? '+' : ''}${round(weeklyRate, 2)} lb/week`;
  if (adherence < .6) return {label:'Hold calories',body:`Your estimated trend is ${rateText}, but fewer than 60% of recent days have usable nutrition logs. Keep the current target until the input data is more consistent.`};
  if (Math.abs(weeklyRate - desired) <= .35) return {label:'On target',body:`Your estimated trend is ${rateText}, close to the ${desired} lb/week plan. Keep calories at ${state.profile.calorieGoal}.`};
  if (desired < 0 && weeklyRate > desired + .35) return {label:'Review −100 kcal',body:`Your estimated trend is ${rateText}, slower than the ${desired} lb/week goal. A cautious option is reducing the daily target by about 100 calories, then reassessing after another week.`};
  if (desired < 0 && weeklyRate < desired - .35) return {label:'Review +100 kcal',body:`Your estimated trend is ${rateText}, faster than the ${desired} lb/week goal. A cautious option is adding about 100 calories per day to improve sustainability and training recovery.`};
  return {label:'Hold calories',body:`Your estimated trend is ${rateText}. Keep the current target for another week unless performance, hunger, or recovery is deteriorating.`};
}

function diaryAdherence(daysBack = 7) {
  let usable = 0;
  // Use completed calendar days. Counting an unfinished current day can falsely
  // suppress the weekly recommendation early in the morning.
  for (let index = 1; index <= daysBack; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const totals = totalsFor(localDateKey(date));
    if (totals.calories >= state.profile.calorieGoal * .6) usable += 1;
  }
  return usable / daysBack;
}

function renderConsistency() {
  const nodes = [];
  for (let index = 6; index >= 0; index -= 1) {
    const dateValue = new Date();
    dateValue.setDate(dateValue.getDate() - index);
    const date = localDateKey(dateValue);
    const totals = totalsFor(date);
    const hitProtein = totals.protein >= state.profile.proteinGoal;
    const logged = totals.calories >= state.profile.calorieGoal * .6;
    const className = hitProtein && logged ? 'good' : logged ? 'partial' : '';
    nodes.push(`<div class="day-dot ${className}"><span title="${date}"></span><small>${new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {weekday:'narrow'})}</small></div>`);
  }
  $('#consistencyGrid').innerHTML = nodes.join('');
}

function renderWeightChart(weights) {
  const canvas = $('#weightChart');
  const context = canvas?.getContext?.('2d');
  if (!canvas || !context) return;
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 700;
  const cssHeight = Math.min(320, cssWidth * .46);
  canvas.width = Math.max(1, Math.round(cssWidth * ratio));
  canvas.height = Math.max(1, Math.round(cssHeight * ratio));
  context.setTransform?.(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  if (weights.length < 2) {
    context.fillStyle = '#8a929e';
    context.font = '14px sans-serif';
    context.textAlign = 'center';
    context.fillText('Add more weigh-ins to see your trend', cssWidth / 2, cssHeight / 2);
    return;
  }
  const values = weights.map(entry => entry.weight);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max - min < 2) { min -= 1; max += 1; }
  const padding = {l:38,r:18,t:20,b:30};
  const firstTime = new Date(`${weights[0].date}T12:00:00`).getTime();
  const lastTime = new Date(`${weights.at(-1).date}T12:00:00`).getTime();
  const dateSpan = Math.max(1, lastTime - firstTime);
  const x = entry => padding.l + (new Date(`${entry.date}T12:00:00`).getTime() - firstTime) * (cssWidth - padding.l - padding.r) / dateSpan;
  const y = value => padding.t + (max - value) * (cssHeight - padding.t - padding.b) / (max - min);
  context.strokeStyle = '#e3e7eb';
  context.lineWidth = 1;
  for (let index = 0; index < 4; index += 1) {
    const yPosition = padding.t + index * (cssHeight - padding.t - padding.b) / 3;
    context.beginPath();
    context.moveTo(padding.l, yPosition);
    context.lineTo(cssWidth - padding.r, yPosition);
    context.stroke();
  }
  context.strokeStyle = '#111827';
  context.lineWidth = 3;
  context.lineJoin = 'round';
  context.beginPath();
  weights.forEach((entry, index) => index ? context.lineTo(x(entry), y(entry.weight)) : context.moveTo(x(entry), y(entry.weight)));
  context.stroke();
  context.fillStyle = '#75f0ae';
  weights.forEach((entry, index) => {
    context.beginPath();
    context.arc(x(entry), y(entry.weight), 4, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = '#6b7280';
  context.font = '11px sans-serif';
  context.textAlign = 'left';
  context.fillText(`${round(max, 1)}`, 2, padding.t + 4);
  context.fillText(`${round(min, 1)}`, 2, cssHeight - padding.b + 4);
  context.textAlign = 'center';
  context.fillText(new Date(`${weights[0].date}T12:00:00`).toLocaleDateString(undefined, {month:'short',day:'numeric'}), x(weights[0]), cssHeight - 8);
  context.fillText(new Date(`${weights.at(-1).date}T12:00:00`).toLocaleDateString(undefined, {month:'short',day:'numeric'}), x(weights.at(-1)), cssHeight - 8);
  canvas.setAttribute('aria-label', `Weight trend from ${round(weights[0].weight, 1)} to ${round(weights.at(-1).weight, 1)} pounds across ${weights.length} weigh-ins.`);
}

function renderCoach() {
  const totals = totalsFor();
  const day = getDay();
  const insight = coachInsight();
  setText('coachMainTitle', insight.title);
  setText('coachMainBody', insight.body);
  const proteinDensity = totals.calories ? round(totals.protein / totals.calories * 100, 1) : 0;
  const feed = [
    {title:'Protein density',body:totals.calories ? `Today’s food provides ${proteinDensity} g of protein per 100 calories. For a high-protein cut, keeping this near 8–10 g can make the target easier.` : 'Log food to calculate protein density.'},
    {title:'Exercise calories',body:state.profile.eatBackExercise ? `Exercise calories are currently added to your food budget. Today that changes the target by ${day.exerciseCalories} calories.` : 'Exercise calories are not automatically added to your food budget, reducing the risk of double-counting wearable estimates.'},
    {title:'Recovery check',body:day.sleep ? `${day.sleep} hours of sleep logged. ${day.sleep >= 7 ? 'Recovery input is in a solid range.' : 'Consider lowering workout intensity if performance or coordination feels off.'}` : 'No sleep entry yet. Logging it helps the coach distinguish nutrition problems from recovery problems.'}
  ];
  $('#coachFeed').innerHTML = feed.map(item => `<article class="coach-item"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.body)}</p></article>`).join('');
  const left = Math.max(0, state.profile.proteinGoal - totals.protein);
  $('#proteinRescue').innerHTML = rescueFoods.map(food => `<button type="button" class="rescue-item" data-rescue-food="${food.foodId}"><span><strong>${escapeHtml(food.label)}</strong><small>${food.calories} calories</small></span><strong>${food.protein}g</strong></button>`).join('') + (left ? `<p class="fine-print">You have approximately ${round(left)} g remaining today.</p>` : '<p class="fine-print">Protein minimum reached.</p>');
}

function populateSettings() {
  const form = $('#settingsForm');
  if (!form) return;
  Object.entries(state.profile).forEach(([key, value]) => {
    const input = form.elements[key];
    if (!input) return;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value;
  });
}

function navigate(view) {
  if (!VALID_VIEWS.has(view)) return;
  $$('.view').forEach(element => element.classList.toggle('active', element.dataset.view === view));
  $$('.bottom-nav button').forEach(button => button.classList.toggle('active', button.dataset.viewTarget === view));
  window.scrollTo?.({top:0,behavior:'smooth'});
  $('#app')?.focus({preventScroll:true});
  if (view === 'progress') setTimeout(renderProgress, 30);
}

function setBarcodeCameraButton(scanning) {
  const button = $('#cameraBarcode');
  if (!button) return;
  button.disabled = false;
  button.textContent = scanning ? 'Stop camera' : 'Use camera';
  button.setAttribute('aria-pressed', scanning ? 'true' : 'false');
}

function setBarcodeCameraMode(active) {
  modal.classList.toggle('camera-active', Boolean(active));
  const entry = $('#barcodeEntryControls');
  if (entry) entry.setAttribute('aria-hidden', active ? 'true' : 'false');
}

function stopBarcodeCamera() {
  barcodeScanSession += 1;
  barcodeCameraStarting = false;
  barcodeDecodeRunning = false;
  if (cameraVisibilityTimer) clearTimeout(cameraVisibilityTimer);
  cameraVisibilityTimer = null;
  if (activeBarcodeTimeout) clearTimeout(activeBarcodeTimeout);
  if (activeBarcodeLoop) clearTimeout(activeBarcodeLoop);
  activeBarcodeTimeout = null;
  activeBarcodeLoop = null;
  try { activeBarcodeControls?.stop?.(); } catch (error) { console.warn('Barcode controls did not stop cleanly', error); }
  activeBarcodeControls = null;
  activeBarcodeReader = null;
  barcodeTorchOn = false;
  barcodeCandidate = {code:'',seenAt:0,count:0};
  activeMediaStream?.getTracks?.().forEach(track => track.stop());
  activeMediaStream = null;
  const video = $('#barcodeVideo');
  if (video) {
    video.pause?.();
    video.srcObject = null;
  }
  const shell = $('#barcodeCameraShell');
  if (shell) shell.hidden = true;
  setBarcodeCameraMode(false);
  const resumeButton = $('#resumeBarcodePreview');
  if (resumeButton) resumeButton.hidden = true;
  const torchButton = $('#barcodeTorch');
  if (torchButton) {
    torchButton.hidden = true;
    torchButton.textContent = 'Turn on light';
    torchButton.setAttribute('aria-pressed', 'false');
  }
  const switchButton = $('#barcodeSwitchCamera');
  if (switchButton) switchButton.hidden = true;
  setBarcodeCameraButton(false);
}

function openModal(type, options = {}) {
  const content = $('#modalContent');
  if (foodSearchTimer) clearTimeout(foodSearchTimer);
  foodSearchTimer = null;
  foodSearchRequest += 1;
  const configurations = {
    food:['Nutrition','Add food'],barcode:['Fast logging','Barcode lookup'],workout:['Training','Log workout'],weight:['Progress','Log weight'],water:['Hydration','Add water'],habits:['Daily inputs','Steps and sleep'],date:['Diary date','Choose a day'],editFood:['Food diary','Edit entry']
  };
  if (!configurations[type]) return;
  stopBarcodeCamera();
  modalContext = {meal:MEALS.includes(options.meal) ? options.meal : 'Breakfast',logId:String(options.logId || '')};
  const [eyebrow, title] = configurations[type];
  setText('modalEyebrow', eyebrow);
  setText('modalTitle', title);
  if (type === 'food') content.innerHTML = foodModal(modalContext.meal);
  if (type === 'barcode') content.innerHTML = barcodeModal(modalContext.meal);
  if (type === 'workout') content.innerHTML = workoutModal();
  if (type === 'weight') content.innerHTML = weightModal();
  if (type === 'water') content.innerHTML = waterModal();
  if (type === 'habits') content.innerHTML = habitsModal();
  if (type === 'date') content.innerHTML = dateModal();
  if (type === 'editFood') {
    const entry = loggedFoodById(options.logId);
    if (!entry) { toast('That diary entry could not be found.'); return; }
    content.innerHTML = editDiaryFoodModal(entry);
  }
  if (!modal.open) modal.showModal();
  if (type === 'food') {
    onlineFoodResults = [];
    onlineFoodQuery = '';
    onlineFoodLoading = false;
    onlineFoodError = '';
    modalContext.foodSearchQuery = '';
    $('#foodSearch')?.focus();
    renderFoodResults('');
  }
}

function mealOptions(selected) {
  return MEALS.map(meal => `<option ${meal === selected ? 'selected' : ''}>${meal}</option>`).join('');
}

function mealPeriodOptions(selected) {
  const labels = {Breakfast:'Morning / Breakfast', Lunch:'Afternoon / Lunch', Dinner:'Evening / Dinner', Snacks:'Snacks'};
  return MEALS.map(meal => `<option value="${meal}" ${meal === selected ? 'selected' : ''}>${labels[meal]}</option>`).join('');
}

function editDiaryFoodModal(entry) {
  const timeValue = normalizeLoggedTime(entry.loggedTime);
  return `<div class="edit-food-heading"><span class="badge">Diary entry</span><h3>${escapeHtml(entry.name)}</h3><p>${escapeHtml(entry.brand)} · ${escapeHtml(entry.serving)} per serving</p></div><form id="editDiaryFoodForm" class="modal-form edit-diary-food-form"><label>Meal period<select name="meal">${mealPeriodOptions(entry.meal)}</select></label><label>Logged time<input name="loggedTime" type="time" value="${escapeHtml(timeValue)}" step="60"></label><p class="form-note">Use the meal period to move this item between morning, afternoon, evening, or snacks. The exact time controls its order inside that section.</p><label>Servings consumed<input id="editFoodQuantityInput" name="quantity" type="number" inputmode="decimal" step="0.01" min="0.01" max="1000" value="${round(entry.quantity, 2)}" required></label><div class="serving-quick-picks" aria-label="Quick serving amounts"><button type="button" data-serving-value="0.5">½</button><button type="button" data-serving-value="1">1</button><button type="button" data-serving-value="1.5">1½</button><button type="button" data-serving-value="2">2</button></div>${servingTotalsMarkup(entry, entry.quantity)}<input name="logId" type="hidden" value="${escapeHtml(entry.logId)}"><div class="edit-food-actions"><button class="primary-button" type="submit">Save changes</button><button class="danger-button" type="button" data-delete-diary-food="${escapeHtml(entry.logId)}">Delete entry</button></div></form>`;
}

function foodModal(meal) {
  return `<div class="modal-form"><label>Meal<select id="foodMeal">${mealOptions(meal)}</select></label><label>Search foods, brands, or restaurants<input id="foodSearch" type="search" maxlength="120" placeholder="McDonald’s breakfast, Egg McMuffin, Doritos…" autocomplete="off" enterkeyhint="search" spellcheck="false"></label><div class="restaurant-quick-search" aria-label="Popular restaurant searches"><button type="button" data-food-search-query="McDonald's breakfast">McDonald’s breakfast</button><button type="button" data-food-search-query="Chick-fil-A breakfast">Chick-fil-A</button><button type="button" data-food-search-query="Starbucks breakfast">Starbucks</button><button type="button" data-food-search-query="Taco Bell">Taco Bell</button></div><p class="form-note food-search-help">Restaurant menu matches appear instantly from the audited U.S. catalog. Packaged-food results are searched online after you pause typing.</p><div class="inline-actions"><button type="button" class="secondary-button" id="createFoodButton">Create custom food</button></div><div id="foodResults" class="search-results" aria-live="polite"></div></div>`;
}

function barcodeModal(meal) {
  return `<div class="modal-form"><div id="barcodeEntryControls" class="barcode-entry-controls"><p class="form-note">Scan a UPC or EAN with the rear camera, take a clear barcode photo, or type the number. PhactoryFit automatically generates nutrition when a matching product is found.</p><label>Meal<select id="barcodeMeal">${mealOptions(meal)}</select></label><label>Barcode<input id="barcodeInput" inputmode="numeric" autocomplete="off" enterkeyhint="search" maxlength="18" placeholder="e.g. 049000050103"></label><div class="inline-actions"><button type="button" class="primary-button" id="lookupBarcode">Look up</button><button type="button" class="secondary-button" id="cameraBarcode" aria-pressed="false">Use camera</button></div><label class="secondary-button file-label barcode-photo-button">Take barcode photo<input id="barcodePhotoInput" type="file" accept="image/*" capture="environment"></label></div><div id="barcodeCameraShell" class="barcode-camera-shell" hidden><video id="barcodeVideo" playsinline webkit-playsinline muted autoplay aria-label="Live barcode camera preview"></video><div class="barcode-scan-guide" aria-hidden="true"><span>Align barcode here</span></div><div class="barcode-camera-controls"><button type="button" id="resumeBarcodePreview" class="camera-control" hidden>Start preview</button><button type="button" id="barcodeTorch" class="camera-control" hidden>Turn on light</button><button type="button" id="barcodeSwitchCamera" class="camera-control" hidden>Switch camera</button><button type="button" id="barcodeStopCamera" class="camera-control">Close camera</button></div></div><div id="barcodeResult" role="status" aria-live="polite"></div></div>`;
}

function workoutModal() {
  return `<form id="workoutForm" class="modal-form"><label>Workout name<input name="name" value="Strength training" maxlength="200" required></label><div class="two-col"><label>Minutes<input name="minutes" type="number" min="1" max="1440" value="45" required></label><label>Estimated calories<input name="calories" type="number" min="0" max="20000" value="250"></label></div><label>Notes<input name="notes" maxlength="2000" placeholder="Upper body, run, cycling…"></label><button class="primary-button" type="submit">Save workout</button></form>`;
}

function weightModal() {
  const latest = latestWeight()?.weight || state.profile.currentWeight;
  return `<form id="weightForm" class="modal-form"><label>Date<input name="date" type="date" max="${localDateKey()}" value="${state.selectedDate > localDateKey() ? localDateKey() : state.selectedDate}" required></label><label>Weight (lb)<input name="weight" type="number" min="40" max="1500" step="0.1" value="${latest}" required></label><button class="primary-button" type="submit">Save weigh-in</button></form>`;
}

function waterModal() {
  return `<form id="waterForm" class="modal-form"><label>Cups to add or remove<input name="cups" type="number" step="0.5" min="-20" max="100" value="1" required></label><button class="primary-button" type="submit">Update water</button></form>`;
}

function habitsModal() {
  const day = getDay();
  return `<form id="habitsForm" class="modal-form"><label>Steps<input name="steps" type="number" min="0" max="1000000" value="${day.steps}" required></label><label>Sleep (hours)<input name="sleep" type="number" min="0" max="24" step="0.25" value="${day.sleep}" required></label><button class="primary-button" type="submit">Save habits</button></form>`;
}

function dateModal() {
  return `<form id="dateForm" class="modal-form"><label>Date<input name="date" type="date" value="${state.selectedDate}" required></label><button class="primary-button" type="submit">Open day</button></form>`;
}

function foodSearchResultButton(food, kind = 'local') {
  const image = food.imageUrl ? `<img src="${escapeHtml(food.imageUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '';
  const hasProtein = nutrientAvailable(food, 'protein');
  const nutritionSummary = `${round(food.calories)} kcal${hasProtein ? ` · ${round(food.protein, 1)}g protein` : ' · calories only'}`;
  const fit = food.restaurant ? smartRestaurantFit(food) : null;
  const fitBadge = fit ? `<span class="restaurant-fit-badge ${escapeHtml(fit.tone)}">${escapeHtml(fit.label)}</span>` : '';
  return `<button type="button" class="search-result${kind === 'online' ? ' online-food-result' : ''}${food.restaurant ? ' restaurant-food-result' : ''}" data-food-id="${escapeHtml(food.id)}">${image}<span class="search-result-copy"><span class="search-result-title"><strong>${escapeHtml(food.name)}</strong>${fitBadge}</span><small>${escapeHtml(food.brand)} · ${escapeHtml(food.serving)} · ${nutritionSummary}</small></span></button>`;
}

function renderFoodResults(query) {
  const target = $('#foodResults');
  if (!target) return;
  const normalizedQuery = normalizeSearchText(query);
  modalContext.foodSearchQuery = String(query || '');
  const recentMap = new Map(state.recentFoodIds.map((id, index) => [id, index]));
  const tokens = foodSearchTokens(query);
  const localFoods = allFoods().filter(food => {
    const haystack = normalizeSearchText([food.name, food.brand, ...(food.aliases || [])].join(' '));
    return !normalizedQuery || (!tokens.length ? haystack.includes(normalizedQuery) : tokens.every(token => haystack.includes(token)));
  });
  localFoods.sort((first, second) => (recentMap.get(first.id) ?? 999) - (recentMap.get(second.id) ?? 999) || first.name.localeCompare(second.name));

  const restaurantMatches = restaurantSearchResults(query);
  const recentRestaurantFoods = !normalizedQuery ? state.recentFoodIds.map(findFoodById).filter(food => food?.restaurant).slice(0, 6) : [];
  const localKeys = new Set([...localFoods, ...restaurantMatches, ...recentRestaurantFoods].map(food => food.barcode || `${food.brand}|${food.name}`.toLowerCase()));
  const onlineFoods = normalizedQuery && onlineFoodQuery === String(query || '').trim().toLowerCase()
    ? onlineFoodResults.filter(food => !localKeys.has(food.barcode || `${food.brand}|${food.name}`.toLowerCase()))
    : [];

  const sections = [];
  if (recentRestaurantFoods.length) {
    sections.push(`<div class="food-result-section restaurant-food-section"><div class="food-result-heading"><strong>Recent restaurant items</strong><small>${escapeHtml(restaurantLocationLabel())}</small></div>${recentRestaurantFoods.map(food => foodSearchResultButton(food, 'restaurant')).join('')}</div>`);
  }
  if (restaurantMatches.length) {
    sections.push(`<div class="food-result-section restaurant-food-section"><div class="food-result-heading"><strong>Restaurant menus</strong><small>${escapeHtml(restaurantLocationLabel())} · ${restaurantMatches.length} match${restaurantMatches.length === 1 ? '' : 'es'}</small></div><div class="restaurant-search-note">Results use search relevance and today’s remaining calories and protein; broad chain or meal searches place stronger plan-fit choices first. This is planning guidance, not medical advice.</div>${restaurantMatches.slice(0, 40).map(food => foodSearchResultButton(food, 'restaurant')).join('')}<p class="food-search-attribution">Standard U.S. menu nutrition. Availability, recipes, portions, and customizations can vary by restaurant.</p></div>`);
  }
  if (localFoods.length) {
    sections.push(`<div class="food-result-section"><div class="food-result-heading"><strong>${normalizedQuery ? 'Saved and common foods' : 'Recent and common foods'}</strong><small>${localFoods.length} result${localFoods.length === 1 ? '' : 's'}</small></div>${localFoods.slice(0, normalizedQuery ? 12 : 30).map(food => foodSearchResultButton(food)).join('')}</div>`);
  }
  if (normalizedQuery.length >= 2) {
    if (onlineFoodLoading && onlineFoodQuery === String(query || '').trim().toLowerCase()) {
      sections.push('<div class="food-search-status"><span class="search-spinner" aria-hidden="true"></span><span>Searching packaged foods and brands…</span></div>');
    } else if (onlineFoods.length) {
      sections.push(`<div class="food-result-section online-food-section"><div class="food-result-heading"><strong>Packaged foods</strong><small>Open Food Facts</small></div>${onlineFoods.slice(0, 24).map(food => foodSearchResultButton(food, 'online')).join('')}<p class="food-search-attribution">Nutrition is community-contributed. Compare it with the package label.</p></div>`);
    } else if (onlineFoodError && onlineFoodQuery === String(query || '').trim().toLowerCase()) {
      sections.push(`<div class="food-search-status error"><span>${escapeHtml(onlineFoodError)}</span><button type="button" class="text-button" id="retryFoodSearch">Retry</button></div>`);
    } else if (onlineFoodQuery === String(query || '').trim().toLowerCase() && !restaurantMatches.length) {
      sections.push('<p class="form-note">No restaurant or packaged-food match was found. Try the restaurant plus item name, or create a custom food.</p>');
    }
  }
  target.innerHTML = sections.join('') || '<p class="form-note">Search a restaurant, menu item, brand, or saved food. Type at least two letters for online packaged-food search.</p>';
}
function productNutrientExists(product, names) {
  const nutrition = product?.nutriments || product?.nutrition || {};
  return names.some(name => [
    product?.[name],
    nutrition[`${name}_serving`],
    nutrition[`${name}_100g`],
    nutrition[name]
  ].some(value => Number.isFinite(Number(value))));
}

function productHasNutrition(product) {
  const hasCalories = productNutrientExists(product, ['calories','energy-kcal']) || productNutrientExists(product, ['energy-kj']);
  return hasCalories
    && productNutrientExists(product, ['protein','proteins'])
    && productNutrientExists(product, ['carbs','carbohydrates'])
    && productNutrientExists(product, ['fat']);
}

function foodSearchBrandTag(query) {
  return String(query || '').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function rememberFoodSearch(query, foods) {
  onlineFoodSearchCache.set(query, foods);
  if (onlineFoodSearchCache.size > 20) onlineFoodSearchCache.delete(onlineFoodSearchCache.keys().next().value);
}

async function fetchOnlineFoodSearch(query) {
  const normalized = String(query || '').trim().slice(0, MAX_FOOD_SEARCH_LENGTH);
  if (normalized.length < 2) return [];
  const cached = onlineFoodSearchCache.get(normalized.toLowerCase());
  if (cached) return cached;
  const fields = 'code,product_name,brands,serving_size,serving_quantity,quantity,nutriments,image_front_small_url,image_small_url,popularity_key';
  const proxy = configuredProxyUrl(window.PHACTORYFIT_CONFIG?.offSearchProxyUrl);
  const urls = [];
  if (proxy) urls.push(`${proxy}${proxy.includes('?') ? '&' : '?'}q=${encodeURIComponent(normalized)}`);
  urls.push(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(normalized)}&search_simple=1&action=process&json=1&page=1&page_size=24&sort_by=unique_scans_n&fields=${encodeURIComponent(fields)}&app_name=PhactoryFit&app_version=${encodeURIComponent(APP_VERSION)}`);
  const brandTag = foodSearchBrandTag(normalized);
  if (brandTag) urls.push(`https://world.openfoodfacts.org/api/v2/search?brands_tags=${encodeURIComponent(brandTag)}&page=1&page_size=24&sort_by=popularity_key&fields=${encodeURIComponent(fields)}&app_name=PhactoryFit&app_version=${encodeURIComponent(APP_VERSION)}`);

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, 14000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await readBoundedJson(response);
      const products = Array.isArray(data?.products) ? data.products : Array.isArray(data?.hits) ? data.hits.map(hit => hit._source || hit) : [];
      const seen = new Set();
      const foods = products.filter(product => product && productHasNutrition(product)).map(product => {
        const code = String(product.code || product._id || product.id || '').replace(/\D/g, '');
        if (!/^\d{8,14}$/.test(code) || seen.has(code)) return null;
        seen.add(code);
        const food = normalizeOpenFoodFactsProduct(product, code);
        if (food) food.imageUrl = sanitizeImageUrl(product.image_front_small_url || product.image_small_url || '');
        return food;
      }).filter(Boolean);
      if (foods.length || url === urls.at(-1)) {
        rememberFoodSearch(normalized.toLowerCase(), foods);
        return foods;
      }
    } catch (error) {
      lastError = error;
      console.warn('Online food search source failed', error);
    }
  }
  throw lastError || new Error('Food search unavailable');
}

async function runOnlineFoodSearch(query, force = false) {
  const normalized = String(query || '').trim().slice(0, MAX_FOOD_SEARCH_LENGTH).toLowerCase();
  const currentInput = $('#foodSearch');
  if (!currentInput || String(currentInput.value || '').trim().toLowerCase() !== normalized) return;
  if (normalized.length < 2 || hasStrongRestaurantIntent(query)) {
    onlineFoodResults = [];
    onlineFoodQuery = normalized;
    onlineFoodLoading = false;
    onlineFoodError = '';
    renderFoodResults(query);
    return;
  }
  const request = ++foodSearchRequest;
  onlineFoodQuery = normalized;
  onlineFoodLoading = true;
  onlineFoodError = '';
  if (force) onlineFoodSearchCache.delete(normalized);
  renderFoodResults(query);
  try {
    const foods = await fetchOnlineFoodSearch(query);
    if (request !== foodSearchRequest || String($('#foodSearch')?.value || '').trim().toLowerCase() !== normalized) return;
    onlineFoodResults = foods;
  } catch (error) {
    if (request !== foodSearchRequest) return;
    onlineFoodResults = [];
    onlineFoodError = navigator.onLine === false ? 'You appear to be offline. Saved foods are still available.' : 'The online food database could not be reached.';
  } finally {
    if (request === foodSearchRequest) {
      onlineFoodLoading = false;
      renderFoodResults(query);
    }
  }
}

function scheduleOnlineFoodSearch(query) {
  if (foodSearchTimer) clearTimeout(foodSearchTimer);
  foodSearchRequest += 1;
  const normalized = String(query || '').trim().slice(0, MAX_FOOD_SEARCH_LENGTH);
  onlineFoodResults = [];
  onlineFoodQuery = normalized.toLowerCase();
  onlineFoodLoading = normalized.length >= 2 && !hasStrongRestaurantIntent(query);
  onlineFoodError = '';
  renderFoodResults(query);
  if (normalized.length < 2 || hasStrongRestaurantIntent(query)) {
    onlineFoodLoading = false;
    renderFoodResults(query);
    return;
  }
  foodSearchTimer = setTimeout(() => void runOnlineFoodSearch(normalized), 550);
}

function nutritionFactsMarkup(food, footnote = 'Values are shown per listed serving. Compare community data with the package or restaurant listing.') {
  const fact = (nutrient, label, unit = 'g', indent = false) => nutrientAvailable(food, nutrient) ? nutritionFactRow(label, food[nutrient], unit, indent) : '';
  const calorieValue = nutrientAvailable(food, 'calories') ? round(food.calories) : '—';
  return `<section class="nutrition-label" aria-label="Nutrition facts for ${escapeHtml(food.name)}"><div class="nutrition-label-title">Nutrition Facts</div><div class="nutrition-serving"><span>Serving size</span><strong>${escapeHtml(food.serving)}</strong></div><div class="nutrition-heavy-rule"></div><div class="nutrition-amount">Amount per serving</div><div class="nutrition-calories"><span>Calories</span><strong>${calorieValue}</strong></div><div class="nutrition-medium-rule"></div>${fact('fat','Total Fat')}${fact('saturatedFat','Saturated Fat','g',true)}${fact('transFat','Trans Fat','g',true)}${fact('cholesterol','Cholesterol','mg')}${fact('sodium','Sodium','mg')}${fact('carbs','Total Carbohydrate')}${fact('fiber','Dietary Fiber','g',true)}${fact('sugar','Total Sugars','g',true)}${fact('protein','Protein')}<div class="nutrition-heavy-rule bottom"></div><p class="nutrition-label-footnote">${escapeHtml(footnote)}</p></section>`;
}

function servingNutrientValue(food, nutrient, quantity, unit = '') {
  return nutrientAvailable(food, nutrient) ? `${round(food[nutrient] * quantity, nutrient === 'calories' ? 0 : 1)}${unit}` : '—';
}

function servingTotalsMarkup(food, quantity = 1) {
  const q = toNumber(quantity, 1, 0.01, 1000);
  return `<div class="serving-total-preview" id="servingTotalPreview"><span><small>Total calories</small><strong>${servingNutrientValue(food,'calories',q)}</strong></span><span><small>Protein</small><strong>${servingNutrientValue(food,'protein',q,'g')}</strong></span><span><small>Carbs</small><strong>${servingNutrientValue(food,'carbs',q,'g')}</strong></span><span><small>Fat</small><strong>${servingNutrientValue(food,'fat',q,'g')}</strong></span></div>`;
}

function restaurantAlternativesMarkup(food) {
  if (!food.restaurant) return '';
  const alternatives = restaurantFoods().filter(candidate => candidate.id !== food.id && candidate.brand === food.brand && candidate.category === food.category && nutrientAvailable(candidate, 'calories')).sort((first, second) => smartRestaurantFit(second).score - smartRestaurantFit(first).score || first.calories - second.calories).slice(0, 3);
  if (!alternatives.length) return '';
  return `<section class="restaurant-alternatives"><div class="food-result-heading"><strong>Smarter picks at ${escapeHtml(food.brand)}</strong><small>Based on today</small></div>${alternatives.map(candidate => foodSearchResultButton(candidate, 'restaurant')).join('')}</section>`;
}

function showFoodQuantity(food, meal = modalContext.meal) {
  const selectedMeal = MEALS.includes(meal) ? meal : 'Breakfast';
  modalContext.meal = selectedMeal;
  const fit = food.restaurant ? smartRestaurantFit(food) : null;
  const sourceNote = food.source === 'Open Food Facts'
    ? 'Community product data from Open Food Facts.'
    : food.restaurant
      ? `Official U.S. restaurant nutrition${food.verifiedAt ? ` verified ${food.verifiedAt}` : ''}. ${food.availability || 'Availability and preparation may vary by location.'}`
      : 'Saved nutrition per listed serving.';
  const incomplete = ['calories','protein','carbs','fat'].filter(nutrient => !nutrientAvailable(food, nutrient));
  const incompleteNote = incomplete.length ? `<div class="restaurant-data-warning" role="note"><strong>Partial nutrition record</strong><span>${escapeHtml(incomplete.map(value => value === 'carbs' ? 'carbohydrates' : value).join(', '))} ${incomplete.length === 1 ? 'is' : 'are'} not included and will not count toward those diary totals.</span></div>` : '';
  const fitCard = fit ? `<div class="restaurant-fit-card ${escapeHtml(fit.tone)}"><div><span class="restaurant-fit-badge ${escapeHtml(fit.tone)}">${escapeHtml(fit.label)}</span><strong>${fit.score}/100 plan fit</strong></div><p>${escapeHtml(fit.detail)} Recommendations use today’s remaining calories and protein only; they do not account for allergies, medical needs, price, or every customization.</p></div>` : '';
  $('#modalContent').innerHTML = `<div class="food-detail-heading"><button type="button" class="text-button" id="backToFoodSearch">← Back to search</button><span class="badge">Per serving</span></div><div class="barcode-product-heading"><div><h3>${escapeHtml(food.name)}</h3><p>${escapeHtml(food.brand)}${food.category ? ` · ${escapeHtml(food.category)}` : ''}${food.barcode ? ` · UPC/EAN ${escapeHtml(food.barcode)}` : ''}</p></div></div>${fitCard}${nutritionFactsMarkup(food)}${incompleteNote}<p class="barcode-source-note">${escapeHtml(sourceNote)}</p><form id="addFoodForm" class="modal-form food-serving-form"><label>Meal<select name="meal">${mealOptions(selectedMeal)}</select></label><label>Servings consumed<input id="foodQuantityInput" name="quantity" type="number" inputmode="decimal" step="0.01" min="0.01" max="1000" value="1" required></label><div class="serving-quick-picks" aria-label="Quick serving amounts"><button type="button" data-serving-value="0.5">½</button><button type="button" data-serving-value="1">1</button><button type="button" data-serving-value="1.5">1½</button><button type="button" data-serving-value="2">2</button></div>${servingTotalsMarkup(food, 1)}<input name="foodId" type="hidden" value="${escapeHtml(food.id)}"><button class="primary-button" type="submit">Add to diary</button></form>${restaurantAlternativesMarkup(food)}`;
}

function showCustomFoodForm(barcode = '', meal = modalContext.meal, presetFood = null) {
  const selectedMeal = MEALS.includes(meal) ? meal : 'Breakfast';
  modalContext.meal = selectedMeal;
  const preset = presetFood ? normalizeFood(presetFood, presetFood.id || uid('custom')) : null;
  const value = (key, fallback = '') => escapeHtml(preset?.[key] ?? fallback);
  $('#modalContent').innerHTML = `<form id="customFoodForm" class="modal-form">${barcode ? `<p class="form-note">This food will be linked to barcode ${escapeHtml(barcode)} for future scans.</p>` : ''}${preset ? '<p class="form-note">Correct any value that does not match the package label. Your corrected version will replace the community result on this device.</p>' : ''}<input name="barcode" type="hidden" value="${escapeHtml(barcode)}"><input name="meal" type="hidden" value="${selectedMeal}"><input name="replaceFoodId" type="hidden" value="${escapeHtml(preset?.id || '')}"><label>Food name<input name="name" maxlength="200" value="${value('name')}" required></label><label>Brand<input name="brand" maxlength="200" value="${value('brand','Custom')}"></label><label>Serving description<input name="serving" maxlength="200" value="${value('serving')}" placeholder="1 serving, 100 g, 1 cup" required></label><div class="two-col"><label>Calories<input name="calories" type="number" step="any" min="0" max="100000" value="${value('calories')}" required></label><label>Protein (g)<input name="protein" type="number" step="any" min="0" max="10000" value="${value('protein')}" required></label></div><div class="two-col"><label>Carbs (g)<input name="carbs" type="number" step="any" min="0" max="10000" value="${value('carbs',0)}" required></label><label>Fat (g)<input name="fat" type="number" step="any" min="0" max="10000" value="${value('fat',0)}" required></label></div><div class="two-col"><label>Fiber (g)<input name="fiber" type="number" step="any" min="0" max="10000" value="${value('fiber',0)}"></label><label>Sugar (g)<input name="sugar" type="number" step="any" min="0" max="10000" value="${value('sugar',0)}"></label></div><div class="two-col"><label>Saturated fat (g)<input name="saturatedFat" type="number" step="any" min="0" max="10000" value="${value('saturatedFat',0)}"></label><label>Trans fat (g)<input name="transFat" type="number" step="any" min="0" max="10000" value="${value('transFat',0)}"></label></div><div class="two-col"><label>Cholesterol (mg)<input name="cholesterol" type="number" step="any" min="0" max="1000000" value="${value('cholesterol',0)}"></label><label>Sodium (mg)<input name="sodium" type="number" step="any" min="0" max="1000000" value="${value('sodium',0)}"></label></div><button class="primary-button" type="submit">${preset ? 'Save corrected nutrition' : 'Save food'}</button></form>`;
}

async function fetchWithTimeout(value, timeoutMs = 10000) {
  const url = safeApiUrl(value);
  if (!url) throw new Error('Blocked an untrusted API destination');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url.href, {
      signal:controller.signal,
      headers:{Accept:'application/json'},
      credentials:'omit',
      referrerPolicy:'no-referrer',
      cache:'no-store',
      mode:url.origin === window.location.origin ? 'same-origin' : 'cors'
    });
    const finalUrl = safeApiUrl(response.url || url.href);
    if (!finalUrl) throw new Error('Blocked an unexpected API redirect');
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function servingUnitToBase(value, unit = '') {
  const normalizedUnit = String(unit || '').trim().toLowerCase().replace('fl. oz', 'fl oz');
  const multipliers = {
    g:1, gram:1, grams:1,
    kg:1000, kilogram:1000, kilograms:1000,
    mg:.001,
    ml:1, milliliter:1, milliliters:1,
    l:1000, liter:1000, liters:1000,
    oz:28.349523125, ounce:28.349523125, ounces:28.349523125,
    lb:453.59237, lbs:453.59237, pound:453.59237, pounds:453.59237,
    'fl oz':29.5735295625
  };
  return Number(value) * (multipliers[normalizedUnit] || 1);
}

function servingAmountGrams(product, servingText) {
  const text = String(servingText || '').replace(',', '.');
  const matches = [...text.matchAll(/(?:^|\(|\s)(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|kg|mg|ml|g|lbs?|lb|oz|liters?|l)\b/ig)];
  let preferredMatch = null;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const unit = matches[index][2].toLowerCase().replace(/\s+/g, ' ').replace('.', '');
    if (/^(?:g|kg|mg|ml|l|liter|liters)$/.test(unit)) { preferredMatch = matches[index]; break; }
  }
  preferredMatch ||= matches.at(-1) || null;
  const parsed = preferredMatch ? servingUnitToBase(Number(preferredMatch[1]), preferredMatch[2].replace(/\s+/g, ' ').replace('.', '')) : NaN;
  const explicit = Number(product?.serving_quantity);
  const explicitUnit = String(product?.serving_quantity_unit || product?.serving_unit || '').trim();
  if (Number.isFinite(explicit) && explicit > 0) {
    // Some records store "1 serving" while the text contains the real gram/ml amount.
    const explicitIsCount = explicit <= 1 || (explicitUnit && !/^(?:g|kg|mg|ml|l|oz|lb|lbs|fl\s*oz)$/i.test(explicitUnit));
    if (Number.isFinite(parsed) && explicitIsCount) return parsed;
    return servingUnitToBase(explicit, explicitUnit);
  }
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

function productNutrientForServing(product, names, factor = 1) {
  const nutrition = product?.nutriments || product?.nutrition || {};
  for (const name of names) {
    const direct = Number(product?.[name]);
    if (Number.isFinite(direct)) return direct;
    const serving = Number(nutrition[`${name}_serving`]);
    if (Number.isFinite(serving)) return serving;
  }
  for (const name of names) {
    const per100 = Number(nutrition[`${name}_100g`] ?? nutrition[name]);
    if (Number.isFinite(per100)) return per100 * factor;
  }
  if (names.includes('energy-kcal')) {
    const kjServing = Number(nutrition['energy-kj_serving']);
    if (Number.isFinite(kjServing)) return kjServing / 4.184;
    const kj100 = Number(nutrition['energy-kj_100g'] ?? nutrition['energy-kj']);
    if (Number.isFinite(kj100)) return kj100 * factor / 4.184;
  }
  return 0;
}

function productNutrientMilligramsForServing(product, names, factor = 1) {
  const nutrition = product?.nutriments || product?.nutrition || {};
  for (const name of names) {
    const serving = Number(nutrition[`${name}_serving`]);
    if (!Number.isFinite(serving)) continue;
    const unit = String(nutrition[`${name}_unit`] || 'g').toLowerCase();
    if (unit === 'mg') return serving;
    if (unit === 'µg' || unit === 'ug' || unit === 'mcg') return serving / 1000;
    return serving * 1000;
  }
  for (const name of names) {
    const per100 = Number(nutrition[`${name}_100g`] ?? nutrition[name]);
    if (!Number.isFinite(per100)) continue;
    const unit = String(nutrition[`${name}_unit`] || 'g').toLowerCase();
    const value = per100 * factor;
    if (unit === 'mg') return value;
    if (unit === 'µg' || unit === 'ug' || unit === 'mcg') return value / 1000;
    return value * 1000;
  }
  return 0;
}

function nutritionFactRow(label, value, unit = 'g', indent = false) {
  return `<div class="nutrition-fact-row${indent ? ' indent' : ''}"><span>${escapeHtml(label)}</span><strong>${round(toNumber(value, 0, 0, 1000000), unit === 'mg' ? 0 : 1)}${unit}</strong></div>`;
}

function barcodeNutritionCard(food, code, meal, sourceNote = '') {
  const selectedMeal = MEALS.includes(meal) ? meal : 'Breakfast';
  return `<div class="barcode-product-heading"><div><span class="badge">Nutrition generated</span><h3>${escapeHtml(food.name)}</h3><p>${escapeHtml(food.brand)} · Barcode ${escapeHtml(code)}</p></div></div>${nutritionFactsMarkup(food, 'Automatically generated per listed serving. Compare it with the package label before logging.')}${sourceNote ? `<p class="barcode-source-note">${escapeHtml(sourceNote)}</p>` : ''}<form id="barcodeAddForm" class="barcode-add-form"><label>Meal<select name="meal">${mealOptions(selectedMeal)}</select></label><label>Servings<input id="barcodeQuantityInput" name="quantity" type="number" inputmode="decimal" step="0.01" min="0.01" max="1000" value="1" required></label><div class="serving-quick-picks full-width" aria-label="Quick serving amounts"><button type="button" data-serving-value="0.5">½</button><button type="button" data-serving-value="1">1</button><button type="button" data-serving-value="1.5">1½</button><button type="button" data-serving-value="2">2</button></div><div class="full-width">${servingTotalsMarkup(food, 1)}</div><input name="foodId" type="hidden" value="${escapeHtml(food.id)}"><div class="inline-actions"><button type="submit" id="addBarcodeFood" class="primary-button">Add to diary</button><button type="button" id="editBarcodeNutrition" class="secondary-button">Correct nutrition</button></div></form>`;
}

function showBarcodeNutrition(food, code, meal, sourceNote = '') {
  const result = $('#barcodeResult');
  if (!result) return;
  result.innerHTML = barcodeNutritionCard(food, code, meal, sourceNote);
  const edit = $('#editBarcodeNutrition');
  if (edit) edit.onclick = () => showCustomFoodForm(code, meal, food);
}

function normalizeOpenFoodFactsProduct(product, code) {
  if (!product || (!product.product_name && !product.name) || !productHasNutrition(product)) return null;
  const rawServing = String(product.serving_size || product.serving || '').trim();
  const grams = servingAmountGrams(product, rawServing);
  const factor = grams / 100;
  const serving = rawServing || `${round(grams, 1)} g`;
  const nutrition = product.nutriments || product.nutrition || {};
  const sodiumMg = Number.isFinite(Number(product.sodium_mg))
    ? Number(product.sodium_mg)
    : Number.isFinite(Number(nutrition.sodium_mg_serving))
      ? Number(nutrition.sodium_mg_serving)
      : productNutrientMilligramsForServing(product, ['sodium'], factor);

  const normalizedFood = normalizeFood({
    id:`off-${code}`,
    name:product.product_name || product.name,
    brand:product.brands || product.brand || 'Open Food Facts',
    serving,
    calories:productNutrientForServing(product, ['calories','energy-kcal'], factor),
    protein:productNutrientForServing(product, ['protein','proteins'], factor),
    carbs:productNutrientForServing(product, ['carbs','carbohydrates'], factor),
    fat:productNutrientForServing(product, ['fat'], factor),
    fiber:productNutrientForServing(product, ['fiber'], factor),
    sugar:productNutrientForServing(product, ['sugar','sugars'], factor),
    saturatedFat:productNutrientForServing(product, ['saturated-fat','saturated_fat'], factor),
    transFat:productNutrientForServing(product, ['trans-fat','trans_fat'], factor),
    cholesterol:productNutrientMilligramsForServing(product, ['cholesterol'], factor),
    sodium:sodiumMg,
    aliases:[],source:'Open Food Facts',barcode:code
  }, `off-${code}`);
  if (normalizedFood) normalizedFood.imageUrl = sanitizeImageUrl(product.image_front_small_url || product.image_small_url || '');
  return normalizedFood;
}

function barcodeDatabaseCodes(code) {
  const normalized = String(code || '').replace(/\D/g, '');
  const candidates = [normalized];
  if (normalized.length === 12) candidates.push(`0${normalized}`);
  if (normalized.length === 13 && normalized.startsWith('0')) candidates.push(normalized.slice(1));
  return [...new Set(candidates.filter(candidate => /^\d{8,14}$/.test(candidate)))];
}

async function fetchBarcodeProduct(code) {
  const proxy = configuredProxyUrl(window.PHACTORYFIT_CONFIG?.offProxyUrl);
  const fields = 'code,status,status_verbose,product_name,brands,serving_size,serving_quantity,quantity,nutrition_data_per,nutriments';
  let lastError = null;
  let reachedDatabase = false;
  for (const candidate of barcodeDatabaseCodes(code)) {
    const urls = [];
    if (proxy) urls.push(`${proxy}${proxy.includes('?') ? '&' : '?'}barcode=${encodeURIComponent(candidate)}`);
    urls.push(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(candidate)}.json?fields=${encodeURIComponent(fields)}&app_name=PhactoryFit&app_version=${encodeURIComponent(APP_VERSION)}`);
    for (const url of urls) {
      try {
        const response = await fetchWithTimeout(url, 12000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        reachedDatabase = true;
        const data = await readBoundedJson(response);
        if (data?.status === 0) continue;
        const product = data?.product || data;
        if (!product || (!product.product_name && !product.name)) continue;
        return {found:true, product, matchedCode:candidate};
      } catch (error) {
        lastError = error;
        console.warn('Barcode product source failed', error);
      }
    }
  }
  if (reachedDatabase) return {found:false, product:null};
  throw lastError || new Error('Product database unavailable');
}

async function lookupBarcode(code) {
  const result = $('#barcodeResult');
  if (!result) return;
  const normalizedCode = String(code || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(normalizedCode)) {
    result.innerHTML = '<p class="form-note">Enter a valid 8–14 digit UPC or EAN.</p>';
    return;
  }
  const selectedMeal = MEALS.includes($('#barcodeMeal')?.value) ? $('#barcodeMeal').value : modalContext.meal;
  modalContext.meal = selectedMeal;
  const lookupCodes = barcodeDatabaseCodes(normalizedCode);
  const localFood = allFoods().find(food => lookupCodes.includes(String(food.barcode || '')));
  if (localFood) {
    showBarcodeNutrition(localFood, normalizedCode, selectedMeal, 'Saved on this device. No internet lookup was needed.');
    return;
  }

  result.innerHTML = '<p class="form-note camera-status">Barcode detected. Generating nutrition facts…</p>';
  try {
    const response = await fetchBarcodeProduct(normalizedCode);
    if (response.found) {
      const normalizedFood = normalizeOpenFoodFactsProduct(response.product, normalizedCode);
      if (!normalizedFood) {
        result.innerHTML = '<p class="form-note">The product was found, but its calories or core macros are incomplete. Enter the package label once so the diary does not silently count missing values as zero.</p><button type="button" id="teachBarcodeFood" class="primary-button">Enter verified nutrition</button>';
        $('#teachBarcodeFood').onclick = () => showCustomFoodForm(normalizedCode, selectedMeal);
        return;
      }
      cacheOnlineFood(normalizedFood);
      showBarcodeNutrition(normalizedFood, normalizedCode, selectedMeal, 'Community product data from Open Food Facts. Verify it against the package label.');
      return;
    }
    result.innerHTML = '<p class="form-note">The barcode scanned correctly, but this product is not in the food database yet.</p><button type="button" id="teachBarcodeFood" class="primary-button">Enter nutrition once</button>';
  } catch (error) {
    console.warn('Barcode lookup failed', error);
    result.innerHTML = '<p class="form-note">The barcode scanned correctly, but the online nutrition database could not be reached. Enter the label once and PhactoryFit will remember it for future scans.</p><button type="button" id="teachBarcodeFood" class="primary-button">Enter nutrition once</button>';
  }
  $('#teachBarcodeFood').onclick = () => showCustomFoodForm(normalizedCode, selectedMeal);
}

function barcodeCameraErrorMessage(error) {
  const name = String(error?.name || '');
  if (!window.isSecureContext) return 'Camera access requires HTTPS. Open the deployed GitHub Pages site in Safari instead of opening the HTML file directly.';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return 'Camera permission is blocked. On iPhone, open Settings → Safari → Camera and allow access, then reopen PhactoryFit.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No usable camera was found on this device.';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'The camera is busy or unavailable. Close other camera apps, return to PhactoryFit, and try again.';
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') return 'The requested rear-camera mode was unavailable. PhactoryFit will retry with simpler camera settings.';
  if (name === 'ScannerLibraryUnavailable') return 'The barcode scanner engine could not initialize. Deploy the complete v1.10.0 package, which includes an embedded decoder and a root recovery copy, then reopen Safari.';
  if (name === 'TimeoutError') return 'No barcode was detected. Hold the package 6–10 inches away, avoid glare, and keep the entire barcode inside the frame.';
  return 'The barcode camera could not start. Check camera permission, lighting, and the secure HTTPS address, then try again.';
}


function barcodeScannerLibraryReady() {
  const api = window.ZXingBrowser;
  return Boolean(api && (api.BrowserMultiFormatOneDReader || api.BrowserMultiFormatReader));
}

function loadBarcodeScannerScript(source, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const url = new URL(String(source || ''), document.baseURI);
    if (url.origin !== window.location.origin || !/\/zxing-browser\.min\.js$/.test(url.pathname)) {
      reject(new Error('Blocked an untrusted scanner script source'));
      return;
    }
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      script.remove();
      reject(new DOMException('Scanner engine load timed out', 'TimeoutError'));
    }, timeoutMs);
    script.async = true;
    script.src = url.href;
    script.dataset.phactoryScannerRetry = 'true';
    script.onload = () => {
      clearTimeout(timer);
      if (barcodeScannerLibraryReady()) resolve(window.ZXingBrowser);
      else reject(new Error('Scanner script loaded without exposing the decoder API'));
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error(`Could not load scanner engine from ${source}`));
    };
    document.head.appendChild(script);
  });
}

async function ensureBarcodeScannerLibrary() {
  if (barcodeScannerLibraryReady()) return window.ZXingBrowser;
  if (barcodeLibraryLoadPromise) return barcodeLibraryLoadPromise;

  barcodeLibraryLoadPromise = (async () => {
    const retryToken = Date.now();
    const candidates = [
      new URL(`zxing-browser.min.js?v=${encodeURIComponent(APP_VERSION)}&retry=${retryToken}`, document.baseURI).href
    ];
    let lastError = null;
    for (const source of candidates) {
      try {
        await loadBarcodeScannerScript(source);
        if (barcodeScannerLibraryReady()) return window.ZXingBrowser;
      } catch (error) {
        lastError = error;
        console.warn('Barcode scanner engine candidate failed', source, error);
      }
    }
    const error = new Error(lastError?.message || 'Barcode scanner engine unavailable');
    error.name = 'ScannerLibraryUnavailable';
    throw error;
  })();

  try {
    return await barcodeLibraryLoadPromise;
  } finally {
    if (!barcodeScannerLibraryReady()) barcodeLibraryLoadPromise = null;
  }
}

function normalizeScannedBarcode(value) {
  const code = String(value || '').replace(/\D/g, '').slice(0, 14);
  return code.length >= 8 && code.length <= 14 ? code : '';
}

function barcodeFormatLabel(scanResult) {
  try {
    const raw = typeof scanResult?.getBarcodeFormat === 'function' ? scanResult.getBarcodeFormat() : scanResult?.format;
    if (typeof raw === 'string') return raw;
    return window.ZXingBrowser?.BarcodeFormat?.[raw] || '';
  } catch {
    return '';
  }
}

function registerBarcodeCandidate(rawValue) {
  const code = normalizeScannedBarcode(rawValue);
  if (!code) return '';
  const now = Date.now();
  if (barcodeCandidate.code === code && now - barcodeCandidate.seenAt < 1800) {
    barcodeCandidate.count += 1;
  } else {
    barcodeCandidate = {code, seenAt:now, count:1};
  }
  barcodeCandidate.seenAt = now;
  return barcodeCandidate.count >= 2 ? code : '';
}

function barcodeReaderInstance() {
  if (activeBarcodeReader) return activeBarcodeReader;
  if (!window.ZXingBrowser) {
    const error = new Error('ZXing browser scanner unavailable');
    error.name = 'ScannerLibraryUnavailable';
    throw error;
  }
  const Reader = window.ZXingBrowser.BrowserMultiFormatOneDReader || window.ZXingBrowser.BrowserMultiFormatReader;
  if (!Reader) {
    const error = new Error('ZXing browser scanner unavailable');
    error.name = 'ScannerLibraryUnavailable';
    throw error;
  }
  activeBarcodeReader = new Reader(undefined, {delayBetweenScanAttempts:90, delayBetweenScanSuccess:300});
  return activeBarcodeReader;
}

function scannerCanvas(id = 'barcodeFrameCanvas') {
  let canvas = document.getElementById(id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.hidden = true;
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
  }
  return canvas;
}

function drawBarcodeRegion(video, canvas, fullFrame = false, contrast = false) {
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  if (!sourceWidth || !sourceHeight) return false;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (!fullFrame) {
    sx = sourceWidth * 0.04;
    sy = sourceHeight * 0.29;
    sw = sourceWidth * 0.92;
    sh = sourceHeight * 0.42;
  }

  const targetWidth = Math.min(1280, Math.max(720, Math.round(sw)));
  const targetHeight = Math.max(220, Math.round(targetWidth * sh / sw));
  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  if (canvas.height !== targetHeight) canvas.height = targetHeight;
  const context = canvas.getContext('2d', {willReadFrequently:true});
  if (!context) return false;
  context.save();
  context.filter = contrast ? 'grayscale(1) contrast(1.55)' : 'none';
  context.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  context.restore();
  return true;
}

function decodeBarcodeCanvas(reader, canvas) {
  try {
    const scanResult = reader.decodeFromCanvas(canvas);
    const text = typeof scanResult?.getText === 'function' ? scanResult.getText() : scanResult?.text;
    return {text, format:barcodeFormatLabel(scanResult)};
  } catch {
    return null;
  }
}

function isIOSSafariLike() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  return isIOS && isWebKit;
}

async function requestBarcodeStream(deviceId = '') {
  // iPhone Safari is more reliable when the first permission request uses a
  // minimal constraint set. Resolution and focus are optimized only after the
  // stream is live; asking for 1080p during the permission transition can make
  // WebKit return a stream whose preview immediately stalls.
  const simpleRear = deviceId ? {deviceId:{exact:deviceId}} : {facingMode:{ideal:'environment'}};
  const detailedRear = {...simpleRear,width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:24,max:30}};
  const attempts = isIOSSafariLike()
    ? [
        {audio:false,video:simpleRear},
        {audio:false,video:true}
      ]
    : [
        {audio:false,video:detailedRear},
        {audio:false,video:simpleRear},
        {audio:false,video:true}
      ];
  let lastError;
  cameraPermissionInFlight = true;
  try {
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream?.getVideoTracks?.()[0];
        if (!track || track.readyState === 'ended') {
          stream?.getTracks?.().forEach(item => item.stop());
          lastError = new DOMException('Camera stream ended before preview started', 'NotReadableError');
          continue;
        }
        return stream;
      } catch (error) {
        lastError = error;
        if (['NotAllowedError','PermissionDeniedError','SecurityError','NotReadableError'].includes(String(error?.name || ''))) throw error;
      }
    }
  } finally {
    cameraPermissionInFlight = false;
  }
  throw lastError || new DOMException('Camera unavailable', 'NotFoundError');
}

async function waitForVideoReady(video, timeoutMs = 7000) {
  if (video.readyState >= 2 && video.videoWidth) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new DOMException('Camera preview did not become ready', 'AbortError'));
    }, timeoutMs);
    const ready = () => {
      if (video.readyState < 2 && !video.videoWidth) return;
      cleanup();
      resolve();
    };
    const failed = () => {
      cleanup();
      reject(video.error || new DOMException('Camera preview failed', 'AbortError'));
    };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', ready);
      video.removeEventListener('canplay', ready);
      video.removeEventListener('error', failed);
    };
    video.addEventListener('loadedmetadata', ready);
    video.addEventListener('canplay', ready);
    video.addEventListener('error', failed);
  });
}

async function optimizeBarcodeCamera(track) {
  if (!track) return;
  try {
    const capabilities = track.getCapabilities?.() || {};
    const advanced = {};
    if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) advanced.focusMode = 'continuous';
    if (capabilities.zoom && Number.isFinite(capabilities.zoom.min) && Number.isFinite(capabilities.zoom.max)) {
      advanced.zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 1.15));
    }
    if (Object.keys(advanced).length) await track.applyConstraints?.({advanced:[advanced]});

    const torchButton = $('#barcodeTorch');
    const hasTorch = Boolean(capabilities.torch);
    if (torchButton) {
      torchButton.hidden = !hasTorch;
      torchButton.textContent = 'Turn on light';
      torchButton.setAttribute('aria-pressed', 'false');
    }
  } catch (error) {
    console.warn('Optional camera optimization was unavailable', error);
  }
}

async function refreshBarcodeDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices?.();
    barcodeVideoDevices = (devices || []).filter(device => device.kind === 'videoinput');
  } catch {
    barcodeVideoDevices = [];
  }
  const switchButton = $('#barcodeSwitchCamera');
  if (switchButton) switchButton.hidden = barcodeVideoDevices.length < 2;
}

async function toggleBarcodeTorch() {
  const track = activeMediaStream?.getVideoTracks?.()[0];
  const button = $('#barcodeTorch');
  if (!track || !button) return;
  barcodeTorchOn = !barcodeTorchOn;
  try {
    await track.applyConstraints({advanced:[{torch:barcodeTorchOn}]});
    button.textContent = barcodeTorchOn ? 'Turn off light' : 'Turn on light';
    button.setAttribute('aria-pressed', barcodeTorchOn ? 'true' : 'false');
  } catch (error) {
    barcodeTorchOn = false;
    button.textContent = 'Light unavailable';
    button.hidden = true;
    console.warn('Torch control unavailable', error);
  }
}

async function switchBarcodeCamera() {
  if (barcodeVideoDevices.length < 2) return;
  const currentId = activeMediaStream?.getVideoTracks?.()[0]?.getSettings?.().deviceId || preferredBarcodeDeviceId;
  const currentIndex = Math.max(0, barcodeVideoDevices.findIndex(device => device.deviceId === currentId));
  preferredBarcodeDeviceId = barcodeVideoDevices[(currentIndex + 1) % barcodeVideoDevices.length]?.deviceId || '';
  cameraUnexpectedEndRetries = 0;
  stopBarcodeCamera();
  await startBarcodeCamera(true);
}

async function scanBarcodePhoto(file) {
  const result = $('#barcodeResult');
  if (!result || !file) return;
  if (file.size > MAX_BARCODE_PHOTO_BYTES) {
    result.innerHTML = '<p class="form-note">That image is too large. Take a closer barcode photo and try again.</p>';
    return;
  }
  if (file.type && !String(file.type).startsWith('image/')) {
    result.innerHTML = '<p class="form-note">Choose a photo containing a UPC or EAN barcode.</p>';
    return;
  }

  stopBarcodeCamera();
  result.innerHTML = '<p class="form-note camera-status">Reading barcode photo…</p>';
  let objectUrl = '';
  let image = null;
  try {
    objectUrl = URL.createObjectURL(file);
    image = new Image();
    image.decoding = 'async';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new DOMException('Image could not be opened', 'NotReadableError'));
      image.src = objectUrl;
    });

    let rawValue = '';
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
        const codes = await detector.detect(image);
        rawValue = codes.find(code => normalizeScannedBarcode(code.rawValue))?.rawValue || '';
      } catch {
        rawValue = '';
      }
    }

    if (!rawValue) {
      await ensureBarcodeScannerLibrary();
      const reader = barcodeReaderInstance();
      const canvas = scannerCanvas('barcodePhotoCanvas');
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height || width * height > MAX_BARCODE_IMAGE_PIXELS) throw new DOMException('Image dimensions exceed the safe limit', 'DataError');
      const attempts = [
        [0, 0, width, height, false],
        [width * .03, height * .25, width * .94, height * .5, false],
        [0, 0, width, height, true],
        [width * .03, height * .25, width * .94, height * .5, true]
      ];
      for (const [sx, sy, sw, sh, contrast] of attempts) {
        const targetWidth = Math.min(1800, Math.max(900, Math.round(sw)));
        canvas.width = targetWidth;
        canvas.height = Math.max(260, Math.round(targetWidth * sh / sw));
        const context = canvas.getContext('2d', {willReadFrequently:true});
        context.save();
        context.filter = contrast ? 'grayscale(1) contrast(1.65)' : 'none';
        context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        context.restore();
        const decoded = decodeBarcodeCanvas(reader, canvas);
        if (decoded?.text && normalizeScannedBarcode(decoded.text)) {
          rawValue = decoded.text;
          break;
        }
      }
    }

    const code = normalizeScannedBarcode(rawValue);
    if (!code) throw new DOMException('No supported barcode detected.', 'NotFoundError');
    const input = $('#barcodeInput');
    if (input) input.value = code;
    await lookupBarcode(code);
  } catch (error) {
    console.warn('Barcode photo scan failed', error);
    const currentResult = $('#barcodeResult');
    if (currentResult) currentResult.innerHTML = `<p class="form-note">${escapeHtml(error?.name === 'ScannerLibraryUnavailable' ? barcodeCameraErrorMessage(error) : 'No barcode was found in that photo. Fill most of the image with the barcode, keep it sharp, and avoid glare.')}</p>`;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const input = $('#barcodePhotoInput');
    if (input) input.value = '';
  }
}

async function completeBarcodeScan(rawValue, session, format = '') {
  if (session !== barcodeScanSession || !modal.open) return;
  const code = normalizeScannedBarcode(rawValue);
  if (!code) return;
  const input = $('#barcodeInput');
  if (input) input.value = code;
  navigator.vibrate?.(70);
  stopBarcodeCamera();
  const result = $('#barcodeResult');
  if (result) result.innerHTML = `<p class="form-note camera-status">Barcode detected${format ? ` (${escapeHtml(format.replaceAll('_', '-'))})` : ''}: ${escapeHtml(code)}. Looking up product…</p>`;
  await lookupBarcode(code);
}

async function runBarcodeDecodeLoop(video, result, session) {
  const reader = barcodeReaderInstance();
  const cropCanvas = scannerCanvas('barcodeFrameCanvas');
  const fullCanvas = scannerCanvas('barcodeFullFrameCanvas');
  let nativeDetector = null;
  if ('BarcodeDetector' in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats?.();
      const wanted = ['ean_13','ean_8','upc_a','upc_e'];
      const formats = Array.isArray(supported) ? wanted.filter(format => supported.includes(format)) : wanted;
      if (formats.length) nativeDetector = new window.BarcodeDetector({formats});
    } catch {
      nativeDetector = null;
    }
  }

  let attempt = 0;
  const started = Date.now();
  while (session === barcodeScanSession && modal.open && activeMediaStream) {
    if (document.hidden) {
      await new Promise(resolve => { activeBarcodeLoop = setTimeout(resolve, 250); });
      continue;
    }
    attempt += 1;
    if (video.readyState >= 2 && video.videoWidth) {
      let decoded = null;
      if (nativeDetector && attempt % 3 === 0) {
        try {
          const codes = await nativeDetector.detect(video);
          const match = codes.find(code => normalizeScannedBarcode(code.rawValue));
          if (match) decoded = {text:match.rawValue,format:match.format || ''};
        } catch {
          nativeDetector = null;
        }
      }
      if (!decoded && drawBarcodeRegion(video, cropCanvas, false, attempt % 4 === 0)) decoded = decodeBarcodeCanvas(reader, cropCanvas);
      if (!decoded && attempt % 5 === 0 && drawBarcodeRegion(video, fullCanvas, true, attempt % 10 === 0)) decoded = decodeBarcodeCanvas(reader, fullCanvas);

      if (decoded?.text) {
        const confirmed = registerBarcodeCandidate(decoded.text);
        if (confirmed) {
          await completeBarcodeScan(confirmed, session, decoded.format);
          return;
        }
        result.innerHTML = '<p class="form-note camera-status">Barcode found—hold still for confirmation…</p>';
      }
    }
    if (Date.now() - started > 45000) throw new DOMException('No barcode detected before timeout.', 'TimeoutError');
    await new Promise(resolve => {
      activeBarcodeLoop = setTimeout(resolve, 110);
    });
  }
}

async function playBarcodeVideo(video, timeoutMs = 3500) {
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  try {
    const playPromise = video.play();
    if (playPromise?.then) {
      await Promise.race([
        playPromise,
        new Promise((_, reject) => setTimeout(() => reject(new DOMException('Camera preview play timed out', 'AbortError')), timeoutMs))
      ]);
    }
    return !video.paused;
  } catch (error) {
    console.warn('Safari camera preview needs another user gesture', error);
    return false;
  }
}

async function beginBarcodeDecoding(video, result, session) {
  if (barcodeDecodeRunning || session !== barcodeScanSession || !activeMediaStream || !modal.open) return;
  barcodeDecodeRunning = true;
  try {
    const track = activeMediaStream.getVideoTracks?.()[0];
    preferredBarcodeDeviceId = track?.getSettings?.().deviceId || preferredBarcodeDeviceId;
    await optimizeBarcodeCamera(track);
    await refreshBarcodeDevices();
    if (session !== barcodeScanSession || !modal.open || !activeMediaStream) return;
    const resumeButton = $('#resumeBarcodePreview');
    if (resumeButton) resumeButton.hidden = true;
    result.innerHTML = '<p class="form-note camera-status">Scanning… Keep the full barcode inside the green frame. Move slightly farther away if it looks blurry.</p>';
    await runBarcodeDecodeLoop(video, result, session);
  } finally {
    barcodeDecodeRunning = false;
  }
}

function keepCameraOpenForManualResume(result, message) {
  const resumeButton = $('#resumeBarcodePreview');
  if (resumeButton) resumeButton.hidden = false;
  const shell = $('#barcodeCameraShell');
  if (shell) shell.hidden = false;
  setBarcodeCameraMode(true);
  setBarcodeCameraButton(true);
  if (result) result.innerHTML = `<p class="form-note camera-status">${escapeHtml(message)}</p>`;
}

function bindCameraTrackLifecycle(stream, session) {
  const track = stream?.getVideoTracks?.()[0];
  if (!track) return;
  track.onmute = () => {
    cameraLifecycleNote = 'Camera stream temporarily paused by Safari.';
    const result = $('#barcodeResult');
    if (session === barcodeScanSession && modal.open && result) {
      keepCameraOpenForManualResume(result, 'Safari temporarily paused the camera. Tap “Start preview” to resume.');
    }
  };
  track.onunmute = () => {
    cameraLifecycleNote = '';
    const video = $('#barcodeVideo');
    if (session === barcodeScanSession && modal.open && video?.paused) void resumeBarcodePreview();
  };
  track.onended = () => {
    if (session !== barcodeScanSession || !modal.open || cameraPermissionInFlight) return;
    activeMediaStream = null;
    const result = $('#barcodeResult');
    if (cameraUnexpectedEndRetries < 1) {
      cameraUnexpectedEndRetries += 1;
      if (result) result.innerHTML = '<p class="form-note camera-status">Safari ended the camera stream. Reconnecting once…</p>';
      setTimeout(() => {
        if (session === barcodeScanSession && modal.open) void startBarcodeCamera(true);
      }, 350);
      return;
    }
    keepCameraOpenForManualResume(result, 'Safari ended the camera stream. Tap “Use camera” to reconnect, or use “Take barcode photo.”');
    setBarcodeCameraButton(false);
  };
}

async function resumeBarcodePreview() {
  const video = $('#barcodeVideo');
  const result = $('#barcodeResult');
  if (!video || !result || !activeMediaStream || !modal.open) return;
  const session = barcodeScanSession;
  if (video.srcObject !== activeMediaStream) video.srcObject = activeMediaStream;
  const played = await playBarcodeVideo(video, 5000);
  if (!played) {
    keepCameraOpenForManualResume(result, 'Safari still has the camera stream but paused the preview. Tap “Start preview” again, or use “Take barcode photo.”');
    return;
  }
  try {
    await waitForVideoReady(video, 5000);
  } catch (error) {
    const track = activeMediaStream?.getVideoTracks?.()[0];
    if (track?.readyState === 'live') {
      keepCameraOpenForManualResume(result, 'The camera is active, but Safari has not displayed the preview yet. Tap “Start preview” once more.');
      return;
    }
    throw error;
  }
  await beginBarcodeDecoding(video, result, session);
}

async function startBarcodeCamera(forceStart = false) {
  const result = $('#barcodeResult');
  const video = $('#barcodeVideo');
  const shell = $('#barcodeCameraShell');
  if (!result || !video || !shell) return;

  if (!forceStart && (barcodeCameraStarting || activeMediaStream || activeBarcodeControls)) {
    stopBarcodeCamera();
    result.innerHTML = '<p class="form-note">Camera stopped.</p>';
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error('getUserMedia unavailable');
    error.name = 'NotSupportedError';
    result.innerHTML = `<p class="form-note">${escapeHtml(barcodeCameraErrorMessage(error))}</p>`;
    return;
  }

  stopBarcodeCamera();
  const session = barcodeScanSession;
  barcodeCameraStarting = true;
  barcodeCandidate = {code:'',seenAt:0,count:0};
  setBarcodeCameraButton(true);
  result.innerHTML = '<p class="form-note camera-status">Loading barcode scanner engine…</p>';

  try {
    // The scanner is bundled as a pinned same-origin asset. This also retries the root
    // copy if Safari loaded an older cached page or the first script load failed.
    await ensureBarcodeScannerLibrary();
    if (session !== barcodeScanSession || !modal.open) return;

    shell.hidden = false;
    setBarcodeCameraMode(true);
    shell.scrollIntoView?.({block:'center',behavior:'instant'});
    result.innerHTML = '<p class="form-note camera-status">Requesting rear-camera access…</p>';

    const requestedStream = await requestBarcodeStream(preferredBarcodeDeviceId);
    if (session !== barcodeScanSession || !modal.open) {
      requestedStream?.getTracks?.().forEach(track => track.stop());
      return;
    }
    activeMediaStream = requestedStream;
    bindCameraTrackLifecycle(activeMediaStream, session);
    video.playsInline = true;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.srcObject = activeMediaStream;

    const played = await playBarcodeVideo(video, 5000);
    if (!played) {
      keepCameraOpenForManualResume(result, 'Camera permission is active. Safari paused the preview; tap “Start preview” to continue.');
      return;
    }

    try {
      await waitForVideoReady(video, 8000);
    } catch (error) {
      const track = activeMediaStream?.getVideoTracks?.()[0];
      if (track?.readyState === 'live') {
        keepCameraOpenForManualResume(result, 'Camera permission is active, but Safari delayed the preview. Tap “Start preview” to continue.');
        return;
      }
      throw error;
    }
    await beginBarcodeDecoding(video, result, session);
  } catch (error) {
    if (session !== barcodeScanSession) return;
    console.warn('Camera barcode scan failed', error);
    stopBarcodeCamera();
    const currentResult = $('#barcodeResult');
    if (currentResult) {
      const retry = String(error?.name || '') === 'ScannerLibraryUnavailable'
        ? '<button type="button" id="retryBarcodeCamera" class="secondary-button">Retry scanner engine</button>'
        : '';
      currentResult.innerHTML = `<p class="form-note">${escapeHtml(barcodeCameraErrorMessage(error))}</p>${retry}`;
    }
  } finally {
    barcodeCameraStarting = false;
    if (!activeMediaStream && !activeBarcodeControls) setBarcodeCameraButton(false);
  }
}

function startVoiceLog() {
  const voiceNoticeKey = 'phactoryfit.voiceNotice.v1';
  let voiceNoticeAccepted = false;
  try { voiceNoticeAccepted = localStorage.getItem(voiceNoticeKey) === 'accepted'; } catch {}
  if (!voiceNoticeAccepted) {
    const accepted = confirm('Safari provides voice recognition and may send audio to Apple for online speech processing. Continue?');
    if (!accepted) return;
    try { localStorage.setItem(voiceNoticeKey, 'accepted'); } catch {}
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    toast('Voice recognition is not supported in this browser.');
    return;
  }
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $('#voiceLogButton').textContent = 'Listening…';
  recognition.onresult = event => {
    const text = event.results[0][0].transcript;
    openModal('food');
    setTimeout(() => {
      if ($('#foodSearch')) {
        $('#foodSearch').value = text;
        scheduleOnlineFoodSearch(text);
        toast(`Heard: ${text}`);
      }
    }, 50);
  };
  recognition.onerror = () => toast('Voice logging could not start.');
  recognition.onend = () => { if ($('#voiceLogButton')) $('#voiceLogButton').textContent = '🎙 Voice log'; };
  try {
    recognition.start();
  } catch (error) {
    console.warn('Voice recognition failed to start', error);
    recognition.onend();
    toast('Voice logging could not start.');
  }
}

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phactoryfit-backup-${localDateKey()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup exported.');
}

async function importData(file) {
  try {
    if (!file || file.size > MAX_BACKUP_BYTES) throw new Error('Backup is missing or too large');
    if (file.type && !['application/json','text/json','text/plain'].includes(file.type) && !/\.json$/i.test(file.name || '')) throw new Error('Backup must be JSON');
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || !parsed.profile || !parsed.days) throw new Error('Invalid backup');
    state = normalizeState(parsed);
    saveState();
    render();
    toast('Backup imported.');
  } catch (error) {
    console.error('Backup import failed', error);
    toast('That file is not a valid PhactoryFit backup.');
  } finally {
    if ($('#importInput')) $('#importInput').value = '';
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`)
    .then(registration => registration.update())
    .catch(error => console.warn('Service worker unavailable', error));
}

function selectedMealFromCurrentModal() {
  const value = $('#foodMeal')?.value || $('#barcodeMeal')?.value || modalContext.meal;
  return MEALS.includes(value) ? value : 'Breakfast';
}

const coachActionHandlers = {
  'Log breakfast':() => openModal('food', {meal:'Breakfast'}),
  'Scan a barcode':() => openModal('barcode'),
  'Open protein rescue':() => navigate('coach'),
  'Log food':() => openModal('food'),
  'Review diary':() => navigate('diary'),
  'Update sleep':() => openModal('habits')
};

document.addEventListener('click', event => {
  if (event.target.closest('#heroLogButton')) { openModal('food'); return; }
  const navigation = event.target.closest('[data-view-target]');
  if (navigation) { navigate(navigation.dataset.viewTarget); return; }
  const link = event.target.closest('[data-nav]');
  if (link) { navigate(link.dataset.nav); return; }
  const modalButton = event.target.closest('[data-modal]');
  if (modalButton) { openModal(modalButton.dataset.modal); return; }
  const mealButton = event.target.closest('[data-add-meal]');
  if (mealButton) { openModal('food', {meal:mealButton.dataset.addMeal}); return; }
  const editFood = event.target.closest('[data-edit-food]');
  if (editFood) { openModal('editFood', {logId:editFood.dataset.editFood}); return; }
  const deleteDiaryFood = event.target.closest('[data-delete-diary-food]');
  if (deleteDiaryFood) {
    const entry = loggedFoodById(deleteDiaryFood.dataset.deleteDiaryFood);
    if (!entry) { toast('That diary entry could not be found.'); return; }
    getDay().foods = getDay().foods.filter(food => food.logId !== entry.logId);
    modal.close();
    render();
    toast(`${entry.name} deleted.`);
    return;
  }
  const remove = event.target.closest('[data-remove-food]');
  if (remove) {
    getDay().foods = getDay().foods.filter(food => food.logId !== remove.dataset.removeFood);
    render();
    toast('Food removed.');
    return;
  }
  const foodSearchShortcut = event.target.closest('[data-food-search-query]');
  if (foodSearchShortcut) {
    const input = $('#foodSearch');
    if (input) {
      input.value = foodSearchShortcut.dataset.foodSearchQuery || '';
      scheduleOnlineFoodSearch(input.value);
      input.focus();
    }
    return;
  }
  const foodChoice = event.target.closest('[data-food-id]');
  if (foodChoice) {
    const food = findFoodById(foodChoice.dataset.foodId);
    if (food) showFoodQuantity(food, selectedMealFromCurrentModal());
    return;
  }
  const servingPick = event.target.closest('[data-serving-value]');
  if (servingPick) {
    const form = servingPick.closest('form');
    const input = form?.querySelector('input[name="quantity"]');
    if (input) {
      input.value = servingPick.dataset.servingValue;
      input.dispatchEvent(new Event('input', {bubbles:true}));
    }
    return;
  }
  if (event.target.closest('#backToFoodSearch')) {
    const meal = modalContext.meal;
    const query = modalContext.foodSearchQuery || '';
    $('#modalContent').innerHTML = foodModal(meal);
    $('#foodSearch').value = query;
    renderFoodResults(query);
    $('#foodSearch').focus();
    return;
  }
  if (event.target.closest('#retryFoodSearch')) {
    const query = $('#foodSearch')?.value || modalContext.foodSearchQuery;
    void runOnlineFoodSearch(query, true);
    return;
  }
  const coachAction = event.target.closest('[data-coach-action]');
  if (coachAction) {
    coachActionHandlers[coachAction.dataset.coachAction]?.();
    return;
  }
  const rescue = event.target.closest('[data-rescue-food]');
  if (rescue) {
    const food = findFoodById(rescue.dataset.rescueFood);
    if (food) {
      openModal('food');
      showFoodQuantity(food, 'Snacks');
    }
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'foodSearch') scheduleOnlineFoodSearch(event.target.value);
  if (event.target.id === 'foodQuantityInput' || event.target.id === 'barcodeQuantityInput' || event.target.id === 'editFoodQuantityInput') {
    const form = event.target.form;
    const foodId = form?.elements?.foodId?.value;
    const logId = form?.elements?.logId?.value;
    const food = logId ? loggedFoodById(logId) : findFoodById(foodId);
    const preview = form?.querySelector('#servingTotalPreview');
    if (food && preview) preview.outerHTML = servingTotalsMarkup(food, event.target.value);
  }
});

document.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));

  if (form.id === 'editDiaryFoodForm') {
    const logId = String(data.logId || '');
    const entry = loggedFoodById(logId);
    const quantity = toNumber(data.quantity, NaN, 0.01, 1000);
    const loggedTime = normalizeLoggedTime(data.loggedTime);
    if (!entry || !Number.isFinite(quantity) || !MEALS.includes(data.meal)) { toast('Check the serving amount and meal period.'); return; }
    if (String(data.loggedTime || '').trim() && !loggedTime) { toast('Enter a valid time.'); return; }
    entry.meal = data.meal;
    entry.quantity = quantity;
    entry.loggedTime = loggedTime;
    modal.close();
    render();
    toast(`${entry.name} updated.`);
    return;
  }

  if (form.id === 'addFoodForm' || form.id === 'barcodeAddForm') {
    const food = findFoodById(data.foodId);
    const quantity = toNumber(data.quantity, NaN, 0.01, 1000);
    if (!food || !Number.isFinite(quantity) || !MEALS.includes(data.meal)) { toast('Check the serving amount and meal.'); return; }
    if (food.source === 'Open Food Facts') cacheOnlineFood(food);
    const day = getDay();
    if (day.foods.length >= MAX_LOG_ENTRIES_PER_DAY) { toast('This day has reached the safe food-entry limit.'); return; }
    day.foods.push({...food,meal:data.meal,quantity,loggedTime:currentLocalTime(),logId:uid('log')});
    state.recentFoodIds = [food.id, ...state.recentFoodIds.filter(id => id !== food.id)].slice(0, 12);
    modal.close();
    render();
    toast(`${food.name} added.`);
    return;
  }

  if (form.id === 'customFoodForm') {
    const replacementId = String(data.replaceFoodId || '').trim();
    const food = normalizeFood({
      id:replacementId || uid('custom'),name:String(data.name || '').trim(),brand:String(data.brand || '').trim() || 'Custom',serving:String(data.serving || '').trim(),
      calories:data.calories,protein:data.protein,carbs:data.carbs,fat:data.fat,fiber:data.fiber,sugar:data.sugar,saturatedFat:data.saturatedFat,transFat:data.transFat,cholesterol:data.cholesterol,sodium:data.sodium,aliases:[],barcode:data.barcode || null,source:'User verified'
    });
    if (!food || !food.serving) { toast('Complete the required food fields.'); return; }
    const existingIndex = state.customFoods.findIndex(item => item.id === replacementId || (food.barcode && item.barcode === food.barcode));
    if (existingIndex >= 0) state.customFoods[existingIndex] = food;
    else if (state.customFoods.length < MAX_CUSTOM_FOODS) state.customFoods.push(food);
    else { toast('Saved-food storage is full. Export a backup before adding more custom foods.'); return; }
    saveState();
    showFoodQuantity(food, MEALS.includes(data.meal) ? data.meal : modalContext.meal);
    return;
  }

  if (form.id === 'workoutForm') {
    const minutes = toNumber(data.minutes, NaN, 1, 1440);
    const calories = toNumber(data.calories, 0, 0, 20000);
    if (!Number.isFinite(minutes) || !String(data.name || '').trim()) { toast('Enter a workout name and valid duration.'); return; }
    const day = getDay();
    day.workoutMinutes = clamp(day.workoutMinutes + minutes, 0, 1440);
    day.exerciseCalories = clamp(day.exerciseCalories + calories, 0, 20000);
    day.workoutName = String(data.name).trim().slice(0, 200);
    day.workoutNotes = String(data.notes || '').trim().slice(0, 2000);
    modal.close();
    render();
    toast('Workout logged.');
    return;
  }

  if (form.id === 'weightForm') {
    if (!recordWeight(data.date, data.weight)) { toast('Enter a valid date and weight.'); return; }
    modal.close();
    render();
    toast('Weight saved.');
    return;
  }

  if (form.id === 'waterForm') {
    const change = toNumber(data.cups, NaN, -20, 100);
    if (!Number.isFinite(change)) { toast('Enter a valid water amount.'); return; }
    getDay().water = clamp(getDay().water + change, 0, 1000);
    modal.close();
    render();
    toast('Water updated.');
    return;
  }

  if (form.id === 'habitsForm') {
    const steps = toNumber(data.steps, NaN, 0, 1000000);
    const sleep = toNumber(data.sleep, NaN, 0, 24);
    if (!Number.isFinite(steps) || !Number.isFinite(sleep)) { toast('Enter valid steps and sleep values.'); return; }
    getDay().steps = Math.round(steps);
    getDay().sleep = sleep;
    modal.close();
    render();
    toast('Habits saved.');
    return;
  }

  if (form.id === 'dateForm') {
    if (!isDateKey(data.date)) { toast('Choose a valid date.'); return; }
    state.selectedDate = data.date;
    getDay();
    modal.close();
    render();
  }
});

$('#settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const nextProfile = {
    ...state.profile,
    name:String(data.name || '').trim().slice(0, 80),
    country:String(data.country || 'US').trim().toUpperCase().slice(0, 2) || 'US',
    stateCode:String(data.stateCode || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
    currentWeight:toNumber(data.currentWeight, NaN, 40, 1500),
    goalWeight:toNumber(data.goalWeight, NaN, 40, 1500),
    calorieGoal:Math.round(toNumber(data.calorieGoal, NaN, 500, 10000)),
    proteinGoal:Math.round(toNumber(data.proteinGoal, NaN, 1, 1000)),
    carbGoal:Math.round(toNumber(data.carbGoal, NaN, 0, 2000)),
    fatGoal:Math.round(toNumber(data.fatGoal, NaN, 0, 1000)),
    weeklyGoal:toNumber(data.weeklyGoal, NaN, -2, 2),
    eatBackExercise:form.elements.eatBackExercise.checked
  };
  if (!nextProfile.name || Object.entries(nextProfile).some(([key, value]) => !['name','country','stateCode','eatBackExercise'].includes(key) && !Number.isFinite(value))) {
    toast('Check the goal values before saving.');
    return;
  }
  const currentChanged = Math.abs(nextProfile.currentWeight - state.profile.currentWeight) >= .05;
  state.profile = nextProfile;
  if (currentChanged) recordWeight(localDateKey(), nextProfile.currentWeight);
  syncCurrentWeight();
  saveState();
  render();
  toast('Goals saved.');
});

$('#modalClose').addEventListener('click', () => modal.close());
$('#dateButton').addEventListener('click', () => openModal('date'));
$('#addFoodFab').addEventListener('click', () => openModal('food'));
$('#voiceLogButton').addEventListener('click', startVoiceLog);
$('#waterHabit').addEventListener('click', () => { getDay().water = clamp(getDay().water + 1, 0, 1000); render(); toast('Added 1 cup of water.'); });
$('#stepsHabit').addEventListener('click', () => openModal('habits'));
$('#workoutHabit').addEventListener('click', () => openModal('workout'));
$('#sleepHabit').addEventListener('click', () => openModal('habits'));
$('#exportButton').addEventListener('click', exportData);
$('#importInput').addEventListener('change', event => { if (event.target.files[0]) importData(event.target.files[0]); });
$('#resetButton').addEventListener('click', () => {
  if (confirm('Delete all locally stored PhactoryFit data?')) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    render();
    toast('Local data reset.');
  }
});

$('#modalContent').addEventListener('click', event => {
  if (event.target.id === 'createFoodButton') showCustomFoodForm('', selectedMealFromCurrentModal());
  if (event.target.id === 'lookupBarcode') lookupBarcode($('#barcodeInput').value);
  if (event.target.id === 'cameraBarcode' || event.target.id === 'retryBarcodeCamera') { cameraUnexpectedEndRetries = 0; void startBarcodeCamera(); }
  if (event.target.id === 'barcodeTorch') void toggleBarcodeTorch();
  if (event.target.id === 'barcodeSwitchCamera') void switchBarcodeCamera();
  if (event.target.id === 'resumeBarcodePreview') void resumeBarcodePreview();
  if (event.target.id === 'barcodeStopCamera') {
    stopBarcodeCamera();
    const result = $('#barcodeResult');
    if (result) result.innerHTML = '<p class="form-note">Camera closed. You can type the barcode or try again.</p>';
  }
});

$('#modalContent').addEventListener('change', event => {
  if (event.target.id === 'barcodePhotoInput' && event.target.files?.[0]) {
    void scanBarcodePhoto(event.target.files[0]);
  }
});

$('#modalContent').addEventListener('keydown', event => {
  if (event.target.id === 'barcodeInput' && event.key === 'Enter') {
    event.preventDefault();
    void lookupBarcode(event.target.value);
  }
});

document.addEventListener('visibilitychange', () => {
  if (cameraVisibilityTimer) clearTimeout(cameraVisibilityTimer);
  cameraVisibilityTimer = null;
  // iPhone Safari may dispatch hidden/pagehide-style lifecycle transitions
  // while showing the system camera permission sheet. Never stop a requested
  // camera merely because the page briefly became hidden. When visible again,
  // reattach and resume the same live stream.
  if (!document.hidden && activeMediaStream && modal.open) {
    cameraVisibilityTimer = setTimeout(() => {
      const video = $('#barcodeVideo');
      if (video && video.srcObject !== activeMediaStream) video.srcObject = activeMediaStream;
      if (video?.paused || !video?.videoWidth) void resumeBarcodePreview();
    }, 150);
  }
});
// Do not use pagehide for camera cleanup on iPhone Safari: the permission UI
// can trigger it and would immediately kill the stream the user just allowed.
// Closing the modal stops every track; actual document unload also releases
// media automatically, with beforeunload retained as a best-effort cleanup.
window.addEventListener('beforeunload', stopBarcodeCamera);

modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});
modal.addEventListener('close', () => {
  stopBarcodeCamera();
  if (foodSearchTimer) clearTimeout(foodSearchTimer);
  foodSearchTimer = null;
  foodSearchRequest += 1;
});
window.addEventListener('resize', () => {
  if ($('.view[data-view="progress"]').classList.contains('active')) renderProgress();
});

registerServiceWorker();
render();
