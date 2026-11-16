const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying GreenLedger Smart Contracts with account:", deployer ? deployer.address : "Unknown");
  console.log("Network:", hre.network.name);
  console.log("==================================================");

  // 1. Deploy GreenCertificate (ERC-721 REC)
  console.log("1. Deploying GreenCertificate contract...");
  const GreenCertificate = await hre.ethers.getContractFactory("GreenCertificate");
  const greenCertificate = await GreenCertificate.deploy(deployer.address);
  await greenCertificate.waitForDeployment();
  const certAddress = await greenCertificate.getAddress();
  console.log(">>> GreenCertificate deployed to:", certAddress);

  // 2. Deploy EnergyTrading (Settlement & Verification)
  console.log("2. Deploying EnergyTrading contract...");
  const EnergyTrading = await hre.ethers.getContractFactory("EnergyTrading");
  const energyTrading = await EnergyTrading.deploy(deployer.address);
  await energyTrading.waitForDeployment();
  const tradingAddress = await energyTrading.getAddress();
  console.log(">>> EnergyTrading deployed to:", tradingAddress);

  // 3. Link EnergyTrading as authorized issuer in GreenCertificate
  console.log("3. Authorizing EnergyTrading contract as issuer...");
  const authTx = await greenCertificate.setAuthorizedIssuer(tradingAddress, true);
  await authTx.wait();
  console.log(">>> EnergyTrading successfully authorized as REC issuer.");

  // 4. Link GreenCertificate inside EnergyTrading
  console.log("4. Setting GreenCertificate address in EnergyTrading...");
  const setCertTx = await energyTrading.setCertificateContract(certAddress);
  await setCertTx.wait();
  console.log(">>> Certificate contract registered in EnergyTrading.");

  console.log("==================================================");
  console.log("DEPLOYMENT COMPLETED SUCCESSFULLY");
  console.log("NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS=" + tradingAddress);
  console.log("NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=" + certAddress);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
