// ============================================================
// DawaTrace v2 — Pharmaceutical Verification Platform
// Dual-mode: Live blockchain (ethers.js) OR demo simulation
// Features: Multi-format scanning, GS1 parsing, Risk Engine,
//           RBAC, OpenFDA hot lookup, SMS mock
// ============================================================

// --- ABI (matches DawaTraceV2.sol) ---
const CONTRACT_ABI = [
  "function registerParticipant(address,string,string,bytes32) external",
  "function deactivateParticipant(address) external",
  "function registerProduct(string,string,string,string,uint256) external returns (bytes32)",
  "function transferCustody(bytes32,address,string,string) external",
  "function verifyProduct(bytes32) external returns (tuple(bool exists,bool isAuthentic,bool isExpired,bool isRecalled,string status,uint256 scanCount,string productName,string gtin,string serialNumber,string lotNumber,string manufacturer,uint256 manufactureDate,uint256 expiryDate,uint256 custodyCount,string recallReason))",
  "function verifyProductView(bytes32) view returns (tuple(bool exists,bool isAuthentic,bool isExpired,bool isRecalled,string status,uint256 scanCount,string productName,string gtin,string serialNumber,string lotNumber,string manufacturer,uint256 manufactureDate,uint256 expiryDate,uint256 custodyCount,string recallReason))",
  "function reportCounterfeit(bytes32,string) external",
  "function recallProduct(bytes32,string) external",
  "function recallLot(string,string) external",
  "function getCustodyChain(bytes32) view returns (tuple(address from,address to,uint256 timestamp,string location,string eventType)[])",
  "function getTotalProducts() view returns (uint256)",
  "function getTotalParticipants() view returns (uint256)",
  "function totalScans() view returns (uint256)",
  "function totalRecalls() view returns (uint256)",
  "function getProductIdAtIndex(uint256) view returns (bytes32)",
  "function products(bytes32) view returns (string,string,string,string,string,address,uint256,uint256,bool,bool,string)",
  "function currentHolder(bytes32) view returns (address)",
  "function participants(address) view returns (string,string,bool,uint256)",
  "function getParticipantRole(address) view returns (string)",
  "function scanCount(bytes32) view returns (uint256)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function grantRole(bytes32,address) external",
  "function revokeRole(bytes32,address) external",
  "function MANUFACTURER_ROLE() view returns (bytes32)",
  "function DISTRIBUTOR_ROLE() view returns (bytes32)",
  "function PHARMACY_ROLE() view returns (bytes32)",
  "function REGULATOR_ROLE() view returns (bytes32)",
  "event ProductRegistered(bytes32 indexed,string,string,string,address indexed,uint256)",
  "event CustodyTransferred(bytes32 indexed,address indexed,address indexed,string,string,uint256)",
  "event ProductVerified(bytes32 indexed,address indexed,string,uint256,uint256)",
  "event ProductRecalled(bytes32 indexed,string,address indexed,uint256)",
  "event LotRecalled(string,string,address indexed,uint256)",
  "event CounterfeitReported(bytes32 indexed,address indexed,string,uint256)",
  "event ParticipantRegistered(address indexed,string,bytes32,uint256)"
];

var DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
var HARDHAT_CHAIN_ID = '0x7A69';

// --- State ---
var provider = null, signer = null, contract = null, contractAddress = null;
var isConnected = false, demoMode = true;
var currentRole = 'CONSUMER';
var DEMO_DB = { products: [], recalledLots: [], stats: {}, metadata: {} };
var dataLoaded = false;

// Build a run of real flag <img> tags from ISO-2 country codes
function flagImgs(codes) {
  return codes.map(function(c) {
    var special = c === 'eu' ? 'https://flagcdn.com/w40/eu.png'
                : c === 'hk' ? 'https://flagcdn.com/w40/hk.png'
                : c === 'mo' ? 'https://flagcdn.com/w40/mo.png'
                : c === 'pr' ? 'https://flagcdn.com/w40/pr.png'
                : c === 'gu' ? 'https://flagcdn.com/w40/gu.png'
                : c === 'xk' ? 'https://flagcdn.com/w40/xk.png'
                : 'https://flagcdn.com/w40/' + c.toLowerCase() + '.png';
    return '<img src="' + special + '" alt="' + c.toUpperCase() + '" loading="lazy">';
  }).join('');
}


// ============================================================
//                     UTILITIES
// ============================================================

var Utils = {
  formatDate: function(ts) {
    if (!ts) return '—';
    var d = new Date(Number(ts) * 1000);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },
  shortAddr: function(a) {
    if (!a || a.length < 10) return a || '';
    return a.slice(0,6) + '...' + a.slice(-4);
  },
  delay: function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); },
  showToast: function(msg, type) {
    var c = document.getElementById('toast-container');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    t.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span>' + msg + '</span>';
    c.appendChild(t);
    setTimeout(function() { t.classList.add('toast-exit'); setTimeout(function() { t.remove(); }, 300); }, 4000);
  },
  parseGS1: function(raw) {
    var data = raw.replace(/^\]d2/, '');
    var result = {};
    var m;
    m = data.match(/01(\d{14})/); if (m) result.gtin = m[1];
    m = data.match(/17(\d{6})/); if (m) result.expiry = m[1];
    m = data.match(/10([^\x1D]+)/); if (m) result.lot = m[1].replace(/21.*$/, '');
    m = data.match(/21([^\x1D]+)/); if (m) result.serial = m[1];
    return result;
  },
  statusColor: function(s) {
    var map = { GENUINE: 'var(--c-success)', EXPIRED: 'var(--c-warning)', RECALLED: 'var(--c-danger)', SUSPICIOUS: '#F97316', COUNTERFEIT: 'var(--c-danger)' };
    return map[s] || 'var(--c-text-secondary)';
  },
  statusIcon: function(s) {
    var map = { GENUINE: '✅', EXPIRED: '⏰', RECALLED: '🚨', SUSPICIOUS: '⚠️', COUNTERFEIT: '❌', UNTRACKED: '🔍' };
    return map[s] || '❓';
  },
  trustColor: function(score) {
    if (score >= 80) return 'var(--c-success)';
    if (score >= 50) return '#F97316';
    return 'var(--c-danger)';
  }
};

window.navigate = function(path) { window.location.hash = path; };

// ============================================================
//                     RISK ENGINE
// ============================================================

var RiskEngine = {
  score: function(product) {
    if (!product || !product.exists) return { trust: 0, status: 'COUNTERFEIT', signals: ['Serial number not found in any registry — likely counterfeit'] };

    var trust = 100;
    var signals = [];

    if (product.isRecalled) {
      trust -= 80;
      signals.push('⛔ Product recalled: ' + (product.recallReason || 'See manufacturer notice'));
    }
    if (product.isExpired) {
      trust -= 60;
      signals.push('⏰ Product expired on ' + Utils.formatDate(product.expiryDate));
    }
    var scans = Number(product.scanCount || 0);
    if (scans > 10) {
      trust -= Math.min(40, scans * 2);
      signals.push('📡 Scanned ' + scans + ' times — possible cloned identifier');
    } else if (scans > 5) {
      trust -= 10;
      signals.push('📡 Scanned ' + scans + ' times — monitor for duplication');
    }
    var custody = Number(product.custodyCount || 0);
    if (custody === 0) {
      trust -= 20;
      signals.push('🔗 No supply chain events recorded');
    } else if (custody < 3) {
      trust -= 5;
      signals.push('🔗 Incomplete supply chain (' + custody + ' events)');
    } else {
      signals.push('🔗 Full supply chain verified (' + custody + ' events)');
    }
    if (trust >= 80 && !product.isRecalled && !product.isExpired) signals.unshift('✅ Cryptographic signature valid');

    trust = Math.max(0, Math.min(100, trust));
    var status;
    if (product.isRecalled) status = 'RECALLED';
    else if (product.isExpired) status = 'EXPIRED';
    else if (trust >= 80) status = 'GENUINE';
    else if (trust >= 50) status = 'SUSPICIOUS';
    else status = 'COUNTERFEIT';

    return { trust: trust, status: status, signals: signals };
  },

  scoreUntracked: function(lookupResult) {
    // Product found in an external registry but NOT in our blockchain
    var signals = [];
    var trust = 40;
    var src = lookupResult.source || 'Unknown';
    var country = lookupResult.country || '';
    var flag = lookupResult.flag || '🌐';

    if (lookupResult.apiVerified) {
      trust = 50;
      signals.push(flag + ' Product verified via ' + src + ' — confirmed real product');
    } else if (lookupResult.whoMatch) {
      trust = 42;
      signals.push('🏥 Matches WHO Essential Medicine: ' + lookupResult.whoMatch.n + ' (' + lookupResult.whoMatch.c + ')');
    } else if (country) {
      trust = 35;
      signals.push(flag + ' Barcode registered in ' + country);
    }

    if (lookupResult.manufacturer) signals.push('🏭 Manufacturer: ' + lookupResult.manufacturer);
    if (lookupResult.regulatoryBody) signals.push('📋 Regulatory body: ' + lookupResult.regulatoryBody);
    signals.push('⚠️ NOT tracked in DawaTrace blockchain — no provenance data');
    signals.push('🔗 No on-chain supply chain events available');
    signals.push('ℹ️ This product exists but has not been registered in our verification system');

    return { trust: trust, status: 'UNTRACKED', signals: signals };
  }
};

// ============================================================
//        GLOBAL PHARMACEUTICAL LOOKUP (Multi-Source)
// ============================================================

