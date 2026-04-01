import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ══════════════════════════════════════════════
// EXCHANGE CONNECTIONS
// ══════════════════════════════════════════════

// GET /api/connections/exchanges
router.get("/exchanges", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, exchange, label, permissions, is_active, last_verified, created_at
       FROM exchange_connections
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    // Never return encrypted keys
    res.json({ exchanges: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/connections/exchanges
router.post("/exchanges", requireAuth, async (req, res, next) => {
  try {
    const { exchange, api_key, api_secret, passphrase, label } = req.body;

    if (!exchange || !api_key || !api_secret) {
      return res.status(400).json({ error: "Exchange, API key, and API secret are required" });
    }

    const supported = ["binance", "coinbase", "kraken", "bybit", "okx", "kucoin"];
    if (!supported.includes(exchange.toLowerCase())) {
      return res.status(400).json({ error: `Supported exchanges: ${supported.join(", ")}` });
    }

    // TODO: Encrypt keys with AES-256 before storing
    // For now, storing as-is (MUST encrypt before production)
    const result = await query(
      `INSERT INTO exchange_connections
        (user_id, exchange, api_key_enc, api_secret_enc, passphrase_enc, label)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, exchange, label, permissions, is_active, created_at`,
      [req.user.id, exchange.toLowerCase(), api_key, api_secret, passphrase || null, label || exchange]
    );

    // TODO: Verify connection by making a test API call to the exchange

    res.status(201).json({ exchange: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/connections/exchanges/:id
router.delete("/exchanges/:id", requireAuth, async (req, res, next) => {
  try {
    // Check for active assignments using this connection
    const assignments = await query(
      "SELECT id FROM bot_assignments WHERE exchange_connection_id = $1 AND status = 'active'",
      [req.params.id]
    );
    if (assignments.rows.length > 0) {
      return res.status(409).json({
        error: "Cannot delete — active bot assignments are using this connection. Stop them first.",
      });
    }

    const result = await query(
      "DELETE FROM exchange_connections WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Exchange connection not found" });
    }

    res.json({ message: "Exchange connection removed" });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════
// WALLET CONNECTIONS
// ══════════════════════════════════════════════

// GET /api/connections/wallets
router.get("/wallets", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, wallet_type, address, chains, label, is_active, created_at
       FROM wallet_connections
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ wallets: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/connections/wallets
router.post("/wallets", requireAuth, async (req, res, next) => {
  try {
    const { wallet_type, address, chains, label } = req.body;

    if (!wallet_type || !address) {
      return res.status(400).json({ error: "Wallet type and address are required" });
    }

    const result = await query(
      `INSERT INTO wallet_connections (user_id, wallet_type, address, chains, label)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, wallet_type, address, chains, label, is_active, created_at`,
      [req.user.id, wallet_type, address, chains || [], label || wallet_type]
    );

    res.status(201).json({ wallet: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/connections/wallets/:id
router.delete("/wallets/:id", requireAuth, async (req, res, next) => {
  try {
    const assignments = await query(
      "SELECT id FROM bot_assignments WHERE wallet_connection_id = $1 AND status = 'active'",
      [req.params.id]
    );
    if (assignments.rows.length > 0) {
      return res.status(409).json({
        error: "Cannot delete — active bot assignments are using this wallet. Stop them first.",
      });
    }

    const result = await query(
      "DELETE FROM wallet_connections WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Wallet connection not found" });
    }

    res.json({ message: "Wallet connection removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
