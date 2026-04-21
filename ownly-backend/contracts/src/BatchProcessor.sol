// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CredentialRegistry.sol";

/**
 * @title BatchProcessor
 * @notice Builds and publishes Merkle trees of credential commitments.
 *
 *  Economics:
 *  - 1,000+ credentials → 1 on-chain transaction
 *  - Cost per user < 0.01€ on Polygon L2
 *
 *  Off-chain flow (handled by the API):
 *  1. Issuer collects N credential hashes (commitments).
 *  2. API builds a Merkle tree from those hashes.
 *  3. API calls `submitBatch(merkleRoot)` here.
 *  4. Each user gets a Merkle proof (path) stored locally on their device.
 *  5. The ZK circuit uses the Merkle proof to prove membership without
 *     revealing which leaf (credential) belongs to the user.
 */
contract BatchProcessor {
    CredentialRegistry public immutable registry;
    address public owner;

    // Pending commitments buffer (cleared after each batch submission)
    // issuer → list of pending credential commitments
    mapping(address => bytes32[]) private pendingCommitments;
    mapping(address => bool) public isIssuer;

    uint256 public constant MAX_BATCH_SIZE = 1000;
    uint256 public constant MIN_BATCH_SIZE = 1;

    event CommitmentAdded(address indexed issuer, bytes32 commitment, uint256 index);
    event BatchSubmitted(address indexed issuer, uint256 batchId, bytes32 merkleRoot, uint256 leafCount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Not authorized issuer");
        _;
    }

    constructor(address registryAddress) {
        registry = CredentialRegistry(registryAddress);
        owner = msg.sender;
    }

    function addIssuer(address issuer) external onlyOwner {
        isIssuer[issuer] = true;
    }

    // ─── Commitment buffering ─────────────────────────────────────────────────
    /**
     * @notice Add a credential commitment to the pending buffer.
     *         commitment = keccak256(credentialHash || userAddress || issuerSig)
     *         No personal data — just a cryptographic hash.
     */
    function addCommitment(bytes32 commitment) external onlyIssuer {
        require(
            pendingCommitments[msg.sender].length < MAX_BATCH_SIZE,
            "Batch buffer full, submit current batch first"
        );
        uint256 index = pendingCommitments[msg.sender].length;
        pendingCommitments[msg.sender].push(commitment);
        emit CommitmentAdded(msg.sender, commitment, index);
    }

    function addCommitmentsBulk(bytes32[] calldata commitments) external onlyIssuer {
        uint256 current = pendingCommitments[msg.sender].length;
        require(current + commitments.length <= MAX_BATCH_SIZE, "Exceeds max batch size");
        for (uint256 i = 0; i < commitments.length; i++) {
            pendingCommitments[msg.sender].push(commitments[i]);
            emit CommitmentAdded(msg.sender, commitments[i], current + i);
        }
    }

    // ─── Batch submission ─────────────────────────────────────────────────────
    /**
     * @notice Submit the pending buffer as a batch.
     *         The Merkle root is computed off-chain (cheaper) and verified
     *         against the on-chain commitments.
     *
     * @param merkleRoot  Root computed off-chain from pendingCommitments.
     *                    The contract verifies it matches the on-chain buffer.
     */
    function submitBatch(bytes32 merkleRoot) external onlyIssuer returns (uint256 batchId) {
        bytes32[] storage commitments = pendingCommitments[msg.sender];
        require(commitments.length >= MIN_BATCH_SIZE, "No pending commitments");

        // Verify the submitted root matches what we have on-chain
        bytes32 computedRoot = _computeMerkleRoot(commitments);
        require(computedRoot == merkleRoot, "Merkle root mismatch");

        // Publish to registry
        batchId = registry.publishBatch(merkleRoot);

        uint256 leafCount = commitments.length;
        delete pendingCommitments[msg.sender];

        emit BatchSubmitted(msg.sender, batchId, merkleRoot, leafCount);
    }

    /**
     * @notice Emergency: submit batch with a pre-computed root without verification.
     *         Only callable by owner for recovery scenarios.
     */
    function submitBatchForced(address issuer, bytes32 merkleRoot)
        external
        onlyOwner
        returns (uint256 batchId)
    {
        // Temporarily grant issuer role to registry call
        batchId = registry.publishBatch(merkleRoot);
        delete pendingCommitments[issuer];
    }

    // ─── Merkle tree (on-chain, for verification) ─────────────────────────────
    /**
     * @notice Compute Merkle root from a list of leaves.
     *         Uses keccak256 for hashing — compatible with the Circom circuits.
     *         For large batches this is done off-chain; this is the on-chain check.
     */
    function _computeMerkleRoot(bytes32[] storage leaves) internal view returns (bytes32) {
        uint256 n = leaves.length;
        if (n == 1) return leaves[0];

        bytes32[] memory layer = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) {
            layer[i] = leaves[i];
        }

        while (n > 1) {
            uint256 newLen = (n + 1) / 2;
            for (uint256 i = 0; i < newLen; i++) {
                uint256 left = i * 2;
                uint256 right = left + 1 < n ? left + 1 : left; // duplicate last if odd
                // Sort to make the tree order-independent
                if (layer[left] <= layer[right]) {
                    layer[i] = keccak256(abi.encodePacked(layer[left], layer[right]));
                } else {
                    layer[i] = keccak256(abi.encodePacked(layer[right], layer[left]));
                }
            }
            n = newLen;
        }
        return layer[0];
    }

    /**
     * @notice Verify a Merkle proof for a single leaf.
     *         Called by the ZK verifier to confirm credential membership.
     */
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] calldata proof,
        bytes32 root
    ) external pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 sibling = proof[i];
            if (computed <= sibling) {
                computed = keccak256(abi.encodePacked(computed, sibling));
            } else {
                computed = keccak256(abi.encodePacked(sibling, computed));
            }
        }
        return computed == root;
    }

    // ─── View ─────────────────────────────────────────────────────────────────
    function getPendingCount(address issuer) external view returns (uint256) {
        return pendingCommitments[issuer].length;
    }

    function getPendingCommitment(address issuer, uint256 index) external view returns (bytes32) {
        return pendingCommitments[issuer][index];
    }
}
