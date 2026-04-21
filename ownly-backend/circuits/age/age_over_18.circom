pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/merkleProof.circom";

/**
 * AgeOver18
 *
 * Proves that a user's birth year results in age >= 18,
 * WITHOUT revealing the actual birth date or any personal data.
 *
 * Private inputs (known only to the user's device):
 *   - birthYear       : e.g. 1990
 *   - birthMonth      : 1-12
 *   - birthDay        : 1-31
 *   - credentialSecret: random salt bound to this credential
 *   - merklePathElements[levels]: sibling nodes in the Merkle tree
 *   - merklePathIndices[levels] : 0=left, 1=right for each level
 *
 * Public inputs (visible to the verifier):
 *   - currentYear     : e.g. 2026 (provided by the verifier/app)
 *   - currentMonth    : current month
 *   - currentDay      : current day
 *   - merkleRoot      : root of the credential batch tree
 *   - nullifier       : Poseidon(credentialSecret, currentDay) — unique per day
 *   - claimResult     : 1 if age >= 18, 0 otherwise (always 1 for valid proofs)
 */
template AgeOver18(levels) {
    // ── Private inputs ────────────────────────────────────────────────────────
    signal input birthYear;
    signal input birthMonth;
    signal input birthDay;
    signal input credentialSecret;
    signal input merklePathElements[levels];
    signal input merklePathIndices[levels];

    // ── Public inputs ─────────────────────────────────────────────────────────
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal input merkleRoot;

    // ── Outputs ───────────────────────────────────────────────────────────────
    signal output nullifier;
    signal output claimResult; // 1 = age >= 18 proven

    // ── 1. Compute age in years (conservative: only full years count) ─────────
    // age = currentYear - birthYear - adjustment
    // adjustment = 1 if birthday hasn't occurred yet this year, else 0
    signal yearDiff;
    yearDiff <== currentYear - birthYear;

    // Has the birthday passed this year?
    // monthPassed = currentMonth > birthMonth
    component monthGT = GreaterThan(8); // 8 bits enough for months
    monthGT.in[0] <== currentMonth;
    monthGT.in[1] <== birthMonth;

    // monthEqual = currentMonth == birthMonth
    component monthEQ = IsEqual();
    monthEQ.in[0] <== currentMonth;
    monthEQ.in[1] <== birthMonth;

    // dayPassed = currentDay >= birthDay (when same month)
    component dayGTE = GreaterEqThan(8);
    dayGTE.in[0] <== currentDay;
    dayGTE.in[1] <== birthDay;

    // birthdayPassed = monthGT OR (monthEQ AND dayGTE)
    signal sameMonthAndDayPassed;
    sameMonthAndDayPassed <== monthEQ.out * dayGTE.out;

    signal birthdayPassed;
    birthdayPassed <== monthGT.out + sameMonthAndDayPassed - monthGT.out * sameMonthAndDayPassed;

    // age = yearDiff - (1 - birthdayPassed) = yearDiff - 1 + birthdayPassed
    signal age;
    age <== yearDiff - 1 + birthdayPassed;

    // ── 2. Assert age >= 18 ───────────────────────────────────────────────────
    component ageCheck = GreaterEqThan(7); // 7 bits: max age ~127
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== 18;
    ageCheck.out === 1; // Constraint: proof is invalid if age < 18

    claimResult <== ageCheck.out;

    // ── 3. Compute credential leaf = Poseidon(birthYear, birthMonth, birthDay, secret) ──
    component leafHasher = Poseidon(4);
    leafHasher.inputs[0] <== birthYear;
    leafHasher.inputs[1] <== birthMonth;
    leafHasher.inputs[2] <== birthDay;
    leafHasher.inputs[3] <== credentialSecret;

    // ── 4. Verify Merkle membership ───────────────────────────────────────────
    component merkleChecker = MerkleProof(levels);
    merkleChecker.leaf <== leafHasher.out;
    merkleChecker.root <== merkleRoot;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== merklePathElements[i];
        merkleChecker.pathIndices[i] <== merklePathIndices[i];
    }
    // Constraint: leaf must be in the registered Merkle tree
    merkleChecker.root === merkleRoot;

    // ── 5. Compute nullifier = Poseidon(secret, currentYear, currentMonth, currentDay) ──
    // Unique per credential per day — prevents replay within the same day
    component nullifierHasher = Poseidon(4);
    nullifierHasher.inputs[0] <== credentialSecret;
    nullifierHasher.inputs[1] <== currentYear;
    nullifierHasher.inputs[2] <== currentMonth;
    nullifierHasher.inputs[3] <== currentDay;
    nullifier <== nullifierHasher.out;
}

// Instantiate with 10 levels → supports up to 2^10 = 1024 credentials per batch
component main {public [currentYear, currentMonth, currentDay, merkleRoot]} = AgeOver18(10);
