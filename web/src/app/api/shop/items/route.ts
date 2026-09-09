import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const rawInitData = extractInitDataFromRequest(request);
    const botToken = process.env.BOT_TOKEN;

    let telegramId: number | string | null = null;

    if (rawInitData && botToken) {
      const validated = validateTelegramInitData(rawInitData, botToken);
      if (validated && validated.user) {
        telegramId = String(validated.user.id);
      }
    }

    if (!telegramId && process.env.NODE_ENV === 'development') {
      telegramId = '7378059553';
    }

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Telegram signature' },
        { status: 401 }
      );
    }

    // 1. Fetch active shop bundles
    const [bundleRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, item_type, quantity, price_stars, discount_percent 
       FROM shop_bundles 
       WHERE is_active = TRUE 
       ORDER BY item_type ASC, quantity ASC`
    );

    // 2. Fetch user unlocked avatars & frames
    const [unlockRows] = await pool.query<RowDataPacket[]>(
      `SELECT item_type, item_id FROM user_unlocks WHERE telegram_id = ?`,
      [telegramId]
    );

    const unlockedAvatars = new Set<number>([1, 2]);
    const unlockedFrames = new Set<number>([1, 2]);

    for (const u of unlockRows) {
      if (u.item_type === 'avatar') {
        unlockedAvatars.add(Number(u.item_id));
      } else if (u.item_type === 'frame') {
        unlockedFrames.add(Number(u.item_id));
      }
    }

    return NextResponse.json({
      success: true,
      bundles: bundleRows,
      unlocked_avatars: Array.from(unlockedAvatars),
      unlocked_frames: Array.from(unlockedFrames),
      avatar_price_stars: 15,
      frame_price_stars: 15,
    });
  } catch (err: any) {
    console.error('Error fetching shop items:', err);
    return NextResponse.json(
      { error: 'Internal server error fetching shop items' },
      { status: 500 }
    );
  }
}
