import "dotenv/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
  chainDescriptors: {
    31: {
      name: "Rootstock Testnet",
      chainType: "l1",
      blockExplorers: {
        blockscout: {
          name: "Rootstock Testnet Blockscout",
          url: "https://rootstock-testnet.blockscout.com/",
          apiUrl: "https://rootstock-testnet.blockscout.com/api/",
        },
      },
    },
  },
  verify: {
    etherscan: {
      enabled: false,
    },
    sourcify: {
      enabled: false,
    },
    blockscout: {
      enabled: true,
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    rootstockTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 31,
      url: configVariable("ROOTSTOCK_TESTNET_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});
