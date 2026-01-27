// Migration 002: Add Constraints
// Adds unique constraint on meal_plans table

export const up = async (client) => {
  // Check if the constraint already exists
  const constraintCheck = await client.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'meal_plans'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'meal_plans_user_id_week_start_key'
  `);

  if (constraintCheck.rows.length === 0) {
    await client.query(`
      ALTER TABLE meal_plans
      ADD CONSTRAINT meal_plans_user_id_week_start_key
      UNIQUE (user_id, week_start)
    `);
    console.log('Migration 002: Added unique constraint on meal_plans(user_id, week_start)');
  } else {
    console.log('Migration 002: Constraint already exists, skipping');
  }
};

export const down = async (client) => {
  await client.query(`
    ALTER TABLE meal_plans
    DROP CONSTRAINT IF EXISTS meal_plans_user_id_week_start_key
  `);
  console.log('Migration 002: Dropped unique constraint');
};
