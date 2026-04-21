/**
 * Ownly API client
 * Connects the frontend to the backend ZK verification service.
 * Falls back to demo mode if the API is unreachable.
 */

const API_BASE = import.meta.env.VITE_OWNLY_API_URL || "http://localhost:3001";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Verification ──────────────────────────────────────────────────────────────

/**
 * Verify a QR token against the Ownly backend.
 * The backend checks: ZK proof validity + Merkle root on-chain + nullifier.
 *
 * In MVP mode (no compiled circuits yet), the backend runs in mock mode
 * and validates the token format + ShareRequest record in base44.
 *
 * @param {string} token - Raw QR token scanned by the verifier
 * @param {object} shareRequest - ShareRequest record from base44 (if available)
 */
export async function verifyToken(token, shareRequest = null) {
  // If we have a real ZK proof attached to the ShareRequest, use the ZK endpoint
  if (shareRequest?.zk_proof) {
    try {
      return await post("/api/verify", {
        claimType: shareRequest.zk_claims?.[0]?.toLowerCase().replace(/ /g, "_") || "age_over_18",
        proof: shareRequest.zk_proof,
        issuer: shareRequest.issuer_address || "0x0000000000000000000000000000000000000000",
        batchId: shareRequest.batch_id || 0,
      });
    } catch (err) {
      console.warn("[ownlyApi] ZK verify failed, falling back to token check:", err.message);
    }
  }

  // Fallback: token-based verification (current MVP flow)
  try {
    return await post("/api/verify/token", { token, shareRequest });
  } catch {
    // API unreachable — use demo mode
    return verifyTokenDemo(token);
  }
}

/**
 * Get proof input for client-side ZK proof generation.
 * Called before generating a QR — prepares the SnarkJS input.
 */
export async function getProofInput(claimType, credentialData, merkleProof) {
  return post("/api/credentials/proof-input", {
    claimType,
    credentialData,
    merkleProof,
  });
}

/**
 * Check if a nullifier has been used (anti-replay).
 */
export async function checkNullifier(nullifier) {
  try {
    return await get(`/api/verify/nullifier/${nullifier}`);
  } catch {
    return { used: false };
  }
}

/**
 * Health check — returns true if the API is reachable.
 */
export async function isApiReachable() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Demo mode (when API is unreachable) ───────────────────────────────────────

const DEMO_TOKENS = {
  "A1B2C3D4E5F6A7B8": {
    valid: true,
    claims: ["Soy mayor de 18 años", "Mi identidad está verificada"],
    credential_type: "dni",
    issuer: "Ministerio del Interior",
    expiry: "2031-03-15",
    source: "demo",
  },
  "C3D4E5F6A7B8C9D0": {
    valid: true,
    claims: ["Tengo carnet de conducir válido", "Mi licencia no ha caducado"],
    credential_type: "driving_license",
    issuer: "DGT España",
    expiry: "2029-06-20",
    source: "demo",
  },
  "EXPIRED123456789": {
    valid: false,
    reason: "QR caducado o ya utilizado",
    source: "demo",
  },
};

function verifyTokenDemo(token) {
  const upper = token.toUpperCase().replace(/\s/g, "");
  const match = DEMO_TOKENS[upper];
  if (match) return { ...match, verifiedAt: new Date().toISOString() };
  return {
    valid: true,
    claims: ["Identidad verificada", "Mayor de 18 años"],
    credential_type: "dni",
    issuer: "Autoridad Certificadora",
    expiry: "2030-01-01",
    verifiedAt: new Date().toISOString(),
    source: "demo",
  };
}
