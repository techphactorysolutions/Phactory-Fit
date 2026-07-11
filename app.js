'use strict';

const STORAGE_KEY = 'phactoryfit.v1';
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const VALID_VIEWS = new Set(['today', 'diary', 'log', 'progress', 'coach', 'settings']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
    profile: {name:'Sean',currentWeight:202,goalWeight:175,calorieGoal:2300,proteinGoal:200,carbGoal:230,fatGoal:77,weeklyGoal:-1,eatBackExercise:false},
    days: {[today]: emptyDay()},
    weights: [{date:today,weight:202}],
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

function normalizeFood(raw, fallbackId = uid('food')) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || raw.product_name || '').trim();
  if (!name) return null;
  return {
    id: String(raw.id || fallbackId),
    name,
    brand: String(raw.brand || raw.brands || 'Custom').trim() || 'Custom',
    serving: String(raw.serving || raw.serving_size || '1 serving').trim() || '1 serving',
    calories: round(toNumber(raw.calories, 0, 0, 100000), 4),
    protein: round(toNumber(raw.protein, 0, 0, 10000), 4),
    carbs: round(toNumber(raw.carbs, 0, 0, 10000), 4),
    fat: round(toNumber(raw.fat, 0, 0, 10000), 4),
    fiber: round(toNumber(raw.fiber, 0, 0, 10000), 4),
    sugar: round(toNumber(raw.sugar, 0, 0, 10000), 4),
    sodium: round(toNumber(raw.sodium, 0, 0, 1000000), 4),
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(alias => String(alias).toLowerCase()).filter(Boolean).slice(0, 30) : [],
    barcode: raw.barcode ? String(raw.barcode).replace(/\D/g, '').slice(0, 14) : null,
    source: raw.source ? String(raw.source) : undefined
  };
}

