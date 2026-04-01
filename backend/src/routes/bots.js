import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ────────────────────────────────────────────
// GET /api/bots — List published bots
// ────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { strategy, risk, sort, search, page = 1, limit = 20 } = req.query;
    const conditions = ["b.is_published = true", "b.is_active = true"];
    const values = [];
    let idx = 1;

    if (strategy) {
      conditions.push(`b.strategy_type = $${idx++}`);
      values.push(strategy);
    }
    if (risk) {
      conditions.push(`b.risk_level = $${idx++}`);
      values.push(risk);
    }
    if (search) {
      conditions.push(`(b.name ILIKE $${idx} OR b.description ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    let orderBy = "b.subscriber_count DESC";
    if (sort === "rating") orderBy = "b.avg_rating DESC";
    if (sort === "pnl") orderBy = "b.pnl_90d DESC NULLS LAST";
    if (sort === "price_low") orderBy = "b.price_monthly ASC";
    if (sort === "price_high") orderBy = "b.price_monthly DESC";
    if (sort === "newest") orderBy = "b.created_at DESC";

    const offset = (parseInt(page) - 1) * parseInt(limit);
    values.push(parseInt(limit), offset);

    const result = await query(
      `SELECT b.id, b.name, b.slug, b.description, b.strategy_type,
              b.risk_level, b.supported_coins, b.price_monthly,
              b.pnl_90d, b.win_rate, b.subscriber_count,
              b.avg_rating, b.review_count, b.version,
              u.display_name AS developer_name
       FROM bots b
       JOIN users u ON u.id = b.developer_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM bots b WHERE ${conditions.join(" AND ")}`,
      values.slice(0, -2) // exclude limit/offset
    );

    res.json({
      bots: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// GET /api/bots/:slug — Bot detail
// ────────────────────────────────────────────
router.get("/:slug", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, u.display_name AS developer_name, u.avatar_url AS developer_avatar
       FROM bots b
       JOIN users u ON u.id = b.developer_id
       WHERE b.slug = $1 AND b.is_published = true`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Get recent reviews
    const reviews = await query(
      `SELECT r.rating, r.comment, r.created_at, u.display_name
       FROM bot_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.bot_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [result.rows[0].id]
    );

    res.json({
      bot: result.rows[0],
      reviews: reviews.rows,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// POST /api/bots/:id/subscribe
// ────────────────────────────────────────────
router.post("/:id/subscribe", requireAuth, async (req, res, next) => {
  try {
    const bot = await query("SELECT id, price_monthly FROM bots WHERE id = $1 AND is_published = true", [req.params.id]);
    if (bot.rows.length === 0) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Check existing subscription
    const existing = await query(
      "SELECT id, status FROM subscriptions WHERE user_id = $1 AND bot_id = $2",
      [req.user.id, req.params.id]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === "active") {
      return res.status(409).json({ error: "Already subscribed to this bot" });
    }

    // TODO: Process payment via Stripe or crypto payment
    // For now, create subscription directly

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const result = await query(
      `INSERT INTO subscriptions (user_id, bot_id, price_at_sub, current_period_end)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, bot_id) DO UPDATE SET
         status = 'active', price_at_sub = $3,
         current_period_start = NOW(), current_period_end = $4,
         cancelled_at = NULL
       RETURNING *`,
      [req.user.id, req.params.id, bot.rows[0].price_monthly, periodEnd]
    );

    // Increment subscriber count
    await query(
      "UPDATE bots SET subscriber_count = subscriber_count + 1 WHERE id = $1",
      [req.params.id]
    );

    res.status(201).json({ subscription: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// POST /api/bots/:id/review
// ────────────────────────────────────────────
router.post("/:id/review", requireAuth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Must be subscribed to review
    const sub = await query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND bot_id = $2",
      [req.user.id, req.params.id]
    );
    if (sub.rows.length === 0) {
      return res.status(403).json({ error: "You must be subscribed to review this bot" });
    }

    const result = await query(
      `INSERT INTO bot_reviews (bot_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (bot_id, user_id) DO UPDATE SET rating = $3, comment = $4
       RETURNING *`,
      [req.params.id, req.user.id, rating, comment]
    );

    // Update bot avg rating
    const stats = await query(
      "SELECT AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*) AS review_count FROM bot_reviews WHERE bot_id = $1",
      [req.params.id]
    );
    await query(
      "UPDATE bots SET avg_rating = $1, review_count = $2 WHERE id = $3",
      [stats.rows[0].avg_rating, stats.rows[0].review_count, req.params.id]
    );

    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
