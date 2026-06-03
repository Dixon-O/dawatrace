// Generator script — produces frontend/app.js with proper template literals
// and full dual-mode blockchain integration (demo + live ethers.js)
import fs from 'fs';
const code = [];

// ============ SECTION 1: ABI, Config, State, DEMO_DB ============
code.push(`
// ============================================================
// DawaTrace Frontend Application
// Dual-mode: Live blockchain (ethers.js) OR demo simulation
// ============================================================

// --- Full ABI (matches DrugRegistry.sol) ---
const CONTRACT_ABI = [
  "function registerParticipant(address,string,string,uint8)",
  "function registerDrugBatch(string,string,uint256,string) returns (bytes32)",
  "function transferCustody(bytes32,address,string)",
  "function verifyDrug(bytes32) returns (tuple(bool isAuthentic, string drugName, string batchNumber, string manufacturerName, uint256 manufactureDate, uint256 expiryDate, bool isExpired, uint256 custodyCount))",
  "function verifyDrugView(bytes32) view returns (tuple(bool isAuthentic, string drugName, string batchNumber, string manufacturerName, uint256 manufactureDate, uint256 expiryDate, bool isExpired, uint256 custodyCount))",
  "function reportCounterfeit(bytes32,string)",
  "function getCustodyChain(bytes32) view returns (tuple(address from, address to, uint256 timestamp, string location, uint8 fromRole, uint8 toRole)[])",
  "function getTotalBatches() view returns (uint256)",
  "function getTotalParticipants() view returns (uint256)",
  "function totalVerifications() view returns (uint256)",
  "function getBatchIdAtIndex(uint256) view returns (bytes32)",
  "function drugBatches(bytes32) view returns (string,string,string,address,uint256,uint256,string,bool)",
  "function currentHolder(bytes32) view returns (address)",
  "function participants(address) view returns (string,string,uint8,bool)",
  "event DrugBatchRegistered(bytes32 indexed,string,string,address,uint256)",
  "event CustodyTransferred(bytes32 indexed,address indexed,address indexed,string,uint256)",
  "event DrugVerified(bytes32 indexed,address,bool,bool,uint256)",
  "event CounterfeitReported(bytes32 indexed,address,string,uint256)",
  "event ParticipantRegistered(address indexed,string,uint8)"
];

const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const HARDHAT_CHAIN_ID = '0x7A69'; // 31337

// --- Application State ---
var provider = null;
var signer = null;
var contract = null;
var contractAddress = null;
var isConnected = false;
var demoMode = true;

const AppState = {
  runtimeBatches: []
};

const now = Math.floor(Date.now() / 1000);
const DAY = 86400;

const DEMO_DB = {
  batches: {
    'DWT-AMX-2026-0528': { drugName: 'Amoxicillin 500mg', batchNumber: 'AMX-BATCH-2026-0528', manufacturerName: 'Kenya Pharma Ltd', manufactureDate: now - DAY*30, expiryDate: now + DAY*365, isAuthentic: true, isExpired: false, custodyCount: 3 },
    'DWT-CIP-2025-1120': { drugName: 'Ciprofloxacin 500mg', batchNumber: 'CIP-BATCH-2025-1120', manufacturerName: 'Kenya Pharma Ltd', manufactureDate: now - DAY*10, expiryDate: now + DAY*300, isAuthentic: true, isExpired: false, custodyCount: 1 },
    'DWT-IBU-2026-0610': { drugName: 'Ibuprofen 400mg', batchNumber: 'IBU-BATCH-2026-0610', manufacturerName: 'Beta Healthcare Intl', manufactureDate: now - DAY*5, expiryDate: now + DAY*365, isAuthentic: true, isExpired: false, custodyCount: 1 },
    'DWT-OME-2026-0915': { drugName: 'Omeprazole 20mg', batchNumber: 'OME-BATCH-2026-0915', manufacturerName: 'Kenya Pharma Ltd', manufactureDate: now - DAY*2, expiryDate: now + DAY*365, isAuthentic: true, isExpired: false, custodyCount: 1 },
    'DWT-MET-2026-0301': { drugName: 'Metformin 500mg', batchNumber: 'MET-BATCH-2026-0301', manufacturerName: 'Universal Corp of Kenya', manufactureDate: now - DAY*20, expiryDate: now + DAY*300, isAuthentic: true, isExpired: false, custodyCount: 1 },
    'DWT-AZI-2026-0130': { drugName: 'Azithromycin 250mg', batchNumber: 'AZI-BATCH-2026-0130', manufacturerName: 'Beta Healthcare Intl', manufactureDate: now - DAY*30, expiryDate: now + DAY*300, isAuthentic: true, isExpired: false, custodyCount: 1 },
    'DWT-PAR-2026-0415': { drugName: 'Paracetamol 250mg', batchNumber: 'PAR-BATCH-2026-0415', manufacturerName: 'Beta Healthcare Intl', manufactureDate: now - DAY*45, expiryDate: now + DAY*300, isAuthentic: true, isExpired: false, custodyCount: 2 },
    'DWT-ART-2025-0812': { drugName: 'Artemether-Lumefantrine 20/120mg', batchNumber: 'ART-BATCH-2025-0812', manufacturerName: 'Universal Corp of Kenya', manufactureDate: now - DAY*180, expiryDate: now - DAY*10, isAuthentic: true, isExpired: true, custodyCount: 3 }
  },
  custodyChains: {
    'DWT-AMX-2026-0528': [
      { from: '0x0000000000000000000000000000000000000000', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', timestamp: now - DAY*30, location: 'Kenya Pharma Factory, Industrial Area, Nairobi', fromRole: 0, toRole: 1 },
      { from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', timestamp: now - DAY*20, location: 'MedDistribute Warehouse, Mombasa Road, Nairobi', fromRole: 1, toRole: 2 },
      { from: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', to: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', timestamp: now - DAY*5, location: 'Kisumu City Pharmacy, Oginga Odinga St, Kisumu', fromRole: 2, toRole: 3 }
    ],
    'DWT-CIP-2025-1120': [{ from: '0x0000000000000000000000000000000000000000', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', timestamp: now - DAY*10, location: 'Kenya Pharma Factory, Nairobi', fromRole: 0, toRole: 1 }],
    'DWT-IBU-2026-0610': [{ from: '0x0000000000000000000000000000000000000000', to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', timestamp: now - DAY*5, location: 'Beta Healthcare Plant, Kericho', fromRole: 0, toRole: 1 }],
    'DWT-OME-2026-0915': [{ from: '0x0000000000000000000000000000000000000000', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', timestamp: now - DAY*2, location: 'Kenya Pharma Factory, Nairobi', fromRole: 0, toRole: 1 }],
    'DWT-MET-2026-0301': [{ from: '0x0000000000000000000000000000000000000000', to: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', timestamp: now - DAY*20, location: 'Universal Corp Factory, Kikuyu', fromRole: 0, toRole: 1 }],
    'DWT-AZI-2026-0130': [{ from: '0x0000000000000000000000000000000000000000', to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', timestamp: now - DAY*30, location: 'Beta Healthcare Plant, Kericho', fromRole: 0, toRole: 1 }],
    'DWT-PAR-2026-0415': [
      { from: '0x0000000000000000000000000000000000000000', to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', timestamp: now - DAY*45, location: 'Beta Healthcare Plant, Kericho', fromRole: 0, toRole: 1 },
      { from: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', to: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', timestamp: now - DAY*15, location: 'Nairobi Central Pharmacy, Tom Mboya St', fromRole: 1, toRole: 3 }
    ],
    'DWT-ART-2025-0812': [
      { from: '0x0000000000000000000000000000000000000000', to: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', timestamp: now - DAY*180, location: 'Universal Corp Factory, Kikuyu', fromRole: 0, toRole: 1 },
      { from: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', to: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', timestamp: now - DAY*120, location: 'PharmAccess Distributor, Eldoret', fromRole: 1, toRole: 2 },
      { from: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', to: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', timestamp: now - DAY*60, location: 'Lake Region Pharmacy, Busia', fromRole: 2, toRole: 3 }
    ]
  },
  stats: { verifications: 1247, batches: 8, participants: 7 }
};
`);

