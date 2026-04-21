import { ethers } from "ethers";

/**
 * MerkleService
 * Builds Merkle trees from credential commitments and generates proofs.
 * Compatible with the BatchProcessor.sol on-chain verification.
 *
 * Uses sorted-pair keccak256 hashing — same as the Solidity contract.
 */

/**
 * Hash two nodes (sorted to make tree order-independent).
 */
function hashPair(a, b) {
  const [left, right] = a <= b ? [a, b] : [b, a];
  return ethers.keccak256(ethers.concat([left, right]));
}

/**
 * Build a Merkle tree from an array of leaf hashes (as hex strings).
 * Returns the tree layers (bottom to top) and the root.
 */
export function buildMerkleTree(leaves) {
  if (leaves.length === 0) throw new Error("Cannot build tree from empty leaves");

  const layers = [leaves.map(l => l.toLowerCase())];

  while (layers[layers.length - 1].length > 1) {
    const current = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left  = current[i];
      const right = i + 1 < current.length ? current[i + 1] : current[i]; // duplicate last if odd
      next.push(hashPair(left, right));
    }
    layers.push(next);
  }

  return {
    layers,
    root: layers[layers.length - 1][0],
    leafCount: leaves.length,
  };
}

/**
 * Generate a Merkle proof for a specific leaf index.
 * Returns pathElements and pathIndices compatible with the Circom circuit.
 */
export function getMerkleProof(tree, leafIndex) {
  const { layers } = tree;
  const pathElements = [];
  const pathIndices  = [];

  let idx = leafIndex;
  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    const sibling = siblingIdx < layer.length ? layer[siblingIdx] : layer[idx]; // duplicate

    pathElements.push(sibling);
    pathIndices.push(isRight ? 1 : 0);
    idx = Math.floor(idx / 2);
  }

  // Pad to fixed depth (10 levels for 1024 leaves)
  const DEPTH = 10;
  while (pathElements.length < DEPTH) {
    pathElements.push(ethers.ZeroHash);
    pathIndices.push(0);
  }

  return { pathElements, pathIndices, root: tree.root };
}

/**
 * Verify a Merkle proof (off-chain, mirrors the Solidity logic).
 */
export function verifyMerkleProof(leaf, pathElements, pathIndices, root) {
  let computed = leaf.toLowerCase();
  for (let i = 0; i < pathElements.length; i++) {
    const sibling = pathElements[i];
    if (sibling === ethers.ZeroHash) continue; // padding
    computed = pathIndices[i] === 1
      ? hashPair(sibling, computed)
      : hashPair(computed, sibling);
  }
  return computed.toLowerCase() === root.toLowerCase();
}

/**
 * Build a credential commitment hash.
 * commitment = keccak256(credentialHash || userAddress || issuerSignature)
 */
export function buildCommitment(credentialHash, userAddress, issuerSig) {
  return ethers.keccak256(
    ethers.concat([
      ethers.getBytes(credentialHash),
      ethers.getBytes(userAddress.toLowerCase().padStart(40, "0")),
      ethers.getBytes(issuerSig),
    ])
  );
}