var GlobalLookup = {

  // Master cascade: OpenFDA → RxNorm → WHO → GS1 prefix
  lookup: async function(query) {
    var result = { found: false, source: null, country: null, flag: '🌐', apiVerified: false };
    var isNumeric = /^\d{8,14}$/.test(query);

    // Step 0: GS1 country decode (always, if numeric)
    if (isNumeric && typeof GlobalReference !== 'undefined') {
      var geo = GlobalReference.decodeCountry(query);
      if (geo) {
        result.country = geo.country;
        result.flag = geo.flag;
        result.gs1Prefix = geo.prefix;
        result.regulatoryBody = this.getRegulator(geo.country);
      }
    }

    // Step 1: OpenFDA (US products — best API)
    try {
      var fdaResult = await this.queryOpenFDA(query);
      if (fdaResult) {
        result.found = true;
        result.apiVerified = true;
        result.source = 'OpenFDA (US FDA)';
        result.productName = fdaResult.productName;
        result.genericName = fdaResult.genericName;
        result.manufacturer = fdaResult.manufacturer;
        result.ndc = fdaResult.ndc;
        result.dosageForm = fdaResult.dosageForm;
        result.route = fdaResult.route;
        if (!result.country) { result.country = 'United States'; result.flag = '🇺🇸'; }
        return result;
      }
    } catch(e) { console.log('OpenFDA cascade skip:', e.message); }

    // Step 2: RxNorm (NIH — drug name normalization, global)
    if (!isNumeric) {
      try {
        var rxResult = await this.queryRxNorm(query);
        if (rxResult) {
          result.found = true;
          result.apiVerified = true;
          result.source = 'RxNorm (NIH)';
          result.productName = rxResult.name;
          result.genericName = rxResult.name;
          result.rxcui = rxResult.rxcui;
          // Try to get more details via RxNorm properties
          try {
            var props = await this.queryRxNormProperties(rxResult.rxcui);
            if (props) {
              if (props.dosageForm) result.dosageForm = props.dosageForm;
            }
          } catch(pe) {}
          return result;
        }
      } catch(e) { console.log('RxNorm cascade skip:', e.message); }
    }

    // Step 3: WHO Essential Medicines (embedded, instant)
    if (typeof GlobalReference !== 'undefined') {
      var whoMatch = GlobalReference.matchWHO(query);
      if (whoMatch) {
        result.found = true;
        result.source = 'WHO Essential Medicines List';
        result.whoMatch = whoMatch;
        result.productName = whoMatch.n;
        result.genericName = whoMatch.g;
        result.dosageForm = whoMatch.c;
        // Infer manufacturer from country
        if (result.country) {
          var mfgs = GlobalReference.getManufacturers(result.country);
          if (mfgs && mfgs.length > 0) result.manufacturer = mfgs[0] + ' (typical for ' + result.country + ')';
        }
        return result;
      }
    }

    // Step 4: If we at least decoded the country from GS1
    if (result.country && isNumeric) {
      result.found = true;
      result.source = 'GS1 Barcode Registry';
      result.productName = 'Pharmaceutical Product (barcode origin: ' + result.country + ')';
      var mfgs2 = typeof GlobalReference !== 'undefined' ? GlobalReference.getManufacturers(result.country) : null;
      if (mfgs2) result.manufacturer = 'Likely: ' + mfgs2.slice(0,3).join(', ');
      return result;
    }

    // Step 5: Try OpenFDA label search as last resort (broader search)
    if (!isNumeric) {
      try {
        var labelResult = await this.queryOpenFDALabel(query);
        if (labelResult) {
          result.found = true;
          result.apiVerified = true;
          result.source = 'OpenFDA Drug Labels';
          result.productName = labelResult.productName;
          result.genericName = labelResult.genericName;
          result.manufacturer = labelResult.manufacturer;
          return result;
        }
      } catch(e) { console.log('OpenFDA label cascade skip:', e.message); }
    }

    return result;
  },

  queryOpenFDA: async function(query) {
    var url;
    if (/^\d{10,14}$/.test(query)) {
      var ndc = query.length === 14 ? query.substring(3,7) + '-' + query.substring(7,11) : query;
      url = 'https://api.fda.gov/drug/ndc.json?search=product_ndc:"' + ndc + '"&limit=1';
    } else {
      url = 'https://api.fda.gov/drug/ndc.json?search=brand_name:"' + encodeURIComponent(query) + '"&limit=1';
    }
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    var r = data.results[0];
    return {
      productName: (r.brand_name || r.generic_name || 'Unknown') + ' ' + (r.dosage_form || ''),
      genericName: r.generic_name || '',
      manufacturer: r.labeler_name || 'Unknown',
      ndc: r.product_ndc || '',
      dosageForm: r.dosage_form || '',
      route: (r.route || [''])[0]
    };
  },

  queryOpenFDALabel: async function(query) {
    var url = 'https://api.fda.gov/drug/label.json?search=openfda.brand_name:"' + encodeURIComponent(query) + '"&limit=1';
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    var r = data.results[0];
    var of = r.openfda || {};
    return {
      productName: (of.brand_name ? of.brand_name[0] : query) + ' ' + (of.dosage_form ? of.dosage_form[0] : ''),
      genericName: of.generic_name ? of.generic_name[0] : '',
      manufacturer: of.manufacturer_name ? of.manufacturer_name[0] : 'Unknown'
    };
  },

  queryRxNorm: async function(query) {
    var url = 'https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + encodeURIComponent(query) + '&search=2';
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();
    if (!data.idGroup || !data.idGroup.rxnormId || data.idGroup.rxnormId.length === 0) {
      // Try approximate match
      var url2 = 'https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=' + encodeURIComponent(query) + '&maxEntries=1';
      var res2 = await fetch(url2);
      if (!res2.ok) return null;
      var data2 = await res2.json();
      if (!data2.approximateGroup || !data2.approximateGroup.candidate || data2.approximateGroup.candidate.length === 0) return null;
      var c = data2.approximateGroup.candidate[0];
      return { rxcui: c.rxcui, name: c.rxaui ? query : query, score: c.score };
    }
    return { rxcui: data.idGroup.rxnormId[0], name: data.idGroup.name || query };
  },

  queryRxNormProperties: async function(rxcui) {
    var url = 'https://rxnav.nlm.nih.gov/REST/rxcui/' + rxcui + '/properties.json';
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();
    if (!data.properties) return null;
    return { name: data.properties.name, dosageForm: data.properties.tty || '' };
  },

  getRegulator: function(country) {
    var map = {
      'US/Canada': 'FDA (US Food & Drug Administration)',
      'US (Drugs)': 'FDA (US Food & Drug Administration)',
      'US (Drugs/Healthcare)': 'FDA (US Food & Drug Administration)',
      'United States': 'FDA (US Food & Drug Administration)',
      'UK': 'MHRA (Medicines & Healthcare products Regulatory Agency)',
      'France': 'ANSM (Agence nationale de sécurité du médicament)',
      'Germany': 'BfArM (Federal Institute for Drugs and Medical Devices)',
      'Italy': 'AIFA (Agenzia Italiana del Farmaco)',
      'Spain': 'AEMPS (Agencia Española de Medicamentos)',
      'Japan': 'PMDA (Pharmaceuticals and Medical Devices Agency)',
      'China': 'NMPA (National Medical Products Administration)',
      'India': 'CDSCO (Central Drugs Standard Control Organisation)',
      'Brazil': 'ANVISA (Agência Nacional de Vigilância Sanitária)',
      'Mexico': 'COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios)',
      'South Africa': 'SAHPRA (South African Health Products Regulatory Authority)',
      'Kenya': 'PPB (Pharmacy and Poisons Board)',
      'Nigeria': 'NAFDAC (National Agency for Food and Drug Administration and Control)',
      'Ghana': 'FDA Ghana (Food and Drugs Authority)',
      'Tanzania': 'TMDA (Tanzania Medicines and Medical Devices Authority)',
      'Egypt': 'EDA (Egyptian Drug Authority)',
      'UAE': 'MOH (Ministry of Health and Prevention)',
      'Saudi Arabia': 'SFDA (Saudi Food & Drug Authority)',
      'South Korea': 'MFDS (Ministry of Food and Drug Safety)',
      'Australia': 'TGA (Therapeutic Goods Administration)',
      'Russia': 'Roszdravnadzor (Federal Service for Surveillance in Healthcare)',
      'Indonesia': 'BPOM (Badan Pengawas Obat dan Makanan)',
      'Thailand': 'Thai FDA (Food and Drug Administration Thailand)',
      'Pakistan': 'DRAP (Drug Regulatory Authority of Pakistan)',
      'Bangladesh': 'DGDA (Directorate General of Drug Administration)',
      'Vietnam': 'DAV (Drug Administration of Vietnam)',
      'Philippines': 'FDA Philippines',
      'Colombia': 'INVIMA (Instituto Nacional de Vigilancia de Medicamentos)',
      'Argentina': 'ANMAT (Administración Nacional de Medicamentos)',
      'Turkey': 'TITCK (Turkish Medicines and Medical Devices Agency)',
      'Poland': 'URPL (Office for Registration of Medicinal Products)',
      'Switzerland': 'Swissmedic',
      'Netherlands': 'MEB (Medicines Evaluation Board)',
      'Israel': 'MOH Israel (Ministry of Health Pharmaceutical Division)',
      'Iran': 'IFDA (Iran Food and Drug Administration)',
      'Malaysia': 'NPRA (National Pharmaceutical Regulatory Agency)',
      'Singapore': 'HSA (Health Sciences Authority)',
      'Cambodia': 'DDF (Department of Drugs and Food)',
      'Sri Lanka': 'NMRA (National Medicines Regulatory Authority)',
    };
    for (var key in map) { if (country && country.indexOf(key) > -1) return map[key]; }
    // For EU countries, return EMA
    var eu = ['France','Germany','Italy','Spain','Netherlands','Belgium','Austria','Sweden','Denmark','Finland','Ireland','Portugal','Greece','Poland','Romania','Czech Republic','Hungary','Bulgaria','Croatia','Slovenia','Slovakia','Estonia','Latvia','Lithuania','Malta','Cyprus','Luxembourg'];
    for (var i = 0; i < eu.length; i++) { if (country && country.indexOf(eu[i]) > -1) return 'EMA (European Medicines Agency) + National Authority'; }
    return null;
  }
};

// ============================================================
//                      RENDERERS
// ============================================================