// ============ SECTION 2: Utilities ============
code.push(`
const Utils = {
  formatDate: function(ts) { return new Date(Number(ts) * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); },
  shortAddr: function(addr) { return addr ? addr.substring(0,6) + '...' + addr.substring(addr.length-4) : ''; },
  delay: function(ms) { return new Promise(function(res) { setTimeout(res, ms); }); },
  showToast: function(msg, type) {
    type = type || 'info';
    var c = document.getElementById('toast-container');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    t.innerHTML = '<span style="margin-right:8px">' + icon + '</span> ' + msg;
    c.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3500);
  }
};

window.navigate = function(path) {
  if (window.location.hash === '#' + path || (path === '/' && !window.location.hash)) {
    if (typeof routerHandler !== 'undefined') routerHandler();
  } else {
    window.location.hash = path;
  }
};
`);

// ============ SECTION 3: Renderers ============
code.push(`
const ROLE_NAMES = ['None', 'Manufacturer', 'Distributor', 'Pharmacy'];
const ROLE_ICONS = ['', '🏭', '🚛', '🏥'];

const Renderers = {
  landing: function() {
    var s = DEMO_DB.stats;
    var modeLabel = demoMode ? 'Demo Mode — Simulated data' : 'Live — Connected to Blockchain';
    return '<section class="hero animate-in">' +
      '<h1>Truth in every scan.<br><span class="gradient-text">Protecting lives.</span></h1>' +
      '<p>Verify pharmaceutical products instantly across the Kenyan supply chain. Powered by blockchain technology to ensure medicines are authentic, safe, and uncompromised.</p>' +
      '<div class="hero-actions mt-lg">' +
        '<button class="btn btn-primary btn-lg" onclick="navigate(\\'/verify\\')">Start Verifying Now</button>' +
        '<button class="btn btn-soft btn-lg" onclick="navigate(\\'/dashboard\\')">For Manufacturers</button>' +
      '</div>' +
    '</section>' +
    '<section class="container mt-xl animate-in animate-in-delay-1">' +
      '<div class="grid-3 mb-xl">' +
        '<div class="stat-card"><div class="stat-label">Total Authentications</div><div class="stat-value" id="stat-verifications">' + (s.verifications + 154).toLocaleString() + '</div><div class="stat-change up">↑ 34% this month</div></div>' +
        '<div class="stat-card"><div class="stat-label">Batches Secured</div><div class="stat-value" id="stat-batches">' + (s.batches + AppState.runtimeBatches.length) + '</div><div class="stat-change up">↑ Across Kenya</div></div>' +
        '<div class="stat-card"><div class="stat-label">Network Nodes</div><div class="stat-value" id="stat-participants">' + s.participants + '</div><div class="stat-change up">MOH Compliant</div></div>' +
      '</div>' +
      '<h2 style="text-align:center;margin-bottom:24px">How it Works</h2>' +
      '<div class="steps-grid">' +
        '<div class="step-card"><div class="step-icon" style="background:#ECFEFF;color:#06B6D4">📦</div><h3>1. Registered</h3><p>Manufacturers register medicine batches on the blockchain with immutable metadata.</p></div>' +
        '<div class="step-card"><div class="step-icon" style="background:#F5F3FF;color:#7C3AED">🔗</div><h3>2. Tracked</h3><p>Every handoff to distributors and pharmacies is recorded on-chain.</p></div>' +
        '<div class="step-card"><div class="step-icon" style="background:#D1FAE5;color:#10B981">📱</div><h3>3. Verified</h3><p>Consumers scan QR codes to instantly verify authenticity before purchase.</p></div>' +
      '</div>' +
    '</section>';
  },

  verify: function() {
    var recentHtml = '';
    var keys = Object.keys(DEMO_DB.batches).slice(0, 4);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      var b = DEMO_DB.batches[id];
      recentHtml += '<div class="recent-scan-item" onclick="document.getElementById(\\'batch-input\\').value=\\'' + id + '\\'">' +
        '<div class="scan-dot" style="background:#06B6D4"></div>' +
        '<div style="flex:1">' + b.drugName + '</div>' +
        '<div class="text-mono text-muted text-xs">' + id + '</div>' +
      '</div>';
    }
    return '<div class="verify-container animate-in">' +
      '<div class="page-header" style="text-align:center"><h1>Verify Medicine</h1><p class="text-secondary">Scan the QR code or enter the batch ID printed on the packaging.</p></div>' +
      '<div class="card">' +
        '<div class="verify-tabs">' +
          '<button class="verify-tab" id="tab-scan" onclick="UI.switchVerifyTab(\\'scan\\')">Scan QR Code</button>' +
          '<button class="verify-tab active" id="tab-manual" onclick="UI.switchVerifyTab(\\'manual\\')">Enter Batch ID</button>' +
        '</div>' +
        '<div id="view-scan" class="hidden" style="text-align:center;padding:20px">' +
          '<div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;border-radius:12px;overflow:hidden"></div>' +
          '<div class="mt-md" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
            '<button class="btn btn-primary" id="btn-start-scan" onclick="UI.startScanner()">Start Camera</button>' +
            '<button class="btn btn-soft hidden" id="btn-stop-scan" onclick="UI.stopScanner()">Stop Camera</button>' +
            '<label class="btn btn-soft" style="cursor:pointer;margin:0">Upload Image<input type="file" id="qr-upload" accept="image/*" style="display:none" onchange="UI.scanUploadedImage(event)"></label>' +
          '</div>' +
        '</div>' +
        '<div id="view-manual">' +
          '<div class="form-group mb-lg">' +
            '<label class="form-label">Batch ID</label>' +
            '<div class="verify-input-row">' +
              '<input type="text" id="batch-input" class="form-input form-input-lg text-mono" placeholder="e.g. DWT-AMX-2026-0528">' +
              '<button class="btn btn-primary btn-lg" onclick="BlockchainService.verifyBatch()">Verify</button>' +
            '</div>' +
          '</div>' +
          '<div class="recent-scans mt-lg"><h4 class="form-label mb-md">Quick Demo Batches</h4>' + recentHtml + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  result: function(data, batchId) {
    if (!data || !data.isAuthentic) {
      return '<div class="container animate-in">' +
        '<button class="btn btn-ghost mb-md" onclick="navigate(\\'/verify\\')">← Back to Verify</button>' +
        '<div class="result-banner counterfeit"><div class="result-icon">❌</div><div><h2>Warning: Unregistered / Fake</h2><p>This product is not recorded on our blockchain.</p></div></div>' +
        '<div class="card"><div class="empty-state"><div class="empty-icon">❓</div><p>No valid blockchain records found for batch ID: <strong>' + batchId + '</strong></p></div></div>' +
        '<div class="mt-lg" style="text-align:center"><button class="btn btn-danger" onclick="UI.reportCounterfeit(\\'' + batchId + '\\')">Report Suspected Counterfeit</button></div>' +
      '</div>';
    }
    var isExp = data.isExpired;
    var cls = isExp ? 'counterfeit' : 'authentic';
    var icon = isExp ? '⚠️' : '✅';
    var title = isExp ? 'Medicine is EXPIRED' : 'Authentic Medicine';
    var sub = isExp ? 'Do not consume this medication.' : 'Verified on Blockchain';
    var expClass = isExp ? ' text-danger' : '';

    return '<div class="container animate-in">' +
      '<button class="btn btn-ghost mb-md" onclick="navigate(\\'/verify\\')">← Back to Verify</button>' +
      '<div class="result-banner ' + cls + '"><div class="result-icon">' + icon + '</div><div><h2>' + title + '</h2><p>' + sub + '</p></div></div>' +
      '<div class="result-grid">' +
        '<div class="card"><h3 class="mb-md">Product Details</h3>' +
          '<div class="detail-row"><span class="detail-label">Drug Name</span><span class="detail-value">' + data.drugName + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Batch Number</span><span class="detail-value text-mono text-xs">' + data.batchNumber + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Manufacturer</span><span class="detail-value">' + data.manufacturerName + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Mfg Date</span><span class="detail-value">' + Utils.formatDate(data.manufactureDate) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Expiry</span><span class="detail-value' + expClass + '">' + Utils.formatDate(data.expiryDate) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Custody Transfers</span><span class="detail-value">' + Number(data.custodyCount) + ' verified handoffs</span></div>' +
        '</div>' +
        '<div class="card"><div class="flex-between mb-md"><h3>Custody Chain</h3><button class="btn btn-soft btn-sm" onclick="navigate(\\'/track?id=' + batchId + '\\')">Full Journey →</button></div>' +
          '<div class="timeline" id="result-timeline"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  track: function() {
    return '<div class="container animate-in">' +
      '<div class="page-header"><h1>Track Supply Chain</h1><p class="text-secondary">View the complete unbroken custody chain of any registered batch.</p></div>' +
      '<div class="card mb-lg"><div class="verify-input-row" style="max-width:500px">' +
        '<input type="text" id="track-input" class="form-input text-mono" placeholder="Enter Batch ID">' +
        '<button class="btn btn-primary" onclick="BlockchainService.trackBatch()">View Chain</button>' +
      '</div></div>' +
      '<div id="track-result"><div class="empty-state"><div class="empty-icon">📍</div><p>Enter a batch ID above to trace its journey.</p></div></div>' +
    '</div>';
  },

  dashboard: function() {
    var allBatches = Object.assign({}, DEMO_DB.batches);
    AppState.runtimeBatches.forEach(function(b) { allBatches[b.id] = b.metadata; });
    var sorted = Object.entries(allBatches).sort(function(a,b) { return b[1].manufactureDate - a[1].manufactureDate; });
    var rows = '';
    for (var i = 0; i < sorted.length; i++) {
      var id = sorted[i][0], b = sorted[i][1];
      var statusPill = b.isExpired ? '<span class="pill pill-danger">Expired</span>' : '<span class="pill pill-success">Authentic</span>';
      rows += '<tr class="batch-tr" data-name="' + b.drugName.toLowerCase() + '" data-id="' + id.toLowerCase() + '">' +
        '<td style="font-weight:500">' + b.drugName + '</td>' +
        '<td class="text-mono text-xs text-muted">' + b.batchNumber + '</td>' +
        '<td>' + Utils.formatDate(b.manufactureDate) + '</td>' +
        '<td' + (b.isExpired ? ' class="text-danger"' : '') + '>' + Utils.formatDate(b.expiryDate) + '</td>' +
        '<td><div class="pill pill-neutral">' + (b.custodyCount || 1) + ' Transfers</div></td>' +
        '<td>' + statusPill + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<button class="btn btn-soft btn-sm" onclick="navigate(\\'/track?id=' + id + '\\')" title="Track">🔍</button>' +
          '<button class="btn btn-soft btn-sm" onclick="UI.showTransferModal(\\'' + id + '\\')" title="Transfer">🚚</button>' +
          '<button class="btn btn-soft btn-sm" onclick="UI.showQRModal(\\'' + id + '\\')" title="QR">🔳</button>' +
        '</div></td>' +
      '</tr>';
    }
    var modeInfo = demoMode ? '<div class="pill pill-warning">Demo Mode</div>' : '<div class="pill pill-success">Live Blockchain</div>';
    return '<div class="dash-layout animate-in">' +
      '<aside class="dash-sidebar">' +
        '<button class="dash-nav-item active" onclick="navigate(\\'/dashboard\\')"><span class="icon">📦</span> Batches</button>' +
        '<button class="dash-nav-item" onclick="navigate(\\'/analytics\\')"><span class="icon">📈</span> Analytics</button>' +
        '<hr style="border:0;border-top:1px solid var(--c-border);margin:8px 0">' +
        '<div style="padding:10px 14px"><div class="text-xs text-muted" style="margin-bottom:4px">ROLE</div><div class="pill pill-purple">Manufacturer</div></div>' +
        '<div style="padding:4px 14px"><div class="text-xs text-muted" style="margin-bottom:4px">MODE</div>' + modeInfo + '</div>' +
      '</aside>' +
      '<main class="dash-main">' +
        '<div class="page-header flex-between"><div><h1>Batch Management</h1><p class="text-secondary">Kenya Pharma Ltd · Nairobi Facility</p></div>' +
          '<button class="btn btn-primary" onclick="UI.showRegisterModal()">+ Register New Batch</button></div>' +
        '<div class="card card-flat" style="padding:0">' +
          '<div style="padding:var(--s-md) var(--s-lg);border-bottom:1px solid var(--c-border)">' +
            '<input type="text" id="batch-search" class="form-input" placeholder="Search batches..." style="max-width:300px;width:100%" onkeyup="UI.filterBatches()">' +
          '</div>' +
          '<div class="table-wrap"><table id="batch-table"><thead><tr>' +
            '<th>Drug Name</th><th>Batch ID</th><th>Mfg Date</th><th>Expiry</th><th>Custody</th><th>Status</th><th>Actions</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '</div>' +
      '</main>' +
    '</div>';
  },

  analytics: function() {
    var total = DEMO_DB.stats.verifications + 154;
    var bars = '';
    for (var i = 0; i < 15; i++) {
      var h = Math.floor(Math.random() * 80) + 20;
      bars += '<div style="flex:1;background:var(--c-accent);height:' + h + '%;border-radius:4px 4px 0 0;opacity:.8"></div>';
    }
    return '<div class="dash-layout animate-in">' +
      '<aside class="dash-sidebar">' +
        '<button class="dash-nav-item" onclick="navigate(\\'/dashboard\\')"><span class="icon">📦</span> Batches</button>' +
        '<button class="dash-nav-item active" onclick="navigate(\\'/analytics\\')"><span class="icon">📈</span> Analytics</button>' +
      '</aside>' +
      '<main class="dash-main">' +
        '<div class="page-header flex-between"><div><h1>Network Analytics</h1><p class="text-secondary">DawaTrace ecosystem overview</p></div>' +
          '<button class="btn btn-soft" onclick="UI.exportData()">Export JSON</button></div>' +
        '<div class="grid-3 mb-xl">' +
          '<div class="stat-card"><div class="stat-label">Total Verifications</div><div class="stat-value">' + total.toLocaleString() + '</div><div class="stat-change up">↑ 34% this month</div></div>' +
          '<div class="stat-card"><div class="stat-label">Verified Authentic</div><div class="stat-value" style="color:var(--c-success)">' + Math.floor(total*0.96).toLocaleString() + '</div><div class="stat-change up">96% trust rate</div></div>' +
          '<div class="stat-card"><div class="stat-label">Counterfeit Flags</div><div class="stat-value" style="color:var(--c-danger)">' + Math.floor(total*0.04).toLocaleString() + '</div><div class="stat-change down">Reported to PPB</div></div>' +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="card"><h3 class="mb-md">Verification Volume (30 Days)</h3><div style="height:200px;display:flex;align-items:flex-end;gap:8px;padding-bottom:20px;border-bottom:1px solid var(--c-border)">' + bars + '</div></div>' +
          '<div class="card"><h3 class="mb-md">Top Verified Drugs</h3><div class="chart-bar-group">' +
            '<div class="chart-bar-row"><div class="chart-bar-label">Amoxicillin</div><div class="chart-bar-track"><div class="chart-bar-fill green" style="width:85%">4,210</div></div></div>' +
            '<div class="chart-bar-row"><div class="chart-bar-label">Paracetamol</div><div class="chart-bar-track"><div class="chart-bar-fill green" style="width:72%">3,450</div></div></div>' +
            '<div class="chart-bar-row"><div class="chart-bar-label">Ciprofloxacin</div><div class="chart-bar-track"><div class="chart-bar-fill amber" style="width:45%">1,920</div></div></div>' +
            '<div class="chart-bar-row"><div class="chart-bar-label">Ibuprofen</div><div class="chart-bar-track"><div class="chart-bar-fill green" style="width:35%">1,104</div></div></div>' +
          '</div></div>' +
        '</div>' +
      '</main>' +
    '</div>';
  }
};
`);

