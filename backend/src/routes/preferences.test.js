import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import preferencesRouter from './preferences.js';

// Mock the database pool
vi.mock('../db/index.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

// Mock the auth middleware
vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    // Check for test header to simulate auth
    if (req.headers['x-test-user-id']) {
      req.user = { id: parseInt(req.headers['x-test-user-id']) };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },
}));

import pool from '../db/index.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/preferences', preferencesRouter);
  return app;
};

describe('GET /api/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without authentication', async () => {
    const app = createTestApp();

    const response = await request(app)
      .get('/api/preferences');

    expect(response.status).toBe(401);
  });

  it('returns existing preferences for authenticated user', async () => {
    const app = createTestApp();

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: ['Vegetarian'],
        allergies: ['Peanuts'],
        disliked_ingredients: ['Cilantro'],
        unit_system: 'imperial',
        currency: 'EUR',
      }],
    });

    const response = await request(app)
      .get('/api/preferences')
      .set('x-test-user-id', '123');

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual({
      id: 1,
      dietaryRestrictions: ['Vegetarian'],
      allergies: ['Peanuts'],
      dislikedIngredients: ['Cilantro'],
      unitSystem: 'imperial',
      currency: 'EUR',
    });
  });

  it('creates default preferences for new user', async () => {
    const app = createTestApp();

    // First query returns empty (no existing preferences)
    pool.query.mockResolvedValueOnce({ rows: [] });

    // INSERT returns new preferences
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: null,
        allergies: null,
        disliked_ingredients: null,
        unit_system: 'metric',
        currency: 'USD',
      }],
    });

    const response = await request(app)
      .get('/api/preferences')
      .set('x-test-user-id', '123');

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual({
      id: 1,
      dietaryRestrictions: [],
      allergies: [],
      dislikedIngredients: [],
      unitSystem: 'metric',
      currency: 'USD',
    });
  });

  it('handles race condition when another request creates preferences first', async () => {
    const app = createTestApp();

    // First query returns empty (no existing preferences)
    pool.query.mockResolvedValueOnce({ rows: [] });

    // INSERT returns empty (another request won the race)
    pool.query.mockResolvedValueOnce({ rows: [] });

    // Fetch again returns the preferences created by the other request
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: ['Vegan'],
        allergies: [],
        disliked_ingredients: [],
        unit_system: 'metric',
        currency: 'USD',
      }],
    });

    const response = await request(app)
      .get('/api/preferences')
      .set('x-test-user-id', '123');

    expect(response.status).toBe(200);
    expect(response.body.preferences.dietaryRestrictions).toEqual(['Vegan']);
    expect(pool.query).toHaveBeenCalledTimes(3);
  });

  it('returns 500 on database error', async () => {
    const app = createTestApp();

    pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/preferences')
      .set('x-test-user-id', '123');

    expect(response.status).toBe(500);
    expect(response.body.code).toBe('INTERNAL_ERROR');
  });

  it('handles null values in database response', async () => {
    const app = createTestApp();

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: null,
        allergies: null,
        disliked_ingredients: null,
        unit_system: null,
        currency: null,
      }],
    });

    const response = await request(app)
      .get('/api/preferences')
      .set('x-test-user-id', '123');

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual({
      id: 1,
      dietaryRestrictions: [],
      allergies: [],
      dislikedIngredients: [],
      unitSystem: 'metric',
      currency: 'USD',
    });
  });
});

