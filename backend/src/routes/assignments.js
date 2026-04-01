import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ────────────────────────────────────────────
// GET /api/assignments — List user's bot assignments
// ────────────────────────────────────────────
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, b.name AS bot_name, b.strategy_type,
              b.risk_level AS bot_risk_level,
              e.exchange AS exchange_name,
              w.wallet_type, w.address AS wallet_address
       FROM bot_assignments a
       JOIN bots b ON b.id = a.bot_id
       LEFT JOIN exchange_connections e ON e.id = a.exchange_connection_id
       LEFT JOIN wallet_connections w ON w.id = a.wallet_connection_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json({ assignments: result.rows });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// POST /api/assignments — Assign a bot to a coin
// ────────────────────────────────────────────
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      bot_id, coin_symbol,
      exchange_connection_id, wallet_connection_id,
      max_allocation_pct, config
    } = req.body;

    if (!bot_id || !coin_symbol) {
      return res.status(400).json({ error: "bot_id and coin_symbol are required" });
    }
    if (!exchange_connection_id && !wallet_connection_id) {
      return res.status(400).json({ error: "Must provide either exchange_connection_id or wallet_connection_id" });
    }
    if (exchange_connection_id && wallet_connection_id) {
      return res.status(400).json({ error: "Cannot assign to both exchange and wallet" });
    }

    // Verify active subscription
    const sub = await query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND bot_id = $2 AND status = 'active'",
      [req.user.id, bot_id]
    );
    if (sub.rows.length === 0) {
      return res.status(403).json({ error: "Active subscription required for this bot" });
    }

    // Verify the connection belongs to this user
    if (exchange_connection_id) {
      const conn = await query(
        "SELECT id FROM exchange_connections WHERE id = $1 AND user_id = $2 AND is_active = true",
        [exchange_connection_id, req.user.id]
      );
      if (conn.rows.length === 0) {
        return res.status(404).json({ error: "Exchange connection not found" });
      }
    }
    if (wallet_connection_id) {
      const conn = await query(
        "SELECT id FROM wallet_connections WHERE id = $1 AND user_id = $2 AND is_active = true",
        [wallet_connection_id, req.user.id]
      );
      if (conn.rows.length === 0) {
        return res.status(404).json({ error: "Wallet connection not found" });
      }
    }

    const result = await query(
      `INSERT INTO bot_assignments
        (user_id, subscription_id, bot_id, coin_symbol,
         exchange_connection_id, wallet_connection_id,
         max_allocation_pct, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id, sub.rows[0].id, bot_id,
        coin_symbol.toUpperCase(),
        exchange_connection_id || null,
        wallet_connection_id || null,
        max_allocation_pct || 25,
        config || {},
      ]
    );

    res.status(201).json({ assignment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// PATCH /api/assignments/:id/status — Pause/resume/stop
// ────────────────────────────────────────────
router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["active", "paused", "stopped"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    const result = await query(
      `UPDATE bot_assignments SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ assignment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// PATCH /api/assignments/:id — Update config
// ────────────────────────────────────────────
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { max_allocation_pct, risk_override, config } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (max_allocation_pct !== undefined) {
      updates.push(`max_allocation_pct = $${idx++}`);
      values.push(max_allocation_pct);
    }
    if (risk_override !== undefined) {
      updates.push(`risk_override = $${idx++}`);
      values.push(risk_override);
    }
    if (config !== undefined) {
      updates.push(`config = $${idx++}`);
      values.push(config);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.params.id, req.user.id);
    const result = await query(
      `UPDATE bot_assignments SET ${updates.join(", ")}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ assignment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// DELETE /api/assignments/:id — Remove assignment
// ────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM bot_assignments WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ message: "Assignment removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
