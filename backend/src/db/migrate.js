import "dotenv/config";
import { query } from "./pool.js";

const migration = `

-- ============================================================
-- CRYPTIQ DATABASE SCHEMA
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'developer', 'admin')),
  avatar_url      TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ────────────────────────────────────────────────────────────
-- 2. EXCHANGE CONNECTIONS
--    Stores encrypted API keys for CEX trading
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange        VARCHAR(50) NOT NULL,
  api_key_enc     TEXT NOT NULL,
  api_secret_enc  TEXT NOT NULL,
  passphrase_enc  TEXT,
  label           VARCHAR(100),
  permissions     JSONB DEFAULT '["read", "trade"]',
  is_active       BOOLEAN DEFAULT TRUE,
  last_verified   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exchange, label)
);

CREATE INDEX IF NOT EXISTS idx_exchange_conn_user ON exchange_connections(user_id);

-- ────────────────────────────────────────────────────────────
-- 3. WALLET CONNECTIONS
--    Stores wallet addresses for on-chain trading
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_type     VARCHAR(50) NOT NULL,
  address         VARCHAR(255) NOT NULL,
  chains          JSONB DEFAULT '[]',
  label           VARCHAR(100),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_wallet_conn_user ON wallet_connections(user_id);

-- ────────────────────────────────────────────────────────────
-- 4. BOTS (Marketplace Algorithms)
--    Published by developers, subscribed to by users
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  description     TEXT,
  long_description TEXT,
  strategy_type   VARCHAR(50) NOT NULL
                    CHECK (strategy_type IN (
                      'sentiment', 'technical', 'on-chain',
                      'grid', 'dca', 'ai-ml', 'arbitrage', 'other'
                    )),
  risk_level      VARCHAR(20) NOT NULL DEFAULT 'medium'
                    CHECK (risk_level IN ('low', 'medium', 'high')),
  supported_coins JSONB DEFAULT '[]',
  supported_exchanges JSONB DEFAULT '[]',
  price_monthly   DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_published    BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  version         VARCHAR(20) DEFAULT '1.0.0',

  -- Performance metrics (updated periodically)
  pnl_90d         DECIMAL(10,2),
  win_rate        DECIMAL(5,2),
  total_trades    INTEGER DEFAULT 0,
  avg_trade_duration_min INTEGER,

  -- Social
  subscriber_count INTEGER DEFAULT 0,
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,

  -- Webhook endpoint where the bot sends signals
  webhook_url     TEXT,
  api_key_hash    VARCHAR(255),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bots_developer ON bots(developer_id);
CREATE INDEX IF NOT EXISTS idx_bots_strategy ON bots(strategy_type);
CREATE INDEX IF NOT EXISTS idx_bots_published ON bots(is_published, is_active);

-- ────────────────────────────────────────────────────────────
-- 5. BOT REVIEWS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id          UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bot_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_bot ON bot_reviews(bot_id);

-- ────────────────────────────────────────────────────────────
-- 6. SUBSCRIPTIONS
--    User subscribes to a bot (monthly billing)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_id          UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  price_at_sub    DECIMAL(10,2) NOT NULL,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end   TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  payment_method  VARCHAR(50),
  external_sub_id VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bot_id)
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_bot ON subscriptions(bot_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);

-- ────────────────────────────────────────────────────────────
-- 7. BOT ASSIGNMENTS
--    The modular piece: user assigns a subscribed bot to a
--    specific coin on a specific exchange or wallet
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  bot_id          UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,

  -- What coin and where
  coin_symbol     VARCHAR(20) NOT NULL,
  exchange_connection_id UUID REFERENCES exchange_connections(id) ON DELETE SET NULL,
  wallet_connection_id   UUID REFERENCES wallet_connections(id) ON DELETE SET NULL,

  -- Configuration
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'stopped', 'error')),
  config          JSONB DEFAULT '{}',
  max_allocation_pct DECIMAL(5,2) DEFAULT 25.00,
  risk_override   VARCHAR(20)
                    CHECK (risk_override IN ('low', 'medium', 'high', NULL)),

  -- Runtime state
  last_signal_at  TIMESTAMPTZ,
  last_trade_at   TIMESTAMPTZ,
  total_trades    INTEGER DEFAULT 0,
  realized_pnl    DECIMAL(12,2) DEFAULT 0,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- One bot per coin per exchange/wallet per user
  UNIQUE(user_id, bot_id, coin_symbol, exchange_connection_id),
  UNIQUE(user_id, bot_id, coin_symbol, wallet_connection_id),

  -- Must have either exchange or wallet, not both
  CHECK (
    (exchange_connection_id IS NOT NULL AND wallet_connection_id IS NULL) OR
    (exchange_connection_id IS NULL AND wallet_connection_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_assignments_user ON bot_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON bot_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_bot ON bot_assignments(bot_id);

-- ────────────────────────────────────────────────────────────
-- 8. TRADES
--    Every trade executed by a bot assignment
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES bot_assignments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_id          UUID NOT NULL REFERENCES bots(id),

  -- Trade details
  side            VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  coin_symbol     VARCHAR(20) NOT NULL,
  pair            VARCHAR(30) NOT NULL,
  quantity        DECIMAL(18,8) NOT NULL,
  price           DECIMAL(18,8) NOT NULL,
  total_value     DECIMAL(18,2) NOT NULL,
  fee             DECIMAL(18,8) DEFAULT 0,

  -- Execution
  exchange        VARCHAR(50),
  order_type      VARCHAR(20) DEFAULT 'market'
                    CHECK (order_type IN ('market', 'limit', 'stop')),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'failed')),
  external_order_id VARCHAR(255),

  -- Signal info
  signal_reason   TEXT,
  confidence      DECIMAL(5,2),

  executed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_assignment ON trades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed ON trades(executed_at);

-- ────────────────────────────────────────────────────────────
-- 9. PORTFOLIO SNAPSHOTS
--    Periodic snapshots for charting portfolio value over time
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_value_usd DECIMAL(18,2) NOT NULL,
  holdings        JSONB NOT NULL DEFAULT '[]',
  snapshot_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_time ON portfolio_snapshots(user_id, snapshot_at DESC);

-- ────────────────────────────────────────────────────────────
-- 10. USER SETTINGS
--     Key-value preferences per user
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_push    BOOLEAN DEFAULT TRUE,
  notifications_email   BOOLEAN DEFAULT TRUE,
  two_factor_enabled    BOOLEAN DEFAULT FALSE,
  auto_trade_enabled    BOOLEAN DEFAULT TRUE,
  paper_trading_mode    BOOLEAN DEFAULT FALSE,
  default_risk_level    VARCHAR(20) DEFAULT 'medium'
                          CHECK (default_risk_level IN ('low', 'medium', 'high')),
  max_allocation_pct    DECIMAL(5,2) DEFAULT 25.00,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users', 'exchange_connections', 'wallet_connections',
      'bots', 'bot_reviews', 'subscriptions', 'bot_assignments',
      'user_settings'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trigger_updated_at ON %I; CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

`;

async function migrate() {
  console.log("Running Cryptiq database migration...\n");
  try {
    await query(migration);
    console.log("✓ Migration completed successfully.");
    console.log("  Tables created:");
    console.log("    - users");
    console.log("    - exchange_connections");
    console.log("    - wallet_connections");
    console.log("    - bots");
    console.log("    - bot_reviews");
    console.log("    - subscriptions");
    console.log("    - bot_assignments");
    console.log("    - trades");
    console.log("    - portfolio_snapshots");
    console.log("    - user_settings");
    process.exit(0);
  } catch (err) {
    console.error("✗ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
