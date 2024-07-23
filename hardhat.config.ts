import * as dotenv from "dotenv"
import { HardhatUserConfig } from "hardhat/types"

import "@nomicfoundation/hardhat-toolbox"
import "hardhat-gas-reporter"
import "solidity-coverage"
import "hardhat-deploy"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      metadata: {
        // Not including the metadata hash
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      viaIR: true,
    },
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  namedAccounts: {
    deployer: 0,
    user: 1,
    tester: 2,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
}

export default config
