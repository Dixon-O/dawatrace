// Generator script — produces frontend/app.js with proper template literals
const fs = require('fs');
const BT = '`'; // backtick character
const D = '$'; // dollar sign

function tl(strings) {
    // Tag function that returns a template literal string
    return BT + strings.join('') + BT;
}

// Helper to produce ${expr} inside template literals
function $$(expr) { return D + '{' + expr + '}'; }

const code = [];

// ============ SECTION 1: Constants & State ============
code.push(`
// ============================================================
// DawaTrace Frontend Application (Rebuilt)
// Single-Page Application with hash-based routing
// ============================================================

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const AppState = {
  isDemoMode: true,
  wallet: { connected: false, address: null },
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
      { location: 'Kenya Pharma Factory, Nairobi', timestamp: now - DAY*30 },
      { location: 'MedDistribute Warehouse, Mombasa Road', timestamp: now - DAY*20 },
      { location: 'Kisumu City Pharmacy, Kisumu', timestamp: now - DAY*5 }
    ],
    'DWT-CIP-2025-1120': [{ location: 'Kenya Pharma Factory, Nairobi', timestamp: now - DAY*10 }],
    'DWT-IBU-2026-0610': [{ location: 'Beta Healthcare Plant, Kericho', timestamp: now - DAY*5 }],
    'DWT-OME-2026-0915': [{ location: 'Kenya Pharma Factory, Nairobi', timestamp: now - DAY*2 }],
    'DWT-MET-2026-0301': [{ location: 'Universal Corp Factory, Kikuyu', timestamp: now - DAY*20 }],
    'DWT-AZI-2026-0130': [{ location: 'Beta Healthcare Plant, Kericho', timestamp: now - DAY*30 }],
    'DWT-PAR-2026-0415': [
      { location: 'Beta Healthcare Plant, Kericho', timestamp: now - DAY*45 },
      { location: 'Nairobi Central Pharmacy', timestamp: now - DAY*15 }
    ],
    'DWT-ART-2025-0812': [
      { location: 'Universal Corp Factory, Kikuyu', timestamp: now - DAY*180 },
      { location: 'PharmAccess Distributor, Eldoret', timestamp: now - DAY*120 },
      { location: 'Lake Region Pharmacy, Busia', timestamp: now - DAY*60 }
    ]
  },
  stats: { verifications: 1247, batches: 8, participants: 7 }
};
`);

// ============ SECTION 2: Utilities ============
code.push(`
const Utils = {
  formatDate: (ts) => new Date(ts * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  shortAddr: (addr) => addr ? addr.substring(0,6) + '...' + addr.substring(addr.length-4) : '',
  delay: (ms) => new Promise(res => setTimeout(res, ms)),
  showToast: (msg, type) => {
    type = type || 'info';
    var c = document.getElementById('toast-container');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    t.innerHTML = '<span style="margin-right:8px">' + icon + '</span> ' + msg;
    c.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3000);
  },
  copyToClip: (text) => {
    navigator.clipboard.writeText(text);
    Utils.showToast('Copied to clipboard', 'success');
  }
};

window.navigate = function(path) {
  window.location.hash = path;
};
`);

