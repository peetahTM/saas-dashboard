import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * GET /api/preferences
 * Get user preferences
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, dietary_restrictions, allergies, disliked_ingredients
       FROM user_preferences
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Create default preferences if they don't exist
      const newPrefs = await pool.query(
        `INSERT INTO user_preferences (user_id)
         VALUES ($1)
         RETURNING id, dietary_restrictions, allergies, disliked_ingredients`,
        [req.user.id]
      );

      return res.json({
        preferences: {
          id: newPrefs.rows[0].id,
          dietaryRestrictions: newPrefs.rows[0].dietary_restrictions || [],
          allergies: newPrefs.rows[0].allergies || [],
          dislikedIngredients: newPrefs.rows[0].disliked_ingredients || []
        }
      });
    }

    const prefs = result.rows[0];

    res.json({
      preferences: {
        id: prefs.id,
        dietaryRestrictions: prefs.dietary_restrictions || [],
        allergies: prefs.allergies || [],
        dislikedIngredients: prefs.disliked_ingredients || []
      }
    });
  } catch (error) {
    console.error('[Preferences] Get preferences error:', error.message);
    res.status(500).json(CommonErrors.internalError('load your preferences'));
  }
});

/**
 * PUT /api/preferences
 * Update user preferences
 * Body: { dietaryRestrictions, allergies, dislikedIngredients }
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { dietaryRestrictions, allergies, dislikedIngredients } = req.body;

    // Validate arrays
    const validDietaryRestrictions = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
    const validAllergies = Array.isArray(allergies) ? allergies : [];
    const validDislikedIngredients = Array.isArray(dislikedIngredients) ? dislikedIngredients : [];

    // Upsert preferences
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, dietary_restrictions, allergies, disliked_ingredients)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET
         dietary_restrictions = EXCLUDED.dietary_restrictions,
         allergies = EXCLUDED.allergies,
         disliked_ingredients = EXCLUDED.disliked_ingredients
       RETURNING id, dietary_restrictions, allergies, disliked_ingredients`,
      [req.user.id, validDietaryRestrictions, validAllergies, validDislikedIngredients]
    );

    const prefs = result.rows[0];

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        id: prefs.id,
        dietaryRestrictions: prefs.dietary_restrictions || [],
        allergies: prefs.allergies || [],
        dislikedIngredients: prefs.disliked_ingredients || []
      }
    });
  } catch (error) {
    console.error('[Preferences] Update preferences error:', error.message);
    res.status(500).json(CommonErrors.internalError('save your preferences'));
  }
});

export default router;
