const { ethers } = require("ethers");
const config = require("../config/env");

let activeProvider = null;
let activeSigner = null;

/**
 * Get or create ethers provider.
 * Connects to Sepolia RPC or local Hardhat RPC with staticNetwork configuration.
 */
function getProvider() {
  if (activeProvider) return activeProvider;

  const isSepolia = config.BLOCKCHAIN.NETWORK === "sepolia";
  const rpcUrl = isSepolia 
    ? config.BLOCKCHAIN.SEPOLIA_RPC_URL 
    : config.BLOCKCHAIN.LOCAL_RPC_URL;
  const chainId = isSepolia ? 11155111 : 31337;

  try {
    const network = new ethers.Network(isSepolia ? "sepolia" : "localhost", chainId);

    activeProvider = new ethers.JsonRpcProvider(rpcUrl, network, {
      staticNetwork: network
    });
  } catch (err) {
    console.warn(`[Blockchain Provider] Failed to initialize RPC provider for ${rpcUrl}:`, err.message);
  }

  return activeProvider;
}

/**
 * Get platform relayer / deployer signer if configured.
 */
function getSigner() {
  if (activeSigner) return activeSigner;

  const provider = getProvider();
  const privateKey = config.BLOCKCHAIN.DEPLOYER_PRIVATE_KEY;

  if (privateKey && privateKey.startsWith("0x") && privateKey.length === 66 && provider) {
    try {
      activeSigner = new ethers.Wallet(privateKey, provider);
      return activeSigner;
    } catch (err) {
      console.warn("[Blockchain Signer] Failed to initialize wallet signer:", err.message);
    }
  }

  return null;
}

/**
 * Query current network details and connection status.
 */
async function getNetworkInfo() {
  const isSepolia = config.BLOCKCHAIN.NETWORK === "sepolia";
  const expectedChainId = isSepolia ? 11155111 : 31337;
  const networkName = isSepolia ? "Ethereum Sepolia Testnet" : "Hardhat Local Testnet";
  const explorerUrl = isSepolia ? "https://sepolia.etherscan.io" : "http://localhost:8545";

  const provider = getProvider();
  if (!provider) {
    return {
      connected: false,
      networkName,
      chainId: expectedChainId,
      latestBlock: 5849120,
      gasPriceGwei: "1.500",
      explorerUrl,
      error: "RPC Provider unavailable"
    };
  }

  try {
    // Attempt with quick 1.5s timeout so backend never hangs if RPC is slow or offline
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("RPC Timeout")), 1500)
    );

    const [blockNumber, feeData] = await Promise.race([
      Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData()
      ]),
      timeoutPromise
    ]);

    const gasPriceGwei = feeData?.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "1.500";

    return {
      connected: true,
      networkName,
      chainId: expectedChainId,
      latestBlock: blockNumber,
      gasPriceGwei: parseFloat(gasPriceGwei).toFixed(3),
      explorerUrl,
      contractsDeployed: true
    };
  } catch (err) {
    return {
      connected: false,
      networkName,
      chainId: expectedChainId,
      latestBlock: 5849120,
      gasPriceGwei: "1.500",
      explorerUrl,
      error: err.message
    };
  }
}

module.exports = {
  getProvider,
  getSigner,
  getNetworkInfo
};
