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
    let result = await pool.query(
      `SELECT user_id, dietary_restrictions, allergies, disliked_ingredients, unit_system, currency
       FROM user_preferences
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Create default preferences if they don't exist (handles race condition with ON CONFLICT)
      const newPrefs = await pool.query(
        `INSERT INTO user_preferences (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING user_id, dietary_restrictions, allergies, disliked_ingredients, unit_system, currency`,
        [req.user.id]
      );

      // If another request won the race, fetch instead
      if (newPrefs.rows.length === 0) {
        result = await pool.query(
          `SELECT user_id, dietary_restrictions, allergies, disliked_ingredients, unit_system, currency
           FROM user_preferences
           WHERE user_id = $1`,
          [req.user.id]
        );
      } else {
        return res.json({
          preferences: {
            id: newPrefs.rows[0].user_id,
            dietaryRestrictions: newPrefs.rows[0].dietary_restrictions || [],
            allergies: newPrefs.rows[0].allergies || [],
            dislikedIngredients: newPrefs.rows[0].disliked_ingredients || [],
            unitSystem: newPrefs.rows[0].unit_system || 'metric',
            currency: newPrefs.rows[0].currency || 'USD'
          }
        });
      }
    }

    const prefs = result.rows[0];

    res.json({
      preferences: {
        id: prefs.user_id,
        dietaryRestrictions: prefs.dietary_restrictions || [],
        allergies: prefs.allergies || [],
        dislikedIngredients: prefs.disliked_ingredients || [],
        unitSystem: prefs.unit_system || 'metric',
        currency: prefs.currency || 'USD'
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
 * Body: { dietaryRestrictions, allergies, dislikedIngredients, unitSystem, currency }
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json(CommonErrors.validationError('Request body is required'));
    }

    const { dietaryRestrictions, allergies, dislikedIngredients, unitSystem, currency } = req.body;

    // Validate arrays
    const validDietaryRestrictions = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
    const validAllergies = Array.isArray(allergies) ? allergies : [];
    const validDislikedIngredients = Array.isArray(dislikedIngredients) ? dislikedIngredients : [];

    // Validate unit system - return error for invalid values
    const validUnitSystems = ['metric', 'imperial'];
    if (unitSystem !== undefined && !validUnitSystems.includes(unitSystem)) {
      return res.status(400).json(CommonErrors.validationError(
        `Invalid unit system "${unitSystem}". Must be one of: ${validUnitSystems.join(', ')}`
      ));
    }
    const validUnitSystem = unitSystem || 'metric';

    // Validate currency - return error for invalid values
    const validCurrencies = ['USD', 'EUR', 'GBP', 'SEK', 'CAD', 'AUD', 'JPY', 'CHF', 'NOK', 'DKK'];
    if (currency !== undefined && !validCurrencies.includes(currency)) {
      return res.status(400).json(CommonErrors.validationError(
        `Invalid currency "${currency}". Must be one of: ${validCurrencies.join(', ')}`
      ));
    }
    const validCurrency = currency || 'USD';

    // Upsert preferences
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, dietary_restrictions, allergies, disliked_ingredients, unit_system, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET
         dietary_restrictions = EXCLUDED.dietary_restrictions,
         allergies = EXCLUDED.allergies,
         disliked_ingredients = EXCLUDED.disliked_ingredients,
         unit_system = EXCLUDED.unit_system,
         currency = EXCLUDED.currency
       RETURNING user_id, dietary_restrictions, allergies, disliked_ingredients, unit_system, currency`,
      [req.user.id, validDietaryRestrictions, validAllergies, validDislikedIngredients, validUnitSystem, validCurrency]
    );

    const prefs = result.rows[0];

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        id: prefs.user_id,
        dietaryRestrictions: prefs.dietary_restrictions || [],
        allergies: prefs.allergies || [],
        dislikedIngredients: prefs.disliked_ingredients || [],
        unitSystem: prefs.unit_system || 'metric',
        currency: prefs.currency || 'USD'
      }
    });
  } catch (error) {
    console.error('[Preferences] Update preferences error:', error.message);
    res.status(500).json(CommonErrors.internalError('save your preferences'));
  }
});

export default router;
