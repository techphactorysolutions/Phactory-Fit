'use strict';

const STORAGE_KEY = 'phactoryfit.v1';
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
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
  {name:'Whey protein + water',protein:24,calories:120},
  {name:'1 can tuna',protein:26,calories:120},
  {name:'4 oz chicken breast',protein:35,calories:187},
  {name:'Protein milk',protein:30,calories:150},
  {name:'1 cup nonfat Greek yogurt',protein:23,calories:130},
  {name:'4 oz cooked shrimp',protein:24,calories:112}
];

function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0,10);
}

function defaultState() {
  const today = localDateKey();
  return {
    version: 1,
    selectedDate: today,
    profile: {name:'Sean',currentWeight:202,goalWeight:175,calorieGoal:2300,proteinGoal:200,carbGoal:230,fatGoal:77,weeklyGoal:-1,eatBackExercise:false},
    days: {[today]: emptyDay()},
    weights: [{date:today,weight:202}],
    customFoods: [],
    recentFoodIds: [],
    createdAt: new Date().toISOString()
  };
}

function emptyDay() {
  return {foods:[],water:0,steps:0,workoutMinutes:0,exerciseCalories:0,sleep:0,notes:''};
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {...defaultState(),...parsed,profile:{...defaultState().profile,...parsed.profile}};
  } catch (error) {
    console.error('Could not load state', error);
    return defaultState();
  }
}

let state = loadState();
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const modal = $('#modal');
let toastTimer;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDay(date = state.selectedDate) {
  if (!state.days[date]) state.days[date] = emptyDay();
  return state.days[date];
}

function allFoods() {
  return [...starterFoods, ...state.customFoods];
}

function round(value, places=0) {
  const factor = 10 ** places;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function totalsFor(date = state.selectedDate) {
  const day = getDay(date);
  const totals = day.foods.reduce((acc, entry) => {
    ['calories','protein','carbs','fat','fiber','sugar','sodium'].forEach(k => acc[k] += (Number(entry[k]) || 0) * (Number(entry.quantity) || 1));
    return acc;
  },{calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0});
  Object.keys(totals).forEach(k => totals[k] = round(totals[k],1));
  return totals;
}

function effectiveCalorieGoal(day = getDay()) {
  return state.profile.calorieGoal + (state.profile.eatBackExercise ? Number(day.exerciseCalories || 0) : 0);
}

function dateLabel(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now()-86400000));
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  return date.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

function computeScore() {
  const totals = totalsFor();
  const day = getDay();
  const calorieGoal = effectiveCalorieGoal(day);
  let score = 0;
  const calorieRatio = totals.calories / calorieGoal;
  if (totals.calories > 0) score += calorieRatio >= .9 && calorieRatio <= 1.1 ? 25 : clamp((1-Math.abs(1-calorieRatio))*25,0,22);
  score += clamp(totals.protein/state.profile.proteinGoal,0,1)*25;
  score += clamp(day.water/8,0,1)*10;
  score += clamp(day.steps/8000,0,1)*10;
  score += clamp(day.workoutMinutes/30,0,1)*15;
  score += clamp(day.sleep/7,0,1)*15;
  return round(score);
}

