#!/usr/bin/env node
// ========================================================================
//  GS1 DataMatrix Compliance Test Suite
//  Tests parseGS1, validateGTIN, gtinToNdc against REAL pharmaceutical data
// ========================================================================

var passed = 0, failed = 0, total = 0;

function assert(name, actual, expected) {
  total++;
  var match = JSON.stringify(actual) === JSON.stringify(expected);
  if (match) {
    passed++;
    console.log('  ✅ ' + name);
  } else {
    failed++;
    console.log('  ❌ ' + name);
    console.log('     Expected:', JSON.stringify(expected));
    console.log('     Got:     ', JSON.stringify(actual));
  }
}

function assertTrue(name, val) {
  total++;
  if (val) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name + ' (expected truthy, got ' + val + ')'); }
}

function assertFalse(name, val) {
  total++;
  if (!val) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name + ' (expected falsy, got ' + val + ')'); }
}

// ========================================================================
//  Copy of Utils functions from app.js (exact same logic)
// ========================================================================

var Utils = {
  parseGS1: function(raw) {
    var data = raw.trim();
    data = data.replace(/^\](?:d[0-2]|C[01]|e[0-4]|Q[0-6])/, '');
    var AI_LEN = {
      '00':18, '01':14, '02':14, '10':-1, '11':6, '12':6, '13':6,
      '15':6, '17':6, '20':2, '21':-1, '22':-1, '30':-1, '37':-1,
      '240':-1, '241':-1, '242':-1, '250':-1, '251':-1,
      '253':-1, '254':-1, '255':-1,
      '310':6, '311':6, '320':6, '321':6,
      '400':-1, '410':13, '411':13, '412':13, '414':13,
      '710':-1, '711':-1, '712':-1, '713':-1, '714':-1
    };
    var AI_KEY = {
      '01':'gtin','02':'content','10':'lot','11':'prodDate',
      '13':'packDate','15':'bestBefore','17':'expiry',
      '21':'serial','30':'count','37':'units',
      '240':'additionalId','710':'nhrn','711':'nhrn','712':'nhrn','713':'nhrn','714':'nhrn'
    };
    var result = {};
    if (/\(\d{2,4}\)/.test(data)) {
      var hri = /\((\d{2,4})\)([^(]*)/g, hm;
      while ((hm = hri.exec(data)) !== null) {
        var hKey = AI_KEY[hm[1]];
        if (hKey) result[hKey] = hm[2].trim();
      }
      return result;
    }
    data = data.replace(/[\x1D\u001D\u241D]/g, '\x1D');
    data = data.replace(/<GS>/gi, '\x1D');
    var pos = 0;
    var maxIter = 200;
    while (pos < data.length && maxIter-- > 0) {
      if (data.charAt(pos) === '\x1D') { pos++; continue; }
      var matched = false;
      for (var aiLen = 4; aiLen >= 2; aiLen--) {
        if (pos + aiLen > data.length) continue;
        var ai = data.substring(pos, pos + aiLen);
        if (AI_LEN.hasOwnProperty(ai)) {
          var fixedLen = AI_LEN[ai];
          pos += aiLen;
          var val;
          if (fixedLen > 0) {
            val = data.substring(pos, pos + fixedLen);
            pos += fixedLen;
          } else {
            var gsIdx = data.indexOf('\x1D', pos);
            if (gsIdx === -1) gsIdx = data.length;
            val = data.substring(pos, gsIdx);
            pos = gsIdx;
          }
          var key = AI_KEY[ai];
          if (key) result[key] = val;
          matched = true;
          break;
        }
      }
      if (!matched) {
        var nextGS = data.indexOf('\x1D', pos);
        pos = nextGS === -1 ? data.length : nextGS;
      }
    }
    return result;
  },

  validateGTIN: function(gtin) {
    if (!gtin || !/^\d{8,14}$/.test(gtin)) return false;
    var padded = gtin.padStart(14, '0');
    var sum = 0;
    for (var i = 0; i < 13; i++) {
      sum += parseInt(padded[i]) * (i % 2 === 0 ? 3 : 1);
    }
    var checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(padded[13]);
  },

  gtinToNdc: function(gtin) {
    if (!gtin || gtin.length < 12) return null;
    var g14 = gtin.padStart(14, '0');
    var upc = g14.substring(1, 13);
    var ndc10 = null;
    if (upc.substring(0, 2) === '03') {
      ndc10 = upc.substring(2, 12);
    } else if (upc.charAt(0) === '3') {
      ndc10 = upc.substring(1, 11);
    }
    if (ndc10) {
      return {
        ndc10: ndc10,
        formats: [
          ndc10.substring(0,5) + '-' + ndc10.substring(5,9),
          ndc10.substring(0,4) + '-' + ndc10.substring(4,8),
          ndc10.substring(0,5) + '-' + ndc10.substring(5,8),
        ],
        packageFormats: [
          ndc10.substring(0,5) + '-' + ndc10.substring(5,9) + '-' + ndc10.substring(9),
          ndc10.substring(0,4) + '-' + ndc10.substring(4,8) + '-' + ndc10.substring(8),
          ndc10.substring(0,5) + '-' + ndc10.substring(5,8) + '-' + ndc10.substring(8),
        ]
      };
    }
    var mid = upc.replace(/^0+/, '');
    if (mid.length >= 9) {
      return {
        ndc10: mid.substring(0, 10),
        formats: [
          mid.substring(0,5) + '-' + mid.substring(5,9),
          mid.substring(0,4) + '-' + mid.substring(4,8),
        ],
        packageFormats: [],
        raw: upc
      };
    }
    return { ndc10: null, formats: [], packageFormats: [], raw: upc };
  }
};

