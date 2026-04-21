require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Use a valid placeholder key when not set (Hardhat test account #0)
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY?.length === 66
  ? process.env.DEPLOYER_PRIVATE_KEY
  : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },

  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },

    // Polygon zkEVM Testnet (Cardona) — primary target
    polygonZkEVM: {
      url: "https://rpc.cardona.zkevm-rpc.com",
      chainId: 2442,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },

    // Polygon zkEVM Mainnet
    polygonZkEVMMainnet: {
      url: "https://zkevm-rpc.com",
      chainId: 1101,
      accounts: [PRIVATE_KEY],
    },

    // zkSync Era Testnet (alternative)
    zkSyncTestnet: {
      url: "https://sepolia.era.zksync.dev",
      chainId: 300,
      accounts: [PRIVATE_KEY],
    },

    // Polygon Amoy (PoS testnet, for cheaper testing)
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
      gasPrice: 30000000000, // 30 gwei — low but accepted on Amoy
    },
  },

  etherscan: {
    apiKey: {
      polygonZkEVM: POLYGONSCAN_API_KEY,
      polygonZkEVMMainnet: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonZkEVM",
        chainId: 2442,
        urls: {
          apiURL: "https://api-cardona-zkevm.polygonscan.com/api",
          browserURL: "https://cardona-zkevm.polygonscan.com",
        },
      },
    ],
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "EUR",
    coinmarketcap: process.env.CMC_API_KEY,
  },
};