// ============ SECTION 4: UI Controller ============
code.push(`
const UI = {
  render: function(fn) { document.getElementById('app').innerHTML = fn(); },
  renderWith: function(fn, a, b) {
    document.getElementById('app').innerHTML = fn(a, b);
    // After rendering result, load timeline async
    if (fn === Renderers.result && a && a.isAuthentic) {
      BlockchainService.loadResultTimeline(b);
    }
  },

  switchVerifyTab: function(tabId) {
    document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('view-scan').classList.toggle('hidden', tabId !== 'scan');
    document.getElementById('view-manual').classList.toggle('hidden', tabId !== 'manual');
    if (tabId !== 'scan') {
      UI.stopScanner();
    }
  },

  html5Qrcode: null,

  startScanner: function() {
    if (!UI.html5Qrcode) {
      UI.html5Qrcode = new Html5Qrcode("qr-reader");
    }
    document.getElementById('btn-start-scan').classList.add('hidden');
    document.getElementById('btn-stop-scan').classList.remove('hidden');

    UI.html5Qrcode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      function(decodedText) {
        var batchId = decodedText.trim();
        if (batchId.startsWith('DawaTrace:')) batchId = batchId.replace('DawaTrace:', '');
        document.getElementById('batch-input').value = batchId;
        UI.stopScanner();
        UI.switchVerifyTab('manual');
        BlockchainService.verifyBatch();
        Utils.showToast('QR Decoded: ' + batchId, 'success');
      },
      function(errorMessage) {}
    ).catch(function(err) {
      console.log('Scanner err:', err);
      Utils.showToast('Camera access denied or unavailable', 'error');
      document.getElementById('btn-start-scan').classList.remove('hidden');
      document.getElementById('btn-stop-scan').classList.add('hidden');
    });
  },

  stopScanner: function() {
    if (UI.html5Qrcode && UI.html5Qrcode.isScanning) {
      UI.html5Qrcode.stop().then(function() {
         var startBtn = document.getElementById('btn-start-scan');
         var stopBtn = document.getElementById('btn-stop-scan');
         if (startBtn) startBtn.classList.remove('hidden');
         if (stopBtn) stopBtn.classList.add('hidden');
      }).catch(function(e) { console.log(e); });
    }
  },

  scanUploadedImage: function(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    var file = e.target.files[0];
    if (!UI.html5Qrcode) {
      UI.html5Qrcode = new Html5Qrcode("qr-reader");
    }
    Utils.showToast('Analyzing image...', 'info');
    UI.html5Qrcode.scanFile(file, true)
      .then(function(decodedText) {
        var batchId = decodedText.trim();
        if (batchId.startsWith('DawaTrace:')) batchId = batchId.replace('DawaTrace:', '');
        document.getElementById('batch-input').value = batchId;
        UI.switchVerifyTab('manual');
        BlockchainService.verifyBatch();
        Utils.showToast('QR Image Decoded: ' + batchId, 'success');
      })
      .catch(function(err) {
        console.log('Image scan err:', err);
        Utils.showToast('Could not find a valid QR code in the image', 'error');
      });
    e.target.value = ''; // Reset input
  },

  showRegisterModal: function() {
    var html = '<div class="modal-header"><h3>Register New Batch</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<div class="form-group mb-md"><label class="form-label">Drug Name</label><input type="text" id="reg-name" class="form-input" placeholder="e.g. Paracetamol 500mg"></div>' +
      '<div class="form-group mb-md"><label class="form-label">Batch Number</label><input type="text" id="reg-num" class="form-input" placeholder="e.g. BATCH-2026-X1"></div>' +
      '<div class="form-group mb-lg"><label class="form-label">Expiry Date</label><input type="date" id="reg-exp" class="form-input"></div>' +
      '<button class="btn btn-primary w-full btn-lg" onclick="BlockchainService.registerBatch()">Register On-Chain</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  showTransferModal: function(batchId) {
    var html = '<div class="modal-header"><h3>Transfer Custody</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<p class="text-sm mb-md">Batch: <span class="text-mono">' + batchId + '</span></p>' +
      '<div class="form-group mb-md"><label class="form-label">Recipient Address</label><input type="text" id="trans-to" class="form-input text-mono" placeholder="0x...">' +
        '<div class="mt-sm" style="display:flex;gap:8px">' +
          '<button class="btn btn-soft btn-sm" onclick="document.getElementById(\\'trans-to\\').value=\\'0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\\'">Distributor</button>' +
          '<button class="btn btn-soft btn-sm" onclick="document.getElementById(\\'trans-to\\').value=\\'0x90F79bf6EB2c4f870365E785982E1f101E93b906\\'">Pharmacy</button>' +
        '</div></div>' +
      '<div class="form-group mb-lg"><label class="form-label">Location</label><input type="text" id="trans-loc" class="form-input" placeholder="e.g. Nairobi Central Hub"></div>' +
      '<button class="btn btn-primary w-full btn-lg" onclick="BlockchainService.transferCustody(\\'' + batchId + '\\')">Record Transfer</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  showQRModal: function(batchId) {
    var html = '<div class="modal-header"><h3>Batch QR Code</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<div class="qr-display mb-md">' +
        '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DawaTrace:' + batchId + '" alt="QR" style="border-radius:8px">' +
        '<div class="text-mono text-sm mt-sm">' + batchId + '</div>' +
      '</div>' +
      '<p style="text-align:center" class="text-sm text-secondary mb-md">Print this QR on packaging for consumer verification.</p>' +
      '<button class="btn btn-primary w-full" onclick="Utils.showToast(\\'Label ready\\',\\'success\\');UI.hideModal()">Download Label</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  hideModal: function() { document.getElementById('modal-overlay').classList.remove('active'); },

  filterBatches: function() {
    var q = document.getElementById('batch-search').value.toLowerCase();
    document.querySelectorAll('#batch-table .batch-tr').forEach(function(tr) {
      var ok = tr.dataset.name.indexOf(q) > -1 || tr.dataset.id.indexOf(q) > -1;
      tr.style.display = ok ? '' : 'none';
    });
  },

  reportCounterfeit: async function(batchId) {
    if (!demoMode && contract) {
      try {
        Utils.showToast('Submitting counterfeit report on-chain...', 'info');
        var txBatchId = ethers.id(batchId);
        var tx = await contract.reportCounterfeit(txBatchId, 'User report');
        await tx.wait();
        Utils.showToast('Counterfeit report recorded on blockchain', 'success');
      } catch(e) {
        console.error(e);
        Utils.showToast('Transaction failed: ' + (e.reason || e.message), 'error');
      }
    } else {
      Utils.showToast('Reporting counterfeit to authorities...', 'warning');
      await Utils.delay(1000);
      Utils.showToast('Counterfeit report logged for ' + batchId, 'success');
    }
    navigate('/');
  },

  exportData: function() {
    var data = { network: demoMode ? 'Demo' : 'Hardhat Local', timestamp: new Date().toISOString(), stats: DEMO_DB.stats, connected: isConnected };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dawatrace_export.json';
    a.click();
    Utils.showToast('Data exported', 'success');
  }
};
`);

