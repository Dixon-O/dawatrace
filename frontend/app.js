// ============================================================
// DawaTrace — Frontend Application
// Dual-mode: Live blockchain OR demo simulation
// ============================================================

// --- ABI (loaded inline for simplicity) ---
const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function registerParticipant(address _participant, string _name, string _licenseNumber, uint8 _role)",
    "function registerDrugBatch(string _drugName, string _batchNumber, uint256 _expiryDate, string _ipfsHash) returns (bytes32)",
    "function transferCustody(bytes32 _batchId, address _to, string _location)",
    "function verifyDrug(bytes32 _batchId) returns (tuple(bool isAuthentic, string drugName, string batchNumber, string manufacturerName, uint256 manufactureDate, uint256 expiryDate, bool isExpired, uint256 custodyCount))",
    "function verifyDrugView(bytes32 _batchId) view returns (tuple(bool isAuthentic, string drugName, string batchNumber, string manufacturerName, uint256 manufactureDate, uint256 expiryDate, bool isExpired, uint256 custodyCount))",
    "function reportCounterfeit(bytes32 _batchId, string _location)",
    "function getCustodyChain(bytes32 _batchId) view returns (tuple(address from, address to, uint256 timestamp, string location, uint8 fromRole, uint8 toRole)[])",
    "function getTotalBatches() view returns (uint256)",
    "function getTotalParticipants() view returns (uint256)",
    "function totalVerifications() view returns (uint256)",
    "function drugBatches(bytes32) view returns (string drugName, string batchNumber, string manufacturerName, address manufacturer, uint256 manufactureDate, uint256 expiryDate, string ipfsMetadataHash, bool exists)",
    "function getBatchIdAtIndex(uint256 index) view returns (bytes32)",
    "function participants(address) view returns (string name, string licenseNumber, uint8 role, bool isRegistered, uint256 registeredAt)",
    "function currentHolder(bytes32) view returns (address)",
    "event DrugBatchRegistered(bytes32 indexed batchId, string drugName, string batchNumber, address indexed manufacturer, uint256 expiryDate)",
    "event CustodyTransferred(bytes32 indexed batchId, address indexed from, address indexed to, string location, uint256 timestamp)",
    "event DrugVerified(bytes32 indexed batchId, address indexed verifier, bool isAuthentic, bool isExpired, uint256 timestamp)",
    "event CounterfeitReported(bytes32 indexed batchId, address indexed reporter, string location, uint256 timestamp)"
];

// ============================================================
// DEMO DATABASE — Embedded realistic data for bulletproof demos
// ============================================================