// ============ SECTION 3: Renderers (using string concat) ============
code.push(`
const Renderers = {
  landing: function() {
    var s = DEMO_DB.stats;
    return '<section class="hero animate-in">' +
      '<h1>Truth in every scan.<br><span class="gradient-text">Protecting lives.</span></h1>' +
      '<p>Verify pharmaceutical products instantly across the Kenyan supply chain. Powered by Polygon blockchain technology.</p>' +
      '<div class="hero-actions mt-lg">' +
        '<button class="btn btn-primary btn-lg" onclick="navigate(\\'/verify\\')">Start Verifying Now</button>' +
        '<button class="btn btn-soft btn-lg" onclick="navigate(\\'/dashboard\\')">For Manufacturers</button>' +
      '</div>' +
    '</section>' +
    '<section class="container mt-xl animate-in animate-in-delay-1">' +
      '<div class="grid-3 mb-xl">' +
        '<div class="stat-card"><div class="stat-label">Total Authentications</div><div class="stat-value">' + (s.verifications + 154).toLocaleString() + '</div><div class="stat-change up">↑ 34% this month</div></div>' +
        '<div class="stat-card"><div class="stat-label">Batches Secured</div><div class="stat-value">' + (s.batches + AppState.runtimeBatches.length) + '</div><div class="stat-change up">↑ Across Kenya</div></div>' +
        '<div class="stat-card"><div class="stat-label">Network Nodes</div><div class="stat-value">' + s.participants + '</div><div class="stat-change up">MOH Compliant</div></div>' +
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
    var keys = Object.keys(DEMO_DB.batches).slice(0, 3);
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
        '<div id="view-scan" class="hidden" style="text-align:center;padding:40px 20px">' +
          '<div style="width:100%;height:200px;background:#111;border-radius:12px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.9rem">📷 Camera preview area</div>' +
          '<button class="btn btn-primary" onclick="UI.simulateScan()">Simulate Scan (Demo)</button>' +
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
    if (!data) {
      // NOT found - counterfeit
      return '<div class="container animate-in">' +
        '<button class="btn btn-ghost mb-md" onclick="navigate(\\'/verify\\')">← Back to Verify</button>' +
        '<div class="result-banner counterfeit"><div class="result-icon">❌</div><div><h2>Warning: Not Verified</h2><p>Potential counterfeit. Do not consume.</p></div></div>' +
        '<div class="card"><div class="empty-state"><div class="empty-icon">❓</div><p>No blockchain records found for batch ID: <strong>' + batchId + '</strong></p></div></div>' +
        '<div class="mt-lg" style="text-align:center"><button class="btn btn-danger" onclick="UI.reportCounterfeit(\\'' + batchId + '\\')">Report Suspected Counterfeit</button></div>' +
      '</div>';
    }
    var cls = data.isExpired ? 'counterfeit' : 'authentic';
    var icon = data.isExpired ? '⚠️' : '✅';
    var title = data.isExpired ? 'Medicine is EXPIRED' : 'Authentic Medicine';
    var sub = data.isExpired ? 'Do not consume this medication.' : 'Verified on Polygon Blockchain';
    var expClass = data.isExpired ? ' text-danger' : '';

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
        '</div>' +
        '<div class="card"><div class="flex-between mb-md"><h3>Custody Chain</h3><button class="btn btn-soft btn-sm" onclick="navigate(\\'/track?id=' + batchId + '\\')">Full Journey →</button></div>' +
          '<div class="timeline">' + BlockchainService.renderTimeline(batchId) + '</div>' +
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
        '<td><div class="pill pill-neutral">' + b.custodyCount + ' Transfers</div></td>' +
        '<td>' + statusPill + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<button class="btn btn-soft btn-sm" onclick="navigate(\\'/track?id=' + id + '\\')" title="Track">🔍</button>' +
          '<button class="btn btn-soft btn-sm" onclick="UI.showTransferModal(\\'' + id + '\\')" title="Transfer">🚚</button>' +
          '<button class="btn btn-soft btn-sm" onclick="UI.showQRModal(\\'' + id + '\\')" title="QR">🔳</button>' +
        '</div></td>' +
      '</tr>';
    }
    return '<div class="dash-layout animate-in">' +
      '<aside class="dash-sidebar">' +
        '<button class="dash-nav-item active" onclick="navigate(\\'/dashboard\\')"><span class="icon">📦</span> Batches</button>' +
        '<button class="dash-nav-item" onclick="navigate(\\'/analytics\\')"><span class="icon">📈</span> Analytics</button>' +
        '<hr style="border:0;border-top:1px solid var(--c-border);margin:8px 0">' +
        '<div style="padding:10px 14px"><div class="text-xs text-muted" style="margin-bottom:4px">ROLE</div><div class="pill pill-purple">Manufacturer</div></div>' +
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
  renderWith: function(fn, a, b) { document.getElementById('app').innerHTML = fn(a, b); },

  switchVerifyTab: function(tabId) {
    document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('view-scan').classList.toggle('hidden', tabId !== 'scan');
    document.getElementById('view-manual').classList.toggle('hidden', tabId !== 'manual');
  },

  simulateScan: function() {
    Utils.showToast('Scanning QR...', 'info');
    setTimeout(function() {
      var arr = ['DWT-AMX-2026-0528', 'DWT-CIP-2025-1120', 'INVALID-123'];
      var id = arr[Math.floor(Math.random() * arr.length)];
      document.getElementById('batch-input').value = id;
      UI.switchVerifyTab('manual');
      Utils.showToast('QR Decoded: ' + id, 'success');
    }, 800);
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
          '<button class="btn btn-soft btn-sm" onclick="document.getElementById(\\'trans-to\\').value=\\'0x90F79bf6EB2c4f870365E785982E1f101E9b9b06\\'">Pharmacy</button>' +
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
      '<button class="btn btn-primary w-full" onclick="Utils.showToast(\\'Label downloaded\\',\\'success\\');UI.hideModal()">Download Label</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  hideModal: function() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  filterBatches: function() {
    var q = document.getElementById('batch-search').value.toLowerCase();
    document.querySelectorAll('#batch-table .batch-tr').forEach(function(tr) {
      var ok = tr.dataset.name.indexOf(q) > -1 || tr.dataset.id.indexOf(q) > -1;
      tr.style.display = ok ? '' : 'none';
    });
  },

  reportCounterfeit: function(batchId) {
    Utils.showToast('Reporting counterfeit to ACA...', 'warning');
    setTimeout(function() {
      Utils.showToast('Counterfeit report logged for ' + batchId, 'success');
      navigate('/');
    }, 1000);
  },

  exportData: function() {
    var data = { network: 'Polygon Amoy', mode: 'Demo', timestamp: new Date().toISOString(), stats: DEMO_DB.stats };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dawatrace_export.json';
    a.click();
    Utils.showToast('Data exported', 'success');
  }
};
`);