// ============ SECTION 5: Blockchain Service (DUAL MODE) ============
code.push(`
const BlockchainService = {
  updateWalletUI: function() {
    var c = document.getElementById('topbar-actions');
    if (!c) return;
    if (demoMode) {
      c.innerHTML = '<button class="btn btn-soft btn-sm" onclick="BlockchainService.connectWallet()"><span class="wallet-dot demo" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--c-warning);margin-right:6px"></span>Connect Wallet</button>';
      document.getElementById('demo-banner').classList.remove('hidden');
      document.getElementById('network-status').innerHTML = '◉ Demo';
      document.getElementById('network-status').className = 'pill pill-warning';
    } else {
      var addr = signer ? signer.address || '' : '';
      c.innerHTML = '<button class="btn btn-soft btn-sm" onclick="BlockchainService.connectWallet()"><span class="wallet-dot connected" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--c-success);box-shadow:0 0 6px var(--c-success);margin-right:6px"></span>' + Utils.shortAddr(addr) + '</button>';
      document.getElementById('demo-banner').classList.add('hidden');
      document.getElementById('network-status').innerHTML = '◉ Hardhat Local';
      document.getElementById('network-status').className = 'pill pill-success';
    }
  },

  connectWallet: async function() {
    // Toggle: if already connected, disconnect
    if (isConnected) {
      isConnected = false;
      demoMode = true;
      contract = null;
      signer = null;
      provider = null;
      Utils.showToast('Disconnected', 'success');
      BlockchainService.updateWalletUI();
      routerHandler(); // re-render current page
      return;
    }

    // Wait briefly for injected provider
    if (!window.ethereum) {
      for (var i = 0; i < 30; i++) {
        await Utils.delay(100);
        if (window.ethereum) break;
      }
    }
    if (!window.ethereum) {
      Utils.showToast('No Web3 wallet detected. Install MetaMask to connect.', 'warning');
      return;
    }

    try {
      // Auto-switch to Hardhat network
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HARDHAT_CHAIN_ID }] });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{ chainId: HARDHAT_CHAIN_ID, chainName: 'Hardhat Local', rpcUrls: ['http://127.0.0.1:8545'], nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 } }]
            });
          } catch(addErr) { console.log('Could not add Hardhat network:', addErr); }
        }
      }

      // Connect
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      signer = await provider.getSigner();
      var address = await signer.getAddress();

      // Load contract address
      if (!contractAddress) {
        try {
          var res = await fetch('../deployment.json');
          if (res.ok) {
            var info = await res.json();
            contractAddress = info.contractAddress;
            console.log('Loaded contract address:', contractAddress);
          }
        } catch(e) { /* deployment.json not found */ }
      }
      if (!contractAddress) contractAddress = DEFAULT_CONTRACT_ADDRESS;

      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      isConnected = true;
      demoMode = false;

      Utils.showToast('Connected: ' + Utils.shortAddr(address), 'success');
      BlockchainService.updateWalletUI();
      BlockchainService.loadLiveStats();
      routerHandler(); // re-render with live data

      window.ethereum.on('accountsChanged', function() { window.location.reload(); });
    } catch(err) {
      console.error('Connection error:', err);
      Utils.showToast('Connection failed: ' + (err.reason || err.message || 'Unknown error'), 'error');
    }
  },

  loadLiveStats: async function() {
    if (!contract) return;
    try {
      var results = await Promise.all([
        contract.totalVerifications(),
        contract.getTotalBatches(),
        contract.getTotalParticipants()
      ]);
      var sv = document.getElementById('stat-verifications');
      var sb = document.getElementById('stat-batches');
      var sp = document.getElementById('stat-participants');
      if (sv) sv.textContent = Number(results[0]).toLocaleString();
      if (sb) sb.textContent = Number(results[1]);
      if (sp) sp.textContent = Number(results[2]);
    } catch(e) { console.error('Stats load error:', e); }
  },

  // --- VERIFICATION (dual-mode) ---
  verifyBatch: async function() {
    var input = document.getElementById('batch-input');
    var batchId = input ? input.value.trim() : '';
    if (!batchId) { Utils.showToast('Please enter a batch ID', 'error'); return; }

    document.getElementById('app').innerHTML = '<div class="verify-spinner container"><div class="spinner-ring"></div><h3>Verifying on-chain...</h3><p class="text-secondary text-mono">' + batchId + '</p></div>';
    await Utils.delay(1200);

    if (demoMode) {
      var batch = DEMO_DB.batches[batchId] || AppState.runtimeBatches.find(function(b) { return b.id === batchId; });
      if (batch) {
        var data = batch.metadata || batch;
        UI.renderWith(Renderers.result, {
          isAuthentic: true,
          drugName: data.drugName,
          batchNumber: data.batchNumber,
          manufacturerName: data.manufacturerName,
          manufactureDate: data.manufactureDate,
          expiryDate: data.expiryDate,
          isExpired: data.isExpired,
          custodyCount: data.custodyCount || 1
        }, batchId);
      } else {
        UI.renderWith(Renderers.result, { isAuthentic: false }, batchId);
      }
      DEMO_DB.stats.verifications++;
    } else {
      try {
        var txBatchId = ethers.id(batchId);
        var result = await contract.verifyDrugView(txBatchId);
        UI.renderWith(Renderers.result, result, batchId);
      } catch(err) {
        console.error('Verification error:', err);
        UI.renderWith(Renderers.result, { isAuthentic: false }, batchId);
      }
    }
  },

  // Load timeline into result page after render
  loadResultTimeline: async function(batchId) {
    var el = document.getElementById('result-timeline');
    if (!el) return;
    el.innerHTML = '<p class="text-muted">Loading custody chain...</p>';

    if (demoMode) {
      el.innerHTML = BlockchainService.renderTimelineHTML(DEMO_DB.custodyChains[batchId] || []);
    } else {
      try {
        var txBatchId = ethers.id(batchId);
        var chain = await contract.getCustodyChain(txBatchId);
        el.innerHTML = BlockchainService.renderTimelineHTML(chain);
      } catch(e) {
        el.innerHTML = '<p class="text-muted">Could not load custody data.</p>';
      }
    }
  },

  // --- TRACKING (dual-mode) ---
  trackBatch: async function() {
    var input = document.getElementById('track-input');
    var batchId = input ? input.value.trim() : '';
    if (!batchId) { Utils.showToast('Please enter a batch ID', 'error'); return; }

    document.getElementById('track-result').innerHTML = '<div class="card"><div class="empty-state"><div class="spinner-ring" style="width:32px;height:32px;margin:0 auto"></div><p class="mt-md">Tracing supply chain...</p></div></div>';
    await Utils.delay(800);

    if (demoMode) {
      var chain = DEMO_DB.custodyChains[batchId];
      var batch = DEMO_DB.batches[batchId];
      if (!chain || !batch) {
        document.getElementById('track-result').innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>Batch not found — this medicine cannot be traced.</p></div></div>';
        return;
      }
      var title = batch.drugName + ' — ' + batch.batchNumber;
      document.getElementById('track-result').innerHTML = '<div class="card"><h3 class="mb-md">' + title + '</h3><div class="timeline">' + BlockchainService.renderTimelineHTML(chain) + '</div></div>';
    } else {
      try {
        var txBatchId = ethers.id(batchId);
        var liveChain = await contract.getCustodyChain(txBatchId);
        var liveBatch = await contract.drugBatches(txBatchId);
        if (!liveBatch[7]) { // exists field
          document.getElementById('track-result').innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>Batch not found on blockchain.</p></div></div>';
          return;
        }
        var liveTitle = liveBatch[0] + ' — ' + liveBatch[1];
        document.getElementById('track-result').innerHTML = '<div class="card"><h3 class="mb-md">' + liveTitle + '</h3><div class="timeline">' + BlockchainService.renderTimelineHTML(liveChain) + '</div></div>';
      } catch(e) {
        console.error('Track error:', e);
        document.getElementById('track-result').innerHTML = '<div class="card"><div class="empty-state"><p>Error loading custody chain.</p></div></div>';
      }
    }
  },

  renderTimelineHTML: function(chain) {
    if (!chain || chain.length === 0) return '<p class="text-muted">No custody records found.</p>';
    var sorted = Array.from(chain).sort(function(a,b) { return Number(b.timestamp) - Number(a.timestamp); });
    var html = '';
    for (var i = 0; i < sorted.length; i++) {
      var rec = sorted[i];
      var dotClass = i === 0 ? 'active' : '';
      var roleName = ROLE_NAMES[Number(rec.toRole)] || 'Unknown';
      var roleIcon = ROLE_ICONS[Number(rec.toRole)] || '';
      var addr = typeof rec.to === 'string' ? Utils.shortAddr(rec.to) : Utils.shortAddr(String(rec.to));
      html += '<div class="timeline-item">' +
        '<div class="timeline-marker"><div class="timeline-dot ' + dotClass + '"></div><div class="timeline-line"></div></div>' +
        '<div class="timeline-content">' +
          '<h4>' + roleIcon + ' ' + rec.location + '</h4>' +
          '<p class="text-sm text-secondary">' + Utils.formatDate(rec.timestamp) + ' · ' + roleName + '</p>' +
          '<p class="text-xs text-mono text-muted mt-sm">' + addr + '</p>' +
        '</div></div>';
    }
    return html;
  },

  // --- REGISTER BATCH (dual-mode) ---
  registerBatch: async function() {
    var name = document.getElementById('reg-name').value;
    var num = document.getElementById('reg-num').value;
    var exp = document.getElementById('reg-exp').value;
    if (!name || !num || !exp) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();

    if (!demoMode && contract) {
      try {
        Utils.showToast('Submitting to blockchain...', 'info');
        var expTs = Math.floor(new Date(exp).getTime() / 1000);
        var tx = await contract.registerDrugBatch(name, num, expTs, '');
        var receipt = await tx.wait();
        Utils.showToast('Batch registered on-chain!', 'success');
        navigate('/dashboard');
        return;
      } catch(e) {
        console.error(e);
        Utils.showToast('Transaction failed: ' + (e.reason || e.message), 'error');
        return;
      }
    }

    // Demo mode fallback
    Utils.showToast('Submitting transaction...', 'info');
    await Utils.delay(800);
    var genId = 'DWT-NEW-' + Date.now().toString(36).toUpperCase();
    var expDemo = new Date(exp).getTime() / 1000;
    AppState.runtimeBatches.push({
      id: genId,
      metadata: { drugName: name, batchNumber: num, manufacturerName: 'Kenya Pharma Ltd', manufactureDate: Math.floor(Date.now()/1000), expiryDate: expDemo, isAuthentic: true, isExpired: false, custodyCount: 1 },
      custody: [{ from: '0x0000000000000000000000000000000000000000', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', timestamp: Math.floor(Date.now()/1000), location: 'Kenya Pharma Factory, Nairobi', fromRole: 0, toRole: 1 }]
    });
    Utils.showToast('Batch ' + genId + ' registered!', 'success');
    navigate('/dashboard');
  },

  // --- TRANSFER CUSTODY (dual-mode) ---
  transferCustody: async function(batchId) {
    var to = document.getElementById('trans-to').value;
    var loc = document.getElementById('trans-loc').value;
    if (!to || !loc) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();

    if (!demoMode && contract) {
      try {
        Utils.showToast('Signing transaction...', 'info');
        var txBatchId = ethers.id(batchId);
        var tx = await contract.transferCustody(txBatchId, to, loc);
        await tx.wait();
        Utils.showToast('Custody transferred on-chain!', 'success');
        navigate('/dashboard');
        return;
      } catch(e) {
        console.error(e);
        Utils.showToast('Transfer failed: ' + (e.reason || e.message), 'error');
        return;
      }
    }

    // Demo mode fallback
    Utils.showToast('Signing transaction...', 'info');
    await Utils.delay(800);
    var target = AppState.runtimeBatches.find(function(b) { return b.id === batchId; });
    if (!target) {
      var dbRef = DEMO_DB.batches[batchId];
      var custRef = DEMO_DB.custodyChains[batchId] || [];
      target = { id: batchId, metadata: Object.assign({}, dbRef), custody: custRef.slice() };
      AppState.runtimeBatches.push(target);
    }
    target.custody.push({ from: '0x...', to: to, timestamp: Math.floor(Date.now()/1000), location: loc, fromRole: 1, toRole: 2 });
    target.metadata.custodyCount++;
    Utils.showToast('Custody transferred', 'success');
    navigate('/dashboard');
  }
};
`);