function coachInsight() {
  const totals = totalsFor();
  const day = getDay();
  const goal = effectiveCalorieGoal(day);
  const proteinLeft = Math.max(0, state.profile.proteinGoal - totals.protein);
  const caloriesLeft = goal - totals.calories;
  if (totals.calories === 0) return {title:'Start with your first meal',body:'Logging one meal is enough to begin. PhactoryFit will update your remaining calories and protect your protein minimum automatically.',actions:['Log breakfast','Scan a barcode']};
  if (proteinLeft > 50 && caloriesLeft < 500) return {title:'Protein needs attention',body:`You have about ${round(proteinLeft)} g of protein left with ${round(caloriesLeft)} calories remaining. Choose a lean protein source before adding calorie-dense extras.`,actions:['Open protein rescue','Log food']};
  if (totals.protein >= state.profile.proteinGoal && totals.calories <= goal) return {title:'Protein floor secured',body:`You reached ${round(totals.protein)} g of protein and still have ${Math.max(0,round(caloriesLeft))} calories available. Finish the day based on hunger and training needs.`,actions:['Review diary']};
  if (totals.calories > goal * 1.1) return {title:'No punishment needed',body:`You are ${round(Math.abs(caloriesLeft))} calories over today’s target. Keep logging accurately and return to the normal plan tomorrow instead of crash-restricting.`,actions:['Review diary']};
  if (day.sleep > 0 && day.sleep < 6) return {title:'Recovery may limit performance',body:`You logged ${day.sleep} hours of sleep. Keep training flexible today and prioritize a normal bedtime rather than forcing extra volume.`,actions:['Update sleep']};
  return {title:'You are on track',body:`You have ${Math.max(0,round(caloriesLeft))} calories and ${round(proteinLeft)} g of protein remaining. Your next meal should be built around protein first.`,actions:['Log food','Open protein rescue']};
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
  $('#greeting').textContent = `${hour<12?'Good morning':hour<18?'Good afternoon':'Good evening'}, ${profile.name}`;
  $('#coachHeadline').textContent = score >= 80 ? 'Strong consistency today. Keep the finish simple.' : score >= 45 ? 'A few focused actions can turn this into a strong day.' : 'Start small: log the next thing you eat or drink.';
  $('#dailyScore').textContent = score;
  $('#scoreRing').style.background = `conic-gradient(var(--accent) ${score}%,rgba(255,255,255,.14) ${score}%)`;

  setText('caloriesConsumed', round(totals.calories)); setText('calorieGoal', round(calorieGoal));
  setText('caloriesRemaining', `${round(calorieGoal-totals.calories)} left`);
  $('#calorieBar').style.width = `${clamp(totals.calories/calorieGoal*100,0,100)}%`;
  setText('proteinConsumed', round(totals.protein)); setText('proteinGoal', profile.proteinGoal);
  setText('proteinRemaining', `${Math.max(0,round(profile.proteinGoal-totals.protein))}g left`);
  $('#proteinBar').style.width = `${clamp(totals.protein/profile.proteinGoal*100,0,100)}%`;
  setText('carbConsumed', `${round(totals.carbs)}g`); setText('fatConsumed', `${round(totals.fat)}g`);
  setText('carbGoalText', `Goal ${profile.carbGoal} g`); setText('fatGoalText', `Goal ${profile.fatGoal} g`);
  setText('waterValue', day.water); setText('stepsValue', day.steps.toLocaleString()); setText('workoutValue', day.workoutMinutes); setText('sleepValue', day.sleep);
  setText('insightTitle', insight.title); setText('insightBody', insight.body);
  $('#coachActions').innerHTML = insight.actions.map(a=>`<button class="chip" data-coach-action="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('');

  renderDiary();
  renderProgress();
  renderCoach();
  populateSettings();
  saveState();
}

function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

function renderDiary() {
  const day = getDay();
  $('#mealSections').innerHTML = MEALS.map(meal => {
    const entries = day.foods.filter(f=>f.meal===meal);
    const cals = round(entries.reduce((sum,e)=>sum+e.calories*e.quantity,0));
    return `<section class="meal-section"><div class="meal-header"><span>${meal}</span><small>${cals} kcal</small></div>${entries.length ? entries.map(entry=>`<div class="food-row"><div><h4>${escapeHtml(entry.name)}</h4><p>${escapeHtml(entry.serving)} × ${entry.quantity} · ${round(entry.protein*entry.quantity)}g protein</p></div><div><strong>${round(entry.calories*entry.quantity)} kcal</strong><button class="remove-food" data-remove-food="${entry.logId}" aria-label="Remove ${escapeHtml(entry.name)}">×</button></div></div>`).join('') : `<button class="empty-meal" data-add-meal="${meal}">+ Add ${meal.toLowerCase()}</button>`}</section>`;
  }).join('');
}

function renderProgress() {
  const weights = [...state.weights].sort((a,b)=>a.date.localeCompare(b.date));
  const latest = weights.at(-1)?.weight ?? state.profile.currentWeight;
  const first = weights[0]?.weight ?? latest;
  setText('currentWeight', `${round(latest,1)} lb`); setText('goalWeight', `${round(state.profile.goalWeight,1)} lb`);
  const change = round(latest-first,1); setText('weightChange', `${change>0?'+':''}${change} lb`);
  const recommendation = adaptiveRecommendation(weights);
  setText('adaptiveRecommendation', recommendation.body); setText('trendLabel', recommendation.label);
  renderWeightChart(weights.slice(-30));
  renderConsistency();
}

function adaptiveRecommendation(weights) {
  if (weights.length < 4) return {label:'Need data',body:'Log at least four morning weigh-ins and keep your food diary reasonably complete. No calorie adjustment will be suggested until the trend is meaningful.'};
  const sorted = [...weights].sort((a,b)=>a.date.localeCompare(b.date));
  const recent = sorted.slice(-3);
  const prior = sorted.slice(-6,-3);
  if (prior.length < 3) return {label:'Learning',body:'The trend engine is learning your normal fluctuations. Keep calories stable and continue logging.'};
  const recentAvg = recent.reduce((s,x)=>s+x.weight,0)/recent.length;
  const priorAvg = prior.reduce((s,x)=>s+x.weight,0)/prior.length;
  const days = Math.max(1,(new Date(`${recent.at(-1).date}T12:00:00`) - new Date(`${prior[0].date}T12:00:00`))/86400000);
  const weeklyRate = (recentAvg-priorAvg)/days*7;
  const desired = Number(state.profile.weeklyGoal);
  const adherence = diaryAdherence(7);
  if (adherence < .6) return {label:'Hold calories',body:`Your estimated trend is ${weeklyRate>0?'+':''}${round(weeklyRate,2)} lb/week, but fewer than 60% of recent days have usable nutrition logs. Keep the current target until the input data is more consistent.`};
  if (Math.abs(weeklyRate-desired) <= .35) return {label:'On target',body:`Your estimated trend is ${weeklyRate>0?'+':''}${round(weeklyRate,2)} lb/week, close to the ${desired} lb/week plan. Keep calories at ${state.profile.calorieGoal}.`};
  if (desired < 0 && weeklyRate > desired + .35) return {label:'Review −100 kcal',body:`Your estimated trend is ${weeklyRate>0?'+':''}${round(weeklyRate,2)} lb/week, slower than the ${desired} lb/week goal. A cautious option is reducing the daily target by about 100 calories, then reassessing after another week.`};
  if (desired < 0 && weeklyRate < desired - .35) return {label:'Review +100 kcal',body:`Your estimated trend is ${round(weeklyRate,2)} lb/week, faster than the ${desired} lb/week goal. A cautious option is adding about 100 calories per day to improve sustainability and training recovery.`};
  return {label:'Hold calories',body:`Your estimated trend is ${weeklyRate>0?'+':''}${round(weeklyRate,2)} lb/week. Keep the current target for another week unless performance, hunger, or recovery is deteriorating.`};
}

function diaryAdherence(daysBack=7) {
  let usable=0;
  for (let i=0;i<daysBack;i++) {
    const d=localDateKey(new Date(Date.now()-i*86400000));
    const totals=totalsFor(d);
    if (totals.calories >= state.profile.calorieGoal*.6) usable++;
  }
  return usable/daysBack;
}

function renderConsistency() {
  const nodes=[];
  for(let i=6;i>=0;i--){
    const date=localDateKey(new Date(Date.now()-i*86400000));
    const totals=totalsFor(date); const day=getDay(date);
    const hitProtein=totals.protein>=state.profile.proteinGoal;
    const logged=totals.calories>=state.profile.calorieGoal*.6;
    const cls=hitProtein&&logged?'good':logged?'partial':'';
    nodes.push(`<div class="day-dot ${cls}"><span title="${date}"></span><small>${new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'narrow'})}</small></div>`);
  }
  $('#consistencyGrid').innerHTML=nodes.join('');
}

function renderWeightChart(weights) {
  const canvas=$('#weightChart'); const ctx=canvas.getContext('2d');
  const ratio=window.devicePixelRatio||1; const cssWidth=canvas.clientWidth||700; const cssHeight=Math.min(320,cssWidth*.46);
  canvas.width=cssWidth*ratio; canvas.height=cssHeight*ratio; ctx.scale(ratio,ratio); ctx.clearRect(0,0,cssWidth,cssHeight);
  if(weights.length<2){ctx.fillStyle='#8a929e';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('Add more weigh-ins to see your trend',cssWidth/2,cssHeight/2);return;}
  const values=weights.map(w=>w.weight); let min=Math.min(...values); let max=Math.max(...values); if(max-min<2){min-=1;max+=1;}
  const pad={l:38,r:18,t:20,b:30}; const x=i=>pad.l+i*(cssWidth-pad.l-pad.r)/(weights.length-1); const y=v=>pad.t+(max-v)*(cssHeight-pad.t-pad.b)/(max-min);
  ctx.strokeStyle='#e3e7eb';ctx.lineWidth=1;
  for(let i=0;i<4;i++){const yy=pad.t+i*(cssHeight-pad.t-pad.b)/3;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(cssWidth-pad.r,yy);ctx.stroke();}
  ctx.strokeStyle='#111827';ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();weights.forEach((w,i)=>i?ctx.lineTo(x(i),y(w.weight)):ctx.moveTo(x(i),y(w.weight)));ctx.stroke();
  ctx.fillStyle='#75f0ae';weights.forEach((w,i)=>{ctx.beginPath();ctx.arc(x(i),y(w.weight),4,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#6b7280';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(`${round(max,1)}`,2,pad.t+4);ctx.fillText(`${round(min,1)}`,2,cssHeight-pad.b+4);
  ctx.textAlign='center';ctx.fillText(new Date(`${weights[0].date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'}),x(0),cssHeight-8);ctx.fillText(new Date(`${weights.at(-1).date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'}),x(weights.length-1),cssHeight-8);
}