describe('PUT /api/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without authentication', async () => {
    const app = createTestApp();

    const response = await request(app)
      .put('/api/preferences')
      .send({ unitSystem: 'metric' });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid unit system', async () => {
    const app = createTestApp();

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send({ unitSystem: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.message).toContain('Invalid unit system');
    expect(response.body.message).toContain('metric, imperial');
  });

  it('returns 400 for invalid currency', async () => {
    const app = createTestApp();

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send({ currency: 'XYZ' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.message).toContain('Invalid currency');
    expect(response.body.message).toContain('USD, EUR, GBP');
  });

  it('successfully updates preferences with valid data', async () => {
    const app = createTestApp();

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: ['Vegan'],
        allergies: ['Peanuts'],
        disliked_ingredients: ['Onions'],
        unit_system: 'imperial',
        currency: 'GBP',
      }],
    });

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send({
        dietaryRestrictions: ['Vegan'],
        allergies: ['Peanuts'],
        dislikedIngredients: ['Onions'],
        unitSystem: 'imperial',
        currency: 'GBP',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Preferences updated successfully');
    expect(response.body.preferences).toEqual({
      id: 1,
      dietaryRestrictions: ['Vegan'],
      allergies: ['Peanuts'],
      dislikedIngredients: ['Onions'],
      unitSystem: 'imperial',
      currency: 'GBP',
    });
  });

  it('uses default values when fields are not provided', async () => {
    const app = createTestApp();

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: [],
        allergies: [],
        disliked_ingredients: [],
        unit_system: 'metric',
        currency: 'USD',
      }],
    });

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send({});

    expect(response.status).toBe(200);

    // Verify the query was called with default values
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      [123, [], [], [], 'metric', 'USD']
    );
  });

  it('handles non-array values for array fields', async () => {
    const app = createTestApp();

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: [],
        allergies: [],
        disliked_ingredients: [],
        unit_system: 'metric',
        currency: 'USD',
      }],
    });

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send({
        dietaryRestrictions: 'not-an-array',
        allergies: null,
        dislikedIngredients: 123,
      });

    expect(response.status).toBe(200);

    // Verify non-arrays were converted to empty arrays
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      [123, [], [], [], 'metric', 'USD']
    );
  });

  it('accepts all valid currencies', async () => {
    const app = createTestApp();
    const validCurrencies = ['USD', 'EUR', 'GBP', 'SEK', 'CAD', 'AUD', 'JPY', 'CHF', 'NOK', 'DKK'];

    for (const currency of validCurrencies) {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          dietary_restrictions: [],
          allergies: [],
          disliked_ingredients: [],
          unit_system: 'metric',
          currency: currency,
        }],
      });

      const response = await request(app)
        .put('/api/preferences')
        .set('x-test-user-id', '123')
        .send({ currency });

      expect(response.status).toBe(200);
      expect(response.body.preferences.currency).toBe(currency);
    }
  });

  it('accepts both valid unit systems', async () => {
    const app = createTestApp();
    const validUnitSystems = ['metric', 'imperial'];

    for (const unitSystem of validUnitSystems) {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          dietary_restrictions: [],
          allergies: [],
          disliked_ingredients: [],
          unit_system: unitSystem,
          currency: 'USD',
        }],
      });

      const response = await request(app)
        .put('/api/preferences')
        .set('x-test-user-id', '123')
        .send({ unitSystem });

      expect(response.status).toBe(200);
      expect(response.body.preferences.unitSystem).toBe(unitSystem);
    }
  });

  it('returns 500 on database error', async () => {
    const app = createTestApp();

    pool.query.mockRejectedValueOnce(new Error('Database write failed'));

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send({ unitSystem: 'metric' });

    expect(response.status).toBe(500);
    expect(response.body.code).toBe('INTERNAL_ERROR');
  });

  it('preserves array contents when valid', async () => {
    const app = createTestApp();

    const testData = {
      dietaryRestrictions: ['Vegetarian', 'Gluten-Free'],
      allergies: ['Peanuts', 'Tree Nuts', 'Shellfish'],
      dislikedIngredients: ['Cilantro', 'Olives'],
    };

    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        dietary_restrictions: testData.dietaryRestrictions,
        allergies: testData.allergies,
        disliked_ingredients: testData.dislikedIngredients,
        unit_system: 'metric',
        currency: 'USD',
      }],
    });

    const response = await request(app)
      .put('/api/preferences')
      .set('x-test-user-id', '123')
      .send(testData);

    expect(response.status).toBe(200);
    expect(response.body.preferences.dietaryRestrictions).toEqual(testData.dietaryRestrictions);
    expect(response.body.preferences.allergies).toEqual(testData.allergies);
    expect(response.body.preferences.dislikedIngredients).toEqual(testData.dislikedIngredients);
  });
});
