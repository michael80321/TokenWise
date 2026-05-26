import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    return res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

export default router;
