// ============================================================
// DawaTrace — Kenya Pharmaceutical Import Database
// Covers: WHO Prequalified, Indian Generics, EU/UK brands,
//         South African imports, East African local products
// ============================================================

var KenyaPharmaDB = {

  // WHO Prequalified Medicines commonly found in Kenya
  // Source: WHO Prequalification Programme (extranet.who.int/pqweb)
  WHO_PREQUALIFIED: [
    // Antiretrovirals (HIV) — Kenya's largest prequalified drug category
    {b:"Tenofovir/Lamivudine/Dolutegravir",g:"TLD",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Tenofovir/Lamivudine/Efavirenz",g:"TLE",mfg:"Mylan Laboratories",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Tenofovir/Emtricitabine",g:"TENOFOVIR+EMTRICITABINE",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Atripla",g:"EFAVIRENZ+EMTRICITABINE+TENOFOVIR",mfg:"Gilead Sciences",src:"US",cat:"Antiretroviral",pq:true},
    {b:"Truvada",g:"EMTRICITABINE+TENOFOVIR",mfg:"Gilead Sciences",src:"US",cat:"Antiretroviral",pq:true},
    {b:"Dolutegravir 50mg",g:"DOLUTEGRAVIR",mfg:"Hetero Labs",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Efavirenz 600mg",g:"EFAVIRENZ",mfg:"Strides Pharma",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Lopinavir/Ritonavir",g:"LOPINAVIR+RITONAVIR",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Nevirapine 200mg",g:"NEVIRAPINE",mfg:"Aurobindo Pharma",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Zidovudine/Lamivudine",g:"ZIDOVUDINE+LAMIVUDINE",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Abacavir 300mg",g:"ABACAVIR",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Atazanavir 300mg",g:"ATAZANAVIR",mfg:"Mylan Laboratories",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Darunavir 600mg",g:"DARUNAVIR",mfg:"Hetero Labs",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Raltegravir 400mg",g:"RALTEGRAVIR",mfg:"Merck Sharp & Dohme",src:"US",cat:"Antiretroviral",pq:true},
    {b:"Lamivudine 150mg",g:"LAMIVUDINE",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Tenofovir Alafenamide",g:"TAF",mfg:"Cipla Ltd",src:"India",cat:"Antiretroviral",pq:true},
    {b:"Cabotegravir 30mg",g:"CABOTEGRAVIR",mfg:"ViiV Healthcare",src:"UK",cat:"Antiretroviral PrEP",pq:true},
    {b:"Lenacapavir",g:"LENACAPAVIR",mfg:"Gilead Sciences",src:"US",cat:"Antiretroviral",pq:true},

    // Anti-TB drugs
    {b:"Rifampicin/Isoniazid/Pyrazinamide/Ethambutol",g:"RHZE",mfg:"Lupin Ltd",src:"India",cat:"Anti-TB",pq:true},
    {b:"Rifampicin/Isoniazid",g:"RH",mfg:"Macleods Pharma",src:"India",cat:"Anti-TB",pq:true},
    {b:"Bedaquiline 100mg",g:"BEDAQUILINE",mfg:"Janssen Pharmaceutica",src:"Belgium",cat:"Anti-TB (MDR)",pq:true},
    {b:"Delamanid 50mg",g:"DELAMANID",mfg:"Otsuka Pharmaceutical",src:"Japan",cat:"Anti-TB (MDR)",pq:true},
    {b:"Pretomanid 200mg",g:"PRETOMANID",mfg:"TB Alliance/Mylan",src:"India",cat:"Anti-TB (MDR)",pq:true},
    {b:"Linezolid 600mg",g:"LINEZOLID",mfg:"Hetero Labs",src:"India",cat:"Anti-TB (MDR)",pq:true},
    {b:"Rifampicin 150mg",g:"RIFAMPICIN",mfg:"Lupin Ltd",src:"India",cat:"Anti-TB",pq:true},
    {b:"Isoniazid 300mg",g:"ISONIAZID",mfg:"Macleods Pharma",src:"India",cat:"Anti-TB",pq:true},
    {b:"Ethambutol 400mg",g:"ETHAMBUTOL",mfg:"Macleods Pharma",src:"India",cat:"Anti-TB",pq:true},
    {b:"Pyrazinamide 500mg",g:"PYRAZINAMIDE",mfg:"Lupin Ltd",src:"India",cat:"Anti-TB",pq:true},

    // Antimalarials
    {b:"Coartem",g:"ARTEMETHER+LUMEFANTRINE",mfg:"Novartis",src:"Switzerland",cat:"Antimalarial",pq:true},
    {b:"Eurartesim",g:"DIHYDROARTEMISININ+PIPERAQUINE",mfg:"Sigma-Tau",src:"Italy",cat:"Antimalarial",pq:true},
    {b:"Artesunate 60mg injection",g:"ARTESUNATE",mfg:"Guilin Pharmaceutical",src:"China",cat:"Antimalarial (severe)",pq:true},
    {b:"Artesunate/Amodiaquine",g:"ARTESUNATE+AMODIAQUINE",mfg:"Sanofi-Aventis",src:"France",cat:"Antimalarial",pq:true},
    {b:"Artemether/Lumefantrine dispersible",g:"AL DISPERSIBLE",mfg:"Cipla Ltd",src:"India",cat:"Antimalarial (pediatric)",pq:true},
    {b:"Sulfadoxine-Pyrimethamine",g:"SP",mfg:"Guilin Pharmaceutical",src:"China",cat:"Antimalarial (IPTp)",pq:true},

    // Hepatitis
    {b:"Sofosbuvir 400mg",g:"SOFOSBUVIR",mfg:"Mylan Laboratories",src:"India",cat:"Hepatitis C",pq:true},
    {b:"Sofosbuvir/Daclatasvir",g:"SOF+DCV",mfg:"Cipla Ltd",src:"India",cat:"Hepatitis C",pq:true},
    {b:"Sofosbuvir/Velpatasvir",g:"SOF/VEL",mfg:"Mylan Laboratories",src:"India",cat:"Hepatitis C",pq:true},
    {b:"Tenofovir for HBV",g:"TENOFOVIR",mfg:"Cipla Ltd",src:"India",cat:"Hepatitis B",pq:true},
    {b:"Entecavir 0.5mg",g:"ENTECAVIR",mfg:"Hetero Labs",src:"India",cat:"Hepatitis B",pq:true},

    // Reproductive Health
    {b:"Misoprostol 200mcg",g:"MISOPROSTOL",mfg:"Cipla Ltd",src:"India",cat:"Reproductive Health",pq:true},
    {b:"Oxytocin 10IU injection",g:"OXYTOCIN",mfg:"Biological E",src:"India",cat:"Obstetric",pq:true},
    {b:"Magnesium Sulfate injection",g:"MAGNESIUM SULFATE",mfg:"Cipla Ltd",src:"India",cat:"Eclampsia",pq:true},

    // Vaccines
    {b:"Mosquirix",g:"RTS,S/AS01",mfg:"GSK Biologicals",src:"Belgium",cat:"Malaria Vaccine",pq:true},
    {b:"Pentavalent Vaccine",g:"DTP-HEP B-HIB",mfg:"Biological E",src:"India",cat:"Vaccine",pq:true},
    {b:"Measles/Rubella Vaccine",g:"MR VACCINE",mfg:"Serum Institute India",src:"India",cat:"Vaccine",pq:true},
    {b:"Rotavirus Vaccine (Rotasiil)",g:"ROTAVIRUS",mfg:"Serum Institute India",src:"India",cat:"Vaccine",pq:true},
    {b:"HPV Vaccine (Cecolin)",g:"HPV VACCINE",mfg:"Innovax",src:"China",cat:"Vaccine",pq:true},
    {b:"COVID-19 Vaccine (Covishield)",g:"ChAdOx1-S",mfg:"Serum Institute India",src:"India",cat:"Vaccine",pq:true},
  ],

  // Top Indian generic brands commonly imported into Kenya
  INDIA_GENERICS: [
    // Cipla products
    {b:"Duovir-N",g:"LAMIVUDINE+ZIDOVUDINE+NEVIRAPINE",mfg:"Cipla Ltd",cat:"Antiretroviral"},
    {b:"Cipla Amoxicillin 500mg",g:"AMOXICILLIN",mfg:"Cipla Ltd",cat:"Antibiotic"},
    {b:"Cipla Azithromycin 500mg",g:"AZITHROMYCIN",mfg:"Cipla Ltd",cat:"Antibiotic"},
    {b:"Cipla Metformin 500mg",g:"METFORMIN",mfg:"Cipla Ltd",cat:"Antidiabetic"},
    {b:"Cipmox",g:"AMOXICILLIN",mfg:"Cipla Ltd",cat:"Antibiotic"},
    {b:"Ciplox",g:"CIPROFLOXACIN",mfg:"Cipla Ltd",cat:"Antibiotic"},

    // Sun Pharma products
    {b:"Sunpharma Amlodipine 5mg",g:"AMLODIPINE",mfg:"Sun Pharmaceutical",cat:"Antihypertensive"},
    {b:"Sunpharma Losartan 50mg",g:"LOSARTAN",mfg:"Sun Pharmaceutical",cat:"Antihypertensive"},
    {b:"Sunpharma Atorvastatin 20mg",g:"ATORVASTATIN",mfg:"Sun Pharmaceutical",cat:"Statin"},
    {b:"Sunpharma Pantoprazole 40mg",g:"PANTOPRAZOLE",mfg:"Sun Pharmaceutical",cat:"PPI"},

    // Aurobindo products
    {b:"Auro Amoxicillin/Clavulanate",g:"AMOXICILLIN+CLAVULANIC ACID",mfg:"Aurobindo Pharma",cat:"Antibiotic"},
    {b:"Auro Cephalexin 500mg",g:"CEPHALEXIN",mfg:"Aurobindo Pharma",cat:"Antibiotic"},
    {b:"Auro Metronidazole 400mg",g:"METRONIDAZOLE",mfg:"Aurobindo Pharma",cat:"Antibiotic"},

    // Strides Pharma
    {b:"Strides Ibuprofen 400mg",g:"IBUPROFEN",mfg:"Strides Pharma",cat:"NSAID"},
    {b:"Strides Ciprofloxacin 500mg",g:"CIPROFLOXACIN",mfg:"Strides Pharma",cat:"Antibiotic"},

    // Dr. Reddy's
    {b:"Omez",g:"OMEPRAZOLE",mfg:"Dr. Reddy's Labs",cat:"PPI"},
    {b:"Stamlo",g:"AMLODIPINE",mfg:"Dr. Reddy's Labs",cat:"Antihypertensive"},
    {b:"Razo",g:"RABEPRAZOLE",mfg:"Dr. Reddy's Labs",cat:"PPI"},

    // Lupin
    {b:"Lupin Cefixime 200mg",g:"CEFIXIME",mfg:"Lupin Ltd",cat:"Antibiotic"},
    {b:"Lupin Ethambutol 400mg",g:"ETHAMBUTOL",mfg:"Lupin Ltd",cat:"Anti-TB"},

    // Hetero
    {b:"Hetero Tenofovir/Lamivudine/Dolutegravir",g:"TLD",mfg:"Hetero Labs",cat:"Antiretroviral"},
    {b:"Hetero Sofosbuvir 400mg",g:"SOFOSBUVIR",mfg:"Hetero Labs",cat:"Hepatitis C"},

    // Mankind Pharma
    {b:"Moxikind",g:"AMOXICILLIN",mfg:"Mankind Pharma",cat:"Antibiotic"},
    {b:"Moxikind-CV",g:"AMOXICILLIN+CLAVULANIC ACID",mfg:"Mankind Pharma",cat:"Antibiotic"},

    // Glenmark
    {b:"Glenmark Fluconazole 150mg",g:"FLUCONAZOLE",mfg:"Glenmark Pharma",cat:"Antifungal"},
    {b:"Candid-B",g:"CLOTRIMAZOLE+BECLOMETHASONE",mfg:"Glenmark Pharma",cat:"Antifungal"},

    // Torrent Pharma
    {b:"Torrent Losartan/HCTZ",g:"LOSARTAN+HYDROCHLOROTHIAZIDE",mfg:"Torrent Pharma",cat:"Antihypertensive"},
    {b:"Torrent Telmisartan 40mg",g:"TELMISARTAN",mfg:"Torrent Pharma",cat:"Antihypertensive"},

    // Other common generics from India
    {b:"Ceftriaxone 1g injection",g:"CEFTRIAXONE",mfg:"Various (India)",cat:"Antibiotic"},
    {b:"Diclofenac 50mg",g:"DICLOFENAC",mfg:"Various (India)",cat:"NSAID"},
    {b:"Metoclopramide 10mg",g:"METOCLOPRAMIDE",mfg:"Various (India)",cat:"Antiemetic"},
    {b:"Tramadol 50mg",g:"TRAMADOL",mfg:"Various (India)",cat:"Analgesic"},
    {b:"Cetirizine 10mg",g:"CETIRIZINE",mfg:"Various (India)",cat:"Antihistamine"},
    {b:"Salbutamol inhaler",g:"SALBUTAMOL",mfg:"Cipla Ltd",cat:"Bronchodilator"},
    {b:"Prednisolone 5mg",g:"PREDNISOLONE",mfg:"Various (India)",cat:"Corticosteroid"},
    {b:"Furosemide 40mg",g:"FUROSEMIDE",mfg:"Various (India)",cat:"Diuretic"},
    {b:"Hydrochlorothiazide 25mg",g:"HYDROCHLOROTHIAZIDE",mfg:"Various (India)",cat:"Diuretic"},
    {b:"Glibenclamide 5mg",g:"GLIBENCLAMIDE",mfg:"Various (India)",cat:"Antidiabetic"},
    {b:"Insulin Soluble 100IU",g:"INSULIN",mfg:"Biocon",cat:"Antidiabetic"},
    {b:"Insulin Glargine",g:"INSULIN GLARGINE",mfg:"Biocon",cat:"Antidiabetic"},
  ],

  // EU/UK brands commonly found in Kenya (imported or licensed)
  EU_UK_BRANDS: [
    {b:"Augmentin",g:"AMOXICILLIN+CLAVULANIC ACID",mfg:"GSK",src:"UK",cat:"Antibiotic"},
    {b:"Flagyl",g:"METRONIDAZOLE",mfg:"Sanofi",src:"France",cat:"Antibiotic"},
    {b:"Norvasc",g:"AMLODIPINE",mfg:"Pfizer",src:"US/EU",cat:"Antihypertensive"},
    {b:"Lipitor",g:"ATORVASTATIN",mfg:"Pfizer",src:"US/EU",cat:"Statin"},
    {b:"Zithromax",g:"AZITHROMYCIN",mfg:"Pfizer",src:"US/EU",cat:"Antibiotic"},
    {b:"Losec",g:"OMEPRAZOLE",mfg:"AstraZeneca",src:"UK/Sweden",cat:"PPI"},
    {b:"Nexium",g:"ESOMEPRAZOLE",mfg:"AstraZeneca",src:"UK/Sweden",cat:"PPI"},
    {b:"Crestor",g:"ROSUVASTATIN",mfg:"AstraZeneca",src:"UK/Sweden",cat:"Statin"},
    {b:"Glucophage",g:"METFORMIN",mfg:"Merck Serono",src:"France",cat:"Antidiabetic"},
    {b:"Lantus",g:"INSULIN GLARGINE",mfg:"Sanofi",src:"France",cat:"Antidiabetic"},
    {b:"Novorapid",g:"INSULIN ASPART",mfg:"Novo Nordisk",src:"Denmark",cat:"Antidiabetic"},
    {b:"Novomix",g:"INSULIN ASPART BIPHASIC",mfg:"Novo Nordisk",src:"Denmark",cat:"Antidiabetic"},
    {b:"Humulin",g:"INSULIN HUMAN",mfg:"Eli Lilly",src:"US",cat:"Antidiabetic"},
    {b:"Januvia",g:"SITAGLIPTIN",mfg:"MSD",src:"US/EU",cat:"Antidiabetic"},
    {b:"Jardiance",g:"EMPAGLIFLOZIN",mfg:"Boehringer Ingelheim",src:"Germany",cat:"Antidiabetic"},
    {b:"Ventolin",g:"SALBUTAMOL",mfg:"GSK",src:"UK",cat:"Bronchodilator"},
    {b:"Seretide",g:"SALMETEROL+FLUTICASONE",mfg:"GSK",src:"UK",cat:"Asthma"},
    {b:"Voltaren",g:"DICLOFENAC",mfg:"Novartis",src:"Switzerland",cat:"NSAID"},
    {b:"Brufen",g:"IBUPROFEN",mfg:"Abbott/Mylan",src:"US/India",cat:"NSAID"},
    {b:"Panadol",g:"PARACETAMOL",mfg:"GSK",src:"UK",cat:"Analgesic"},
    {b:"Calpol",g:"PARACETAMOL (pediatric)",mfg:"GSK",src:"UK",cat:"Analgesic"},
    {b:"Doliprane",g:"PARACETAMOL",mfg:"Sanofi",src:"France",cat:"Analgesic"},
    {b:"Piriton",g:"CHLORPHENAMINE",mfg:"GSK",src:"UK",cat:"Antihistamine"},
    {b:"Amoxil",g:"AMOXICILLIN",mfg:"GSK",src:"UK",cat:"Antibiotic"},
    {b:"Rocephin",g:"CEFTRIAXONE",mfg:"Roche",src:"Switzerland",cat:"Antibiotic"},
    {b:"Cipro",g:"CIPROFLOXACIN",mfg:"Bayer",src:"Germany",cat:"Antibiotic"},
    {b:"Tegretol",g:"CARBAMAZEPINE",mfg:"Novartis",src:"Switzerland",cat:"Antiepileptic"},
    {b:"Epanutin",g:"PHENYTOIN",mfg:"Pfizer",src:"US/EU",cat:"Antiepileptic"},
    {b:"Valium",g:"DIAZEPAM",mfg:"Roche",src:"Switzerland",cat:"Benzodiazepine"},
    {b:"Lasix",g:"FUROSEMIDE",mfg:"Sanofi",src:"France",cat:"Diuretic"},
    {b:"Aldactone",g:"SPIRONOLACTONE",mfg:"Pfizer",src:"US/EU",cat:"Diuretic"},
    {b:"Adalat",g:"NIFEDIPINE",mfg:"Bayer",src:"Germany",cat:"Antihypertensive"},
    {b:"Cozaar",g:"LOSARTAN",mfg:"MSD",src:"US/EU",cat:"Antihypertensive"},
    {b:"Concor",g:"BISOPROLOL",mfg:"Merck",src:"Germany",cat:"Beta-blocker"},
    {b:"Tenormin",g:"ATENOLOL",mfg:"AstraZeneca",src:"UK",cat:"Beta-blocker"},
    {b:"Diflucan",g:"FLUCONAZOLE",mfg:"Pfizer",src:"US/EU",cat:"Antifungal"},
    {b:"Vermox",g:"MEBENDAZOLE",mfg:"Janssen",src:"Belgium",cat:"Anthelmintic"},
    {b:"Zentel",g:"ALBENDAZOLE",mfg:"GSK",src:"UK",cat:"Anthelmintic"},
    {b:"Fansidar",g:"SULFADOXINE+PYRIMETHAMINE",mfg:"Roche",src:"Switzerland",cat:"Antimalarial"},
    {b:"Xarelto",g:"RIVAROXABAN",mfg:"Bayer",src:"Germany",cat:"Anticoagulant"},
    {b:"Eliquis",g:"APIXABAN",mfg:"Bristol-Myers Squibb",src:"US",cat:"Anticoagulant"},
    {b:"Amaryl",g:"GLIMEPIRIDE",mfg:"Sanofi",src:"France",cat:"Antidiabetic"},
  ],

  // South African imports common in Kenya
  SOUTH_AFRICA_IMPORTS: [
    {b:"Aspen Amoxicillin",g:"AMOXICILLIN",mfg:"Aspen Pharmacare",src:"South Africa",cat:"Antibiotic"},
    {b:"Adco-Metformin",g:"METFORMIN",mfg:"Adcock Ingram",src:"South Africa",cat:"Antidiabetic"},
    {b:"Cipla-Med Amlodipine",g:"AMLODIPINE",mfg:"Cipla South Africa",src:"South Africa",cat:"Antihypertensive"},
    {b:"Sandoz Omeprazole",g:"OMEPRAZOLE",mfg:"Sandoz SA",src:"South Africa",cat:"PPI"},
    {b:"Pharma Dynamics Enalapril",g:"ENALAPRIL",mfg:"Pharma Dynamics",src:"South Africa",cat:"ACE Inhibitor"},
    {b:"Mylan Atenolol",g:"ATENOLOL",mfg:"Mylan SA",src:"South Africa",cat:"Beta-blocker"},
    {b:"Aspen Diclofenac",g:"DICLOFENAC",mfg:"Aspen Pharmacare",src:"South Africa",cat:"NSAID"},
    {b:"Adco-Dol",g:"PARACETAMOL+CODEINE",mfg:"Adcock Ingram",src:"South Africa",cat:"Analgesic"},
    {b:"Grandpa Headache",g:"ASPIRIN+PARACETAMOL+CAFFEINE",mfg:"GSK SA",src:"South Africa",cat:"Analgesic"},
  ],

  // Kenya-manufactured drugs (local production)
  KENYA_LOCAL: [
    {b:"Dawa Amoxicillin 500mg",g:"AMOXICILLIN",mfg:"Dawa Ltd",cat:"Antibiotic"},
    {b:"Dawa Metronidazole 200mg",g:"METRONIDAZOLE",mfg:"Dawa Ltd",cat:"Antibiotic"},
    {b:"Dawa Paracetamol 500mg",g:"PARACETAMOL",mfg:"Dawa Ltd",cat:"Analgesic"},
    {b:"Beta Cotrimoxazole",g:"SULFAMETHOXAZOLE+TRIMETHOPRIM",mfg:"Beta Healthcare",cat:"Antibiotic"},
    {b:"Beta Cetirizine 10mg",g:"CETIRIZINE",mfg:"Beta Healthcare",cat:"Antihistamine"},
    {b:"Beta Ibuprofen 400mg",g:"IBUPROFEN",mfg:"Beta Healthcare",cat:"NSAID"},
    {b:"Cosmos Metformin 500mg",g:"METFORMIN",mfg:"Cosmos Pharma",cat:"Antidiabetic"},
    {b:"Cosmos Amoxicillin",g:"AMOXICILLIN",mfg:"Cosmos Pharma",cat:"Antibiotic"},
    {b:"Universal Paracetamol",g:"PARACETAMOL",mfg:"Universal Corp Kenya",cat:"Analgesic"},
    {b:"Universal ORS",g:"ORAL REHYDRATION SALTS",mfg:"Universal Corp Kenya",cat:"Rehydration"},
    {b:"Regent Chloroquine",g:"CHLOROQUINE",mfg:"Regent Pharma",cat:"Antimalarial"},
    {b:"Lab & Allied Ferrous Sulfate",g:"FERROUS SULFATE",mfg:"Laboratory & Allied",cat:"Supplement"},
    {b:"Lab & Allied Folic Acid",g:"FOLIC ACID",mfg:"Laboratory & Allied",cat:"Supplement"},
    {b:"Biodeal Cotrimoxazole",g:"SULFAMETHOXAZOLE+TRIMETHOPRIM",mfg:"Biodeal Laboratories",cat:"Antibiotic"},
    {b:"Elys Amoxicillin Suspension",g:"AMOXICILLIN",mfg:"Elys Chemical",cat:"Antibiotic"},
    {b:"Regal Erythromycin",g:"ERYTHROMYCIN",mfg:"Regal Pharmaceuticals",cat:"Antibiotic"},
    {b:"Regal AL Tabs",g:"ARTEMETHER+LUMEFANTRINE",mfg:"Regal Pharmaceuticals",cat:"Antimalarial"},
    {b:"Mac's Diclofenac",g:"DICLOFENAC",mfg:"Mac's Pharmaceuticals",cat:"NSAID"},
    {b:"Mac's Omeprazole",g:"OMEPRAZOLE",mfg:"Mac's Pharmaceuticals",cat:"PPI"},
    {b:"Njia",g:"LEVONORGESTREL+ETHINYLESTRADIOL",mfg:"Beta Healthcare",cat:"Contraceptive"},
    {b:"Postinor-2",g:"LEVONORGESTREL",mfg:"Gedeon Richter (via Kenya)",cat:"Emergency Contraceptive"},
  ],

  // Chinese pharmaceutical imports (APIs + finished products)
  CHINA_IMPORTS: [
    {b:"Guilin Artesunate IV",g:"ARTESUNATE",mfg:"Guilin Pharmaceutical",src:"China",cat:"Antimalarial (severe)"},
    {b:"Fosun Artemether-Lumefantrine",g:"ARTEMETHER+LUMEFANTRINE",mfg:"Fosun Pharma",src:"China",cat:"Antimalarial"},
    {b:"Zhejiang Amoxicillin",g:"AMOXICILLIN",mfg:"Zhejiang Pharma",src:"China",cat:"Antibiotic"},
    {b:"CSPC Ceftriaxone",g:"CEFTRIAXONE",mfg:"CSPC Pharmaceutical",src:"China",cat:"Antibiotic"},
    {b:"Humanwell Tramadol",g:"TRAMADOL",mfg:"Humanwell Healthcare",src:"China",cat:"Analgesic"},
  ],

  // Search function — matches query against all Kenya databases
  search: function(query) {
    if (!query) return null;
    var q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (q.length < 2) return null;

    var allDBs = [
      { name: 'WHO Prequalified (Kenya)', data: this.WHO_PREQUALIFIED },
      { name: 'Indian Generic Imports (Kenya)', data: this.INDIA_GENERICS },
      { name: 'EU/UK Brands (Kenya)', data: this.EU_UK_BRANDS },
      { name: 'South Africa Imports (Kenya)', data: this.SOUTH_AFRICA_IMPORTS },
      { name: 'Kenya Local (PPB Registered)', data: this.KENYA_LOCAL },
      { name: 'China Imports (Kenya)', data: this.CHINA_IMPORTS },
    ];

    for (var d = 0; d < allDBs.length; d++) {
      var db = allDBs[d];
      for (var i = 0; i < db.data.length; i++) {
        var drug = db.data[i];
        var brandNorm = drug.b.toLowerCase().replace(/[^a-z0-9]/g, '');
        var genNorm = drug.g.toLowerCase().replace(/[^a-z0-9]/g, '');
        var mfgNorm = drug.mfg.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Match on brand name, generic name, or manufacturer
        if (q.indexOf(brandNorm) > -1 || brandNorm.indexOf(q) > -1 ||
            q.indexOf(genNorm) > -1 || genNorm.indexOf(q) > -1 ||
            (q.length > 4 && mfgNorm.indexOf(q) > -1)) {
          return {
            found: true,
            source: db.name,
            productName: drug.b,
            genericName: drug.g,
            manufacturer: drug.mfg,
            sourceCountry: drug.src || 'Kenya',
            category: drug.cat,
            whoPrequalified: drug.pq || false,
            flag: this.getSourceFlag(drug.src || 'Kenya')
          };
        }
      }
    }
    return null;
  },

  getSourceFlag: function(src) {
    var flags = {
      'India':'🇮🇳','US':'🇺🇸','UK':'🇬🇧','France':'🇫🇷','Germany':'🇩🇪','Switzerland':'🇨🇭',
      'Belgium':'🇧🇪','Italy':'🇮🇹','Denmark':'🇩🇰','Japan':'🇯🇵','China':'🇨🇳','Kenya':'🇰🇪',
      'South Africa':'🇿🇦','US/EU':'🇺🇸','UK/Sweden':'🇬🇧','US/India':'🇺🇸'
    };
    return flags[src] || '🌐';
  },

  // Get stats about database coverage
  getStats: function() {
    return {
      whoPrequalified: this.WHO_PREQUALIFIED.length,
      indianGenerics: this.INDIA_GENERICS.length,
      euUkBrands: this.EU_UK_BRANDS.length,
      southAfrica: this.SOUTH_AFRICA_IMPORTS.length,
      kenyaLocal: this.KENYA_LOCAL.length,
      chinaImports: this.CHINA_IMPORTS.length,
      total: this.WHO_PREQUALIFIED.length + this.INDIA_GENERICS.length +
             this.EU_UK_BRANDS.length + this.SOUTH_AFRICA_IMPORTS.length +
             this.KENYA_LOCAL.length + this.CHINA_IMPORTS.length
    };
  }
};
