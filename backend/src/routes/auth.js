import { Router } from "express";
import { query, getClient } from "../db/pool.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, display_name } = req.body;

    // Validation
    if (!email || !password || !display_name) {
      return res.status(400).json({ error: "Email, password, and display name are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Check if email exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Create user + settings in a transaction
    const client = await getClient();
    try {
      await client.query("BEGIN");

      const password_hash = await hashPassword(password);
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, role, created_at`,
        [email.toLowerCase(), password_hash, display_name]
      );

      const user = userResult.rows[0];

      // Create default settings
      await client.query(
        "INSERT INTO user_settings (user_id) VALUES ($1)",
        [user.id]
      );

      await client.query("COMMIT");

      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          created_at: user.created_at,
        },
        token,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await query(
      "SELECT id, email, password_hash, display_name, role, is_active FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.display_name, u.role, u.avatar_url,
              u.is_verified, u.created_at,
              s.notifications_push, s.notifications_email,
              s.two_factor_enabled, s.auto_trade_enabled,
              s.paper_trading_mode, s.default_risk_level,
              s.max_allocation_pct
       FROM users u
       LEFT JOIN user_settings s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// PATCH /api/auth/profile
// ────────────────────────────────────────────
router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const { display_name, avatar_url } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${idx++}`);
      values.push(display_name);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}
       RETURNING id, email, display_name, role, avatar_url`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// PATCH /api/auth/settings
// ────────────────────────────────────────────
router.patch("/settings", requireAuth, async (req, res, next) => {
  try {
    const allowed = [
      "notifications_push", "notifications_email", "two_factor_enabled",
      "auto_trade_enabled", "paper_trading_mode", "default_risk_level",
      "max_allocation_pct",
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(req.user.id);
    const result = await query(
      `UPDATE user_settings SET ${updates.join(", ")} WHERE user_id = $${idx}
       RETURNING *`,
      values
    );

    res.json({ settings: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// POST /api/auth/change-password
// ────────────────────────────────────────────
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const result = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const valid = await comparePassword(current_password, result.rows[0].password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const new_hash = await hashPassword(new_password);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [new_hash, req.user.id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
