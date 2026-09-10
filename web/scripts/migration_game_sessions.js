const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const dbConfig = {
  host: process.env.DB_HOST || '163.245.208.27',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'meowdoku',
  password: process.env.DB_PASS || 'H82ejWWrxGbWmFyy',
  database: process.env.DB_NAME || 'meowdoku',
};

async function migrate() {
  console.log(`Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL successfully.');

    console.log('Creating game_sessions table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_token VARCHAR(64) NOT NULL UNIQUE,
        telegram_id BIGINT NOT NULL,
        level_number INT NOT NULL,
        is_daily_challenge TINYINT(1) DEFAULT 0,
        fish_remaining INT DEFAULT 3,
        cat_hints_used INT DEFAULT 0,
        cross_hints_used INT DEFAULT 0,
        moves_count INT DEFAULT 0,
        status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        INDEX idx_session_token (session_token),
        INDEX idx_tg_status (telegram_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('game_sessions table ready.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
