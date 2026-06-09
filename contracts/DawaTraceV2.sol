// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DawaTraceV2
 * @dev Pharmaceutical Anti-Counterfeit Verification with RBAC, GS1, Recalls, and Risk Scoring
 *
 * Architecture:
 *   Admin → grants roles to Manufacturers, Distributors, Pharmacies, Regulators
 *   Manufacturer → registers products with GS1 identifiers
 *   Distributor/Pharmacy → records custody transfers
 *   Regulator → issues recalls
 *   Consumer (anyone) → verifies products, reports counterfeits
 */
contract DawaTraceV2 is AccessControl {

    // ============================================================
    //                        ROLES
    // ============================================================

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE   = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE      = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE     = keccak256("REGULATOR_ROLE");

    // ============================================================
    //                        TYPES
    // ============================================================

    struct Participant {
        string name;
        string licenseNumber;
        bool   isActive;
        uint256 registeredAt;
    }

    struct Product {
        string  gtin;              // GS1 Global Trade Item Number (14 digits)
        string  serialNumber;      // Unique serial per saleable unit
        string  lotNumber;         // Batch/lot identifier
        string  productName;       // Human-readable drug name
        string  manufacturer;      // Manufacturer name string
        address manufacturerAddr;  // Manufacturer wallet
        uint256 manufactureDate;
        uint256 expiryDate;
        bool    exists;
        bool    isRecalled;
        string  recallReason;
    }

    struct CustodyRecord {
        address from;
        address to;
        uint256 timestamp;
        string  location;
        string  eventType;   // "manufactured", "shipped", "received", "dispensed"
    }

    struct VerificationResult {
        bool    exists;
        bool    isAuthentic;
        bool    isExpired;
        bool    isRecalled;
        string  status;           // GENUINE, EXPIRED, RECALLED, SUSPICIOUS, COUNTERFEIT
        uint256 scanCount;
        string  productName;
        string  gtin;
        string  serialNumber;
        string  lotNumber;
        string  manufacturer;
        uint256 manufactureDate;
        uint256 expiryDate;
        uint256 custodyCount;
        string  recallReason;
    }

    // ============================================================
    //                       STORAGE
    // ============================================================

    // Participants
    mapping(address => Participant) public participants;
    address[] public participantAddresses;

    // Products: productId (bytes32) => Product
    mapping(bytes32 => Product) public products;
    bytes32[] public productIds;

    // Custody chain: productId => CustodyRecord[]
    mapping(bytes32 => CustodyRecord[]) public custodyChain;

    // Current holder
    mapping(bytes32 => address) public currentHolder;

    // Scan/verification counters
    mapping(bytes32 => uint256) public scanCount;
    uint256 public totalScans;

    // Lot recall tracking
    mapping(string => bool) public recalledLots;
    mapping(string => string) public lotRecallReasons;

    // Metrics
    uint256 public totalProducts;
    uint256 public totalRecalls;

    // ============================================================
    //                        EVENTS
    // ============================================================

    event ParticipantRegistered(address indexed participant, string name, bytes32 role, uint256 timestamp);
    event ParticipantDeactivated(address indexed participant, uint256 timestamp);
    event ProductRegistered(bytes32 indexed productId, string gtin, string serialNumber, string lotNumber, address indexed manufacturer, uint256 expiryDate);
    event CustodyTransferred(bytes32 indexed productId, address indexed from, address indexed to, string location, string eventType, uint256 timestamp);
    event ProductVerified(bytes32 indexed productId, address indexed verifier, string status, uint256 scanCount, uint256 timestamp);
    event ProductRecalled(bytes32 indexed productId, string reason, address indexed recaller, uint256 timestamp);
    event LotRecalled(string lotNumber, string reason, address indexed recaller, uint256 timestamp);
    event CounterfeitReported(bytes32 indexed productId, address indexed reporter, string location, uint256 timestamp);

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============================================================
    //                 PARTICIPANT MANAGEMENT
    // ============================================================

    /**
     * @notice Register a participant and grant them a supply-chain role
     * @param _participant Address to register
     * @param _name Organization name
     * @param _licenseNumber Official license/registration number
     * @param _role The role bytes32 (MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, etc.)
     */
    function registerParticipant(
        address _participant,
        string memory _name,
        string memory _licenseNumber,
        bytes32 _role
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!participants[_participant].isActive, "Already registered");
        require(bytes(_name).length > 0, "Name required");
        require(
            _role == MANUFACTURER_ROLE || _role == DISTRIBUTOR_ROLE ||
            _role == PHARMACY_ROLE || _role == REGULATOR_ROLE,
            "Invalid role"
        );

        participants[_participant] = Participant({
            name: _name,
            licenseNumber: _licenseNumber,
            isActive: true,
            registeredAt: block.timestamp
        });

        participantAddresses.push(_participant);
        _grantRole(_role, _participant);

        emit ParticipantRegistered(_participant, _name, _role, block.timestamp);
    }

    /**
     * @notice Deactivate a compromised or non-compliant participant
     */
    function deactivateParticipant(address _participant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(participants[_participant].isActive, "Not active");
        participants[_participant].isActive = false;

        // Revoke all supply chain roles
        _revokeRole(MANUFACTURER_ROLE, _participant);
        _revokeRole(DISTRIBUTOR_ROLE, _participant);
        _revokeRole(PHARMACY_ROLE, _participant);
        _revokeRole(REGULATOR_ROLE, _participant);

        emit ParticipantDeactivated(_participant, block.timestamp);
    }

    // ============================================================
    //                  PRODUCT REGISTRATION
    // ============================================================

    /**
     * @notice Register a new pharmaceutical product (GS1-compatible)
     * @param _gtin GS1 Global Trade Item Number
     * @param _serialNumber Unique serial number per package
     * @param _lotNumber Batch/lot number
     * @param _productName Human-readable drug name
     * @param _expiryDate Expiry as unix timestamp
     * @return productId The keccak256 hash used as unique on-chain identifier
     */
    function registerProduct(
        string memory _gtin,
        string memory _serialNumber,
        string memory _lotNumber,
        string memory _productName,
        uint256 _expiryDate
    ) external onlyRole(MANUFACTURER_ROLE) returns (bytes32) {
        require(bytes(_gtin).length > 0, "GTIN required");
        require(bytes(_serialNumber).length > 0, "Serial required");
        require(bytes(_lotNumber).length > 0, "Lot required");
        require(_expiryDate > block.timestamp, "Expiry must be future");

        // Deterministic ID from GTIN + serial (length-prefixed to avoid encodePacked collisions)
        bytes32 productId = computeProductId(_gtin, _serialNumber);
        require(!products[productId].exists, "Product already registered");

        // Check if lot is already recalled
        bool lotRecalled = recalledLots[_lotNumber];

        products[productId] = Product({
            gtin: _gtin,
            serialNumber: _serialNumber,
            lotNumber: _lotNumber,
            productName: _productName,
            manufacturer: participants[msg.sender].name,
            manufacturerAddr: msg.sender,
            manufactureDate: block.timestamp,
            expiryDate: _expiryDate,
            exists: true,
            isRecalled: lotRecalled,
            recallReason: lotRecalled ? lotRecallReasons[_lotNumber] : ""
        });

        productIds.push(productId);
        currentHolder[productId] = msg.sender;
        totalProducts++;

        // Initial custody record
        custodyChain[productId].push(CustodyRecord({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            location: "Manufacturing Facility",
            eventType: "manufactured"
        }));

        emit ProductRegistered(productId, _gtin, _serialNumber, _lotNumber, msg.sender, _expiryDate);
        return productId;
    }

    // ============================================================
    //                   CUSTODY TRANSFER
    // ============================================================

    /**
     * @notice Transfer product custody to another registered participant
     */
    function transferCustody(
        bytes32 _productId,
        address _to,
        string memory _location,
        string memory _eventType
    ) external {
        require(products[_productId].exists, "Product does not exist");
        require(currentHolder[_productId] == msg.sender, "You don't hold this product");
        require(participants[_to].isActive, "Recipient not registered or inactive");
        require(_to != msg.sender, "Cannot transfer to yourself");

        // Caller must have a supply chain role
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(PHARMACY_ROLE, msg.sender),
            "Caller has no supply chain role"
        );

        currentHolder[_productId] = _to;

        custodyChain[_productId].push(CustodyRecord({
            from: msg.sender,
            to: _to,
            timestamp: block.timestamp,
            location: _location,
            eventType: _eventType
        }));

        emit CustodyTransferred(_productId, msg.sender, _to, _location, _eventType, block.timestamp);
    }

    // ============================================================
    //                     VERIFICATION
    // ============================================================

    /**
     * @notice Verify a product — read-only alias of verifyProductView (no state mutation)
     * @dev Scan counters are deprecated; verification must not mutate on-chain state.
     */
    function verifyProduct(bytes32 _productId) external view returns (VerificationResult memory) {
        return _buildVerificationResult(_productId);
    }

    /**
     * @notice Verify a product — read-only, no gas cost
     */
    function verifyProductView(bytes32 _productId) external view returns (VerificationResult memory) {
        return _buildVerificationResult(_productId);
    }

    /**
     * @dev Internal verification logic with multi-status determination
     */
    function _buildVerificationResult(bytes32 _productId) internal view returns (VerificationResult memory) {
        Product memory p = products[_productId];

        if (!p.exists) {
            return VerificationResult({
                exists: false,
                isAuthentic: false,
                isExpired: false,
                isRecalled: false,
                status: "NOT_FOUND",
                scanCount: scanCount[_productId],
                productName: "",
                gtin: "",
                serialNumber: "",
                lotNumber: "",
                manufacturer: "",
                manufactureDate: 0,
                expiryDate: 0,
                custodyCount: 0,
                recallReason: ""
            });
        }

        bool expired = block.timestamp > p.expiryDate;
        bool recalled = p.isRecalled || recalledLots[p.lotNumber];
        uint256 scans = scanCount[_productId];
        uint256 custody = custodyChain[_productId].length;

        // Determine status with priority: RECALLED > EXPIRED > GENUINE
        string memory status;
        if (recalled) {
            status = "RECALLED";
        } else if (expired) {
            status = "EXPIRED";
        } else {
            status = "GENUINE";
        }

        string memory recallReason = p.recallReason;
        if (bytes(recallReason).length == 0 && recalledLots[p.lotNumber]) {
            recallReason = lotRecallReasons[p.lotNumber];
        }

        return VerificationResult({
            exists: true,
            isAuthentic: !recalled && !expired,
            isExpired: expired,
            isRecalled: recalled,
            status: status,
            scanCount: scans,
            productName: p.productName,
            gtin: p.gtin,
            serialNumber: p.serialNumber,
            lotNumber: p.lotNumber,
            manufacturer: p.manufacturer,
            manufactureDate: p.manufactureDate,
            expiryDate: p.expiryDate,
            custodyCount: custody,
            recallReason: recallReason
        });
    }

    // ============================================================
    //                      RECALLS
    // ============================================================

    /**
     * @notice Recall a specific product
     */
    function recallProduct(bytes32 _productId, string memory _reason) external {
        require(
            hasRole(REGULATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only regulator or admin"
        );
        require(products[_productId].exists, "Product does not exist");

        products[_productId].isRecalled = true;
        products[_productId].recallReason = _reason;
        totalRecalls++;

        emit ProductRecalled(_productId, _reason, msg.sender, block.timestamp);
    }

    /**
     * @notice Recall an entire lot
     */
    function recallLot(string memory _lotNumber, string memory _reason) external {
        require(
            hasRole(REGULATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only regulator or admin"
        );

        recalledLots[_lotNumber] = true;
        lotRecallReasons[_lotNumber] = _reason;
        totalRecalls++;

        emit LotRecalled(_lotNumber, _reason, msg.sender, block.timestamp);
    }

    // ============================================================
    //                  COUNTERFEIT REPORTING
    // ============================================================

    /**
     * @notice Anyone can report suspected counterfeit
     */
    function reportCounterfeit(bytes32 _productId, string memory _location) external {
        emit CounterfeitReported(_productId, msg.sender, _location, block.timestamp);
    }

    // ============================================================
    //                    VIEW FUNCTIONS
    // ============================================================

    function getCustodyChain(bytes32 _productId) external view returns (CustodyRecord[] memory) {
        return custodyChain[_productId];
    }

    function getTotalProducts() external view returns (uint256) {
        return totalProducts;
    }

    function getTotalParticipants() external view returns (uint256) {
        return participantAddresses.length;
    }

    function getProductIdAtIndex(uint256 index) external view returns (bytes32) {
        require(index < productIds.length, "Index out of bounds");
        return productIds[index];
    }

    /**
     * @notice Deterministic product ID — must match frontend keccak256(abi.encode(gtin, serial))
     */
    function computeProductId(string memory _gtin, string memory _serialNumber) public pure returns (bytes32) {
        return keccak256(abi.encode(_gtin, _serialNumber));
    }

    function getParticipantRole(address _addr) external view returns (string memory) {
        if (hasRole(DEFAULT_ADMIN_ROLE, _addr)) return "ADMIN";
        if (hasRole(MANUFACTURER_ROLE, _addr)) return "MANUFACTURER";
        if (hasRole(DISTRIBUTOR_ROLE, _addr)) return "DISTRIBUTOR";
        if (hasRole(PHARMACY_ROLE, _addr)) return "PHARMACY";
        if (hasRole(REGULATOR_ROLE, _addr)) return "REGULATOR";
        return "CONSUMER";
    }
}