function renderCoach() {
  const totals=totalsFor(); const day=getDay(); const insight=coachInsight();
  setText('coachMainTitle',insight.title); setText('coachMainBody',insight.body);
  const feed=[];
  const proteinDensity=totals.calories?round(totals.protein/totals.calories*100,1):0;
  feed.push({title:'Protein density',body:totals.calories?`Today’s food provides ${proteinDensity} g of protein per 100 calories. For a high-protein cut, keeping this near 8–10 g can make the target easier.`:'Log food to calculate protein density.'});
  feed.push({title:'Exercise calories',body:state.profile.eatBackExercise?`Exercise calories are currently added to your food budget. Today that changes the target by ${day.exerciseCalories} calories.`:'Exercise calories are not automatically added to your food budget, reducing the risk of double-counting wearable estimates.'});
  feed.push({title:'Recovery check',body:day.sleep?`${day.sleep} hours of sleep logged. ${day.sleep>=7?'Recovery input is in a solid range.':'Consider lowering workout intensity if performance or coordination feels off.'}`:'No sleep entry yet. Logging it helps the coach distinguish nutrition problems from recovery problems.'});
  $('#coachFeed').innerHTML=feed.map(x=>`<article class="coach-item"><h4>${x.title}</h4><p>${x.body}</p></article>`).join('');
  const left=Math.max(0,state.profile.proteinGoal-totals.protein);
  $('#proteinRescue').innerHTML=rescueFoods.map(f=>`<button class="rescue-item" data-rescue="${escapeHtml(f.name)}"><span><strong>${escapeHtml(f.name)}</strong><small>${f.calories} calories</small></span><strong>${f.protein}g</strong></button>`).join('') + (left?`<p class="fine-print">You have approximately ${round(left)} g remaining today.</p>`:'<p class="fine-print">Protein minimum reached.</p>');
}

