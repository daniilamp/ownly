const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BatchProcessor", () => {
  let registry, batch, owner, issuer, other;

  beforeEach(async () => {
    [owner, issuer, other] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("CredentialRegistry");
    registry = await Registry.deploy();

    const Batch = await ethers.getContractFactory("BatchProcessor");
    batch = await Batch.deploy(await registry.getAddress());

    // Authorize BatchProcessor as issuer in Registry
    await registry.addIssuer(await batch.getAddress());
    // Authorize issuer in BatchProcessor
    await batch.addIssuer(issuer.address);
  });

  describe("Adding commitments", () => {
    it("authorized issuer can add a commitment", async () => {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));
      await expect(batch.connect(issuer).addCommitment(commitment))
        .to.emit(batch, "CommitmentAdded")
        .withArgs(issuer.address, commitment, 0);
    });

    it("unauthorized address cannot add commitment", async () => {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));
      await expect(
        batch.connect(other).addCommitment(commitment)
      ).to.be.revertedWith("Not authorized issuer");
    });

    it("can add commitments in bulk", async () => {
      const commitments = Array.from({ length: 5 }, (_, i) =>
        ethers.keccak256(ethers.toUtf8Bytes(`cred-${i}`))
      );
      await batch.connect(issuer).addCommitmentsBulk(commitments);
      expect(await batch.getPendingCount(issuer.address)).to.equal(5);
    });
  });

  describe("Batch submission", () => {
    it("submits a single-leaf batch correctly", async () => {
      const leaf = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));
      await batch.connect(issuer).addCommitment(leaf);

      // Single leaf: root = leaf itself
      await expect(batch.connect(issuer).submitBatch(leaf))
        .to.emit(batch, "BatchSubmitted");

      // Pending buffer cleared
      expect(await batch.getPendingCount(issuer.address)).to.equal(0);
    });

    it("rejects wrong merkle root", async () => {
      const leaf = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));
      await batch.connect(issuer).addCommitment(leaf);

      const wrongRoot = ethers.keccak256(ethers.toUtf8Bytes("wrong"));
      await expect(
        batch.connect(issuer).submitBatch(wrongRoot)
      ).to.be.revertedWith("Merkle root mismatch");
    });

    it("rejects submission with no pending commitments", async () => {
      const root = ethers.keccak256(ethers.toUtf8Bytes("root"));
      await expect(
        batch.connect(issuer).submitBatch(root)
      ).to.be.revertedWith("No pending commitments");
    });
  });

  describe("Merkle proof verification", () => {
    it("verifies a valid 2-leaf Merkle proof", async () => {
      const leaf0 = ethers.keccak256(ethers.toUtf8Bytes("cred-0"));
      const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));

      // Compute root: sorted pair hash
      const [a, b] = leaf0 <= leaf1 ? [leaf0, leaf1] : [leaf1, leaf0];
      const root = ethers.keccak256(ethers.concat([a, b]));

      // Proof for leaf0: sibling is leaf1
      const proof = [leaf1];
      expect(await batch.verifyMerkleProof(leaf0, proof, root)).to.be.true;
    });

    it("rejects invalid Merkle proof", async () => {
      const leaf0 = ethers.keccak256(ethers.toUtf8Bytes("cred-0"));
      const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("cred-1"));
      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      expect(await batch.verifyMerkleProof(leaf0, [leaf1], fakeRoot)).to.be.false;
    });
  });
});