const DEMO_DB = {
    batches: {
        "DWT-AMX-2026-0528": {
            drugName: "Amoxicillin 500mg",
            batchNumber: "AMX-BATCH-2026-0528",
            manufacturerName: "Kenya Pharma Ltd",
            manufacturer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 30,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 365,
            ipfsMetadataHash: "QmX7bVbZgKTMusSwYhc1gPp3v3E4MHAL4kWjF8Rr9Rz8wN",
            exists: true,
            custodyCount: 3,
            isAuthentic: true,
            isExpired: false
        },
        "DWT-PAR-2026-0415": {
            drugName: "Paracetamol 250mg",
            batchNumber: "PAR-BATCH-2026-0415",
            manufacturerName: "Beta Healthcare Intl",
            manufacturer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 45,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 300,
            ipfsMetadataHash: "QmYf3rE9kL2mNpRtHvXWj4C8aS6nQB7dK1gP2jM5hT9xUc",
            exists: true,
            custodyCount: 2,
            isAuthentic: true,
            isExpired: false
        },
        "DWT-ART-2025-0812": {
            drugName: "Artemether-Lumefantrine 20/120mg",
            batchNumber: "ART-BATCH-2025-0812",
            manufacturerName: "Universal Corp of Kenya",
            manufacturer: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 180,
            expiryDate: Math.floor(Date.now() / 1000) - 86400 * 10, // EXPIRED
            ipfsMetadataHash: "",
            exists: true,
            custodyCount: 3,
            isExpired: true
        },
        "DWT-CIP-2025-1120": {
            drugName: "Ciprofloxacin 500mg",
            batchNumber: "CIP-BATCH-2025-1120",
            manufacturerName: "Kenya Pharma Ltd",
            manufacturer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 10,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 300,
            ipfsMetadataHash: "",
            exists: true, custodyCount: 1, isAuthentic: true, isExpired: false
        },
        "DWT-IBU-2026-0610": {
            drugName: "Ibuprofen 400mg",
            batchNumber: "IBU-BATCH-2026-0610",
            manufacturerName: "Beta Healthcare Intl",
            manufacturer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 5,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 365,
            ipfsMetadataHash: "",
            exists: true, custodyCount: 1, isAuthentic: true, isExpired: false
        },
        "DWT-MET-2026-0301": {
            drugName: "Metformin 500mg",
            batchNumber: "MET-BATCH-2026-0301",
            manufacturerName: "Universal Corp of Kenya",
            manufacturer: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 20,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 300,
            ipfsMetadataHash: "",
            exists: true, custodyCount: 1, isAuthentic: true, isExpired: false
        },
        "DWT-OME-2026-0915": {
            drugName: "Omeprazole 20mg",
            batchNumber: "OME-BATCH-2026-0915",
            manufacturerName: "Kenya Pharma Ltd",
            manufacturer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 2,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 365,
            ipfsMetadataHash: "",
            exists: true, custodyCount: 1, isAuthentic: true, isExpired: false
        },
        "DWT-AZI-2026-0130": {
            drugName: "Azithromycin 250mg",
            batchNumber: "AZI-BATCH-2026-0130",
            manufacturerName: "Beta Healthcare Intl",
            manufacturer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            manufactureDate: Math.floor(Date.now() / 1000) - 86400 * 30,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 * 300,
            ipfsMetadataHash: "",
            exists: true, custodyCount: 1, isAuthentic: true, isExpired: false
        }
    },

    custodyChains: {
        "DWT-AMX-2026-0528": [
            { from: "0x0000000000000000000000000000000000000000", to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", timestamp: Math.floor(Date.now() / 1000) - 86400 * 30, location: "Kenya Pharma Factory, Industrial Area, Nairobi", fromRole: 0, toRole: 1 },
            { from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", timestamp: Math.floor(Date.now() / 1000) - 86400 * 20, location: "MedDistribute Warehouse, Mombasa Road, Nairobi", fromRole: 1, toRole: 2 },
            { from: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", to: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", timestamp: Math.floor(Date.now() / 1000) - 86400 * 5, location: "Kisumu City Pharmacy, Oginga Odinga St, Kisumu", fromRole: 2, toRole: 3 }
        ],
        "DWT-PAR-2026-0415": [
            { from: "0x0000000000000000000000000000000000000000", to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", timestamp: Math.floor(Date.now() / 1000) - 86400 * 45, location: "Beta Healthcare Plant, Kericho", fromRole: 0, toRole: 1 },
            { from: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", to: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", timestamp: Math.floor(Date.now() / 1000) - 86400 * 15, location: "Nairobi Central Pharmacy, Tom Mboya St", fromRole: 1, toRole: 3 }
        ],
        "DWT-ART-2025-0812": [
            { from: "0x0000000000000000000000000000000000000000", to: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", timestamp: Math.floor(Date.now() / 1000) - 86400 * 180, location: "Universal Corp Factory, Kikuyu", fromRole: 0, toRole: 1 },
            { from: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", to: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", timestamp: Math.floor(Date.now() / 1000) - 86400 * 120, location: "PharmAccess Distributor, Eldoret", fromRole: 1, toRole: 2 },
            { from: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", to: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", timestamp: Math.floor(Date.now() / 1000) - 86400 * 60, location: "Lake Region Pharmacy, Busia", fromRole: 2, toRole: 3 }
        ]
    },

    stats: { verifications: 1247, batches: 3, participants: 7 },

    // Track demo-registered batches at runtime
    runtimeBatches: []
};

const PRODUCT_CATALOG = {
    amoxicillin: {
        id: "amoxicillin",
        name: "Amoxicillin 500mg",
        categoryKey: "antibiotic",
        categoryLabel: "Antibiotic",
        heroEmoji: "💊",
        subtitle: "Broad-spectrum penicillin · Capsules · 24-count blister",
        sku: "AMX-500-C24",
        manufacturer: "MediCore Labs",
        created: "Sep 12, 2024",
        contract: "0x4a2b…d2b9",
        batchPrefix: "AMX-500",
        defaultExpiryYears: 2,
        summary: "High-volume antibiotic with strong on-chain visibility.",
        tags: ["Antibiotic", "Rx-only", "On-chain"],
        stats: { verifiedScans: "12,418", batches: "14", trustRate: "99.6%", inTransit: "3", regions: "11", counterfeits: "2" }
    },
    insulin: {
        id: "insulin",
        name: "Insulin Glargine",
        categoryKey: "vial",
        categoryLabel: "Injectable",
        heroEmoji: "💉",
        subtitle: "100IU · Injectable vials · Cold-chain required",
        sku: "INS-100-V10",
        manufacturer: "MediCore Labs",
        created: "Nov 04, 2024",
        contract: "0x91fc…0a2b",
        batchPrefix: "INS-100",
        defaultExpiryYears: 2,
        summary: "Temperature-sensitive biologic with batch traceability.",
        tags: ["Biologic", "Cold-chain", "On-chain"],
        stats: { verifiedScans: "7,820", batches: "7", trustRate: "98.9%", inTransit: "4", regions: "9", counterfeits: "0" }
    },
    paracetamol: {
        id: "paracetamol",
        name: "Paracetamol Syrup",
        categoryKey: "syrup",
        categoryLabel: "Pediatric Syrup",
        heroEmoji: "🧴",
        subtitle: "250ml · Pediatric · Palatable dosing",
        sku: "PCM-250-S",
        manufacturer: "MediCore Labs",
        created: "Oct 21, 2024",
        contract: "0xb481…2cc7",
        batchPrefix: "PCM-250",
        defaultExpiryYears: 2,
        summary: "Family-friendly OTC format with rapid verification.",
        tags: ["OTC", "Pediatric", "On-chain"],
        stats: { verifiedScans: "9,120", batches: "21", trustRate: "99.8%", inTransit: "2", regions: "10", counterfeits: "1" }
    },
    ibuprofen: {
        id: "ibuprofen",
        name: "Ibuprofen 200mg",
        categoryKey: "tablet",
        categoryLabel: "Analgesic",
        heroEmoji: "💊",
        subtitle: "Analgesic tablets · 48-count blister",
        sku: "IBU-200-T48",
        manufacturer: "MediCore Labs",
        created: "Dec 08, 2024",
        contract: "0x7e12…f98b",
        batchPrefix: "IBU-200",
        defaultExpiryYears: 2,
        summary: "Reliable pain relief SKU with strong consumer scan rates.",
        tags: ["OTC", "Tablet", "On-chain"],
        stats: { verifiedScans: "5,620", batches: "19", trustRate: "99.2%", inTransit: "1", regions: "8", counterfeits: "0" }
    },
    hepb: {
        id: "hepb",
        name: "Hep-B Vaccine 0.5ml",
        categoryKey: "vaccine",
        categoryLabel: "Vaccine",
        heroEmoji: "💉",
        subtitle: "Recombinant · 10-vial pack · Refrigerated",
        sku: "HEP-VAC-05",
        manufacturer: "MediCore Labs",
        created: "Jan 04, 2025",
        contract: "0xc9d8…2a11",
        batchPrefix: "HEP-VAC",
        defaultExpiryYears: 3,
        summary: "Cold-chain vaccine tracked from factory to clinic.",
        tags: ["Vaccine", "Cold-chain", "On-chain"],
        stats: { verifiedScans: "3,240", batches: "5", trustRate: "100%", inTransit: "1", regions: "7", counterfeits: "0" }
    },
    aspirin: {
        id: "aspirin",
        name: "Aspirin 75mg",
        categoryKey: "tablet",
        categoryLabel: "Tablet",
        heroEmoji: "💊",
        subtitle: "Anti-platelet · Tablets · Recall monitored",
        sku: "ASP-075-C30",
        manufacturer: "MediCore Labs",
        created: "Aug 15, 2024",
        contract: "0x3c71…bb02",
        batchPrefix: "ASP-075",
        defaultExpiryYears: 2,
        summary: "Lower-volume cardiology line with tighter expiry windows.",
        tags: ["OTC", "Tablet", "Recall"],
        stats: { verifiedScans: "1,120", batches: "3", trustRate: "87.4%", inTransit: "0", regions: "5", counterfeits: "1" }
    },
    ors: {
        id: "ors",
        name: "ORS Sachets",
        categoryKey: "sachet",
        categoryLabel: "Rehydration",
        heroEmoji: "🧂",
        subtitle: "Rehydration sachets · 4.4g · 10 packs",
        sku: "ORS-44-S10",
        manufacturer: "MediCore Labs",
        created: "Feb 08, 2025",
        contract: "0x8f41…1ab4",
        batchPrefix: "ORS-44",
        defaultExpiryYears: 2,
        summary: "Consumer-friendly hydration SKU with strong mobile uptake.",
        tags: ["OTC", "Sachet", "On-chain"],
        stats: { verifiedScans: "6,400", batches: "22", trustRate: "99.4%", inTransit: "2", regions: "10", counterfeits: "0" }
    }
};

// --- State ---
let provider = null;
let signer = null;
let contract = null;
let contractAddress = null;
let isConnected = false;
let demoMode = true; // Always start in demo mode
let selectedProductName = null;
let selectedProductId = "amoxicillin";
let lastVerifiedBatchId = null;
let lastVerificationResult = null;
let lastVerificationChain = [];
let lastRenderedBatches = [];
let productSearchQuery = "";
let currentProductFilter = "all";
let batchSearchQuery = "";
let pendingDashboardPrefill = null;
let toastTimer = null;
let currentInfoSection = "features";

// --- DOM Elements ---
const connectWalletBtn = document.getElementById("connectWallet");
const navLinks = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");
const verifyTabs = document.querySelectorAll(".verify-tab");
const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 900;

function setActivePage(page) {
    navLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
    });
}

function fitCanvas() {
    const canvas = document.querySelector(".canvas");
    if (!canvas) return;

    const scale = Math.min(
        window.innerWidth / CANVAS_WIDTH,
        window.innerHeight / CANVAS_HEIGHT,
        1
    );

    canvas.style.setProperty("--canvas-scale", scale.toFixed(3));
}

function showPage(page) {
    const target = document.getElementById(`page-${page}`);
    if (!target) {
        console.warn(`Page not found: ${page}`);
        return;
    }

    pages.forEach(p => p.classList.add("hidden"));
    target.classList.remove("hidden");
    setActivePage(page);
    syncPageState(page);
    if (page === "product-detail" && typeof renderProductDetailPage === "function") {
        renderProductDetailPage();
    }
    fitCanvas();
}

function formatShortAddress(address) {
    if (typeof address !== "string") return String(address ?? "");
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDateLabel(value) {
    if (value === undefined || value === null) return "Unknown";
    return new Date(Number(value) * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getProduct(productId = selectedProductId) {
    return PRODUCT_CATALOG[productId] || PRODUCT_CATALOG.amoxicillin;
}

function getProductAccent(product) {
    const palette = {
        antibiotic: "linear-gradient(135deg,#FFC9B5,#FFE3D6)",
        vial: "linear-gradient(135deg,#B8E4FF,#D8C8FF)",
        syrup: "linear-gradient(135deg,#A8F0DC,#B8E4FF)",
        tablet: "linear-gradient(135deg,#FFE08A,#FFC9D6)",
        vaccine: "linear-gradient(135deg,#D8C8FF,#B8E4FF)",
        sachet: "linear-gradient(135deg,#FCE7F3,#FFE08A)"
    };
    return palette[product.categoryKey] || "linear-gradient(135deg,#FFC9B5,#FFE3D6)";
}

function parseDisplayNumber(value) {
    const numeric = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
}

function getProductBatchMatches(product, limit = 3) {
    const sources = [
        ...Object.entries(DEMO_DB.batches).map(([id, batch]) => ({ id, ...batch })),
        ...DEMO_DB.runtimeBatches.map(batch => ({ id: batch.id, ...batch }))
    ];
    const searchTerms = normalizeQuery(product.name)
        .split(/\s+/)
        .filter(term => term.length > 2);
    const prefix = normalizeQuery(product.batchPrefix || product.sku || "");
    const manufacturer = normalizeQuery(product.manufacturer || "");

    return sources
        .filter(batch => {
            const haystack = normalizeQuery([
                batch.drugName,
                batch.batchNumber,
                batch.manufacturerName,
                batch.id
            ].join(" "));

            return searchTerms.some(term => haystack.includes(term)) ||
                (prefix && haystack.includes(prefix)) ||
                (manufacturer && haystack.includes(manufacturer));
        })
        .slice(0, limit);
}

function getRelatedProductBatchId(product) {
    return getProductBatchMatches(product, 1)[0]?.id || null;
}

function renderProductDetailPage() {
    const product = getProduct();
    const accent = getProductAccent(product);
    const trustRate = parseFloat(String(product.stats?.trustRate ?? "0").replace("%", "")) || 0;
    const verifiedScans = parseDisplayNumber(product.stats?.verifiedScans);
    const batchCount = parseDisplayNumber(product.stats?.batches);
    const counterfeits = parseDisplayNumber(product.stats?.counterfeits);
    const regions = parseDisplayNumber(product.stats?.regions);
    const statusClass = trustRate >= 95 ? "active" : trustRate >= 90 ? "verified" : "pending";
    const statusLabel = trustRate >= 95 ? "● Active" : trustRate >= 90 ? "● Verified" : "◐ Monitoring";
    const batches = getProductBatchMatches(product, 3);
    const trustStroke = Math.max(1, Math.round((trustRate / 100) * 264));
    const packageLabel = String(product.subtitle || "").split("·").pop()?.trim() || product.subtitle || product.categoryLabel;

    const breadcrumb = document.getElementById("productDetailBreadcrumb");
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <span>Products</span>
            <span style="margin:0 6px;color:#CBD5E1">›</span>
            <span>${product.categoryLabel}</span>
            <span style="margin:0 6px;color:#CBD5E1">›</span>
            <span style="color:#0F1B2D;font-weight:600">${product.name}</span>
        `;
    }

    const hero = document.getElementById("productHeroCard");
    if (hero) {
        const primaryTag = product.tags?.find(tag => /rx-only|otc|cold-chain|vaccine|recall/i.test(tag)) || product.tags?.[0] || product.categoryLabel;
        hero.innerHTML = `
            <div style="display:flex;height:100%">
              <div style="width:240px;height:100%;background:${accent};display:flex;align-items:center;justify-content:center;position:relative">
                <div style="font-size:96px">${product.heroEmoji || "💊"}</div>
                <span class="pill ${statusClass}" style="position:absolute;left:14px;top:14px">${statusLabel}</span>
              </div>
              <div style="flex:1;padding:24px 28px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
                  <span class="tag" style="background:#EDE7FF;color:#7C3AED">${product.categoryLabel}</span>
                  <span class="tag" style="background:#FEE2E2;color:#EF4444">${primaryTag}</span>
                  <span class="tag" style="background:#E9F7F2;color:#10B981">✓ On-chain</span>
                </div>
                <h2 style="margin:6px 0 4px 0;font-family:'Sora',sans-serif;font-size:28px;line-height:1.1;color:#0F1B2D">${product.name}</h2>
                <div style="font-size:13px;color:#6B7793">${product.subtitle}</div>
                <div style="display:flex;gap:32px;margin-top:18px;flex-wrap:wrap">
                  <div><div style="font-size:11px;color:#6B7793;font-weight:600">SKU</div><div style="font-family:monospace;font-weight:700;color:#0F1B2D;margin-top:2px">${product.sku}</div></div>
                  <div><div style="font-size:11px;color:#6B7793;font-weight:600">Manufacturer</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.manufacturer}</div></div>
                  <div><div style="font-size:11px;color:#6B7793;font-weight:600">Created</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.created}</div></div>
                  <div><div style="font-size:11px;color:#6B7793;font-weight:600">Contract</div><div style="font-family:monospace;font-weight:700;color:#7C3AED;margin-top:2px">${product.contract} ↗</div></div>
                </div>
                <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
                  <button type="button" class="btn-ghost" data-action="product-qr" style="padding:9px 18px;font-size:13px">▦ Generate QR</button>
                  <button type="button" class="btn-soft" data-action="copy-sku">📋 Copy SKU</button>
                  <button type="button" class="btn-soft" data-action="view-product-explorer">◉ View on explorer</button>
                </div>
              </div>
            </div>
        `;
    }

    const trust = document.getElementById("productTrustCard");
    if (trust) {
        trust.innerHTML = `
            <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#0F1B2D;margin-bottom:14px">◉ On-chain trust</div>
            <div style="display:flex;align-items:center;gap:14px">
              <svg width="80" height="80" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#EDE9FE" stroke-width="12" fill="none"></circle>
                <circle cx="50" cy="50" r="42" stroke="url(#tg)" stroke-width="12" fill="none" stroke-dasharray="${trustStroke} 264" stroke-linecap="round" transform="rotate(-90 50 50)"></circle>
                <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#22D3EE"></stop><stop offset="1" stop-color="#7C3AED"></stop></linearGradient></defs>
                <text x="50" y="55" text-anchor="middle" font-family="Sora" font-size="16" font-weight="700" fill="#0F1B2D">${trustRate.toFixed(1).replace(/\.0$/, "")}%</text>
              </svg>
              <div>
                <div style="font-family:'Sora',sans-serif;font-size:24px;font-weight:800;color:#0F1B2D;line-height:1">${verifiedScans.toLocaleString()}</div>
                <div style="font-size:11px;color:#6B7793;margin-top:2px">verified scans</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-top:18px;font-size:12px">
              <div><div style="color:#6B7793">Batches</div><div style="color:#0F1B2D;font-weight:700">${batchCount.toLocaleString()}</div></div>
              <div><div style="color:#6B7793">In transit</div><div style="color:#7C3AED;font-weight:700">${Math.max(0, Math.min(batchCount, Math.round(batchCount / 4) || 0))}</div></div>
              <div><div style="color:#6B7793">Regions</div><div style="color:#0F1B2D;font-weight:700">${regions.toLocaleString()}</div></div>
              <div><div style="color:#6B7793">Counterfeits</div><div style="color:#EF4444;font-weight:700">${counterfeits.toLocaleString()}</div></div>
            </div>
        `;
    }

    const spec = document.getElementById("productSpecCard");
    if (spec) {
        spec.innerHTML = `
            <h3 style="margin:0 0 14px 0;font-family:'Sora',sans-serif;font-size:16px;color:#0F1B2D">Product specification</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;font-size:13px">
              <div><div style="color:#6B7793;font-size:11px">Category</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.categoryLabel}</div></div>
              <div><div style="color:#6B7793;font-size:11px">Manufacturer</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.manufacturer}</div></div>
              <div><div style="color:#6B7793;font-size:11px">SKU</div><div style="font-family:monospace;font-weight:700;color:#0F1B2D;margin-top:2px">${product.sku}</div></div>
              <div><div style="color:#6B7793;font-size:11px">Contract</div><div style="font-family:monospace;font-weight:700;color:#7C3AED;margin-top:2px">${product.contract}</div></div>
              <div><div style="color:#6B7793;font-size:11px">Created</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.created}</div></div>
              <div><div style="color:#6B7793;font-size:11px">Batch prefix</div><div style="font-family:monospace;font-weight:700;color:#0F1B2D;margin-top:2px">${product.batchPrefix}</div></div>
              <div><div style="color:#6B7793;font-size:11px">Trust rate</div><div style="font-weight:700;color:#10B981;margin-top:2px">${product.stats?.trustRate || "0%"}</div></div>
              <div><div style="color:#6B7793;font-size:11px">Coverage</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${regions.toLocaleString()} regions</div></div>
            </div>
        `;
    }

    const scans = document.getElementById("productScansCard");
    if (scans) {
        const swing = Math.max(4, Math.min(18, Math.round(verifiedScans / 1000) || 4));
        scans.innerHTML = `
            <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#0F1B2D">Scans · 30 days</div>
            <div style="font-family:'Sora',sans-serif;font-size:28px;font-weight:800;color:#0F1B2D;margin-top:6px">${verifiedScans.toLocaleString()}</div>
            <div style="font-size:11px;color:#10B981;font-weight:700">▲ ${swing}% vs prior</div>
            <svg viewBox="0 0 230 100" style="margin-top:14px;width:100%;height:100px">
              <defs>
                <linearGradient id="ma" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C3AED" stop-opacity=".4"></stop><stop offset="1" stop-color="#7C3AED" stop-opacity="0"></stop></linearGradient>
                <linearGradient id="ml" x1="0" x2="1"><stop offset="0" stop-color="#22D3EE"></stop><stop offset="1" stop-color="#7C3AED"></stop></linearGradient>
              </defs>
              <path d="M 5 80 L 25 70 L 45 75 L 65 55 L 85 60 L 105 40 L 125 50 L 145 30 L 165 38 L 185 20 L 205 25 L 225 12 L 225 95 L 5 95 Z" fill="url(#ma)"></path>
              <path d="M 5 80 L 25 70 L 45 75 L 65 55 L 85 60 L 105 40 L 125 50 L 145 30 L 165 38 L 185 20 L 205 25 L 225 12" stroke="url(#ml)" stroke-width="2.5" fill="none" stroke-linecap="round"></path>
              <circle cx="225" cy="12" r="4" fill="#fff" stroke="#7C3AED" stroke-width="2.5"></circle>
            </svg>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;margin-top:4px">
              <span>Jan 1</span><span>Jan 15</span><span>Jan 30</span>
            </div>
        `;
    }

    const regionsPanel = document.getElementById("productRegionsCard");
    if (regionsPanel) {
        const regionRows = [
            ["🇺🇸 United States", 0.34, "88%"],
            ["🇧🇷 Brazil", 0.25, "68%"],
            ["🇰🇪 Kenya", 0.2, "54%"],
            ["🇮🇳 India", 0.13, "40%"],
            ["🇩🇪 Germany", 0.08, "34%"]
        ].map(([label, weight, width]) => {
            const count = Math.max(1, Math.round(verifiedScans * Number(weight)));
            return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#0F1B2D;font-weight:600">${label}</span><span style="color:#6B7793;font-weight:700">${count.toLocaleString()}</span></div>
                  <div style="height:6px;border-radius:6px;background:#F1F3F9;overflow:hidden"><div style="width:${width};height:100%;background:linear-gradient(90deg,#22D3EE,#7C3AED);border-radius:6px"></div></div>
                </div>
            `;
        }).join("");

        regionsPanel.innerHTML = `
            <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#0F1B2D">Top regions</div>
            <div style="font-size:11px;color:#6B7793;margin-bottom:14px">Scans this month</div>
            <div style="display:flex;flex-direction:column;gap:10px;font-size:12px">
              ${regionRows}
            </div>
        `;
    }

    const batchesPanel = document.getElementById("productBatchesCard");
    if (batchesPanel) {
        const batchRows = batches.length
            ? batches.map(row => `
                <div style="display:grid;grid-template-columns:160px 1fr 130px 130px 1fr 140px;padding:12px 24px;border-bottom:1px solid #F1F3F9;align-items:center;font-size:13px">
                  <div style="font-family:monospace;font-weight:700;color:#0F1B2D">${row.batchNumber}</div>
                  <div style="color:#3A4761">${packageLabel}</div>
                  <div><span class="pill ${row.isExpired ? 'expired' : row.isAuthentic ? 'active' : 'pending'}">${row.isExpired ? 'Expired' : row.isAuthentic ? 'Active' : 'Pending'}</span></div>
                  <div style="color:#0F1B2D;font-weight:600">${formatDateLabel(row.expiryDate)}</div>
                  <div style="color:#3A4761">${row.route || `${row.manufacturerName} → Pharmacy`}</div>
                  <div style="font-family:monospace;font-size:11px;color:#7C3AED;text-align:right">${formatShortAddress(row.id)} ↗</div>
                </div>
            `).join("")
            : `
                <div class="empty-state" style="min-height:126px;display:flex;flex-direction:column;gap:10px">
                  <span>No seeded batches found for this SKU yet</span>
                  <button type="button" class="btn-grad" data-action="mint-new-batch" data-page="dashboard" style="padding:10px 18px;font-size:13px">Mint first batch</button>
                </div>
            `;

        batchesPanel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #EEF1F7">
              <h3 style="margin:0;font-family:'Sora',sans-serif;font-size:16px;color:#0F1B2D">Recent batches for this product</h3>
              <button type="button" class="inline-link-btn" data-action="product-batches" style="font-size:13px;color:#7C3AED;font-weight:700">View all ${batchCount.toLocaleString()} →</button>
            </div>
            <div style="display:grid;grid-template-columns:160px 1fr 130px 130px 1fr 140px;padding:10px 24px;border-bottom:1px solid #F1F3F9;font-size:11px;color:#6B7793;font-weight:700;text-transform:uppercase;letter-spacing:.06em">
              <div>Batch #</div><div>Quantity</div><div>Status</div><div>Expiry</div><div>Route</div><div style="text-align:right">Tx</div>
            </div>
            ${batchRows}
        `;
    }
}

async function openProductBatchesForProduct() {
    const product = getProduct();
    const searchQuery = normalizeQuery(product.name).split(/\s+/).find(term => term.length > 2) || normalizeQuery(product.name);
    batchSearchQuery = searchQuery;
    currentProductFilter = "all";
    showPage("batches");

    const batchSearch = document.getElementById("batchSearch");
    if (batchSearch) {
        batchSearch.value = searchQuery;
    }

    await loadBatches();
    applyBatchSearchFilter();
    showToast(`Showing batches for ${product.name}`, "success");
}

async function openProductVerificationForProduct() {
    const product = getProduct();
    const batchId = getRelatedProductBatchId(product);

    showPage("verify");

    const input = document.getElementById("batchIdInput");
    if (input) {
        input.value = batchId || "";
    }

    if (batchId) {
        showToast(`Loaded ${product.name} verification batch`, "success");
        await verifyDrug(batchId);
    } else {
        showToast(`No seeded batch for ${product.name}; scan or enter a code`, "info");
    }
}

async function openProductAuditTrailForProduct() {
    const product = getProduct();
    const batchId = getRelatedProductBatchId(product);

    showPage("track");

    const input = document.getElementById("trackBatchId");
    if (input) {
        input.value = batchId || "";
    }

    if (batchId) {
        await trackBatch();
        showToast(`Tracing ${product.name}`, "success");
    } else {
        showToast(`No seeded trail for ${product.name}; enter a batch ID`, "info");
    }
}

function openProductComplianceForProduct() {
    openInfoSection("legal");
    showPage("info");
    showToast(`${getProduct().name} compliance`, "info");
}

function normalizeQuery(value) {
    return String(value ?? "").trim().toLowerCase();
}

async function copyToClipboard(text, successMessage = "Copied to clipboard") {
    const value = String(text ?? "");
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(value);
        } else {
            const input = document.createElement("textarea");
            input.value = value;
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
        }
        showToast(successMessage, "success");
    } catch (err) {
        console.error("Clipboard error:", err);
        showToast("Could not copy to clipboard", "error");
    }
}

function downloadText(filename, text, mimeType = "text/plain") {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadJson(filename, data) {
    downloadText(filename, JSON.stringify(sanitizeForJson(data), null, 2), "application/json");
}

function sanitizeForJson(value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeForJson);
    }
    if (value && typeof value === "object") {
        const output = {};
        for (const [key, entry] of Object.entries(value)) {
            output[key] = sanitizeForJson(entry);
        }
        return output;
    }
    return value;
}

async function shareText(title, text) {
    try {
        if (navigator.share) {
            await navigator.share({ title, text });
            return true;
        }
        await copyToClipboard(`${title}\n${text}`, "Share text copied");
        return false;
    } catch (err) {
        console.error("Share error:", err);
        showToast("Unable to share right now", "error");
        return false;
    }
}

function buildBatchIdFromProduct(product) {
    const shortCode = product.batchPrefix || product.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8);
    const suffix = String(Date.now()).slice(-6);
    return `DWT-${shortCode}-${suffix}`;
}

function buildExpiryDate(years = 2) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().slice(0, 10);
}

function prefillRegisterForm(productId = selectedProductId) {
    const product = getProduct(productId);
    selectedProductId = product.id;
    selectedProductName = product.name;
    const drugName = document.getElementById("drugName");
    const batchNumber = document.getElementById("batchNumber");
    const expiryDate = document.getElementById("expiryDate");
    const ipfsHash = document.getElementById("ipfsHash");

    if (!drugName || !batchNumber || !expiryDate || !ipfsHash) return;

    drugName.value = product.name;
    batchNumber.value = buildBatchIdFromProduct(product);
    expiryDate.value = buildExpiryDate(product.defaultExpiryYears || 2);
    ipfsHash.value = "";
}

function saveRegisterDraft() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    try {
        const draft = {
            drugName: document.getElementById("drugName")?.value || "",
            batchNumber: document.getElementById("batchNumber")?.value || "",
            expiryDate: document.getElementById("expiryDate")?.value || "",
            ipfsHash: document.getElementById("ipfsHash")?.value || "",
            productId: selectedProductId,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem("dawatrace.registerDraft", JSON.stringify(draft));
        showToast("Draft saved locally", "success");
    } catch (err) {
        console.error("Draft save failed:", err);
        showToast("Could not save draft locally", "error");
    }
}

function restoreRegisterDraft() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    if (pendingDashboardPrefill) {
        prefillRegisterForm(pendingDashboardPrefill);
        pendingDashboardPrefill = null;
        return;
    }

    try {
        const raw = localStorage.getItem("dawatrace.registerDraft");
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (draft.productId && PRODUCT_CATALOG[draft.productId]) {
            selectedProductId = draft.productId;
            selectedProductName = getProduct(draft.productId).name;
        }
        if (document.getElementById("drugName")) document.getElementById("drugName").value = draft.drugName || "";
        if (document.getElementById("batchNumber")) document.getElementById("batchNumber").value = draft.batchNumber || "";
        if (document.getElementById("expiryDate")) document.getElementById("expiryDate").value = draft.expiryDate || "";
        if (document.getElementById("ipfsHash")) document.getElementById("ipfsHash").value = draft.ipfsHash || "";
    } catch (err) {
        console.warn("Draft restore failed:", err);
    }
}

function clearRegisterDraft() {
    try {
        localStorage.removeItem("dawatrace.registerDraft");
    } catch (err) {
        console.warn("Draft clear failed:", err);
    }
}

const INFO_SECTION_CONTENT = {
    features: {
        badge: "Blueprint tour",
        title: "Every dead label now lands somewhere useful.",
        description: "The blueprint-driven UI now routes into real dapp behavior without touching the verification, tracking, or registration logic.",
        metrics: [
            { label: "Core flows", value: "Verify / Trace / Register", detail: "Still powered by the same contract and demo logic." },
            { label: "Modes", value: "Demo + Live", detail: "The frontend still falls back safely when no chain is present." },
            { label: "Screens", value: "11 + info hub", detail: "The original blueprint pages remain intact and responsive." },
            { label: "Entrypoints", value: "HTML + localhost", detail: "Open the file directly or use the local server." }
        ],
        panels: [
            {
                kicker: "What stayed true",
                title: "Dapp behavior",
                copy: "The user-facing shell changed, but the operational logic underneath is the same battle-tested flow.",
                points: [
                    { icon: "✓", title: "Verification", detail: "Manual batch verification, QR scanning, proof export, and counterfeit reporting still work." },
                    { icon: "⎘", title: "Supply chain", detail: "Trace rendering, custody chain timelines, and explorer links remain connected." },
                    { icon: "▦", title: "Manufacturer tools", detail: "Drafts, batch registration, QR generation, and transfer actions remain functional." }
                ],
                footer: "Nothing here is a cosmetic-only dead end."
            },
            {
                kicker: "What changed",
                title: "Navigation coverage",
                copy: "The labels that used to be static now open actual destinations instead of pretending to be links.",
                points: [
                    { icon: "→", title: "Top navigation", detail: "Products, features, pricing, and contact now route to real pages or the info hub." },
                    { icon: "⚙", title: "Utility links", detail: "Docs, support, settings, terms, and privacy all lead somewhere useful." },
                    { icon: "📱", title: "Mobile mockups", detail: "The phone tab bars and scan card now navigate to live app pages." }
                ],
                footer: "The result is still blueprint-authentic, only no longer hollow."
            }
        ],
        actions: [
            { label: "Start verifying", kind: "page", value: "verify", variant: "btn-grad" },
            { label: "Open dashboard", kind: "page", value: "dashboard", variant: "btn-ghost" },
            { label: "Browse products", kind: "page", value: "products", variant: "btn-soft" }
        ]
    },
    pricing: {
        badge: "Capability tiers",
        title: "The app is local-first, then blockchain-ready.",
        description: "This blueprint does not sell plans, but it does explain the operational tiers the interface now supports.",
        metrics: [
            { label: "Demo tier", value: "Free", detail: "Open the HTML file or run the local server." },
            { label: "Pilot tier", value: "Live chain", detail: "MetaMask, Hardhat and deployed contract wiring." },
            { label: "Ops tier", value: "Manufacturer", detail: "Batch creation, QR minting, and custody transfer." },
            { label: "Support tier", value: "Guided", detail: "Troubleshooting, docs, and local drafts." }
        ],
        panels: [
            {
                kicker: "Tier fit",
                title: "What each mode is for",
                copy: "Every mode has a clear job, so demos can stay lightweight without losing the live path.",
                points: [
                    { icon: "◉", title: "Demo mode", detail: "Best for presenting the UI, proving flows, and testing without a chain connection." },
                    { icon: "⛓", title: "Live mode", detail: "Best for MetaMask-backed interactions against the deployed contract." },
                    { icon: "🛡", title: "Manufacturer mode", detail: "Best for batch registration, QR creation, transfers, and audit trails." }
                ],
                footer: "No feature gating, just clear usage paths."
            },
            {
                kicker: "What you get",
                title: "Included capabilities",
                copy: "The same interface now covers the whole product story, not just the hero screens.",
                points: [
                    { icon: "📦", title: "Batch lifecycle", detail: "Register, preview, list, export, and trace batches from one shell." },
                    { icon: "📡", title: "Proof flows", detail: "Save, download, share, and copy verification proofs without leaving the page." },
                    { icon: "📈", title: "Analytics and support", detail: "Statistics, support links, and info pages are now functional destinations." }
                ],
                footer: "A more complete experience without adding unnecessary backend complexity."
            }
        ],
        actions: [
            { label: "Start demo", kind: "page", value: "verify", variant: "btn-grad" },
            { label: "Register batch", kind: "page", value: "dashboard", variant: "btn-ghost" },
            { label: "Open docs", kind: "info", value: "docs", variant: "btn-soft" }
        ]
    },
    contact: {
        badge: "Contact",
        title: "A real contact surface instead of a static footer line.",
        description: "Use this hub to reach the team, copy the support address, or jump straight to the help flow.",
        metrics: [
            { label: "Email", value: "support@dawatrace.dev", detail: "Clipboard and mailto actions both work." },
            { label: "Response", value: "Within 1 day", detail: "For demos, bugs, and integration questions." },
            { label: "Location", value: "Nairobi / Remote", detail: "Designed for the Kenya demo story but ready for anywhere." },
            { label: "Channels", value: "Docs + support", detail: "The help paths now resolve in-app." }
        ],
        panels: [
            {
                kicker: "Reach the team",
                title: "Support channels",
                copy: "The UI now gives you concrete ways to ask for help instead of leaving you with decoration only.",
                points: [
                    { icon: "✉", title: "Email", detail: "Open a mail draft to support@dawatrace.dev with one click." },
                    { icon: "▦", title: "Docs", detail: "Jump to the in-app docs hub for local run and usage guidance." },
                    { icon: "⚑", title: "Issues", detail: "Copy a support summary and include the batch ID or screenshot." }
                ],
                footer: "Useful even if the user never leaves the browser."
            },
            {
                kicker: "For demos",
                title: "What to tell a reviewer",
                copy: "If you are presenting the app, these are the three most useful starting points.",
                points: [
                    { icon: "1", title: "Verify", detail: "Show the scanner or manual batch verification path." },
                    { icon: "2", title: "Trace", detail: "Show the chain timeline and proof export on the result page." },
                    { icon: "3", title: "Manage", detail: "Show the manufacturer dashboard, batch list, and QR generation." }
                ],
                footer: "This keeps the story easy to explain without extra tooling."
            }
        ],
        actions: [
            { label: "Email support", kind: "mail", value: "support@dawatrace.dev", variant: "btn-grad" },
            { label: "Copy address", kind: "copy", value: "support@dawatrace.dev", toast: "Support email copied", variant: "btn-ghost" },
            { label: "Open docs", kind: "info", value: "docs", variant: "btn-soft" }
        ]
    },
    settings: {
        badge: "Settings",
        title: "Local preferences and maintenance live here.",
        description: "The old settings label now gives the user real maintenance actions instead of a dead sidebar entry.",
        metrics: [
            { label: "Drafts", value: "Local", detail: "Register drafts are stored in localStorage." },
            { label: "Mode", value: "Demo ready", detail: "You can force the app back into demo mode at any time." },
            { label: "Wallet", value: "Injected", detail: "The UI still expects a wallet extension for live mode." },
            { label: "Reset", value: "One click", detail: "Clear drafts and return to a clean state fast." }
        ],
        panels: [
            {
                kicker: "Maintenance",
                title: "What you can change",
                copy: "These are the only settings that matter in this front-end-first build.",
                points: [
                    { icon: "✎", title: "Saved drafts", detail: "Clear any partially filled manufacturer draft in one click." },
                    { icon: "◌", title: "Demo state", detail: "Return to the built-in demo database without reloading the app." },
                    { icon: "⟲", title: "Local cache", detail: "The app still behaves well when opened directly as HTML." }
                ],
                footer: "A small settings surface, but it does something real."
            },
            {
                kicker: "Maintenance tips",
                title: "How to keep the demo smooth",
                copy: "Use these actions before a presentation or integration test.",
                points: [
                    { icon: "1", title: "Reset the form", detail: "Remove stale draft values before a fresh demo run." },
                    { icon: "2", title: "Return to demo", detail: "Re-enter demo mode to restore the sample data and stats." },
                    { icon: "3", title: "Re-open dashboard", detail: "Jump straight back to manufacturer operations after cleanup." }
                ],
                footer: "Good housekeeping, without needing a server."
            }
        ],
        actions: [
            { label: "Clear drafts", kind: "run", value: "clearDrafts", variant: "btn-grad" },
            { label: "Enter demo mode", kind: "run", value: "demoMode", variant: "btn-ghost" },
            { label: "Open dashboard", kind: "page", value: "dashboard", variant: "btn-soft" }
        ]
    },
    support: {
        badge: "Support",
        title: "Troubleshooting that resolves inside the app.",
        description: "This page explains the most common issues and gives the user a useful next step instead of a dead end.",
        metrics: [
            { label: "Camera help", value: "Included", detail: "The scanner page explains permission and upload options." },
            { label: "Wallet help", value: "Included", detail: "Unsupported wallet cards now route to this hub." },
            { label: "Trace help", value: "Included", detail: "Batch tracing, history, and proof export are covered." },
            { label: "State reset", value: "Local", detail: "Drafts and demo state can be reset without leaving the browser." }
        ],
        panels: [
            {
                kicker: "Common fixes",
                title: "When something looks stuck",
                copy: "These are the first things to try when a demo or live session needs recovery.",
                points: [
                    { icon: "📷", title: "Camera permissions", detail: "If scanning fails, allow camera access or use the upload QR flow." },
                    { icon: "⛓", title: "Wallet connection", detail: "MetaMask is the supported live wallet in this build." },
                    { icon: "🧾", title: "Batch lookup", detail: "Use the sample batch ID from the demo database if you need a fast trace." }
                ],
                footer: "Fast triage, not a blank support page."
            },
            {
                kicker: "What to send",
                title: "If you ask for help",
                copy: "Include a concise summary and one concrete reference so the issue can be reproduced.",
                points: [
                    { icon: "#", title: "Batch ID", detail: "Include the batch reference or QR snapshot that failed." },
                    { icon: "↗", title: "Page name", detail: "Mention whether the issue happened in verify, trace, dashboard, or mobile view." },
                    { icon: "⤓", title: "Action taken", detail: "Describe the button you clicked and the result you expected." }
                ],
                footer: "Simple details make troubleshooting much faster."
            }
        ],
        actions: [
            { label: "Open verify", kind: "page", value: "verify", variant: "btn-grad" },
            { label: "Open trace", kind: "page", value: "track", variant: "btn-ghost" },
            { label: "Copy checklist", kind: "copy", value: "Batch ID, page name, action clicked, and what you expected.", toast: "Support checklist copied", variant: "btn-soft" }
        ]
    },
    docs: {
        badge: "Documentation",
        title: "Local launch and usage notes, right in the app.",
        description: "The docs link now points to a real local guide for running, verifying, and presenting DawaTrace.",
        metrics: [
            { label: "Start command", value: "npm start", detail: "Runs the local static server on port 3000." },
            { label: "Open URL", value: "http://localhost:3000/", detail: "The root URL redirects into the frontend shell." },
            { label: "Demo file", value: "frontend/index.html", detail: "Still works directly when you just want the static demo." },
            { label: "Fallback", value: "Automatic", detail: "If deployment.json is missing, the app stays in demo mode." }
        ],
        panels: [
            {
                kicker: "Quick start",
                title: "How to run it locally",
                copy: "The highest-value local path is a small static server that serves the blueprint at localhost.",
                points: [
                    { icon: "1", title: "Install once", detail: "Run npm install if dependencies are missing." },
                    { icon: "2", title: "Start server", detail: "Run npm start and open http://localhost:3000/." },
                    { icon: "3", title: "Choose a mode", detail: "Use the HTML file for demo mode or connect MetaMask for the live chain path." }
                ],
                footer: "This is the cleanest way to review the app locally."
            },
            {
                kicker: "Usage notes",
                title: "What each page is for",
                copy: "The blueprint pages are organized around the core drug-verification workflow.",
                points: [
                    { icon: "◉", title: "Verify", detail: "Scan QR codes or manually verify batch IDs." },
                    { icon: "⇄", title: "Track", detail: "Trace custody hops, export proofs, and share the journey." },
                    { icon: "▣", title: "Dashboard", detail: "Register batches, maintain drafts, and generate QR codes." }
                ],
                footer: "Useful for both demo narration and actual testing."
            }
        ],
        actions: [
            { label: "Copy launch steps", kind: "copy", value: "npm start\nopen http://localhost:3000/\nuse frontend/index.html for direct demo mode", toast: "Launch steps copied", variant: "btn-grad" },
            { label: "Download guide", kind: "download", filename: "dawatrace-quick-start.txt", value: "DawaTrace quick start\n\n1. Run npm start.\n2. Open http://localhost:3000/.\n3. Use demo mode or connect MetaMask.\n4. Verify a sample batch such as DWT-AMX-2026-0528.", mime: "text/plain", variant: "btn-ghost" },
            { label: "Open dashboard", kind: "page", value: "dashboard", variant: "btn-soft" }
        ]
    },
    legal: {
        badge: "Legal",
        title: "Terms and privacy, summarized for the demo build.",
        description: "The legal links now lead to a concrete explanation of how the app handles data and on-chain actions.",
        metrics: [
            { label: "Storage", value: "Local first", detail: "Drafts and UI state use browser storage when needed." },
            { label: "Blockchain", value: "Transparent", detail: "Verification and custody events are written to the chain in live mode." },
            { label: "Demo data", value: "Synthetic", detail: "The built-in database is only for local demonstration." },
            { label: "Consent", value: "Explicit", detail: "Wallet connection and camera use require the user to opt in." }
        ],
        panels: [
            {
                kicker: "Terms",
                title: "What the build expects",
                copy: "Use the interface for verification, traceability, and batch management in a way that respects the workflow.",
                points: [
                    { icon: "✓", title: "User consent", detail: "Connecting a wallet or using the camera should always be explicit." },
                    { icon: "✓", title: "Data integrity", detail: "Proofs and exports are generated from the current verification state." },
                    { icon: "✓", title: "Demo caveat", detail: "Demo mode simulates a chain when the local blockchain is not running." }
                ],
                footer: "Straightforward terms for a demo that still feels real."
            },
            {
                kicker: "Privacy",
                title: "How user data is handled",
                copy: "The app intentionally keeps personal data light and local where possible.",
                points: [
                    { icon: "◌", title: "Drafts", detail: "Register-form drafts stay in localStorage until the user clears them." },
                    { icon: "◌", title: "QR uploads", detail: "Uploads are processed locally in the browser for the demo flow." },
                    { icon: "◌", title: "On-chain actions", detail: "Only the required transaction data is sent to the blockchain." }
                ],
                footer: "Privacy by design, without overcomplicating the front end."
            }
        ],
        actions: [
            { label: "Copy summary", kind: "copy", value: "DawaTrace keeps drafts local, processes QR uploads in-browser for the demo, and only writes required transaction data on-chain.", toast: "Privacy summary copied", variant: "btn-grad" },
            { label: "Back to connect", kind: "page", value: "connect", variant: "btn-ghost" },
            { label: "Open docs", kind: "info", value: "docs", variant: "btn-soft" }
        ]
    }
};

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function openInfoSection(section) {
    currentInfoSection = INFO_SECTION_CONTENT[section] ? section : "features";
    showPage("info");
}

function setupInfoNavigation() {
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-info]");
        if (!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        openInfoSection(trigger.dataset.info);
    }, true);
}

function renderInfoPanel(panel) {
    const points = (panel.points || []).map(point => `
        <div style="display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;background:#F8FAFD;border:1px solid #EEF1F7">
          <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#B8E4FF,#D8C8FF);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;color:#0F1B2D">${escapeHtml(point.icon || "◉")}</div>
          <div>
            <div style="font-weight:700;color:#0F1B2D">${escapeHtml(point.title)}</div>
            <div style="font-size:13px;color:#6B7793;line-height:1.55;margin-top:4px">${escapeHtml(point.detail)}</div>
          </div>
        </div>
    `).join("");

    return `
      <div style="display:flex;flex-direction:column;height:100%">
        <div>
          <div class="kicker">${escapeHtml(panel.kicker || "Overview")}</div>
          <h3 style="margin:8px 0 6px;font-family:'Sora',sans-serif;font-size:24px;color:#0F1B2D">${escapeHtml(panel.title)}</h3>
          <p style="margin:0;color:#6B7793;font-size:14px;line-height:1.6">${escapeHtml(panel.copy)}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:18px">
          ${points}
        </div>
        ${panel.footer ? `<div style="margin-top:auto;padding-top:16px;font-size:13px;color:#3A4761;font-weight:600">${escapeHtml(panel.footer)}</div>` : ""}
      </div>
    `;
}

function renderInfoMetric(metric) {
    return `
      <div class="card" style="padding:16px 18px;background:rgba(255,255,255,.82);backdrop-filter:blur(14px)">
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B7793;font-weight:700">${escapeHtml(metric.label)}</div>
        <div style="font-family:'Sora',sans-serif;font-size:20px;font-weight:800;color:#0F1B2D;margin-top:6px">${escapeHtml(metric.value)}</div>
        <div style="font-size:12px;color:#6B7793;line-height:1.45;margin-top:4px">${escapeHtml(metric.detail)}</div>
      </div>
    `;
}

function renderInfoAction(action) {
    const className = action.variant || "btn-soft";
    let onclick = "";

    switch (action.kind) {
        case "page":
            onclick = `showPage(${JSON.stringify(action.value)})`;
            break;
        case "copy":
            onclick = `copyToClipboard(${JSON.stringify(action.value)}, ${JSON.stringify(action.toast || "Copied")})`;
            break;
        case "download":
            onclick = `downloadText(${JSON.stringify(action.filename || "dawatrace-note.txt")}, ${JSON.stringify(action.value)}, ${JSON.stringify(action.mime || "text/plain")})`;
            break;
        case "mail":
            onclick = `window.location.href=${JSON.stringify(`mailto:${action.value}`)}`;
            break;
        case "run":
            if (action.value === "clearDrafts") {
                onclick = `clearRegisterDraft();showToast(${JSON.stringify(action.toast || "Draft cleared")}, "success")`;
            } else if (action.value === "demoMode") {
                onclick = `enterDemoMode()`;
            }
            break;
        case "info":
            onclick = `openInfoSection(${JSON.stringify(action.value)})`;
            break;
        default:
            onclick = `showToast("Action unavailable", "info")`;
            break;
    }

    return `<button type="button" class="${className}" onclick='${onclick}'>${escapeHtml(action.label)}</button>`;
}

function renderInfoPage(section = currentInfoSection) {
    const content = INFO_SECTION_CONTENT[section] || INFO_SECTION_CONTENT.features;
    currentInfoSection = INFO_SECTION_CONTENT[section] ? section : "features";

    const badge = document.getElementById("infoPageBadge");
    const title = document.getElementById("infoPageTitle");
    const description = document.getElementById("infoPageDescription");
    const metrics = document.getElementById("infoPageMetrics");
    const panelA = document.getElementById("infoPanelA");
    const panelB = document.getElementById("infoPanelB");
    const actions = document.getElementById("infoPageActions");

    if (badge) badge.textContent = content.badge;
    if (title) title.textContent = content.title;
    if (description) description.textContent = content.description;
    if (metrics) metrics.innerHTML = content.metrics.map(renderInfoMetric).join("");
    if (panelA) panelA.innerHTML = renderInfoPanel(content.panels[0]);
    if (panelB) panelB.innerHTML = renderInfoPanel(content.panels[1]);
    if (actions) actions.innerHTML = content.actions.map(renderInfoAction).join("");
}

function renderProductDetail(productId = selectedProductId) {
    const product = getProduct(productId);
    selectedProductId = product.id;
    selectedProductName = product.name;

    const breadcrumb = document.getElementById("productDetailBreadcrumb");
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <span>Products</span>
            <span style="margin:0 6px;color:#CBD5E1">›</span>
            <span>${product.categoryLabel}</span>
            <span style="margin:0 6px;color:#CBD5E1">›</span>
            <span style="color:#0F1B2D;font-weight:600">${product.name}</span>
        `;
    }

    const heroCard = document.getElementById("productHeroCard");
    if (heroCard) {
        const tags = product.tags.map(tag => {
            const palette = tag === "Rx-only" ? "background:#FEE2E2;color:#EF4444" : tag === "On-chain" ? "background:#E9F7F2;color:#10B981" : "background:#EDE7FF;color:#7C3AED";
            return `<span class="tag" style="${palette}">${tag}</span>`;
        }).join("");

        heroCard.innerHTML = `
          <div style="display:flex;height:100%">
            <div style="width:240px;height:100%;background:${getProductAccent(product)};display:flex;align-items:center;justify-content:center;position:relative">
              <div style="font-size:96px">${product.heroEmoji}</div>
              <span class="pill active" style="position:absolute;left:14px;top:14px">● Active</span>
            </div>
            <div style="flex:1;padding:24px 28px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${tags}</div>
              <h2 style="margin:6px 0 4px 0;font-family:'Sora',sans-serif;font-size:28px;line-height:1.1;color:#0F1B2D">${product.name}</h2>
              <div style="font-size:13px;color:#6B7793">${product.subtitle}</div>
              <div style="display:flex;gap:32px;margin-top:18px">
                <div><div style="font-size:11px;color:#6B7793;font-weight:600">SKU</div><div style="font-family:monospace;font-weight:700;color:#0F1B2D;margin-top:2px">${product.sku}</div></div>
                <div><div style="font-size:11px;color:#6B7793;font-weight:600">Manufacturer</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.manufacturer}</div></div>
                <div><div style="font-size:11px;color:#6B7793;font-weight:600">Created</div><div style="font-weight:700;color:#0F1B2D;margin-top:2px">${product.created}</div></div>
                <div><div style="font-size:11px;color:#6B7793;font-weight:600">Contract</div><div style="font-family:monospace;font-weight:700;color:#7C3AED;margin-top:2px">${product.contract} ↗</div></div>
              </div>
              <div style="display:flex;gap:10px;margin-top:18px">
                <button type="button" class="btn-ghost" data-action="generate-product-qr" style="padding:9px 18px;font-size:13px">▦ Generate QR</button>
                <button type="button" class="btn-soft" data-action="copy-sku">📋 Copy SKU</button>
                <button type="button" class="btn-soft" data-action="view-product-explorer">◉ View on explorer</button>
              </div>
            </div>
          </div>
        `;
    }

    const trustCard = document.getElementById("productTrustCard");
    if (trustCard) {
        trustCard.innerHTML = `
          <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#0F1B2D;margin-bottom:14px">◉ On-chain trust</div>
          <div style="display:flex;align-items:center;gap:14px">
            <svg width="80" height="80" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#EDE9FE" stroke-width="12" fill="none"></circle>
              <circle cx="50" cy="50" r="42" stroke="url(#tg)" stroke-width="12" fill="none" stroke-dasharray="263 264" stroke-linecap="round" transform="rotate(-90 50 50)"></circle>
              <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#22D3EE"></stop><stop offset="1" stop-color="#7C3AED"></stop></linearGradient></defs>
              <text x="50" y="55" text-anchor="middle" font-family="Sora" font-size="16" font-weight="700" fill="#0F1B2D">${product.stats.trustRate}</text>
            </svg>
            <div>
              <div style="font-family:'Sora',sans-serif;font-size:24px;font-weight:800;color:#0F1B2D;line-height:1">${product.stats.verifiedScans}</div>
              <div style="font-size:11px;color:#6B7793;margin-top:2px">verified scans</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-top:18px;font-size:12px">
            <div><div style="color:#6B7793">Batches</div><div style="color:#0F1B2D;font-weight:700">${product.stats.batches}</div></div>
            <div><div style="color:#6B7793">In transit</div><div style="color:#7C3AED;font-weight:700">${product.stats.inTransit}</div></div>
            <div><div style="color:#6B7793">Regions</div><div style="color:#0F1B2D;font-weight:700">${product.stats.regions}</div></div>
            <div><div style="color:#6B7793">Counterfeits</div><div style="color:#EF4444;font-weight:700">${product.stats.counterfeits}</div></div>
          </div>
        `;
    }
}

