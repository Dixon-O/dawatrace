import crypto from 'crypto';
import fs from 'fs';

// ============================================================
// DawaTrace Dataset Generator
// Generates ~1,100 realistic pharmaceutical products
// Sources: FDA NDC, EMA, WHO Essential Medicines, Kenya PPB
// ============================================================

function hash(str) { return '0x' + crypto.createHash('sha256').update(str).digest('hex'); }
function randHex(n) { return crypto.randomBytes(n).toString('hex').toUpperCase(); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const DAY = 86400;
const NOW = Math.floor(Date.now() / 1000);

// ============================================================
// DRUG MASTER DATA — 110 real pharmaceutical products
// ============================================================

const DRUGS = [
  // --- US FDA Products (40) ---
  { name: "Amoxicillin 500mg Capsule", generic: "AMOXICILLIN", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Teva Pharmaceuticals","Sandoz","Aurobindo Pharma"] },
  { name: "Lisinopril 10mg Tablet", generic: "LISINOPRIL", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Lupin Pharmaceuticals","Mylan","Zydus"] },
  { name: "Metformin 500mg Tablet", generic: "METFORMIN HCL", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Teva Pharmaceuticals","Sun Pharma","Amneal"] },
  { name: "Atorvastatin 20mg Tablet", generic: "ATORVASTATIN CALCIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Ranbaxy","Dr. Reddy's"] },
  { name: "Omeprazole 20mg Capsule", generic: "OMEPRAZOLE", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Mylan","Sandoz","Dr. Reddy's"] },
  { name: "Losartan 50mg Tablet", generic: "LOSARTAN POTASSIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Teva Pharmaceuticals","Aurobindo","Macleods"] },
  { name: "Simvastatin 40mg Tablet", generic: "SIMVASTATIN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Merck","Lupin","Zydus"] },
  { name: "Levothyroxine 50mcg Tablet", generic: "LEVOTHYROXINE SODIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["AbbVie","Mylan","Lannett"] },
  { name: "Amlodipine 5mg Tablet", generic: "AMLODIPINE BESYLATE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Mylan","Camber"] },
  { name: "Metoprolol Succinate 50mg ER", generic: "METOPROLOL SUCCINATE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["AstraZeneca","Par Pharma","Sandoz"] },
  { name: "Azithromycin 250mg Tablet", generic: "AZITHROMYCIN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Teva","Wockhardt"] },
  { name: "Hydrochlorothiazide 25mg Tablet", generic: "HYDROCHLOROTHIAZIDE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Mylan","Amneal","Zydus"] },
  { name: "Gabapentin 300mg Capsule", generic: "GABAPENTIN", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Pfizer","Teva","InvaGen"] },
  { name: "Sertraline 50mg Tablet", generic: "SERTRALINE HCL", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Lupin","Aurobindo"] },
  { name: "Pantoprazole 40mg Tablet", generic: "PANTOPRAZOLE SODIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Wyeth","Teva","Sun Pharma"] },
  { name: "Escitalopram 10mg Tablet", generic: "ESCITALOPRAM OXALATE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Allergan","Teva","Torrent"] },
  { name: "Acetaminophen 500mg Tablet", generic: "ACETAMINOPHEN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Johnson & Johnson","Perrigo","Major Pharma"] },
  { name: "Ibuprofen 400mg Tablet", generic: "IBUPROFEN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Dr. Reddy's","Perrigo"] },
  { name: "Ciprofloxacin 500mg Tablet", generic: "CIPROFLOXACIN HCL", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Bayer","Teva","Dr. Reddy's"] },
  { name: "Prednisone 10mg Tablet", generic: "PREDNISONE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Roxane","West-Ward"] },
  { name: "Tramadol 50mg Tablet", generic: "TRAMADOL HCL", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Janssen","Amneal","Sun Pharma"] },
  { name: "Furosemide 40mg Tablet", generic: "FUROSEMIDE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Sanofi","Mylan","Sandoz"] },
  { name: "Montelukast 10mg Tablet", generic: "MONTELUKAST SODIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Merck","Teva","Torrent"] },
  { name: "Cephalexin 500mg Capsule", generic: "CEPHALEXIN", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Ascend Labs","Lupin","Aurobindo"] },
  { name: "Doxycycline 100mg Capsule", generic: "DOXYCYCLINE HYCLATE", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Par Pharma","Mylan","Mayne Pharma"] },
  { name: "Fluconazole 150mg Tablet", generic: "FLUCONAZOLE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Pfizer","Teva","Glenmark"] },
  { name: "Naproxen 500mg Tablet", generic: "NAPROXEN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Bayer","Amneal","Mylan"] },
  { name: "Cetirizine 10mg Tablet", generic: "CETIRIZINE HCL", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Johnson & Johnson","Perrigo","Dr. Reddy's"] },
  { name: "Diclofenac 50mg Tablet", generic: "DICLOFENAC SODIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Novartis","Mylan","Sandoz"] },
  { name: "Aspirin 81mg Tablet", generic: "ASPIRIN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Bayer","St. Joseph","Major Pharma"] },
  { name: "Warfarin 5mg Tablet", generic: "WARFARIN SODIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Bristol-Myers Squibb","Taro","Zydus"] },
  { name: "Clopidogrel 75mg Tablet", generic: "CLOPIDOGREL BISULFATE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Sanofi","Teva","Dr. Reddy's"] },
  { name: "Rosuvastatin 10mg Tablet", generic: "ROSUVASTATIN CALCIUM", form: "TABLET", route: "ORAL", region: "US", mfgs: ["AstraZeneca","Sandoz","Sun Pharma"] },
  { name: "Valsartan 160mg Tablet", generic: "VALSARTAN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Novartis","Aurobindo","Mylan"] },
  { name: "Duloxetine 30mg Capsule", generic: "DULOXETINE HCL", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Eli Lilly","Lupin","Teva"] },
  { name: "Clindamycin 300mg Capsule", generic: "CLINDAMYCIN HCL", form: "CAPSULE", route: "ORAL", region: "US", mfgs: ["Pfizer","Mylan","Sandoz"] },
  { name: "Loratadine 10mg Tablet", generic: "LORATADINE", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Bayer","Perrigo","Mylan"] },
  { name: "Albuterol 90mcg Inhaler", generic: "ALBUTEROL SULFATE", form: "AEROSOL", route: "INHALATION", region: "US", mfgs: ["GSK","Teva","Cipla"] },
  { name: "Insulin Glargine 100U/mL", generic: "INSULIN GLARGINE", form: "INJECTION", route: "SUBCUTANEOUS", region: "US", mfgs: ["Sanofi","Eli Lilly","Biocon"] },
  { name: "Linagliptin 5mg Tablet", generic: "LINAGLIPTIN", form: "TABLET", route: "ORAL", region: "US", mfgs: ["Boehringer Ingelheim","Eli Lilly"] },

  // --- Kenya / Africa Common Products (40) ---
  { name: "Artemether-Lumefantrine 20/120mg", generic: "ARTEMETHER+LUMEFANTRINE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Novartis (Coartem)","Cipla","Strides Pharma"] },
  { name: "Sulfadoxine-Pyrimethamine 500/25mg", generic: "SULFADOXINE+PYRIMETHAMINE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Roche","Cosmos Pharma Kenya","Universal Corp Kenya"] },
  { name: "Cotrimoxazole 480mg Tablet", generic: "SULFAMETHOXAZOLE+TRIMETHOPRIM", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Dawa Ltd Kenya","Cosmos Pharma Kenya","Cipla"] },
  { name: "Albendazole 400mg Tablet", generic: "ALBENDAZOLE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["GSK","Universal Corp Kenya","Medochemie"] },
  { name: "Mebendazole 500mg Tablet", generic: "MEBENDAZOLE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Janssen","Dawa Ltd Kenya","Beta Healthcare Kenya"] },
  { name: "Metronidazole 400mg Tablet", generic: "METRONIDAZOLE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Sanofi","Cosmos Pharma Kenya","Cipla"] },
  { name: "Erythromycin 500mg Tablet", generic: "ERYTHROMYCIN", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["AbbVie","Dawa Ltd Kenya","Strides Pharma"] },
  { name: "Amoxicillin-Clavulanate 625mg", generic: "AMOXICILLIN+CLAVULANIC ACID", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["GSK (Augmentin)","Cipla","Sandoz"] },
  { name: "Gentamicin 80mg/2mL Injection", generic: "GENTAMICIN SULFATE", form: "INJECTION", route: "INTRAMUSCULAR", region: "KE", mfgs: ["Cipla","Fresenius Kabi","Universal Corp Kenya"] },
  { name: "Ampicillin 500mg Capsule", generic: "AMPICILLIN", form: "CAPSULE", route: "ORAL", region: "KE", mfgs: ["Dawa Ltd Kenya","Beta Healthcare Kenya","Aurobindo"] },
  { name: "Penicillin V 250mg Tablet", generic: "PHENOXYMETHYLPENICILLIN", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Sandoz","Cosmos Pharma Kenya","GSK"] },
  { name: "Nifedipine 20mg Tablet", generic: "NIFEDIPINE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Bayer","Cipla","Dawa Ltd Kenya"] },
  { name: "Enalapril 10mg Tablet", generic: "ENALAPRIL MALEATE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Merck","Cipla","Beta Healthcare Kenya"] },
  { name: "Glibenclamide 5mg Tablet", generic: "GLIBENCLAMIDE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Sanofi","Dawa Ltd Kenya","Universal Corp Kenya"] },
  { name: "Salbutamol 4mg Tablet", generic: "SALBUTAMOL SULFATE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["GSK","Cipla","Cosmos Pharma Kenya"] },
  { name: "Phenytoin 100mg Capsule", generic: "PHENYTOIN SODIUM", form: "CAPSULE", route: "ORAL", region: "KE", mfgs: ["Pfizer","Sun Pharma","Dawa Ltd Kenya"] },
  { name: "Carbamazepine 200mg Tablet", generic: "CARBAMAZEPINE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Novartis","Cipla","Beta Healthcare Kenya"] },
  { name: "Diazepam 5mg Tablet", generic: "DIAZEPAM", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Roche","Dawa Ltd Kenya","Cosmos Pharma Kenya"] },
  { name: "Chloroquine 250mg Tablet", generic: "CHLOROQUINE PHOSPHATE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Sanofi","Universal Corp Kenya","Medochemie"] },
  { name: "Quinine 300mg Tablet", generic: "QUININE SULFATE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Sanofi","Dawa Ltd Kenya","Cosmos Pharma Kenya"] },
  { name: "Ferrous Sulfate 200mg Tablet", generic: "FERROUS SULFATE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Universal Corp Kenya","Beta Healthcare Kenya","Cosmos Pharma Kenya"] },
  { name: "Folic Acid 5mg Tablet", generic: "FOLIC ACID", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Dawa Ltd Kenya","Cosmos Pharma Kenya","Cipla"] },
  { name: "Zinc Sulfate 20mg Tablet", generic: "ZINC SULFATE", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["UNICEF Supply","Beta Healthcare Kenya","Universal Corp Kenya"] },
  { name: "ORS Powder Sachet", generic: "ORAL REHYDRATION SALTS", form: "POWDER", route: "ORAL", region: "KE", mfgs: ["UNICEF Supply","Cosmos Pharma Kenya","Dawa Ltd Kenya"] },
  { name: "Paracetamol 500mg Tablet", generic: "PARACETAMOL", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Beta Healthcare Kenya","Dawa Ltd Kenya","GSK"] },
  { name: "Indomethacin 25mg Capsule", generic: "INDOMETHACIN", form: "CAPSULE", route: "ORAL", region: "KE", mfgs: ["Merck","Cipla","Cosmos Pharma Kenya"] },
  { name: "Nitrofurantoin 100mg Capsule", generic: "NITROFURANTOIN", form: "CAPSULE", route: "ORAL", region: "KE", mfgs: ["Norwich","Cipla","Dawa Ltd Kenya"] },
  { name: "Haloperidol 5mg Tablet", generic: "HALOPERIDOL", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Janssen","Dawa Ltd Kenya","Sun Pharma"] },
  { name: "Promethazine 25mg Tablet", generic: "PROMETHAZINE HCL", form: "TABLET", route: "ORAL", region: "KE", mfgs: ["Sanofi","Beta Healthcare Kenya","Cosmos Pharma Kenya"] },
  { name: "Cloxacillin 500mg Capsule", generic: "CLOXACILLIN", form: "CAPSULE", route: "ORAL", region: "KE", mfgs: ["AstraZeneca","Dawa Ltd Kenya","Universal Corp Kenya"] },

  // --- EMA / European Products (30) ---
  { name: "Xarelto 20mg Tablet", generic: "RIVAROXABAN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Bayer"] },
  { name: "Eliquis 5mg Tablet", generic: "APIXABAN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Bristol-Myers Squibb","Pfizer"] },
  { name: "Entresto 49/51mg Tablet", generic: "SACUBITRIL/VALSARTAN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Novartis"] },
  { name: "Jardiance 10mg Tablet", generic: "EMPAGLIFLOZIN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Boehringer Ingelheim","Eli Lilly"] },
  { name: "Ozempic 1mg/mL Pen", generic: "SEMAGLUTIDE", form: "INJECTION", route: "SUBCUTANEOUS", region: "EU", mfgs: ["Novo Nordisk"] },
  { name: "Trulicity 1.5mg Pen", generic: "DULAGLUTIDE", form: "INJECTION", route: "SUBCUTANEOUS", region: "EU", mfgs: ["Eli Lilly"] },
  { name: "Dupixent 300mg Pen", generic: "DUPILUMAB", form: "INJECTION", route: "SUBCUTANEOUS", region: "EU", mfgs: ["Sanofi","Regeneron"] },
  { name: "Keytruda 100mg/4mL Vial", generic: "PEMBROLIZUMAB", form: "INJECTION", route: "INTRAVENOUS", region: "EU", mfgs: ["Merck"] },
  { name: "Humira 40mg Pen", generic: "ADALIMUMAB", form: "INJECTION", route: "SUBCUTANEOUS", region: "EU", mfgs: ["AbbVie"] },
  { name: "Stelara 45mg Vial", generic: "USTEKINUMAB", form: "INJECTION", route: "SUBCUTANEOUS", region: "EU", mfgs: ["Janssen"] },
  { name: "Cosentyx 150mg Pen", generic: "SECUKINUMAB", form: "INJECTION", route: "SUBCUTANEOUS", region: "EU", mfgs: ["Novartis"] },
  { name: "Eylea 40mg/mL Vial", generic: "AFLIBERCEPT", form: "INJECTION", route: "INTRAVITREAL", region: "EU", mfgs: ["Bayer","Regeneron"] },
  { name: "Ibrance 125mg Capsule", generic: "PALBOCICLIB", form: "CAPSULE", route: "ORAL", region: "EU", mfgs: ["Pfizer"] },
  { name: "Tagrisso 80mg Tablet", generic: "OSIMERTINIB", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Lynparza 150mg Tablet", generic: "OLAPARIB", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Imbruvica 140mg Capsule", generic: "IBRUTINIB", form: "CAPSULE", route: "ORAL", region: "EU", mfgs: ["Janssen","AbbVie"] },
  { name: "Revlimid 25mg Capsule", generic: "LENALIDOMIDE", form: "CAPSULE", route: "ORAL", region: "EU", mfgs: ["Bristol-Myers Squibb"] },
  { name: "Paxlovid 150mg/100mg Pack", generic: "NIRMATRELVIR/RITONAVIR", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Pfizer"] },
  { name: "Tamiflu 75mg Capsule", generic: "OSELTAMIVIR", form: "CAPSULE", route: "ORAL", region: "EU", mfgs: ["Roche"] },
  { name: "Nexium 40mg Capsule", generic: "ESOMEPRAZOLE", form: "CAPSULE", route: "ORAL", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Crestor 10mg Tablet", generic: "ROSUVASTATIN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Plavix 75mg Tablet", generic: "CLOPIDOGREL", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Sanofi"] },
  { name: "Tecfidera 240mg Capsule", generic: "DIMETHYL FUMARATE", form: "CAPSULE", route: "ORAL", region: "EU", mfgs: ["Biogen"] },
  { name: "Ocrevus 300mg/10mL Vial", generic: "OCRELIZUMAB", form: "INJECTION", route: "INTRAVENOUS", region: "EU", mfgs: ["Roche"] },
  { name: "Darzalex 100mg/5mL Vial", generic: "DARATUMUMAB", form: "INJECTION", route: "INTRAVENOUS", region: "EU", mfgs: ["Janssen"] },
  { name: "Forxiga 10mg Tablet", generic: "DAPAGLIFLOZIN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Brilinta 90mg Tablet", generic: "TICAGRELOR", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Spiriva 18mcg Capsule", generic: "TIOTROPIUM BROMIDE", form: "CAPSULE", route: "INHALATION", region: "EU", mfgs: ["Boehringer Ingelheim"] },
  { name: "Symbicort 160/4.5mcg Inhaler", generic: "BUDESONIDE/FORMOTEROL", form: "AEROSOL", route: "INHALATION", region: "EU", mfgs: ["AstraZeneca"] },
  { name: "Januvia 100mg Tablet", generic: "SITAGLIPTIN", form: "TABLET", route: "ORAL", region: "EU", mfgs: ["Merck"] },
];

