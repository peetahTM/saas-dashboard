// Migration 001: Initial Schema
// Creates all base tables for FreshTrack application

export const up = async (client) => {
  // Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Groceries table
  await client.query(`
    CREATE TABLE IF NOT EXISTS groceries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity DECIMAL(10, 2) DEFAULT 1,
      unit VARCHAR(50),
      expiry_date DATE,
      is_consumed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for faster grocery queries
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_groceries_user_id ON groceries(user_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_groceries_expiry_date ON groceries(expiry_date);
  `);

  // User preferences table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      dietary_restrictions TEXT[] DEFAULT '{}',
      allergies TEXT[] DEFAULT '{}',
      disliked_ingredients TEXT[] DEFAULT '{}'
    );
  `);

  // Recipes table
  await client.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      ingredients JSONB NOT NULL DEFAULT '[]',
      instructions JSONB NOT NULL DEFAULT '[]',
      prep_time INTEGER,
      dietary_tags TEXT[] DEFAULT '{}'
    );
  `);

  // Meal plans table
  await client.query(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start DATE NOT NULL,
      meals JSONB NOT NULL DEFAULT '{}'
    );
  `);

  // Create index for meal plans
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
  `);

  // Notifications table
  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index for notifications
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `);

  // Grocery suggestions table (for autocomplete)
  await client.query(`
    CREATE TABLE IF NOT EXISTS grocery_suggestions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      default_expiry_days INTEGER DEFAULT 7
    );
  `);

  console.log('Migration 001: Created initial schema');
};

export const down = async (client) => {
  await client.query('DROP TABLE IF EXISTS grocery_suggestions CASCADE');
  await client.query('DROP TABLE IF EXISTS notifications CASCADE');
  await client.query('DROP TABLE IF EXISTS meal_plans CASCADE');
  await client.query('DROP TABLE IF EXISTS recipes CASCADE');
  await client.query('DROP TABLE IF EXISTS user_preferences CASCADE');
  await client.query('DROP TABLE IF EXISTS groceries CASCADE');
  await client.query('DROP TABLE IF EXISTS users CASCADE');

  console.log('Migration 001: Dropped all tables');
};
