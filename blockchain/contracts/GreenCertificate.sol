// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GreenCertificate
 * @notice ERC-721 token representing a verified GreenLedger Renewable Energy Certificate (GL-REC).
 * Issued exclusively upon verified on-chain or off-chain settled green energy trades.
 * Strictly prevents duplicate certificate issuance for the same trade hash.
 */
contract GreenCertificate is ERC721URIStorage, Ownable {
    // Non-financial legal disclaimer
    string public constant DISCLAIMER = 
        "GreenLedger Renewable Energy Certificates (GL-REC) are non-financial environmental attribute tracking tokens for carbon accounting verification only. They do not constitute financial securities, investments, or yield-generating instruments.";

    uint256 private _nextTokenId;

    struct CertificateData {
        uint256 certificateId;
        address producer;
        address consumer;
        uint256 energyAmountKwh;    // Total green kilowatt-hours certified
        uint256 carbonSavedGrams;   // Grams of CO2 avoided relative to regional baseline
        string energySource;        // "SOLAR", "WIND", "HYDRO", "BIOMASS"
        uint256 issuanceTimestamp;
        bytes32 tradeHash;          // Unique cryptographic hash of trade settlement
        bool isRetired;
    }

    // Mapping from tokenId to Certificate metadata
    mapping(uint256 => CertificateData) private _certificates;

    // Mapping from tradeHash to tokenId to strictly prevent double-issuance
    mapping(bytes32 => uint256) public tradeHashToTokenId;

    // Authorized issuers (e.g., EnergyTrading settlement contract)
    mapping(address => bool) public authorizedIssuers;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed producer,
        address indexed consumer,
        uint256 energyAmountKwh,
        uint256 carbonSavedGrams,
        string energySource,
        bytes32 tradeHash
    );

    event CertificateRetired(uint256 indexed tokenId, address indexed retiredBy);
    event IssuerStatusUpdated(address indexed issuer, bool status);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorizedIssuers[msg.sender], "GreenCertificate: caller not authorized to issue");
        _;
    }

    constructor(address initialOwner) ERC721("GreenLedger Renewable Energy Certificate", "GL-REC") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    function setAuthorizedIssuer(address issuer, bool status) external onlyOwner {
        require(issuer != address(0), "GreenCertificate: invalid issuer address");
        authorizedIssuers[issuer] = status;
        emit IssuerStatusUpdated(issuer, status);
    }

    /**
     * @notice Issue a new GL-REC to the green energy consumer.
     * Guaranteed uniqueness per trade settlement hash.
     */
    function issueCertificate(
        address toConsumer,
        address fromProducer,
        uint256 energyAmountKwh,
        uint256 carbonSavedGrams,
        string calldata energySource,
        bytes32 tradeHash,
        string calldata tokenUri
    ) external onlyAuthorized returns (uint256) {
        require(toConsumer != address(0), "GreenCertificate: recipient cannot be zero address");
        require(fromProducer != address(0), "GreenCertificate: producer cannot be zero address");
        require(energyAmountKwh > 0, "GreenCertificate: energy amount must be > 0");
        require(tradeHash != bytes32(0), "GreenCertificate: trade hash required");
        require(tradeHashToTokenId[tradeHash] == 0, "GreenCertificate: certificate already issued for trade");

        uint256 tokenId = _nextTokenId++;
        tradeHashToTokenId[tradeHash] = tokenId;

        _safeMint(toConsumer, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }

        _certificates[tokenId] = CertificateData({
            certificateId: tokenId,
            producer: fromProducer,
            consumer: toConsumer,
            energyAmountKwh: energyAmountKwh,
            carbonSavedGrams: carbonSavedGrams,
            energySource: energySource,
            issuanceTimestamp: block.timestamp,
            tradeHash: tradeHash,
            isRetired: false
        });

        emit CertificateMinted(
            tokenId,
            fromProducer,
            toConsumer,
            energyAmountKwh,
            carbonSavedGrams,
            energySource,
            tradeHash
        );

        return tokenId;
    }

    /**
     * @notice Retire a certificate to claim green environmental attributes (preventing resale/double-counting)
     */
    function retireCertificate(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "GreenCertificate: only certificate owner can retire");
        require(!_certificates[tokenId].isRetired, "GreenCertificate: certificate already retired");

        _certificates[tokenId].isRetired = true;
        emit CertificateRetired(tokenId, msg.sender);
    }

    /**
     * @notice Verify and fetch certificate metadata
     */
    function getCertificate(uint256 tokenId) external view returns (CertificateData memory) {
        require(_certificates[tokenId].certificateId != 0, "GreenCertificate: non-existent certificate");
        return _certificates[tokenId];
    }

    function isCertificateValid(uint256 tokenId) external view returns (bool) {
        return _certificates[tokenId].certificateId != 0 && !_certificates[tokenId].isRetired;
    }

    function getCertificateByTradeHash(bytes32 tradeHash) external view returns (CertificateData memory) {
        uint256 tokenId = tradeHashToTokenId[tradeHash];
        require(tokenId != 0, "GreenCertificate: no certificate found for trade hash");
        return _certificates[tokenId];
    }

    function totalCertificatesIssued() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
