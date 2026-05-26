import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CRON_SECRET = process.env.CRON_SECRET ?? 'dev-cron-secret';

function extractUserId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    return p.userId;
  } catch {
    return null;
  }
}

// POST /api/notifications/register — save push token for authenticated user
router.post('/register', async (req: Request, res: Response) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { token, platform } = req.body as { token?: string; platform?: string };
  if (!token) return res.status(400).json({ error: 'Missing push token' });

  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (token) DO UPDATE SET user_id = $1, platform = $3, updated_at = NOW()`,
      [userId, token, platform ?? 'unknown']
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('register push token:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/notifications/unregister
router.delete('/unregister', async (req: Request, res: Response) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'Missing token' });

  await pool.query(`DELETE FROM push_tokens WHERE user_id = $1 AND token = $2`, [userId, token]);
  return res.json({ ok: true });
});

// POST /api/cron/check-prices — called by Railway Cron or external scheduler
// Protected by CRON_SECRET header
router.post('/cron/check-prices', async (req: Request, res: Response) => {
  if (req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get latest two live snapshots
    const { rows: snapshots } = await pool.query(
      `SELECT id, published_at FROM pricing_snapshots
       WHERE is_live = TRUE
       ORDER BY published_at DESC LIMIT 2`
    );

    if (snapshots.length < 2) {
      return res.json({ ok: true, message: 'Not enough snapshots to compare' });
    }

    const [latest, previous] = snapshots;

    // Compare models across the two snapshots
    const { rows: changes } = await pool.query(
      `SELECT
         n.name,
         n.input_per_mtok AS new_input,
         n.output_per_mtok AS new_output,
         o.input_per_mtok AS old_input,
         o.output_per_mtok AS old_output
       FROM models n
       JOIN models o ON o.id = n.id AND o.snapshot_id = $2
       WHERE n.snapshot_id = $1
         AND (
           ABS(n.input_per_mtok - o.input_per_mtok) > 0.001 OR
           ABS(n.output_per_mtok - o.output_per_mtok) > 0.001
         )`,
      [latest.id, previous.id]
    );

    if (changes.length === 0) {
      return res.json({ ok: true, message: 'No pricing changes detected' });
    }

    // Build notification message
    const lines = changes.map((c) => {
      const inputDir = c.new_input < c.old_input ? '↓' : '↑';
      return `${c.name} Input ${inputDir}$${c.new_input}/MTok`;
    });
    const body = lines.slice(0, 3).join('、') + (lines.length > 3 ? ` 等 ${lines.length} 項` : '');

    // Get all push tokens
    const { rows: tokens } = await pool.query(`SELECT token FROM push_tokens LIMIT 500`);
    if (tokens.length === 0) {
      return res.json({ ok: true, message: 'Changes detected but no push tokens', changes: changes.length });
    }

    // Send via Expo Push API (batches of 100)
    const messages = tokens.map(({ token }) => ({
      to: token,
      title: '✦ TokenWise — 價格異動',
      body,
      data: { type: 'price_change' },
      sound: 'default',
    }));

    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
    }

    return res.json({ ok: true, changes: changes.length, notified: tokens.length });
  } catch (err) {
    console.error('cron check-prices error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
