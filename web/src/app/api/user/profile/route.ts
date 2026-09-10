import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const rawInitData = extractInitDataFromRequest(request);
    const botToken = process.env.BOT_TOKEN;

    let telegramId: number | string | null = null;
    let firstName = 'Player';

    if (rawInitData && botToken) {
      const validated = validateTelegramInitData(rawInitData, botToken);
      if (validated && validated.user) {
        telegramId = validated.user.id;
        firstName = validated.user.first_name || 'Player';
      }
    }

    if (!telegramId && process.env.NODE_ENV === 'development') {
      telegramId = 7378059553;
      firstName = 'Player';
    }

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Telegram signature' },
        { status: 401 }
      );
    }
    const body = await request.json();

    let { avatar_id, frame_id, display_name } = body;

    // Validate avatar_id (1..9)
    avatar_id = Number(avatar_id);
    if (!Number.isInteger(avatar_id) || avatar_id < 1 || avatar_id > 9) {
      return NextResponse.json(
        { error: 'Invalid avatar_id: must be an integer between 1 and 9' },
        { status: 400 }
      );
    }

    // Validate frame_id (1..9)
    frame_id = Number(frame_id);
    if (!Number.isInteger(frame_id) || frame_id < 1 || frame_id > 9) {
      return NextResponse.json(
        { error: 'Invalid frame_id: must be an integer between 1 and 9' },
        { status: 400 }
      );
    }

    // Validate display_name (string 1..32 chars)
    if (typeof display_name !== 'string' || display_name.trim().length === 0) {
      display_name = firstName;
    } else {
      display_name = display_name.trim().slice(0, 32);
    }

    // Check if selected avatar and frame are unlocked (1 & 2 are free, 3..9 require purchase)
    const [unlocks] = await pool.query<RowDataPacket[]>(
      'SELECT item_type, item_id FROM user_unlocks WHERE telegram_id = ?',
      [telegramId]
    );
    const unlockedAvatars = new Set<number>([1, 2]);
    const unlockedFrames = new Set<number>([1, 2]);
    for (const u of unlocks) {
      if (u.item_type === 'avatar') unlockedAvatars.add(Number(u.item_id));
      if (u.item_type === 'frame') unlockedFrames.add(Number(u.item_id));
    }

    if (!unlockedAvatars.has(avatar_id)) {
      return NextResponse.json(
        { error: 'Selected avatar is locked. Unlock it in the Shop!' },
        { status: 403 }
      );
    }

    if (!unlockedFrames.has(frame_id)) {
      return NextResponse.json(
        { error: 'Selected frame is locked. Unlock it in the Shop!' },
        { status: 403 }
      );
    }

    // Update in MySQL
    await pool.query(
      'UPDATE users SET avatar_id = ?, frame_id = ?, display_name = ?, last_active_at = NOW() WHERE telegram_id = ?',
      [avatar_id, frame_id, display_name, telegramId]
    );

    // Fetch updated user
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, telegram_id, first_name, last_name, username, current_level, fish_balance, avatar_id, frame_id, display_name FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    const updatedUser = rows[0];

    return NextResponse.json({
      success: true,
      user: {
        avatar_id: updatedUser.avatar_id,
        frame_id: updatedUser.frame_id,
        display_name: updatedUser.display_name,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/user/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
