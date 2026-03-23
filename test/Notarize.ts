import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Notarize", function () {
  async function deployNotarize() {
    const [deployer, otherAccount] = await ethers.getSigners();
    const notarize = await ethers.deployContract("Notarize");

    return { notarize, deployer, otherAccount };
  }

  it("stores the first notarization details", async function () {
    const { notarize, deployer } = await deployNotarize();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("rootstock-content"));

    const tx = await notarize.notarize(hash);
    const receipt = await tx.wait();

    expect(await notarize.notarizers(hash)).to.equal(deployer.address);
    expect(await notarize.firstBlockNumbers(hash)).to.equal(
      receipt!.blockNumber,
    );
  });

  it("emits the Notarized event with the first anchor details", async function () {
    const { notarize, deployer } = await deployNotarize();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("event-check"));

    await expect(notarize.notarize(hash))
      .to.emit(notarize, "Notarized")
      .withArgs(hash, deployer.address, anyUint256);
  });

  it("rejects a duplicate hash from the same wallet", async function () {
    const { notarize } = await deployNotarize();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("duplicate-same-wallet"));

    await notarize.notarize(hash);

    await expect(notarize.notarize(hash))
      .to.be.revertedWithCustomError(notarize, "HashAlreadyNotarized")
      .withArgs(hash);
  });

  it("rejects a duplicate hash from a different wallet", async function () {
    const { notarize, otherAccount } = await deployNotarize();
    const hash = ethers.keccak256(
      ethers.toUtf8Bytes("duplicate-different-wallet"),
    );

    await notarize.notarize(hash);

    await expect(notarize.connect(otherAccount).notarize(hash))
      .to.be.revertedWithCustomError(notarize, "HashAlreadyNotarized")
      .withArgs(hash);
  });

  it("returns empty values for an unknown hash", async function () {
    const { notarize } = await deployNotarize();
    const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("unknown-hash"));

    expect(await notarize.notarizers(unknownHash)).to.equal(ethers.ZeroAddress);
    expect(await notarize.firstBlockNumbers(unknownHash)).to.equal(0n);
  });

  it("rejects the zero hash sentinel", async function () {
    const { notarize } = await deployNotarize();

    await expect(notarize.notarize(ethers.ZeroHash)).to.be.revertedWithCustomError(
      notarize,
      "ZeroHashNotAllowed",
    );
  });
});

const anyUint256 = (value: bigint) => value >= 0n;