// ========================================================================
//  TEST SUITE 1: GS1 Parser — Real Format Data
// ========================================================================

console.log('\n═══════════════════════════════════════════════════');
console.log('  TEST SUITE 1: GS1 Parser');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Raw GS1 DataMatrix — real Amoxicillin barcode format
// GTIN-14: 00368071161915 (NuCare Amoxicillin, NDC 68071-1619)
console.log('--- Test 1: Raw DataMatrix with ]d2 prefix ---');
var t1 = Utils.parseGS1(']d2010036807116191517271231' + '\x1D' + '10LOT2024A' + '\x1D' + '21SN98765432');
assert('GTIN parsed', t1.gtin, '00368071161915');
assert('Expiry parsed', t1.expiry, '271231');
assert('Lot parsed', t1.lot, 'LOT2024A');
assert('Serial parsed', t1.serial, 'SN98765432');

// Test 2: Raw without AIM prefix (some scanners strip it)
console.log('\n--- Test 2: Raw without AIM prefix ---');
var t2 = Utils.parseGS1('010036807116191517271231' + '\x1D' + '10BATCH99' + '\x1D' + '21ABC123');
assert('GTIN parsed', t2.gtin, '00368071161915');
assert('Expiry parsed', t2.expiry, '271231');
assert('Lot parsed', t2.lot, 'BATCH99');
assert('Serial parsed', t2.serial, 'ABC123');

// Test 3: HRI format (copied from medicine packaging text)
console.log('\n--- Test 3: HRI parenthesized format ---');
var t3 = Utils.parseGS1('(01)00368071161915(17)271231(10)LOT2024A(21)SN98765432');
assert('GTIN parsed', t3.gtin, '00368071161915');
assert('Expiry parsed', t3.expiry, '271231');
assert('Lot parsed', t3.lot, 'LOT2024A');
assert('Serial parsed', t3.serial, 'SN98765432');

// Test 4: Fixed-length fields back-to-back (no GS needed between 01 and 17)
console.log('\n--- Test 4: Fixed fields back-to-back (no GS separator needed) ---');
var t4 = Utils.parseGS1('01003680711619151726123110MYLOT21MYSERIAL');
assert('GTIN parsed', t4.gtin, '00368071161915');
assert('Expiry parsed', t4.expiry, '261231');
// Lot is variable-length — without GS, it captures until end (including 21...)
// This is the edge case: variable field before another variable field without GS
// Per GS1 spec, GS separator is REQUIRED between consecutive variable fields
// But we should handle it gracefully

// Test 5: Production date AI (11)
console.log('\n--- Test 5: With production date AI(11) ---');
var t5 = Utils.parseGS1('(01)00368071161915(11)240615(17)260615(10)B123(21)S456');
assert('GTIN parsed', t5.gtin, '00368071161915');
assert('ProdDate parsed', t5.prodDate, '240615');
assert('Expiry parsed', t5.expiry, '260615');
assert('Lot parsed', t5.lot, 'B123');
assert('Serial parsed', t5.serial, 'S456');

// Test 6: Code 128 symbology prefix
console.log('\n--- Test 6: ]C1 Code 128 prefix ---');
var t6 = Utils.parseGS1(']C1010036807116191517271231' + '\x1D' + '10LOT1');
assert('GTIN parsed', t6.gtin, '00368071161915');
assert('Expiry parsed', t6.expiry, '271231');
assert('Lot parsed', t6.lot, 'LOT1');