var Renderers = {
  landing: function() {
    return '<section class="hero">' +
      '<div class="container">' +
        '<div class="hero-badge"><span class="pill pill-accent">Blockchain-Verified · AI-Scored · Global Coverage</span></div>' +
        '<h1 class="hero-title">Protecting Lives Through<br><span class="gradient-text">Verified Medicine.</span></h1>' +
        '<p class="hero-subtitle">DawaTrace uses blockchain provenance and AI risk scoring to combat counterfeit pharmaceuticals — the silent crisis killing over 250,000 people annually. Scan any medicine, from any country, in seconds.</p>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-primary btn-lg" onclick="navigate(\'/verify\')">🔍 Verify Medicine Now</button>' +
          '<button class="btn btn-soft btn-lg" onclick="navigate(\'/dashboard\')">📊 View Dashboard</button>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="container mt-2xl mb-xl">' +
      '<div class="text-center mb-xl">' +
        '<h2>How It Works</h2>' +
        '<p class="text-secondary mt-sm" style="max-width:560px;margin-left:auto;margin-right:auto">Three steps between uncertainty and confidence. No app download, no registration — just point and scan.</p>' +
      '</div>' +
      '<div class="grid-3">' +
        '<div class="card text-center" style="padding:32px 24px">' +
          '<div style="font-size:40px;margin-bottom:16px">📷</div>' +
          '<h3 style="margin-bottom:8px">Scan</h3>' +
          '<p class="text-secondary text-sm">Point your camera at a QR code, barcode, or GS1 DataMatrix on any medicine package — works worldwide.</p>' +
        '</div>' +
        '<div class="card text-center" style="padding:32px 24px">' +
          '<div style="font-size:40px;margin-bottom:16px">🧠</div>' +
          '<h3 style="margin-bottom:8px">Analyze</h3>' +
          '<p class="text-secondary text-sm">Our risk engine cross-references blockchain records, global registries (FDA, WHO, EMA), recall databases, and scan patterns.</p>' +
        '</div>' +
        '<div class="card text-center" style="padding:32px 24px">' +
          '<div style="font-size:40px;margin-bottom:16px">🛡️</div>' +
          '<h3 style="margin-bottom:8px">Trust Score</h3>' +
          '<p class="text-secondary text-sm">Receive a 0–100 trust score with transparent risk signals — not just pass/fail, but evidence you can act on.</p>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section style="background:var(--c-surface);border-top:1px solid var(--c-border);border-bottom:1px solid var(--c-border);padding:48px 0">' +
      '<div class="container">' +
        '<div class="grid-3" style="gap:32px">' +
          '<div>' +
            '<div style="font-size:24px;margin-bottom:12px">🎯</div>' +
            '<h3 style="margin-bottom:8px;color:var(--c-accent)">Mission</h3>' +
            '<p class="text-secondary text-sm" style="line-height:1.7">To eliminate counterfeit pharmaceuticals from supply chains by making verification instant, free, and accessible to every consumer — regardless of connectivity or technical literacy.</p>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:24px;margin-bottom:12px">🔭</div>' +
            '<h3 style="margin-bottom:8px;color:var(--c-accent)">Vision</h3>' +
            '<p class="text-secondary text-sm" style="line-height:1.7">A world where no one dies from fake medicine. Every pill traceable from factory floor to patient hand, with an immutable chain of custody that counterfeiters cannot forge.</p>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:24px;margin-bottom:12px">⚡</div>' +
            '<h3 style="margin-bottom:8px;color:var(--c-accent)">Approach</h3>' +
            '<p class="text-secondary text-sm" style="line-height:1.7">Blockchain is invisible to the user. No crypto knowledge needed. Scan → Score → Act. We connect global registries (OpenFDA, RxNorm, WHO) with on-chain provenance to deliver trust in seconds.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="container mt-xl mb-xl">' +
      '<div class="grid-2" style="gap:40px;align-items:center">' +
        '<div>' +
          '<span class="pill pill-purple mb-md" style="display:inline-block">Global Coverage</span>' +
          '<h2 style="margin-bottom:12px">200+ Countries.<br>40+ Regulatory Bodies.</h2>' +
          '<p class="text-secondary" style="line-height:1.7;margin-bottom:16px">Scan a barcode from Kenya, Nigeria, India, UAE, Brazil, the EU, or anywhere else — DawaTrace instantly identifies the country of origin, regulatory authority, and cross-references against global pharmaceutical intelligence.</p>' +
          '<button class="btn btn-primary" onclick="navigate(\'/verify\')">Try It Now →</button>' +
        '</div>' +
        '<div class="flag-collage" id="flag-collage">' +
          '<div class="flag-track flag-track-1">' + flagImgs(['af','al','dz','ad','ao','ag','ar','am','au','at','az','bs','bh','bd','bb','by','be','bz','bj','bt','bo','ba','bw','br','bn']) + flagImgs(['af','al','dz','ad','ao','ag','ar','am','au','at','az','bs','bh','bd','bb','by','be','bz','bj','bt','bo','ba','bw','br','bn']) + '</div>' +
          '<div class="flag-track flag-track-2">' + flagImgs(['bg','bf','bi','cv','kh','cm','ca','cf','td','cl','cn','co','km','cg','cd','cr','hr','cu','cy','cz','dk','dj','dm','do','ec']) + flagImgs(['bg','bf','bi','cv','kh','cm','ca','cf','td','cl','cn','co','km','cg','cd','cr','hr','cu','cy','cz','dk','dj','dm','do','ec']) + '</div>' +
          '<div class="flag-track flag-track-3">' + flagImgs(['eg','sv','gq','er','ee','sz','et','fj','fi','fr','ga','gm','ge','de','gh','gr','gd','gt','gn','gw','gy','ht','hn','hu','is']) + flagImgs(['eg','sv','gq','er','ee','sz','et','fj','fi','fr','ga','gm','ge','de','gh','gr','gd','gt','gn','gw','gy','ht','hn','hu','is']) + '</div>' +
          '<div class="flag-track flag-track-4">' + flagImgs(['in','id','ir','iq','ie','il','it','jm','jp','jo','kz','ke','ki','kp','kr','xk','kw','kg','la','lv','lb','ls','lr','ly','li']) + flagImgs(['in','id','ir','iq','ie','il','it','jm','jp','jo','kz','ke','ki','kp','kr','xk','kw','kg','la','lv','lb','ls','lr','ly','li']) + '</div>' +
          '<div class="flag-track flag-track-5">' + flagImgs(['lt','lu','mg','mw','my','mv','ml','mt','mh','mr','mu','mx','fm','md','mc','mn','me','ma','mz','mm','na','nr','np','nl','nz']) + flagImgs(['lt','lu','mg','mw','my','mv','ml','mt','mh','mr','mu','mx','fm','md','mc','mn','me','ma','mz','mm','na','nr','np','nl','nz']) + '</div>' +
          '<div class="flag-track flag-track-6">' + flagImgs(['ni','ne','ng','mk','no','om','pk','pw','ps','pa','pg','py','pe','ph','pl','pt','qa','ro','ru','rw','kn','lc','vc','ws','sm']) + flagImgs(['ni','ne','ng','mk','no','om','pk','pw','ps','pa','pg','py','pe','ph','pl','pt','qa','ro','ru','rw','kn','lc','vc','ws','sm']) + '</div>' +
          '<div class="flag-track flag-track-7">' + flagImgs(['st','sa','sn','rs','sl','sg','sk','si','sb','so','za','ss','es','lk','sd','sr','se','ch','sy','tw','tj','tz','th','tl','tg']) + flagImgs(['st','sa','sn','rs','sl','sg','sk','si','sb','so','za','ss','es','lk','sd','sr','se','ch','sy','tw','tj','tz','th','tl','tg']) + '</div>' +
          '<div class="flag-track flag-track-8">' + flagImgs(['to','tt','tn','tr','tm','tv','ug','ua','ae','gb','us','uy','uz','vu','ve','vn','ye','zm','zw','eu','hk','mo','pr','gu','is']) + flagImgs(['to','tt','tn','tr','tm','tv','ug','ua','ae','gb','us','uy','uz','vu','ve','vn','ye','zm','zw','eu','hk','mo','pr','gu','is']) + '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +


    '<section style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);color:white;padding:48px 0;text-align:center">' +
      '<div class="container">' +
        '<h2 style="margin-bottom:8px;color:white">Ready to Verify?</h2>' +
        '<p style="color:#94A3B8;margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto">Scan any medicine barcode or QR code from any country. No registration, no app download — just open and scan.</p>' +
        '<button class="btn btn-primary btn-lg" onclick="navigate(\'/verify\')">🔍 Start Verification</button>' +
      '</div>' +
    '</section>';
  },

  verify: function() {
    var quickBtns = '';
    var samples = DEMO_DB.products.filter(function(p) { return p.status === 'GENUINE'; }).slice(0, 3);
    var expSample = DEMO_DB.products.find(function(p) { return p.status === 'EXPIRED'; });
    var rclSample = DEMO_DB.products.find(function(p) { return p.status === 'RECALLED'; });
    var fakeSample = DEMO_DB.products.find(function(p) { return p.status === 'COUNTERFEIT'; });

    if (samples.length) {
      quickBtns = '<div class="quick-demos mt-md"><p class="text-xs text-secondary mb-sm">Quick demos:</p><div class="demo-pills">';
      samples.forEach(function(s) {
        quickBtns += '<button class="pill pill-success" onclick="document.getElementById(\'batch-input\').value=\'' + s.serialNumber + '\';BlockchainService.verifyProduct()">' + s.productName.split(' ')[0] + ' ✅</button>';
      });
      if (expSample) quickBtns += '<button class="pill pill-warning" onclick="document.getElementById(\'batch-input\').value=\'' + expSample.serialNumber + '\';BlockchainService.verifyProduct()">Expired ⏰</button>';
      if (rclSample) quickBtns += '<button class="pill pill-danger" onclick="document.getElementById(\'batch-input\').value=\'' + rclSample.serialNumber + '\';BlockchainService.verifyProduct()">Recalled 🚨</button>';
      if (fakeSample) quickBtns += '<button class="pill pill-danger" onclick="document.getElementById(\'batch-input\').value=\'' + fakeSample.serialNumber + '\';BlockchainService.verifyProduct()">Fake ❌</button>';
      quickBtns += '</div></div>';
    }

    return '<div class="container mt-xl">' +
      '<div class="verify-header text-center mb-xl">' +
        '<h1>Verify Medicine</h1>' +
        '<p class="text-secondary">Scan a QR code, barcode, or enter a serial number to check authenticity</p>' +
      '</div>' +
      '<div class="verify-tabs mb-lg">' +
        '<button class="tab-btn active" onclick="UI.switchVerifyTab(\'scan\')" id="tab-scan"><span class="tab-icon">📷</span><span>Camera Scan</span></button>' +
        '<button class="tab-btn" onclick="UI.switchVerifyTab(\'upload\')" id="tab-upload"><span class="tab-icon">📁</span><span>Upload Image</span></button>' +
        '<button class="tab-btn" onclick="UI.switchVerifyTab(\'manual\')" id="tab-manual"><span class="tab-icon">⌨️</span><span>Manual Entry</span></button>' +
        '<button class="tab-btn" onclick="UI.switchVerifyTab(\'sms\')" id="tab-sms"><span class="tab-icon">📱</span><span>SMS / USSD</span></button>' +
      '</div>' +
      '<div class="verify-content">' +
        '<div id="verify-scan" class="verify-panel active">' +
          '<div class="card">' +
            '<div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;border-radius:12px;overflow:hidden"></div>' +
            '<div class="scanner-controls mt-md" style="display:flex;gap:8px;justify-content:center">' +
              '<button class="btn btn-primary" id="btn-start-scan" onclick="UI.startScanner()">▶️ Start Scanner</button>' +
              '<button class="btn btn-danger" id="btn-stop-scan" onclick="UI.stopScanner()" style="display:none">⏹️ Stop Scanner</button>' +
            '</div>' +
            '<p class="text-xs text-secondary text-center mt-sm">Supports QR codes, barcodes (EAN-13, Code 128, UPC-A), and GS1 DataMatrix</p>' +
          '</div>' +
        '</div>' +
        '<div id="verify-upload" class="verify-panel">' +
          '<div class="card text-center">' +
            '<div class="empty-icon mb-md">📁</div>' +
            '<p class="mb-md">Upload an image of a QR code or barcode</p>' +
            '<label class="btn btn-primary"><input type="file" accept="image/*" onchange="UI.scanUploadedImage(event)" style="display:none"> Choose Image</label>' +
          '</div>' +
        '</div>' +
        '<div id="verify-manual" class="verify-panel">' +
          '<div class="card">' +
            '<div class="form-group">' +
              '<label class="form-label">Serial Number, GTIN, or Batch ID</label>' +
              '<div style="display:flex;gap:8px">' +
                '<input type="text" id="batch-input" class="form-input text-mono" placeholder="e.g. SN-9F82A7C4 or 00312345678906">' +
                '<button class="btn btn-primary" onclick="BlockchainService.verifyProduct()">Verify</button>' +
              '</div>' +
            '</div>' +
            quickBtns +
          '</div>' +
        '</div>' +
        '<div id="verify-sms" class="verify-panel">' +
          '<div class="card">' +
            '<div class="text-center mb-lg">' +
              '<div class="empty-icon">📱</div>' +
              '<h3>SMS / USSD Verification</h3>' +
              '<p class="text-secondary">For low-connectivity regions</p>' +
            '</div>' +
            '<div class="sms-demo">' +
              '<div class="form-group mb-md">' +
                '<label class="form-label">Simulate SMS Verification</label>' +
                '<div style="display:flex;gap:8px">' +
                  '<input type="text" id="sms-input" class="form-input text-mono" placeholder="Enter serial number">' +
                  '<button class="btn btn-primary" onclick="UI.mockSMSVerify()">Send</button>' +
                '</div>' +
              '</div>' +
              '<div class="card" style="background:var(--c-bg);font-family:monospace;font-size:13px" id="sms-response">' +
                '<p style="color:var(--c-text-secondary)">SMS response will appear here...</p>' +
                '<p class="mt-sm text-xs text-secondary">Send <b>VERIFY [serial]</b> to +254 700 DAWA (demo)</p>' +
                '<p class="text-xs text-secondary">Or dial <b>*384*[serial]#</b> (USSD demo)</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  result: function(data, query, riskResult) {
    var r = riskResult || RiskEngine.score(data);
    var trustPct = r.trust;
    var color = Utils.trustColor(trustPct);
    var icon = Utils.statusIcon(r.status);
    var statusLabel = r.status;

    // Trust gauge SVG
    var circumference = 2 * Math.PI * 54;
    var offset = circumference - (trustPct / 100) * circumference;
    var gauge = '<svg width="140" height="140" viewBox="0 0 120 120">' +
      '<circle cx="60" cy="60" r="54" stroke="var(--c-border)" stroke-width="8" fill="none"/>' +
      '<circle cx="60" cy="60" r="54" stroke="' + color + '" stroke-width="8" fill="none" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s ease"/>' +
      '<text x="60" y="55" text-anchor="middle" font-size="28" font-weight="700" fill="' + color + '">' + trustPct + '</text>' +
      '<text x="60" y="72" text-anchor="middle" font-size="11" fill="var(--c-text-secondary)">Trust Score</text>' +
    '</svg>';

    var detailsHtml = '';
    if (data && data.exists !== false && data.productName) {
      detailsHtml = '<div class="result-details grid-2 mt-lg">' +
        '<div class="detail-item"><span class="detail-label">Product</span><span class="detail-value">' + (data.productName || '—') + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Manufacturer</span><span class="detail-value">' + (data.manufacturer || '—') + '</span></div>' +
        (data.genericName ? '<div class="detail-item"><span class="detail-label">Generic Name</span><span class="detail-value">' + data.genericName + '</span></div>' : '') +
        '<div class="detail-item"><span class="detail-label">GTIN</span><span class="detail-value text-mono">' + (data.gtin || '—') + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Serial</span><span class="detail-value text-mono">' + (data.serialNumber || '—') + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Lot</span><span class="detail-value text-mono">' + (data.lotNumber || '—') + '</span></div>' +
        (data.manufactureDate ? '<div class="detail-item"><span class="detail-label">Manufactured</span><span class="detail-value">' + Utils.formatDate(data.manufactureDate) + '</span></div>' : '') +
        (data.expiryDate ? '<div class="detail-item"><span class="detail-label">Expires</span><span class="detail-value">' + Utils.formatDate(data.expiryDate) + '</span></div>' : '') +
        '<div class="detail-item"><span class="detail-label">Custody Events</span><span class="detail-value">' + (data.custodyCount || (data.supplyChain ? data.supplyChain.length : 0)) + '</span></div>' +
        (data.country ? '<div class="detail-item"><span class="detail-label">Origin Country</span><span class="detail-value">' + (data.flag || '🌐') + ' ' + data.country + '</span></div>' : '') +
        (data.regulatoryBody ? '<div class="detail-item"><span class="detail-label">Regulatory Body</span><span class="detail-value">' + data.regulatoryBody + '</span></div>' : '') +
        (data.source ? '<div class="detail-item"><span class="detail-label">Data Source</span><span class="detail-value"><span class="pill pill-accent" style="font-size:11px">' + data.source + '</span></span></div>' : '') +
        (data.ndc ? '<div class="detail-item"><span class="detail-label">NDC</span><span class="detail-value text-mono">' + data.ndc + '</span></div>' : '') +
        (data.dosageForm ? '<div class="detail-item"><span class="detail-label">Dosage Form</span><span class="detail-value">' + data.dosageForm + '</span></div>' : '') +
      '</div>';
    }

    var signalsHtml = '<div class="risk-signals mt-lg"><h3 class="mb-md">Risk Signals</h3>';
    r.signals.forEach(function(s) {
      signalsHtml += '<div class="signal-item">' + s + '</div>';
    });
    signalsHtml += '</div>';

    var timelineHtml = '<div id="result-timeline" class="mt-lg"></div>';

    var actionsHtml = '<div class="result-actions mt-lg" style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-primary" onclick="UI.renderWith(Renderers.verify)">← Verify Another</button>' +
      (r.status === 'COUNTERFEIT' || r.status === 'SUSPICIOUS' ? '<button class="btn btn-danger" onclick="UI.reportCounterfeit(\'' + (query || '') + '\')">🚨 Report Counterfeit</button>' : '') +
      (data && data.exists !== false ? '<button class="btn btn-soft" onclick="navigate(\'/track?id=' + (query || '') + '\')">📦 Track Supply Chain</button>' : '') +
    '</div>';

    return '<div class="container mt-xl">' +
      '<div class="result-card card">' +
        '<div class="result-header" style="border-left:4px solid ' + color + '">' +
          '<div class="result-gauge">' + gauge + '</div>' +
          '<div class="result-status">' +
            '<div class="result-status-label" style="color:' + color + '">' + icon + ' ' + statusLabel + '</div>' +
            '<p class="text-secondary text-sm">Query: <span class="text-mono">' + (query || '—') + '</span></p>' +
          '</div>' +
        '</div>' +
        detailsHtml +
        signalsHtml +
        timelineHtml +
        actionsHtml +
      '</div>' +
    '</div>';
  },

  track: function() {
    var params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    var prefill = params.get('id') || '';
    return '<div class="container mt-xl">' +
      '<h1 class="mb-md">Supply Chain Tracker</h1>' +
      '<p class="text-secondary mb-lg">Trace the full custody chain of any pharmaceutical product.</p>' +
      '<div class="card">' +
        '<div class="form-group">' +
          '<div style="display:flex;gap:8px">' +
            '<input type="text" id="track-input" class="form-input text-mono" placeholder="Serial number or GTIN" value="' + prefill + '">' +
            '<button class="btn btn-primary" onclick="BlockchainService.trackProduct()">Track</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="track-result" class="mt-lg"></div>' +
    '</div>';
  },

  dashboard: function() {
    var canRegister = currentRole === 'MANUFACTURER' || currentRole === 'ADMIN';
    var canRecall = currentRole === 'REGULATOR' || currentRole === 'ADMIN';

    // Role access banner for consumers
    var accessBanner = '';
    if (currentRole === 'CONSUMER') {
      accessBanner = '<div class="role-banner role-banner-consumer mb-lg">' +
        '<div class="role-banner-content">' +
          '<span class="role-banner-icon">👤</span>' +
          '<div><strong>Consumer Access</strong>' +
          '<p class="text-sm" style="margin:2px 0 0;opacity:0.85">You are viewing the public product registry. Connect a wallet with Manufacturer/Admin role for full access.</p></div>' +
        '</div>' +
        (!isConnected ? '<button class="btn btn-sm btn-soft" onclick="BlockchainService.connectWallet()">🔗 Connect Wallet</button>' : '') +
      '</div>';
    } else {
      var roleLabel = currentRole === 'ADMIN' ? '👑 Admin Access' : currentRole === 'MANUFACTURER' ? '🏭 Manufacturer Access' : '🏛️ ' + currentRole + ' Access';
      accessBanner = '<div class="role-banner role-banner-elevated mb-lg">' +
        '<div class="role-banner-content"><span class="role-banner-icon">✅</span>' +
        '<div><strong>' + roleLabel + '</strong>' +
        '<p class="text-sm" style="margin:2px 0 0;opacity:0.85">Full product registration, recall, and management features enabled.</p></div></div>' +
      '</div>';
    }

    // Build batch table from DEMO_DB
    var rows = '';
    var displayProducts = DEMO_DB.products.filter(function(p) { return p.exists !== false; }).slice(0, 50);
    displayProducts.forEach(function(p) {
      var statusPill = '<span class="pill pill-' + (p.status === 'GENUINE' ? 'success' : p.status === 'EXPIRED' ? 'warning' : 'danger') + '">' + p.status + '</span>';
      rows += '<tr class="batch-tr" data-name="' + p.productName.toLowerCase() + '" data-id="' + p.serialNumber.toLowerCase() + '">' +
        '<td class="text-mono text-sm">' + p.serialNumber + '</td>' +
        '<td>' + p.productName + '</td>' +
        '<td>' + p.manufacturer + '</td>' +
        '<td>' + statusPill + '</td>' +
        '<td>' + Utils.formatDate(p.expiryDate) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="navigate(\'/verify\');setTimeout(function(){document.getElementById(\'batch-input\').value=\'' + p.serialNumber + '\';UI.switchVerifyTab(\'manual\');BlockchainService.verifyProduct()},100)">Verify</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="UI.showQRModal(\'' + p.serialNumber + '\',\'' + p.gtin + '\')">QR</button></td>' +
      '</tr>';
    });

    var emptyMsg = displayProducts.length === 0 ? '<div class="empty-state" style="padding:40px 20px;text-align:center"><div style="font-size:48px;margin-bottom:12px">📦</div><p class="text-secondary">No products registered yet.</p>' + (canRegister ? '<button class="btn btn-primary mt-md" onclick="UI.showRegisterModal()">Register First Product</button>' : '<p class="text-sm text-muted mt-sm">Products will appear here once data loads or when connected to a node with registered products.</p>') + '</div>' : '';
    var registerBtn = canRegister ? '<button class="btn btn-primary" onclick="UI.showRegisterModal()">+ Register Product</button>' : '';
    var recallBtn = canRecall ? '<button class="btn btn-danger" onclick="UI.showRecallModal()">🚨 Issue Recall</button>' : '';

    return '<div class="dashboard-layout">' +
      '<aside class="sidebar">' +
        '<div class="sidebar-header"><h3>Dashboard</h3><span class="pill pill-accent">' + currentRole + '</span></div>' +
        '<nav class="sidebar-nav">' +
          '<a href="#/dashboard" class="active">📦 Products</a>' +
          '<a href="#/analytics">📊 Analytics</a>' +
          '<a href="#/recalls">🚨 Recalls</a>' +
          (currentRole === 'ADMIN' ? '<a href="#/admin">⚙️ Admin</a>' : '') +
        '</nav>' +
      '</aside>' +
      '<main class="dashboard-main">' +
        accessBanner +
        '<div class="dash-header mb-lg">' +
          '<h2>Product Registry</h2>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' + registerBtn + recallBtn + '</div>' +
        '</div>' +
        '<div class="card mb-md"><input type="text" id="batch-search" class="form-input" placeholder="Search by name or serial..." oninput="UI.filterBatches()"></div>' +
        (emptyMsg || '<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Serial</th><th>Product</th><th>Manufacturer</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead><tbody id="batch-table">' + rows + '</tbody></table></div></div>') +
      '</main>' +
    '</div>';
  },

  analytics: function() {
    var s = DEMO_DB.stats || {};
    var total = (s.genuine||0) + (s.expired||0) + (s.recalled||0) + (s.counterfeit||0) + (s.suspicious||0);
    var authRate = total > 0 ? Math.round(((s.genuine||0) / total) * 100) : 0;

    // Region distribution
    var regions = DEMO_DB.metadata.regions || {};

    return '<div class="dashboard-layout">' +
      '<aside class="sidebar">' +
        '<div class="sidebar-header"><h3>Dashboard</h3><span class="pill pill-accent">' + currentRole + '</span></div>' +
        '<nav class="sidebar-nav">' +
          '<a href="#/dashboard">📦 Products</a>' +
          '<a href="#/analytics" class="active">📊 Analytics</a>' +
          '<a href="#/recalls">🚨 Recalls</a>' +
          (currentRole === 'ADMIN' ? '<a href="#/admin">⚙️ Admin</a>' : '') +
        '</nav>' +
      '</aside>' +
      '<main class="dashboard-main">' +
        '<h2 class="mb-lg">Analytics</h2>' +
        '<div class="grid-4 mb-xl">' +
          '<div class="stat-card"><div class="stat-number">' + total + '</div><div class="stat-label">Total Products</div></div>' +
          '<div class="stat-card"><div class="stat-number" style="color:var(--c-success)">' + authRate + '%</div><div class="stat-label">Authentic Rate</div></div>' +
          '<div class="stat-card"><div class="stat-number" style="color:var(--c-warning)">' + (s.expired||0) + '</div><div class="stat-label">Expired</div></div>' +
          '<div class="stat-card"><div class="stat-number" style="color:var(--c-danger)">' + ((s.counterfeit||0)+(s.recalled||0)) + '</div><div class="stat-label">Flagged</div></div>' +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="card"><h3 class="mb-md">Status Distribution</h3>' +
            '<div class="chart-bars">' +
              '<div class="chart-bar-row"><span class="chart-label">Genuine</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((s.genuine||0)/total*100):0) + '%;background:var(--c-success)"></div></div><span class="chart-val">' + (s.genuine||0) + '</span></div>' +
              '<div class="chart-bar-row"><span class="chart-label">Expired</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((s.expired||0)/total*100):0) + '%;background:var(--c-warning)"></div></div><span class="chart-val">' + (s.expired||0) + '</span></div>' +
              '<div class="chart-bar-row"><span class="chart-label">Recalled</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((s.recalled||0)/total*100):0) + '%;background:var(--c-danger)"></div></div><span class="chart-val">' + (s.recalled||0) + '</span></div>' +
              '<div class="chart-bar-row"><span class="chart-label">Counterfeit</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((s.counterfeit||0)/total*100):0) + '%;background:#DC2626"></div></div><span class="chart-val">' + (s.counterfeit||0) + '</span></div>' +
              '<div class="chart-bar-row"><span class="chart-label">Suspicious</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((s.suspicious||0)/total*100):0) + '%;background:#F97316"></div></div><span class="chart-val">' + (s.suspicious||0) + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="card"><h3 class="mb-md">Regional Coverage</h3>' +
            '<div class="chart-bars">' +
              '<div class="chart-bar-row"><span class="chart-label">🇺🇸 US (FDA)</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((regions.US||0)/total*100):0) + '%;background:var(--c-accent)"></div></div><span class="chart-val">' + (regions.US||0) + '</span></div>' +
              '<div class="chart-bar-row"><span class="chart-label">🇰🇪 Kenya</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((regions.KE||0)/total*100):0) + '%;background:var(--c-success)"></div></div><span class="chart-val">' + (regions.KE||0) + '</span></div>' +
              '<div class="chart-bar-row"><span class="chart-label">🇪🇺 EU (EMA)</span><div class="chart-track"><div class="chart-fill" style="width:' + (total?Math.round((regions.EU||0)/total*100):0) + '%;background:var(--c-purple)"></div></div><span class="chart-val">' + (regions.EU||0) + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</main>' +
    '</div>';
  },

  recalls: function() {
    var rows = '';
    (DEMO_DB.recalledLots || []).forEach(function(r) {
      rows += '<tr><td class="text-mono">' + r.lotNumber + '</td><td>' + r.reason + '</td><td>' + (r.date || '—') + '</td></tr>';
    });
    // Also list recalled products
    var recProducts = DEMO_DB.products.filter(function(p) { return p.isRecalled; }).slice(0, 20);
    var prodRows = '';
    recProducts.forEach(function(p) {
      prodRows += '<tr><td class="text-mono">' + p.serialNumber + '</td><td>' + p.productName + '</td><td>' + p.manufacturer + '</td><td>' + p.lotNumber + '</td><td>' + (p.recallReason || '—') + '</td></tr>';
    });

    return '<div class="dashboard-layout">' +
      '<aside class="sidebar">' +
        '<div class="sidebar-header"><h3>Dashboard</h3><span class="pill pill-accent">' + currentRole + '</span></div>' +
        '<nav class="sidebar-nav">' +
          '<a href="#/dashboard">📦 Products</a>' +
          '<a href="#/analytics">📊 Analytics</a>' +
          '<a href="#/recalls" class="active">🚨 Recalls</a>' +
          (currentRole === 'ADMIN' ? '<a href="#/admin">⚙️ Admin</a>' : '') +
        '</nav>' +
      '</aside>' +
      '<main class="dashboard-main">' +
        '<h2 class="mb-lg">⚠️ Active Recalls</h2>' +
        '<div class="card mb-lg"><h3 class="mb-md">Recalled Lots</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Lot</th><th>Reason</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        '<div class="card"><h3 class="mb-md">Affected Products</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Serial</th><th>Product</th><th>Manufacturer</th><th>Lot</th><th>Reason</th></tr></thead><tbody>' + prodRows + '</tbody></table></div></div>' +
      '</main>' +
    '</div>';
  },

  admin: function() {
    if (currentRole !== 'ADMIN') {
      return '<div class="container mt-xl"><div class="card text-center"><div class="empty-icon">🔒</div><p>Admin access required. Connect with the contract deployer wallet.</p></div></div>';
    }
    return '<div class="dashboard-layout">' +
      '<aside class="sidebar">' +
        '<div class="sidebar-header"><h3>Dashboard</h3><span class="pill pill-accent">ADMIN</span></div>' +
        '<nav class="sidebar-nav">' +
          '<a href="#/dashboard">📦 Products</a>' +
          '<a href="#/analytics">📊 Analytics</a>' +
          '<a href="#/recalls">🚨 Recalls</a>' +
          '<a href="#/admin" class="active">⚙️ Admin</a>' +
        '</nav>' +
      '</aside>' +
      '<main class="dashboard-main">' +
        '<h2 class="mb-lg">Admin Panel</h2>' +
        '<div class="grid-2 mb-lg">' +
          '<div class="card"><h3 class="mb-md">Grant Role</h3>' +
            '<div class="form-group mb-md"><label class="form-label">Wallet Address</label><input type="text" id="admin-addr" class="form-input text-mono" placeholder="0x..."></div>' +
            '<div class="form-group mb-md"><label class="form-label">Role</label><select id="admin-role" class="form-input"><option value="MANUFACTURER_ROLE">Manufacturer</option><option value="DISTRIBUTOR_ROLE">Distributor</option><option value="PHARMACY_ROLE">Pharmacy</option><option value="REGULATOR_ROLE">Regulator</option></select></div>' +
            '<button class="btn btn-primary w-full" onclick="BlockchainService.grantRole()">Grant Role</button>' +
          '</div>' +
          '<div class="card"><h3 class="mb-md">System Status</h3>' +
            '<div class="detail-item mb-sm"><span class="detail-label">Mode</span><span class="detail-value">' + (demoMode ? 'Demo' : 'Live Blockchain') + '</span></div>' +
            '<div class="detail-item mb-sm"><span class="detail-label">Products</span><span class="detail-value">' + DEMO_DB.products.length + '</span></div>' +
            '<div class="detail-item mb-sm"><span class="detail-label">Connected</span><span class="detail-value">' + (isConnected ? 'Yes' : 'No') + '</span></div>' +
            '<div class="detail-item mb-sm"><span class="detail-label">Contract</span><span class="detail-value text-mono">' + Utils.shortAddr(contractAddress || DEFAULT_CONTRACT_ADDRESS) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</main>' +
    '</div>';
  }
};