// ============ SECTION 6: Router & Init ============
code.push(`
function routerHandler() {
  var path = window.location.hash.slice(1) || '/';
  var cleanPath = path;
  var qIdx = path.indexOf('?');
  if (qIdx > -1) cleanPath = path.substring(0, qIdx);

  document.querySelectorAll('#topbar-nav a').forEach(function(a) {
    a.classList.toggle('active', a.dataset.route === cleanPath);
  });

  switch (cleanPath) {
    case '/': UI.render(Renderers.landing); if (!demoMode) BlockchainService.loadLiveStats(); break;
    case '/verify': UI.render(Renderers.verify); break;
    case '/dashboard': UI.render(Renderers.dashboard); break;
    case '/analytics': UI.render(Renderers.analytics); break;
    case '/track':
      UI.render(Renderers.track);
      if (qIdx > -1) {
        var params = new URLSearchParams(path.substring(qIdx));
        var trackId = params.get('id');
        if (trackId) {
          setTimeout(function() {
            document.getElementById('track-input').value = trackId;
            BlockchainService.trackBatch();
          }, 100);
        }
      }
      break;
    default: UI.render(Renderers.landing);
  }
  
  if (cleanPath !== '/verify' && typeof UI.stopScanner === 'function') {
    UI.stopScanner();
  }
  
  window.scrollTo(0, 0);
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) UI.hideModal();
});

window.addEventListener('hashchange', routerHandler);
window.addEventListener('DOMContentLoaded', async function() {
  // Try loading deployment.json
  try {
    var res = await fetch('../deployment.json');
    if (res.ok) {
      var info = await res.json();
      contractAddress = info.contractAddress;
      console.log('Loaded contract address:', contractAddress);
    }
  } catch(e) { /* no deployment.json */ }

  BlockchainService.updateWalletUI();
  routerHandler();

  // Auto-connect if wallet already authorized
  if (window.ethereum) {
    try {
      var accts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accts.length > 0) {
        await BlockchainService.connectWallet();
      }
    } catch(e) { console.log('Auto-connect skipped'); }
  }
});
`);

// Write compiled file
var output = code.join('\n');
fs.writeFileSync('frontend/app.js', output, 'utf8');
console.log('SUCCESS: frontend/app.js written (' + output.length + ' bytes)');

// Clean up
try { fs.unlinkSync('frontend/app_core.js'); } catch(e) {}
