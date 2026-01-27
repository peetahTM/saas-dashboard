import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Get food waste statistics for the dashboard
 * Returns:
 *   - expiringCount: Items expiring within 3 days
 *   - expiredThisWeek: Items that expired in last 7 days
 *   - consumedCount: Items marked as consumed this month
 *   - potentialSavings: Estimated $ saved (consumed items * $3 avg)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Items expiring within 3 days (not consumed)
    const expiringResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM groceries
       WHERE user_id = $1
         AND is_consumed = FALSE
         AND expiry_date IS NOT NULL
         AND expiry_date > CURRENT_DATE
         AND expiry_date <= CURRENT_DATE + INTERVAL '3 days'`,
      [req.user.id]
    );

    // Items that expired in the last 7 days (not consumed)
    const expiredResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM groceries
       WHERE user_id = $1
         AND is_consumed = FALSE
         AND expiry_date IS NOT NULL
         AND expiry_date < CURRENT_DATE
         AND expiry_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );

    // Items consumed this month
    const consumedResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM groceries
       WHERE user_id = $1
         AND is_consumed = TRUE
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [req.user.id]
    );

    const expiringCount = parseInt(expiringResult.rows[0].count);
    const expiredThisWeek = parseInt(expiredResult.rows[0].count);
    const consumedCount = parseInt(consumedResult.rows[0].count);
    const potentialSavings = consumedCount * 3; // $3 average per item

    res.json({
      expiringCount,
      expiredThisWeek,
      consumedCount,
      potentialSavings
    });
  } catch (error) {
    console.error('[Dashboard] Get dashboard stats error:', error.message);
    res.status(500).json(CommonErrors.internalError('load dashboard statistics'));
  }
});

/**
 * GET /api/dashboard/expiring-soon
 * Get top 5 items expiring soon
 */
router.get('/expiring-soon', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, quantity, unit, expiry_date
       FROM groceries
       WHERE user_id = $1
         AND is_consumed = FALSE
         AND expiry_date IS NOT NULL
         AND expiry_date >= CURRENT_DATE
       ORDER BY expiry_date ASC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      items: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        expiryDate: row.expiry_date
      }))
    });
  } catch (error) {
    console.error('[Dashboard] Get expiring soon error:', error.message);
    res.status(500).json(CommonErrors.internalError('load expiring items'));
  }
});

/**
 * GET /api/dashboard/suggested-recipes
 * Get top 3 recipes using expiring items
 */
router.get('/suggested-recipes', authenticateToken, async (req, res) => {
  try {
    // Get user's groceries expiring within 7 days
    const groceriesResult = await pool.query(
      `SELECT name, expiry_date
       FROM groceries
       WHERE user_id = $1
         AND is_consumed = FALSE
         AND expiry_date IS NOT NULL
         AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
       ORDER BY expiry_date ASC`,
      [req.user.id]
    );

    const expiringGroceries = groceriesResult.rows;

    if (expiringGroceries.length === 0) {
      return res.json({
        recipes: [],
        message: 'No expiring groceries found'
      });
    }

    // Get user preferences
    const prefsResult = await pool.query(
      `SELECT dietary_restrictions, allergies, disliked_ingredients
       FROM user_preferences
       WHERE user_id = $1`,
      [req.user.id]
    );

    const prefs = prefsResult.rows[0] || {
      dietary_restrictions: [],
      allergies: [],
      disliked_ingredients: []
    };

    // Get all recipes
    const recipesResult = await pool.query(
      'SELECT id, name, ingredients, instructions, prep_time, dietary_tags FROM recipes'
    );

    const expiringNames = expiringGroceries.map(g => g.name.toLowerCase());

    // Score and filter recipes
    const scoredRecipes = recipesResult.rows
      .map(recipe => {
        const ingredients = recipe.ingredients || [];
        const ingredientNames = ingredients.map(i => i.name.toLowerCase());

        // Check for allergies and disliked ingredients
        const hasAllergen = (prefs.allergies || []).some(allergy =>
          ingredientNames.some(ing => ing.includes(allergy.toLowerCase()))
        );

        const hasDisliked = (prefs.disliked_ingredients || []).some(disliked =>
          ingredientNames.some(ing => ing.includes(disliked.toLowerCase()))
        );

        if (hasAllergen || hasDisliked) {
          return null;
        }

        // Check dietary restrictions
        const dietaryRestrictions = prefs.dietary_restrictions || [];
        if (dietaryRestrictions.length > 0) {
          const recipeTags = recipe.dietary_tags || [];
          const meetsRestrictions = dietaryRestrictions.every(restriction =>
            recipeTags.includes(restriction)
          );
          if (!meetsRestrictions) {
            return null;
          }
        }

        // Count matching expiring ingredients
        let matchCount = 0;
        const matchingIngredients = [];
        expiringNames.forEach(expiring => {
          if (ingredientNames.some(ing => ing.includes(expiring) || expiring.includes(ing))) {
            matchCount++;
            matchingIngredients.push(expiring);
          }
        });

        if (matchCount === 0) {
          return null;
        }

        return {
          ...recipe,
          matchingIngredientsCount: matchCount,
          matchingIngredients
        };
      })
      .filter(r => r !== null)
      .sort((a, b) => b.matchingIngredientsCount - a.matchingIngredientsCount)
      .slice(0, 3);

    res.json({
      recipes: scoredRecipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prep_time,
        dietaryTags: recipe.dietary_tags || [],
        matchingIngredientsCount: recipe.matchingIngredientsCount,
        matchingIngredients: recipe.matchingIngredients
      }))
    });
  } catch (error) {
    console.error('[Dashboard] Get suggested recipes error:', error.message);
    res.status(500).json(CommonErrors.internalError('load recipe suggestions'));
  }
});

export default router;