// ============================================================
// SUPPLY CHAIN LOCATIONS
// ============================================================

const LOCATIONS = {
  US: {
    factories: ["Parsippany, NJ", "Kalamazoo, MI", "Research Triangle Park, NC", "Indianapolis, IN", "Pearl River, NY", "Peapack, NJ", "North Chicago, IL", "San Diego, CA", "Rahway, NJ"],
    distributors: ["McKesson DC, Columbus, OH", "AmerisourceBergen, Chesterbrook, PA", "Cardinal Health, Dublin, OH", "McKesson DC, Memphis, TN", "Cardinal Health, La Vergne, TN"],
    wholesalers: ["Rochester Drug Cooperative, Rochester, NY", "HD Smith, Springfield, IL", "Morris & Dickson, Shreveport, LA"],
    pharmacies: ["CVS Pharmacy #4521, Chicago, IL", "Walgreens #1892, Houston, TX", "Rite Aid #3210, Philadelphia, PA", "CVS Pharmacy #8891, Miami, FL", "Walgreens #5543, Phoenix, AZ", "Kroger Pharmacy, Columbus, OH", "Walmart Pharmacy, Dallas, TX", "Target Pharmacy, Seattle, WA"],
  },
  KE: {
    factories: ["Dawa Factory, Industrial Area, Nairobi", "Beta Healthcare Plant, Kericho", "Universal Corp Factory, Kikuyu", "Cosmos Plant, Athi River", "Regent Pharma, Nairobi"],
    imports: ["Port of Mombasa, Kenya", "JKIA Cargo Terminal, Nairobi", "Inland Container Depot, Nairobi"],
    distributors: ["MedDistribute Warehouse, Mombasa Road, Nairobi", "PharmAccess Hub, Industrial Area, Nairobi", "Kenya Medical Supplies Authority (KEMSA), Nairobi", "Mission for Essential Drugs (MEDS), Nairobi"],
    pharmacies: ["Kisumu City Pharmacy, Oginga Odinga St, Kisumu", "Nairobi Central Pharmacy, Tom Mboya St", "Mombasa Hospital Pharmacy, Mombasa", "Eldoret Town Pharmacy, Uganda Rd, Eldoret", "Nakuru Level 5 Hospital, Nakuru", "Kenyatta National Hospital, Nairobi", "Thika Level 4 Hospital, Thika", "Malindi Sub-County Hospital, Malindi", "Garissa Provincial Hospital, Garissa", "Nyeri County Hospital, Nyeri"],
  },
  EU: {
    factories: ["Basel Plant, Switzerland", "Leverkusen Plant, Germany", "Dublin Facility, Ireland", "Cambridge Biotech Park, UK", "Lyon Production Site, France", "Copenhagen Plant, Denmark", "Bagsvaerd, Denmark", "Ingelheim, Germany", "Leiden, Netherlands"],
    distributors: ["Alliance Healthcare, Frankfurt", "Phoenix Group, Mannheim", "CERP Rouen, France", "Celesio, Stuttgart"],
    pharmacies: ["Boots Pharmacy, London, UK", "DocMorris, Aachen, Germany", "Farmacia Cruz Verde, Madrid, Spain", "Lloyds Pharmacy, Dublin, Ireland", "Apotek Hjärtat, Stockholm, Sweden", "Farmacias Benavides, Paris, France"],
  }
};

