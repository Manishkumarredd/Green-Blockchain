const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { getProvider, getSigner } = require("./provider");
const config = require("../config/env");

let manifestCache = null;

/**
 * Load deployment manifest JSON.
 */
function getDeploymentManifest() {
  if (manifestCache) return manifestCache;

  const manifestPath = path.resolve(__dirname, "./deployedContracts.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      manifestCache = data;
      return data;
    } catch (err) {
      console.warn("[ContractService] Error reading deployedContracts.json:", err.message);
    }
  }

  // Fallback defaults
  return {
    network: config.BLOCKCHAIN.NETWORK,
    chainId: config.BLOCKCHAIN.NETWORK === "sepolia" ? 11155111 : 31337,
    contracts: {
      UserRegistry: { address: config.BLOCKCHAIN.USER_REGISTRY_CONTRACT, abi: [] },
      EnergyMarketplace: { address: config.BLOCKCHAIN.MARKETPLACE_CONTRACT, abi: [] },
      GreenCertificate: { address: config.BLOCKCHAIN.CERTIFICATE_CONTRACT, abi: [] },
      EnergyTrading: { address: config.BLOCKCHAIN.SETTLEMENT_CONTRACT, abi: [] }
    }
  };
}

/**
 * Helper to build contract instance.
 */
function getContract(name, customSignerOrProvider = null) {
  const manifest = getDeploymentManifest();
  const contractInfo = manifest.contracts?.[name];
  if (!contractInfo || !contractInfo.address) {
    throw new Error(`[ContractService] Contract "${name}" not found in deployment manifest.`);
  }

  const runner = customSignerOrProvider || getSigner() || getProvider();
  return new ethers.Contract(contractInfo.address, contractInfo.abi, runner);
}

function getUserRegistryContract(runner) {
  return getContract("UserRegistry", runner);
}

function getMarketplaceContract(runner) {
  return getContract("EnergyMarketplace", runner);
}

function getGreenCertificateContract(runner) {
  return getContract("GreenCertificate", runner);
}

function getEnergyTradingContract(runner) {
  return getContract("EnergyTrading", runner);
}

/**
 * Get formatted contracts list with Etherscan Sepolia links.
 */
function getContractsMetadata() {
  const manifest = getDeploymentManifest();
  const isSepolia = config.BLOCKCHAIN.NETWORK === "sepolia";
  const baseUrl = isSepolia ? "https://sepolia.etherscan.io/address/" : "http://localhost:8545/address/";

  return {
    network: manifest.network || "sepolia",
    chainId: manifest.chainId || (isSepolia ? 11155111 : 31337),
    contracts: {
      UserRegistry: {
        address: manifest.contracts.UserRegistry.address,
        explorerUrl: `${baseUrl}${manifest.contracts.UserRegistry.address}`,
        name: "UserRegistry",
        standard: "Custom Registry (Ownable)",
        description: "Participant role management, meter ID hashes, and admin verification."
      },
      EnergyMarketplace: {
        address: manifest.contracts.EnergyMarketplace.address,
        explorerUrl: `${baseUrl}${manifest.contracts.EnergyMarketplace.address}`,
        name: "EnergyMarketplace",
        standard: "Renewable Catalog (Ownable)",
        description: "Decentralized energy listings with source tagging and zero PII."
      },
      GreenCertificate: {
        address: manifest.contracts.GreenCertificate.address,
        explorerUrl: `${baseUrl}${manifest.contracts.GreenCertificate.address}`,
        name: "GreenCertificate (GL-REC)",
        standard: "ERC-721 URIStorage",
        symbol: "GL-REC",
        description: "Cryptographically verified Renewable Energy Certificates."
      },
      EnergyTrading: {
        address: manifest.contracts.EnergyTrading.address,
        explorerUrl: `${baseUrl}${manifest.contracts.EnergyTrading.address}`,
        name: "EnergyTrading",
        standard: "Settlement Clearinghouse (ReentrancyGuard)",
        description: "Trade proposal lifecycle, multi-party confirmation, and financial clearing."
      }
    }
  };
}

module.exports = {
  getDeploymentManifest,
  getContract,
  getUserRegistryContract,
  getMarketplaceContract,
  getGreenCertificateContract,
  getEnergyTradingContract,
  getContractsMetadata
};
