import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

// GET /api/pricing — returns all models from the current live snapshot
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows: snapshots } = await pool.query(
      `SELECT id, published_at, notes
       FROM pricing_snapshots
       WHERE is_live = TRUE
       ORDER BY published_at DESC
       LIMIT 1`
    );

    if (snapshots.length === 0) {
      return res.status(503).json({ error: 'No live pricing data available.' });
    }

    const snapshot = snapshots[0];

    const { rows: models } = await pool.query(
      `SELECT
         id, name, provider,
         input_per_mtok::float, output_per_mtok::float,
         context_window, supports_cache,
         cache_discount::float, long_context_surcharge::float,
         tool_calling, json_mode, mcp,
         quality_score, speed_toks, notes
       FROM models
       WHERE snapshot_id = $1
       ORDER BY quality_score DESC`,
      [snapshot.id]
    );

    return res.json({
      last_updated: snapshot.published_at,
      snapshot_notes: snapshot.notes,
      models,
    });
  } catch (err) {
    console.error('GET /api/pricing error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/pricing/:modelId — single model detail
router.get('/:modelId', async (req: Request, res: Response) => {
  try {
    const { rows: snapshots } = await pool.query(
      `SELECT id FROM pricing_snapshots WHERE is_live = TRUE ORDER BY published_at DESC LIMIT 1`
    );
    if (snapshots.length === 0) {
      return res.status(503).json({ error: 'No live pricing data available.' });
    }

    const { rows } = await pool.query(
      `SELECT
         id, name, provider,
         input_per_mtok::float, output_per_mtok::float,
         context_window, supports_cache,
         cache_discount::float, long_context_surcharge::float,
         tool_calling, json_mode, mcp,
         quality_score, speed_toks, notes
       FROM models
       WHERE snapshot_id = $1 AND id = $2`,
      [snapshots[0].id, req.params.modelId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Model not found.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/pricing/:id error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
