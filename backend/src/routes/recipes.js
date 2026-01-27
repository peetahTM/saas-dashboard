import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * GET /api/recipes
 * List recipes with optional dietary filter
 * Query: ?dietary=gluten-free,vegetarian&limit=20&offset=0
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const dietaryFilter = req.query.dietary ? req.query.dietary.split(',').map(d => d.trim()) : [];

    let query;
    let params;

    if (dietaryFilter.length > 0) {
      // Filter recipes that have ALL the specified dietary tags
      query = `
        SELECT id, name, ingredients, instructions, prep_time, dietary_tags
        FROM recipes
        WHERE dietary_tags @> $1
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `;
      params = [dietaryFilter, limit, offset];
    } else {
      query = `
        SELECT id, name, ingredients, instructions, prep_time, dietary_tags
        FROM recipes
        ORDER BY name ASC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);

    // Get total count
    let countQuery;
    let countParams;

    if (dietaryFilter.length > 0) {
      countQuery = 'SELECT COUNT(*) FROM recipes WHERE dietary_tags @> $1';
      countParams = [dietaryFilter];
    } else {
      countQuery = 'SELECT COUNT(*) FROM recipes';
      countParams = [];
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      recipes: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        ingredients: row.ingredients,
        instructions: row.instructions,
        prepTime: row.prep_time,
        dietaryTags: row.dietary_tags || []
      })),
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    });
  } catch (error) {
    console.error('[Recipes] Get recipes error:', error.message);
    res.status(500).json(CommonErrors.internalError('load recipes'));
  }
});

/**
 * GET /api/recipes/suggestions
 * Get recipes matching expiring groceries
 * Returns recipes that use ingredients expiring within 7 days
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
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
        expiringNames.forEach(expiring => {
          if (ingredientNames.some(ing => ing.includes(expiring) || expiring.includes(ing))) {
            matchCount++;
          }
        });

        if (matchCount === 0) {
          return null;
        }

        return {
          ...recipe,
          matchingIngredientsCount: matchCount
        };
      })
      .filter(r => r !== null)
      .sort((a, b) => b.matchingIngredientsCount - a.matchingIngredientsCount)
      .slice(0, 10);

    res.json({
      recipes: scoredRecipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prep_time,
        dietaryTags: recipe.dietary_tags || [],
        matchingIngredientsCount: recipe.matchingIngredientsCount
      })),
      expiringGroceries: expiringGroceries.map(g => ({
        name: g.name,
        expiryDate: g.expiry_date
      }))
    });
  } catch (error) {
    console.error('[Recipes] Get recipe suggestions error:', error.message);
    res.status(500).json(CommonErrors.internalError('find recipe suggestions'));
  }
});

/**
 * GET /api/recipes/:id
 * Get single recipe
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, ingredients, instructions, prep_time, dietary_tags FROM recipes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Recipe'));
    }

    const recipe = result.rows[0];

    res.json({
      recipe: {
        id: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prep_time,
        dietaryTags: recipe.dietary_tags || []
      }
    });
  } catch (error) {
    console.error('[Recipes] Get recipe error:', error.message);
    res.status(500).json(CommonErrors.internalError('load the recipe'));
  }
});

export default router;
