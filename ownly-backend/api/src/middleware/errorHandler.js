export function errorHandler(err, req, res, _next) {
  console.error("[error]", err.message);
  res.status(500).json({
    error: "Internal server error",
    // Never expose stack traces in production
    ...(process.env.NODE_ENV === "development" && { detail: err.message }),
  });
}
