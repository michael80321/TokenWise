import pool from './pool';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS auth_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_otps_user ON auth_otps(user_id);`,
  `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free',
    rc_customer_id TEXT,
    rc_entitlement TEXT,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS pricing_snapshots (
    id SERIAL PRIMARY KEY,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    snapshot_id INTEGER NOT NULL REFERENCES pricing_snapshots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_per_mtok NUMERIC(12, 6) NOT NULL DEFAULT 0,
    output_per_mtok NUMERIC(12, 6) NOT NULL DEFAULT 0,
    context_window INTEGER NOT NULL,
    supports_cache BOOLEAN NOT NULL DEFAULT FALSE,
    cache_discount NUMERIC(5, 4),
    long_context_surcharge NUMERIC(12, 6),
    tool_calling BOOLEAN NOT NULL DEFAULT FALSE,
    json_mode BOOLEAN NOT NULL DEFAULT FALSE,
    mcp BOOLEAN NOT NULL DEFAULT FALSE,
    quality_score INTEGER NOT NULL DEFAULT 0,
    speed_toks INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_models_snapshot ON models(snapshot_id);`,
  `CREATE INDEX IF NOT EXISTS idx_snapshots_live ON pricing_snapshots(is_live) WHERE is_live = TRUE;`,
  `
  CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);`,
  `
  CREATE TABLE IF NOT EXISTS daily_llm_usage (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    usd_spent NUMERIC(10, 6) NOT NULL DEFAULT 0,
    call_count INTEGER NOT NULL DEFAULT 0,
    budget_exceeded BOOLEAN NOT NULL DEFAULT FALSE
  );
  `,
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      await client.query(sql);
    }
    console.log('✓ Migrations complete');

    // Seed initial data from local pricing.json if no live snapshot exists
    const { rows } = await client.query(
      `SELECT id FROM pricing_snapshots WHERE is_live = TRUE LIMIT 1`
    );

    if (rows.length === 0) {
      console.log('⟳ Seeding initial pricing data...');
      await seedInitialData(client);
    }
  } finally {
    client.release();
  }
}

async function seedInitialData(client: import('pg').PoolClient) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pricingJson = require('../../seed/pricing.json') as {
    last_updated: string;
    models: Array<{
      id: string;
      name: string;
      provider: string;
      input_per_mtok: number;
      output_per_mtok: number;
      context_window: number;
      supports_cache: boolean;
      cache_discount: number | null;
      long_context_surcharge: number | null;
      tool_calling: boolean;
      json_mode: boolean;
      mcp: boolean;
      quality_score: number;
      speed_toks: number;
      notes: string;
    }>;
  };

  const snapshotResult = await client.query(
    `INSERT INTO pricing_snapshots (published_at, is_live, notes)
     VALUES ($1, TRUE, 'Initial seed from pricing.json')
     RETURNING id`,
    [pricingJson.last_updated]
  );
  const snapshotId = snapshotResult.rows[0].id;

  for (const m of pricingJson.models) {
    await client.query(
      `INSERT INTO models (
        id, snapshot_id, name, provider,
        input_per_mtok, output_per_mtok, context_window,
        supports_cache, cache_discount, long_context_surcharge,
        tool_calling, json_mode, mcp,
        quality_score, speed_toks, notes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      ) ON CONFLICT (id) DO NOTHING`,
      [
        m.id, snapshotId, m.name, m.provider,
        m.input_per_mtok, m.output_per_mtok, m.context_window,
        m.supports_cache, m.cache_discount, m.long_context_surcharge,
        m.tool_calling, m.json_mode, m.mcp,
        m.quality_score, m.speed_toks, m.notes,
      ]
    );
  }
  console.log(`✓ Seeded ${pricingJson.models.length} models`);
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
