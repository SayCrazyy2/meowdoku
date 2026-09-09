const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '163.245.208.27',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'meowdoku',
    password: process.env.DB_PASS || 'H82ejWWrxGbWmFyy',
    database: process.env.DB_NAME || 'meowdoku',
  });

  console.log('Connected to MySQL database.');

  // 1. Create shop_bundles table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS shop_bundles (
      id VARCHAR(32) PRIMARY KEY,
      item_type VARCHAR(32) NOT NULL,
      quantity INT NOT NULL,
      price_stars INT NOT NULL,
      discount_percent INT NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('shop_bundles table ensured.');

  // Insert or update initial bundles
  const bundles = [
    { id: 'cat_hints_5', item_type: 'cat_hints', quantity: 5, price_stars: 10, discount_percent: 0 },
    { id: 'cat_hints_10', item_type: 'cat_hints', quantity: 10, price_stars: 18, discount_percent: 10 },
    { id: 'cat_hints_20', item_type: 'cat_hints', quantity: 20, price_stars: 32, discount_percent: 20 },
    { id: 'cross_hints_5', item_type: 'cross_hints', quantity: 5, price_stars: 8, discount_percent: 0 },
    { id: 'cross_hints_10', item_type: 'cross_hints', quantity: 10, price_stars: 14, discount_percent: 12 },
    { id: 'cross_hints_20', item_type: 'cross_hints', quantity: 20, price_stars: 25, discount_percent: 22 },
  ];

  for (const b of bundles) {
    await conn.query(`
      INSERT INTO shop_bundles (id, item_type, quantity, price_stars, discount_percent, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        quantity = VALUES(quantity),
        price_stars = VALUES(price_stars),
        discount_percent = VALUES(discount_percent),
        is_active = TRUE;
    `, [b.id, b.item_type, b.quantity, b.price_stars, b.discount_percent]);
  }
  console.log('Initial shop bundles populated.');

  // 2. Create user_unlocks table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_unlocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      telegram_id VARCHAR(64) NOT NULL,
      item_type ENUM('avatar', 'frame') NOT NULL,
      item_id INT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_unlock (telegram_id, item_type, item_id),
      INDEX idx_user_unlocks (telegram_id, item_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('user_unlocks table ensured.');

  // Automatically unlock current starter avatars and frames for existing users
  await conn.query(`
    INSERT IGNORE INTO user_unlocks (telegram_id, item_type, item_id)
    SELECT telegram_id, 'avatar', avatar_id FROM users WHERE avatar_id IS NOT NULL AND avatar_id > 2;
  `);
  await conn.query(`
    INSERT IGNORE INTO user_unlocks (telegram_id, item_type, item_id)
    SELECT telegram_id, 'frame', frame_id FROM users WHERE frame_id IS NOT NULL AND frame_id > 2;
  `);
  console.log('Existing starter avatars and frames preserved in user_unlocks.');

  // 3. Create payments table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      telegram_id VARCHAR(64) NOT NULL,
      payment_charge_id VARCHAR(128) UNIQUE NOT NULL,
      item_type VARCHAR(32) NOT NULL,
      item_id VARCHAR(32) NULL,
      amount_stars INT NOT NULL,
      payload TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payments_user (telegram_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('payments table ensured.');

  await conn.end();
  console.log('Migration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
