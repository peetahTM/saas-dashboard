import pool from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async (direction = 'up') => {
  const client = await pool.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    if (direction === 'up') {
      // Get already executed migrations
      const { rows: executed } = await client.query('SELECT name FROM _migrations');
      const executedNames = new Set(executed.map(r => r.name));

      // Run pending migrations
      for (const file of migrationFiles) {
        if (executedNames.has(file)) {
          console.log(`Skipping ${file} (already executed)`);
          continue;
        }

        console.log(`Running migration: ${file}`);
        const migration = await import(`./migrations/${file}`);

        await client.query('BEGIN');
        try {
          await migration.up(client);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Completed: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Failed: ${file}`, error.message);
          throw error;
        }
      }

      console.log('\nAll migrations completed successfully!');
    } else if (direction === 'down') {
      // Get the last executed migration
      const { rows } = await client.query(
        'SELECT name FROM _migrations ORDER BY executed_at DESC LIMIT 1'
      );

      if (rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      const lastMigration = rows[0].name;
      console.log(`Rolling back: ${lastMigration}`);

      const migration = await import(`./migrations/${lastMigration}`);

      await client.query('BEGIN');
      try {
        await migration.down(client);
        await client.query('DELETE FROM _migrations WHERE name = $1', [lastMigration]);
        await client.query('COMMIT');
        console.log(`Rolled back: ${lastMigration}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Rollback failed: ${lastMigration}`, error.message);
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
};

// Run migration if this file is executed directly
const args = process.argv.slice(2);
const direction = args.includes('--down') || args.includes('down') ? 'down' : 'up';

migrate(direction)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export default migrate;
