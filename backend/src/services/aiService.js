import Groq from 'groq-sdk';
import pool from '../db/index.js';

// Initialize Groq client (will use GROQ_API_KEY env var automatically)
const groq = new Groq();

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Generate a meal plan using Groq AI based on user's pantry items and preferences
 * @param {number} userId - The user's ID
 * @returns {Promise<Object>} - AI-generated meal suggestions
 */
export async function generateAIMealPlan(userId) {
  const client = await pool.connect();

  try {
    // Get user's expiring groceries (within 7 days)
    const groceriesResult = await client.query(`
      SELECT name, category, quantity, unit, expiry_date,
             DATE_PART('day', expiry_date - CURRENT_DATE) as days_until_expiry
      FROM groceries
      WHERE user_id = $1
        AND is_consumed = false
        AND expiry_date IS NOT NULL
        AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY expiry_date ASC
    `, [userId]);

    const expiringItems = groceriesResult.rows.map(g => ({
      name: g.name,
      category: g.category,
      quantity: `${g.quantity} ${g.unit}`,
      daysUntilExpiry: Math.round(g.days_until_expiry)
    }));

    // Get all pantry items (not just expiring)
    const allGroceriesResult = await client.query(`
      SELECT name, category, quantity, unit
      FROM groceries
      WHERE user_id = $1 AND is_consumed = false
    `, [userId]);

    const pantryItems = allGroceriesResult.rows.map(g => ({
      name: g.name,
      category: g.category,
      quantity: `${g.quantity} ${g.unit}`
    }));

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

    // Build the prompt
    const prompt = buildMealPlanPrompt(expiringItems, pantryItems, preferences);

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful meal planning assistant. You create practical, balanced meal plans that prioritize using ingredients that are about to expire. Always respond with valid JSON only, no additional text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the AI response
    const mealPlan = JSON.parse(responseText);

    // Validate and structure the response
    return formatMealPlanResponse(mealPlan, expiringItems);
  } finally {
    client.release();
  }
}

/**
 * Build the prompt for meal plan generation
 */
function buildMealPlanPrompt(expiringItems, pantryItems, preferences) {
  const expiringList = expiringItems.length > 0
    ? expiringItems.map(item => `- ${item.name} (${item.quantity}, expires in ${item.daysUntilExpiry} days)`).join('\n')
    : 'No items expiring soon';

  const pantryList = pantryItems.length > 0
    ? pantryItems.map(item => `- ${item.name} (${item.quantity})`).join('\n')
    : 'Pantry is empty';

  const dietaryInfo = [];
  if (preferences.dietary_restrictions?.length > 0) {
    dietaryInfo.push(`Dietary restrictions: ${preferences.dietary_restrictions.join(', ')}`);
  }
  if (preferences.allergies?.length > 0) {
    dietaryInfo.push(`Allergies (MUST AVOID): ${preferences.allergies.join(', ')}`);
  }
  if (preferences.disliked_ingredients?.length > 0) {
    dietaryInfo.push(`Disliked ingredients: ${preferences.disliked_ingredients.join(', ')}`);
  }

  const preferencesText = dietaryInfo.length > 0
    ? dietaryInfo.join('\n')
    : 'No specific dietary preferences';

  return `Create a 7-day meal plan for me. Here's my current situation:

**Items Expiring Soon (USE THESE FIRST):**
${expiringList}

**Other Items in Pantry:**
${pantryList}

**My Preferences:**
${preferencesText}

Please create a meal plan in the following JSON format:
{
  "meals": {
    "monday": {
      "breakfast": { "name": "Meal Name", "description": "Brief description", "ingredients": ["ingredient1", "ingredient2"], "prepTime": 15, "usesExpiring": ["item1"] },
      "lunch": { ... },
      "dinner": { ... }
    },
    "tuesday": { ... },
    ...for all 7 days
  },
  "tips": ["Tip about using expiring ingredients", "Another helpful tip"],
  "shoppingList": ["Items you might need to buy"]
}

Important:
- Prioritize using the expiring items in your suggestions
- Keep meals simple and practical
- Include prep time in minutes
- List which expiring items each meal uses in "usesExpiring"
- Respect all allergies and dietary restrictions`;
}

/**
 * Format and validate the AI response
 */
function formatMealPlanResponse(aiResponse, expiringItems) {
  const expiringNames = expiringItems.map(item => item.name.toLowerCase());

  // Ensure we have the required structure
  const meals = aiResponse.meals || {};
  const formattedMeals = {};

  for (const day of DAYS_OF_WEEK) {
    formattedMeals[day] = {};
    const dayMeals = meals[day] || {};

    for (const mealType of MEAL_TYPES) {
      const meal = dayMeals[mealType];

      if (meal && meal.name) {
        formattedMeals[day][mealType] = {
          recipeName: meal.name,
          description: meal.description || '',
          ingredients: meal.ingredients || [],
          prepTime: meal.prepTime || 30,
          usesExpiring: meal.usesExpiring || [],
          isAISuggestion: true
        };
      } else {
        formattedMeals[day][mealType] = null;
      }
    }
  }

  return {
    meals: formattedMeals,
    tips: aiResponse.tips || [],
    shoppingList: aiResponse.shoppingList || [],
    expiringItemsUsed: [...new Set(
      Object.values(formattedMeals)
        .flatMap(day => Object.values(day))
        .filter(Boolean)
        .flatMap(meal => meal.usesExpiring || [])
    )],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Check if Groq API is configured
 */
export function isGroqConfigured() {
  return !!process.env.GROQ_API_KEY;
}