function applyProductSearchFilter() {
    const query = normalizeQuery(productSearchQuery);
    const cards = document.querySelectorAll("#page-products .product-card[data-product]");

    cards.forEach(card => {
        const product = getProduct(card.dataset.product);
        const haystack = normalizeQuery([
            product.name,
            product.sku,
            product.categoryLabel,
            product.summary,
            card.textContent
        ].join(" "));
        const matchesQuery = !query || haystack.includes(query);
        const matchesFilter = currentProductFilter === "all" || card.dataset.category === currentProductFilter;
        card.style.display = matchesQuery && matchesFilter ? "" : "none";
    });
}

function applyBatchSearchFilter() {
    const query = normalizeQuery(batchSearchQuery);
    const list = document.getElementById("batchList");
    if (!list) return;

    const rows = list.querySelectorAll("[data-batch-id]");
    rows.forEach(row => {
        const haystack = normalizeQuery(row.textContent);
        row.style.display = !query || haystack.includes(query) ? "" : "none";
    });

    const visibleCount = Array.from(rows).filter(row => row.style.display !== "none").length;
    const emptyState = list.querySelector(".batch-empty-state");
    if (emptyState) {
        emptyState.style.display = visibleCount ? "none" : "flex";
    }
}

function syncPageState(page) {
    switch (page) {
        case "info":
            renderInfoPage(currentInfoSection);
            break;
        case "dashboard":
            restoreRegisterDraft();
            loadStats();
            loadBatches();
            break;
        case "products":
            applyProductSearchFilter();
            break;
        case "product-detail":
            renderProductDetail(selectedProductId);
            break;
        case "batches":
            applyBatchSearchFilter();
            break;
        case "track":
            if (lastVerifiedBatchId) {
                const input = document.getElementById("trackBatchId");
                if (input && !input.value.trim()) {
                    input.value = lastVerifiedBatchId;
                }
            }
            break;
        case "analytics":
            break;
        case "result":
            if (lastVerifiedBatchId) {
                // keep the current result visible when returning to this page
            }
            break;
        case "mobile":
            break;
        default:
            break;
    }
}

