// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./UserRegistry.sol";
import "./EnergyMarketplace.sol";
import "./GreenCertificate.sol";

/**
 * @title EnergyTrading
 * @notice Core settlement engine for GreenLedger P2P Renewable Energy Trading.
 * Coordinates trade proposals, mutual participant confirmations, atomic settlement,
 * on-chain financial clearing (in Sepolia ETH/Wei), and automated GL-REC issuance.
 */
contract EnergyTrading is Ownable, ReentrancyGuard {
    enum TradeStatus { NONE, CREATED, CONFIRMED, SETTLED, CANCELLED, DISPUTED }

    struct Trade {
        bytes32 tradeHash;
        uint256 listingId;
        address producer;
        address consumer;
        uint256 energyAmountKwh;
        uint256 pricePerKwhWei;
        uint256 totalAmountWei;
        string energySource;
        TradeStatus status;
        bool producerConfirmed;
        bool consumerConfirmed;
        uint256 settlementTimestamp;
        uint256 certificateTokenId;
    }

    struct SettlementParams {
        bytes32 tradeHash;
        uint256 listingId;
        address producer;
        address consumer;
        uint256 energyAmountKwh;
        uint256 pricePerKwhWei;
        uint256 totalAmountWei;
        string energySource;
        uint256 carbonSavedGrams;
        string certificateUri;
    }

    UserRegistry public userRegistry;
    EnergyMarketplace public marketplaceContract;
    GreenCertificate public certificateContract;

    mapping(bytes32 => Trade) public trades;
    bytes32[] public tradeHashes;

    // Events
    event TradeCreated(
        bytes32 indexed tradeHash,
        address indexed producer,
        address indexed consumer,
        uint256 energyAmountKwh,
        uint256 totalAmountWei,
        string energySource
    );
    event TradeConfirmed(bytes32 indexed tradeHash, address indexed confirmedBy);
    event TradeSettled(
        bytes32 indexed tradeHash,
        address indexed producer,
        address indexed consumer,
        uint256 energyAmountKwh,
        uint256 totalAmountWei,
        uint256 certificateTokenId
    );
    event TradeCancelled(bytes32 indexed tradeHash, string reason);
    event SettlementDisputed(bytes32 indexed tradeHash, string reason);

    event ContractDependenciesUpdated(
        address indexed userRegistry,
        address indexed marketplaceContract,
        address indexed certificateContract
    );

    constructor(
        address initialOwner,
        address _userRegistry,
        address _marketplaceContract,
        address _certificateContract
    ) Ownable(initialOwner) {
        if (_userRegistry != address(0)) userRegistry = UserRegistry(_userRegistry);
        if (_marketplaceContract != address(0)) marketplaceContract = EnergyMarketplace(_marketplaceContract);
        if (_certificateContract != address(0)) certificateContract = GreenCertificate(_certificateContract);
    }

    function setDependencies(
        address _userRegistry,
        address _marketplaceContract,
        address _certificateContract
    ) external onlyOwner {
        if (_userRegistry != address(0)) userRegistry = UserRegistry(_userRegistry);
        if (_marketplaceContract != address(0)) marketplaceContract = EnergyMarketplace(_marketplaceContract);
        if (_certificateContract != address(0)) certificateContract = GreenCertificate(_certificateContract);

        emit ContractDependenciesUpdated(_userRegistry, _marketplaceContract, _certificateContract);
    }

    function setCertificateContract(address _certificateContract) external onlyOwner {
        require(_certificateContract != address(0), "EnergyTrading: invalid certificate address");
        certificateContract = GreenCertificate(_certificateContract);
    }

    /**
     * @notice Create a trade proposal based on off-chain double-auction or DA-WPA match
     */
    function createTradeProposal(
        bytes32 tradeHash,
        uint256 listingId,
        address producer,
        address consumer,
        uint256 energyAmountKwh,
        uint256 pricePerKwhWei,
        string calldata energySource
    ) external {
        require(tradeHash != bytes32(0), "EnergyTrading: invalid trade hash");
        require(trades[tradeHash].status == TradeStatus.NONE, "EnergyTrading: trade already exists");
        require(producer != address(0) && consumer != address(0), "EnergyTrading: invalid participants");
        require(producer != consumer, "EnergyTrading: producer and consumer must be different");
        require(energyAmountKwh > 0, "EnergyTrading: energy amount must be > 0");

        // Only participants or platform owner/relayer can propose
        require(
            msg.sender == owner() || msg.sender == producer || msg.sender == consumer,
            "EnergyTrading: unauthorized proposal creator"
        );

        uint256 totalAmountWei = energyAmountKwh * pricePerKwhWei;

        trades[tradeHash] = Trade({
            tradeHash: tradeHash,
            listingId: listingId,
            producer: producer,
            consumer: consumer,
            energyAmountKwh: energyAmountKwh,
            pricePerKwhWei: pricePerKwhWei,
            totalAmountWei: totalAmountWei,
            energySource: energySource,
            status: TradeStatus.CREATED,
            producerConfirmed: (msg.sender == producer),
            consumerConfirmed: (msg.sender == consumer),
            settlementTimestamp: 0,
            certificateTokenId: 0
        });

        tradeHashes.push(tradeHash);

        emit TradeCreated(tradeHash, producer, consumer, energyAmountKwh, totalAmountWei, energySource);
    }

    /**
     * @notice Participant confirms trade proposal
     */
    function confirmTrade(bytes32 tradeHash) external {
        Trade storage t = trades[tradeHash];
        require(t.status == TradeStatus.CREATED || t.status == TradeStatus.CONFIRMED, "EnergyTrading: trade cannot be confirmed");
        require(msg.sender == t.producer || msg.sender == t.consumer || msg.sender == owner(), "EnergyTrading: unauthorized confirmer");

        if (msg.sender == t.producer) {
            t.producerConfirmed = true;
        } else if (msg.sender == t.consumer) {
            t.consumerConfirmed = true;
        } else if (msg.sender == owner()) {
            t.producerConfirmed = true;
            t.consumerConfirmed = true;
        }

        if (t.producerConfirmed && t.consumerConfirmed) {
            t.status = TradeStatus.CONFIRMED;
        }

        emit TradeConfirmed(tradeHash, msg.sender);
    }

    /**
     * @notice Settle confirmed trade, mint GL-REC certificate, and deduct energy from listing
     */
    function settleTrade(
        bytes32 tradeHash,
        uint256 carbonSavedGrams,
        string calldata certificateUri
    ) external nonReentrant returns (uint256) {
        Trade storage t = trades[tradeHash];
        require(t.status != TradeStatus.NONE, "EnergyTrading: trade does not exist");
        require(t.status != TradeStatus.SETTLED, "EnergyTrading: trade already settled");
        require(t.status != TradeStatus.CANCELLED, "EnergyTrading: trade was cancelled");
        require(
            t.status == TradeStatus.CONFIRMED || msg.sender == owner(),
            "EnergyTrading: trade not confirmed by both parties"
        );

        t.status = TradeStatus.SETTLED;
        t.settlementTimestamp = block.timestamp;

        // Mint Renewable Energy Certificate if certificate contract is linked
        uint256 certTokenId = 0;
        if (address(certificateContract) != address(0)) {
            certTokenId = certificateContract.issueCertificate(
                t.consumer,
                t.producer,
                t.energyAmountKwh,
                carbonSavedGrams,
                t.energySource,
                tradeHash,
                certificateUri
            );
            t.certificateTokenId = certTokenId;
        }

        // Deduct energy from marketplace listing if linked and listingId > 0
        if (address(marketplaceContract) != address(0) && t.listingId > 0) {
            try marketplaceContract.deductEnergy(t.listingId, t.energyAmountKwh) {} catch {}
        }

        emit TradeSettled(
            tradeHash,
            t.producer,
            t.consumer,
            t.energyAmountKwh,
            t.totalAmountWei,
            certTokenId
        );

        return certTokenId;
    }

    /**
     * @notice Direct clearing and settlement with on-chain native Sepolia ETH payment
     */
    function settleTradeDirect(
        bytes32 tradeHash,
        address payable producer,
        uint256 energyAmountKwh,
        uint256 pricePerKwhWei,
        string calldata energySource,
        uint256 carbonSavedGrams,
        string calldata certificateUri
    ) external payable nonReentrant returns (uint256) {
        Trade storage t = trades[tradeHash];
        require(t.status != TradeStatus.SETTLED, "EnergyTrading: trade already settled");
        require(producer != address(0), "EnergyTrading: invalid producer address");
        require(producer != msg.sender, "EnergyTrading: producer cannot buy from self");

        uint256 requiredWei = energyAmountKwh * pricePerKwhWei;
        require(msg.value >= requiredWei, "EnergyTrading: insufficient Sepolia ETH sent");

        uint256 certTokenId = 0;
        if (address(certificateContract) != address(0)) {
            certTokenId = certificateContract.issueCertificate(
                msg.sender,
                producer,
                energyAmountKwh,
                carbonSavedGrams,
                energySource,
                tradeHash,
                certificateUri
            );
        }

        if (t.status == TradeStatus.NONE) {
            tradeHashes.push(tradeHash);
        }

        trades[tradeHash] = Trade({
            tradeHash: tradeHash,
            listingId: 0,
            producer: producer,
            consumer: msg.sender,
            energyAmountKwh: energyAmountKwh,
            pricePerKwhWei: pricePerKwhWei,
            totalAmountWei: requiredWei,
            energySource: energySource,
            status: TradeStatus.SETTLED,
            producerConfirmed: true,
            consumerConfirmed: true,
            settlementTimestamp: block.timestamp,
            certificateTokenId: certTokenId
        });

        // Forward Sepolia ETH payment directly to producer
        (bool sent, ) = producer.call{value: requiredWei}("");
        require(sent, "EnergyTrading: ETH payment transfer failed");

        // Refund any excess Wei sent by consumer
        if (msg.value > requiredWei) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - requiredWei}("");
            require(refunded, "EnergyTrading: excess refund failed");
        }

        emit TradeSettled(
            tradeHash,
            producer,
            msg.sender,
            energyAmountKwh,
            requiredWei,
            certTokenId
        );

        return certTokenId;
    }

    /**
     * @notice Admin / backend settlement recording for verified algorithmic matching batches.
     * Compatible with Phase 7 & Phase 8 settlements.
     */
    function recordSettlement(
        bytes32 tradeHash,
        address producer,
        address consumer,
        uint256 energyAmountKwh,
        uint256 pricePerKwhWei,
        uint256 totalAmountWei,
        string calldata energySource,
        uint256 carbonSavedGrams,
        string calldata certificateUri
    ) external onlyOwner nonReentrant returns (uint256) {
        require(tradeHash != bytes32(0), "EnergyTrading: invalid trade hash");
        require(trades[tradeHash].status != TradeStatus.SETTLED, "EnergyTrading: trade already settled");
        require(producer != address(0) && consumer != address(0), "EnergyTrading: invalid participants");

        uint256 certTokenId = 0;
        if (address(certificateContract) != address(0)) {
            certTokenId = certificateContract.issueCertificate(
                consumer,
                producer,
                energyAmountKwh,
                carbonSavedGrams,
                energySource,
                tradeHash,
                certificateUri
            );
        }

        if (trades[tradeHash].status == TradeStatus.NONE) {
            tradeHashes.push(tradeHash);
        }

        trades[tradeHash] = Trade({
            tradeHash: tradeHash,
            listingId: 0,
            producer: producer,
            consumer: consumer,
            energyAmountKwh: energyAmountKwh,
            pricePerKwhWei: pricePerKwhWei,
            totalAmountWei: totalAmountWei,
            energySource: energySource,
            status: TradeStatus.SETTLED,
            producerConfirmed: true,
            consumerConfirmed: true,
            settlementTimestamp: block.timestamp,
            certificateTokenId: certTokenId
        });

        emit TradeSettled(
            tradeHash,
            producer,
            consumer,
            energyAmountKwh,
            totalAmountWei,
            certTokenId
        );

        return certTokenId;
    }

    /**
     * @notice Cancel trade before settlement
     */
    function cancelTrade(bytes32 tradeHash, string calldata reason) external {
        Trade storage t = trades[tradeHash];
        require(t.status != TradeStatus.NONE, "EnergyTrading: trade does not exist");
        require(t.status != TradeStatus.SETTLED, "EnergyTrading: cannot cancel settled trade");
        require(
            msg.sender == t.producer || msg.sender == t.consumer || msg.sender == owner(),
            "EnergyTrading: unauthorized cancellation caller"
        );

        t.status = TradeStatus.CANCELLED;
        emit TradeCancelled(tradeHash, reason);
    }

    /**
     * @notice Dispute trade settlement for administrative arbitration
     */
    function disputeSettlement(bytes32 tradeHash, string calldata reason) external {
        Trade storage t = trades[tradeHash];
        require(t.status == TradeStatus.SETTLED, "EnergyTrading: only settled trade can be disputed");
        require(
            msg.sender == t.producer || msg.sender == t.consumer || msg.sender == owner(),
            "EnergyTrading: unauthorized dispute initiator"
        );

        t.status = TradeStatus.DISPUTED;
        emit SettlementDisputed(tradeHash, reason);
    }

    // View Functions
    function getTrade(bytes32 tradeHash) external view returns (Trade memory) {
        require(trades[tradeHash].status != TradeStatus.NONE, "EnergyTrading: trade does not exist");
        return trades[tradeHash];
    }

    function totalTrades() external view returns (uint256) {
        return tradeHashes.length;
    }

    function isTradeSettled(bytes32 tradeHash) external view returns (bool) {
        return trades[tradeHash].status == TradeStatus.SETTLED;
    }
}
