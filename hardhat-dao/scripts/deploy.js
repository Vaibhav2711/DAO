// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const { CRYPTOMINION_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {

  const FakeMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");
  console.log(CRYPTOMINION_NFT_CONTRACT_ADDRESS)
  const fakeNFTMarketplace = await FakeMarketplace.deploy();
  await fakeNFTMarketplace.deployed();
  console.log("FakeMarketplace contract deployed at ", fakeNFTMarketplace.address);
  const CryptoMinionDAO = await ethers.getContractFactory("CryptoMinionDAO");
  const cryptoMinionDAO = await CryptoMinionDAO.deploy(fakeNFTMarketplace.address,CRYPTOMINION_NFT_CONTRACT_ADDRESS,{
    value: ethers.utils.parseEther("0.1"),
  });
  await cryptoMinionDAO.deployed();
  console.log("CryptoMinion DAO contract deployed at ",cryptoMinionDAO.address);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
