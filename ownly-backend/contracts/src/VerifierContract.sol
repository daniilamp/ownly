// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CredentialRegistry.sol";

/**
 * @title IGroth16Verifier
 * @notice Interface for the auto-generated Groth16 verifier produced by SnarkJS.
 *         One verifier per circuit type (age, license, residency).
 */
interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external view returns (bool);
}

/**
 * @title VerifierContract
 * @notice On-chain ZK proof verifier for Ownly credentials.
 *
 *  Flow:
 *  1. User generates a ZK proof off-chain (SnarkJS in the mobile app).
 *  2. Verifier (business) submits the proof + public signals here.
 *  3. Contract checks:
 *     a) The Groth16 proof is mathematically valid.
 *     b) The credential commitment is included in a registered Merkle batch.
 *     c) The nullifier has not been used before (anti-replay).
 *  4. If all checks pass → emits VerificationSuccess. Nullifier is consumed.
 */
contract VerifierContract {
    // ─── Claim types ──────────────────────────────────────────────────────────
    enum ClaimType { AGE_OVER_18, VALID_LICENSE, RESIDENCY }

    // ─── State ────────────────────────────────────────────────────────────────
    CredentialRegistry public immutable registry;
    address public owner;

    // claimType → Groth16 verifier contract address
    mapping(ClaimType => address) public verifiers;

    // ─── Events ───────────────────────────────────────────────────────────────
    event VerificationSuccess(
        address indexed verifier,
        ClaimType indexed claimType,
        bytes32 nullifier,
        address issuer,
        uint256 batchId
    );
    event VerificationFailed(address indexed verifier, ClaimType indexed claimType, string reason);
    event VerifierUpdated(ClaimType indexed claimType, address verifierAddress);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address registryAddress) {
        registry = CredentialRegistry(registryAddress);
        owner = msg.sender;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────
    function setVerifier(ClaimType claimType, address verifierAddress) external onlyOwner {
        verifiers[claimType] = verifierAddress;
        emit VerifierUpdated(claimType, verifierAddress);
    }

    // ─── Core verification ────────────────────────────────────────────────────
    /**
     * @notice Verify a ZK proof for a specific claim.
     *
     * @param claimType       Which claim is being proven (age, license, residency).
     * @param proof_a         Groth16 proof element A.
     * @param proof_b         Groth16 proof element B.
     * @param proof_c         Groth16 proof element C.
     * @param publicSignals   Public inputs to the circuit:
     *                        [0] merkleRoot  — must match a registered batch root
     *                        [1] nullifier   — unique per proof, prevents replay
     *                        [2] claimValue  — the proven claim (e.g. 1 = over 18)
     * @param issuer          Address of the issuer who published the batch.
     * @param batchId         Which batch the credential belongs to.
     */
    function verifyCredentialClaim(
        ClaimType claimType,
        uint256[2] calldata proof_a,
        uint256[2][2] calldata proof_b,
        uint256[2] calldata proof_c,
        uint256[] calldata publicSignals,
        address issuer,
        uint256 batchId
    ) external returns (bool) {
        require(publicSignals.length >= 3, "Invalid public signals length");

        address verifierAddr = verifiers[claimType];
        require(verifierAddr != address(0), "No verifier set for this claim type");

        bytes32 nullifier = bytes32(publicSignals[1]);
        bytes32 merkleRoot = bytes32(publicSignals[0]);

        // 1. Anti-replay: nullifier must be fresh
        if (registry.isNullifierUsed(nullifier)) {
            emit VerificationFailed(msg.sender, claimType, "Nullifier already used");
            return false;
        }

        // 2. Merkle root must match a registered batch
        bytes32 registeredRoot = registry.getBatchRoot(issuer, batchId);
        if (registeredRoot == bytes32(0) || registeredRoot != merkleRoot) {
            emit VerificationFailed(msg.sender, claimType, "Merkle root not registered");
            return false;
        }

        // 3. Groth16 proof must be valid
        bool proofValid = IGroth16Verifier(verifierAddr).verifyProof(
            proof_a, proof_b, proof_c, publicSignals
        );
        if (!proofValid) {
            emit VerificationFailed(msg.sender, claimType, "Invalid ZK proof");
            return false;
        }

        // 4. Consume nullifier to prevent replay
        registry.consumeNullifier(nullifier);

        emit VerificationSuccess(msg.sender, claimType, nullifier, issuer, batchId);
        return true;
    }

    // ─── Gasless helper (for off-chain verification via events) ───────────────
    /**
     * @notice Pure off-chain verification — does NOT consume the nullifier.
     *         Used by the API backend to verify proofs without gas cost.
     *         The nullifier check is done off-chain in this case.
     */
    function verifyProofOnly(
        ClaimType claimType,
        uint256[2] calldata proof_a,
        uint256[2][2] calldata proof_b,
        uint256[2] calldata proof_c,
        uint256[] calldata publicSignals
    ) external view returns (bool) {
        address verifierAddr = verifiers[claimType];
        require(verifierAddr != address(0), "No verifier set for this claim type");
        return IGroth16Verifier(verifierAddr).verifyProof(proof_a, proof_b, proof_c, publicSignals);
    }
}