function normalizeLogEntry(raw) {
  const food = normalizeFood(raw, String(raw?.id || uid('logged-food')));
  if (!food) return null;
  return {
    ...food,
    meal: MEALS.includes(raw.meal) ? raw.meal : 'Breakfast',
    quantity: toNumber(raw.quantity, 1, 0.01, 1000),
    logId: String(raw.logId || uid('log'))
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
  if (Array.isArray(source.weights)) {
    source.weights.slice(0, 10000).forEach(entry => {
      if (!entry || !isDateKey(entry.date)) return;
      const weight = toNumber(entry.weight, NaN, 40, 1500);
      if (Number.isFinite(weight)) weightsByDate.set(entry.date, {date:entry.date,weight});
    });
  }
  if (!weightsByDate.size) weightsByDate.set(localDateKey(), {date:localDateKey(),weight:profile.currentWeight});
  const weights = [...weightsByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  profile.currentWeight = weights.at(-1).weight;

  const customFoods = Array.isArray(source.customFoods)
    ? source.customFoods.map((food, index) => normalizeFood(food, `custom-${index}-${Date.now()}`)).filter(Boolean).slice(0, 10000)
    : [];

  const selectedDate = isDateKey(source.selectedDate) ? source.selectedDate : localDateKey();
  if (!days[selectedDate]) days[selectedDate] = emptyDay();

  return {
    version: 2,
    selectedDate,
    profile,
    days,
    weights,
    customFoods,
    recentFoodIds: Array.isArray(source.recentFoodIds) ? [...new Set(source.recentFoodIds.map(String))].slice(0, 12) : [],
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : base.createdAt
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
let barcodeScanSession = 0;
let barcodeCameraStarting = false;
let modalContext = {meal:'Breakfast'};

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

function allFoods() {
  return [...starterFoods, ...state.customFoods];
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
  $('#scoreRing').style.background = `conic-gradient(var(--accent) ${score}%,rgba(255,255,255,.14) ${score}%)`;
  $('#scoreRing').setAttribute('aria-label', `Daily score: ${score} percent`);

  setText('caloriesConsumed', round(totals.calories));
  setText('calorieGoal', round(calorieGoal));
  setText('caloriesRemaining', totals.calories > calorieGoal ? `${round(totals.calories - calorieGoal)} over` : `${round(calorieGoal - totals.calories)} left`);
  $('#calorieBar').style.width = `${clamp(totals.calories / calorieGoal * 100, 0, 100)}%`;
  setText('proteinConsumed', round(totals.protein));
  setText('proteinGoal', profile.proteinGoal);
  setText('proteinRemaining', totals.protein > profile.proteinGoal ? `${round(totals.protein - profile.proteinGoal)}g over` : `${Math.max(0, round(profile.proteinGoal - totals.protein))}g left`);
  $('#proteinBar').style.width = `${clamp(totals.protein / Math.max(1, profile.proteinGoal) * 100, 0, 100)}%`;
  setText('carbConsumed', `${round(totals.carbs)}g`);
  setText('fatConsumed', `${round(totals.fat)}g`);
  setText('carbGoalText', `Goal ${profile.carbGoal} g`);
  setText('fatGoalText', `Goal ${profile.fatGoal} g`);
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
  saveState();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderDiary() {
  const day = getDay();
  $('#mealSections').innerHTML = MEALS.map(meal => {
    const entries = day.foods.filter(food => food.meal === meal);
    const calories = round(entries.reduce((sum, entry) => sum + entry.calories * entry.quantity, 0));
    const body = entries.length
      ? entries.map(entry => `<div class="food-row"><div><h4>${escapeHtml(entry.name)}</h4><p>${escapeHtml(entry.serving)} × ${round(entry.quantity, 2)} · ${round(entry.protein * entry.quantity)}g protein</p></div><div><strong>${round(entry.calories * entry.quantity)} kcal</strong><button type="button" class="remove-food" data-remove-food="${escapeHtml(entry.logId)}" aria-label="Remove ${escapeHtml(entry.name)}">×</button></div></div>`).join('')
      : `<button type="button" class="empty-meal" data-add-meal="${meal}">+ Add ${meal.toLowerCase()}</button>`;
    return `<section class="meal-section"><div class="meal-header"><span>${meal}</span><small>${calories} kcal</small></div>${body}</section>`;
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
  for (let index = 0; index < daysBack; index += 1) {
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
  const x = index => padding.l + index * (cssWidth - padding.l - padding.r) / (weights.length - 1);
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
  weights.forEach((entry, index) => index ? context.lineTo(x(index), y(entry.weight)) : context.moveTo(x(index), y(entry.weight)));
  context.stroke();
  context.fillStyle = '#75f0ae';
  weights.forEach((entry, index) => {
    context.beginPath();
    context.arc(x(index), y(entry.weight), 4, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = '#6b7280';
  context.font = '11px sans-serif';
  context.textAlign = 'left';
  context.fillText(`${round(max, 1)}`, 2, padding.t + 4);
  context.fillText(`${round(min, 1)}`, 2, cssHeight - padding.b + 4);
  context.textAlign = 'center';
  context.fillText(new Date(`${weights[0].date}T12:00:00`).toLocaleDateString(undefined, {month:'short',day:'numeric'}), x(0), cssHeight - 8);
  context.fillText(new Date(`${weights.at(-1).date}T12:00:00`).toLocaleDateString(undefined, {month:'short',day:'numeric'}), x(weights.length - 1), cssHeight - 8);
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

function stopBarcodeCamera() {
  barcodeScanSession += 1;
  barcodeCameraStarting = false;
  if (activeBarcodeTimeout) clearTimeout(activeBarcodeTimeout);
  activeBarcodeTimeout = null;
  try { activeBarcodeControls?.stop?.(); } catch (error) { console.warn('Barcode controls did not stop cleanly', error); }
  activeBarcodeControls = null;
  activeMediaStream?.getTracks?.().forEach(track => track.stop());
  activeMediaStream = null;
  const video = $('#barcodeVideo');
  if (video) {
    video.pause?.();
    video.srcObject = null;
  }
  const shell = $('#barcodeCameraShell');
  if (shell) shell.hidden = true;
  setBarcodeCameraButton(false);
}

function openModal(type, options = {}) {
  const content = $('#modalContent');
  const configurations = {
    food:['Nutrition','Add food'],barcode:['Fast logging','Barcode lookup'],workout:['Training','Log workout'],weight:['Progress','Log weight'],water:['Hydration','Add water'],habits:['Daily inputs','Steps and sleep'],date:['Diary date','Choose a day']
  };
  if (!configurations[type]) return;
  stopBarcodeCamera();
  modalContext = {meal:MEALS.includes(options.meal) ? options.meal : 'Breakfast'};
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
  if (!modal.open) modal.showModal();
  if (type === 'food') {
    $('#foodSearch')?.focus();
    renderFoodResults('');
  }
}

function mealOptions(selected) {
  return MEALS.map(meal => `<option ${meal === selected ? 'selected' : ''}>${meal}</option>`).join('');
}

function foodModal(meal) {
  return `<div class="modal-form"><label>Meal<select id="foodMeal">${mealOptions(meal)}</select></label><label>Search<input id="foodSearch" type="search" placeholder="Chicken, rice, protein shake…" autocomplete="off"></label><div class="inline-actions"><button type="button" class="secondary-button" id="createFoodButton">Create custom food</button></div><div id="foodResults" class="search-results"></div></div>`;
}

function barcodeModal(meal) {
  return `<div class="modal-form"><p class="form-note">Enter a UPC/EAN code, scan it live with the rear camera, or take a barcode photo. Known barcodes work offline. Unknown products can be saved once and remembered on this device.</p><label>Meal<select id="barcodeMeal">${mealOptions(meal)}</select></label><label>Barcode<input id="barcodeInput" inputmode="numeric" autocomplete="off" placeholder="e.g. 049000050103"></label><div class="inline-actions"><button type="button" class="primary-button" id="lookupBarcode">Look up</button><button type="button" class="secondary-button" id="cameraBarcode" aria-pressed="false">Use camera</button></div><label class="secondary-button file-label barcode-photo-button">Take barcode photo<input id="barcodePhotoInput" type="file" accept="image/*" capture="environment"></label><div id="barcodeCameraShell" class="barcode-camera-shell" hidden><video id="barcodeVideo" playsinline muted autoplay aria-label="Live barcode camera preview"></video><div class="barcode-scan-guide" aria-hidden="true"></div></div><div id="barcodeResult" role="status" aria-live="polite"></div></div>`;
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

function renderFoodResults(query) {
  const target = $('#foodResults');
  if (!target) return;
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const recentMap = new Map(state.recentFoodIds.map((id, index) => [id, index]));
  const foods = allFoods().filter(food => {
    const name = String(food.name || '').toLowerCase();
    const brand = String(food.brand || '').toLowerCase();
    return !normalizedQuery || name.includes(normalizedQuery) || brand.includes(normalizedQuery) || (food.aliases || []).some(alias => String(alias).toLowerCase().includes(normalizedQuery));
  });
  foods.sort((first, second) => (recentMap.get(first.id) ?? 999) - (recentMap.get(second.id) ?? 999) || first.name.localeCompare(second.name));
  target.innerHTML = foods.slice(0, 30).map(food => `<button type="button" class="search-result" data-food-id="${escapeHtml(food.id)}"><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.brand)} · ${escapeHtml(food.serving)} · ${round(food.calories)} kcal · ${round(food.protein, 1)}g protein</small></button>`).join('') || '<p class="form-note">No match. Create a custom food.</p>';
}

function showFoodQuantity(food, meal = modalContext.meal) {
  const selectedMeal = MEALS.includes(meal) ? meal : 'Breakfast';
  modalContext.meal = selectedMeal;
  $('#modalContent').innerHTML = `<form id="addFoodForm" class="modal-form"><div class="search-result"><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.serving)} · ${round(food.calories)} kcal · ${round(food.protein, 1)}g protein</small></div><label>Meal<select name="meal">${mealOptions(selectedMeal)}</select></label><label>Number of servings<input name="quantity" type="number" step="0.01" min="0.01" max="1000" value="1" required></label><input name="foodId" type="hidden" value="${escapeHtml(food.id)}"><button class="primary-button" type="submit">Add to diary</button></form>`;
}

function showCustomFoodForm(barcode = '', meal = modalContext.meal) {
  const selectedMeal = MEALS.includes(meal) ? meal : 'Breakfast';
  modalContext.meal = selectedMeal;
  $('#modalContent').innerHTML = `<form id="customFoodForm" class="modal-form">${barcode ? `<p class="form-note">This food will be linked to barcode ${escapeHtml(barcode)} for future scans.</p>` : ''}<input name="barcode" type="hidden" value="${escapeHtml(barcode)}"><input name="meal" type="hidden" value="${selectedMeal}"><label>Food name<input name="name" maxlength="200" required></label><label>Brand<input name="brand" maxlength="200" value="Custom"></label><label>Serving description<input name="serving" maxlength="200" placeholder="1 serving, 100 g, 1 cup" required></label><div class="two-col"><label>Calories<input name="calories" type="number" step="0.1" min="0" max="100000" required></label><label>Protein (g)<input name="protein" type="number" step="0.1" min="0" max="10000" required></label></div><div class="two-col"><label>Carbs (g)<input name="carbs" type="number" step="0.1" min="0" max="10000" value="0" required></label><label>Fat (g)<input name="fat" type="number" step="0.1" min="0" max="10000" value="0" required></label></div><div class="two-col"><label>Fiber (g)<input name="fiber" type="number" step="0.1" min="0" max="10000" value="0"></label><label>Sodium (mg)<input name="sodium" type="number" step="0.1" min="0" max="1000000" value="0"></label></div><button class="primary-button" type="submit">Save food</button></form>`;
}

function servingFactor(servingText) {
  const match = String(servingText || '').match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
  return match ? Number(match[1]) / 100 : 1;
}

function productNutrient(product, nutrientNames, factor = 1) {
  const nutrition = product.nutriments || product.nutrition || {};
  for (const name of nutrientNames) {
    const directCandidates = [product[name], nutrition[name], nutrition[`${name}_serving`]];
    for (const candidate of directCandidates) {
      const number = Number(candidate);
      if (Number.isFinite(number)) return number;
    }
  }
  for (const name of nutrientNames) {
    const number = Number(nutrition[`${name}_100g`]);
    if (Number.isFinite(number)) return number * factor;
  }
  return 0;
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {signal:controller.signal,headers:{Accept:'application/json'}});
  } finally {
    clearTimeout(timer);
  }
}

async function lookupBarcode(code) {
  const result = $('#barcodeResult');
  const normalizedCode = String(code || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(normalizedCode)) {
    result.innerHTML = '<p class="form-note">Enter a valid 8–14 digit barcode.</p>';
    return;
  }
  const selectedMeal = MEALS.includes($('#barcodeMeal')?.value) ? $('#barcodeMeal').value : modalContext.meal;
  modalContext.meal = selectedMeal;
  const localFood = allFoods().find(food => String(food.barcode || '') === normalizedCode);
  if (localFood) {
    result.innerHTML = `<div class="search-result"><strong>${escapeHtml(localFood.name)}</strong><small>${escapeHtml(localFood.brand)} · ${escapeHtml(localFood.serving)} · ${round(localFood.calories)} kcal · ${round(localFood.protein, 1)}g protein</small></div><button type="button" id="addBarcodeFood" class="primary-button">Add product</button>`;
    $('#addBarcodeFood').onclick = () => showFoodQuantity(localFood, selectedMeal);
    return;
  }

  const proxy = window.PHACTORYFIT_CONFIG?.offProxyUrl?.trim();
  if (proxy) {
    result.innerHTML = '<p class="form-note">Looking up product…</p>';
    try {
      const response = await fetchWithTimeout(`${proxy}${proxy.includes('?') ? '&' : '?'}barcode=${encodeURIComponent(normalizedCode)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const product = data.product || data;
      if (!product || (!product.product_name && !product.name)) throw new Error('Product not found');
      const serving = product.serving_size || product.serving || '100 g';
      const factor = servingFactor(serving);
      const sodiumGrams = productNutrient(product, ['sodium'], factor);
      const normalizedFood = normalizeFood({
        id:`off-${normalizedCode}`,
        name:product.product_name || product.name,
        brand:product.brands || product.brand || 'Open Food Facts',
        serving,
        calories:productNutrient(product, ['calories','energy-kcal'], factor),
        protein:productNutrient(product, ['protein','proteins'], factor),
        carbs:productNutrient(product, ['carbs','carbohydrates'], factor),
        fat:productNutrient(product, ['fat'], factor),
        fiber:productNutrient(product, ['fiber'], factor),
        sugar:productNutrient(product, ['sugar','sugars'], factor),
        sodium:Number(product.sodium_mg ?? product.nutriments?.sodium_mg_serving ?? sodiumGrams * 1000),
        aliases:[],source:'Open Food Facts',barcode:normalizedCode
      }, `off-${normalizedCode}`);
      if (!normalizedFood) throw new Error('Invalid product data');
      const existingIndex = state.customFoods.findIndex(food => food.id === normalizedFood.id);
      if (existingIndex >= 0) state.customFoods[existingIndex] = normalizedFood;
      else state.customFoods.push(normalizedFood);
      saveState();
      result.innerHTML = `<div class="search-result"><strong>${escapeHtml(normalizedFood.name)}</strong><small>${escapeHtml(normalizedFood.brand)} · ${escapeHtml(normalizedFood.serving)} · ${round(normalizedFood.calories)} kcal · ${round(normalizedFood.protein, 1)}g protein</small></div><button type="button" id="addBarcodeFood" class="primary-button">Add product</button>`;
      $('#addBarcodeFood').onclick = () => showFoodQuantity(normalizedFood, selectedMeal);
      return;
    } catch (error) {
      console.warn('Barcode lookup failed', error);
    }
  }

  result.innerHTML = '<p class="form-note">This barcode is not in your local library yet.</p><button type="button" id="teachBarcodeFood" class="primary-button">Create and remember food</button>';
  $('#teachBarcodeFood').onclick = () => showCustomFoodForm(normalizedCode, selectedMeal);
}

function barcodeCameraErrorMessage(error) {
  const name = String(error?.name || '');
  if (!window.isSecureContext) return 'Camera access requires the secure HTTPS version of PhactoryFit. Open the GitHub Pages link instead of a downloaded HTML file.';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Camera permission was blocked. Allow camera access for this site in Safari or browser settings, then tap Use camera again.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No usable camera was found on this device.';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'The camera is busy or unavailable. Close other camera apps and try again.';
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') return 'The rear camera could not start with the requested settings. Try again after rotating the phone.';
  if (name === 'ScannerLibraryUnavailable') return 'The barcode scanner did not finish loading. Refresh PhactoryFit once while online, then try again.';
  return 'The camera could not start. Check camera permission and try again.';
}

function normalizeScannedBarcode(value) {
  const code = String(value || '').replace(/\D/g, '').slice(0, 14);
  return code.length >= 8 && code.length <= 14 ? code : '';
}

async function scanBarcodePhoto(file) {
  const result = $('#barcodeResult');
  if (!result || !file) return;
  if (!String(file.type || '').startsWith('image/')) {
    result.innerHTML = '<p class="form-note">Choose a photo containing a UPC or EAN barcode.</p>';
    return;
  }

  stopBarcodeCamera();
  result.innerHTML = '<p class="form-note camera-status">Reading barcode photo…</p>';
  let objectUrl = '';
  let bitmap = null;
  try {
    let rawValue = '';
    if ('BarcodeDetector' in window && globalThis.createImageBitmap) {
      bitmap = await createImageBitmap(file);
      const detector = new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
      const codes = await detector.detect(bitmap);
      rawValue = codes.find(code => normalizeScannedBarcode(code.rawValue))?.rawValue || '';
    }

    if (!rawValue) {
      if (!window.ZXingBrowser?.BrowserMultiFormatReader) {
        const error = new Error('ZXing browser scanner unavailable');
        error.name = 'ScannerLibraryUnavailable';
        throw error;
      }
      objectUrl = URL.createObjectURL(file);
      const reader = new window.ZXingBrowser.BrowserMultiFormatReader();
      const decoded = await reader.decodeFromImageUrl(objectUrl);
      rawValue = typeof decoded?.getText === 'function' ? decoded.getText() : decoded?.text;
    }

    const code = normalizeScannedBarcode(rawValue);
    if (!code) throw new DOMException('No supported barcode detected.', 'NotFoundError');
    const input = $('#barcodeInput');
    if (input) input.value = code;
    await lookupBarcode(code);
  } catch (error) {
    console.warn('Barcode photo scan failed', error);
    const currentResult = $('#barcodeResult');
    if (currentResult) currentResult.innerHTML = `<p class="form-note">${escapeHtml(error?.name === 'ScannerLibraryUnavailable' ? barcodeCameraErrorMessage(error) : 'No barcode was found in that photo. Fill the frame with the barcode, avoid glare, and try again.')}</p>`;
  } finally {
    bitmap?.close?.();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const input = $('#barcodePhotoInput');
    if (input) input.value = '';
  }
}

async function completeBarcodeScan(rawValue, session) {
  if (session !== barcodeScanSession || !modal.open) return;
  const code = normalizeScannedBarcode(rawValue);
  if (!code) return;
  const input = $('#barcodeInput');
  if (input) input.value = code;
  stopBarcodeCamera();
  await lookupBarcode(code);
}

async function startNativeBarcodeScanner(video, result, session) {
  const detector = new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
  activeMediaStream = await navigator.mediaDevices.getUserMedia({
    audio:false,
    video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}
  });
  if (session !== barcodeScanSession || !modal.open) {
    stopBarcodeCamera();
    return;
  }
  video.srcObject = activeMediaStream;
  await video.play();
  result.innerHTML = '<p class="form-note camera-status">Camera ready. Center the barcode inside the frame and hold still.</p>';
  const started = Date.now();
  while (Date.now() - started < 30000 && session === barcodeScanSession && modal.open && activeMediaStream) {
    const codes = await detector.detect(video);
    if (codes.length && normalizeScannedBarcode(codes[0].rawValue)) {
      await completeBarcodeScan(codes[0].rawValue, session);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 180));
  }
  if (session === barcodeScanSession) throw new DOMException('No barcode detected before timeout.', 'TimeoutError');
}

async function startZxingBarcodeScanner(video, result, session) {
  if (!window.ZXingBrowser?.BrowserMultiFormatReader) {
    const error = new Error('ZXing browser scanner unavailable');
    error.name = 'ScannerLibraryUnavailable';
    throw error;
  }

  const reader = new window.ZXingBrowser.BrowserMultiFormatReader(undefined, {
    delayBetweenScanAttempts: 120,
    delayBetweenScanSuccess: 500
  });
  if (window.ZXingBrowser.BarcodeFormat) {
    reader.possibleFormats = [
      window.ZXingBrowser.BarcodeFormat.EAN_13,
      window.ZXingBrowser.BarcodeFormat.EAN_8,
      window.ZXingBrowser.BarcodeFormat.UPC_A,
      window.ZXingBrowser.BarcodeFormat.UPC_E
    ];
  }

  const controls = await reader.decodeFromConstraints({
    audio:false,
    video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}
  }, video, (scanResult, scanError, callbackControls) => {
    if (session !== barcodeScanSession || !modal.open) {
      callbackControls?.stop?.();
      return;
    }
    if (!scanResult) return;
    const text = typeof scanResult.getText === 'function' ? scanResult.getText() : scanResult.text;
    if (!normalizeScannedBarcode(text)) return;
    activeBarcodeControls = callbackControls || activeBarcodeControls;
    void completeBarcodeScan(text, session);
  });

  if (session !== barcodeScanSession || !modal.open) {
    controls?.stop?.();
    return;
  }
  activeBarcodeControls = controls;
  activeMediaStream = video.srcObject;
  result.innerHTML = '<p class="form-note camera-status">Camera ready. Center the barcode inside the frame and hold still.</p>';
  activeBarcodeTimeout = setTimeout(() => {
    if (session !== barcodeScanSession) return;
    stopBarcodeCamera();
    const currentResult = $('#barcodeResult');
    if (currentResult) currentResult.innerHTML = '<p class="form-note">No barcode was detected. Improve the lighting, move the package slightly farther away, and try again.</p>';
  }, 30000);
}

async function startBarcodeCamera() {
  const result = $('#barcodeResult');
  const video = $('#barcodeVideo');
  const shell = $('#barcodeCameraShell');
  if (!result || !video || !shell) return;

  if (barcodeCameraStarting || activeMediaStream || activeBarcodeControls) {
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
  shell.hidden = false;
  setBarcodeCameraButton(true);
  result.innerHTML = '<p class="form-note camera-status">Requesting camera access…</p>';

  try {
    if ('BarcodeDetector' in window) {
      try {
        await startNativeBarcodeScanner(video, result, session);
      } catch (nativeError) {
        if (session !== barcodeScanSession) return;
        const permissionErrors = new Set(['NotAllowedError','PermissionDeniedError','NotFoundError','NotReadableError','SecurityError']);
        if (permissionErrors.has(String(nativeError?.name || ''))) throw nativeError;
        console.warn('Native barcode detector unavailable; switching to bundled scanner', nativeError);
        stopBarcodeCamera();
        const fallbackSession = barcodeScanSession;
        barcodeCameraStarting = true;
        shell.hidden = false;
        setBarcodeCameraButton(true);
        result.innerHTML = '<p class="form-note camera-status">Starting camera scanner…</p>';
        await startZxingBarcodeScanner(video, result, fallbackSession);
      }
    } else {
      await startZxingBarcodeScanner(video, result, session);
    }
  } catch (error) {
    if (session !== barcodeScanSession && !barcodeCameraStarting) return;
    console.warn('Camera barcode scan failed', error);
    stopBarcodeCamera();
    const currentResult = $('#barcodeResult');
    if (currentResult) currentResult.innerHTML = `<p class="form-note">${escapeHtml(barcodeCameraErrorMessage(error))}</p>`;
  } finally {
    barcodeCameraStarting = false;
    if (!activeMediaStream && !activeBarcodeControls) setBarcodeCameraButton(false);
  }
}

function startVoiceLog() {
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
        renderFoodResults(text);
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
    if (!file || file.size > 20 * 1024 * 1024) throw new Error('Backup is missing or too large');
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
  navigator.serviceWorker.register('./service-worker.js').then(registration => registration.update()).catch(error => console.warn('Service worker unavailable', error));
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
  const navigation = event.target.closest('[data-view-target]');
  if (navigation) { navigate(navigation.dataset.viewTarget); return; }
  const link = event.target.closest('[data-nav]');
  if (link) { navigate(link.dataset.nav); return; }
  const modalButton = event.target.closest('[data-modal]');
  if (modalButton) { openModal(modalButton.dataset.modal); return; }
  const mealButton = event.target.closest('[data-add-meal]');
  if (mealButton) { openModal('food', {meal:mealButton.dataset.addMeal}); return; }
  const remove = event.target.closest('[data-remove-food]');
  if (remove) {
    getDay().foods = getDay().foods.filter(food => food.logId !== remove.dataset.removeFood);
    render();
    toast('Food removed.');
    return;
  }
  const foodChoice = event.target.closest('[data-food-id]');
  if (foodChoice) {
    const food = allFoods().find(item => item.id === foodChoice.dataset.foodId);
    if (food) showFoodQuantity(food, selectedMealFromCurrentModal());
    return;
  }
  const coachAction = event.target.closest('[data-coach-action]');
  if (coachAction) {
    coachActionHandlers[coachAction.dataset.coachAction]?.();
    return;
  }
  const rescue = event.target.closest('[data-rescue-food]');
  if (rescue) {
    const food = allFoods().find(item => item.id === rescue.dataset.rescueFood);
    if (food) {
      openModal('food');
      showFoodQuantity(food, 'Snacks');
    }
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'foodSearch') renderFoodResults(event.target.value);
});

document.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));

  if (form.id === 'addFoodForm') {
    const food = allFoods().find(item => item.id === data.foodId);
    const quantity = toNumber(data.quantity, NaN, 0.01, 1000);
    if (!food || !Number.isFinite(quantity) || !MEALS.includes(data.meal)) { toast('Check the serving amount and meal.'); return; }
    getDay().foods.push({...food,meal:data.meal,quantity,logId:uid('log')});
    state.recentFoodIds = [food.id, ...state.recentFoodIds.filter(id => id !== food.id)].slice(0, 12);
    modal.close();
    render();
    toast(`${food.name} added.`);
    return;
  }

  if (form.id === 'customFoodForm') {
    const food = normalizeFood({
      id:uid('custom'),name:String(data.name || '').trim(),brand:String(data.brand || '').trim() || 'Custom',serving:String(data.serving || '').trim(),
      calories:data.calories,protein:data.protein,carbs:data.carbs,fat:data.fat,fiber:data.fiber,sugar:0,sodium:data.sodium,aliases:[],barcode:data.barcode || null
    });
    if (!food || !food.serving) { toast('Complete the required food fields.'); return; }
    state.customFoods.push(food);
    saveState();
    showFoodQuantity(food, MEALS.includes(data.meal) ? data.meal : modalContext.meal);
    return;
  }

  if (form.id === 'workoutForm') {
    const minutes = toNumber(data.minutes, NaN, 1, 1440);
    const calories = toNumber(data.calories, 0, 0, 20000);
    if (!Number.isFinite(minutes) || !String(data.name || '').trim()) { toast('Enter a workout name and valid duration.'); return; }
    const day = getDay();
    day.workoutMinutes += minutes;
    day.exerciseCalories += calories;
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
    getDay().water = Math.max(0, getDay().water + change);
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
    currentWeight:toNumber(data.currentWeight, NaN, 40, 1500),
    goalWeight:toNumber(data.goalWeight, NaN, 40, 1500),
    calorieGoal:Math.round(toNumber(data.calorieGoal, NaN, 500, 10000)),
    proteinGoal:Math.round(toNumber(data.proteinGoal, NaN, 1, 1000)),
    carbGoal:Math.round(toNumber(data.carbGoal, NaN, 0, 2000)),
    fatGoal:Math.round(toNumber(data.fatGoal, NaN, 0, 1000)),
    weeklyGoal:toNumber(data.weeklyGoal, NaN, -2, 2),
    eatBackExercise:form.elements.eatBackExercise.checked
  };
  if (!nextProfile.name || Object.entries(nextProfile).some(([key, value]) => key !== 'name' && key !== 'eatBackExercise' && !Number.isFinite(value))) {
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
$('#waterHabit').addEventListener('click', () => { getDay().water += 1; render(); toast('Added 1 cup of water.'); });
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
  if (event.target.id === 'cameraBarcode') startBarcodeCamera();
});

$('#modalContent').addEventListener('change', event => {
  if (event.target.id === 'barcodePhotoInput' && event.target.files?.[0]) {
    void scanBarcodePhoto(event.target.files[0]);
  }
});

modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});
modal.addEventListener('close', stopBarcodeCamera);
window.addEventListener('resize', () => {
  if ($('.view[data-view="progress"]').classList.contains('active')) renderProgress();
});

registerServiceWorker();
render();
