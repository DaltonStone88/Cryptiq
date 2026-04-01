export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Postgres unique violation
  if (err.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  // Postgres foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced resource not found" });
  }

  // Postgres check constraint violation
  if (err.code === "23514") {
    return res.status(400).json({ error: "Invalid value provided" });
  }

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({ error: message });
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
