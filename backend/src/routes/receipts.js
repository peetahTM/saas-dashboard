import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors } from '../utils/errorResponse.js';
import ocrService from '../services/ocrService.js';
import { parseReceiptText, matchWithSuggestions } from '../utils/receiptParser.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * POST /api/receipts/upload
 * Upload and process a receipt image
 */
router.post('/upload', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        CommonErrors.validationError('No receipt image provided.')
      );
    }

    // Create receipt scan record with pending status
    const scanResult = await pool.query(
      `INSERT INTO receipt_scans (user_id, status)
       VALUES ($1, 'processing')
       RETURNING id`,
      [req.user.id]
    );

    const scanId = scanResult.rows[0].id;

    // Process the image with OCR
    const { rawText, confidence } = await ocrService.processReceipt(req.file.buffer);

    // Parse the OCR text
    let parsedItems = parseReceiptText(rawText);

    // Match with grocery suggestions for better accuracy
    const suggestionsResult = await pool.query(
      'SELECT id, name, category, default_expiry_days, default_storage_location FROM grocery_suggestions'
    );
    parsedItems = matchWithSuggestions(parsedItems, suggestionsResult.rows);

    // Update the scan record with results
    await pool.query(
      `UPDATE receipt_scans
       SET raw_ocr_text = $1, parsed_items = $2, confidence = $3, status = 'completed'
       WHERE id = $4`,
      [rawText, JSON.stringify(parsedItems), confidence, scanId]
    );

    res.status(201).json({
      message: 'Receipt processed successfully',
      scan: {
        id: scanId,
        confidence,
        itemCount: parsedItems.length,
        items: parsedItems,
      },
    });
  } catch (error) {
    console.error('[Receipts] Upload error:', error.message);

    if (error.message.includes('Invalid file type')) {
      return res.status(400).json(
        CommonErrors.validationError(error.message)
      );
    }

    res.status(500).json(CommonErrors.internalError('process the receipt'));
  }
});

/**
 * POST /api/receipts/:id/confirm
 * Confirm parsed items and add them to pantry
 */
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(
        CommonErrors.validationError('No items provided to confirm.')
      );
    }

    // Verify the scan belongs to the user
    const scanResult = await client.query(
      'SELECT id FROM receipt_scans WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (scanResult.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Receipt scan'));
    }

    await client.query('BEGIN');

    // Add each item to groceries
    const addedItems = [];
    for (const item of items) {
      const result = await client.query(
        `INSERT INTO groceries (user_id, name, category, quantity, unit, expiry_date, storage_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, category, quantity, unit, expiry_date, is_consumed, storage_location, created_at`,
        [req.user.id, item.name, item.category, item.quantity || 1, item.unit || 'each', item.expiryDate, item.storageLocation || 'pantry']
      );

      addedItems.push({
        id: result.rows[0].id,
        name: result.rows[0].name,
        category: result.rows[0].category,
        quantity: parseFloat(result.rows[0].quantity),
        unit: result.rows[0].unit,
        expiryDate: result.rows[0].expiry_date,
        isConsumed: result.rows[0].is_consumed,
        storageLocation: result.rows[0].storage_location,
        createdAt: result.rows[0].created_at,
      });
    }

    // Update scan status to confirmed
    await client.query(
      `UPDATE receipt_scans SET status = 'confirmed', parsed_items = $1 WHERE id = $2`,
      [JSON.stringify(items), id]
    );

    await client.query('COMMIT');

    res.json({
      message: `${addedItems.length} items added to your pantry`,
      groceries: addedItems,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Receipts] Confirm error:', error.message);
    res.status(500).json(CommonErrors.internalError('add items to pantry'));
  } finally {
    client.release();
  }
});

/**
 * GET /api/receipts/history
 * Get user's receipt scan history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, status, confidence, parsed_items, created_at
       FROM receipt_scans
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM receipt_scans WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      scans: result.rows.map(row => ({
        id: row.id,
        status: row.status,
        confidence: row.confidence ? parseFloat(row.confidence) : null,
        itemCount: row.parsed_items?.length || 0,
        createdAt: row.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('[Receipts] History error:', error.message);
    res.status(500).json(CommonErrors.internalError('load receipt history'));
  }
});

/**
 * GET /api/receipts/:id
 * Get a specific receipt scan with full details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, status, confidence, raw_ocr_text, parsed_items, created_at
       FROM receipt_scans
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Receipt scan'));
    }

    const scan = result.rows[0];

    res.json({
      scan: {
        id: scan.id,
        status: scan.status,
        confidence: scan.confidence ? parseFloat(scan.confidence) : null,
        rawText: scan.raw_ocr_text,
        items: scan.parsed_items || [],
        createdAt: scan.created_at,
      },
    });
  } catch (error) {
    console.error('[Receipts] Get scan error:', error.message);
    res.status(500).json(CommonErrors.internalError('load receipt details'));
  }
});

/**
 * DELETE /api/receipts/:id
 * Delete a receipt scan
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM receipt_scans WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Receipt scan'));
    }

    res.json({
      message: 'Receipt scan deleted successfully',
    });
  } catch (error) {
    console.error('[Receipts] Delete error:', error.message);
    res.status(500).json(CommonErrors.internalError('delete the receipt scan'));
  }
});

export default router;
