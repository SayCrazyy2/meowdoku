import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { getStreakData } from '@/lib/streakService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  try {
    const rawInitData = extractInitDataFromRequest(request);
    const botToken = process.env.BOT_TOKEN;

    if (!rawInitData || !botToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Telegram initData or BOT_TOKEN' },
        { status: 401 }
      );
    }

    const validated = validateTelegramInitData(rawInitData, botToken);
    if (!validated || !validated.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Telegram signature' },
        { status: 401 }
      );
    }

    const tgUser = validated.user;
    const telegramId = tgUser.id;
    const firstName = tgUser.first_name || 'Player';
    const lastName = tgUser.last_name || null;
    const username = tgUser.username || null;
    const countryCode = tgUser.language_code ? tgUser.language_code.toUpperCase() : 'US';

    // 1. Fetch or create user in MySQL
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    let user: RowDataPacket;
    let isNew = false;
    let avatarId = 1;
    let frameId = 1;
    let displayName = firstName;

    if (userRows.length === 0) {
      // New user: assign random avatar (1..9) and random frame (1..9), default display_name to firstName
      isNew = true;
      avatarId = Math.floor(Math.random() * 9) + 1;
      frameId = Math.floor(Math.random() * 9) + 1;
      displayName = firstName;

      const [insertRes] = await pool.query<ResultSetHeader>(
        `INSERT INTO users 
          (telegram_id, first_name, last_name, username, country_code, current_level, fish_balance, cat_hints, cross_hints, tutorial_completed, avatar_id, frame_id, display_name, last_active_at)
         VALUES (?, ?, ?, ?, ?, 1, 0, 3, 5, 0, ?, ?, ?, NOW())`,
        [telegramId, firstName, lastName, username, countryCode, avatarId, frameId, displayName]
      );

      const [newUserRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [insertRes.insertId]
      );
      user = newUserRows[0];
    } else {
      user = userRows[0];
      isNew = !Boolean(user.tutorial_completed);
      avatarId = user.avatar_id || Math.floor(Math.random() * 9) + 1;
      frameId = user.frame_id || Math.floor(Math.random() * 9) + 1;
      displayName = user.display_name || firstName;

      const needsProfileInit = !user.avatar_id || !user.frame_id || !user.display_name;

      if (needsProfileInit) {
        await pool.query(
          'UPDATE users SET first_name = ?, last_name = ?, username = ?, avatar_id = ?, frame_id = ?, display_name = ?, last_active_at = NOW() WHERE telegram_id = ?',
          [firstName, lastName, username, avatarId, frameId, displayName, telegramId]
        );
      } else {
        await pool.query(
          'UPDATE users SET first_name = ?, last_name = ?, username = ?, last_active_at = NOW() WHERE telegram_id = ?',
          [firstName, lastName, username, telegramId]
        );
      }
    }

    // 2. Fetch streak data dynamically (manual check-in required on streak page)
    const streakData = await getStreakData(telegramId);

    // 3. Fetch unlocked avatars and frames
    const [unlockRows] = await pool.query<RowDataPacket[]>(
      'SELECT item_type, item_id FROM user_unlocks WHERE telegram_id = ?',
      [telegramId]
    );

    const unlockedAvatars = new Set<number>([1, 2]);
    const unlockedFrames = new Set<number>([1, 2]);
    if (avatarId) unlockedAvatars.add(avatarId);
    if (frameId) unlockedFrames.add(frameId);

    for (const u of unlockRows) {
      if (u.item_type === 'avatar') unlockedAvatars.add(Number(u.item_id));
      if (u.item_type === 'frame') unlockedFrames.add(Number(u.item_id));
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        country_code: user.country_code,
        current_level: user.current_level,
        fish_balance: user.fish_balance,
        cat_hints: user.cat_hints,
        cross_hints: user.cross_hints,
        daily_streak: streakData.current_streak,
        current_streak: streakData.current_streak,
        best_streak: streakData.best_streak,
        checked_in_today: streakData.checked_in_today,
        week_days: streakData.week_days,
        is_new: isNew,
        tutorial_completed: Boolean(user.tutorial_completed),
        avatar_id: avatarId,
        frame_id: frameId,
        display_name: displayName,
        unlocked_avatars: Array.from(unlockedAvatars),
        unlocked_frames: Array.from(unlockedFrames),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/user/auth:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
