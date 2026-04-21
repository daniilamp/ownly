pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/merkleProof.circom";

/**
 * ValidLicense
 *
 * Proves that a user holds a valid (non-expired) driving license,
 * WITHOUT revealing the license number, name, or any personal data.
 *
 * Private inputs:
 *   - expiryYear          : license expiry year
 *   - expiryMonth         : license expiry month
 *   - licenseCategory     : A, B, C... encoded as integer (B=2)
 *   - credentialSecret    : random salt
 *   - merklePathElements[levels]
 *   - merklePathIndices[levels]
 *
 * Public inputs:
 *   - currentYear
 *   - currentMonth
 *   - currentDay
 *   - requiredCategory    : minimum category required (0 = any)
 *   - merkleRoot
 *
 * Outputs:
 *   - nullifier
 *   - claimResult         : 1 = license valid and not expired
 */
template ValidLicense(levels) {
    // ── Private inputs ────────────────────────────────────────────────────────
    signal input expiryYear;
    signal input expiryMonth;
    signal input licenseCategory;
    signal input credentialSecret;
    signal input merklePathElements[levels];
    signal input merklePathIndices[levels];

    // ── Public inputs ─────────────────────────────────────────────────────────
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal input requiredCategory;
    signal input merkleRoot;

    // ── Outputs ───────────────────────────────────────────────────────────────
    signal output nullifier;
    signal output claimResult;

    // ── 1. Check license not expired ──────────────────────────────────────────
    // Not expired if: expiryYear > currentYear
    //              OR (expiryYear == currentYear AND expiryMonth >= currentMonth)
    component yearGT = GreaterThan(12);
    yearGT.in[0] <== expiryYear;
    yearGT.in[1] <== currentYear;

    component yearEQ = IsEqual();
    yearEQ.in[0] <== expiryYear;
    yearEQ.in[1] <== currentYear;

    component monthGTE = GreaterEqThan(8);
    monthGTE.in[0] <== expiryMonth;
    monthGTE.in[1] <== currentMonth;

    signal sameYearNotExpired;
    sameYearNotExpired <== yearEQ.out * monthGTE.out;

    signal notExpired;
    notExpired <== yearGT.out + sameYearNotExpired - yearGT.out * sameYearNotExpired;

    // Constraint: license must not be expired
    notExpired === 1;

    // ── 2. Check category meets requirement ───────────────────────────────────
    component catCheck = GreaterEqThan(4); // 4 bits: up to 15 categories
    catCheck.in[0] <== licenseCategory;
    catCheck.in[1] <== requiredCategory;
    catCheck.out === 1;

    claimResult <== notExpired * catCheck.out;

    // ── 3. Credential leaf ────────────────────────────────────────────────────
    component leafHasher = Poseidon(4);
    leafHasher.inputs[0] <== expiryYear;
    leafHasher.inputs[1] <== expiryMonth;
    leafHasher.inputs[2] <== licenseCategory;
    leafHasher.inputs[3] <== credentialSecret;

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

component main {public [currentYear, currentMonth, currentDay, requiredCategory, merkleRoot]} = ValidLicense(10);
