const { WebSocketServer } = require('ws');
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
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
};

let pool;
try {
  pool = mysql.createPool(dbConfig);
} catch (e) {
  console.error('[WS] Failed to create MySQL pool:', e);
}

function startWsServer(port = parseInt(process.env.WS_PORT || '3001', 10)) {
  const wss = new WebSocketServer({ port });
  console.log(`[WS] Game WebSocket Server listening on port ${port}`);

  wss.on('connection', (ws) => {
    let currentSessionToken = null;
    let currentTelegramId = null;

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'INIT') {
          currentSessionToken = msg.sessionToken;
          currentTelegramId = msg.telegramId;
          
          if (currentSessionToken && pool) {
            const [rows] = await pool.query(
              'SELECT id, level_number, status FROM game_sessions WHERE session_token = ? LIMIT 1',
              [currentSessionToken]
            );
            if (rows.length > 0 && rows[0].status === 'active') {
              ws.send(JSON.stringify({ type: 'INIT_ACK', success: true, level_number: rows[0].level_number }));
              return;
            }
          }
          ws.send(JSON.stringify({ type: 'INIT_ACK', success: false }));
          return;
        }

        if (!currentSessionToken || !pool) return;

        if (msg.type === 'CELL_ACTION') {
          // Increment moves_count in active game_session
          await pool.query(
            'UPDATE game_sessions SET moves_count = moves_count + 1 WHERE session_token = ? AND status = "active"',
            [currentSessionToken]
          ).catch(() => {});
        } else if (msg.type === 'LOSE_FISH') {
          const fish = Math.max(0, Math.min(3, parseInt(msg.fishRemaining ?? 3, 10)));
          await pool.query(
            'UPDATE game_sessions SET fish_remaining = ? WHERE session_token = ? AND status = "active"',
            [fish, currentSessionToken]
          ).catch(() => {});
        } else if (msg.type === 'HINT_USED') {
          if (msg.hintType === 'cat') {
            await pool.query(
              'UPDATE game_sessions SET cat_hints_used = cat_hints_used + 1 WHERE session_token = ? AND status = "active"',
              [currentSessionToken]
            ).catch(() => {});
          } else if (msg.hintType === 'cross') {
            await pool.query(
              'UPDATE game_sessions SET cross_hints_used = cross_hints_used + 1 WHERE session_token = ? AND status = "active"',
              [currentSessionToken]
            ).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[WS] Message handling error:', err);
      }
    });

    ws.on('error', (err) => {
      console.warn('[WS] Client socket error:', err.message);
    });
  });

  return wss;
}

// If run directly via node scripts/wsServer.js
if (require.main === module) {
  startWsServer();
}

module.exports = { startWsServer };
