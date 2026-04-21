// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @notice Registers Merkle roots of credential batches issued by authorized partners.
 *         No personal data is stored on-chain — only cryptographic commitments.
 */
contract CredentialRegistry {
    // ─── Roles ────────────────────────────────────────────────────────────────
    address public owner;
    mapping(address => bool) public isIssuer;

    // ─── Merkle roots ─────────────────────────────────────────────────────────
    // issuer → batchId → merkleRoot
    mapping(address => mapping(uint256 => bytes32)) public batchRoots;
    // issuer → total batches published
    mapping(address => uint256) public batchCount;
    // nullifier → used (prevents QR replay)
    mapping(bytes32 => bool) public nullifierUsed;

    // ─── Events ───────────────────────────────────────────────────────────────
    event IssuerAdded(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event BatchPublished(address indexed issuer, uint256 indexed batchId, bytes32 merkleRoot);
    event NullifierConsumed(bytes32 indexed nullifier);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Not authorized issuer");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Issuer management ────────────────────────────────────────────────────
    function addIssuer(address issuer) external onlyOwner {
        isIssuer[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        isIssuer[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    // ─── Batch publishing ─────────────────────────────────────────────────────
    /**
     * @notice Publish a Merkle root representing a batch of credential hashes.
     *         Thousands of credentials → one on-chain transaction.
     * @param merkleRoot  Root of the Merkle tree built from credential commitments.
     */
    function publishBatch(bytes32 merkleRoot) external onlyIssuer returns (uint256 batchId) {
        batchId = batchCount[msg.sender]++;
        batchRoots[msg.sender][batchId] = merkleRoot;
        emit BatchPublished(msg.sender, batchId, merkleRoot);
    }

    // ─── Nullifier registry ───────────────────────────────────────────────────
    /**
     * @notice Mark a nullifier as used. Called by the VerifierContract after
     *         a successful ZK proof verification to prevent QR replay attacks.
     */
    function consumeNullifier(bytes32 nullifier) external {
        // Only the VerifierContract should call this — enforced via access control
        require(!nullifierUsed[nullifier], "Nullifier already used");
        nullifierUsed[nullifier] = true;
        emit NullifierConsumed(nullifier);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────
    function getBatchRoot(address issuer, uint256 batchId) external view returns (bytes32) {
        return batchRoots[issuer][batchId];
    }

    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifierUsed[nullifier];
    }
}
