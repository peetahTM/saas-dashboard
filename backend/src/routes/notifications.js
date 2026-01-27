import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * GET /api/notifications
 * List user notifications
 * Query: ?limit=20&offset=0
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT id, type, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      notifications: result.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        isRead: row.is_read,
        createdAt: row.created_at
      })),
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    });
  } catch (error) {
    console.error('[Notifications] Get notifications error:', error.message);
    res.status(500).json(CommonErrors.internalError('load your notifications'));
  }
});

/**
 * GET /api/notifications/unread/count
 * Get unread notification count
 */
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      unreadCount: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('[Notifications] Get unread count error:', error.message);
    res.status(500).json(CommonErrors.internalError('check notification count'));
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all user's notifications as read
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING id`,
      [req.user.id]
    );

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.rowCount
    });
  } catch (error) {
    console.error('[Notifications] Mark all notifications read error:', error.message);
    res.status(500).json(CommonErrors.internalError('mark notifications as read'));
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, message, is_read, created_at`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(CommonErrors.notFound('Notification'));
    }

    const notification = result.rows[0];

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.is_read,
        createdAt: notification.created_at
      }
    });
  } catch (error) {
    console.error('[Notifications] Mark notification read error:', error.message);
    res.status(500).json(CommonErrors.internalError('update the notification'));
  }
});

export default router;
