'use strict';

// Curated U.S. restaurant starter catalog. Values are per standard listed serving.
// Brand menus, recipes, and local availability can change. The app displays the
// verification date and asks users to confirm customizations with the restaurant.
window.PHACTORYFIT_RESTAURANT_FOODS = Object.freeze([
  {
    id:'restaurant-mcd-hash-browns', name:'Hash Browns', brand:"McDonald's", serving:'1 serving',
    calories:140, protein:2, carbs:18, fat:8,
    aliases:['hash brown','hashbrowns','mcd hash brown'], category:'Breakfast', tags:['side','potato','breakfast'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-egg-mcmuffin', name:'Egg McMuffin', brand:"McDonald's", serving:'1 sandwich',
    calories:310, protein:17, carbs:30, fat:13,
    aliases:['egg mcmuffin with bacon','mcmuffin','egg muffin'], category:'Breakfast', tags:['sandwich','english muffin','egg','bacon'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-mcmuffin', name:'Sausage McMuffin', brand:"McDonald's", serving:'1 sandwich',
    calories:400, protein:14, carbs:29, fat:26,
    aliases:['sausage muffin','mcmuffin sausage'], category:'Breakfast', tags:['sandwich','english muffin','sausage'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-mcmuffin-egg', name:'Sausage McMuffin with Egg', brand:"McDonald's", serving:'1 sandwich',
    calories:480, protein:30, carbs:31, fat:31, saturatedFat:12,
    aliases:['sausage egg mcmuffin','sausage egg and cheese mcmuffin'], category:'Breakfast', tags:['sandwich','english muffin','sausage','egg','cheese'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-bacon-egg-cheese-biscuit', name:'Bacon, Egg & Cheese Biscuit', brand:"McDonald's", serving:'1 sandwich',
    calories:460, protein:17, carbs:39, fat:26,
    aliases:['bacon egg cheese biscuit','bec biscuit'], category:'Breakfast', tags:['sandwich','biscuit','bacon','egg','cheese'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-biscuit', name:'Sausage Biscuit', brand:"McDonald's", serving:'1 sandwich',
    calories:460, protein:11, carbs:37, fat:30,
    aliases:['sausage breakfast biscuit'], category:'Breakfast', tags:['sandwich','biscuit','sausage'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-biscuit-egg', name:'Sausage Biscuit with Egg', brand:"McDonald's", serving:'1 sandwich',
    calories:530, protein:17, carbs:38, fat:35,
    aliases:['sausage egg biscuit','sausage biscuit egg'], category:'Breakfast', tags:['sandwich','biscuit','sausage','egg'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-bacon-egg-cheese-mcgriddles', name:'Bacon, Egg & Cheese McGriddles', brand:"McDonald's", serving:'1 sandwich',
    calories:430, protein:17, carbs:44, fat:21,
    aliases:['bacon egg cheese mcgriddle','bacon mcgriddle'], category:'Breakfast', tags:['sandwich','mcgriddles','bacon','egg','cheese'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-mcgriddles', name:'Sausage McGriddles', brand:"McDonald's", serving:'1 sandwich',
    calories:430, protein:11, carbs:41, fat:24,
    aliases:['sausage mcgriddle'], category:'Breakfast', tags:['sandwich','mcgriddles','sausage'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-egg-cheese-mcgriddles', name:'Sausage, Egg & Cheese McGriddles', brand:"McDonald's", serving:'1 sandwich',
    calories:550, protein:19, carbs:44, fat:33,
    aliases:['sausage egg cheese mcgriddle','sausage egg mcgriddle'], category:'Breakfast', tags:['sandwich','mcgriddles','sausage','egg','cheese'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-sausage-burrito', name:'Sausage Burrito', brand:"McDonald's", serving:'1 burrito',
    calories:310, protein:13, carbs:25, fat:17,
    aliases:['breakfast burrito','sausage breakfast burrito'], category:'Breakfast', tags:['burrito','sausage','egg'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-fruit-maple-oatmeal', name:'Fruit & Maple Oatmeal', brand:"McDonald's", serving:'1 bowl',
    calories:320, protein:6, carbs:64, fat:4.5,
    aliases:['fruit maple oatmeal','oatmeal','mcdonalds oatmeal'], category:'Breakfast', tags:['oatmeal','fruit','whole grain'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-hotcakes', name:'Hotcakes with Butter and Syrup', brand:"McDonald's", serving:'1 order',
    calories:580, protein:9, carbs:101, fat:15,
    aliases:['hotcakes','pancakes','mcdonalds pancakes'], category:'Breakfast', tags:['pancakes','syrup','breakfast'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-big-breakfast', name:'Big Breakfast', brand:"McDonald's", serving:'1 order',
    calories:1060, protein:26, carbs:131, fat:48,
    aliases:['mcdonalds big breakfast'], category:'Breakfast', tags:['platter','eggs','sausage','biscuit','hash browns'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-big-breakfast-hotcakes', name:'Big Breakfast with Hotcakes', brand:"McDonald's", serving:'1 order',
    calories:1340, protein:36, carbs:158, fat:63,
    aliases:['big breakfast hotcakes','deluxe breakfast'], category:'Breakfast', tags:['platter','hotcakes','eggs','sausage','biscuit','hash browns'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-bacon-egg-cheese-bagel', name:'Bacon, Egg & Cheese Bagel', brand:"McDonald's", serving:'1 sandwich',
    calories:590, protein:25, carbs:56, fat:30,
    aliases:['bacon egg cheese bagel','breakfast bagel'], category:'Breakfast', tags:['sandwich','bagel','bacon','egg','cheese'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant.'
  },
  {
    id:'restaurant-mcd-mcchicken-biscuit', name:'McChicken Biscuit', brand:"McDonald's", serving:'1 sandwich',
    calories:420, aliases:['chicken biscuit','mc chicken biscuit'], category:'Breakfast', tags:['sandwich','biscuit','chicken'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and preparation may vary by restaurant. Only verified calories are shown in this catalog entry.'
  },

  {
    id:'restaurant-cfa-egg-white-grill', name:'Egg White Grill', brand:'Chick-fil-A', serving:'1 sandwich',
    calories:300, protein:27, carbs:29, fat:8, saturatedFat:4, cholesterol:65, sodium:990, fiber:1, sugar:2,
    aliases:['egg white breakfast sandwich','chick fil a egg white grill'], category:'Breakfast', tags:['sandwich','grilled chicken','egg whites','english muffin'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-chicken-biscuit', name:'Chicken Biscuit', brand:'Chick-fil-A', serving:'1 biscuit',
    calories:460, protein:19, carbs:45, fat:23, saturatedFat:8, cholesterol:45, sodium:1510, fiber:2, sugar:6,
    aliases:['chick fil a chicken biscuit'], category:'Breakfast', tags:['sandwich','biscuit','chicken'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-spicy-chicken-biscuit', name:'Spicy Chicken Biscuit', brand:'Chick-fil-A', serving:'1 biscuit',
    calories:450, protein:19, carbs:44, fat:22, saturatedFat:8, cholesterol:40, sodium:1570, fiber:3, sugar:5,
    aliases:['spicy biscuit','chick fil a spicy breakfast'], category:'Breakfast', tags:['sandwich','biscuit','spicy chicken'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-chicken-egg-cheese-biscuit', name:'Chicken, Egg & Cheese Biscuit', brand:'Chick-fil-A', serving:'1 biscuit',
    calories:550, protein:27, carbs:48, fat:28, saturatedFat:12, transFat:0, cholesterol:215, sodium:1870, fiber:3, sugar:7,
    aliases:['chicken egg cheese biscuit','chick fil a breakfast biscuit egg'], category:'Breakfast', tags:['sandwich','biscuit','chicken','egg','cheese'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-hash-browns', name:'Hash Browns', brand:'Chick-fil-A', serving:'1 serving',
    calories:270, aliases:['hash brown medallions','chick fil a hash browns'], category:'Breakfast', tags:['side','potato','breakfast'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price and availability may vary by location. Only verified calories are shown in this catalog entry.'
  },
  {
    id:'restaurant-cfa-hash-brown-scramble-bowl', name:'Hash Brown Scramble Bowl', brand:'Chick-fil-A', serving:'1 bowl',
    calories:470, aliases:['breakfast scramble bowl','hashbrown scramble bowl'], category:'Breakfast', tags:['bowl','hash browns','egg','cheese'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price and availability may vary by location. Protein choice and customization change nutrition.'
  },
  {
    id:'restaurant-cfa-hash-brown-scramble-burrito', name:'Hash Brown Scramble Burrito', brand:'Chick-fil-A', serving:'1 burrito',
    calories:700, aliases:['breakfast scramble burrito','hashbrown scramble burrito'], category:'Breakfast', tags:['burrito','hash browns','egg','cheese'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price and availability may vary by location. Protein choice and customization change nutrition.'
  },
  {
    id:'restaurant-cfa-grilled-nuggets-8', name:'Grilled Nuggets, 8 count', brand:'Chick-fil-A', serving:'8 nuggets',
    calories:130, protein:25, carbs:1, fat:3, saturatedFat:.5, cholesterol:85, sodium:440, fiber:0, sugar:1,
    aliases:['8 count grilled nuggets','grilled chicken nuggets'], category:'Entrée', tags:['grilled','chicken','nuggets','high protein'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-grilled-nuggets-12', name:'Grilled Nuggets, 12 count', brand:'Chick-fil-A', serving:'12 nuggets',
    calories:200, protein:38, carbs:2, fat:4.5,
    aliases:['12 count grilled nuggets','grilled chicken nuggets 12'], category:'Entrée', tags:['grilled','chicken','nuggets','high protein'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-grilled-chicken-sandwich', name:'Grilled Chicken Sandwich', brand:'Chick-fil-A', serving:'1 sandwich',
    calories:390, protein:28, carbs:45, fat:11, saturatedFat:2.5, transFat:0, cholesterol:75, sodium:765, fiber:3, sugar:11,
    aliases:['chick fil a grilled sandwich','grilled chicken'], category:'Entrée', tags:['sandwich','grilled','chicken'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-chicken-sandwich', name:'Chicken Sandwich', brand:'Chick-fil-A', serving:'1 sandwich',
    calories:420, protein:29, carbs:41, fat:18, saturatedFat:3.5, cholesterol:70, sodium:1460, fiber:1, sugar:6,
    aliases:['original chicken sandwich','chick fil a sandwich'], category:'Entrée', tags:['sandwich','breaded chicken'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-nuggets-8', name:'Nuggets, 8 count', brand:'Chick-fil-A', serving:'8 nuggets',
    calories:250, protein:27, carbs:11, fat:11,
    aliases:['8 count nuggets','chick fil a nuggets'], category:'Entrée', tags:['chicken','nuggets'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-kale-crunch', name:'Kale Crunch Side', brand:'Chick-fil-A', serving:'1 serving',
    calories:170, protein:4, carbs:13, fat:12, saturatedFat:1.5, sodium:250, fiber:4, sugar:8,
    aliases:['kale crunch','kale side'], category:'Side', tags:['kale','vegetable','side'],
    source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, availability, ingredients, and nutrition may vary by location or customization.'
  },
  {
    id:'restaurant-cfa-fruit-cup', name:'Fruit Cup', brand:'Chick-fil-A', serving:'1 serving',
    calories:70, aliases:['fruit side','fruit bowl'], category:'Side', tags:['fruit','side'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price and availability may vary by location. Size changes nutrition.'
  },

  {
    id:'restaurant-starbucks-turkey-bacon-egg-white', name:'Turkey Bacon, Cheddar & Egg White Sandwich', brand:'Starbucks', serving:'1 sandwich',
    calories:260, protein:17, fat:9,
    aliases:['turkey bacon sandwich','turkey bacon egg white'], category:'Breakfast', tags:['sandwich','egg white','turkey bacon'],
    availableNutrients:['calories','protein','fat'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and formulation may vary by store. Only verified nutrients are shown.'
  },
  {
    id:'restaurant-starbucks-sausage-cheddar-egg', name:'Sausage, Cheddar & Egg Sandwich', brand:'Starbucks', serving:'1 sandwich',
    calories:480, protein:18, fat:29,
    aliases:['sausage cheddar egg','starbucks sausage breakfast sandwich'], category:'Breakfast', tags:['sandwich','sausage','egg','cheese'],
    availableNutrients:['calories','protein','fat'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and formulation may vary by store. Only verified nutrients are shown.'
  },
  {
    id:'restaurant-starbucks-bacon-gouda', name:'Bacon, Gouda & Egg Sandwich', brand:'Starbucks', serving:'1 sandwich',
    calories:360, protein:18, fat:18, sugar:2,
    aliases:['bacon gouda breakfast sandwich','bacon gouda egg'], category:'Breakfast', tags:['sandwich','bacon','egg','gouda'],
    availableNutrients:['calories','protein','fat','sugar'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Availability and formulation may vary by store. Only verified nutrients are shown.'
  },
  {
    id:'restaurant-tb-crunchy-taco', name:'Crunchy Taco', brand:'Taco Bell', serving:'1 taco',
    calories:170, aliases:['beef crunchy taco'], category:'Entrée', tags:['taco','beef'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-soft-taco', name:'Soft Taco', brand:'Taco Bell', serving:'1 taco',
    calories:180, aliases:['beef soft taco'], category:'Entrée', tags:['taco','beef'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-soft-taco-supreme', name:'Soft Taco Supreme', brand:'Taco Bell', serving:'1 taco',
    calories:200, aliases:['supreme soft taco'], category:'Entrée', tags:['taco','beef','supreme'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-bean-burrito', name:'Bean Burrito', brand:'Taco Bell', serving:'1 burrito',
    calories:360, aliases:['vegetarian bean burrito'], category:'Entrée', tags:['burrito','beans','vegetarian'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-burrito-supreme', name:'Burrito Supreme', brand:'Taco Bell', serving:'1 burrito',
    calories:390, aliases:['supreme burrito'], category:'Entrée', tags:['burrito','beef','supreme'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-beefy-five-layer', name:'Beefy 5-Layer Burrito', brand:'Taco Bell', serving:'1 burrito',
    calories:490, aliases:['beefy five layer burrito','5 layer burrito'], category:'Entrée', tags:['burrito','beef','beans','cheese'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-crunchwrap-supreme', name:'Crunchwrap Supreme', brand:'Taco Bell', serving:'1 crunchwrap',
    calories:530, aliases:['crunch wrap supreme','crunchwrap'], category:'Entrée', tags:['crunchwrap','beef','supreme'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-black-bean-crunchwrap', name:'Black Bean Crunchwrap Supreme', brand:'Taco Bell', serving:'1 crunchwrap',
    calories:520, aliases:['vegetarian crunchwrap','black bean crunchwrap'], category:'Entrée', tags:['crunchwrap','black beans','vegetarian'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  },
  {
    id:'restaurant-tb-chicken-quesadilla', name:'Chicken Quesadilla', brand:'Taco Bell', serving:'1 quesadilla',
    calories:490, aliases:['chicken cheese quesadilla'], category:'Entrée', tags:['quesadilla','chicken','cheese'],
    availableNutrients:['calories'], source:'Official restaurant nutrition', restaurant:true, region:'US', verifiedAt:'2026-07-12',
    availability:'Price, participation, availability, and nutrition can vary by U.S. location and customization.'
  }
]);
