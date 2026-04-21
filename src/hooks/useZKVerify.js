import { useState, useCallback } from "react";
import { verifyToken, isApiReachable } from "@/api/ownlyApi";

/**
 * useZKVerify
 * Centralizes the verification flow:
 * 1. Call the Ownly API for ZK/token verification
 * 2. Return structured result to the UI
 */
export function useZKVerify() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiOnline, setApiOnline] = useState(null); // null = unknown

  const verify = useCallback(async (rawToken) => {
    if (!rawToken?.trim()) return;

    setLoading(true);
    setResult(null);

    const token = rawToken.trim().toUpperCase().replace(/\s/g, "");

    try {
      // ── 1. Check API availability ──────────────────────────────────────────
      const online = await isApiReachable();
      setApiOnline(online);

      // ── 2. Verify via API (or demo fallback) ──────────────────────────────
      const apiResult = await verifyToken(token, null);

      // ── 3. Build final result ─────────────────────────────────────────────
      const polygonTx = generatePolygonTxHash();

      setResult({
        valid: apiResult.valid,
        reason: apiResult.reason,
        claims: apiResult.claims || [],
        credential_type: apiResult.credential_type || "other",
        credential_name: apiResult.credential_name,
        issuer: apiResult.issuer || "Ownly Network",
        expiry: apiResult.expiry,
        verifiedAt: apiResult.verifiedAt || new Date().toISOString(),
        nullifier: apiResult.nullifier,
        polygon_tx: apiResult.valid ? polygonTx : null,
        source: apiResult.source || (online ? "api" : "demo"),
        apiOnline: online,
      });
    } catch (err) {
      console.error("[useZKVerify] Verification error:", err);
      setResult({
        valid: false,
        reason: "Error de conexión. Inténtalo de nuevo.",
        source: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { verify, loading, result, reset, apiOnline };
}

function generatePolygonTxHash() {
  return "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
