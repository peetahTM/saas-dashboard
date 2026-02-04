import pool from './index.js';
import bcrypt from 'bcryptjs';

const grocerySuggestions = [
  // Produce (20 items)
  { name: 'Apples', category: 'Produce', default_expiry_days: 21 },
  { name: 'Bananas', category: 'Produce', default_expiry_days: 7 },
  { name: 'Oranges', category: 'Produce', default_expiry_days: 14 },
  { name: 'Strawberries', category: 'Produce', default_expiry_days: 5 },
  { name: 'Blueberries', category: 'Produce', default_expiry_days: 7 },
  { name: 'Grapes', category: 'Produce', default_expiry_days: 7 },
  { name: 'Lettuce', category: 'Produce', default_expiry_days: 7 },
  { name: 'Spinach', category: 'Produce', default_expiry_days: 5 },
  { name: 'Tomatoes', category: 'Produce', default_expiry_days: 7 },
  { name: 'Carrots', category: 'Produce', default_expiry_days: 21 },
  { name: 'Broccoli', category: 'Produce', default_expiry_days: 7 },
  { name: 'Bell Peppers', category: 'Produce', default_expiry_days: 10 },
  { name: 'Onions', category: 'Produce', default_expiry_days: 30 },
  { name: 'Garlic', category: 'Produce', default_expiry_days: 30 },
  { name: 'Potatoes', category: 'Produce', default_expiry_days: 21 },
  { name: 'Avocado', category: 'Produce', default_expiry_days: 5 },
  { name: 'Cucumber', category: 'Produce', default_expiry_days: 7 },
  { name: 'Zucchini', category: 'Produce', default_expiry_days: 7 },
  { name: 'Mushrooms', category: 'Produce', default_expiry_days: 5 },
  { name: 'Celery', category: 'Produce', default_expiry_days: 14 },

  // Dairy (12 items)
  { name: 'Milk', category: 'Dairy', default_expiry_days: 7 },
  { name: 'Eggs', category: 'Dairy', default_expiry_days: 21 },
  { name: 'Butter', category: 'Dairy', default_expiry_days: 30 },
  { name: 'Cheddar Cheese', category: 'Dairy', default_expiry_days: 28 },
  { name: 'Mozzarella Cheese', category: 'Dairy', default_expiry_days: 14 },
  { name: 'Greek Yogurt', category: 'Dairy', default_expiry_days: 14 },
  { name: 'Cream Cheese', category: 'Dairy', default_expiry_days: 14 },
  { name: 'Sour Cream', category: 'Dairy', default_expiry_days: 14 },
  { name: 'Heavy Cream', category: 'Dairy', default_expiry_days: 7 },
  { name: 'Parmesan Cheese', category: 'Dairy', default_expiry_days: 60 },
  { name: 'Cottage Cheese', category: 'Dairy', default_expiry_days: 10 },
  { name: 'Almond Milk', category: 'Dairy', default_expiry_days: 10 },

  // Meat & Seafood (10 items)
  { name: 'Chicken Breast', category: 'Meat', default_expiry_days: 3 },
  { name: 'Ground Beef', category: 'Meat', default_expiry_days: 2 },
  { name: 'Pork Chops', category: 'Meat', default_expiry_days: 3 },
  { name: 'Bacon', category: 'Meat', default_expiry_days: 7 },
  { name: 'Salmon', category: 'Meat', default_expiry_days: 2 },
  { name: 'Shrimp', category: 'Meat', default_expiry_days: 2 },
  { name: 'Turkey', category: 'Meat', default_expiry_days: 3 },
  { name: 'Chicken Thighs', category: 'Meat', default_expiry_days: 3 },
  { name: 'Ground Turkey', category: 'Meat', default_expiry_days: 2 },
  { name: 'Tilapia', category: 'Meat', default_expiry_days: 2 },

  // Bakery (6 items)
  { name: 'White Bread', category: 'Bakery', default_expiry_days: 7 },
  { name: 'Whole Wheat Bread', category: 'Bakery', default_expiry_days: 7 },
  { name: 'Bagels', category: 'Bakery', default_expiry_days: 5 },
  { name: 'Croissants', category: 'Bakery', default_expiry_days: 3 },
  { name: 'Tortillas', category: 'Bakery', default_expiry_days: 14 },
  { name: 'English Muffins', category: 'Bakery', default_expiry_days: 7 },

  // Pantry (10 items)
  { name: 'Rice', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Pasta', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Olive Oil', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Canned Tomatoes', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Chicken Broth', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Peanut Butter', category: 'Pantry', default_expiry_days: 180 },
  { name: 'Honey', category: 'Pantry', default_expiry_days: 730 },
  { name: 'Canned Beans', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Oatmeal', category: 'Pantry', default_expiry_days: 365 },
  { name: 'Flour', category: 'Pantry', default_expiry_days: 180 },

  // Frozen (6 items)
  { name: 'Frozen Peas', category: 'Frozen', default_expiry_days: 180 },
  { name: 'Frozen Berries', category: 'Frozen', default_expiry_days: 180 },
  { name: 'Ice Cream', category: 'Frozen', default_expiry_days: 60 },
  { name: 'Frozen Pizza', category: 'Frozen', default_expiry_days: 90 },
  { name: 'Frozen Chicken Nuggets', category: 'Frozen', default_expiry_days: 90 },
  { name: 'Frozen Vegetables Mix', category: 'Frozen', default_expiry_days: 180 },
];

const recipes = [
  {
    name: 'Grilled Chicken Salad',
    ingredients: [
      { name: 'chicken breast', amount: '1 lb' },
      { name: 'lettuce', amount: '1 head' },
      { name: 'tomatoes', amount: '2 medium' },
      { name: 'olive oil', amount: '2 tbsp' },
      { name: 'lemon juice', amount: '2 tbsp' }
    ],
    instructions: [
      'Season chicken breast with salt, pepper, and olive oil.',
      'Grill chicken for 6-7 minutes per side until cooked through.',
      'Let chicken rest for 5 minutes, then slice.',
      'Chop lettuce and tomatoes into bite-sized pieces.',
      'Arrange salad on plates and top with sliced chicken.',
      'Drizzle with olive oil and lemon juice.'
    ],
    prep_time: 25,
    dietary_tags: ['gluten-free', 'dairy-free', 'high-protein']
  },
  {
    name: 'Spaghetti Bolognese',
    ingredients: [
      { name: 'ground beef', amount: '1 lb' },
      { name: 'pasta', amount: '1 lb' },
      { name: 'canned tomatoes', amount: '28 oz' },
      { name: 'onions', amount: '1 medium' },
      { name: 'garlic', amount: '3 cloves' },
      { name: 'olive oil', amount: '2 tbsp' }
    ],
    instructions: [
      'Cook pasta according to package directions.',
      'Dice onion and mince garlic.',
      'Heat olive oil in a large pan over medium heat.',
      'Add onion and cook until softened, about 5 minutes.',
      'Add garlic and cook for 1 minute.',
      'Add ground beef and cook until browned.',
      'Add canned tomatoes and simmer for 20 minutes.',
      'Serve sauce over pasta.'
    ],
    prep_time: 40,
    dietary_tags: ['dairy-free']
  },
  {
    name: 'Vegetable Stir Fry',
    ingredients: [
      { name: 'broccoli', amount: '2 cups' },
      { name: 'bell peppers', amount: '2 medium' },
      { name: 'carrots', amount: '2 medium' },
      { name: 'garlic', amount: '3 cloves' },
      { name: 'soy sauce', amount: '3 tbsp' },
      { name: 'olive oil', amount: '2 tbsp' },
      { name: 'rice', amount: '2 cups' }
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Cut broccoli into florets, slice bell peppers and carrots.',
      'Heat olive oil in a wok or large pan over high heat.',
      'Add carrots and cook for 2 minutes.',
      'Add broccoli and bell peppers, cook for 3 minutes.',
      'Add minced garlic and soy sauce.',
      'Stir fry for another 2 minutes.',
      'Serve over rice.'
    ],
    prep_time: 25,
    dietary_tags: ['vegan', 'vegetarian', 'dairy-free']
  },
  {
    name: 'Cheese Omelette',
    ingredients: [
      { name: 'eggs', amount: '3 large' },
      { name: 'cheddar cheese', amount: '1/2 cup' },
      { name: 'butter', amount: '1 tbsp' },
      { name: 'milk', amount: '2 tbsp' }
    ],
    instructions: [
      'Beat eggs with milk, salt, and pepper.',
      'Heat butter in a non-stick pan over medium heat.',
      'Pour in egg mixture and let it set slightly.',
      'Add shredded cheese to one half of the omelette.',
      'Fold omelette in half and cook until cheese melts.',
      'Serve immediately.'
    ],
    prep_time: 10,
    dietary_tags: ['gluten-free', 'vegetarian', 'keto']
  },
  {
    name: 'Grilled Salmon with Vegetables',
    ingredients: [
      { name: 'salmon', amount: '4 fillets' },
      { name: 'broccoli', amount: '2 cups' },
      { name: 'lemon', amount: '1 medium' },
      { name: 'olive oil', amount: '3 tbsp' },
      { name: 'garlic', amount: '2 cloves' }
    ],
    instructions: [
      'Preheat grill or oven to 400F.',
      'Season salmon with olive oil, minced garlic, salt, and pepper.',
      'Steam or roast broccoli until tender.',
      'Grill salmon for 4-5 minutes per side.',
      'Squeeze fresh lemon juice over salmon.',
      'Serve salmon with broccoli on the side.'
    ],
    prep_time: 25,
    dietary_tags: ['gluten-free', 'dairy-free', 'high-protein', 'keto']
  },
  {
    name: 'Chicken Caesar Salad',
    ingredients: [
      { name: 'chicken breast', amount: '1 lb' },
      { name: 'lettuce', amount: '1 head' },
      { name: 'parmesan cheese', amount: '1/2 cup' },
      { name: 'olive oil', amount: '3 tbsp' },
      { name: 'garlic', amount: '2 cloves' },
      { name: 'lemon juice', amount: '2 tbsp' }
    ],
    instructions: [
      'Grill or pan-fry chicken breast until cooked through.',
      'Let chicken rest, then slice.',
      'Chop lettuce into bite-sized pieces.',
      'Make dressing by mixing olive oil, lemon juice, and minced garlic.',
      'Toss lettuce with dressing.',
      'Top with sliced chicken and shaved parmesan.'
    ],
    prep_time: 25,
    dietary_tags: ['gluten-free', 'high-protein']
  },
  {
    name: 'Beef Tacos',
    ingredients: [
      { name: 'ground beef', amount: '1 lb' },
      { name: 'tortillas', amount: '8 small' },
      { name: 'tomatoes', amount: '2 medium' },
      { name: 'cheddar cheese', amount: '1 cup' },
      { name: 'lettuce', amount: '2 cups' },
      { name: 'onions', amount: '1 small' },
      { name: 'sour cream', amount: '1/2 cup' }
    ],
    instructions: [
      'Brown ground beef in a pan over medium heat.',
      'Season with taco seasoning (cumin, chili powder, paprika).',
      'Warm tortillas in a dry pan or microwave.',
      'Dice tomatoes and onions, shred lettuce.',
      'Assemble tacos with beef, vegetables, cheese, and sour cream.'
    ],
    prep_time: 25,
    dietary_tags: []
  },
  {
    name: 'Greek Yogurt Parfait',
    ingredients: [
      { name: 'greek yogurt', amount: '2 cups' },
      { name: 'strawberries', amount: '1 cup' },
      { name: 'blueberries', amount: '1/2 cup' },
      { name: 'honey', amount: '2 tbsp' },
      { name: 'granola', amount: '1/2 cup' }
    ],
    instructions: [
      'Wash and slice strawberries.',
      'Layer yogurt in glasses or bowls.',
      'Add a layer of mixed berries.',
      'Drizzle with honey.',
      'Top with granola.',
      'Repeat layers as desired.'
    ],
    prep_time: 10,
    dietary_tags: ['vegetarian', 'gluten-free']
  },
  {
    name: 'Shrimp Scampi',
    ingredients: [
      { name: 'shrimp', amount: '1 lb' },
      { name: 'pasta', amount: '8 oz' },
      { name: 'garlic', amount: '4 cloves' },
      { name: 'butter', amount: '4 tbsp' },
      { name: 'white wine', amount: '1/2 cup' },
      { name: 'lemon juice', amount: '2 tbsp' }
    ],
    instructions: [
      'Cook pasta according to package directions.',
      'Melt butter in a large pan over medium heat.',
      'Add minced garlic and cook for 1 minute.',
      'Add shrimp and cook for 2-3 minutes per side.',
      'Add white wine and lemon juice, simmer for 2 minutes.',
      'Toss with cooked pasta and serve.'
    ],
    prep_time: 20,
    dietary_tags: ['high-protein']
  },
  {
    name: 'Caprese Salad',
    ingredients: [
      { name: 'tomatoes', amount: '4 large' },
      { name: 'mozzarella cheese', amount: '8 oz' },
      { name: 'basil', amount: '1 bunch' },
      { name: 'olive oil', amount: '3 tbsp' },
      { name: 'balsamic vinegar', amount: '2 tbsp' }
    ],
    instructions: [
      'Slice tomatoes and mozzarella into 1/4 inch slices.',
      'Arrange tomato and mozzarella slices alternating on a plate.',
      'Tuck fresh basil leaves between slices.',
      'Drizzle with olive oil and balsamic vinegar.',
      'Season with salt and pepper.'
    ],
    prep_time: 10,
    dietary_tags: ['vegetarian', 'gluten-free', 'keto']
  },
  {
    name: 'Bacon and Eggs Breakfast',
    ingredients: [
      { name: 'bacon', amount: '6 strips' },
      { name: 'eggs', amount: '4 large' },
      { name: 'butter', amount: '1 tbsp' },
      { name: 'white bread', amount: '2 slices' }
    ],
    instructions: [
      'Cook bacon in a pan until crispy.',
      'Remove bacon and set aside.',
      'Add butter to the pan.',
      'Fry eggs to desired doneness.',
      'Toast bread.',
      'Serve eggs with bacon and toast.'
    ],
    prep_time: 15,
    dietary_tags: ['high-protein', 'keto']
  },
  {
    name: 'Vegetable Soup',
    ingredients: [
      { name: 'carrots', amount: '3 medium' },
      { name: 'potatoes', amount: '2 medium' },
      { name: 'onions', amount: '1 large' },
      { name: 'celery', amount: '3 stalks' },
      { name: 'chicken broth', amount: '6 cups' },
      { name: 'garlic', amount: '3 cloves' }
    ],
    instructions: [
      'Dice all vegetables into small cubes.',
      'Saute onion and garlic in olive oil until softened.',
      'Add remaining vegetables and chicken broth.',
      'Bring to a boil, then reduce heat and simmer for 25 minutes.',
      'Season with salt, pepper, and herbs.',
      'Serve hot.'
    ],
    prep_time: 40,
    dietary_tags: ['gluten-free', 'dairy-free']
  },
  {
    name: 'Chicken Quesadillas',
    ingredients: [
      { name: 'chicken breast', amount: '1 lb' },
      { name: 'tortillas', amount: '4 large' },
      { name: 'cheddar cheese', amount: '2 cups' },
      { name: 'bell peppers', amount: '1 medium' },
      { name: 'onions', amount: '1 small' },
      { name: 'sour cream', amount: '1/2 cup' }
    ],
    instructions: [
      'Cook and shred chicken breast.',
      'Slice bell peppers and onions, saute until soft.',
      'Place tortilla in a dry pan over medium heat.',
      'Add cheese, chicken, and vegetables to one half.',
      'Fold and cook until golden on both sides.',
      'Serve with sour cream.'
    ],
    prep_time: 30,
    dietary_tags: []
  },
  {
    name: 'Spinach Smoothie',
    ingredients: [
      { name: 'spinach', amount: '2 cups' },
      { name: 'bananas', amount: '1 large' },
      { name: 'greek yogurt', amount: '1/2 cup' },
      { name: 'milk', amount: '1 cup' },
      { name: 'honey', amount: '1 tbsp' }
    ],
    instructions: [
      'Add all ingredients to a blender.',
      'Blend until smooth.',
      'Add ice if desired.',
      'Pour into glasses and serve immediately.'
    ],
    prep_time: 5,
    dietary_tags: ['vegetarian', 'gluten-free']
  },
  {
    name: 'Baked Potato with Toppings',
    ingredients: [
      { name: 'potatoes', amount: '4 large' },
      { name: 'cheddar cheese', amount: '1 cup' },
      { name: 'sour cream', amount: '1/2 cup' },
      { name: 'bacon', amount: '4 strips' },
      { name: 'butter', amount: '4 tbsp' }
    ],
    instructions: [
      'Preheat oven to 400F.',
      'Wash potatoes and poke with a fork.',
      'Bake for 45-60 minutes until tender.',
      'Cook and crumble bacon.',
      'Cut potatoes open and fluff with a fork.',
      'Add butter, cheese, sour cream, and bacon bits.'
    ],
    prep_time: 70,
    dietary_tags: ['gluten-free', 'vegetarian']
  },
  {
    name: 'Turkey Sandwich',
    ingredients: [
      { name: 'turkey', amount: '6 oz' },
      { name: 'whole wheat bread', amount: '2 slices' },
      { name: 'lettuce', amount: '2 leaves' },
      { name: 'tomatoes', amount: '1 medium' },
      { name: 'cheddar cheese', amount: '2 slices' }
    ],
    instructions: [
      'Toast bread if desired.',
      'Layer turkey slices on one piece of bread.',
      'Add cheese, lettuce, and sliced tomato.',
      'Add condiments of choice.',
      'Top with second slice of bread.',
      'Cut in half and serve.'
    ],
    prep_time: 10,
    dietary_tags: ['high-protein']
  },
  {
    name: 'Banana Pancakes',
    ingredients: [
      { name: 'bananas', amount: '2 large' },
      { name: 'eggs', amount: '2 large' },
      { name: 'flour', amount: '1 cup' },
      { name: 'milk', amount: '3/4 cup' },
      { name: 'butter', amount: '2 tbsp' }
    ],
    instructions: [
      'Mash bananas in a bowl.',
      'Mix in eggs, flour, and milk until smooth.',
      'Heat butter in a pan over medium heat.',
      'Pour batter to form pancakes.',
      'Cook until bubbles form, then flip.',
      'Serve with maple syrup.'
    ],
    prep_time: 20,
    dietary_tags: ['vegetarian']
  },
  {
    name: 'Garlic Butter Shrimp',
    ingredients: [
      { name: 'shrimp', amount: '1 lb' },
      { name: 'garlic', amount: '6 cloves' },
      { name: 'butter', amount: '4 tbsp' },
      { name: 'lemon juice', amount: '2 tbsp' },
      { name: 'rice', amount: '2 cups' }
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Melt butter in a large pan over medium heat.',
      'Add minced garlic and cook for 1 minute.',
      'Add shrimp and cook for 2-3 minutes per side.',
      'Add lemon juice and toss to coat.',
      'Serve over rice.'
    ],
    prep_time: 20,
    dietary_tags: ['gluten-free', 'high-protein']
  },
  {
    name: 'Fresh Fruit Salad',
    ingredients: [
      { name: 'strawberries', amount: '1 cup' },
      { name: 'blueberries', amount: '1 cup' },
      { name: 'grapes', amount: '1 cup' },
      { name: 'bananas', amount: '2 medium' },
      { name: 'oranges', amount: '2 medium' },
      { name: 'honey', amount: '2 tbsp' }
    ],
    instructions: [
      'Wash all fruit thoroughly.',
      'Hull and quarter strawberries.',
      'Peel and slice bananas and oranges.',
      'Combine all fruit in a large bowl.',
      'Drizzle with honey and toss gently.',
      'Serve chilled.'
    ],
    prep_time: 15,
    dietary_tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free']
  },
  {
    name: 'Creamy Tomato Soup',
    ingredients: [
      { name: 'canned tomatoes', amount: '28 oz' },
      { name: 'onions', amount: '1 medium' },
      { name: 'garlic', amount: '3 cloves' },
      { name: 'cream cheese', amount: '4 oz' },
      { name: 'chicken broth', amount: '2 cups' },
      { name: 'butter', amount: '2 tbsp' }
    ],
    instructions: [
      'Saute diced onion in butter until soft.',
      'Add minced garlic and cook for 1 minute.',
      'Add canned tomatoes and chicken broth.',
      'Simmer for 15 minutes.',
      'Blend until smooth with an immersion blender.',
      'Stir in cream cheese until melted.',
      'Season and serve with crusty bread.'
    ],
    prep_time: 30,
    dietary_tags: ['vegetarian', 'gluten-free']
  },
  {
    name: 'Pork Stir Fry',
    ingredients: [
      { name: 'pork chops', amount: '1 lb' },
      { name: 'broccoli', amount: '2 cups' },
      { name: 'bell peppers', amount: '2 medium' },
      { name: 'garlic', amount: '3 cloves' },
      { name: 'soy sauce', amount: '3 tbsp' },
      { name: 'rice', amount: '2 cups' }
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Slice pork into thin strips.',
      'Cut vegetables into bite-sized pieces.',
      'Stir fry pork in hot oil until cooked.',
      'Add vegetables and stir fry for 3-4 minutes.',
      'Add garlic and soy sauce.',
      'Serve over rice.'
    ],
    prep_time: 30,
    dietary_tags: ['dairy-free']
  },
  {
    name: 'Avocado Toast',
    ingredients: [
      { name: 'whole wheat bread', amount: '2 slices' },
      { name: 'avocado', amount: '1 large' },
      { name: 'eggs', amount: '2 large' },
      { name: 'lemon juice', amount: '1 tbsp' },
      { name: 'olive oil', amount: '1 tbsp' }
    ],
    instructions: [
      'Toast bread until golden.',
      'Mash avocado with lemon juice, salt, and pepper.',
      'Fry or poach eggs.',
      'Spread mashed avocado on toast.',
      'Top with eggs.',
      'Drizzle with olive oil and season.'
    ],
    prep_time: 15,
    dietary_tags: ['vegetarian', 'dairy-free']
  },
  {
    name: 'Chicken Noodle Soup',
    ingredients: [
      { name: 'chicken breast', amount: '1 lb' },
      { name: 'egg noodles', amount: '8 oz' },
      { name: 'carrots', amount: '3 medium' },
      { name: 'celery', amount: '3 stalks' },
      { name: 'onions', amount: '1 medium' },
      { name: 'chicken broth', amount: '8 cups' }
    ],
    instructions: [
      'Dice onion, carrots, and celery.',
      'Saute vegetables until softened.',
      'Add chicken broth and bring to a boil.',
      'Add chicken breast and simmer until cooked.',
      'Remove chicken, shred, and return to pot.',
      'Add noodles and cook until tender.',
      'Season and serve.'
    ],
    prep_time: 45,
    dietary_tags: ['dairy-free']
  },
  {
    name: 'Stuffed Bell Peppers',
    ingredients: [
      { name: 'bell peppers', amount: '4 large' },
      { name: 'ground beef', amount: '1 lb' },
      { name: 'rice', amount: '1 cup' },
      { name: 'canned tomatoes', amount: '14 oz' },
      { name: 'cheddar cheese', amount: '1 cup' },
      { name: 'onions', amount: '1 medium' }
    ],
    instructions: [
      'Preheat oven to 375F.',
      'Cook rice according to package directions.',
      'Cut tops off peppers and remove seeds.',
      'Brown ground beef with diced onion.',
      'Mix beef, rice, and half the tomatoes.',
      'Stuff peppers with mixture.',
      'Top with remaining tomatoes and cheese.',
      'Bake for 35-40 minutes.'
    ],
    prep_time: 60,
    dietary_tags: ['gluten-free']
  },
  {
    name: 'Egg Fried Rice',
    ingredients: [
      { name: 'rice', amount: '3 cups cooked' },
      { name: 'eggs', amount: '3 large' },
      { name: 'carrots', amount: '1 medium' },
      { name: 'peas', amount: '1/2 cup' },
      { name: 'soy sauce', amount: '3 tbsp' },
      { name: 'garlic', amount: '2 cloves' }
    ],
    instructions: [
      'Beat eggs and scramble in a hot pan.',
      'Set eggs aside.',
      'Stir fry diced carrots and peas.',
      'Add cold rice and stir fry on high heat.',
      'Add garlic and soy sauce.',
      'Return eggs to pan and mix.',
      'Serve hot.'
    ],
    prep_time: 20,
    dietary_tags: ['vegetarian', 'dairy-free']
  }
];

// Demo user sample groceries with various expiry dates
const getDemoGroceries = (userId) => {
  const today = new Date();
  const addDays = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    // Expiring soon (within 3 days)
    { user_id: userId, name: 'Milk', category: 'Dairy', quantity: 1, unit: 'gallon', expiry_date: addDays(2), is_consumed: false },
    { user_id: userId, name: 'Chicken Breast', category: 'Meat', quantity: 1.5, unit: 'lbs', expiry_date: addDays(1), is_consumed: false },
    { user_id: userId, name: 'Strawberries', category: 'Produce', quantity: 1, unit: 'container', expiry_date: addDays(3), is_consumed: false },

    // Expiring this week (4-7 days)
    { user_id: userId, name: 'Eggs', category: 'Dairy', quantity: 12, unit: 'count', expiry_date: addDays(7), is_consumed: false },
    { user_id: userId, name: 'Spinach', category: 'Produce', quantity: 1, unit: 'bag', expiry_date: addDays(5), is_consumed: false },
    { user_id: userId, name: 'Greek Yogurt', category: 'Dairy', quantity: 2, unit: 'cups', expiry_date: addDays(6), is_consumed: false },
    { user_id: userId, name: 'Ground Beef', category: 'Meat', quantity: 1, unit: 'lb', expiry_date: addDays(4), is_consumed: false },

    // Good for a while (8-21 days)
    { user_id: userId, name: 'Cheddar Cheese', category: 'Dairy', quantity: 8, unit: 'oz', expiry_date: addDays(14), is_consumed: false },
    { user_id: userId, name: 'Carrots', category: 'Produce', quantity: 1, unit: 'lb', expiry_date: addDays(18), is_consumed: false },
    { user_id: userId, name: 'Apples', category: 'Produce', quantity: 6, unit: 'count', expiry_date: addDays(20), is_consumed: false },
    { user_id: userId, name: 'Butter', category: 'Dairy', quantity: 1, unit: 'stick', expiry_date: addDays(21), is_consumed: false },

    // Pantry items (long shelf life)
    { user_id: userId, name: 'Rice', category: 'Pantry', quantity: 2, unit: 'lbs', expiry_date: addDays(365), is_consumed: false },
    { user_id: userId, name: 'Pasta', category: 'Pantry', quantity: 1, unit: 'box', expiry_date: addDays(300), is_consumed: false },
    { user_id: userId, name: 'Canned Tomatoes', category: 'Pantry', quantity: 3, unit: 'cans', expiry_date: addDays(400), is_consumed: false },

    // Already consumed items for demo
    { user_id: userId, name: 'Bananas', category: 'Produce', quantity: 6, unit: 'count', expiry_date: addDays(-2), is_consumed: true },
    { user_id: userId, name: 'Bread', category: 'Bakery', quantity: 1, unit: 'loaf', expiry_date: addDays(-1), is_consumed: true },
  ];
};

// Demo notifications
const getDemoNotifications = (userId) => {
  return [
    {
      user_id: userId,
      type: 'expiring',
      title: 'Chicken Breast expiring soon!',
      message: 'Your Chicken Breast expires tomorrow. Consider using it in tonight\'s dinner!',
      is_read: false
    },
    {
      user_id: userId,
      type: 'expiring',
      title: 'Items expiring this week',
      message: 'You have 3 items expiring in the next 7 days. Check your pantry to avoid waste.',
      is_read: false
    },
    {
      user_id: userId,
      type: 'tip',
      title: 'Meal planning tip',
      message: 'Generate a meal plan based on your expiring groceries to reduce food waste!',
      is_read: true
    },
    {
      user_id: userId,
      type: 'welcome',
      title: 'Welcome to FreshTrack!',
      message: 'Start by adding your groceries and we\'ll help you track expiration dates.',
      is_read: true
    }
  ];
};

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data (order matters due to foreign keys)
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM meal_plans');
    await client.query('DELETE FROM groceries');
    await client.query('DELETE FROM user_preferences');
    await client.query('DELETE FROM recipes');
    await client.query('DELETE FROM grocery_suggestions');
    await client.query('DELETE FROM users');

    // Seed grocery suggestions
    for (const suggestion of grocerySuggestions) {
      await client.query(
        'INSERT INTO grocery_suggestions (name, category, default_expiry_days) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [suggestion.name, suggestion.category, suggestion.default_expiry_days]
      );
    }

    // Seed recipes
    for (const recipe of recipes) {
      await client.query(
        'INSERT INTO recipes (name, ingredients, instructions, prep_time, dietary_tags) VALUES ($1, $2, $3, $4, $5)',
        [
          recipe.name,
          JSON.stringify(recipe.ingredients),
          recipe.instructions,
          recipe.prep_time,
          recipe.dietary_tags
        ]
      );
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      ['demo@freshtrack.com', hashedPassword, 'Demo User']
    );
    const demoUserId = userResult.rows[0].id;

    // Create user preferences for demo user
    await client.query(
      'INSERT INTO user_preferences (user_id, dietary_restrictions, allergies, disliked_ingredients, unit_system, currency) VALUES ($1, $2, $3, $4, $5, $6)',
      [demoUserId, ['vegetarian-friendly'], [], ['anchovies', 'liver'], 'metric', 'USD']
    );

    // Seed demo user groceries
    const demoGroceries = getDemoGroceries(demoUserId);
    for (const grocery of demoGroceries) {
      await client.query(
        'INSERT INTO groceries (user_id, name, category, quantity, unit, expiry_date, is_consumed) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [grocery.user_id, grocery.name, grocery.category, grocery.quantity, grocery.unit, grocery.expiry_date, grocery.is_consumed]
      );
    }

    // Seed demo notifications
    const demoNotifications = getDemoNotifications(demoUserId);
    for (const notification of demoNotifications) {
      await client.query(
        'INSERT INTO notifications (user_id, type, title, message, is_read) VALUES ($1, $2, $3, $4, $5)',
        [notification.user_id, notification.type, notification.title, notification.message, notification.is_read]
      );
    }

    // Create a sample meal plan for demo user
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)

    const sampleMealPlan = {
      monday: {
        breakfast: { recipeId: 4, recipeName: 'Cheese Omelette', prepTime: 10, usesExpiring: ['Eggs'] },
        lunch: { recipeId: 16, recipeName: 'Turkey Sandwich', prepTime: 10, usesExpiring: [] },
        dinner: { recipeId: 1, recipeName: 'Grilled Chicken Salad', prepTime: 25, usesExpiring: ['Chicken Breast'] }
      },
      tuesday: {
        breakfast: { recipeId: 8, recipeName: 'Greek Yogurt Parfait', prepTime: 10, usesExpiring: ['Greek Yogurt', 'Strawberries'] },
        lunch: { recipeId: 12, recipeName: 'Vegetable Soup', prepTime: 40, usesExpiring: ['Carrots'] },
        dinner: { recipeId: 2, recipeName: 'Spaghetti Bolognese', prepTime: 40, usesExpiring: ['Ground Beef'] }
      },
      wednesday: {
        breakfast: { recipeId: 14, recipeName: 'Spinach Smoothie', prepTime: 5, usesExpiring: ['Spinach', 'Milk'] },
        lunch: null,
        dinner: { recipeId: 3, recipeName: 'Vegetable Stir Fry', prepTime: 25, usesExpiring: ['Carrots'] }
      }
    };

    await client.query(
      'INSERT INTO meal_plans (user_id, week_start, meals) VALUES ($1, $2, $3)',
      [demoUserId, weekStart.toISOString().split('T')[0], JSON.stringify(sampleMealPlan)]
    );

    await client.query('COMMIT');

    console.log(`Seeded ${grocerySuggestions.length} grocery suggestions`);
    console.log(`Seeded ${recipes.length} recipes`);
    console.log(`Created demo user: demo@freshtrack.com / password123`);
    console.log(`Seeded ${demoGroceries.length} groceries for demo user`);
    console.log(`Seeded ${demoNotifications.length} notifications for demo user`);
    console.log('Seeded 1 meal plan for demo user');
    console.log('\nSeed completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seed if this file is executed directly
if (process.argv[1].endsWith('seed.js')) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seed;
