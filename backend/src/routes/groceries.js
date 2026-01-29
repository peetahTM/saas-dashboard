import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * GET /api/groceries
 * List user's groceries (not consumed)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, quantity, unit, expiry_date, is_consumed, storage_location, created_at
       FROM groceries
       WHERE user_id = $1 AND is_consumed = FALSE
       ORDER BY expiry_date ASC NULLS LAST`,
      [req.user.id]
    );

    res.json({
      groceries: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        expiryDate: row.expiry_date,
        isConsumed: row.is_consumed,
        storageLocation: row.storage_location || 'pantry',
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('[Groceries] Get groceries error:', error.message);
    res.status(500).json(CommonErrors.internalError('load your pantry items'));
  }
});

/**
 * POST /api/groceries
 * Add grocery item
 * Body: { name, category, quantity, unit, expiryDate, storageLocation }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, quantity, unit, expiryDate, storageLocation } = req.body;

    if (!name) {
      return res.status(400).json(
        CommonErrors.validationError(
          'Item name is required.',
          { field: 'name' }
        )
      );
    }

    const result = await pool.query(
      `INSERT INTO groceries (user_id, name, category, quantity, unit, expiry_date, storage_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, category, quantity, unit, expiry_date, is_consumed, storage_location, created_at`,
      [req.user.id, name, category || null, quantity || 1, unit || null, expiryDate || null, storageLocation || 'pantry']
    );

    const grocery = result.rows[0];

    res.status(201).json({
      message: 'Grocery item added successfully',
      grocery: {
        id: grocery.id,
        name: grocery.name,
        category: grocery.category,
        quantity: parseFloat(grocery.quantity),
        unit: grocery.unit,
        expiryDate: grocery.expiry_date,
        isConsumed: grocery.is_consumed,
        storageLocation: grocery.storage_location || 'pantry',
        createdAt: grocery.created_at
      }
    });
  } catch (error) {
    console.error('[Groceries] Add grocery error:', error.message);
    res.status(500).json(CommonErrors.internalError('add the grocery item'));
  }
});

/**
 * PUT /api/groceries/:id
 * Update grocery item
 * Body: { name, category, quantity, unit, expiryDate, storageLocation }
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, unit, expiryDate, storageLocation } = req.body;

    // Check if grocery exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM groceries WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Grocery item'));
    }

    const result = await pool.query(
      `UPDATE groceries
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           quantity = COALESCE($3, quantity),
           unit = COALESCE($4, unit),
           expiry_date = COALESCE($5, expiry_date),
           storage_location = COALESCE($6, storage_location)
       WHERE id = $7 AND user_id = $8
       RETURNING id, name, category, quantity, unit, expiry_date, is_consumed, storage_location, created_at`,
      [name, category, quantity, unit, expiryDate, storageLocation, id, req.user.id]
    );

    const grocery = result.rows[0];

    res.json({
      message: 'Grocery item updated successfully',
      grocery: {
        id: grocery.id,
        name: grocery.name,
        category: grocery.category,
        quantity: parseFloat(grocery.quantity),
        unit: grocery.unit,
        expiryDate: grocery.expiry_date,
        isConsumed: grocery.is_consumed,
        storageLocation: grocery.storage_location || 'pantry',
        createdAt: grocery.created_at
      }
    });
  } catch (error) {
    console.error('[Groceries] Update grocery error:', error.message);
    res.status(500).json(CommonErrors.internalError('update the grocery item'));
  }
});

/**
 * DELETE /api/groceries/:id
 * Delete grocery item
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM groceries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Grocery item'));
    }

    res.json({
      message: 'Grocery item deleted successfully'
    });
  } catch (error) {
    console.error('[Groceries] Delete grocery error:', error.message);
    res.status(500).json(CommonErrors.internalError('delete the grocery item'));
  }
});

/**
 * POST /api/groceries/:id/consume
 * Mark grocery item as consumed
 */
router.post('/:id/consume', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE groceries
       SET is_consumed = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, category, quantity, unit, expiry_date, is_consumed, storage_location, created_at`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Grocery item'));
    }

    const grocery = result.rows[0];

    res.json({
      message: 'Grocery item marked as consumed',
      grocery: {
        id: grocery.id,
        name: grocery.name,
        category: grocery.category,
        quantity: parseFloat(grocery.quantity),
        unit: grocery.unit,
        expiryDate: grocery.expiry_date,
        isConsumed: grocery.is_consumed,
        storageLocation: grocery.storage_location || 'pantry',
        createdAt: grocery.created_at
      }
    });
  } catch (error) {
    console.error('[Groceries] Consume grocery error:', error.message);
    res.status(500).json(CommonErrors.internalError('mark the item as consumed'));
  }
});

/**
 * GET /api/groceries/suggestions
 * Search grocery suggestions for autocomplete
 * Query: ?q=search_term
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    let result;
    if (q && q.trim()) {
      result = await pool.query(
        `SELECT id, name, category, default_expiry_days, default_storage_location
         FROM grocery_suggestions
         WHERE LOWER(name) LIKE LOWER($1)
         ORDER BY name ASC
         LIMIT 20`,
        [`%${q.trim()}%`]
      );
    } else {
      result = await pool.query(
        `SELECT id, name, category, default_expiry_days, default_storage_location
         FROM grocery_suggestions
         ORDER BY name ASC
         LIMIT 20`
      );
    }

    res.json({
      suggestions: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        defaultExpiryDays: row.default_expiry_days,
        defaultStorageLocation: row.default_storage_location
      }))
    });
  } catch (error) {
    console.error('[Groceries] Get suggestions error:', error.message);
    res.status(500).json(CommonErrors.internalError('load grocery suggestions'));
  }
});

export default router;