function populateSettings(){
  const form=$('#settingsForm'); if(!form)return;
  Object.entries(state.profile).forEach(([key,val])=>{const input=form.elements[key];if(input){if(input.type==='checkbox')input.checked=Boolean(val);else input.value=val;}});
}

function navigate(view){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
  $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.viewTarget===view));
  window.scrollTo({top:0,behavior:'smooth'}); $('#app').focus({preventScroll:true});
  if(view==='progress')setTimeout(()=>renderProgress(),30);
}

function openModal(type, options={}){
  const content=$('#modalContent');
  const configs={
    food:['Nutrition','Add food'],barcode:['Fast logging','Barcode lookup'],workout:['Training','Log workout'],weight:['Progress','Log weight'],water:['Hydration','Add water'],habits:['Daily inputs','Steps and sleep'],date:['Diary date','Choose a day']
  };
  const [eyebrow,title]=configs[type]||['','Log']; setText('modalEyebrow',eyebrow);setText('modalTitle',title);
  if(type==='food') content.innerHTML=foodModal(options.meal||'Breakfast');
  if(type==='barcode') content.innerHTML=barcodeModal();
  if(type==='workout') content.innerHTML=workoutModal();
  if(type==='weight') content.innerHTML=weightModal();
  if(type==='water') content.innerHTML=waterModal();
  if(type==='habits') content.innerHTML=habitsModal();
  if(type==='date') content.innerHTML=dateModal();
  modal.showModal();
  if(type==='food'){const input=$('#foodSearch');input?.focus();renderFoodResults('');}
}

