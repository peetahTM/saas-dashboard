import pool from '../db/index.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export async function generateMealPlan(userId) {
  const client = await pool.connect();
  try {
    // Get user's expiring groceries (within 7 days)
    const groceriesResult = await client.query(`
      SELECT name, category, expiry_date,
             DATE_PART('day', expiry_date - CURRENT_DATE) as days_until_expiry
      FROM groceries
      WHERE user_id = $1
        AND is_consumed = false
        AND expiry_date IS NOT NULL
        AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY expiry_date ASC
    `, [userId]);

    const expiringItems = groceriesResult.rows.map(g => g.name.toLowerCase());

    // Get user preferences
    const prefsResult = await client.query(
      'SELECT dietary_restrictions, allergies, disliked_ingredients FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    const preferences = prefsResult.rows[0] || {
      dietary_restrictions: [],
      allergies: [],
      disliked_ingredients: []
    };

    // Get all recipes
    const recipesResult = await client.query('SELECT * FROM recipes');
    let recipes = recipesResult.rows;

    // Filter recipes by dietary restrictions
    if (preferences.dietary_restrictions?.length > 0) {
      recipes = recipes.filter(recipe => {
        const recipeTags = recipe.dietary_tags || [];
        return preferences.dietary_restrictions.every(restriction =>
          recipeTags.includes(restriction.toLowerCase())
        );
      });
    }

    // Filter out recipes with allergens
    if (preferences.allergies?.length > 0) {
      recipes = recipes.filter(recipe => {
        const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
        return !preferences.allergies.some(allergen =>
          ingredientNames.some(ing => ing.includes(allergen.toLowerCase()))
        );
      });
    }

    // Filter out recipes with disliked ingredients
    if (preferences.disliked_ingredients?.length > 0) {
      recipes = recipes.filter(recipe => {
        const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
        return !preferences.disliked_ingredients.some(disliked =>
          ingredientNames.some(ing => ing.includes(disliked.toLowerCase()))
        );
      });
    }

    // Score recipes by how many expiring items they use
    const scoredRecipes = recipes.map(recipe => {
      const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
      const matchingExpiring = expiringItems.filter(item =>
        ingredientNames.some(ing => ing.includes(item) || item.includes(ing))
      );
      return {
        ...recipe,
        expiryScore: matchingExpiring.length,
        matchingItems: matchingExpiring
      };
    });

    // Sort by expiry score (highest first)
    scoredRecipes.sort((a, b) => b.expiryScore - a.expiryScore);

    // Generate meal plan
    const meals = {};
    const usedRecipeIds = new Set();

    for (const day of DAYS_OF_WEEK) {
      meals[day] = {};

      for (const mealType of MEAL_TYPES) {
        // Find a recipe that hasn't been used yet
        const availableRecipe = scoredRecipes.find(r => !usedRecipeIds.has(r.id));

        if (availableRecipe) {
          usedRecipeIds.add(availableRecipe.id);
          meals[day][mealType] = {
            recipeId: availableRecipe.id,
            recipeName: availableRecipe.name,
            prepTime: availableRecipe.prep_time,
            usesExpiring: availableRecipe.matchingItems
          };
        } else {
          // If we've used all recipes, pick a random one
          const randomRecipe = scoredRecipes[Math.floor(Math.random() * scoredRecipes.length)];
          if (randomRecipe) {
            meals[day][mealType] = {
              recipeId: randomRecipe.id,
              recipeName: randomRecipe.name,
              prepTime: randomRecipe.prep_time,
              usesExpiring: randomRecipe.matchingItems
            };
          } else {
            meals[day][mealType] = null;
          }
        }
      }
    }

    // Calculate week start (next Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + daysUntilMonday);
    weekStart.setHours(0, 0, 0, 0);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      meals,
      expiringItemsUsed: [...new Set(scoredRecipes.flatMap(r => r.matchingItems))],
      totalRecipes: Object.values(meals).flatMap(day => Object.values(day)).filter(Boolean).length
    };
  } finally {
    client.release();
  }
}
