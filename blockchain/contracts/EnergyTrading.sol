// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GreenCertificate.sol";

/**
 * @title EnergyTrading
 * @notice Core settlement contract for GreenLedger P2P Energy Trading.
 * Maintains immutable trade settlements, verifies participants, and triggers REC issuance.
 */
contract EnergyTrading is Ownable {
    GreenCertificate public certificateContract;

    enum Role { NONE, PRODUCER, CONSUMER, ADMIN }
    enum SettlementStatus { PENDING, SETTLED, DISPUTED, CANCELLED }

    struct UserProfile {
        Role role;
        bool isActive;
        string meterIdHash; // Off-chain simulated meter identifier hash
    }

    struct TradeSettlement {
        bytes32 tradeHash;
        address producer;
        address consumer;
        uint256 energyAmountKwh;
        uint256 pricePerKwhWei;
        uint256 totalAmountWei;
        uint256 settlementTimestamp;
        SettlementStatus status;
        string energySource;
        uint256 certificateTokenId;
    }

    mapping(address => UserProfile) public users;
    mapping(bytes32 => TradeSettlement) public settlements;
    bytes32[] public settlementHashes;

    event UserRegistered(address indexed userAddress, Role role, string meterIdHash);
    event UserStatusChanged(address indexed userAddress, bool isActive);
    event SettlementRecorded(
        bytes32 indexed tradeHash,
        address indexed producer,
        address indexed consumer,
        uint256 energyAmountKwh,
        uint256 totalAmountWei,
        uint256 certificateTokenId
    );
    event SettlementDisputed(bytes32 indexed tradeHash, string reason);
    event CertificateContractUpdated(address indexed newCertificateContract);

    modifier onlyRegisteredProducer(address account) {
        require(users[account].role == Role.PRODUCER && users[account].isActive, "EnergyTrading: not an active producer");
        _;
    }

    modifier onlyRegisteredConsumer(address account) {
        require(users[account].role == Role.CONSUMER && users[account].isActive, "EnergyTrading: not an active consumer");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        users[initialOwner] = UserProfile({
            role: Role.ADMIN,
            isActive: true,
            meterIdHash: "ADMIN_OFF_GRID"
        });
    }

    function setCertificateContract(address _certificateContract) external onlyOwner {
        require(_certificateContract != address(0), "EnergyTrading: invalid certificate address");
        certificateContract = GreenCertificate(_certificateContract);
        emit CertificateContractUpdated(_certificateContract);
    }

    /**
     * @notice Register user role on-chain
     */
    function registerUser(address account, Role role, string calldata meterIdHash) external onlyOwner {
        require(account != address(0), "EnergyTrading: zero address invalid");
        require(role != Role.NONE, "EnergyTrading: role must be specified");
        
        users[account] = UserProfile({
            role: role,
            isActive: true,
            meterIdHash: meterIdHash
        });

        emit UserRegistered(account, role, meterIdHash);
    }

    function setUserActiveStatus(address account, bool isActive) external onlyOwner {
        require(users[account].role != Role.NONE, "EnergyTrading: user not registered");
        users[account].isActive = isActive;
        emit UserStatusChanged(account, isActive);
    }

    /**
     * @notice Record a verified off-chain matched energy trade on-chain.
     * Can also trigger REC minting if certificate contract is set.
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
    ) external onlyOwner returns (uint256) {
        require(settlements[tradeHash].tradeHash == bytes32(0), "EnergyTrading: settlement already exists");
        require(producer != address(0) && consumer != address(0), "EnergyTrading: invalid participant addresses");
        require(energyAmountKwh > 0, "EnergyTrading: energy amount must be > 0");

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

        settlements[tradeHash] = TradeSettlement({
            tradeHash: tradeHash,
            producer: producer,
            consumer: consumer,
            energyAmountKwh: energyAmountKwh,
            pricePerKwhWei: pricePerKwhWei,
            totalAmountWei: totalAmountWei,
            settlementTimestamp: block.timestamp,
            status: SettlementStatus.SETTLED,
            energySource: energySource,
            certificateTokenId: certTokenId
        });

        settlementHashes.push(tradeHash);

        emit SettlementRecorded(
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
     * @notice Direct on-chain settlement where consumer sends ETH payment
     */
    function settleTradeDirect(
        bytes32 tradeHash,
        address payable producer,
        uint256 energyAmountKwh,
        uint256 pricePerKwhWei,
        string calldata energySource,
        uint256 carbonSavedGrams,
        string calldata certificateUri
    ) external payable returns (uint256) {
        require(settlements[tradeHash].tradeHash == bytes32(0), "EnergyTrading: trade hash already settled");
        uint256 requiredWei = energyAmountKwh * pricePerKwhWei;
        require(msg.value >= requiredWei, "EnergyTrading: insufficient payment sent");

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

        settlements[tradeHash] = TradeSettlement({
            tradeHash: tradeHash,
            producer: producer,
            consumer: msg.sender,
            energyAmountKwh: energyAmountKwh,
            pricePerKwhWei: pricePerKwhWei,
            totalAmountWei: requiredWei,
            settlementTimestamp: block.timestamp,
            status: SettlementStatus.SETTLED,
            energySource: energySource,
            certificateTokenId: certTokenId
        });

        settlementHashes.push(tradeHash);

        // Forward payment to producer
        (bool sent, ) = producer.call{value: requiredWei}("");
        require(sent, "EnergyTrading: failed to transfer payment to producer");

        // Refund any excess
        if (msg.value > requiredWei) {
            (bool refundSent, ) = payable(msg.sender).call{value: msg.value - requiredWei}("");
            require(refundSent, "EnergyTrading: refund failed");
        }

        emit SettlementRecorded(tradeHash, producer, msg.sender, energyAmountKwh, requiredWei, certTokenId);
        return certTokenId;
    }

    /**
     * @notice Dispute settlement for administrative arbitration
     */
    function disputeSettlement(bytes32 tradeHash, string calldata reason) external {
        TradeSettlement storage s = settlements[tradeHash];
        require(s.tradeHash != bytes32(0), "EnergyTrading: trade does not exist");
        require(msg.sender == s.producer || msg.sender == s.consumer || msg.sender == owner(), "EnergyTrading: unauthorized dispute initiator");
        require(s.status == SettlementStatus.SETTLED, "EnergyTrading: trade not in settled state");

        s.status = SettlementStatus.DISPUTED;
        emit SettlementDisputed(tradeHash, reason);
    }

    function getSettlement(bytes32 tradeHash) external view returns (TradeSettlement memory) {
        require(settlements[tradeHash].tradeHash != bytes32(0), "EnergyTrading: trade does not exist");
        return settlements[tradeHash];
    }

    function totalSettlements() external view returns (uint256) {
        return settlementHashes.length;
    }
}