function foodModal(meal){return `<div class="modal-form"><label>Meal<select id="foodMeal">${MEALS.map(m=>`<option ${m===meal?'selected':''}>${m}</option>`).join('')}</select></label><label>Search<input id="foodSearch" type="search" placeholder="Chicken, rice, protein shake…" autocomplete="off"></label><div class="inline-actions"><button type="button" class="secondary-button" id="createFoodButton">Create custom food</button></div><div id="foodResults" class="search-results"></div></div>`;}
function barcodeModal(){return `<div class="modal-form"><p class="form-note">Enter a UPC/EAN code. Known barcodes work offline. For an unknown product, create its nutrition record once and PhactoryFit will remember it on this device. Camera detection depends on browser support.</p><label>Barcode<input id="barcodeInput" inputmode="numeric" placeholder="e.g. 049000050103"></label><div class="inline-actions"><button type="button" class="primary-button" id="lookupBarcode">Look up</button><button type="button" class="secondary-button" id="cameraBarcode">Use camera</button></div><video id="barcodeVideo" playsinline hidden style="width:100%;border-radius:14px"></video><div id="barcodeResult"></div></div>`;}
function workoutModal(){return `<form id="workoutForm" class="modal-form"><label>Workout name<input name="name" value="Strength training" required></label><div class="two-col"><label>Minutes<input name="minutes" type="number" min="1" value="45" required></label><label>Estimated calories<input name="calories" type="number" min="0" value="250"></label></div><label>Notes<input name="notes" placeholder="Upper body, run, cycling…"></label><button class="primary-button" type="submit">Save workout</button></form>`;}
function weightModal(){const latest=[...state.weights].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.weight||state.profile.currentWeight;return `<form id="weightForm" class="modal-form"><label>Date<input name="date" type="date" value="${state.selectedDate}" required></label><label>Weight (lb)<input name="weight" type="number" step="0.1" value="${latest}" required></label><button class="primary-button" type="submit">Save weigh-in</button></form>`;}
function waterModal(){return `<form id="waterForm" class="modal-form"><label>Cups to add<input name="cups" type="number" step="1" min="-20" value="1" required></label><button class="primary-button" type="submit">Update water</button></form>`;}
function habitsModal(){const d=getDay();return `<form id="habitsForm" class="modal-form"><label>Steps<input name="steps" type="number" min="0" value="${d.steps}" required></label><label>Sleep (hours)<input name="sleep" type="number" min="0" max="24" step="0.25" value="${d.sleep}" required></label><button class="primary-button" type="submit">Save habits</button></form>`;}
function dateModal(){return `<form id="dateForm" class="modal-form"><label>Date<input name="date" type="date" value="${state.selectedDate}" required></label><button class="primary-button" type="submit">Open day</button></form>`;}

function renderFoodResults(query){
  const target=$('#foodResults');if(!target)return;
  const q=query.trim().toLowerCase();
  let foods=allFoods().filter(f=>!q||f.name.toLowerCase().includes(q)||f.brand.toLowerCase().includes(q)||(f.aliases||[]).some(a=>a.includes(q)));
  const recentMap=new Map(state.recentFoodIds.map((id,i)=>[id,i]));
  foods.sort((a,b)=>(recentMap.get(a.id)??999)-(recentMap.get(b.id)??999));
  target.innerHTML=foods.slice(0,30).map(f=>`<button type="button" class="search-result" data-food-id="${escapeHtml(f.id)}"><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.brand)} · ${escapeHtml(f.serving)} · ${round(f.calories)} kcal · ${round(f.protein,1)}g protein</small></button>`).join('')||'<p class="form-note">No match. Create a custom food.</p>';
}

