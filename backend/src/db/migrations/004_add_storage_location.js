// Migration 004: Add Storage Location
// Adds storage_location column to groceries and default_storage_location to grocery_suggestions

export const up = async (client) => {
  // Add storage_location column to groceries table
  await client.query(`
    ALTER TABLE groceries
    ADD COLUMN IF NOT EXISTS storage_location VARCHAR(20) DEFAULT 'pantry';
  `);

  // Add default_storage_location column to grocery_suggestions table
  await client.query(`
    ALTER TABLE grocery_suggestions
    ADD COLUMN IF NOT EXISTS default_storage_location VARCHAR(20);
  `);

  // Update existing grocery_suggestions with default storage locations based on category
  await client.query(`
    UPDATE grocery_suggestions
    SET default_storage_location = CASE
      WHEN LOWER(category) IN ('dairy', 'meat', 'produce', 'beverages') THEN 'fridge'
      WHEN LOWER(category) = 'frozen' THEN 'freezer'
      ELSE 'pantry'
    END
    WHERE default_storage_location IS NULL;
  `);

  // Update existing groceries with storage locations based on category (only for NULL values)
  await client.query(`
    UPDATE groceries
    SET storage_location = CASE
      WHEN LOWER(category) IN ('dairy', 'meat', 'produce', 'beverages') THEN 'fridge'
      WHEN LOWER(category) = 'frozen' THEN 'freezer'
      ELSE 'pantry'
    END
    WHERE storage_location IS NULL;
  `);

  console.log('Migration 004: Added storage_location columns');
};

export const down = async (client) => {
  await client.query('ALTER TABLE groceries DROP COLUMN IF EXISTS storage_location');
  await client.query('ALTER TABLE grocery_suggestions DROP COLUMN IF EXISTS default_storage_location');

  console.log('Migration 004: Removed storage_location columns');
};
