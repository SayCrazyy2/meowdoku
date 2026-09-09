const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load .env manually if not already present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is not defined in .env');
  process.exit(1);
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
  console.error('Failed to create MySQL pool:', e);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function callTelegram(method, body) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// 1. Handle pre_checkout_query (Required by Telegram Stars)
async function handlePreCheckoutQuery(preCheckoutQuery) {
  console.log(`[Bot] Answering pre_checkout_query id: ${preCheckoutQuery.id} from user ${preCheckoutQuery.from?.id}`);
  try {
    const result = await callTelegram('answerPreCheckoutQuery', {
      pre_checkout_query_id: preCheckoutQuery.id,
      ok: true,
    });
    console.log('[Bot] answerPreCheckoutQuery response:', result);
  } catch (err) {
    console.error('[Bot] Failed to answer pre_checkout_query:', err);
  }
}

// 2. Handle successful_payment
async function handleSuccessfulPayment(msg) {
  const payment = msg.successful_payment;
  const fromUser = msg.from;
  const telegramId = String(fromUser.id);
  console.log(`[Bot] Received successful payment from ${telegramId}:`, payment);

  let payload = {};
  try {
    payload = JSON.parse(payment.invoice_payload || '{}');
  } catch (e) {
    console.error('[Bot] Failed to parse invoice_payload:', payment.invoice_payload);
  }

  const { type, itemId, quantity = 1 } = payload;
  const targetTelegramId = payload.telegramId || telegramId;
  const chargeId = payment.telegram_payment_charge_id;
  const totalAmount = payment.total_amount;

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Log payment record
      await conn.query(
        `INSERT IGNORE INTO payments (telegram_id, payment_charge_id, item_type, item_id, amount_stars, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [targetTelegramId, chargeId, type || 'unknown', String(itemId || ''), totalAmount, JSON.stringify(payload)]
      );

      // Fulfill item based on type
      let notificationMsg = '';
      if (type === 'cat_hints') {
        await conn.query(
          `UPDATE users SET cat_hints = cat_hints + ? WHERE telegram_id = ?`,
          [quantity, targetTelegramId]
        );
        notificationMsg = `🐾 Meow! Payment received! Added ${quantity} Cat Hints to your balance. Have fun playing! 🐱`;
      } else if (type === 'cross_hints') {
        await conn.query(
          `UPDATE users SET cross_hints = cross_hints + ? WHERE telegram_id = ?`,
          [quantity, targetTelegramId]
        );
        notificationMsg = `🐾 Meow! Payment received! Added ${quantity} Cross Hints to your balance. Have fun playing! ✏️`;
      } else if (type === 'avatar') {
        const avatarId = parseInt(itemId, 10);
        await conn.query(
          `INSERT IGNORE INTO user_unlocks (telegram_id, item_type, item_id) VALUES (?, 'avatar', ?)`,
          [targetTelegramId, avatarId]
        );
        notificationMsg = `🎉 Avatar #${avatarId} unlocked! You can now equip it from your profile. 🐱✨`;
      } else if (type === 'frame') {
        const frameId = parseInt(itemId, 10);
        await conn.query(
          `INSERT IGNORE INTO user_unlocks (telegram_id, item_type, item_id) VALUES (?, 'frame', ?)`,
          [targetTelegramId, frameId]
        );
        notificationMsg = `🎉 Frame #${frameId} unlocked! You can now equip it from your profile. 🖼️✨`;
      }

      await conn.commit();
      console.log(`[Bot] Successfully fulfilled ${type} (${itemId}) for ${targetTelegramId}`);

      // Send telegram chat confirmation
      if (msg.chat?.id && notificationMsg) {
        await callTelegram('sendMessage', {
          chat_id: msg.chat.id,
          text: notificationMsg,
        }).catch(() => {});
      }
    } catch (dbErr) {
      await conn.rollback();
      console.error('[Bot] Database error fulfilling payment:', dbErr);
    } finally {
      conn.release();
    }
  } catch (poolErr) {
    console.error('[Bot] Pool connection error:', poolErr);
  }
}

// 3. Handle messages (/start, etc.)
async function handleMessage(msg) {
  if (msg.successful_payment) {
    await handleSuccessfulPayment(msg);
    return;
  }

  const text = msg.text || '';
  if (text.startsWith('/start')) {
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://t.me/meowdoku_bot/game';
    await callTelegram('sendMessage', {
      chat_id: msg.chat.id,
      text: `🐱 *Welcome to Meowdoku!*\n\nSolve adorable cat logic puzzles, complete daily challenges, maintain streaks, and climb the global leaderboard! 🏆\n\nTap below to play now!`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Meowdoku', web_app: { url: 'https://meowdoku.com' } }]
        ]
      }
    }).catch(console.error);
  }
}

// 4. Main Polling Loop
let isRunning = true;
async function startPolling() {
  console.log('[Bot] Verifying bot token...');
  try {
    const me = await callTelegram('getMe', {});
    if (!me.ok) {
      console.error('[Bot] getMe failed:', me);
      return;
    }
    console.log(`[Bot] Connected as @${me.result.username} (${me.result.first_name})`);

    // Ensure webhook is removed for long polling
    await callTelegram('deleteWebhook', { drop_pending_updates: false });
    console.log('[Bot] Webhook cleared, starting long polling...');
  } catch (e) {
    console.error('[Bot] Initialization error:', e);
  }

  let offset = 0;
  while (isRunning) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=25&allowed_updates=["message","pre_checkout_query"]`, {
        signal: AbortSignal.timeout(30000)
      });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.pre_checkout_query) {
            await handlePreCheckoutQuery(update.pre_checkout_query);
          } else if (update.message) {
            await handleMessage(update.message);
          }
        }
      } else if (!data.ok) {
        console.warn('[Bot] getUpdates error response:', data);
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      // Network timeout or temporary drop, wait 1.5s and continue
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('[Bot] Stopping polling...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Bot] Stopping polling...');
  isRunning = false;
  process.exit(0);
});

startPolling();
