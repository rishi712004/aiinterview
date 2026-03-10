// Global error handler — catches any error passed to next(err)
export const errorHandler = (err, req, res, next) => {
  console.error(`❌ ${req.method} ${req.path} →`, err.message);

  // PostgreSQL unique violation (e.g. duplicate email)
  if (err.code === "23505") {
    return res.status(400).json({ error: "That email is already registered." });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced record does not exist." });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Something went wrong. Please try again.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};