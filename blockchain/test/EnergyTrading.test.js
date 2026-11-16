const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GreenLedger Smart Contracts", function () {
  let greenCertificate;
  let energyTrading;
  let owner;
  let producer;
  let consumer;
  let otherAccount;

  beforeEach(async function () {
    [owner, producer, consumer, otherAccount] = await ethers.getSigners();

    // Deploy GreenCertificate
    const GreenCertificate = await ethers.getContractFactory("GreenCertificate");
    greenCertificate = await GreenCertificate.deploy(owner.address);
    await greenCertificate.waitForDeployment();

    // Deploy EnergyTrading
    const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
    energyTrading = await EnergyTrading.deploy(owner.address);
    await energyTrading.waitForDeployment();

    // Setup cross-contract authorizations
    const certAddress = await greenCertificate.getAddress();
    const tradingAddress = await energyTrading.getAddress();

    await greenCertificate.setAuthorizedIssuer(tradingAddress, true);
    await energyTrading.setCertificateContract(certAddress);
  });

  describe("Deployment & Configuration", function () {
    it("Should correctly set the owner of contracts", async function () {
      expect(await greenCertificate.owner()).to.equal(owner.address);
      expect(await energyTrading.owner()).to.equal(owner.address);
    });

    it("Should authorize EnergyTrading to issue certificates", async function () {
      const tradingAddress = await energyTrading.getAddress();
      expect(await greenCertificate.authorizedIssuers(tradingAddress)).to.equal(true);
    });
  });

  describe("User Registration", function () {
    it("Should allow admin to register a producer and consumer", async function () {
      // Role enum: 0 = NONE, 1 = PRODUCER, 2 = CONSUMER, 3 = ADMIN
      await energyTrading.registerUser(producer.address, 1, "METER_PRODUCER_001");
      await energyTrading.registerUser(consumer.address, 2, "METER_CONSUMER_001");

      const producerProfile = await energyTrading.users(producer.address);
      expect(producerProfile.role).to.equal(1);
      expect(producerProfile.isActive).to.equal(true);

      const consumerProfile = await energyTrading.users(consumer.address);
      expect(consumerProfile.role).to.equal(2);
      expect(consumerProfile.isActive).to.equal(true);
    });
  });

  describe("Trade Settlement & Certificate Issuance", function () {
    it("Should record trade settlement and automatically mint REC", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("TRADE_OFFCHAIN_BATCH_001"));
      const energyAmountKwh = 50; // 50 kWh
      const pricePerKwhWei = ethers.parseEther("0.0001");
      const totalAmountWei = ethers.parseEther("0.005");
      const carbonSavedGrams = 25000; // 25 kg CO2
      const certificateUri = "ipfs://QmSampleHashForGreenREC/1.json";

      const tx = await energyTrading.recordSettlement(
        tradeHash,
        producer.address,
        consumer.address,
        energyAmountKwh,
        pricePerKwhWei,
        totalAmountWei,
        "SOLAR",
        carbonSavedGrams,
        certificateUri
      );

      await tx.wait();

      const settlement = await energyTrading.getSettlement(tradeHash);
      expect(settlement.producer).to.equal(producer.address);
      expect(settlement.consumer).to.equal(consumer.address);
      expect(settlement.energyAmountKwh).to.equal(50);
      expect(settlement.certificateTokenId).to.equal(1);

      // Verify certificate ownership
      expect(await greenCertificate.ownerOf(1)).to.equal(consumer.address);

      // Verify certificate metadata
      const certData = await greenCertificate.getCertificate(1);
      expect(certData.energyAmountKwh).to.equal(50);
      expect(certData.energySource).to.equal("SOLAR");
      expect(certData.carbonSavedGrams).to.equal(25000);
      expect(certData.isRetired).to.equal(false);
    });

    it("Should allow certificate owner to retire it", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("TRADE_RETIRE_TEST"));
      await energyTrading.recordSettlement(
        tradeHash,
        producer.address,
        consumer.address,
        100,
        ethers.parseEther("0.0001"),
        ethers.parseEther("0.01"),
        "WIND",
        50000,
        "ipfs://sample"
      );

      // Consumer retires the certificate
      await greenCertificate.connect(consumer).retireCertificate(1);
      const certData = await greenCertificate.getCertificate(1);
      expect(certData.isRetired).to.equal(true);
      expect(await greenCertificate.isCertificateValid(1)).to.equal(false);
    });
  });
});