// ============================================================
//                    UI CONTROLLER
// ============================================================

var UI = {
  html5Qrcode: null,
  scannerActive: false,

  render: function(fn) { document.getElementById('app').innerHTML = fn(); },
  renderWith: function(fn, a, b, c) {
    document.getElementById('app').innerHTML = fn(a, b, c);
    if (fn === Renderers.result && a && a.supplyChain) {
      BlockchainService.renderSupplyChainTimeline(a.supplyChain);
    }
  },

  switchVerifyTab: function(tabId) {
    document.querySelectorAll('.verify-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var panel = document.getElementById('verify-' + tabId);
    var btn = document.getElementById('tab-' + tabId);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
    if (tabId === 'scan') UI.startScanner();
    else UI.stopScanner();
  },

  startScanner: function() {
    if (UI.scannerActive) return;
    var el = document.getElementById('qr-reader');
    if (!el) return;
    if (!UI.html5Qrcode) {
      UI.html5Qrcode = new Html5Qrcode("qr-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      });
    }
    UI.html5Qrcode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      function(decodedText, result) {
        UI.stopScanner();
        UI.handleScanResult(decodedText, result);
      },
      function() {}
    ).then(function() {
      UI.scannerActive = true;
      var startBtn = document.getElementById('btn-start-scan');
      var stopBtn = document.getElementById('btn-stop-scan');
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = '';
    }).catch(function(err) {
      console.log('Scanner start error:', err);
      Utils.showToast('Could not access camera: ' + err, 'error');
    });
  },

  stopScanner: function() {
    if (UI.html5Qrcode && UI.scannerActive) {
      UI.html5Qrcode.stop().then(function() {
        UI.scannerActive = false;
        var startBtn = document.getElementById('btn-start-scan');
        var stopBtn = document.getElementById('btn-stop-scan');
        if (startBtn) startBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
      }).catch(function() { UI.scannerActive = false; });
    }
  },

  handleScanResult: function(decodedText, result) {
    var query = decodedText.trim();
    var formatName = result && result.result && result.result.format ? result.result.format.formatName : 'Unknown';
    Utils.showToast('Scanned (' + formatName + '): ' + query, 'success');

    // Parse based on format
    if (query.startsWith('DawaTrace:')) {
      query = query.replace('DawaTrace:', '');
    } else if (query.startsWith(']d2') || query.match(/^01\d{14}/)) {
      var gs1 = Utils.parseGS1(query);
      if (gs1.serial) query = gs1.serial;
      else if (gs1.gtin) query = gs1.gtin;
    }

    document.getElementById('app').innerHTML = Renderers.verify();
    UI.switchVerifyTab('manual');
    document.getElementById('batch-input').value = query;
    BlockchainService.verifyProduct();
  },

  scanUploadedImage: function(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    var file = e.target.files[0];
    if (!UI.html5Qrcode) {
      UI.html5Qrcode = new Html5Qrcode("qr-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A
        ]
      });
    }
    Utils.showToast('Analyzing image...', 'info');
    UI.html5Qrcode.scanFile(file, true)
      .then(function(decodedText) {
        var query = decodedText.trim();
        if (query.startsWith('DawaTrace:')) query = query.replace('DawaTrace:', '');
        UI.switchVerifyTab('manual');
        document.getElementById('batch-input').value = query;
        BlockchainService.verifyProduct();
        Utils.showToast('Image decoded: ' + query, 'success');
      })
      .catch(function(err) {
        console.log('Image scan err:', err);
        Utils.showToast('Could not find a valid code in the image', 'error');
      });
    e.target.value = '';
  },

  mockSMSVerify: function() {
    var input = document.getElementById('sms-input');
    var query = input ? input.value.trim() : '';
    if (!query) { Utils.showToast('Enter a serial number', 'error'); return; }

    var respEl = document.getElementById('sms-response');
    respEl.innerHTML = '<p style="color:var(--c-text-secondary)">📡 Sending VERIFY ' + query + '...</p>';

    setTimeout(function() {
      var product = DEMO_DB.products.find(function(p) {
        return p.serialNumber === query || p.gtin === query;
      });

      var msg;
      if (product && product.exists !== false) {
        var r = RiskEngine.score(product);
        msg = 'DawaTrace SMS Reply:\n\n' +
          'Product: ' + product.productName + '\n' +
          'Status: ' + r.status + '\n' +
          'Trust: ' + r.trust + '/100\n' +
          'Mfg: ' + product.manufacturer + '\n' +
          'Exp: ' + Utils.formatDate(product.expiryDate) + '\n\n' +
          (r.status === 'GENUINE' ? '✅ This medicine appears authentic.' : '⚠️ WARNING: ' + r.signals[0]);
      } else {
        msg = 'DawaTrace SMS Reply:\n\n' +
          '❌ ALERT: Serial "' + query + '" NOT FOUND\n' +
          'This product is not registered in our system.\n' +
          'Do NOT use this medicine.\n' +
          'Report to PPB: 0800 720 720';
      }
      respEl.innerHTML = '<pre style="white-space:pre-wrap;font-size:12px;color:var(--c-text)">' + msg + '</pre>';
    }, 1500);
  },

  showRegisterModal: function() {
    var html = '<div class="modal-header"><h3>Register New Product</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<div class="form-group mb-md"><label class="form-label">Product Name</label><input type="text" id="reg-name" class="form-input" placeholder="e.g. Amoxicillin 500mg Capsule"></div>' +
      '<div class="form-group mb-md"><label class="form-label">GTIN</label><input type="text" id="reg-gtin" class="form-input text-mono" placeholder="e.g. 00312345678906"></div>' +
      '<div class="form-group mb-md"><label class="form-label">Serial Number</label><input type="text" id="reg-serial" class="form-input text-mono" placeholder="e.g. SN-ABC12345"></div>' +
      '<div class="form-group mb-md"><label class="form-label">Lot Number</label><input type="text" id="reg-lot" class="form-input text-mono" placeholder="e.g. LOT2026A01"></div>' +
      '<div class="form-group mb-lg"><label class="form-label">Expiry Date</label><input type="date" id="reg-exp" class="form-input"></div>' +
      '<button class="btn btn-primary w-full btn-lg" onclick="BlockchainService.registerProduct()">Register On-Chain</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  showRecallModal: function() {
    var html = '<div class="modal-header"><h3>🚨 Issue Recall</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<div class="form-group mb-md"><label class="form-label">Lot Number</label><input type="text" id="recall-lot" class="form-input text-mono" placeholder="e.g. LOT2025X09"></div>' +
      '<div class="form-group mb-lg"><label class="form-label">Reason</label><input type="text" id="recall-reason" class="form-input" placeholder="e.g. Failed dissolution testing"></div>' +
      '<button class="btn btn-danger w-full btn-lg" onclick="BlockchainService.recallLot()">Issue Recall</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  showTransferModal: function(serialNumber) {
    var html = '<div class="modal-header"><h3>Transfer Custody</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<p class="text-sm mb-md">Serial: <span class="text-mono">' + serialNumber + '</span></p>' +
      '<div class="form-group mb-md"><label class="form-label">Recipient Address</label><input type="text" id="trans-to" class="form-input text-mono" placeholder="0x..."></div>' +
      '<div class="form-group mb-md"><label class="form-label">Location</label><input type="text" id="trans-loc" class="form-input" placeholder="e.g. Nairobi Central Hub"></div>' +
      '<div class="form-group mb-lg"><label class="form-label">Event Type</label><select id="trans-event" class="form-input"><option value="shipped">Shipped</option><option value="received">Received</option><option value="dispensed">Dispensed</option></select></div>' +
      '<button class="btn btn-primary w-full btn-lg" onclick="BlockchainService.transferCustody(\'' + serialNumber + '\')">Record Transfer</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  showQRModal: function(serial, gtin) {
    var payload = 'DawaTrace:' + serial;
    var html = '<div class="modal-header"><h3>Product QR Code</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>' +
      '<div class="qr-display mb-md text-center">' +
        '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(payload) + '" alt="QR" style="border-radius:8px">' +
        '<div class="text-mono text-sm mt-sm">' + serial + '</div>' +
        (gtin ? '<div class="text-xs text-secondary">GTIN: ' + gtin + '</div>' : '') +
      '</div>' +
      '<p style="text-align:center" class="text-sm text-secondary mb-md">Print this QR on packaging for consumer verification.</p>';
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

  reportCounterfeit: function(query) {
    Utils.showToast('🚨 Reporting counterfeit to authorities...', 'warning');
    setTimeout(function() {
      Utils.showToast('Counterfeit report logged for ' + query, 'success');
    }, 1000);
  }
};

