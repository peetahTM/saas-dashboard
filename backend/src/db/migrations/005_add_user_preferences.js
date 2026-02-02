// Migration 005: Add Unit System and Currency Preferences
// Adds unit_system and currency columns to user_preferences table

export const up = async (client) => {
  // Add unit_system column to user_preferences table
  await client.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS unit_system VARCHAR(10) DEFAULT 'metric';
  `);

  // Add currency column to user_preferences table
  await client.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
  `);

  console.log('Migration 005: Added unit_system and currency columns to user_preferences');
};

export const down = async (client) => {
  await client.query('ALTER TABLE user_preferences DROP COLUMN IF EXISTS unit_system');
  await client.query('ALTER TABLE user_preferences DROP COLUMN IF EXISTS currency');

  console.log('Migration 005: Removed unit_system and currency columns from user_preferences');
};
