const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GreenLedger Smart Contracts Suite (Phase 9)", function () {
  let owner;
  let producer;
  let consumer;
  let unauthorized;
  let userRegistry;
  let marketplace;
  let greenCertificate;
  let energyTrading;

  beforeEach(async function () {
    [owner, producer, consumer, unauthorized] = await ethers.getSigners();

    // 1. Deploy UserRegistry
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy(owner.address);
    await userRegistry.waitForDeployment();
    const userRegistryAddress = await userRegistry.getAddress();

    // 2. Deploy EnergyMarketplace
    const EnergyMarketplace = await ethers.getContractFactory("EnergyMarketplace");
    marketplace = await EnergyMarketplace.deploy(owner.address, userRegistryAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();

    // 3. Deploy GreenCertificate
    const GreenCertificate = await ethers.getContractFactory("GreenCertificate");
    greenCertificate = await GreenCertificate.deploy(owner.address);
    await greenCertificate.waitForDeployment();
    const certificateAddress = await greenCertificate.getAddress();

    // 4. Deploy EnergyTrading
    const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
    energyTrading = await EnergyTrading.deploy(
      owner.address,
      userRegistryAddress,
      marketplaceAddress,
      certificateAddress
    );
    await energyTrading.waitForDeployment();
    const tradingAddress = await energyTrading.getAddress();

    // 5. Authorize EnergyTrading to issue certificates and deduct marketplace energy
    await greenCertificate.setAuthorizedIssuer(tradingAddress, true);
    await marketplace.setAuthorizedCaller(tradingAddress, true);

    // 6. Register & verify producer and consumer in UserRegistry
    // Role enum: 0 = NONE, 1 = PRODUCER, 2 = CONSUMER, 3 = ADMIN
    await userRegistry.registerUser(producer.address, 1, "METER-PROD-SOL-101");
    await userRegistry.registerUser(consumer.address, 2, "METER-CONS-DAT-501");
    await userRegistry.verifyUser(producer.address);
    await userRegistry.verifyUser(consumer.address);
  });

  describe("1. UserRegistry", function () {
    it("should set deployer as verified ADMIN on deployment", async function () {
      const user = await userRegistry.getUser(owner.address);
      expect(user.role).to.equal(3); // ADMIN
      expect(user.isVerified).to.be.true;
      expect(user.isActive).to.be.true;
    });

    it("should register and verify producer and consumer correctly", async function () {
      expect(await userRegistry.isVerifiedProducer(producer.address)).to.be.true;
      expect(await userRegistry.isVerifiedConsumer(consumer.address)).to.be.true;
      expect(await userRegistry.isVerifiedProducer(consumer.address)).to.be.false;
    });

    it("should prevent duplicate user registration", async function () {
      await expect(
        userRegistry.registerUser(producer.address, 1, "METER-DUPLICATE")
      ).to.be.revertedWith("UserRegistry: user already registered");
    });

    it("should allow admin to deactivate and reactivate a user", async function () {
      await userRegistry.setUserActiveStatus(producer.address, false);
      expect(await userRegistry.isVerifiedProducer(producer.address)).to.be.false;

      await userRegistry.setUserActiveStatus(producer.address, true);
      expect(await userRegistry.isVerifiedProducer(producer.address)).to.be.true;
    });
  });

  describe("2. EnergyMarketplace", function () {
    it("should allow verified producer to create an energy listing", async function () {
      const tx = await marketplace.connect(producer).createListing(
        150, // 150 kWh
        ethers.parseEther("0.000088"), // 0.000088 ETH per kWh
        "SOLAR"
      );
      await tx.wait();

      const listing = await marketplace.getListing(1);
      expect(listing.producer).to.equal(producer.address);
      expect(listing.totalEnergyKwh).to.equal(150);
      expect(listing.availableEnergyKwh).to.equal(150);
      expect(listing.energySource).to.equal("SOLAR");
      expect(listing.status).to.equal(0); // ACTIVE
    });

    it("should reject listing creation from unverified producer", async function () {
      await expect(
        marketplace.connect(unauthorized).createListing(100, ethers.parseEther("0.0001"), "WIND")
      ).to.be.revertedWith("EnergyMarketplace: caller not verified producer");
    });

    it("should allow producer to update status or cancel listing", async function () {
      await marketplace.connect(producer).createListing(100, ethers.parseEther("0.0001"), "WIND");
      await marketplace.connect(producer).updateListingStatus(1, 3); // CANCELLED

      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(3);
      expect(await marketplace.isListingActive(1)).to.be.false;
    });
  });

  describe("3. GreenCertificate (GL-REC ERC-721)", function () {
    it("should expose the non-financial legal disclaimer", async function () {
      const disclaimer = await greenCertificate.DISCLAIMER();
      expect(disclaimer).to.include("non-financial environmental attribute tracking tokens");
    });

    it("should reject unauthorized callers from issuing certificates", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("UNAUTHORIZED_TRADE"));
      await expect(
        greenCertificate.connect(unauthorized).issueCertificate(
          consumer.address,
          producer.address,
          50,
          41000,
          "SOLAR",
          tradeHash,
          "ipfs://sample"
        )
      ).to.be.revertedWith("GreenCertificate: caller not authorized to issue");
    });

    it("should strictly prevent duplicate certificate issuance for the same trade hash", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("DUPLICATE_REC_TEST"));

      // Direct issuance from owner (authorized)
      await greenCertificate.issueCertificate(
        consumer.address,
        producer.address,
        50,
        41000,
        "SOLAR",
        tradeHash,
        "ipfs://rec/1"
      );

      // Attempting to issue again with the exact same tradeHash must fail
      await expect(
        greenCertificate.issueCertificate(
          consumer.address,
          producer.address,
          50,
          41000,
          "SOLAR",
          tradeHash,
          "ipfs://rec/2"
        )
      ).to.be.revertedWith("GreenCertificate: certificate already issued for trade");
    });

    it("should allow certificate owner to retire it permanently", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("RETIREMENT_TEST"));
      await greenCertificate.issueCertificate(
        consumer.address,
        producer.address,
        75,
        61500,
        "WIND",
        tradeHash,
        "ipfs://rec/retire"
      );

      expect(await greenCertificate.isCertificateValid(1)).to.be.true;

      // Consumer retires the certificate
      await greenCertificate.connect(consumer).retireCertificate(1);

      expect(await greenCertificate.isCertificateValid(1)).to.be.false;
      const cert = await greenCertificate.getCertificate(1);
      expect(cert.isRetired).to.be.true;

      // Cannot retire already retired certificate
      await expect(
        greenCertificate.connect(consumer).retireCertificate(1)
      ).to.be.revertedWith("GreenCertificate: certificate already retired");
    });
  });

  describe("4. EnergyTrading Settlement & Matching Execution", function () {
    it("should record off-chain algorithmic match settlement and mint REC", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("MATCH_BATCH_P9_001"));
      const energyAmountKwh = 80;
      const pricePerKwhWei = ethers.parseEther("0.000088");
      const totalAmountWei = ethers.parseEther("0.00704");
      const carbonSavedGrams = 65600; // 65.6 kg CO2
      const certUri = "ipfs://QmGreenLedgerRecMetadata/1.json";

      const tx = await energyTrading.recordSettlement(
        tradeHash,
        producer.address,
        consumer.address,
        energyAmountKwh,
        pricePerKwhWei,
        totalAmountWei,
        "SOLAR",
        carbonSavedGrams,
        certUri
      );
      await tx.wait();

      const trade = await energyTrading.getTrade(tradeHash);
      expect(trade.producer).to.equal(producer.address);
      expect(trade.consumer).to.equal(consumer.address);
      expect(trade.energyAmountKwh).to.equal(80);
      expect(trade.status).to.equal(3); // SETTLED
      expect(trade.certificateTokenId).to.equal(1);

      // Verify REC ownership by consumer
      expect(await greenCertificate.ownerOf(1)).to.equal(consumer.address);
      const cert = await greenCertificate.getCertificate(1);
      expect(cert.energyAmountKwh).to.equal(80);
      expect(cert.carbonSavedGrams).to.equal(65600);
      expect(cert.tradeHash).to.equal(tradeHash);
    });

    it("should prevent duplicate settlement of the same trade hash", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("DOUBLE_SETTLE_TEST"));
      await energyTrading.recordSettlement(
        tradeHash,
        producer.address,
        consumer.address,
        50,
        ethers.parseEther("0.0001"),
        ethers.parseEther("0.005"),
        "HYDRO",
        41000,
        "ipfs://test"
      );

      await expect(
        energyTrading.recordSettlement(
          tradeHash,
          producer.address,
          consumer.address,
          50,
          ethers.parseEther("0.0001"),
          ethers.parseEther("0.005"),
          "HYDRO",
          41000,
          "ipfs://test"
        )
      ).to.be.revertedWith("EnergyTrading: trade already settled");
    });

    it("should support proposal creation, mutual confirmations, and settlement", async function () {
      // 1. Create listing
      await marketplace.connect(producer).createListing(100, ethers.parseEther("0.0001"), "SOLAR");

      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("PROPOSAL_CYCLE_001"));
      
      // 2. Propose trade
      await energyTrading.connect(producer).createTradeProposal(
        tradeHash,
        1, // listingId
        producer.address,
        consumer.address,
        40,
        ethers.parseEther("0.0001"),
        "SOLAR"
      );

      let trade = await energyTrading.getTrade(tradeHash);
      expect(trade.status).to.equal(1); // CREATED
      expect(trade.producerConfirmed).to.be.true;
      expect(trade.consumerConfirmed).to.be.false;

      // 3. Consumer confirms
      await energyTrading.connect(consumer).confirmTrade(tradeHash);
      trade = await energyTrading.getTrade(tradeHash);
      expect(trade.status).to.equal(2); // CONFIRMED
      expect(trade.consumerConfirmed).to.be.true;

      // 4. Settle trade
      await energyTrading.settleTrade(tradeHash, 32800, "ipfs://cert/proposal");
      trade = await energyTrading.getTrade(tradeHash);
      expect(trade.status).to.equal(3); // SETTLED

      // 5. Listing energy deducted in Marketplace
      const listing = await marketplace.getListing(1);
      expect(listing.availableEnergyKwh).to.equal(60); // 100 - 40
    });

    it("should execute direct on-chain Sepolia ETH clearing and refund excess", async function () {
      const tradeHash = ethers.keccak256(ethers.toUtf8Bytes("DIRECT_ETH_PAYMENT"));
      const energyAmountKwh = 10;
      const pricePerKwhWei = ethers.parseEther("0.001");
      const requiredWei = ethers.parseEther("0.01");
      const sentWei = ethers.parseEther("0.015"); // 0.005 excess to be refunded

      const producerBalanceBefore = await ethers.provider.getBalance(producer.address);

      const tx = await energyTrading.connect(consumer).settleTradeDirect(
        tradeHash,
        producer.address,
        energyAmountKwh,
        pricePerKwhWei,
        "SOLAR",
        8200,
        "ipfs://cert/direct",
        { value: sentWei }
      );
      await tx.wait();

      const producerBalanceAfter = await ethers.provider.getBalance(producer.address);
      expect(producerBalanceAfter - producerBalanceBefore).to.equal(requiredWei);

      const trade = await energyTrading.getTrade(tradeHash);
      expect(trade.status).to.equal(3); // SETTLED
      expect(trade.totalAmountWei).to.equal(requiredWei);
    });
  });
});
