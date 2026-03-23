import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "rootstockTestnet",
  chainType: "l1",
});

const notarize = await ethers.deployContract("Notarize");
await notarize.waitForDeployment();

const deploymentTx = notarize.deploymentTransaction();
const deploymentAddress = await notarize.getAddress();

console.log("Notarize deployed");
console.log("Address:", deploymentAddress);

if (deploymentTx !== null) {
  console.log("Deployment transaction:", deploymentTx.hash);
}
