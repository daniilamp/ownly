pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/merkleProof.circom";

/**
 * Residency
 *
 * Proves that a user resides in a specific country/region (encoded as integer),
 * WITHOUT revealing their address, name, or document number.
 *
 * Private inputs:
 *   - countryCode         : ISO 3166-1 numeric (e.g. Spain = 724)
 *   - regionCode          : sub-region code (0 = any region)
 *   - credentialSecret    : random salt
 *   - merklePathElements[levels]
 *   - merklePathIndices[levels]
 *
 * Public inputs:
 *   - requiredCountryCode : country the verifier requires
 *   - requiredRegionCode  : 0 = any region accepted
 *   - merkleRoot
 *   - currentYear         : for nullifier freshness
 *   - currentMonth
 *   - currentDay
 *
 * Outputs:
 *   - nullifier
 *   - claimResult         : 1 = residency proven
 */
template Residency(levels) {
    // ── Private inputs ────────────────────────────────────────────────────────
    signal input countryCode;
    signal input regionCode;
    signal input credentialSecret;
    signal input merklePathElements[levels];
    signal input merklePathIndices[levels];

    // ── Public inputs ─────────────────────────────────────────────────────────
    signal input requiredCountryCode;
    signal input requiredRegionCode;
    signal input merkleRoot;
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;

    // ── Outputs ───────────────────────────────────────────────────────────────
    signal output nullifier;
    signal output claimResult;

    // ── 1. Country match ──────────────────────────────────────────────────────
    component countryEQ = IsEqual();
    countryEQ.in[0] <== countryCode;
    countryEQ.in[1] <== requiredCountryCode;
    countryEQ.out === 1; // Constraint: must match

    // ── 2. Region match (0 = any region accepted) ─────────────────────────────
    component regionZero = IsZero();
    regionZero.in <== requiredRegionCode;

    component regionEQ = IsEqual();
    regionEQ.in[0] <== regionCode;
    regionEQ.in[1] <== requiredRegionCode;

    // regionOk = requiredRegionCode == 0 OR regionCode == requiredRegionCode
    signal regionOk;
    regionOk <== regionZero.out + regionEQ.out - regionZero.out * regionEQ.out;
    regionOk === 1;

    claimResult <== countryEQ.out * regionOk;

    // ── 3. Credential leaf ────────────────────────────────────────────────────
    component leafHasher = Poseidon(3);
    leafHasher.inputs[0] <== countryCode;
    leafHasher.inputs[1] <== regionCode;
    leafHasher.inputs[2] <== credentialSecret;

    // ── 4. Merkle membership ──────────────────────────────────────────────────
    component merkleChecker = MerkleProof(levels);
    merkleChecker.leaf <== leafHasher.out;
    merkleChecker.root <== merkleRoot;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== merklePathElements[i];
        merkleChecker.pathIndices[i] <== merklePathIndices[i];
    }
    merkleChecker.root === merkleRoot;

    // ── 5. Nullifier ──────────────────────────────────────────────────────────
    component nullifierHasher = Poseidon(4);
    nullifierHasher.inputs[0] <== credentialSecret;
    nullifierHasher.inputs[1] <== currentYear;
    nullifierHasher.inputs[2] <== currentMonth;
    nullifierHasher.inputs[3] <== currentDay;
    nullifier <== nullifierHasher.out;
}

component main {public [requiredCountryCode, requiredRegionCode, merkleRoot, currentYear, currentMonth, currentDay]} = Residency(10);
