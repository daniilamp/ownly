import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { verifyRouter } from "./routes/verify.js";
import { credentialRouter } from "./routes/credentials.js";
import { batchRouter } from "./routes/batch.js";
import { kycRouter } from "./routes/kyc.js";
import { documentRouter } from "./routes/documents.js";
import { authRouter } from "./routes/auth.js";
import { identityRouter } from "./routes/identity.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// CORS - allow multiple origins for development and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ownly-weld.vercel.app",
  "https://ownly-frontend.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
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
app.use("/api/kyc", kycRouter);
app.use("/api/documents", documentRouter);
app.use("/api/auth", authRouter);
app.use("/api/identity", identityRouter);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", version: "1.0.0" }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Ownly API running on port ${PORT}`);
});

export default app;
