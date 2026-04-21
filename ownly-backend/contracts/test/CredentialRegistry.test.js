const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", () => {
  let registry, owner, issuer1, issuer2, other;

  beforeEach(async () => {
    [owner, issuer1, issuer2, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CredentialRegistry");
    registry = await Registry.deploy();
  });

  describe("Issuer management", () => {
    it("owner can add an issuer", async () => {
      await registry.addIssuer(issuer1.address);
      expect(await registry.isIssuer(issuer1.address)).to.be.true;
    });

    it("non-owner cannot add an issuer", async () => {
      await expect(
        registry.connect(other).addIssuer(issuer1.address)
      ).to.be.revertedWith("Not owner");
    });

    it("owner can revoke an issuer", async () => {
      await registry.addIssuer(issuer1.address);
      await registry.revokeIssuer(issuer1.address);
      expect(await registry.isIssuer(issuer1.address)).to.be.false;
    });
  });

  describe("Batch publishing", () => {
    beforeEach(async () => {
      await registry.addIssuer(issuer1.address);
    });

    it("authorized issuer can publish a batch", async () => {
      const root = ethers.keccak256(ethers.toUtf8Bytes("batch-1"));
      await expect(registry.connect(issuer1).publishBatch(root))
        .to.emit(registry, "BatchPublished")
        .withArgs(issuer1.address, 0, root);
    });

    it("batch count increments correctly", async () => {
      const root1 = ethers.keccak256(ethers.toUtf8Bytes("batch-1"));
      const root2 = ethers.keccak256(ethers.toUtf8Bytes("batch-2"));
      await registry.connect(issuer1).publishBatch(root1);
      await registry.connect(issuer1).publishBatch(root2);
      expect(await registry.batchCount(issuer1.address)).to.equal(2);
    });

    it("unauthorized address cannot publish", async () => {
      const root = ethers.keccak256(ethers.toUtf8Bytes("batch-1"));
      await expect(
        registry.connect(other).publishBatch(root)
      ).to.be.revertedWith("Not authorized issuer");
    });

    it("getBatchRoot returns correct root", async () => {
      const root = ethers.keccak256(ethers.toUtf8Bytes("batch-1"));
      await registry.connect(issuer1).publishBatch(root);
      expect(await registry.getBatchRoot(issuer1.address, 0)).to.equal(root);
    });
  });

  describe("Nullifier management", () => {
    it("nullifier starts unused", async () => {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier-1"));
      expect(await registry.isNullifierUsed(nullifier)).to.be.false;
    });

    it("nullifier can be consumed", async () => {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier-1"));
      await registry.consumeNullifier(nullifier);
      expect(await registry.isNullifierUsed(nullifier)).to.be.true;
    });

    it("nullifier cannot be consumed twice", async () => {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier-1"));
      await registry.consumeNullifier(nullifier);
      await expect(
        registry.consumeNullifier(nullifier)
      ).to.be.revertedWith("Nullifier already used");
    });
  });
});