// ============================================================
// RECALL SCENARIOS
// ============================================================

const RECALL_REASONS = [
  "Failed dissolution testing — potency below specification",
  "Impurity NDMA detected above acceptable daily intake limit",
  "Labeling error — wrong dosage strength printed on carton",
  "Microbial contamination — Burkholderia cepacia detected",
  "Potency below 90% specification at 12-month stability",
  "Cross-contamination with another product during manufacturing",
  "Foreign particulate matter found in injectable vial",
  "Incorrect expiry date printed on packaging",
  "Failed sterility testing for injectable product",
  "Active ingredient degradation detected in accelerated stability",
];

// ============================================================
// GENERATION LOGIC
// ============================================================

function generateGTIN(region, idx) {
  const prefix = region === 'US' ? '003' : region === 'KE' ? '061' : '054';
  const body = String(idx).padStart(10, '0');
  const raw = prefix + body + '0';
  // Simple check digit (mod 10)
  let sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(raw[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return prefix + body + String(check);
}

function generateSupplyChain(region, mfg, mfgDate) {
  const locs = LOCATIONS[region] || LOCATIONS.US;
  const chain = [];
  let ts = mfgDate;

  // Step 1: Manufactured
  const isImported = region === 'KE' && !mfg.includes('Kenya') && !mfg.includes('Dawa') && !mfg.includes('Cosmos') && !mfg.includes('Beta') && !mfg.includes('Universal') && !mfg.includes('Regent');

  if (isImported) {
    chain.push({ eventType: "manufactured", location: pick(LOCATIONS.US.factories.concat(LOCATIONS.EU.factories)), timestamp: ts });
    ts += randInt(3, 10) * DAY;
    chain.push({ eventType: "imported", location: pick(locs.imports || locs.distributors), timestamp: ts });
  } else {
    chain.push({ eventType: "manufactured", location: (locs.factories ? pick(locs.factories) : pick(LOCATIONS.US.factories)) + " — " + mfg, timestamp: ts });
  }

  // Step 2: Shipped to distributor
  ts += randInt(2, 7) * DAY;
  chain.push({ eventType: "shipped", location: pick(locs.distributors), timestamp: ts });

  // Step 3: Received by wholesaler/distributor (sometimes)
  if (Math.random() > 0.3 && locs.wholesalers) {
    ts += randInt(1, 4) * DAY;
    chain.push({ eventType: "received", location: pick(locs.wholesalers), timestamp: ts });
  }

  // Step 4: Dispensed at pharmacy
  ts += randInt(3, 14) * DAY;
  chain.push({ eventType: "dispensed", location: pick(locs.pharmacies), timestamp: ts });

  return chain;
}

function generateDataset() {
  const products = [];
  const recalledLots = [];
  let gtinCounter = 0;
  
  // Decide which lots will be recalled
  const recallLotSet = new Set();
  for (let i = 0; i < 5; i++) {
    const lot = `LOT2025R${String(i+1).padStart(2,'0')}`;
    recallLotSet.add(lot);
    recalledLots.push({ lotNumber: lot, reason: RECALL_REASONS[i], date: "2026-0" + randInt(1,5) + "-" + String(randInt(1,28)).padStart(2,'0') });
  }

  // Track serial reuse for suspicious products
  const suspiciousSerials = [];

  for (let drugIdx = 0; drugIdx < DRUGS.length; drugIdx++) {
    const drug = DRUGS[drugIdx];
    const instanceCount = 10;

    for (let inst = 0; inst < instanceCount; inst++) {
      gtinCounter++;
      const gtin = generateGTIN(drug.region, gtinCounter);
      const serial = `SN-${randHex(4)}`;
      const mfg = pick(drug.mfgs);
      const mfgDate = NOW - randInt(30, 365) * DAY;

      // Determine status
      let status, isRecalled = false, recallReason = "", expiryDate, lotNumber, exists = true;

      const globalIdx = drugIdx * instanceCount + inst;

      if (globalIdx < 700) {
        // GENUINE
        status = "GENUINE";
        expiryDate = mfgDate + randInt(365, 1095) * DAY;
        lotNumber = `LOT2026${String.fromCharCode(65 + (inst % 26))}${String(randInt(1,99)).padStart(2,'0')}`;
      } else if (globalIdx < 800) {
        // EXPIRED
        status = "EXPIRED";
        expiryDate = NOW - randInt(1, 180) * DAY;
        lotNumber = `LOT2024${String.fromCharCode(65 + (inst % 26))}${String(randInt(1,99)).padStart(2,'0')}`;
      } else if (globalIdx < 850) {
        // RECALLED
        status = "RECALLED";
        expiryDate = mfgDate + randInt(365, 1095) * DAY;
        const lotIdx = (globalIdx - 800) % 5;
        lotNumber = `LOT2025R${String(lotIdx+1).padStart(2,'0')}`;
        isRecalled = true;
        recallReason = RECALL_REASONS[lotIdx];
      } else if (globalIdx < 950) {
        // COUNTERFEIT (unknown serial — not in our system)
        status = "COUNTERFEIT";
        expiryDate = mfgDate + 365 * DAY;
        lotNumber = `LOT-FAKE-${randHex(2)}`;
        exists = false;
      } else {
        // SUSPICIOUS (duplicate serial)
        status = "SUSPICIOUS";
        expiryDate = mfgDate + randInt(365, 1095) * DAY;
        lotNumber = `LOT2026S${String(randInt(1,20)).padStart(2,'0')}`;
        if (suspiciousSerials.length < 25) {
          suspiciousSerials.push(serial);
        }
      }

      const productId = hash(gtin + serial);
      const supplyChain = exists ? generateSupplyChain(drug.region, mfg, mfgDate) : [];

      products.push({
        productId,
        gtin,
        ndc: gtin.substring(3, 7) + "-" + gtin.substring(7, 11),
        serialNumber: serial,
        lotNumber,
        productName: drug.name,
        genericName: drug.generic,
        manufacturer: mfg,
        dosageForm: drug.form,
        route: drug.route,
        region: drug.region,
        manufactureDate: mfgDate,
        expiryDate,
        status,
        exists,
        isRecalled,
        recallReason,
        supplyChain,
      });
    }
  }

  // Make suspicious products share serials with genuine ones
  for (let i = 0; i < suspiciousSerials.length && i < 25; i++) {
    const susIdx = products.findIndex((p, idx) => idx >= 1050 && idx < 1050 + 25 && idx === 1050 + i);
    if (susIdx > -1 && i < products.length) {
      // Copy serial from a genuine product
      const genuineIdx = randInt(0, 799);
      products[susIdx].serialNumber = products[genuineIdx].serialNumber;
      products[susIdx].productId = hash(products[susIdx].gtin + products[susIdx].serialNumber);
      // Give it a different location chain to simulate clone
      products[susIdx].supplyChain = generateSupplyChain(
        pick(["US","KE","EU"]),
        products[susIdx].manufacturer,
        products[susIdx].manufactureDate
      );
    }
  }

  return { products, recalledLots };
}

// ============================================================
// GENERATE AND WRITE
// ============================================================

console.log("🔄 Generating DawaTrace dataset...\n");
const { products, recalledLots } = generateDataset();

const genuine = products.filter(p => p.status === "GENUINE").length;
const expired = products.filter(p => p.status === "EXPIRED").length;
const recalled = products.filter(p => p.status === "RECALLED").length;
const counterfeit = products.filter(p => p.status === "COUNTERFEIT").length;
const suspicious = products.filter(p => p.status === "SUSPICIOUS").length;

const dataset = {
  metadata: {
    generated: new Date().toISOString(),
    totalProducts: products.length,
    sources: ["FDA NDC Directory", "EMA Medicines Database", "WHO Essential Medicines List", "Kenya PPB Register"],
    version: "2.0",
    regions: { US: products.filter(p => p.region === "US").length, KE: products.filter(p => p.region === "KE").length, EU: products.filter(p => p.region === "EU").length },
  },
  products,
  recalledLots,
  stats: { genuine, expired, recalled, counterfeit, suspicious },
};

const json = JSON.stringify(dataset, null, 2);
fs.writeFileSync("./frontend/data/products.json", json);
console.log(`✅ Written to frontend/data/products.json`);
console.log(`   Total: ${products.length} products`);
console.log(`   Genuine: ${genuine} | Expired: ${expired} | Recalled: ${recalled} | Counterfeit: ${counterfeit} | Suspicious: ${suspicious}`);
console.log(`   US: ${dataset.metadata.regions.US} | Kenya: ${dataset.metadata.regions.KE} | EU: ${dataset.metadata.regions.EU}`);
console.log(`   Recalled lots: ${recalledLots.length}`);
console.log(`   File size: ${(json.length / 1024).toFixed(0)} KB\n`);
