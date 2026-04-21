import { Router } from "express";
import { ethers } from "ethers";
import { buildProofInput } from "../services/zkVerifier.js";

export const credentialRouter = Router();

/**
 * POST /api/credentials/proof-input
 * Returns the structured input for SnarkJS proof generation on the user's device.
 * The actual proof is generated client-side (never send private data to the server).
 *
 * Body: {
 *   claimType,
 *   credentialData: { birthYear, birthMonth, birthDay, secret, ... },
 *   merkleProof: { pathElements, pathIndices, root }
 * }
 */
credentialRouter.post("/proof-input", (req, res) => {
  try {
    const { claimType, credentialData, merkleProof } = req.body;
    if (!claimType || !credentialData || !merkleProof) {
      return res.status(400).json({ error: "claimType, credentialData, merkleProof required" });
    }

    const now = new Date();
    const input = buildProofInput({
      claimType,
      credentialData,
      merkleProof,
      currentDate: {
        year:  now.getFullYear(),
        month: now.getMonth() + 1,
        day:   now.getDate(),
      },
    });

    return res.json({ input });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/credentials/commitment
 * Compute a credential commitment hash (deterministic, no secrets needed server-side).
 */
credentialRouter.post("/commitment", (req, res) => {
  const { credentialHash, userAddress, issuerSig } = req.body;
  if (!credentialHash || !userAddress || !issuerSig) {
    return res.status(400).json({ error: "credentialHash, userAddress, issuerSig required" });
  }

  const commitment = ethers.keccak256(
    ethers.concat([
      ethers.getBytes(credentialHash),
      ethers.zeroPadValue(ethers.getBytes(userAddress), 20),
      ethers.getBytes(issuerSig),
    ])
  );

  return res.json({ commitment });
});
