import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import pool from '../db/pool';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const OTP_EXPIRY_MINUTES = 10;
const IS_DEV = process.env.NODE_ENV !== 'production';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/request-otp
router.post('/request-otp', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '請輸入有效的 Email 地址' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Upsert user
    const { rows } = await pool.query(
      `INSERT INTO users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [normalizedEmail]
    );
    const userId: string = rows[0].id;

    // Invalidate previous OTPs
    await pool.query(
      `UPDATE auth_otps SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [userId]
    );

    // Create new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await pool.query(
      `INSERT INTO auth_otps (user_id, code, expires_at) VALUES ($1, $2, $3)`,
      [userId, code, expiresAt]
    );

    if (IS_DEV) {
      // In dev: log OTP to console, skip email, return code in response for easy testing
      console.log(`[DEV] OTP for ${normalizedEmail}: ${code}`);
      return res.json({ ok: true, message: '[DEV] 驗證碼已產生', dev_otp: code });
    } else {
      await resend.emails.send({
        // Use Resend's shared sandbox sender — works without domain verification.
        // Switch to noreply@tokenwise.app after verifying your domain in Resend.
        from: 'TokenWise <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: `TokenWise 登入驗證碼：${code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #C9A86A;">TokenWise</h2>
            <p>你的登入驗證碼是：</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2B2B2B; padding: 16px 0;">
              ${code}
            </div>
            <p style="color: #9B9490; font-size: 14px;">
              此驗證碼 ${OTP_EXPIRY_MINUTES} 分鐘內有效。如果不是你本人操作，請忽略此信。
            </p>
          </div>
        `,
      });
    }

    return res.json({ ok: true, message: '驗證碼已發送，請查看你的信箱' });
  } catch (err) {
    console.error('request-otp error:', err);
    return res.status(500).json({ error: '發送失敗，請稍後再試' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    return res.status(400).json({ error: '缺少 Email 或驗證碼' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    if (userRows.length === 0) {
      return res.status(401).json({ error: '驗證碼錯誤或已過期' });
    }
    const userId: string = userRows[0].id;

    const { rows: otpRows } = await pool.query(
      `SELECT id FROM auth_otps
       WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    );
    if (otpRows.length === 0) {
      return res.status(401).json({ error: '驗證碼錯誤或已過期' });
    }

    // Mark OTP used + update last login
    await pool.query(`UPDATE auth_otps SET used = TRUE WHERE id = $1`, [otpRows[0].id]);
    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);

    // Upsert subscription (defaults to free)
    await pool.query(
      `INSERT INTO subscriptions (user_id, tier) VALUES ($1, 'free')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Issue JWT (24h)
    const token = jwt.sign({ userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ ok: true, token });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: '驗證失敗，請稍後再試' });
  }
});

// GET /auth/me — validate token + return subscription tier
router.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string; email: string };

    const { rows } = await pool.query(
      `SELECT u.email, s.tier, s.valid_until
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [payload.userId]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const { email, tier, valid_until } = rows[0];
    const isPro = tier === 'pro' && (!valid_until || new Date(valid_until) > new Date());

    return res.json({ userId: payload.userId, email, tier: isPro ? 'pro' : 'free' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /auth/webhook/revenuecat — RevenueCat webhook to sync subscription status
router.post('/webhook/revenuecat', async (req: Request, res: Response) => {
  const secret = req.headers['x-revenuecat-secret'];
  if (secret !== process.env.RC_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { event } = req.body as {
      event?: {
        type: string;
        app_user_id: string;
        expiration_at_ms?: number;
        entitlement_ids?: string[];
      };
    };
    if (!event) return res.status(400).json({ error: 'Missing event' });

    const { type, app_user_id, expiration_at_ms, entitlement_ids } = event;
    const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'].includes(type);
    const tier = isActive ? 'pro' : 'free';
    const validUntil = expiration_at_ms ? new Date(expiration_at_ms) : null;

    await pool.query(
      `UPDATE subscriptions
       SET tier = $1, valid_until = $2, rc_customer_id = $3,
           rc_entitlement = $4, updated_at = NOW()
       WHERE user_id = (SELECT id FROM users WHERE rc_customer_id = $3)`,
      [tier, validUntil, app_user_id, entitlement_ids?.[0] ?? null]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('RC webhook error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
