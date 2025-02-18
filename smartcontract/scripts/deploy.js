const hre = require("hardhat");

async function main() {
  const LRLAsset = await hre.ethers.getContractFactory("LRLAsset");
  const lrlAsset = await LRLAsset.deploy();
  await lrlAsset.waitForDeployment();

  console.log("LRLAsset deployed to:", await lrlAsset.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
