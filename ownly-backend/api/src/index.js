import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { verifyRouter } from "./routes/verify.js";
import { credentialRouter } from "./routes/credentials.js";
import { batchRouter } from "./routes/batch.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST"],
}));

// Rate limiting — prevent abuse of verification endpoint
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 verifications per minute per IP
  message: { error: "Too many verification requests, slow down." },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/verify", verifyLimiter, verifyRouter);
app.use("/api/credentials", credentialRouter);
app.use("/api/batch", batchRouter);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", version: "1.0.0" }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Ownly API running on port ${PORT}`);
});

export default app;