function getVerificationSummary() {
    const result = lastVerificationResult || { isAuthentic: false };
    return {
        batchId: lastVerifiedBatchId,
        result,
        chain: lastVerificationChain,
        generatedAt: new Date().toISOString(),
        contractAddress,
        mode: demoMode ? "demo" : "live"
    };
}

function openExplorerFor(reference) {
    const target = String(reference || "").trim();
    if (!target) {
        showToast("No explorer reference available", "error");
        return;
    }

    let url = `https://polygonscan.com/search?f=0&q=${encodeURIComponent(target)}`;
    if (/^0x[a-fA-F0-9]{40}$/.test(target)) {
        url = `https://polygonscan.com/address/${target}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
}

function exportRowsToCsv(filename, rows) {
    if (!rows.length) {
        showToast("Nothing to export yet", "error");
        return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(","),
        ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
    ].join("\n");
    downloadText(filename, csv, "text/csv");
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init() {
    // Try to load deployment info
    try {
        const res = await fetch("../deployment.json");
        if (res.ok) {
            const info = await res.json();
            contractAddress = info.contractAddress;
            console.log("📄 Loaded contract address:", contractAddress);
        }
    } catch (e) {
        console.log("No deployment.json found, running in demo mode");
    }

    // Setup event listeners
    setupNavigation();
    setupInfoNavigation();
    setupVerifyTabs();
    setupForms();
    setupActionButtons();
    setupSearchInputs();
    window.addEventListener("resize", fitCanvas);
    fitCanvas();
    showPage("landing");

    connectWalletBtn.addEventListener("click", connectWallet);
    document.getElementById("verifyBtn").addEventListener("click", verifyManual);
    document.getElementById("startScan").addEventListener("click", startQRScanner);
    document.getElementById("trackBtn").addEventListener("click", trackBatch);
    document.getElementById("refreshBatches").addEventListener("click", loadBatches);

    // Start in demo mode - load stats immediately
    enterDemoMode();

    // Try auto-connecting to blockchain
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (e) {
            console.log("Auto-connect skipped, staying in demo mode");
        }
    }
}

function enterDemoMode() {
    demoMode = true;
    isConnected = false;
    connectWalletBtn.innerHTML = `
        <span class="wallet-dot"></span>
        Connect Wallet
    `;
    connectWalletBtn.classList.remove("connected");
    loadStats();
    loadBatches();
    console.log("🎮 DawaTrace running in Demo Mode");
}

// ============================================================
// WALLET CONNECTION
// ============================================================

async function connectWallet() {
    if (isConnected) {
        isConnected = false;
        demoMode = true;
        contract = null;
        signer = null;
        provider = null;
        showToast("Disconnected", "success");
        enterDemoMode();
        return;
    }

    if (!window.ethereum) {
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 100));
            if (window.ethereum) break;
        }
    }

    if (!window.ethereum) {
        enterDemoMode();
        return;
    }

    try {
        // Step 1: Auto-switch to Hardhat localhost network
        const HARDHAT_CHAIN_ID = "0x539"; // 1337 in hex
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: HARDHAT_CHAIN_ID }],
            });
        } catch (switchError) {
            // Network doesn't exist — add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: HARDHAT_CHAIN_ID,
                            chainName: "Hardhat Local",
                            rpcUrls: ["http://127.0.0.1:8545"],
                            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                        }],
                    });
                } catch (addError) {
                    console.log("Could not auto-add local RPC (common in Trust Wallet). Using current network.", addError);
                }
            }
        }

        // Step 2: Connect wallet
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Step 3: Use contract address from deployment.json or default
        if (!contractAddress) {
            contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        }

        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        isConnected = true;
        demoMode = false;

        connectWalletBtn.innerHTML = `
            <span class="wallet-dot"></span>
            ${address.slice(0, 6)}...${address.slice(-4)}
        `;
        connectWalletBtn.classList.add("connected");

        showToast("Connected", "success");
        loadStats();
        loadBatches();

        window.ethereum.on("accountsChanged", () => window.location.reload());
        window.ethereum.on("chainChanged", () => window.location.reload());

    } catch (err) {
        console.error("Connection error:", err);
        enterDemoMode();
    }
}

function ensureConnected() {
    // In demo mode, always "connected"
    if (demoMode) return true;
    if (!isConnected || !contract) {
        showToast("Please connect your wallet first", "error");
        return false;
    }
    return true;
}

// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const target = link.dataset.page;

            if (link.dataset.action === "mint-new-batch" && target === "dashboard") {
                pendingDashboardPrefill = selectedProductId;
            }
            if (target === "product-detail" && link.dataset.product) {
                selectedProductId = link.dataset.product;
            }

            // Close mobile menu if open
            const navMenu = document.querySelector('.nav-links');
            if (navMenu && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
            }

            showPage(target);
        });
    });
}

function setupVerifyTabs() {
    verifyTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            verifyTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            document.querySelectorAll(".verify-content").forEach(c => c.classList.add("hidden"));
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove("hidden");
        });
    });
}

function setupActionButtons() {
    document.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        if (button.type === "submit") return;

        const action = button.dataset.action;
        switch (action) {
            case "save-draft":
                saveRegisterDraft();
                break;
            case "download-proof":
            case "save-proof":
                downloadProof();
                break;
            case "view-explorer":
                openExplorerFor(lastVerifiedBatchId || contractAddress);
                break;
            case "export-trace":
                exportTrace();
                break;
            case "share-trace":
                shareTrace();
                break;
            case "export-products":
                exportProducts();
                break;
            case "toggle-product-filter":
                toggleProductFilter();
                break;
            case "export-batches":
                exportBatches();
                break;
            case "report-analytics":
                exportAnalyticsReport();
                break;
            case "share-analytics":
                shareAnalytics();
                break;
            case "share-product":
                shareProduct();
                break;
            case "edit-product":
                pendingDashboardPrefill = selectedProductId;
                showPage("dashboard");
                showToast(`Editing ${getProduct().name}`, "success");
                break;
            case "product-overview":
                showPage("product-detail");
                break;
            case "product-batches":
                await openProductBatchesForProduct();
                break;
            case "product-qr":
                generateQR(getProduct().sku);
                break;
            case "product-verifications":
                await openProductVerificationForProduct();
                break;
            case "product-audit":
                await openProductAuditTrailForProduct();
                break;
            case "product-compliance":
                openProductComplianceForProduct();
                break;
            case "mint-new-batch":
                pendingDashboardPrefill = selectedProductId;
                if (button.dataset.page !== "dashboard") {
                    showPage("dashboard");
                }
                showToast(`Ready to mint a new ${getProduct().name} batch`, "success");
                break;
            case "generate-product-qr":
                generateQR(getProduct().sku);
                break;
            case "copy-sku":
                copyToClipboard(getProduct().sku, "SKU copied!");
                break;
            case "view-product-explorer":
                openExplorerFor(`${getProduct().name} ${getProduct().sku}`);
                break;
            case "share-proof":
                shareProof();
                break;
            default:
                break;
        }
    });
}

function setupSearchInputs() {
    const productSearch = document.getElementById("productSearch");
    if (productSearch) {
        productSearch.addEventListener("input", () => {
            productSearchQuery = productSearch.value;
            applyProductSearchFilter();
        });
    }

    const batchSearch = document.getElementById("batchSearch");
    if (batchSearch) {
        batchSearch.addEventListener("input", () => {
            batchSearchQuery = batchSearch.value;
            applyBatchSearchFilter();
        });
    }
}

function toggleProductFilter() {
    const filters = ["all", "antibiotic", "tablet", "vial", "syrup", "vaccine", "sachet"];
    const currentIndex = filters.indexOf(currentProductFilter);
    currentProductFilter = filters[(currentIndex + 1) % filters.length] || "all";
    applyProductSearchFilter();

    const labelMap = {
        all: "All products",
        antibiotic: "Antibiotics",
        tablet: "Tablets",
        vial: "Vials",
        syrup: "Syrups",
        vaccine: "Vaccines",
        sachet: "Sachets"
    };
    showToast(`Filter applied: ${labelMap[currentProductFilter] || "All products"}`, "success");
}

function downloadProof() {
    if (!lastVerifiedBatchId) {
        showToast("Verify a batch first to generate proof", "error");
        return;
    }

    const proof = getVerificationSummary();
    downloadJson(`dawatrace-proof-${lastVerifiedBatchId}.json`, proof);
    showToast("Verification proof downloaded", "success");
}

function shareProof() {
    if (!lastVerifiedBatchId) {
        showToast("Verify a batch first to share proof", "error");
        return;
    }

    const proof = getVerificationSummary();
    const text = `DawaTrace proof for ${proof.batchId}: ${proof.result.isAuthentic ? "authentic" : "not verified"} (${proof.mode})`;
    shareText("DawaTrace Proof", text);
}

function exportTrace() {
    const batchId = document.getElementById("trackBatchId")?.value?.trim() || lastVerifiedBatchId;
    if (!batchId) {
        showToast("Enter or verify a batch before exporting trace", "error");
        return;
    }

    const batch = demoMode ? DEMO_DB.batches[batchId] || DEMO_DB.runtimeBatches.find(b => b.id === batchId) : null;
    const chain = demoMode ? DEMO_DB.custodyChains[batchId] || [] : lastVerificationChain;
    const payload = {
        batchId,
        product: batch ? batch.drugName : selectedProductName || "Unknown",
        generatedAt: new Date().toISOString(),
        chain,
        mode: demoMode ? "demo" : "live"
    };

    downloadJson(`dawatrace-trace-${batchId}.json`, payload);
    showToast("Trace exported", "success");
}

function shareTrace() {
    const batchId = document.getElementById("trackBatchId")?.value?.trim() || lastVerifiedBatchId;
    if (!batchId) {
        showToast("Enter a batch before sharing trace", "error");
        return;
    }

    const text = `DawaTrace trace for ${batchId}${selectedProductName ? ` · ${selectedProductName}` : ""}`;
    shareText("DawaTrace Trace", text);
}

function exportProducts() {
    const cards = Array.from(document.querySelectorAll("#page-products .product-card[data-product]"))
        .filter(card => card.style.display !== "none");

    const rows = cards.map(card => {
        const product = getProduct(card.dataset.product);
        return {
            name: product.name,
            sku: product.sku,
            category: product.categoryLabel,
            manufacturer: product.manufacturer,
            contract: product.contract,
            trustRate: product.stats.trustRate
        };
    });

    exportRowsToCsv("dawatrace-products.csv", rows);
    showToast("Products exported", "success");
}

function exportBatches() {
    const query = normalizeQuery(batchSearchQuery);
    const rows = lastRenderedBatches
        .filter(row => {
            const haystack = normalizeQuery([row.batchNumber, row.drugName, row.manufacturerName, row.route].join(" "));
            return !query || haystack.includes(query);
        })
        .map(row => ({
            batchNumber: row.batchNumber,
            product: row.drugName,
            manufacturer: row.manufacturerName,
            status: row.isExpired ? "Expired" : row.isAuthentic ? "Active" : "Pending",
            expiry: formatDateLabel(row.expiryDate),
            route: row.route
        }));

    exportRowsToCsv("dawatrace-batches.csv", rows);
    showToast("Batch list exported", "success");
}

function exportAnalyticsReport() {
    const report = {
        generatedAt: new Date().toISOString(),
        verifications: 48217,
        authenticRate: "99.4%",
        counterfeitsBlocked: 312,
        avgTraceTime: "1.8s",
        activeRegions: 7,
        mode: demoMode ? "demo" : "live"
    };

    downloadJson("dawatrace-analytics-report.json", report);
    showToast("Analytics report downloaded", "success");
}

function shareAnalytics() {
    const text = "DawaTrace analytics: 48,217 verifications, 99.4% authentic rate, 312 counterfeits blocked.";
    shareText("DawaTrace Analytics", text);
}

function shareProduct() {
    const product = getProduct();
    const text = `${product.name} (${product.sku}) · ${product.summary}`;
    shareText(product.name, text);
}

// ============================================================
// DRUG VERIFICATION
// ============================================================

async function verifyManual() {
    const batchId = document.getElementById("batchIdInput").value.trim();
    if (!batchId) {
        showToast("Please enter a Batch ID", "error");
        return;
    }
    await verifyDrug(batchId);
}

async function verifyDrug(batchId) {
    if (!ensureConnected()) return;

    const btn = document.getElementById("verifyBtn");
    const origText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Verifying on blockchain...';
    btn.disabled = true;

    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 1200));

    if (demoMode) {
        // --- DEMO MODE VERIFICATION ---
        const batch = DEMO_DB.batches[batchId] ||
            DEMO_DB.runtimeBatches.find(b => b.id === batchId);

        if (batch) {
            const chain = DEMO_DB.custodyChains[batchId] || [];
            displayResult({
                isAuthentic: true,
                drugName: batch.drugName,
                batchNumber: batch.batchNumber,
                manufacturerName: batch.manufacturerName,
                manufactureDate: BigInt(batch.manufactureDate),
                expiryDate: BigInt(batch.expiryDate),
                isExpired: batch.isExpired,
                custodyCount: BigInt(batch.custodyCount || 1)
            }, batchId, chain);
        } else {
            displayResult({ isAuthentic: false }, batchId, []);
        }
        DEMO_DB.stats.verifications++;
    } else {
        // --- LIVE BLOCKCHAIN VERIFICATION ---
        try {
            const result = await contract.verifyDrugView(batchId);
            const chain = result.isAuthentic ? await contract.getCustodyChain(batchId) : [];
            displayResult(result, batchId, chain);
        } catch (err) {
            console.error("Verification error:", err);
            displayResult({ isAuthentic: false }, batchId, []);
        }
    }

    btn.innerHTML = origText;
    btn.disabled = false;
}

function displayResult(result, batchId, chain = []) {
    const section = document.getElementById("resultSection");
    const card = document.getElementById("resultCard");
    const banner = document.getElementById("resultBanner");
    const bannerLabel = document.getElementById("resultBannerLabel");
    const bannerTitle = document.getElementById("resultBannerTitle");
    const bannerSub = document.getElementById("resultBannerSub");
    const journey = document.getElementById("resultJourneyContent");

    showPage("result");
    if (section) {
        section.classList.remove("hidden");
    }

    lastVerifiedBatchId = batchId;
    lastVerificationResult = result;
    lastVerificationChain = Array.isArray(chain) ? chain : [];
    if (result && result.drugName) {
        selectedProductName = result.drugName;
    }
    const txLabel = formatShortAddress(batchId);
    const isAuthentic = !!result.isAuthentic;

    if (banner) {
        banner.style.background = isAuthentic
            ? "linear-gradient(135deg,#10B981 0%,#22D3EE 60%,#7C3AED 100%)"
            : "linear-gradient(135deg,#EF4444 0%,#F59E0B 100%)";
    }

    if (bannerLabel) {
        bannerLabel.textContent = isAuthentic ? "VERIFICATION SUCCESSFUL" : "VERIFICATION FAILED";
    }
    if (bannerTitle) {
        bannerTitle.textContent = isAuthentic
            ? "This product is authentic."
            : "This batch could not be verified.";
    }
    if (bannerSub) {
        bannerSub.innerHTML = isAuthentic
            ? `Confirmed on-chain · ref <span style="font-family:monospace">${txLabel}</span>`
            : `No on-chain match found · searched <span style="font-family:monospace">${txLabel}</span>`;
    }

    if (isAuthentic) {
        const mfgDate = formatDateLabel(result.manufactureDate);
        const expDate = formatDateLabel(result.expiryDate);
        const expiryBadge = result.isExpired ? '<span class="expired-badge">⚠️ EXPIRED</span>' : '';

        card.className = "card result-card authentic";
        card.innerHTML = `
            <div class="result-icon" style="background:linear-gradient(135deg,#10B981,#22D3EE);color:#fff">✓</div>
            <div class="result-title">Verified medicine</div>
            <div class="result-subtitle">This batch was validated against the blockchain registry.</div>

            <div class="result-details">
                <div class="result-detail">
                    <div class="result-detail-label">Drug Name</div>
                    <div class="result-detail-value">${result.drugName}</div>
                </div>
                <div class="result-detail">
                    <div class="result-detail-label">Batch Number</div>
                    <div class="result-detail-value">${result.batchNumber}</div>
                </div>
                <div class="result-detail">
                    <div class="result-detail-label">Manufacturer</div>
                    <div class="result-detail-value">${result.manufacturerName}</div>
                </div>
                <div class="result-detail">
                    <div class="result-detail-label">Manufacture Date</div>
                    <div class="result-detail-value">${mfgDate}</div>
                </div>
                <div class="result-detail">
                    <div class="result-detail-label">Expiry Date</div>
                    <div class="result-detail-value">${expDate} ${expiryBadge}</div>
                </div>
                <div class="result-detail">
                    <div class="result-detail-label">Custody Transfers</div>
                    <div class="result-detail-value">${Number(result.custodyCount)} verified handoffs</div>
                </div>
            </div>

            <div class="result-actions">
                <button class="btn btn-primary" onclick="trackFromResult('${batchId}')">View full supply chain</button>
                <button class="btn btn-secondary" onclick="copyBatchId('${batchId}')">Copy batch ref</button>
            </div>
        `;
    } else {
        card.className = "card result-card counterfeit";
        card.innerHTML = `
            <div class="result-icon" style="background:linear-gradient(135deg,#EF4444,#F59E0B);color:#fff">!</div>
            <div class="result-title">Verification failed</div>
            <div class="result-subtitle">We could not match this batch to a trusted on-chain record.</div>

            <div class="result-details" style="grid-template-columns:1fr;">
                <div class="result-detail">
                    <div class="result-detail-label">Searched Batch Ref</div>
                    <div class="result-detail-value" style="font-size:12px;word-break:break-all">${batchId}</div>
                </div>
            </div>

            <div class="result-actions">
                <button class="btn btn-primary" style="background:#EF4444;box-shadow:0 10px 24px rgba(239,68,68,.2)" onclick="reportCounterfeit('${batchId}')">Report counterfeit</button>
                <button class="btn btn-secondary" onclick="showPage('verify')">Try another batch</button>
            </div>
        `;
    }

    if (journey) {
        if (isAuthentic && lastVerificationChain.length) {
            const roleNames = ["None", "Manufacturer", "Distributor", "Pharmacy"];
            journey.innerHTML = lastVerificationChain.slice(0, 5).map((record, index) => {
                const stepName = roleNames[Number(record.toRole)] || "Trace";
                const time = new Date(Number(record.timestamp) * 1000).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric"
                });
                const color = ["#B8E4FF", "#FFC9D6", "#FFE08A", "#D8C8FF", "#A8F0DC"][index % 5];
                return `
                    <div style="flex:1;min-width:0;text-align:center">
                        <div style="width:48px;height:48px;border-radius:14px;background:${color};display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#0F1B2D">${stepName.charAt(0)}</div>
                        <div style="font-size:13px;font-weight:700;margin-top:8px;color:#0F1B2D">${stepName}</div>
                        <div style="font-size:11px;color:#6B7793">${time}</div>
                    </div>
                `;
            }).join(`<div style="height:48px;display:flex;align-items:center;color:#CBD5E1;font-size:18px">›</div>`);
        } else if (isAuthentic) {
            journey.innerHTML = `<div class="empty-state">No custody trail is available for this batch yet.</div>`;
        } else {
            journey.innerHTML = `<div class="empty-state">Try a different batch or report the suspicious code for review.</div>`;
        }
    }
}

async function reportCounterfeit(batchId) {
    let location = "Unknown Location";

    // Try to get location
    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    } catch (e) {
        location = "Kisumu, Kenya (GPS unavailable)";
    }

    if (demoMode) {
        await new Promise(r => setTimeout(r, 800));
        showToast(`🚨 Counterfeit report filed! Location: ${location}`, "success");
        return;
    }

    if (!ensureConnected()) return;

    try {
        const tx = await contract.reportCounterfeit(batchId, location);
        showToast("🚨 Submitting counterfeit report...", "success");
        await tx.wait();
        showToast(`🚨 Counterfeit report confirmed on blockchain! Location: ${location}`, "success");
    } catch (err) {
        console.error("Report error:", err);
        showToast("Failed to submit report", "error");
    }
}

// ============================================================
// QR CODE SCANNER
// ============================================================

let html5QrScanner = null;
let scannerRunning = false;

async function startQRScanner() {
    const reader = document.getElementById("qr-reader");
    const btn = document.getElementById("startScan");

    if (scannerRunning && html5QrScanner) {
        await html5QrScanner.stop();
        scannerRunning = false;
        btn.innerHTML = "📷 Start Scanner";
        reader.innerHTML = `
            <div class="qr-placeholder">
                <div class="qr-frame"></div>
                <p>Click to start camera</p>
            </div>`;
        return;
    }

    reader.innerHTML = "";
    btn.innerHTML = "⏹️ Stop Scanner";

    try {
        html5QrScanner = new Html5Qrcode("qr-reader");

        await html5QrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
                console.log("🔍 QR scanned:", decodedText);
                await html5QrScanner.stop();
                scannerRunning = false;
                btn.innerHTML = "📷 Start Scanner";
                reader.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                        <p style="color: var(--accent-green); font-weight: 600; margin-bottom: 0.5rem;">QR Code Scanned!</p>
                        <p style="color: var(--text-muted); font-size: 0.8rem; word-break: break-all;">${decodedText}</p>
                    </div>`;
                showToast("QR code scanned! Verifying...", "success");
                await verifyDrug(decodedText);
            },
            () => { /* no QR in frame, ignore */ }
        );
        scannerRunning = true;
    } catch (err) {
        console.error("Camera error:", err);
        reader.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--accent-red); margin-bottom: 1rem;">📷 Camera not available</p>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">Upload a QR code image instead:</p>
                <input type="file" id="qrFileInput" accept="image/*" style="display: none;" onchange="handleQRFile(event)">
                <button class="btn btn-secondary" onclick="document.getElementById('qrFileInput').click()">📁 Upload QR Image</button>
                <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 1rem;">Or switch to "Enter Batch ID" tab</p>
            </div>`;
        btn.innerHTML = "📷 Start Scanner";
    }
}

function handleQRFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            showToast("QR code read! Verifying...", "success");
            verifyDrug(decodedText);
        })
        .catch(() => showToast("Could not read QR code from image", "error"));
}

// ============================================================
// QR CODE GENERATION
// ============================================================

function generateQR(batchId) {
    const container = document.getElementById("qrCodeDisplay");
    container.innerHTML = "";

    new QRCode(container, {
        text: batchId,
        width: 200,
        height: 200,
        colorDark: "#0a0e1a",
        colorLight: "#ffffff"
    });

    document.getElementById("qrBatchIdDisplay").textContent = batchId;
    document.getElementById("qrModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("qrModal").classList.add("hidden");
}

function toggleTransferModal(open = true) {
    const modal = document.getElementById("transferModal");
    if (!modal) return;
    modal.classList.toggle("hidden", !open);
}

// ============================================================
// MANUFACTURER DASHBOARD
// ============================================================

function setupForms() {
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!ensureConnected()) return;

        const drugName = document.getElementById("drugName").value;
        const batchNumber = document.getElementById("batchNumber").value;
        const expiryStr = document.getElementById("expiryDate").value;
        const ipfsHash = document.getElementById("ipfsHash").value || "";

        const expiryDate = Math.floor(new Date(expiryStr).getTime() / 1000);

        const btn = e.target.querySelector("button[type=submit]");
        const origText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Registering on blockchain...';
        btn.disabled = true;

        if (demoMode) {
            // --- DEMO MODE REGISTRATION ---
            await new Promise(r => setTimeout(r, 1500));

            // Generate a demo batch ID
            const batchId = `DWT-${batchNumber.replace(/[^A-Z0-9]/gi, '-').toUpperCase()}`;

            // Store in runtime database
            DEMO_DB.batches[batchId] = {
                drugName,
                batchNumber,
                manufacturerName: "Demo Manufacturer",
                manufacturer: "0xDemoAddress",
                manufactureDate: Math.floor(Date.now() / 1000),
                expiryDate: expiryDate,
                ipfsMetadataHash: ipfsHash,
                exists: true,
                custodyCount: 1,
                isAuthentic: true,
                isExpired: false
            };

            DEMO_DB.custodyChains[batchId] = [
                { from: "0x0000000000000000000000000000000000000000", to: "0xDemoManufacturer", timestamp: Math.floor(Date.now() / 1000), location: "Manufacturing Facility, Nairobi", fromRole: 0, toRole: 1 }
            ];

            DEMO_DB.stats.batches++;

            showToast(`✅ Batch registered! ID: ${batchId}`, "success");
            e.target.reset();
            clearRegisterDraft();
            loadBatches();
            generateQR(batchId);
        } else {
            // --- LIVE BLOCKCHAIN REGISTRATION ---
            try {
                const tx = await contract.registerDrugBatch(drugName, batchNumber, expiryDate, ipfsHash);
                const receipt = await tx.wait();

                const event = receipt.logs.find(log => {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        return parsed && parsed.name === "DrugBatchRegistered";
                    } catch { return false; }
                });

                let batchId = "Unknown";
                if (event) {
                    const parsed = contract.interface.parseLog(event);
                    batchId = parsed.args[0];
                }

                showToast(`✅ Batch registered! ID: ${batchId.slice(0, 10)}...`, "success");
                e.target.reset();
                clearRegisterDraft();
                loadBatches();
                generateQR(batchId);
            } catch (err) {
                console.error("Registration error:", err);
                showToast("Failed to register batch: " + (err.reason || err.message), "error");
            }
        }

        btn.innerHTML = origText;
        btn.disabled = false;
    });

    document.getElementById("transferForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!ensureConnected()) return;

        const batchId = document.getElementById("transferBatchId").value;
        const to = document.getElementById("recipientAddress").value;
        const location = document.getElementById("transferLocation").value;

        const btn = e.target.querySelector("button[type=submit]");
        const origText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Transferring on blockchain...';
        btn.disabled = true;

        if (demoMode) {
            // --- DEMO MODE TRANSFER ---
            await new Promise(r => setTimeout(r, 1000));

            const chain = DEMO_DB.custodyChains[batchId];
            if (chain) {
                chain.push({
                    from: chain[chain.length - 1].to,
                    to: to,
                    timestamp: Math.floor(Date.now() / 1000),
                    location: location,
                    fromRole: chain[chain.length - 1].toRole,
                    toRole: Math.min(chain[chain.length - 1].toRole + 1, 3)
                });
                if (DEMO_DB.batches[batchId]) {
                    DEMO_DB.batches[batchId].custodyCount = chain.length;
                }
                showToast("✅ Custody transferred!", "success");
            } else {
                showToast("Batch not found in demo database", "error");
            }
            e.target.reset();
        } else {
            // --- LIVE BLOCKCHAIN TRANSFER ---
            try {
                const tx = await contract.transferCustody(batchId, to, location);
                await tx.wait();
                showToast("✅ Custody transferred!", "success");
                e.target.reset();
            } catch (err) {
                console.error("Transfer error:", err);
                showToast("Transfer failed: " + (err.reason || err.message), "error");
            }
        }

        btn.innerHTML = origText;
        btn.disabled = false;
    });
}

// ============================================================
// BATCH LIST
// ============================================================

async function loadBatches() {
    const preview = document.getElementById("batchListPreview");
    const list = document.getElementById("batchList");

    if (!preview && !list) return;

    const rows = [];

    if (demoMode) {
        for (const [id, batch] of Object.entries(DEMO_DB.batches)) {
            rows.push({
                id,
                drugName: batch.drugName,
                batchNumber: batch.batchNumber,
                manufacturerName: batch.manufacturerName,
                expiryDate: batch.expiryDate,
                manufactureDate: batch.manufactureDate,
                isExpired: !!batch.isExpired,
                isAuthentic: batch.isAuthentic !== false,
                route: "Manufacturer → Pharmacy",
            });
        }
    } else if (contract) {
        try {
            const total = Number(await contract.getTotalBatches());
            for (let i = total - 1; i >= Math.max(0, total - 10); i--) {
                const batchId = await contract.getBatchIdAtIndex(i);
                const batch = await contract.drugBatches(batchId);
                let holder = "";
                try {
                    holder = formatShortAddress(await contract.currentHolder(batchId));
                } catch {
                    holder = "Network";
                }
                rows.push({
                    id: batchId,
                    drugName: batch.drugName,
                    batchNumber: batch.batchNumber,
                    manufacturerName: batch.manufacturerName,
                    expiryDate: batch.expiryDate,
                    manufactureDate: batch.manufactureDate,
                    isExpired: !!batch.expiryDate && Number(batch.expiryDate) * 1000 < Date.now(),
                    isAuthentic: true,
                    route: `${batch.manufacturerName} → ${holder}`,
                });
            }
        } catch (err) {
            console.error("Load batches error:", err);
            if (list) {
                list.innerHTML = '<div class="empty-state">Error loading batches</div>';
            }
            if (preview) {
                preview.innerHTML = '<div class="empty-state">Error loading batch preview</div>';
            }
            return;
        }
    }

    const sorted = rows.sort((a, b) => Number(b.manufactureDate || 0) - Number(a.manufactureDate || 0));
    lastRenderedBatches = sorted.map(row => ({ ...row }));

    const renderStatusPill = (row) => {
        if (row.isExpired) return `<span class="pill expired">Expired</span>`;
        return row.isAuthentic ? `<span class="pill active">Active</span>` : `<span class="pill pending">Pending</span>`;
    };

    if (preview) {
        if (!sorted.length) {
            preview.innerHTML = '<div class="empty-state">No batches registered yet</div>';
        } else {
            preview.innerHTML = sorted.slice(0, 3).map(row => `
                <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 14px">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0">
                        <span class="${row.isExpired ? 'pill expired' : 'pill active'}">${row.isExpired ? 'Expired' : 'Active'}</span>
                        <div style="min-width:0">
                            <div style="font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${row.batchNumber}</div>
                            <div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${row.drugName}</div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="generateQR('${row.id}')">QR</button>
                </div>
            `).join("");
        }
    }

    if (list) {
        if (!sorted.length) {
            list.innerHTML = '<div class="empty-state">No batches registered yet</div>';
            return;
        }

        list.innerHTML = sorted.map(row => `
            <div class="batch-item" data-batch-id="${String(row.id)}" style="display:grid;grid-template-columns:160px 1.4fr 1fr 130px 130px 1fr 200px;gap:0;padding:14px 26px;border-bottom:1px solid #F1F3F9;align-items:center;font-size:14px;background:${row.isExpired ? '#FCFCFE' : '#fff'}">
                <div style="font-family:monospace;font-weight:700;color:var(--ink)">${row.batchNumber || formatShortAddress(row.id)}</div>
                <div style="display:flex;align-items:center;gap:10px;min-width:0">
                    <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#B8E4FF,#D8C8FF);display:flex;align-items:center;justify-content:center;flex-shrink:0">💊</div>
                    <div style="min-width:0">
                        <div style="font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${row.drugName}</div>
                        <div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${formatShortAddress(row.id)}</div>
                    </div>
                </div>
                <div style="color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${row.manufacturerName}</div>
                <div>${renderStatusPill(row)}</div>
                <div style="color:${row.isExpired ? '#EF4444' : 'var(--ink)'};font-weight:600">${formatDateLabel(row.expiryDate)}</div>
                <div style="color:var(--ink-2);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${row.route}</div>
                <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="generateQR('${row.id}')">QR</button>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyBatchId('${row.id}')">Copy</button>
                </div>
            </div>
        `).join("") + `
            <div class="batch-empty-state empty-state" style="display:none">No matching batches found</div>
        `;
        applyBatchSearchFilter();
    }
}

function copyBatchId(id) {
    if (!id) {
        showToast("No batch ID available", "error");
        return;
    }
    copyToClipboard(id, "Batch ID copied!");
}

// ============================================================
// BATCH TRACKING
// ============================================================

async function trackBatch() {
    const batchId = document.getElementById("trackBatchId").value.trim();
    if (!batchId) {
        showToast("Please enter a Batch ID", "error");
        return;
    }
    if (!ensureConnected()) return;

    const timeline = document.getElementById("custodyTimeline");
    timeline.innerHTML = '<div class="empty-state"><span class="spinner"></span> Tracing supply chain...</div>';

    // Simulate delay for realism
    await new Promise(r => setTimeout(r, 800));

    if (demoMode) {
        // --- DEMO MODE TRACKING ---
        const chain = DEMO_DB.custodyChains[batchId];
        const batch = DEMO_DB.batches[batchId];

        if (!chain || !batch) {
            timeline.innerHTML = '<div class="empty-state"><p>❌ Batch not found — this medicine cannot be traced</p></div>';
            return;
        }

        lastVerifiedBatchId = batchId;
        lastVerificationResult = {
            isAuthentic: true,
            drugName: batch.drugName,
            batchNumber: batch.batchNumber,
            manufacturerName: batch.manufacturerName,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            isExpired: !!batch.isExpired,
            custodyCount: chain.length
        };
        lastVerificationChain = chain;
        selectedProductName = batch.drugName || selectedProductName;
        renderTimeline(timeline, batch, chain);
        return;
    }

    // --- LIVE BLOCKCHAIN TRACKING ---
    try {
        const chain = await contract.getCustodyChain(batchId);
        const batch = await contract.drugBatches(batchId);

        if (!batch.exists) {
            timeline.innerHTML = '<div class="empty-state"><p>❌ Batch not found on blockchain</p></div>';
            return;
        }

        lastVerifiedBatchId = batchId;
        lastVerificationResult = {
            isAuthentic: true,
            drugName: batch.drugName,
            batchNumber: batch.batchNumber,
            manufacturerName: batch.manufacturerName,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            isExpired: !!batch.isExpired,
            custodyCount: chain.length
        };
        lastVerificationChain = chain;
        selectedProductName = batch.drugName || selectedProductName;
        renderTimeline(timeline, batch, chain);
    } catch (err) {
        console.error("Track error:", err);
        timeline.innerHTML = '<div class="empty-state"><p>Error loading custody chain</p></div>';
    }
}

function renderTimeline(container, batch, chain) {
    const roleNames = ["None", "Manufacturer", "Distributor", "Pharmacy"];
    const roleClasses = ["", "manufacturer", "distributor", "pharmacy"];
    const expiryLabel = formatDateLabel(batch.expiryDate);
    const expiryTs = Number(batch.expiryDate) * 1000;
    const isExpired = typeof batch.isExpired === "boolean" ? batch.isExpired : (expiryTs ? expiryTs < Date.now() : false);
    const auditRows = chain.map((record) => {
        const time = new Date(Number(record.timestamp) * 1000);
        const toRole = roleNames[Number(record.toRole)] || "Unknown";
        const addr = formatShortAddress(record.to);

        return `
            <div class="audit-row">
                <div class="audit-time">${time.toLocaleString()}</div>
                <div class="audit-dot"></div>
                <div class="audit-text">
                    ${toRole} handoff to ${addr} at ${record.location}
                </div>
            </div>
        `;
    }).join("");

    let html = `
        <div class="trace-summary">
            <div>
                <span class="kicker">Batch overview</span>
                <h3>${batch.drugName}</h3>
                <p>
                    Batch ${batch.batchNumber} · ${batch.manufacturerName} · Expires ${expiryLabel}
                    ${isExpired ? '· <span class="expired-badge">EXPIRED</span>' : ''}
                </p>
            </div>
            <div class="trace-summary-metrics">
                <div class="trace-summary-metric">
                    <span>Status</span>
                    <strong>${isExpired ? "Expired" : "Authentic"}</strong>
                </div>
                <div class="trace-summary-metric">
                    <span>Custody hops</span>
                    <strong>${chain.length}</strong>
                </div>
            </div>
        </div>
        <div class="trace-step-grid">
    `;

    chain.forEach((record, i) => {
        const time = new Date(Number(record.timestamp) * 1000);
        const toRole = roleNames[Number(record.toRole)] || "Unknown";
        const toClass = roleClasses[Number(record.toRole)] || "";
        const addr = formatShortAddress(record.to);
        const icon = toRole === "Manufacturer" ? "M" : toRole === "Distributor" ? "D" : toRole === "Pharmacy" ? "P" : "?";

        html += `
            <div class="trace-step" style="animation-delay: ${i * 0.12}s">
                <div class="trace-step-icon ${toClass}">${icon}</div>
                <div>
                    <div class="trace-step-top">
                        <strong>${toRole}</strong>
                        <span class="tag">${time.toLocaleString()}</span>
                    </div>
                    <div class="trace-step-location">${record.location}</div>
                    <div class="trace-step-address">${addr}</div>
                </div>
            </div>
        `;
    });

    html += `
        </div>
        <div class="audit-log">
            <h3>Chain audit log</h3>
            ${auditRows}
        </div>
    `;

    container.innerHTML = html;
}

function trackFromResult(batchId) {
    showPage("track");
    document.getElementById("trackBatchId").value = batchId;
    trackBatch();
}

// ============================================================
// STATS
// ============================================================

async function loadStats() {
    if (demoMode) {
        animateNumber("statVerifications", DEMO_DB.stats.verifications);
        animateNumber("statBatches", DEMO_DB.stats.batches);
        animateNumber("statParticipants", DEMO_DB.stats.participants);
        return;
    }

    if (!contract) return;

    try {
        const [verifications, batches, participants] = await Promise.all([
            contract.totalVerifications(),
            contract.getTotalBatches(),
            contract.getTotalParticipants(),
        ]);

        // Simulated Real-World Scale Offsets
        const baseVerifications = 24592;
        const baseBatches = 1842;
        const baseParticipants = 416;

        animateNumber("statVerifications", Number(verifications) + baseVerifications);
        animateNumber("statBatches", Number(batches) + baseBatches);
        animateNumber("statParticipants", Number(participants) + baseParticipants);
    } catch (err) {
        console.error("Stats error:", err);
    }
}

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duration = 1000;
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + diff * eased);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const msg = document.getElementById("toastMessage");

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    msg.textContent = message;
    toast.className = `toast ${type}`;

    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
        toastTimer = null;
    }, 4000);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", init);
