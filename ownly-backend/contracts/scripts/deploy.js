/**
 * Ownly — Deployment Script
 * Target: Polygon zkEVM Testnet (Cardona) or zkSync Era Testnet
 *
 * Run:
 *   npx hardhat run scripts/deploy.js --network polygonZkEVM
 *   npx hardhat run scripts/deploy.js --network zkSyncTestnet
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ── 1. CredentialRegistry ──────────────────────────────────────────────────
  console.log("1/3 Deploying CredentialRegistry...");
  const Registry = await ethers.getContractFactory("CredentialRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   CredentialRegistry:", registryAddr);

  // ── 2. BatchProcessor ──────────────────────────────────────────────────────
  console.log("2/3 Deploying BatchProcessor...");
  const Batch = await ethers.getContractFactory("BatchProcessor");
  const batch = await Batch.deploy(registryAddr);
  await batch.waitForDeployment();
  const batchAddr = await batch.getAddress();
  console.log("   BatchProcessor:", batchAddr);

  // ── 3. VerifierContract ────────────────────────────────────────────────────
  console.log("3/3 Deploying VerifierContract...");
  const Verifier = await ethers.getContractFactory("VerifierContract");
  const verifier = await Verifier.deploy(registryAddr);
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("   VerifierContract:", verifierAddr);

  // ── Setup: authorize BatchProcessor as issuer in Registry ─────────────────
  console.log("\nSetting up roles...");
  await registry.addIssuer(batchAddr);
  console.log("   BatchProcessor authorized as issuer in Registry");

  // ── Output deployment addresses ───────────────────────────────────────────
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      CredentialRegistry: registryAddr,
      BatchProcessor: batchAddr,
      VerifierContract: verifierAddr,
    },
    deployedAt: new Date().toISOString(),
  };

  console.log("\n✅ Deployment complete:");
  console.log(JSON.stringify(deployment, null, 2));

  // Save to file for the API to consume
  const fs = require("fs");
  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log("\nAddresses saved to deployments.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
