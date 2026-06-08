#!/usr/bin/env node
// ========================================================================
//  GS1 EXTENDED TEST SUITE v2 — 200+ Tests with Realistic Data
// ========================================================================

var passed = 0, failed = 0, total = 0;
function assert(name, actual, expected) {
  total++;
  if (JSON.stringify(actual) === JSON.stringify(expected)) { passed++; }
  else { failed++; console.log('  ❌ ' + name); console.log('     Exp:', JSON.stringify(expected)); console.log('     Got:', JSON.stringify(actual)); }
}
function assertTrue(name, val) { total++; if (val) passed++; else { failed++; console.log('  ❌ ' + name); } }
function assertFalse(name, val) { total++; if (!val) passed++; else { failed++; console.log('  ❌ ' + name); } }

function gs1CheckDigit(digits) {
  var s = String(digits).padStart(13, '0');
  var sum = 0;
  for (var i = 0; i < 13; i++) sum += parseInt(s[i]) * (i % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10;
}

// ---- Parser functions (exact copy from app.js) ----
var Utils = {
  parseGS1: function(raw) {
    var data = raw.trim();
    data = data.replace(/^\](?:d[0-2]|C[01]|e[0-4]|Q[0-6])/, '');
    var AI_LEN = {'00':18,'01':14,'02':14,'10':-1,'11':6,'12':6,'13':6,'15':6,'17':6,'20':2,'21':-1,'22':-1,'30':-1,'37':-1,'240':-1,'241':-1,'242':-1,'250':-1,'251':-1,'253':-1,'254':-1,'255':-1,'310':6,'311':6,'320':6,'321':6,'400':-1,'410':13,'411':13,'412':13,'414':13,'710':-1,'711':-1,'712':-1,'713':-1,'714':-1};
    var AI_KEY = {'01':'gtin','02':'content','10':'lot','11':'prodDate','13':'packDate','15':'bestBefore','17':'expiry','21':'serial','30':'count','37':'units','240':'additionalId','710':'nhrn','711':'nhrn','712':'nhrn','713':'nhrn','714':'nhrn'};
    var result = {};
    if (/\(\d{2,4}\)/.test(data)) {
      var hri = /\((\d{2,4})\)([^(]*)/g, hm;
      while ((hm = hri.exec(data)) !== null) { var hKey = AI_KEY[hm[1]]; if (hKey) result[hKey] = hm[2].trim(); }
      return result;
    }
    data = data.replace(/[\x1D\u001D\u241D]/g, '\x1D');
    data = data.replace(/<GS>/gi, '\x1D');
    var pos = 0, maxIter = 200;
    while (pos < data.length && maxIter-- > 0) {
      if (data.charAt(pos) === '\x1D') { pos++; continue; }
      var matched = false;
      for (var aiLen = 4; aiLen >= 2; aiLen--) {
        if (pos + aiLen > data.length) continue;
        var ai = data.substring(pos, pos + aiLen);
        if (AI_LEN.hasOwnProperty(ai)) {
          var fixedLen = AI_LEN[ai]; pos += aiLen; var val;
          if (fixedLen > 0) { val = data.substring(pos, pos + fixedLen); pos += fixedLen; }
          else { var gsIdx = data.indexOf('\x1D', pos); if (gsIdx === -1) gsIdx = data.length; val = data.substring(pos, gsIdx); pos = gsIdx; }
          var key = AI_KEY[ai]; if (key) result[key] = val; matched = true; break;
        }
      }
      if (!matched) { var nextGS = data.indexOf('\x1D', pos); pos = nextGS === -1 ? data.length : nextGS; }
    }
    return result;
  },
  validateGTIN: function(gtin) {
    if (!gtin || !/^\d{8,14}$/.test(gtin)) return false;
    var padded = gtin.padStart(14, '0'); var sum = 0;
    for (var i = 0; i < 13; i++) sum += parseInt(padded[i]) * (i % 2 === 0 ? 3 : 1);
    return (10 - (sum % 10)) % 10 === parseInt(padded[13]);
  },
  gtinToNdc: function(gtin) {
    if (!gtin || gtin.length < 12) return null;
    var g14 = gtin.padStart(14, '0'); var upc = g14.substring(1, 13);
    var ndc10 = null;
    if (upc.substring(0, 2) === '03') ndc10 = upc.substring(2, 12);
    else if (upc.charAt(0) === '3') ndc10 = upc.substring(1, 11);
    if (ndc10) {
      return { ndc10: ndc10,
        formats: [ndc10.substring(0,5)+'-'+ndc10.substring(5,9), ndc10.substring(0,4)+'-'+ndc10.substring(4,8), ndc10.substring(0,5)+'-'+ndc10.substring(5,8)],
        packageFormats: [ndc10.substring(0,5)+'-'+ndc10.substring(5,9)+'-'+ndc10.substring(9), ndc10.substring(0,4)+'-'+ndc10.substring(4,8)+'-'+ndc10.substring(8), ndc10.substring(0,5)+'-'+ndc10.substring(5,8)+'-'+ndc10.substring(8)]
      };
    }
    var mid = upc.replace(/^0+/, '');
    if (mid.length >= 9) return { ndc10: mid.substring(0,10), formats: [mid.substring(0,5)+'-'+mid.substring(5,9)], packageFormats: [], raw: upc };
    return { ndc10: null, formats: [], packageFormats: [], raw: upc };
  }
};

// Proper GTIN-14 builder from NDC: indicator(0) + 0 + 3 + NDC-10 + check
// NDC must be normalized to exactly 10 digits
function ndcToGtin14(ndcDashed) {
  var parts = ndcDashed.split('-');
  // Normalize to 10-digit NDC (remove dashes, pad segments)
  var ndc10;
  if (parts.length === 2) {
    // product_ndc: 5-4, 4-4, or 5-3
    var p1 = parts[0], p2 = parts[1];
    ndc10 = (p1 + p2).padEnd(10, '0');
  } else if (parts.length === 3) {
    ndc10 = (parts[0] + parts[1] + parts[2]).padEnd(10, '0').substring(0, 10);
  } else {
    ndc10 = ndcDashed.replace(/-/g, '').padEnd(10, '0').substring(0, 10);
  }
  // GTIN-14: 0 + 03 + NDC10 = 13 digits + check digit
  var prefix13 = '003' + ndc10;
  return prefix13 + gs1CheckDigit(prefix13);
}

// Real drugs with valid NDCs from FDA database
var DRUGS = [
  { ndc: '68071-1619', name: 'Amoxicillin (NuCare)' },
  { ndc: '73043-0062', name: 'Amoxicillin (Devatis)' },
  { ndc: '68788-8528', name: 'Metformin HCl' },
  { ndc: '00071-0156', name: 'Lipitor (Pfizer)' },
  { ndc: '00006-0749', name: 'Januvia (Merck)' },
  { ndc: '50090-2875', name: 'Omeprazole' },
  { ndc: '00074-3799', name: 'Humira (AbbVie)' },
  { ndc: '00002-4112', name: 'Trulicity (Eli Lilly)' },
  { ndc: '59762-3780', name: 'Atorvastatin' },
  { ndc: '00093-7180', name: 'Amlodipine (Teva)' },
  { ndc: '65862-0202', name: 'Losartan (Aurobindo)' },
  { ndc: '00378-1805', name: 'Levothyroxine (Mylan)' },
  { ndc: '16729-0182', name: 'Sertraline (Accord)' },
  { ndc: '31722-0710', name: 'Montelukast (Camber)' },
  { ndc: '68462-0254', name: 'Pantoprazole' },
  { ndc: '55111-0160', name: 'Gabapentin (Dr Reddy)' },
  { ndc: '57664-0474', name: 'Escitalopram (Sun)' },
  { ndc: '13668-0095', name: 'Lisinopril (Torrent)' },
  { ndc: '69097-0849', name: 'Rosuvastatin (Cipla)' },
  { ndc: '43547-0356', name: 'Duloxetine (Solco)' },
];

var LOTS = ['A24001','B2024-0156','LOT24A032','P240615','24F001A','MFG2024001','KE-24-001','EU2024B05','J240101','L24-Q3-001','ABX2024-07','PLT240930','FAB-24-156','NJ24A','TX24001B','BATCH240001','FG24-78','RB-24001','QC2024A','24PLT-077'];
var SERIALS = ['A0001234567890','SN24001A0001','12AB34CD56EF','X0000000001','PFIZER2024001','24Q30000001','EU-SN-00001','KE001-SN-A','SNX24070100001','DT2024062401','MRK-SN-000001','AUR-24-000001','TEVA0000000001','MYL-24000001','SUN0000000001','GS1-21-TEST01','ABBV24SN00001','LLY-000000001','DR-REDDY-0001','GLN-SN-24-01'];
var EXPIRIES = ['261231','270630','271215','280131','250930','260315','270815','281130','260601','270228','280430','260715','271031','280915','260228','270101','280630','261115','270420','280301'];
var PRODDATES = ['240101','240315','240501','240615','240801','241001','241115','230901','231201','240201','240401','240601','240720','240905','241010','231015','240115','240301','240510','240625'];

// Pre-compute all GTINs
var GTINS = DRUGS.map(function(d) { return ndcToGtin14(d.ndc); });

// ========================================================================
// SUITE 1: Parser — Raw DataMatrix (20 drugs × 4 fields = 80 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 1: Raw DataMatrix scans (80 tests)');
console.log('═'.repeat(60));

for (var i = 0; i < 20; i++) {
  var g = GTINS[i], l = LOTS[i], s = SERIALS[i], e = EXPIRIES[i];
  var raw = ']d201' + g + '17' + e + '\x1D10' + l + '\x1D21' + s;
  var p = Utils.parseGS1(raw);
  assert(DRUGS[i].name + ' GTIN', p.gtin, g);
  assert(DRUGS[i].name + ' Exp', p.expiry, e);
  assert(DRUGS[i].name + ' Lot', p.lot, l);
  assert(DRUGS[i].name + ' Ser', p.serial, s);
}

// ========================================================================
// SUITE 2: Parser — HRI format (80 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 2: HRI parenthesized format (80 tests)');
console.log('═'.repeat(60));

for (var i = 0; i < 20; i++) {
  var g = GTINS[i], l = LOTS[i], s = SERIALS[i], e = EXPIRIES[i];
  var hri = '(01)' + g + '(17)' + e + '(10)' + l + '(21)' + s;
  var p = Utils.parseGS1(hri);
  assert(DRUGS[i].name + ' HRI GTIN', p.gtin, g);
  assert(DRUGS[i].name + ' HRI Exp', p.expiry, e);
  assert(DRUGS[i].name + ' HRI Lot', p.lot, l);
  assert(DRUGS[i].name + ' HRI Ser', p.serial, s);
}

// ========================================================================
// SUITE 3: Check digit validation (40 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 3: GTIN check digit validation (40 tests)');
console.log('═'.repeat(60));

// 20 valid
for (var i = 0; i < 20; i++) {
  assertTrue(DRUGS[i].name + ' valid (' + GTINS[i] + ')', Utils.validateGTIN(GTINS[i]));
}
// 20 invalid (flip last digit)
for (var i = 0; i < 20; i++) {
  var bad = GTINS[i].substring(0,13) + ((parseInt(GTINS[i][13]) + 1) % 10);
  assertFalse(DRUGS[i].name + ' invalid (' + bad + ')', Utils.validateGTIN(bad));
}

// ========================================================================
// SUITE 4: NDC round-trip (20 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 4: GTIN→NDC round-trip (20 tests)');
console.log('═'.repeat(60));

for (var i = 0; i < 20; i++) {
  var ndc = Utils.gtinToNdc(GTINS[i]);
  assertTrue(DRUGS[i].name + ' NDC result exists', !!ndc && ndc.formats.length > 0);
}

// ========================================================================
// SUITE 5: Different AIM prefixes (12 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 5: AIM symbology prefixes (12 tests)');
console.log('═'.repeat(60));

var prefixes = [']d2', ']d1', ']d0', ']C1', ']C0', ']e0', ']e1', ']e2', ']e3', ']e4', ']Q3', ']Q0'];
for (var i = 0; i < prefixes.length; i++) {
  var raw = prefixes[i] + '01' + GTINS[0] + '17271231';
  var p = Utils.parseGS1(raw);
  assert('Prefix ' + prefixes[i] + ' → GTIN', p.gtin, GTINS[0]);
}

// ========================================================================
// SUITE 6: Edge cases (25 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 6: Edge cases (25 tests)');
console.log('═'.repeat(60));

// Empty/invalid
assert('Empty → empty', Object.keys(Utils.parseGS1('')).length, 0);
assert('Spaces → empty', Object.keys(Utils.parseGS1('   ')).length, 0);
assert('Random → empty', Object.keys(Utils.parseGS1('HELLO')).length, 0);
assertFalse('null GTIN', Utils.validateGTIN(null));
assertFalse('undefined GTIN', Utils.validateGTIN(undefined));
assertFalse('short GTIN', Utils.validateGTIN('123'));
assertFalse('alpha GTIN', Utils.validateGTIN('ABCDEFGH'));

// Special chars in lot/serial (HRI format — always works)
var specials = [
  { lot: 'LOT/2024/001', ser: 'SN-001-A' },
  { lot: 'ABC.DEF.123', ser: '123_456_789' },
  { lot: 'LOT#24-001', ser: 'X+Y=Z' },
];
for (var i = 0; i < specials.length; i++) {
  var hri = '(01)' + GTINS[i] + '(10)' + specials[i].lot + '(21)' + specials[i].ser;
  var p = Utils.parseGS1(hri);
  assert('Special lot ' + i, p.lot, specials[i].lot);
  assert('Special ser ' + i, p.serial, specials[i].ser);
}

// Double GS separators
var raw_dgs = '\x1D\x1D01' + GTINS[0] + '17271231\x1D\x1D10LOT1\x1D\x1D21SN1\x1D';
var p_dgs = Utils.parseGS1(raw_dgs);
assert('DblGS GTIN', p_dgs.gtin, GTINS[0]);
assert('DblGS Lot', p_dgs.lot, 'LOT1');
assert('DblGS Serial', p_dgs.serial, 'SN1');

// <GS> text separator
var raw_tgs = '01' + GTINS[0] + '17271231<GS>10LOT-TEXT<GS>21SN-TEXT';
var p_tgs = Utils.parseGS1(raw_tgs);
assert('<GS> GTIN', p_tgs.gtin, GTINS[0]);
assert('<GS> Lot', p_tgs.lot, 'LOT-TEXT');
assert('<GS> Serial', p_tgs.serial, 'SN-TEXT');

// AI(240) additional ID
var hri240 = '(01)' + GTINS[0] + '(240)EXTRA-ID-001(17)271231(10)L1(21)S1';
var p240 = Utils.parseGS1(hri240);
assert('AI(240) additionalId', p240.additionalId, 'EXTRA-ID-001');
assert('AI(240) expiry', p240.expiry, '271231');

// ========================================================================
// SUITE 7: Full pipeline — parse, validate, convert (20 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 7: Full pipeline parse→validate→convert (20 tests)');
console.log('═'.repeat(60));

for (var i = 0; i < 20; i++) {
  var raw = '(01)' + GTINS[i] + '(17)' + EXPIRIES[i] + '(10)' + LOTS[i] + '(21)' + SERIALS[i];
  var parsed = Utils.parseGS1(raw);
  var valid = Utils.validateGTIN(parsed.gtin);
  assertTrue(DRUGS[i].name + ' pipeline OK', valid && parsed.gtin === GTINS[i] && parsed.expiry === EXPIRIES[i]);
}

// ========================================================================
// SUITE 8: Live API (10 tests)
// ========================================================================
console.log('\n' + '═'.repeat(60));
console.log('  SUITE 8: Live API verification (10 tests)');
console.log('═'.repeat(60));

async function runAPIs() {
  var brands = ['Amoxicillin', 'Metformin', 'Atorvastatin', 'Lisinopril', 'Omeprazole'];
  for (var i = 0; i < brands.length; i++) {
    try {
      var r = await fetch('https://api.fda.gov/drug/ndc.json?search=brand_name:%22' + brands[i] + '%22&limit=1');
      if (r.ok) { var d = await r.json(); if (d.results && d.results.length) { total++; passed++; console.log('  ✅ FDA: ' + d.results[0].brand_name + ' | ' + d.results[0].product_ndc); } else { total++; failed++; console.log('  ❌ FDA: no results for ' + brands[i]); } }
      else { total++; failed++; }
    } catch(e) { total++; failed++; console.log('  ❌ ' + e.message); }
  }
  var rxDrugs = ['Metformin', 'Atorvastatin', 'Lisinopril', 'Omeprazole', 'Gabapentin'];
  for (var i = 0; i < rxDrugs.length; i++) {
    try {
      var r = await fetch('https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + rxDrugs[i] + '&search=2');
      if (r.ok) { var d = await r.json(); if (d.idGroup && d.idGroup.rxnormId && d.idGroup.rxnormId.length) { total++; passed++; console.log('  ✅ RxNorm: ' + rxDrugs[i] + ' → ' + d.idGroup.rxnormId[0]); } else { total++; failed++; } }
      else { total++; failed++; }
    } catch(e) { total++; failed++; }
  }

  console.log('\n' + '═'.repeat(60));
  if (failed === 0) console.log('  ✅ ALL ' + passed + '/' + total + ' TESTS PASSED');
  else console.log('  ⚠️  ' + passed + '/' + total + ' passed, ' + failed + ' FAILED');
  console.log('═'.repeat(60) + '\n');
  if (failed > 0) process.exit(1);
}

runAPIs();
