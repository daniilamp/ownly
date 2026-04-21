import { Router } from "express";
import { ethers } from "ethers";
import { z } from "zod";
import { buildMerkleTree, getMerkleProof, buildCommitment } from "../services/merkleService.js";

export const batchRouter = Router();

const BATCH_ABI = [
  "function addCommitmentsBulk(bytes32[]) external",
  "function submitBatch(bytes32) external returns (uint256)",
  "function getPendingCount(address) view returns (uint256)",
];

function getBatchProcessor() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer   = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
  return new ethers.Contract(process.env.BATCH_PROCESSOR_ADDRESS, BATCH_ABI, signer);
}

// ── POST /api/batch/submit ────────────────────────────────────────────────────
/**
 * Submit a batch of credential commitments to the blockchain.
 * Called by the issuer backend after validating a set of credentials.
 *
 * Body: { credentials: [{ hash, userAddress, issuerSig }] }
 */
const SubmitSchema = z.object({
  credentials: z.array(z.object({
    hash:       z.string(),
    userAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    issuerSig:  z.string(),
  })).min(1).max(1000),
});

batchRouter.post("/submit", async (req, res, next) => {
  try {
    const parsed = SubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    }

    const { credentials } = parsed.data;

    // 1. Build commitments
    const commitments = credentials.map(c =>
      buildCommitment(c.hash, c.userAddress, c.issuerSig)
    );

    // 2. Build Merkle tree
    const tree = buildMerkleTree(commitments);

    // 3. Submit to blockchain
    const batchProcessor = getBatchProcessor();
    const tx1 = await batchProcessor.addCommitmentsBulk(commitments);
    await tx1.wait();

    const tx2 = await batchProcessor.submitBatch(tree.root);
    const receipt = await tx2.wait();

    // Extract batchId from event
    const batchId = receipt.logs[0]?.topics[2]
      ? parseInt(receipt.logs[0].topics[2], 16)
      : 0;

    // 4. Generate Merkle proofs for each credential (returned to issuer)
    const proofs = credentials.map((_, i) => getMerkleProof(tree, i));

    return res.json({
      success: true,
      batchId,
      merkleRoot: tree.root,
      txHash: receipt.hash,
      leafCount: credentials.length,
      proofs, // Issuer distributes these to users
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/batch/proof ──────────────────────────────────────────────────────
/**
 * Generate a Merkle proof for a specific credential in a batch.
 * Called when a user needs to generate a ZK proof on their device.
 */
batchRouter.post("/proof", async (req, res, next) => {
  try {
    const { commitments, leafIndex } = req.body;
    if (!Array.isArray(commitments) || typeof leafIndex !== "number") {
      return res.status(400).json({ error: "commitments[] and leafIndex required" });
    }

    const tree  = buildMerkleTree(commitments);
    const proof = getMerkleProof(tree, leafIndex);

    return res.json({ proof, root: tree.root });
  } catch (err) {
    next(err);
  }
});
