// Migration 003: Receipt Scans Table
// Stores receipt scan history and parsed items

export const up = async (client) => {
  // Receipt scans table
  await client.query(`
    CREATE TABLE IF NOT EXISTS receipt_scans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      image_url VARCHAR(500),
      raw_ocr_text TEXT,
      parsed_items JSONB DEFAULT '[]',
      status VARCHAR(50) DEFAULT 'pending',
      confidence DECIMAL(5, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index for faster user queries
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_receipt_scans_user_id ON receipt_scans(user_id);
  `);

  // Create index for status queries
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_receipt_scans_status ON receipt_scans(status);
  `);

  console.log('Migration 003: Created receipt_scans table');
};

export const down = async (client) => {
  await client.query('DROP INDEX IF EXISTS idx_receipt_scans_status');
  await client.query('DROP INDEX IF EXISTS idx_receipt_scans_user_id');
  await client.query('DROP TABLE IF EXISTS receipt_scans CASCADE');

  console.log('Migration 003: Dropped receipt_scans table');
};
