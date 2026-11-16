// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./UserRegistry.sol";

/**
 * @title EnergyMarketplace
 * @notice On-chain catalog of verified renewable energy offerings.
 * Stores listing parameters (energy source, quantity in kWh, price in wei) without any PII.
 */
contract EnergyMarketplace is Ownable {
    enum ListingStatus { ACTIVE, PAUSED, FULFILLED, CANCELLED }

    struct Listing {
        uint256 id;
        address producer;
        uint256 totalEnergyKwh;
        uint256 availableEnergyKwh;
        uint256 pricePerKwhWei;
        string energySource; // e.g. "SOLAR", "WIND", "HYDRO", "BIOMASS"
        ListingStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    UserRegistry public userRegistry;
    mapping(address => bool) public authorizedCallers;

    uint256 private _nextListingId = 1;
    mapping(uint256 => Listing) private _listings;
    uint256[] private _listingIds;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed producer,
        uint256 totalEnergyKwh,
        uint256 pricePerKwhWei,
        string energySource
    );
    event ListingStatusUpdated(uint256 indexed listingId, ListingStatus newStatus);
    event EnergyDeducted(uint256 indexed listingId, uint256 amountKwh, uint256 remainingAvailableKwh);
    event UserRegistryUpdated(address indexed newUserRegistry);
    event AuthorizedCallerUpdated(address indexed caller, bool isAuthorized);

    modifier onlyAuthorizedCaller() {
        require(msg.sender == owner() || authorizedCallers[msg.sender], "EnergyMarketplace: unauthorized caller");
        _;
    }

    constructor(address initialOwner, address _userRegistry) Ownable(initialOwner) {
        if (_userRegistry != address(0)) {
            userRegistry = UserRegistry(_userRegistry);
        }
    }

    function setUserRegistry(address _userRegistry) external onlyOwner {
        require(_userRegistry != address(0), "EnergyMarketplace: invalid registry address");
        userRegistry = UserRegistry(_userRegistry);
        emit UserRegistryUpdated(_userRegistry);
    }

    function setAuthorizedCaller(address caller, bool isAuthorized) external onlyOwner {
        require(caller != address(0), "EnergyMarketplace: invalid caller address");
        authorizedCallers[caller] = isAuthorized;
        emit AuthorizedCallerUpdated(caller, isAuthorized);
    }

    /**
     * @notice Create an on-chain renewable energy listing
     */
    function createListing(
        uint256 energyAmountKwh,
        uint256 pricePerKwhWei,
        string calldata energySource
    ) external returns (uint256) {
        require(energyAmountKwh > 0, "EnergyMarketplace: energy must be > 0");
        require(pricePerKwhWei > 0, "EnergyMarketplace: price must be > 0");
        require(bytes(energySource).length > 0, "EnergyMarketplace: energy source required");

        // Verify producer status if userRegistry is linked
        if (address(userRegistry) != address(0)) {
            require(userRegistry.isVerifiedProducer(msg.sender), "EnergyMarketplace: caller not verified producer");
        }

        uint256 listingId = _nextListingId++;

        _listings[listingId] = Listing({
            id: listingId,
            producer: msg.sender,
            totalEnergyKwh: energyAmountKwh,
            availableEnergyKwh: energyAmountKwh,
            pricePerKwhWei: pricePerKwhWei,
            energySource: energySource,
            status: ListingStatus.ACTIVE,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _listingIds.push(listingId);

        emit ListingCreated(listingId, msg.sender, energyAmountKwh, pricePerKwhWei, energySource);
        return listingId;
    }

    /**
     * @notice Update listing status (e.g. pause or cancel)
     */
    function updateListingStatus(uint256 listingId, ListingStatus newStatus) external {
        Listing storage listing = _listings[listingId];
        require(listing.id != 0, "EnergyMarketplace: listing does not exist");
        require(msg.sender == listing.producer || msg.sender == owner(), "EnergyMarketplace: unauthorized status update");

        listing.status = newStatus;
        listing.updatedAt = block.timestamp;

        emit ListingStatusUpdated(listingId, newStatus);
    }

    /**
     * @notice Deduct energy on settlement execution. Called by authorized EnergyTrading contract.
     */
    function deductEnergy(uint256 listingId, uint256 amountKwh) external onlyAuthorizedCaller {
        Listing storage listing = _listings[listingId];
        require(listing.id != 0, "EnergyMarketplace: listing does not exist");
        require(listing.status == ListingStatus.ACTIVE, "EnergyMarketplace: listing not active");
        require(listing.availableEnergyKwh >= amountKwh, "EnergyMarketplace: insufficient available energy");

        listing.availableEnergyKwh -= amountKwh;
        if (listing.availableEnergyKwh == 0) {
            listing.status = ListingStatus.FULFILLED;
        }
        listing.updatedAt = block.timestamp;

        emit EnergyDeducted(listingId, amountKwh, listing.availableEnergyKwh);
        if (listing.status == ListingStatus.FULFILLED) {
            emit ListingStatusUpdated(listingId, ListingStatus.FULFILLED);
        }
    }

    // View functions
    function getListing(uint256 listingId) external view returns (Listing memory) {
        require(_listings[listingId].id != 0, "EnergyMarketplace: listing does not exist");
        return _listings[listingId];
    }

    function totalListings() external view returns (uint256) {
        return _listingIds.length;
    }

    function isListingActive(uint256 listingId) external view returns (bool) {
        Listing memory l = _listings[listingId];
        return l.id != 0 && l.status == ListingStatus.ACTIVE && l.availableEnergyKwh > 0;
    }
}
