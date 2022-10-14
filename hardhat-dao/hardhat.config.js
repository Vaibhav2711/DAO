require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({path: ".env"});
/** @type import('hardhat/config').HardhatUserConfig */

QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL;
PRIVATE_KEY = process.env.PRIVATE_KEY;
module.exports = {
  solidity: "0.8.17",
  networks:{
    goerli:{
      url:QUICKNODE_HTTP_URL,
      accounts: [PRIVATE_KEY],
    }
  }
};
