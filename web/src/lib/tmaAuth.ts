import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ValidatedInitData {
  user: TelegramUser;
  auth_date: number;
  query_id?: string;
  hash: string;
}

/**
 * Validates Telegram Mini App initData string against Telegram Bot Token
 * using standard HMAC-SHA256 as documented in Telegram Bot API.
 */
export function validateTelegramInitData(
  initDataRaw: string,
  botToken: string
): ValidatedInitData | null {
  if (!initDataRaw || !botToken) return null;

  try {
    const urlParams = new URLSearchParams(initDataRaw);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    // Filter out 'hash' parameter and sort remaining parameters alphabetically
    const keys: string[] = [];
    urlParams.forEach((_, key) => {
      if (key !== 'hash') {
        keys.push(key);
      }
    });
    keys.sort();

    const dataCheckString = keys
      .map((key) => `${key}=${urlParams.get(key)}`)
      .join('\n');

    // secret_key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // calculated_hash = hex(HMAC_SHA256(secretKey, dataCheckString))
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash.toLowerCase() !== hash.toLowerCase()) {
      return null;
    }

    const userJson = urlParams.get('user');
    if (!userJson) return null;

    const user: TelegramUser = JSON.parse(userJson);
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);

    return {
      user,
      auth_date: authDate,
      query_id: urlParams.get('query_id') || undefined,
      hash,
    };
  } catch (err) {
    console.error('Error validating Telegram initData:', err);
    return null;
  }
}

/**
 * Extracts Bearer token (initData) from request Authorization header
 */
export function extractInitDataFromRequest(request: Request): string | null {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}