// ============ SECTION 5: Blockchain Service ============
code.push(`
const BlockchainService = {
  updateWalletStatus: function() {
    var c = document.getElementById('topbar-actions');
    if (AppState.isDemoMode) {
      c.innerHTML = '<div class="wallet-badge"><div class="wallet-dot demo"></div>Demo Mode</div>';
      document.getElementById('demo-banner').classList.remove('hidden');
    } else {
      c.innerHTML = '<button class="btn btn-soft btn-sm" onclick="BlockchainService.connectWallet()">Connect Wallet</button>';
    }
  },

  connectWallet: function() {
    Utils.showToast('Web3 provider not detected. Using demo mode.', 'warning');
    AppState.isDemoMode = true;
    BlockchainService.updateWalletStatus();
  },

  getBatchData: function(batchId) {
    if (DEMO_DB.batches[batchId]) return DEMO_DB.batches[batchId];
    var rt = AppState.runtimeBatches.find(function(b) { return b.id === batchId; });
    return rt ? rt.metadata : null;
  },

  getCustodyData: function(batchId) {
    if (DEMO_DB.custodyChains[batchId]) return DEMO_DB.custodyChains[batchId];
    var rt = AppState.runtimeBatches.find(function(b) { return b.id === batchId; });
    return rt ? rt.custody : [];
  },

  renderTimeline: function(batchId) {
    var records = BlockchainService.getCustodyData(batchId);
    if (!records || records.length === 0) return '<p class="text-muted">No records found.</p>';
    var sorted = records.slice().sort(function(a,b) { return b.timestamp - a.timestamp; });
    var html = '';
    for (var i = 0; i < sorted.length; i++) {
      var rec = sorted[i];
      var dotClass = i === 0 ? 'active' : '';
      html += '<div class="timeline-item">' +
        '<div class="timeline-marker"><div class="timeline-dot ' + dotClass + '"></div><div class="timeline-line"></div></div>' +
        '<div class="timeline-content"><h4>' + rec.location + '</h4>' +
        '<p class="text-sm text-secondary">' + Utils.formatDate(rec.timestamp) + '</p>' +
        '<p class="text-xs text-mono text-muted mt-sm">Tx: 0x' + Math.random().toString(16).slice(2,10) + '...</p></div></div>';
    }
    return html;
  },

  verifyBatch: async function() {
    var input = document.getElementById('batch-input');
    var batchId = input ? input.value.trim() : '';
    if (!batchId) { Utils.showToast('Please enter a batch ID', 'error'); return; }
    document.getElementById('app').innerHTML = '<div class="verify-spinner container"><div class="spinner-ring"></div><h3>Verifying on-chain...</h3><p class="text-secondary text-mono">' + batchId + '</p></div>';
    await Utils.delay(1200);
    var data = BlockchainService.getBatchData(batchId);
    UI.renderWith(Renderers.result, data, batchId);
  },

  trackBatch: function() {
    var input = document.getElementById('track-input');
    var batchId = input ? input.value.trim() : '';
    if (!batchId) { Utils.showToast('Please enter a batch ID', 'error'); return; }
    var html = BlockchainService.renderTimeline(batchId);
    var batch = BlockchainService.getBatchData(batchId);
    var title = batch ? batch.drugName + ' — ' + batch.batchNumber : batchId;
    document.getElementById('track-result').innerHTML = '<div class="card mt-lg"><h3 class="mb-md">' + title + '</h3><div class="timeline">' + html + '</div></div>';
  },

  registerBatch: async function() {
    var name = document.getElementById('reg-name').value;
    var num = document.getElementById('reg-num').value;
    var exp = document.getElementById('reg-exp').value;
    if (!name || !num || !exp) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();
    Utils.showToast('Submitting transaction...', 'info');
    await Utils.delay(800);
    var genId = 'DWT-NEW-' + Date.now().toString(36).toUpperCase();
    var expTs = new Date(exp).getTime() / 1000;
    AppState.runtimeBatches.push({
      id: genId,
      metadata: { drugName: name, batchNumber: num, manufacturerName: 'Kenya Pharma Ltd', manufactureDate: Math.floor(Date.now()/1000), expiryDate: expTs, isAuthentic: true, isExpired: false, custodyCount: 1 },
      custody: [{ location: 'Kenya Pharma Factory, Nairobi', timestamp: Math.floor(Date.now()/1000) }]
    });
    Utils.showToast('Batch ' + genId + ' registered!', 'success');
    navigate('/dashboard');
  },

  transferCustody: async function(batchId) {
    var to = document.getElementById('trans-to').value;
    var loc = document.getElementById('trans-loc').value;
    if (!to || !loc) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();
    Utils.showToast('Signing transaction...', 'info');
    await Utils.delay(800);
    var target = AppState.runtimeBatches.find(function(b) { return b.id === batchId; });
    if (!target) {
      var dbRef = DEMO_DB.batches[batchId];
      var custRef = DEMO_DB.custodyChains[batchId] || [];
      target = { id: batchId, metadata: Object.assign({}, dbRef), custody: custRef.slice() };
      AppState.runtimeBatches.push(target);
    }
    target.custody.push({ location: loc, timestamp: Math.floor(Date.now()/1000) });
    target.metadata.custodyCount++;
    Utils.showToast('Custody transferred successfully', 'success');
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

  // Update active nav
  document.querySelectorAll('#topbar-nav a').forEach(function(a) {
    a.classList.toggle('active', a.dataset.route === cleanPath);
  });

  switch (cleanPath) {
    case '/': UI.render(Renderers.landing); break;
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
  window.scrollTo(0, 0);
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) UI.hideModal();
});

window.addEventListener('hashchange', routerHandler);
window.addEventListener('DOMContentLoaded', function() {
  BlockchainService.updateWalletStatus();
  routerHandler();
});
`);

// Write compiled file
fs.writeFileSync('frontend/app.js', code.join('\n'), 'utf8');
console.log('SUCCESS: frontend/app.js written (' + code.join('\n').length + ' bytes)');

// Clean up temp file if exists
try { fs.unlinkSync('frontend/app_core.js'); } catch (e) { }
