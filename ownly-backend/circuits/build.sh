#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Ownly — ZK Circuit Build Script
# Compiles Circom circuits and generates SnarkJS artifacts
#
# Prerequisites:
#   npm install -g circom snarkjs
#   Download Powers of Tau: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau
#
# Usage:
#   chmod +x build.sh
#   ./build.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

PTAU_FILE="./powersOfTau28_hez_final_15.ptau"
BUILD_DIR="./build"

mkdir -p "$BUILD_DIR/age" "$BUILD_DIR/license" "$BUILD_DIR/residency"

# Download Powers of Tau if not present
if [ ! -f "$PTAU_FILE" ]; then
  echo "Downloading Powers of Tau ceremony file..."
  curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau" -o "$PTAU_FILE"
fi

compile_circuit() {
  local NAME=$1
  local DIR=$2
  local CIRCUIT="$DIR/${NAME}.circom"

  echo ""
  echo "══════════════════════════════════════════"
  echo " Compiling: $NAME"
  echo "══════════════════════════════════════════"

  # 1. Compile Circom → R1CS + WASM + sym
  circom "$CIRCUIT" \
    --r1cs "$BUILD_DIR/$NAME/${NAME}.r1cs" \
    --wasm "$BUILD_DIR/$NAME/" \
    --sym  "$BUILD_DIR/$NAME/${NAME}.sym" \
    --c    "$BUILD_DIR/$NAME/" \
    -l ./node_modules

  echo "  ✓ R1CS compiled"

  # 2. Groth16 setup (zkey phase 1)
  snarkjs groth16 setup \
    "$BUILD_DIR/$NAME/${NAME}.r1cs" \
    "$PTAU_FILE" \
    "$BUILD_DIR/$NAME/${NAME}_0000.zkey"

  echo "  ✓ Phase 1 zkey generated"

  # 3. Contribute to phase 2 ceremony (in production: use real randomness)
  echo "ownly-random-contribution-$(date +%s)" | \
  snarkjs zkey contribute \
    "$BUILD_DIR/$NAME/${NAME}_0000.zkey" \
    "$BUILD_DIR/$NAME/${NAME}_final.zkey" \
    --name="Ownly Dev Contribution" -v

  echo "  ✓ Phase 2 contribution done"

  # 4. Export verification key (JSON)
  snarkjs zkey export verificationkey \
    "$BUILD_DIR/$NAME/${NAME}_final.zkey" \
    "$BUILD_DIR/$NAME/verification_key.json"

  echo "  ✓ Verification key exported"

  # 5. Generate Solidity verifier contract
  snarkjs zkey export solidityverifier \
    "$BUILD_DIR/$NAME/${NAME}_final.zkey" \
    "../contracts/src/${NAME}_verifier.sol"

  echo "  ✓ Solidity verifier generated → contracts/src/${NAME}_verifier.sol"
}

# Compile all three circuits
compile_circuit "age_over_18"  "./age"
compile_circuit "valid_license" "./license"
compile_circuit "residency"    "./residency"

echo ""
echo "══════════════════════════════════════════"
echo " All circuits compiled successfully!"
echo " Build artifacts in: $BUILD_DIR"
echo " Solidity verifiers in: ../contracts/src/"
echo "══════════════════════════════════════════"
