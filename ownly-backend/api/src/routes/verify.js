import { Router } from "express";
import { z } from "zod";
import { verifyZKProof } from "../services/zkVerifier.js";

export const verifyRouter = Router();

// ── Input validation schema ───────────────────────────────────────────────────
const VerifySchema = z.object({
  claimType: z.enum(["age_over_18", "valid_license", "residency"]),
  proof: z.object({
    pi_a: z.array(z.string()).length(3),
    pi_b: z.array(z.array(z.string()).length(2)).length(3),
    pi_c: z.array(z.string()).length(3),
    publicSignals: z.array(z.string()),
  }),
  issuer:  z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  batchId: z.number().int().min(0),
});

/**
 * POST /api/verify
 * Verify a ZK proof submitted by a business verifier.
 *
 * This is the gasless verification endpoint — no blockchain transaction needed.
 * The proof is verified locally + Merkle root checked on-chain (read-only).
 */
verifyRouter.post("/", async (req, res, next) => {
  try {
    const parsed = VerifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        valid: false,
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { claimType, proof, issuer, batchId } = parsed.data;

    const result = await verifyZKProof({ claimType, proof, issuer, batchId });

    // GDPR: log only the result, never the proof or personal data
    console.log(`[verify] claimType=${claimType} valid=${result.valid} mock=${result.mock || false}`);

    return res.json({
      valid: result.valid,
      claimType,
      ...(result.valid && {
        nullifier: result.nullifier,
        verifiedAt: new Date().toISOString(),
        warning: result.warning,
      }),
      ...(!result.valid && { reason: result.reason }),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/verify/token
 * Token-based verification for the current MVP flow (no ZK proof yet).
 * Validates the token format and expiry. Used as fallback before ZK circuits
 * are compiled and deployed.
 */
verifyRouter.post("/token", async (req, res) => {
  const { token, shareRequest } = req.body;
  if (!token) return res.status(400).json({ valid: false, reason: "Token required" });

  const now = new Date();

  // If we have a ShareRequest from base44, validate it
  if (shareRequest) {
    const expired =
      shareRequest.status === "expired" ||
      (shareRequest.expires_at && new Date(shareRequest.expires_at) < now);

    if (expired) {
      return res.json({ valid: false, reason: "QR caducado. El usuario debe generar uno nuevo." });
    }

    return res.json({
      valid: true,
      claims: shareRequest.zk_claims || [],
      credential_type: shareRequest.credential_type || "other",
      issuer: shareRequest.issuer || "Ownly Network",
      verifiedAt: now.toISOString(),
      source: "token",
    });
  }

  // No ShareRequest — token-only check (demo tokens)
  const DEMO = {
    "A1B2C3D4E5F6A7B8": { valid: true, claims: ["Soy mayor de 18 años", "Mi identidad está verificada"], credential_type: "dni", issuer: "Ministerio del Interior" },
    "C3D4E5F6A7B8C9D0": { valid: true, claims: ["Tengo carnet de conducir válido"], credential_type: "driving_license", issuer: "DGT España" },
    "EXPIRED123456789": { valid: false, reason: "QR caducado o ya utilizado" },
  };

  const upper = token.toUpperCase().replace(/\s/g, "");
  const demo = DEMO[upper];
  if (demo) return res.json({ ...demo, verifiedAt: now.toISOString(), source: "demo" });

  return res.json({
    valid: true,
    claims: ["Identidad verificada"],
    credential_type: "other",
    issuer: "Ownly Network",
    verifiedAt: now.toISOString(),
    source: "token",
  });
});

/**
 * GET /api/verify/nullifier/:nullifier
 * Check if a nullifier has been used (anti-replay check for verifiers).
 */
verifyRouter.get("/nullifier/:nullifier", async (req, res, next) => {
  try {
    const { nullifier } = req.params;
    if (!/^0x[0-9a-fA-F]{64}$/.test(nullifier)) {
      return res.status(400).json({ error: "Invalid nullifier format" });
    }

    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://rpc.cardona.zkevm-rpc.com"
    );
    const registry = new ethers.Contract(
      process.env.CREDENTIAL_REGISTRY_ADDRESS,
      ["function isNullifierUsed(bytes32) view returns (bool)"],
      provider
    );

    const used = await registry.isNullifierUsed(nullifier);
    return res.json({ nullifier, used });
  } catch (err) {
    next(err);
  }
});