function showFoodQuantity(food){
  $('#modalContent').innerHTML=`<form id="addFoodForm" class="modal-form"><div class="search-result"><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.serving)} · ${round(food.calories)} kcal · ${round(food.protein,1)}g protein</small></div><label>Meal<select name="meal">${MEALS.map(m=>`<option ${m===($('#foodMeal')?.value||'Breakfast')?'selected':''}>${m}</option>`).join('')}</select></label><label>Number of servings<input name="quantity" type="number" step="0.25" min="0.25" value="1" required></label><input name="foodId" type="hidden" value="${escapeHtml(food.id)}"><button class="primary-button" type="submit">Add to diary</button></form>`;
}

function showCustomFoodForm(barcode=''){
  $('#modalContent').innerHTML=`<form id="customFoodForm" class="modal-form">${barcode?`<p class="form-note">This food will be linked to barcode ${escapeHtml(barcode)} for future scans.</p>`:''}<input name="barcode" type="hidden" value="${escapeHtml(barcode)}"><label>Food name<input name="name" required></label><label>Brand<input name="brand" value="Custom"></label><label>Serving description<input name="serving" placeholder="1 serving, 100 g, 1 cup" required></label><div class="two-col"><label>Calories<input name="calories" type="number" step="0.1" min="0" required></label><label>Protein (g)<input name="protein" type="number" step="0.1" min="0" required></label></div><div class="two-col"><label>Carbs (g)<input name="carbs" type="number" step="0.1" min="0" value="0" required></label><label>Fat (g)<input name="fat" type="number" step="0.1" min="0" value="0" required></label></div><div class="two-col"><label>Fiber (g)<input name="fiber" type="number" step="0.1" min="0" value="0"></label><label>Sodium (mg)<input name="sodium" type="number" step="0.1" min="0" value="0"></label></div><button class="primary-button" type="submit">Save food</button></form>`;
}

async function lookupBarcode(code){
  const result=$('#barcodeResult');
  if(!/^\d{8,14}$/.test(code)){result.innerHTML='<p class="form-note">Enter a valid 8–14 digit barcode.</p>';return;}
  const localFood=allFoods().find(food=>String(food.barcode||'')===code);
  if(localFood){
    result.innerHTML=`<div class="search-result"><strong>${escapeHtml(localFood.name)}</strong><small>${escapeHtml(localFood.brand)} · ${escapeHtml(localFood.serving)} · ${round(localFood.calories)} kcal · ${round(localFood.protein,1)}g protein</small></div><button type="button" id="addBarcodeFood" class="primary-button">Add product</button>`;
    $('#addBarcodeFood').onclick=()=>showFoodQuantity(localFood);
    return;
  }
  const proxy=window.PHACTORYFIT_CONFIG?.offProxyUrl?.trim();
  if(proxy){
    result.innerHTML='<p class="form-note">Looking up product…</p>';
    try{
      const response=await fetch(`${proxy}${proxy.includes('?')?'&':'?'}barcode=${encodeURIComponent(code)}`);
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      const p=data.product||data;
      if(!p||(!p.product_name&&!p.name))throw new Error('Product not found');
      const n=p.nutriments||p.nutrition||{};
      const servingText=p.serving_size||p.serving||'100 g';
      const grams=parseFloat(servingText); const factor=Number.isFinite(grams)&&grams>0?grams/100:1;
      const nutrient=(normalized,offKey)=>Number(p[normalized]??n[normalized]??((Number(n[`${offKey}_100g`])||0)*factor))||0;
      const food={id:`off-${code}`,name:p.product_name||p.name,brand:p.brands||p.brand||'Open Food Facts',serving:servingText,calories:round(nutrient('calories','energy-kcal'),1),protein:round(nutrient('protein','proteins'),1),carbs:round(nutrient('carbs','carbohydrates'),1),fat:round(nutrient('fat','fat'),1),fiber:round(nutrient('fiber','fiber'),1),sugar:round(nutrient('sugar','sugars'),1),sodium:round(Number(p.sodium??n.sodium??((Number(n.sodium_100g)||0)*1000*factor))||0,1),aliases:[],source:'Open Food Facts',barcode:code};
      if(!state.customFoods.some(x=>x.id===food.id))state.customFoods.push(food);
      saveState();
      result.innerHTML=`<div class="search-result"><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.brand)} · ${escapeHtml(food.serving)} · ${food.calories} kcal · ${food.protein}g protein</small></div><button type="button" id="addBarcodeFood" class="primary-button">Add product</button>`;
      $('#addBarcodeFood').onclick=()=>showFoodQuantity(food);
      return;
    }catch(error){console.error(error);}
  }
  result.innerHTML=`<p class="form-note">This barcode is not in your local library yet.</p><button type="button" id="teachBarcodeFood" class="primary-button">Create and remember food</button>`;
  $('#teachBarcodeFood').onclick=()=>showCustomFoodForm(code);
}
async function startBarcodeCamera(){
  const result=$('#barcodeResult');
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){result.innerHTML='<p class="form-note">Camera barcode detection is not supported by this browser. Enter the barcode number printed below the package barcode.</p>';return;}
  let stream;
  try{
    const detector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
    const video=$('#barcodeVideo');video.hidden=false;video.srcObject=stream;await video.play();
    result.innerHTML='<p class="form-note">Point the camera at the barcode.</p>';
    const started=Date.now();
    while(Date.now()-started<20000&&modal.open){
      const codes=await detector.detect(video); if(codes.length){const code=codes[0].rawValue;$('#barcodeInput').value=code;stream.getTracks().forEach(t=>t.stop());video.hidden=true;await lookupBarcode(code);return;}
      await new Promise(r=>setTimeout(r,250));
    }
    throw new Error('No barcode detected');
  }catch(error){console.error(error);stream?.getTracks().forEach(t=>t.stop());result.innerHTML='<p class="form-note">The camera could not read the barcode. Enter the printed digits manually.</p>';}
}