// Test 7: EAN-13 barcode (just a GTIN-13, no other AIs)
console.log('\n--- Test 7: Bare EAN-13/GTIN-13 ---');
var t7 = Utils.parseGS1(']e00368071161915');
// This is just 13 digits after ]e0 — not structured as AI data
// The parser should handle this: it starts with '03' which is not a known AI
// So it should return empty (which is correct — bare EAN-13 isn't GS1 AI structured)
// The scan handler should fall back to using the raw string

// Test 8: Real-world Kenyan medicine (hypothetical but standards-compliant)
// GS1 Kenya prefix: 616 
console.log('\n--- Test 8: Kenya GS1 prefix (616) ---');
var t8 = Utils.parseGS1('(01)06161234567890(17)261231(10)KE-LOT-01(21)KE-SN-001');
assert('GTIN parsed', t8.gtin, '06161234567890');
assert('Expiry parsed', t8.expiry, '261231');
assert('Lot parsed', t8.lot, 'KE-LOT-01');
assert('Serial parsed', t8.serial, 'KE-SN-001');

// Test 9: NHRN (National Healthcare Reimbursement Number)
console.log('\n--- Test 9: With NHRN AI(710) ---');
var t9 = Utils.parseGS1('(01)04150164835270(710)ABC123456(17)271231');
assert('GTIN parsed', t9.gtin, '04150164835270');
assert('NHRN parsed', t9.nhrn, 'ABC123456');
assert('Expiry parsed', t9.expiry, '271231');

// Test 10: Unicode GS separator (some mobile scanners output this)
console.log('\n--- Test 10: Unicode GS separator \\u241D ---');
var t10raw = '0100368071161915172712311012345\u241D21SN999';
var t10 = Utils.parseGS1(t10raw);
assert('GTIN parsed', t10.gtin, '00368071161915');
assert('Lot parsed', t10.lot, '12345');
assert('Serial parsed', t10.serial, 'SN999');

// ========================================================================
//  TEST SUITE 2: GTIN Check Digit Validation
// ========================================================================

console.log('\n═══════════════════════════════════════════════════');
console.log('  TEST SUITE 2: GTIN Check Digit Validation');
console.log('═══════════════════════════════════════════════════\n');

// Real GTINs with valid check digits
assertTrue('NuCare Amoxicillin GTIN-14: 00368071161915', Utils.validateGTIN('00368071161915'));
assertTrue('GTIN-13 Amoxicillin: 0368071161915', Utils.validateGTIN('0368071161915'));
assertTrue('GTIN-8 example: 96385074', Utils.validateGTIN('96385074'));
assertTrue('GTIN-12 (UPC-A): 036000291452', Utils.validateGTIN('036000291452'));

// Invalid check digits
assertFalse('Bad check digit: 00368071161910', Utils.validateGTIN('00368071161910'));
assertFalse('Bad check digit: 00368071161919', Utils.validateGTIN('00368071161919'));
assertFalse('Too short: 12345', Utils.validateGTIN('12345'));
assertFalse('Non-numeric: ABC12345', Utils.validateGTIN('ABC12345'));

// ========================================================================
//  TEST SUITE 3: GTIN-14 to NDC Conversion
// ========================================================================

console.log('\n═══════════════════════════════════════════════════');
console.log('  TEST SUITE 3: GTIN-14 → NDC Conversion');
console.log('═══════════════════════════════════════════════════\n');

// Real NuCare Amoxicillin: GTIN-14 00368071161915 → NDC 68071-1619-1
var ndc1 = Utils.gtinToNdc('00368071161915');
assertTrue('NDC conversion returned result', !!ndc1);
assert('10-digit NDC', ndc1.ndc10, '6807116191');
assertTrue('5-4 format includes 68071-1619', ndc1.formats.indexOf('68071-1619') >= 0);
assertTrue('Package format includes 68071-1619-1', ndc1.packageFormats.indexOf('68071-1619-1') >= 0);

console.log('   NDC formats tried:', JSON.stringify(ndc1.formats));
console.log('   Package formats:', JSON.stringify(ndc1.packageFormats));

// Non-US barcode (Kenya prefix 616) — fallback still tries NDC formats
var ndc2 = Utils.gtinToNdc('06161234567890');
assertTrue('Non-US returns fallback result', !!ndc2);
assertTrue('Non-US has raw UPC', !!ndc2.raw);
console.log('   Non-US fallback formats:', JSON.stringify(ndc2.formats));
console.log('   Non-US raw UPC:', ndc2.raw);

// ========================================================================
//  TEST SUITE 4: OpenFDA API Live Tests
// ========================================================================

