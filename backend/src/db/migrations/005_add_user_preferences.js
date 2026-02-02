// Migration 005: Add Unit System and Currency Preferences
// Adds unit_system and currency columns to user_preferences table

export const up = async (client) => {
  // Add unit_system column with CHECK constraint
  await client.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS unit_system VARCHAR(10) DEFAULT 'metric';
  `);

  // Add CHECK constraint for unit_system (if not exists)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_unit_system_check'
      ) THEN
        ALTER TABLE user_preferences
        ADD CONSTRAINT user_preferences_unit_system_check
        CHECK (unit_system IN ('metric', 'imperial'));
      END IF;
    END $$;
  `);

  // Add currency column with CHECK constraint
  await client.query(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
  `);

  // Add CHECK constraint for currency (if not exists)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_currency_check'
      ) THEN
        ALTER TABLE user_preferences
        ADD CONSTRAINT user_preferences_currency_check
        CHECK (currency IN ('USD', 'EUR', 'GBP', 'SEK', 'CAD', 'AUD', 'JPY', 'CHF', 'NOK', 'DKK'));
      END IF;
    END $$;
  `);

  console.log('Migration 005: Added unit_system and currency columns with CHECK constraints to user_preferences');
};

export const down = async (client) => {
  // WARNING: This will permanently delete all unit_system and currency preferences
  await client.query('ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_unit_system_check');
  await client.query('ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_currency_check');
  await client.query('ALTER TABLE user_preferences DROP COLUMN IF EXISTS unit_system');
  await client.query('ALTER TABLE user_preferences DROP COLUMN IF EXISTS currency');

  console.log('Migration 005: Removed unit_system and currency columns from user_preferences');
};