function startVoiceLog(){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){toast('Voice recognition is not supported in this browser.');return;}
  const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
  $('#voiceLogButton').textContent='Listening…';
  recognition.onresult=e=>{const text=e.results[0][0].transcript;openModal('food');setTimeout(()=>{$('#foodSearch').value=text;renderFoodResults(text);toast(`Heard: ${text}`);},50);};
  recognition.onerror=()=>toast('Voice logging could not start.');recognition.onend=()=>$('#voiceLogButton').textContent='🎙 Voice log';recognition.start();
}

function parseSuggestedQuantity(text){const m=text.match(/\b(\d+(?:\.\d+)?)\b/);return m?Number(m[1]):1;}

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}

function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`phactoryfit-backup-${localDateKey()}.json`;a.click();URL.revokeObjectURL(url);toast('Backup exported.');
}

async function importData(file){
  try{const parsed=JSON.parse(await file.text());if(!parsed.profile||!parsed.days)throw new Error('Invalid backup');state={...defaultState(),...parsed,profile:{...defaultState().profile,...parsed.profile}};saveState();render();toast('Backup imported.');}catch(error){console.error(error);toast('That file is not a valid PhactoryFit backup.');}
}

function registerServiceWorker(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(err=>console.warn('Service worker unavailable',err));}

// Navigation and global interactions
document.addEventListener('click', event=>{
  const nav=event.target.closest('[data-view-target]'); if(nav){navigate(nav.dataset.viewTarget);return;}
  const link=event.target.closest('[data-nav]'); if(link){navigate(link.dataset.nav);return;}
  const modalButton=event.target.closest('[data-modal]'); if(modalButton){openModal(modalButton.dataset.modal);return;}
  const mealButton=event.target.closest('[data-add-meal]'); if(mealButton){openModal('food',{meal:mealButton.dataset.addMeal});return;}
  const remove=event.target.closest('[data-remove-food]'); if(remove){getDay().foods=getDay().foods.filter(f=>f.logId!==remove.dataset.removeFood);render();toast('Food removed.');return;}
  const foodChoice=event.target.closest('[data-food-id]'); if(foodChoice){const food=allFoods().find(f=>f.id===foodChoice.dataset.foodId);if(food)showFoodQuantity(food);return;}
  const coachAction=event.target.closest('[data-coach-action]'); if(coachAction){const a=coachAction.dataset.coachAction;if(a.includes('protein'))navigate('coach');else if(a.includes('Review'))navigate('diary');else openModal(a.includes('barcode')?'barcode':'food');return;}
  const rescue=event.target.closest('[data-rescue]'); if(rescue){const food=allFoods().find(f=>f.name.toLowerCase().includes(rescue.dataset.rescue.toLowerCase().split(' ')[0]))||allFoods().find(f=>rescue.dataset.rescue.toLowerCase().includes(f.name.toLowerCase().split(',')[0]));if(food){openModal('food');setTimeout(()=>showFoodQuantity(food),20);}return;}
});

