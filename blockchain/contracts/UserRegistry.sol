// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserRegistry
 * @notice Role and identity verification registry for GreenLedger P2P Renewable Energy Trading.
 * Manages participant roles (PRODUCER, CONSUMER, ADMIN), meter identification hashes,
 * and admin verification status without storing any off-chain PII.
 */
contract UserRegistry is Ownable {
    enum Role { NONE, PRODUCER, CONSUMER, ADMIN }

    struct UserProfile {
        Role role;
        bool isVerified;
        bool isActive;
        string meterIdHash; // Cryptographic hash / identifier of physical/smart meter
        uint256 registeredAt;
        uint256 verifiedAt;
    }

    // Wallet address => UserProfile
    mapping(address => UserProfile) private _users;
    address[] private _registeredAddresses;

    // Events
    event UserRegistered(address indexed userAddress, Role indexed role, string meterIdHash);
    event UserVerified(address indexed userAddress, address indexed verifiedBy);
    event UserStatusUpdated(address indexed userAddress, bool isActive);
    event MeterUpdated(address indexed userAddress, string newMeterIdHash);

    // Modifiers
    modifier onlyRegistered(address account) {
        require(_users[account].role != Role.NONE, "UserRegistry: user not registered");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        // Register contract deployer as Admin
        _users[initialOwner] = UserProfile({
            role: Role.ADMIN,
            isVerified: true,
            isActive: true,
            meterIdHash: "ADMIN_ROOT_NODE",
            registeredAt: block.timestamp,
            verifiedAt: block.timestamp
        });
        _registeredAddresses.push(initialOwner);
        emit UserRegistered(initialOwner, Role.ADMIN, "ADMIN_ROOT_NODE");
        emit UserVerified(initialOwner, initialOwner);
    }

    /**
     * @notice Register a new participant on-chain.
     * @param account Participant Ethereum wallet address
     * @param role Role enum (1: PRODUCER, 2: CONSUMER, 3: ADMIN)
     * @param meterIdHash SHA-256 hash or identifier of simulated/physical smart meter
     */
    function registerUser(
        address account,
        Role role,
        string calldata meterIdHash
    ) external {
        require(account != address(0), "UserRegistry: zero address invalid");
        require(role == Role.PRODUCER || role == Role.CONSUMER || role == Role.ADMIN, "UserRegistry: invalid role");
        require(_users[account].role == Role.NONE, "UserRegistry: user already registered");
        require(bytes(meterIdHash).length > 0, "UserRegistry: meter ID hash required");

        // Producer/Consumer self-registration or admin registration
        if (role == Role.ADMIN) {
            require(msg.sender == owner(), "UserRegistry: only owner can register admin");
        } else {
            require(msg.sender == account || msg.sender == owner(), "UserRegistry: unauthorized registration caller");
        }

        _users[account] = UserProfile({
            role: role,
            isVerified: false,
            isActive: true,
            meterIdHash: meterIdHash,
            registeredAt: block.timestamp,
            verifiedAt: 0
        });

        _registeredAddresses.push(account);

        emit UserRegistered(account, role, meterIdHash);
    }

    /**
     * @notice Verify participant for trading eligibility. Admin only.
     */
    function verifyUser(address account) external onlyOwner onlyRegistered(account) {
        UserProfile storage profile = _users[account];
        require(!profile.isVerified, "UserRegistry: user already verified");
        profile.isVerified = true;
        profile.verifiedAt = block.timestamp;
        emit UserVerified(account, msg.sender);
    }

    /**
     * @notice Activate or deactivate a user account. Admin only.
     */
    function setUserActiveStatus(address account, bool isActive) external onlyOwner onlyRegistered(account) {
        _users[account].isActive = isActive;
        emit UserStatusUpdated(account, isActive);
    }

    /**
     * @notice Update smart meter hash if recalibrated or replaced.
     */
    function updateMeterIdHash(address account, string calldata newMeterIdHash) external {
        require(msg.sender == account || msg.sender == owner(), "UserRegistry: unauthorized meter update");
        require(_users[account].role != Role.NONE, "UserRegistry: user not registered");
        require(bytes(newMeterIdHash).length > 0, "UserRegistry: invalid meter hash");

        _users[account].meterIdHash = newMeterIdHash;
        emit MeterUpdated(account, newMeterIdHash);
    }

    // View Functions
    function getUser(address account) external view returns (UserProfile memory) {
        require(_users[account].role != Role.NONE, "UserRegistry: user not registered");
        return _users[account];
    }

    function isRegistered(address account) external view returns (bool) {
        return _users[account].role != Role.NONE;
    }

    function isVerifiedProducer(address account) external view returns (bool) {
        UserProfile memory u = _users[account];
        return u.role == Role.PRODUCER && u.isVerified && u.isActive;
    }

    function isVerifiedConsumer(address account) external view returns (bool) {
        UserProfile memory u = _users[account];
        return u.role == Role.CONSUMER && u.isVerified && u.isActive;
    }

    function getUserRole(address account) external view returns (Role) {
        return _users[account].role;
    }

    function totalRegisteredUsers() external view returns (uint256) {
        return _registeredAddresses.length;
    }

    function getRegisteredAddress(uint256 index) external view returns (address) {
        require(index < _registeredAddresses.length, "UserRegistry: index out of bounds");
        return _registeredAddresses[index];
    }
}