// ============================================================
//                  BLOCKCHAIN SERVICE
// ============================================================

var BlockchainService = {
  updateWalletUI: function() {
    var btn = document.getElementById('wallet-btn');
    var banner = document.getElementById('demo-banner');
    var netPill = document.getElementById('network-status');
    if (banner) banner.style.display = 'none';
    if (netPill) netPill.textContent = demoMode ? 'Demo Mode' : 'Live';

    // Role-aware wallet button
    if (btn) {
      if (!isConnected) {
        btn.className = 'btn btn-sm wallet-btn wallet-disconnected';
        btn.innerHTML = '<span class="wallet-icon">🔗</span><span class="wallet-label">Connect Wallet</span>';
      } else {
        var roleColors = { ADMIN: '#7C3AED', MANUFACTURER: '#06B6D4', REGULATOR: '#F59E0B', DISTRIBUTOR: '#10B981', PHARMACY: '#3B82F6', CONSUMER: '#64748B' };
        var roleIcons = { ADMIN: '👑', MANUFACTURER: '🏭', REGULATOR: '🏛️', DISTRIBUTOR: '🚚', PHARMACY: '💊', CONSUMER: '👤' };
        var rc = roleColors[currentRole] || '#64748B';
        var ri = roleIcons[currentRole] || '👤';
        btn.className = 'btn btn-sm wallet-btn wallet-connected';
        btn.innerHTML = '<span class="wallet-role-dot" style="background:' + rc + '"></span>' +
          '<span class="wallet-label">' + ri + ' ' + currentRole + '</span>';
      }
    }

    // Update bottom nav role indicator
    var bnDash = document.getElementById('bn-dashboard');
    if (bnDash && isConnected && currentRole !== 'CONSUMER') {
      bnDash.querySelector('.bn-icon').textContent = currentRole === 'ADMIN' ? '👑' : '📊';
    }
  },

  connectWallet: async function() {
    if (isConnected) {
      isConnected = false; demoMode = true; contract = null; signer = null; provider = null;
      currentRole = 'CONSUMER';
      Utils.showToast('Wallet disconnected', 'success');
      BlockchainService.updateWalletUI();
      routerHandler();
      return;
    }
    if (!window.ethereum) {
      for (var i = 0; i < 30; i++) { await Utils.delay(100); if (window.ethereum) break; }
    }
    if (!window.ethereum) { Utils.showToast('No Web3 wallet detected. Install MetaMask or use a wallet browser.', 'warning'); return; }

    try {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HARDHAT_CHAIN_ID }] });
      } catch(sw) {
        if (sw.code === 4902) {
          try { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: HARDHAT_CHAIN_ID, chainName: 'Hardhat Local', rpcUrls: ['http://127.0.0.1:8545'], nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 } }] }); } catch(a) {}
        }
      }
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      signer = await provider.getSigner();
      var address = await signer.getAddress();

      if (!contractAddress) {
        try { var res = await fetch('deployment.json'); if (res.ok) { var info = await res.json(); contractAddress = info.contractAddress; } } catch(e) {}
        if (!contractAddress) try { var res2 = await fetch('../deployment.json'); if (res2.ok) { var info2 = await res2.json(); contractAddress = info2.contractAddress; } } catch(e2) {}
      }
      if (!contractAddress) contractAddress = DEFAULT_CONTRACT_ADDRESS;

      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      isConnected = true; demoMode = false;

      // Detect role
      try {
        currentRole = await contract.getParticipantRole(address);
      } catch(e) { currentRole = 'CONSUMER'; }

      Utils.showToast('Connected: ' + Utils.shortAddr(address) + ' (' + currentRole + ')', 'success');
      BlockchainService.updateWalletUI();
      routerHandler();
      window.ethereum.on('accountsChanged', function() { window.location.reload(); });
    } catch(err) {
      console.error('Connection error:', err);
      Utils.showToast('Connection failed: ' + (err.reason || err.message || 'Unknown'), 'error');
    }
  },

  verifyProduct: async function() {
    var input = document.getElementById('batch-input');
    var query = input ? input.value.trim() : '';
    if (!query) { Utils.showToast('Please enter a serial number or GTIN', 'error'); return; }

    document.getElementById('app').innerHTML = '<div class="verify-spinner container"><div class="spinner-ring"></div><h3>Analyzing product...</h3><p class="text-secondary text-mono">' + query + '</p></div>';
    await Utils.delay(800);

    // --- DEMO MODE ---
    if (demoMode) {
      // Search by serial, then GTIN, then product name
      var product = DEMO_DB.products.find(function(p) {
        return p.serialNumber === query || p.gtin === query || p.productName.toLowerCase().includes(query.toLowerCase());
      });

      if (product) {
        var riskResult = RiskEngine.score({
          exists: product.exists !== false,
          isRecalled: product.isRecalled,
          isExpired: product.expiryDate < (Date.now() / 1000),
          scanCount: product.scanCount || 0,
          custodyCount: product.supplyChain ? product.supplyChain.length : 0,
          recallReason: product.recallReason,
          expiryDate: product.expiryDate,
          productName: product.productName,
          manufacturer: product.manufacturer,
          gtin: product.gtin,
          serialNumber: product.serialNumber,
          lotNumber: product.lotNumber,
          manufactureDate: product.manufactureDate,
          supplyChain: product.supplyChain
        });
        UI.renderWith(Renderers.result, product, query, riskResult);
        return;
      }

      // --- GLOBAL HOT LOOKUP: Multi-source cascade ---
      Utils.showToast('Not in local database — searching global pharmaceutical registries...', 'info');
      try {
        var globalResult = await GlobalLookup.lookup(query);
        if (globalResult && globalResult.found) {
          var untracked = {
            exists: true,
            productName: globalResult.productName || 'Unknown Product',
            manufacturer: globalResult.manufacturer || '—',
            gtin: /^\d{8,14}$/.test(query) ? query : '—',
            serialNumber: '—',
            lotNumber: '—',
            manufactureDate: 0,
            expiryDate: 0,
            custodyCount: 0,
            isRecalled: false,
            isExpired: false,
            scanCount: 0,
            source: globalResult.source,
            country: globalResult.country,
            flag: globalResult.flag,
            genericName: globalResult.genericName,
            dosageForm: globalResult.dosageForm,
            regulatoryBody: globalResult.regulatoryBody,
            ndc: globalResult.ndc
          };
          var untrackedRisk = RiskEngine.scoreUntracked(globalResult);
          UI.renderWith(Renderers.result, untracked, query, untrackedRisk);
          return;
        }
      } catch(e) { console.log('Global lookup error:', e); }

      // Not found anywhere
      var fakeData = { exists: false };
      var fakeRisk = RiskEngine.score(fakeData);
      UI.renderWith(Renderers.result, fakeData, query, fakeRisk);
      return;
    }

    // --- LIVE MODE ---
    try {
      var productId = ethers.id(query);
      var result = await contract.verifyProductView(productId);
      var liveProduct = {
        exists: result.exists,
        isAuthentic: result.isAuthentic,
        isExpired: result.isExpired,
        isRecalled: result.isRecalled,
        productName: result.productName,
        gtin: result.gtin,
        serialNumber: result.serialNumber,
        lotNumber: result.lotNumber,
        manufacturer: result.manufacturer,
        manufactureDate: result.manufactureDate,
        expiryDate: result.expiryDate,
        custodyCount: result.custodyCount,
        scanCount: result.scanCount,
        recallReason: result.recallReason,
        status: result.status
      };
      var liveRisk = RiskEngine.score(liveProduct);
      UI.renderWith(Renderers.result, liveProduct, query, liveRisk);

      // Load live custody chain
      try {
        var chain = await contract.getCustodyChain(productId);
        BlockchainService.renderLiveCustodyTimeline(chain);
      } catch(ce) { console.log('Custody chain error:', ce); }
    } catch(err) {
      console.error('Verification error:', err);
      var errData = { exists: false };
      var errRisk = RiskEngine.score(errData);
      UI.renderWith(Renderers.result, errData, query, errRisk);
    }
  },

  renderSupplyChainTimeline: function(chain) {
    var el = document.getElementById('result-timeline');
    if (!el || !chain || chain.length === 0) return;

    var eventIcons = { manufactured: '🏭', imported: '🚢', shipped: '🚚', received: '📦', dispensed: '💊', verified: '✅' };
    var html = '<h3 class="mb-md">Supply Chain Timeline</h3><div class="timeline">';
    chain.forEach(function(evt, i) {
      var icon = eventIcons[evt.eventType] || '📍';
      var dotClass = i === chain.length - 1 ? 'active' : '';
      html += '<div class="timeline-item">' +
        '<div class="timeline-marker"><div class="timeline-dot ' + dotClass + '"></div><div class="timeline-line"></div></div>' +
        '<div class="timeline-content">' +
          '<h4>' + icon + ' ' + (evt.eventType || '').charAt(0).toUpperCase() + (evt.eventType || '').slice(1) + '</h4>' +
          '<p class="text-sm text-secondary">' + evt.location + '</p>' +
          '<p class="text-xs text-muted">' + Utils.formatDate(evt.timestamp) + '</p>' +
        '</div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  },

  renderLiveCustodyTimeline: function(chain) {
    var el = document.getElementById('result-timeline');
    if (!el || !chain || chain.length === 0) return;
    var eventIcons = { manufactured: '🏭', shipped: '🚚', received: '📦', dispensed: '💊' };
    var html = '<h3 class="mb-md">Supply Chain Timeline (On-Chain)</h3><div class="timeline">';
    for (var i = 0; i < chain.length; i++) {
      var rec = chain[i];
      var icon = eventIcons[rec.eventType] || '📍';
      var dotClass = i === chain.length - 1 ? 'active' : '';
      html += '<div class="timeline-item">' +
        '<div class="timeline-marker"><div class="timeline-dot ' + dotClass + '"></div><div class="timeline-line"></div></div>' +
        '<div class="timeline-content">' +
          '<h4>' + icon + ' ' + (rec.eventType || '').charAt(0).toUpperCase() + (rec.eventType || '').slice(1) + '</h4>' +
          '<p class="text-sm text-secondary">' + rec.location + '</p>' +
          '<p class="text-xs text-muted">' + Utils.formatDate(rec.timestamp) + ' · ' + Utils.shortAddr(rec.to) + '</p>' +
        '</div></div>';
    }
    html += '</div>';
    el.innerHTML = html;
  },

  trackProduct: async function() {
    var input = document.getElementById('track-input');
    var query = input ? input.value.trim() : '';
    if (!query) { Utils.showToast('Enter a serial or GTIN', 'error'); return; }

    var resultEl = document.getElementById('track-result');
    resultEl.innerHTML = '<div class="card"><div class="empty-state"><div class="spinner-ring" style="width:32px;height:32px;margin:0 auto"></div><p class="mt-md">Tracing supply chain...</p></div></div>';
    await Utils.delay(600);

    if (demoMode) {
      var product = DEMO_DB.products.find(function(p) { return p.serialNumber === query || p.gtin === query; });
      if (!product || !product.supplyChain) {
        resultEl.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>Product not found — cannot trace.</p></div></div>';
        return;
      }
      var eventIcons = { manufactured: '🏭', imported: '🚢', shipped: '🚚', received: '📦', dispensed: '💊' };
      var html = '<div class="card"><h3 class="mb-md">' + product.productName + '</h3><p class="text-sm text-secondary mb-lg">' + product.manufacturer + ' · ' + product.serialNumber + '</p><div class="timeline">';
      product.supplyChain.forEach(function(evt, i) {
        var icon = eventIcons[evt.eventType] || '📍';
        var dotClass = i === product.supplyChain.length - 1 ? 'active' : '';
        html += '<div class="timeline-item"><div class="timeline-marker"><div class="timeline-dot ' + dotClass + '"></div><div class="timeline-line"></div></div><div class="timeline-content"><h4>' + icon + ' ' + (evt.eventType||'').charAt(0).toUpperCase() + (evt.eventType||'').slice(1) + '</h4><p class="text-sm text-secondary">' + evt.location + '</p><p class="text-xs text-muted">' + Utils.formatDate(evt.timestamp) + '</p></div></div>';
      });
      html += '</div></div>';
      resultEl.innerHTML = html;
    } else {
      try {
        var productId = ethers.id(query);
        var liveChain = await contract.getCustodyChain(productId);
        if (liveChain.length === 0) {
          resultEl.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>No custody records found on blockchain.</p></div></div>';
          return;
        }
        var liveHtml = '<div class="card"><h3 class="mb-md">On-Chain Supply Chain</h3><div class="timeline">';
        for (var i = 0; i < liveChain.length; i++) {
          var r = liveChain[i];
          liveHtml += '<div class="timeline-item"><div class="timeline-marker"><div class="timeline-dot ' + (i === liveChain.length-1 ? 'active' : '') + '"></div><div class="timeline-line"></div></div><div class="timeline-content"><h4>' + r.eventType + '</h4><p class="text-sm text-secondary">' + r.location + '</p><p class="text-xs text-muted">' + Utils.formatDate(r.timestamp) + '</p></div></div>';
        }
        liveHtml += '</div></div>';
        resultEl.innerHTML = liveHtml;
      } catch(e) {
        resultEl.innerHTML = '<div class="card"><div class="empty-state"><p>Error loading custody chain.</p></div></div>';
      }
    }
  },

  registerProduct: async function() {
    var name = document.getElementById('reg-name').value;
    var gtin = document.getElementById('reg-gtin').value;
    var serial = document.getElementById('reg-serial').value;
    var lot = document.getElementById('reg-lot').value;
    var exp = document.getElementById('reg-exp').value;
    if (!name || !gtin || !serial || !lot || !exp) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();

    if (!demoMode && contract) {
      try {
        Utils.showToast('Submitting to blockchain...', 'info');
        var expTs = Math.floor(new Date(exp).getTime() / 1000);
        var tx = await contract.registerProduct(gtin, serial, lot, name, expTs);
        await tx.wait();
        Utils.showToast('Product registered on-chain!', 'success');
        navigate('/dashboard');
      } catch(e) {
        console.error(e);
        Utils.showToast('Transaction failed: ' + (e.reason || e.message), 'error');
      }
    } else {
      Utils.showToast('Registering in demo mode...', 'info');
      await Utils.delay(800);
      DEMO_DB.products.unshift({
        productId: '0x' + Date.now().toString(16),
        gtin: gtin, serialNumber: serial, lotNumber: lot,
        productName: name, genericName: name, manufacturer: 'Demo Manufacturer',
        dosageForm: 'TABLET', route: 'ORAL', region: 'KE',
        manufactureDate: Math.floor(Date.now()/1000),
        expiryDate: Math.floor(new Date(exp).getTime()/1000),
        status: 'GENUINE', exists: true, isRecalled: false, recallReason: '',
        supplyChain: [{ eventType: 'manufactured', location: 'Demo Facility', timestamp: Math.floor(Date.now()/1000) }]
      });
      Utils.showToast('Product registered (demo)', 'success');
      navigate('/dashboard');
    }
  },

  transferCustody: async function(serial) {
    var to = document.getElementById('trans-to').value;
    var loc = document.getElementById('trans-loc').value;
    var evt = document.getElementById('trans-event').value;
    if (!to || !loc) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();

    if (!demoMode && contract) {
      try {
        var productId = ethers.id(serial);
        var tx = await contract.transferCustody(productId, to, loc, evt);
        await tx.wait();
        Utils.showToast('Custody transferred on-chain!', 'success');
      } catch(e) {
        Utils.showToast('Transfer failed: ' + (e.reason || e.message), 'error');
      }
    } else {
      Utils.showToast('Transfer recorded (demo)', 'success');
    }
    navigate('/dashboard');
  },

  recallLot: async function() {
    var lot = document.getElementById('recall-lot').value;
    var reason = document.getElementById('recall-reason').value;
    if (!lot || !reason) { Utils.showToast('All fields required', 'error'); return; }
    UI.hideModal();

    if (!demoMode && contract) {
      try {
        var tx = await contract.recallLot(lot, reason);
        await tx.wait();
        Utils.showToast('Lot recalled on-chain!', 'success');
      } catch(e) {
        Utils.showToast('Recall failed: ' + (e.reason || e.message), 'error');
      }
    } else {
      DEMO_DB.recalledLots.push({ lotNumber: lot, reason: reason, date: new Date().toISOString().split('T')[0] });
      DEMO_DB.products.forEach(function(p) {
        if (p.lotNumber === lot) { p.isRecalled = true; p.recallReason = reason; p.status = 'RECALLED'; }
      });
      Utils.showToast('Lot ' + lot + ' recalled (demo)', 'success');
    }
    navigate('/recalls');
  },

  grantRole: async function() {
    var addr = document.getElementById('admin-addr').value;
    var roleName = document.getElementById('admin-role').value;
    if (!addr) { Utils.showToast('Address required', 'error'); return; }

    if (!demoMode && contract) {
      try {
        var roleHash = ethers.keccak256(ethers.toUtf8Bytes(roleName));
        var tx = await contract.grantRole(roleHash, addr);
        await tx.wait();
        Utils.showToast('Role granted on-chain!', 'success');
      } catch(e) {
        Utils.showToast('Grant failed: ' + (e.reason || e.message), 'error');
      }
    } else {
      Utils.showToast('Role granted (demo): ' + roleName + ' → ' + Utils.shortAddr(addr), 'success');
    }
  }
};

// ============================================================
//                    ROUTER & INIT
// ============================================================

function routerHandler() {
  var path = window.location.hash.slice(1) || '/';
  var cleanPath = path.split('?')[0];

  // Sync top nav
  document.querySelectorAll('#topbar-nav a').forEach(function(a) {
    a.classList.toggle('active', a.dataset.route === cleanPath);
  });

  // Sync bottom nav
  var bnMap = { '/': 'bn-home', '/verify': 'bn-verify', '/track': 'bn-track', '/dashboard': 'bn-dashboard' };
  document.querySelectorAll('.bottom-nav-item').forEach(function(btn) {
    btn.classList.remove('active');
  });
  if (bnMap[cleanPath]) {
    var el = document.getElementById(bnMap[cleanPath]);
    if (el) el.classList.add('active');
  }

  switch (cleanPath) {
    case '/': UI.render(Renderers.landing); break;
    case '/verify': UI.render(Renderers.verify); break;
    case '/track': UI.render(Renderers.track); break;
    case '/dashboard': UI.render(Renderers.dashboard); break;
    case '/analytics': UI.render(Renderers.analytics); break;
    case '/recalls': UI.render(Renderers.recalls); break;
    case '/admin': UI.render(Renderers.admin); break;
    default: UI.render(Renderers.landing);
  }

  // Init table swipe hints after render
  setTimeout(initTableSwipeHints, 100);
}

// Add swipe-hint "← Swipe to see more →" and can-scroll class to overflowing tables
function initTableSwipeHints() {
  document.querySelectorAll('.table-wrap').forEach(function(wrap) {
    if (wrap.scrollWidth > wrap.clientWidth) {
      wrap.classList.add('can-scroll');
      if (!wrap.previousElementSibling || !wrap.previousElementSibling.classList.contains('table-swipe-hint')) {
        var hint = document.createElement('p');
        hint.className = 'table-swipe-hint';
        hint.textContent = '← swipe to see more →';
        wrap.parentNode.insertBefore(hint, wrap);
      }
    }
  });
}


window.addEventListener('hashchange', routerHandler);

document.addEventListener('DOMContentLoaded', async function() {
  // Load dataset — try relative path first, then absolute, with content-type validation
  async function loadProducts(url) {
    var res = await fetch(url);
    if (!res.ok) return null;
    var ct = res.headers.get('content-type') || '';
    if (ct.indexOf('json') === -1 && ct.indexOf('octet') === -1) {
      console.warn('Dataset fetch returned non-JSON content-type:', ct, 'from', url);
      return null;
    }
    return await res.json();
  }

  try {
    var data = await loadProducts('data/products.json');
    if (!data) data = await loadProducts('/data/products.json');
    if (!data) data = await loadProducts('./data/products.json');
    if (data && data.products) {
      DEMO_DB = data;
      dataLoaded = true;
      console.log('Dataset loaded:', data.products.length, 'products');
    } else {
      console.warn('Dataset: no valid product data found');
    }
  } catch(e) { console.error('Dataset load error:', e); }

  // Load contract address
  try {
    var dRes = await fetch('deployment.json');
    if (dRes.ok) { var dInfo = await dRes.json(); contractAddress = dInfo.contractAddress; }
  } catch(e) {}
  if (!contractAddress) try {
    var dRes2 = await fetch('../deployment.json');
    if (dRes2.ok) { var dInfo2 = await dRes2.json(); contractAddress = dInfo2.contractAddress; }
  } catch(e2) {}

  BlockchainService.updateWalletUI();
  routerHandler();
  // Dismiss splash screen
  window.dispatchEvent(new CustomEvent('dawatraceReady'));

  // Auto-connect if wallet already authorized
  if (window.ethereum) {
    try {
      var accts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accts && accts.length > 0) BlockchainService.connectWallet();
    } catch(e) {}
  }
});