document.addEventListener('input', event=>{if(event.target.id==='foodSearch')renderFoodResults(event.target.value);});

document.addEventListener('submit', event=>{
  event.preventDefault(); const form=event.target; const data=Object.fromEntries(new FormData(form));
  if(form.id==='addFoodForm'){
    const food=allFoods().find(f=>f.id===data.foodId);if(!food)return;
    const quantity=Number(data.quantity)||1;getDay().foods.push({...food,meal:data.meal,quantity,logId:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`});state.recentFoodIds=[food.id,...state.recentFoodIds.filter(id=>id!==food.id)].slice(0,12);modal.close();render();toast(`${food.name} added.`);
  }
  if(form.id==='customFoodForm'){
    const food={id:`custom-${Date.now()}`,name:data.name.trim(),brand:data.brand.trim()||'Custom',serving:data.serving.trim(),calories:Number(data.calories),protein:Number(data.protein),carbs:Number(data.carbs),fat:Number(data.fat),fiber:Number(data.fiber)||0,sugar:0,sodium:Number(data.sodium)||0,aliases:[],barcode:data.barcode||null};state.customFoods.push(food);showFoodQuantity(food);saveState();
  }
  if(form.id==='workoutForm'){
    const day=getDay();day.workoutMinutes+=Number(data.minutes)||0;day.exerciseCalories+=Number(data.calories)||0;day.workoutName=data.name;day.workoutNotes=data.notes;modal.close();render();toast('Workout logged.');
  }
  if(form.id==='weightForm'){
    const value=Number(data.weight);state.weights=state.weights.filter(w=>w.date!==data.date);state.weights.push({date:data.date,weight:value});state.profile.currentWeight=value;modal.close();render();toast('Weight saved.');
  }
  if(form.id==='waterForm'){getDay().water=Math.max(0,getDay().water+(Number(data.cups)||0));modal.close();render();toast('Water updated.');}
  if(form.id==='habitsForm'){getDay().steps=Number(data.steps)||0;getDay().sleep=Number(data.sleep)||0;modal.close();render();toast('Habits saved.');}
  if(form.id==='dateForm'){state.selectedDate=data.date;getDay();modal.close();render();}
});

$('#settingsForm').addEventListener('submit',event=>{event.preventDefault();const form=event.target;const data=Object.fromEntries(new FormData(form));state.profile={...state.profile,name:data.name.trim(),currentWeight:Number(data.currentWeight),goalWeight:Number(data.goalWeight),calorieGoal:Number(data.calorieGoal),proteinGoal:Number(data.proteinGoal),carbGoal:Number(data.carbGoal),fatGoal:Number(data.fatGoal),weeklyGoal:Number(data.weeklyGoal),eatBackExercise:form.elements.eatBackExercise.checked};saveState();render();toast('Goals saved.');});

$('#modalClose').addEventListener('click',()=>modal.close());
$('#dateButton').addEventListener('click',()=>openModal('date'));
$('#addFoodFab').addEventListener('click',()=>openModal('food'));
$('#voiceLogButton').addEventListener('click',startVoiceLog);
$('#waterHabit').addEventListener('click',()=>{getDay().water+=1;render();toast('Added 1 cup of water.');});
$('#stepsHabit').addEventListener('click',()=>openModal('habits'));
$('#workoutHabit').addEventListener('click',()=>openModal('workout'));
$('#sleepHabit').addEventListener('click',()=>openModal('habits'));
$('#exportButton').addEventListener('click',exportData);
$('#importInput').addEventListener('change',event=>event.target.files[0]&&importData(event.target.files[0]));
$('#resetButton').addEventListener('click',()=>{if(confirm('Delete all locally stored PhactoryFit data?')){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();toast('Local data reset.');}});

$('#modalContent').addEventListener('click',event=>{
  if(event.target.id==='createFoodButton')showCustomFoodForm();
  if(event.target.id==='lookupBarcode')lookupBarcode($('#barcodeInput').value.trim());
  if(event.target.id==='cameraBarcode')startBarcodeCamera();
});

window.addEventListener('resize',()=>{if($('.view[data-view="progress"]').classList.contains('active'))renderProgress();});
registerServiceWorker();
render();
