import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateAIMealPlan, isGroqConfigured } from '../services/aiService.js';
import { CommonErrors } from '../utils/errorResponse.js';

const router = express.Router();

/**
 * POST /api/ai/generate-meal-plan
 * Generate a meal plan using Groq AI
 * Body: { mealTypes?, dateRange? } (optional filters)
 */
router.post('/generate-meal-plan', authenticateToken, async (req, res) => {
  try {
    // Validate user ID from JWT
    const userId = parseInt(req.user?.id);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Invalid authentication state',
        code: 'INVALID_USER_ID'
      });
    }

    // Check if Groq API is configured
    if (!isGroqConfigured()) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'The AI meal planning feature is not configured. Please contact the administrator.',
        code: 'AI_NOT_CONFIGURED'
      });
    }

    // Generate the meal plan
    const mealPlan = await generateAIMealPlan(userId);

    res.json({
      message: 'AI meal plan generated successfully',
      mealPlan
    });
  } catch (error) {
    // Sanitize error logging to prevent API key exposure
    const sanitizedMessage = error.message?.includes('API key')
      ? 'Invalid API key configuration'
      : error.message;
    console.error('[AI] Generate meal plan error:', sanitizedMessage);

    // Handle specific Groq errors
    if (error.message?.includes('API key')) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'Invalid AI service configuration. Please contact the administrator.',
        code: 'AI_CONFIG_ERROR'
      });
    }

    if (error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many AI requests. Please try again in a few minutes.',
        code: 'AI_RATE_LIMITED'
      });
    }

    // Handle JSON parsing errors from AI response
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'AI response error',
        message: 'Failed to parse AI response. Please try again.',
        code: 'AI_PARSE_ERROR'
      });
    }

    res.status(500).json(CommonErrors.internalError('generate your AI meal plan'));
  }
});

/**
 * GET /api/ai/status
 * Check if AI service is available
 */
router.get('/status', authenticateToken, async (req, res) => {
  res.json({
    available: isGroqConfigured(),
    model: 'llama-3.1-8b-instant'
  });
});

export default router;