console.log('\n═══════════════════════════════════════════════════');
console.log('  TEST SUITE 4: OpenFDA API Live Tests');
console.log('═══════════════════════════════════════════════════\n');

async function testOpenFDA() {
  // Test A: Search by NDC derived from GTIN
  console.log('--- Test A: NDC lookup from GTIN 00368071161915 ---');
  var ndcInfo = Utils.gtinToNdc('00368071161915');
  var foundNDC = false;
  for (var i = 0; i < ndcInfo.formats.length; i++) {
    var url = 'https://api.fda.gov/drug/ndc.json?search=product_ndc:%22' + ndcInfo.formats[i] + '%22&limit=1';
    console.log('   Trying: ' + ndcInfo.formats[i] + '...');
    try {
      var res = await fetch(url);
      if (res.ok) {
        var data = await res.json();
        if (data.results && data.results.length > 0) {
          var r = data.results[0];
          console.log('   ✅ FOUND: ' + r.brand_name + ' by ' + r.labeler_name);
          console.log('   NDC: ' + r.product_ndc + ' | Form: ' + r.dosage_form);
          foundNDC = true;
          total++; passed++;
          break;
        }
      }
    } catch(e) { console.log('   Network error:', e.message); }
  }
  if (!foundNDC) { total++; failed++; console.log('   ❌ No FDA result found for any NDC format'); }

  // Test B: Brand name search
  console.log('\n--- Test B: Brand name search "Metformin" ---');
  try {
    var res2 = await fetch('https://api.fda.gov/drug/ndc.json?search=brand_name:%22Metformin%22&limit=1');
    if (res2.ok) {
      var data2 = await res2.json();
      if (data2.results && data2.results.length > 0) {
        var r2 = data2.results[0];
        console.log('   ✅ FOUND: ' + r2.brand_name + ' by ' + r2.labeler_name);
        console.log('   NDC: ' + r2.product_ndc + ' | Form: ' + r2.dosage_form);
        total++; passed++;
      } else {
        total++; failed++; console.log('   ❌ No results');
      }
    }
  } catch(e) { console.log('   Network error:', e.message); total++; failed++; }

  // Test C: RxNorm API
  console.log('\n--- Test C: RxNorm lookup "Amoxicillin" ---');
  try {
    var res3 = await fetch('https://rxnav.nlm.nih.gov/REST/rxcui.json?name=Amoxicillin&search=2');
    if (res3.ok) {
      var data3 = await res3.json();
      if (data3.idGroup && data3.idGroup.rxnormId && data3.idGroup.rxnormId.length > 0) {
        console.log('   ✅ RxCUI: ' + data3.idGroup.rxnormId[0] + ' (Amoxicillin)');
        total++; passed++;
      } else {
        total++; failed++; console.log('   ❌ No RxNorm result');
      }
    }
  } catch(e) { console.log('   Network error:', e.message); total++; failed++; }

  // Test D: OpenFDA label search
  console.log('\n--- Test D: OpenFDA label search "Paracetamol" ---');
  try {
    var res4 = await fetch('https://api.fda.gov/drug/label.json?search=openfda.brand_name:%22Paracetamol%22&limit=1');
    if (res4.ok) {
      var data4 = await res4.json();
      if (data4.results && data4.results.length > 0) {
        var of4 = data4.results[0].openfda || {};
        console.log('   ✅ FOUND: ' + (of4.brand_name ? of4.brand_name[0] : 'Unknown'));
        console.log('   Manufacturer: ' + (of4.manufacturer_name ? of4.manufacturer_name[0] : 'Unknown'));
        total++; passed++;
      } else {
        // Paracetamol might not be in US FDA — try Acetaminophen
        console.log('   ⚠️  Not found (expected — "Paracetamol" is non-US name)');
        var res4b = await fetch('https://api.fda.gov/drug/label.json?search=openfda.brand_name:%22Acetaminophen%22&limit=1');
        if (res4b.ok) {
          var data4b = await res4b.json();
          if (data4b.results && data4b.results.length > 0) {
            var of4b = data4b.results[0].openfda || {};
            console.log('   ✅ Fallback "Acetaminophen" FOUND: ' + (of4b.brand_name ? of4b.brand_name[0] : 'Unknown'));
            total++; passed++;
          }
        }
      }
    }
  } catch(e) { console.log('   Network error:', e.message); total++; failed++; }

  // ========================================================================
  //  FINAL REPORT
  // ========================================================================
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RESULTS: ' + passed + '/' + total + ' passed, ' + failed + ' failed');
  console.log('═══════════════════════════════════════════════════\n');
  if (failed > 0) process.exit(1);
}

testOpenFDA();
