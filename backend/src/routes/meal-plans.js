import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { generateMealPlan } from '../services/mealPlanGenerator.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * GET /api/meal-plans
 * Get user's meal plans
 * Query: ?weekStart=2024-01-01
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { weekStart } = req.query;

    let query;
    let params;

    if (weekStart) {
      query = `
        SELECT id, week_start, meals
        FROM meal_plans
        WHERE user_id = $1 AND week_start = $2
        ORDER BY week_start DESC
      `;
      params = [req.user.id, weekStart];
    } else {
      query = `
        SELECT id, week_start, meals
        FROM meal_plans
        WHERE user_id = $1
        ORDER BY week_start DESC
        LIMIT 10
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);

    res.json({
      mealPlans: result.rows.map(row => ({
        id: row.id,
        weekStart: row.week_start,
        meals: row.meals
      }))
    });
  } catch (error) {
    console.error('[MealPlans] Get meal plans error:', error.message);
    res.status(500).json(CommonErrors.internalError('load your meal plans'));
  }
});

/**
 * POST /api/meal-plans/generate
 * Generate new meal plan using mock AI
 * Body: { weekStart } (optional, defaults to current week)
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    let { weekStart } = req.body;

    // Default to current week's Monday
    if (!weekStart) {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      weekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];
    }

    // Generate meal plan
    const mealPlan = await generateMealPlan(req.user.id, weekStart);

    // Save to database (upsert)
    const result = await pool.query(
      `INSERT INTO meal_plans (user_id, week_start, meals)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, week_start)
       DO UPDATE SET meals = EXCLUDED.meals
       RETURNING id, week_start, meals`,
      [req.user.id, weekStart, JSON.stringify(mealPlan)]
    );

    // If ON CONFLICT doesn't work due to missing unique constraint, try update then insert
    let savedPlan = result.rows[0];

    if (!savedPlan) {
      // Check if exists
      const existing = await pool.query(
        'SELECT id FROM meal_plans WHERE user_id = $1 AND week_start = $2',
        [req.user.id, weekStart]
      );

      if (existing.rows.length > 0) {
        const updateResult = await pool.query(
          `UPDATE meal_plans SET meals = $1 WHERE user_id = $2 AND week_start = $3 RETURNING id, week_start, meals`,
          [JSON.stringify(mealPlan), req.user.id, weekStart]
        );
        savedPlan = updateResult.rows[0];
      } else {
        const insertResult = await pool.query(
          `INSERT INTO meal_plans (user_id, week_start, meals) VALUES ($1, $2, $3) RETURNING id, week_start, meals`,
          [req.user.id, weekStart, JSON.stringify(mealPlan)]
        );
        savedPlan = insertResult.rows[0];
      }
    }

    res.status(201).json({
      message: 'Meal plan generated successfully',
      mealPlan: {
        id: savedPlan.id,
        weekStart: savedPlan.week_start,
        meals: savedPlan.meals
      }
    });
  } catch (error) {
    console.error('[MealPlans] Generate meal plan error:', error.message);
    res.status(500).json(CommonErrors.internalError('generate your meal plan'));
  }
});

/**
 * PUT /api/meal-plans/:id
 * Update meal plan
 * Body: { meals }
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { meals } = req.body;

    if (!meals || typeof meals !== 'object') {
      return res.status(400).json(
        CommonErrors.validationError(
          'Meals data is required.',
          { field: 'meals' }
        )
      );
    }

    const result = await pool.query(
      `UPDATE meal_plans
       SET meals = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, week_start, meals`,
      [JSON.stringify(meals), id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Meal plan'));
    }

    const mealPlan = result.rows[0];

    res.json({
      message: 'Meal plan updated successfully',
      mealPlan: {
        id: mealPlan.id,
        weekStart: mealPlan.week_start,
        meals: mealPlan.meals
      }
    });
  } catch (error) {
    console.error('[MealPlans] Update meal plan error:', error.message);
    res.status(500).json(CommonErrors.internalError('update your meal plan'));
  }
});

export default router;
