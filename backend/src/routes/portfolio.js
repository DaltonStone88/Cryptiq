import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ────────────────────────────────────────────
// GET /api/portfolio — User's portfolio overview
// ────────────────────────────────────────────
router.get("/", requireAuth, async (req, res, next) => {
  try {
    // Get active assignments with their bots and connections
    const assignments = await query(
      `SELECT a.id, a.coin_symbol, a.status, a.max_allocation_pct,
              a.total_trades, a.realized_pnl, a.last_trade_at,
              b.name AS bot_name, b.strategy_type,
              e.exchange AS exchange_name,
              w.wallet_type
       FROM bot_assignments a
       JOIN bots b ON b.id = a.bot_id
       LEFT JOIN exchange_connections e ON e.id = a.exchange_connection_id
       LEFT JOIN wallet_connections w ON w.id = a.wallet_connection_id
       WHERE a.user_id = $1
       ORDER BY a.coin_symbol`,
      [req.user.id]
    );

    // Get active subscriptions
    const subs = await query(
      `SELECT s.id, s.status, s.price_at_sub, s.current_period_end,
              b.name AS bot_name, b.id AS bot_id
       FROM subscriptions s
       JOIN bots b ON b.id = s.bot_id
       WHERE s.user_id = $1 AND s.status = 'active'`,
      [req.user.id]
    );

    // Get recent trades
    const trades = await query(
      `SELECT t.side, t.coin_symbol, t.pair, t.quantity, t.price,
              t.total_value, t.status, t.signal_reason, t.executed_at,
              b.name AS bot_name
       FROM trades t
       JOIN bots b ON b.id = t.bot_id
       WHERE t.user_id = $1
       ORDER BY t.executed_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({
      assignments: assignments.rows,
      subscriptions: subs.rows,
      recent_trades: trades.rows,
      stats: {
        active_bots: assignments.rows.filter(a => a.status === "active").length,
        total_trades: assignments.rows.reduce((sum, a) => sum + (a.total_trades || 0), 0),
        total_realized_pnl: assignments.rows.reduce((sum, a) => sum + parseFloat(a.realized_pnl || 0), 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// GET /api/portfolio/history — Portfolio value over time
// ────────────────────────────────────────────
router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;

    let interval;
    switch (period) {
      case "7d": interval = "7 days"; break;
      case "30d": interval = "30 days"; break;
      case "90d": interval = "90 days"; break;
      case "1y": interval = "1 year"; break;
      default: interval = "30 days";
    }

    const result = await query(
      `SELECT total_value_usd, holdings, snapshot_at
       FROM portfolio_snapshots
       WHERE user_id = $1 AND snapshot_at > NOW() - INTERVAL '${interval}'
       ORDER BY snapshot_at ASC`,
      [req.user.id]
    );

    res.json({ snapshots: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
