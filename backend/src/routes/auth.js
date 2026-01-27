import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import pool from '../db/index.js';
import { CommonErrors, createErrorResponse, ErrorCodes } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * POST /register
 * Create a new user account
 * Body: { email, password, name }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json(
        CommonErrors.validationError(
          'Email, password, and name are required.',
          { fields: ['email', 'password', 'name'] }
        )
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        createErrorResponse(
          'Validation error',
          ErrorCodes.INVALID_FORMAT,
          'Please enter a valid email address.',
          { field: 'email' }
        )
      );
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json(
        CommonErrors.validationError(
          'Password must be at least 6 characters long.',
          { field: 'password', minLength: 6 }
        )
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json(
        CommonErrors.conflict('An account with this email already exists. Try logging in instead.')
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );

    const newUser = result.rows[0];

    // Create default user preferences
    await pool.query(
      'INSERT INTO user_preferences (user_id) VALUES ($1)',
      [newUser.id]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.created_at
      }
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error.message);
    res.status(500).json(CommonErrors.internalError('register your account'));
  }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json(
        CommonErrors.validationError(
          'Email and password are required.',
          { fields: ['email', 'password'] }
        )
      );
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json(CommonErrors.invalidCredentials());
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json(CommonErrors.invalidCredentials());
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json(CommonErrors.internalError('log in'));
  }
});

/**
 * GET /me
 * Get current authenticated user's information
 * Requires valid JWT token in Authorization header
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Find user by ID from token
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json(CommonErrors.notFound('User'));
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error.message);
    res.status(500).json(CommonErrors.internalError('fetch user information'));
  }
});

export default router;
