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

async function initDB() {
  console.log(`Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}, DB: ${dbConfig.database}...`);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL successfully.');

    // 1. Users table
    console.log('Creating users table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL UNIQUE,
        first_name VARCHAR(128) NOT NULL,
        last_name VARCHAR(128) NULL,
        username VARCHAR(128) NULL,
        country_code VARCHAR(16) DEFAULT 'US',
        current_level INT NOT NULL DEFAULT 1,
        fish_balance INT NOT NULL DEFAULT 0,
        cat_hints INT NOT NULL DEFAULT 3,
        cross_hints INT NOT NULL DEFAULT 5,
        daily_streak INT NOT NULL DEFAULT 1,
        tutorial_completed TINYINT(1) NOT NULL DEFAULT 0,
        last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fish (fish_balance DESC),
        INDEX idx_level (current_level DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Game logs table
    console.log('Creating game_logs table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS game_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        level_number INT NOT NULL,
        attempts INT NOT NULL DEFAULT 1,
        fish_remaining INT NOT NULL DEFAULT 3,
        cat_hints_used INT NOT NULL DEFAULT 0,
        cross_hints_used INT NOT NULL DEFAULT 0,
        completed TINYINT(1) NOT NULL DEFAULT 0,
        duration_seconds INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_level (telegram_id, level_number),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Daily checkins table
    console.log('Creating checkins table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        checkin_date DATE NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_date (telegram_id, checkin_date),
        INDEX idx_user_date (telegram_id, checkin_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('All tables created and verified successfully in MySQL!');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDB();
