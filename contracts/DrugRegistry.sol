// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DrugRegistry
 * @dev DEPRECATED — legacy V1 contract. Use DawaTraceV2.sol and scripts/deploy-v2.js instead.
 * @dev DawaTrace - Pharmaceutical Anti-Counterfeit Verification System
 * @notice This contract manages the registration and verification of pharmaceutical
 *         products on the blockchain to combat counterfeit medicines in Kenya/Africa.
 *
 * Architecture:
 *   Manufacturer → Distributor → Pharmacy → Consumer (verification)
 *   Each step in the supply chain is recorded immutably on-chain.
 */
contract DrugRegistry {

    // ============================================================
    //                          TYPES
    // ============================================================

    enum Role { None, Manufacturer, Distributor, Pharmacy }

    struct Participant {
        string name;
        string licenseNumber;
        Role role;
        bool isRegistered;
        uint256 registeredAt;
    }

    struct DrugBatch {
        string drugName;
        string batchNumber;
        string manufacturerName;
        address manufacturer;
        uint256 manufactureDate;
        uint256 expiryDate;
        string ipfsMetadataHash; // Additional metadata stored on IPFS
        bool exists;
    }

    struct CustodyRecord {
        address from;
        address to;
        uint256 timestamp;
        string location;
        Role fromRole;
        Role toRole;
    }

    struct VerificationResult {
        bool isAuthentic;
        string drugName;
        string batchNumber;
        string manufacturerName;
        uint256 manufactureDate;
        uint256 expiryDate;
        bool isExpired;
        uint256 custodyCount;
    }

    // ============================================================
    //                        STORAGE
    // ============================================================

    address public owner;

    // Participants (manufacturers, distributors, pharmacies)
    mapping(address => Participant) public participants;
    address[] public participantAddresses;

    // Drug batches: batchId => DrugBatch
    mapping(bytes32 => DrugBatch) public drugBatches;
    bytes32[] public batchIds;

    // Custody chain: batchId => CustodyRecord[]
    mapping(bytes32 => CustodyRecord[]) public custodyChain;

    // Current holder of a batch
    mapping(bytes32 => address) public currentHolder;

    // Verification counter for analytics
    mapping(bytes32 => uint256) public verificationCount;
    uint256 public totalVerifications;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event ParticipantRegistered(
        address indexed participant,
        string name,
        Role role,
        uint256 timestamp
    );

    event DrugBatchRegistered(
        bytes32 indexed batchId,
        string drugName,
        string batchNumber,
        address indexed manufacturer,
        uint256 expiryDate
    );

    event CustodyTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        string location,
        uint256 timestamp
    );

    event DrugVerified(
        bytes32 indexed batchId,
        address indexed verifier,
        bool isAuthentic,
        bool isExpired,
        uint256 timestamp
    );

    event CounterfeitReported(
        bytes32 indexed batchId,
        address indexed reporter,
        string location,
        uint256 timestamp
    );

    // ============================================================
    //                       MODIFIERS
    // ============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(participants[msg.sender].isRegistered, "Caller is not registered");
        _;
    }

    modifier onlyManufacturer() {
        require(
            participants[msg.sender].role == Role.Manufacturer,
            "Only manufacturers can perform this action"
        );
        _;
    }

    modifier batchExists(bytes32 batchId) {
        require(drugBatches[batchId].exists, "Drug batch does not exist");
        _;
    }

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    constructor() {
        owner = msg.sender;
    }

    // ============================================================
    //                  PARTICIPANT MANAGEMENT
    // ============================================================

    /**
     * @notice Register a new participant (manufacturer, distributor, or pharmacy)
     * @param _participant Address of the participant
     * @param _name Name of the organization
     * @param _licenseNumber Official license/registration number
     * @param _role Role in the supply chain
     */
    function registerParticipant(
        address _participant,
        string memory _name,
        string memory _licenseNumber,
        Role _role
    ) external onlyOwner {
        require(!participants[_participant].isRegistered, "Already registered");
        require(_role != Role.None, "Invalid role");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_licenseNumber).length > 0, "License number required");

        participants[_participant] = Participant({
            name: _name,
            licenseNumber: _licenseNumber,
            role: _role,
            isRegistered: true,
            registeredAt: block.timestamp
        });

        participantAddresses.push(_participant);

        emit ParticipantRegistered(_participant, _name, _role, block.timestamp);
    }

    // ============================================================
    //                  DRUG BATCH MANAGEMENT
    // ============================================================

    /**
     * @notice Register a new drug batch (manufacturers only)
     * @param _drugName Name of the drug
     * @param _batchNumber Manufacturer's batch number
     * @param _expiryDate Expiry date as unix timestamp
     * @param _ipfsHash IPFS hash for additional metadata
     * @return batchId The unique identifier for this batch on-chain
     */
    function registerDrugBatch(
        string memory _drugName,
        string memory _batchNumber,
        uint256 _expiryDate,
        string memory _ipfsHash
    ) external onlyManufacturer returns (bytes32) {
        require(bytes(_drugName).length > 0, "Drug name required");
        require(bytes(_batchNumber).length > 0, "Batch number required");
        require(_expiryDate > block.timestamp, "Expiry must be in the future");

        // Generate unique batch ID from batch number deterministically
        bytes32 batchId = keccak256(bytes(_batchNumber));

        require(!drugBatches[batchId].exists, "Batch ID collision");

        drugBatches[batchId] = DrugBatch({
            drugName: _drugName,
            batchNumber: _batchNumber,
            manufacturerName: participants[msg.sender].name,
            manufacturer: msg.sender,
            manufactureDate: block.timestamp,
            expiryDate: _expiryDate,
            ipfsMetadataHash: _ipfsHash,
            exists: true
        });

        batchIds.push(batchId);
        currentHolder[batchId] = msg.sender;

        // Record initial custody
        custodyChain[batchId].push(CustodyRecord({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            location: "Manufacturing Facility",
            fromRole: Role.None,
            toRole: Role.Manufacturer
        }));

        emit DrugBatchRegistered(
            batchId,
            _drugName,
            _batchNumber,
            msg.sender,
            _expiryDate
        );

        return batchId;
    }

    // ============================================================
    //                   CUSTODY TRANSFER
    // ============================================================

    /**
     * @notice Transfer custody of a drug batch to the next participant
     * @param _batchId The batch to transfer
     * @param _to The recipient address (must be a registered participant)
     * @param _location Current location/facility name
     */
    function transferCustody(
        bytes32 _batchId,
        address _to,
        string memory _location
    ) external onlyRegistered batchExists(_batchId) {
        require(currentHolder[_batchId] == msg.sender, "You don't hold this batch");
        require(participants[_to].isRegistered, "Recipient not registered");
        require(_to != msg.sender, "Cannot transfer to yourself");

        Role fromRole = participants[msg.sender].role;
        Role toRole = participants[_to].role;

        // Enforce supply chain order: Manufacturer -> Distributor -> Pharmacy
        if (fromRole == Role.Manufacturer) {
            require(
                toRole == Role.Distributor || toRole == Role.Pharmacy,
                "Manufacturer can only transfer to distributor or pharmacy"
            );
        } else if (fromRole == Role.Distributor) {
            require(
                toRole == Role.Pharmacy || toRole == Role.Distributor,
                "Distributor can only transfer to pharmacy or another distributor"
            );
        }

        currentHolder[_batchId] = _to;

        custodyChain[_batchId].push(CustodyRecord({
            from: msg.sender,
            to: _to,
            timestamp: block.timestamp,
            location: _location,
            fromRole: fromRole,
            toRole: toRole
        }));

        emit CustodyTransferred(_batchId, msg.sender, _to, _location, block.timestamp);
    }

    // ============================================================
    //                     VERIFICATION
    // ============================================================

    /**
     * @notice Verify a drug batch's authenticity (anyone can call)
     * @param _batchId The batch ID to verify (from QR code)
     * @return result The verification result with full provenance details
     */
    function verifyDrug(bytes32 _batchId)
        external
        returns (VerificationResult memory result)
    {
        verificationCount[_batchId]++;
        totalVerifications++;

        if (!drugBatches[_batchId].exists) {
            // Drug not found — potential counterfeit
            emit DrugVerified(_batchId, msg.sender, false, false, block.timestamp);
            return VerificationResult({
                isAuthentic: false,
                drugName: "",
                batchNumber: "",
                manufacturerName: "",
                manufactureDate: 0,
                expiryDate: 0,
                isExpired: false,
                custodyCount: 0
            });
        }

        DrugBatch memory batch = drugBatches[_batchId];
        bool isExpired = block.timestamp > batch.expiryDate;

        emit DrugVerified(_batchId, msg.sender, true, isExpired, block.timestamp);

        return VerificationResult({
            isAuthentic: true,
            drugName: batch.drugName,
            batchNumber: batch.batchNumber,
            manufacturerName: batch.manufacturerName,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            isExpired: isExpired,
            custodyCount: custodyChain[_batchId].length
        });
    }

    /**
     * @notice Read-only verification (no gas cost, no event emitted)
     * @param _batchId The batch ID to verify
     */
    function verifyDrugView(bytes32 _batchId)
        external
        view
        returns (VerificationResult memory)
    {
        if (!drugBatches[_batchId].exists) {
            return VerificationResult({
                isAuthentic: false,
                drugName: "",
                batchNumber: "",
                manufacturerName: "",
                manufactureDate: 0,
                expiryDate: 0,
                isExpired: false,
                custodyCount: 0
            });
        }

        DrugBatch memory batch = drugBatches[_batchId];
        bool isExpired = block.timestamp > batch.expiryDate;

        return VerificationResult({
            isAuthentic: true,
            drugName: batch.drugName,
            batchNumber: batch.batchNumber,
            manufacturerName: batch.manufacturerName,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            isExpired: isExpired,
            custodyCount: custodyChain[_batchId].length
        });
    }

    // ============================================================
    //                   COUNTERFEIT REPORTING
    // ============================================================

    /**
     * @notice Report a suspected counterfeit (emits event with location)
     * @param _batchId The batch ID that failed verification
     * @param _location GPS coordinates or location description
     */
    function reportCounterfeit(
        bytes32 _batchId,
        string memory _location
    ) external {
        emit CounterfeitReported(_batchId, msg.sender, _location, block.timestamp);
    }

    // ============================================================
    //                     VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Get the full custody chain for a drug batch
     */
    function getCustodyChain(bytes32 _batchId)
        external
        view
        returns (CustodyRecord[] memory)
    {
        return custodyChain[_batchId];
    }

    /**
     * @notice Get total number of registered batches
     */
    function getTotalBatches() external view returns (uint256) {
        return batchIds.length;
    }

    /**
     * @notice Get total number of registered participants
     */
    function getTotalParticipants() external view returns (uint256) {
        return participantAddresses.length;
    }

    /**
     * @notice Get batch ID at index (for enumeration)
     */
    function getBatchIdAtIndex(uint256 index) external view returns (bytes32) {
        require(index < batchIds.length, "Index out of bounds");
        return batchIds[index];
    }

    /**
     * @notice Check if a batch is expired
     */
    function isBatchExpired(bytes32 _batchId)
        external
        view
        batchExists(_batchId)
        returns (bool)
    {
        return block.timestamp > drugBatches[_batchId].expiryDate;
    }
}
