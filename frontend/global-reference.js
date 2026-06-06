// ============================================================
// DawaTrace — Global Pharmaceutical Reference Database
// GS1 Country Prefixes + WHO Essential Medicines + Regional Formularies
// ============================================================

var GlobalReference = {

  // GS1 barcode prefix → country mapping (comprehensive)
  GS1_PREFIXES: {
    "000":"US/Canada","001":"US/Canada","002":"US/Canada","003":"US/Canada","004":"US/Canada","005":"US/Canada","006":"US/Canada","007":"US/Canada","008":"US/Canada","009":"US/Canada",
    "010":"US/Canada","011":"US/Canada","012":"US/Canada","013":"US/Canada","014":"US/Canada","015":"US/Canada","016":"US/Canada","017":"US/Canada","018":"US/Canada","019":"US/Canada",
    "020":"In-store","021":"In-store","022":"In-store","023":"In-store","024":"In-store","025":"In-store","026":"In-store","027":"In-store","028":"In-store","029":"In-store",
    "030":"US (Drugs)","031":"US (Drugs)","032":"US (Drugs)","033":"US (Drugs)","034":"US (Drugs)","035":"US (Drugs)","036":"US (Drugs)","037":"US (Drugs)","038":"US (Drugs)","039":"US (Drugs)",
    "040":"Germany","041":"Germany","042":"Germany","043":"Germany","044":"Germany",
    "045":"Japan","046":"Japan","047":"Japan","048":"Japan","049":"Japan",
    "050":"UK","051":"UK","052":"UK","053":"UK","054":"Belgium/Luxembourg","055":"Belgium/Luxembourg",
    "056":"Portugal","057":"Denmark","058":"Denmark","059":"Poland",
    "060":"South Africa","061":"South Africa",
    "064":"Finland","065":"Finland",
    "069":"China","070":"Norway",
    "073":"Sweden","074":"Guatemala","075":"Panama",
    "076":"Switzerland","077":"Colombia","078":"Argentina","079":"Argentina",
    "080":"Italy","081":"Italy","082":"Italy","083":"Italy","084":"Spain","085":"Cuba",
    "086":"Turkey","087":"Netherlands","088":"South Korea","089":"India",
    "090":"Austria","093":"Australia","094":"New Zealand","095":"Malaysia",
    "300":"France","301":"France","302":"France","303":"France","304":"France","305":"France","306":"France","307":"France","308":"France","309":"France",
    "310":"France","311":"France","312":"France","313":"France","314":"France","315":"France","316":"France","317":"France","318":"France","319":"France",
    "320":"France","321":"France","322":"France","323":"France","324":"France","325":"France","326":"France","327":"France","328":"France","329":"France",
    "330":"France","331":"France","332":"France","333":"France","334":"France","335":"France","336":"France","337":"France","338":"France","339":"France",
    "340":"France","341":"France","342":"France","343":"France","344":"France","345":"France","346":"France","347":"France","348":"France","349":"France",
    "350":"France","351":"France","352":"France","353":"France","354":"France","355":"France","356":"France","357":"France","358":"France","359":"France",
    "360":"France","361":"France","362":"France","363":"France","364":"France","365":"France","366":"France","367":"France","368":"France","369":"France",
    "370":"France","371":"France","372":"France","373":"France","374":"France","375":"France","376":"France","377":"France","378":"France","379":"France",
    "380":"Bulgaria","383":"Slovenia","385":"Croatia","387":"Bosnia","389":"Montenegro",
    "400":"Germany","401":"Germany","402":"Germany","403":"Germany","404":"Germany","405":"Germany","406":"Germany","407":"Germany","408":"Germany","409":"Germany",
    "410":"Germany","411":"Germany","412":"Germany","413":"Germany","414":"Germany","415":"Germany","416":"Germany","417":"Germany","418":"Germany","419":"Germany",
    "420":"Germany","421":"Germany","422":"Germany","423":"Germany","424":"Germany","425":"Germany","426":"Germany","427":"Germany","428":"Germany","429":"Germany",
    "430":"Germany","431":"Germany","432":"Germany","433":"Germany","434":"Germany","435":"Germany","436":"Germany","437":"Germany","438":"Germany","439":"Germany",
    "440":"Germany",
    "450":"Japan","451":"Japan","452":"Japan","453":"Japan","454":"Japan","455":"Japan","456":"Japan","457":"Japan","458":"Japan","459":"Japan",
    "460":"Russia","461":"Russia","462":"Russia","463":"Russia","464":"Russia","465":"Russia","466":"Russia","467":"Russia","468":"Russia","469":"Russia",
    "470":"Kyrgyzstan","471":"Taiwan","474":"Estonia","475":"Latvia","476":"Azerbaijan","477":"Lithuania","478":"Uzbekistan","479":"Sri Lanka",
    "480":"Philippines","481":"Belarus","482":"Ukraine","484":"Moldova","485":"Armenia","486":"Georgia","487":"Kazakhstan","488":"Tajikistan",
    "489":"Hong Kong",
    "490":"Japan","491":"Japan","492":"Japan","493":"Japan","494":"Japan","495":"Japan","496":"Japan","497":"Japan","498":"Japan","499":"Japan",
    "500":"UK","501":"UK","502":"UK","503":"UK","504":"UK","505":"UK","506":"UK","507":"UK","508":"UK","509":"UK",
    "520":"Greece","521":"Greece","528":"Lebanon","529":"Cyprus",
    "530":"Albania","531":"North Macedonia","535":"Malta","539":"Ireland",
    "540":"Belgium/Luxembourg","541":"Belgium/Luxembourg","542":"Belgium/Luxembourg","543":"Belgium/Luxembourg","544":"Belgium/Luxembourg","545":"Belgium/Luxembourg","546":"Belgium/Luxembourg","547":"Belgium/Luxembourg","548":"Belgium/Luxembourg","549":"Belgium/Luxembourg",
    "560":"Portugal","569":"Iceland",
    "570":"Denmark","571":"Denmark","572":"Denmark","573":"Denmark","574":"Denmark","575":"Denmark","576":"Denmark","577":"Denmark","578":"Denmark","579":"Denmark",
    "590":"Poland","594":"Romania","599":"Hungary",
    "600":"South Africa","601":"South Africa","603":"Ghana","604":"Senegal","608":"Bahrain","609":"Mauritius",
    "611":"Morocco","613":"Algeria","615":"Nigeria","616":"Kenya","618":"Côte d'Ivoire","619":"Tunisia",
    "620":"Tanzania","621":"Syria","622":"Egypt","623":"Brunei","624":"Libya","625":"Jordan","626":"Iran","627":"Kuwait","628":"Saudi Arabia","629":"UAE",
    "630":"Qatar","631":"Namibia","632":"Cameroon","633":"Uzbekistan (alt)","634":"Mozambique",
    "640":"Finland","641":"Finland","642":"Finland","643":"Finland","644":"Finland","645":"Finland","646":"Finland","647":"Finland","648":"Finland","649":"Finland",
    "690":"China","691":"China","692":"China","693":"China","694":"China","695":"China","696":"China","697":"China","698":"China","699":"China",
    "700":"Norway","701":"Norway","702":"Norway","703":"Norway","704":"Norway","705":"Norway","706":"Norway","707":"Norway","708":"Norway","709":"Norway",
    "729":"Israel",
    "730":"Sweden","731":"Sweden","732":"Sweden","733":"Sweden","734":"Sweden","735":"Sweden","736":"Sweden","737":"Sweden","738":"Sweden","739":"Sweden",
    "740":"Guatemala","741":"El Salvador","742":"Honduras","743":"Nicaragua","744":"Costa Rica","745":"Panama","746":"Dominican Republic",
    "750":"Mexico","754":"Canada","755":"Canada",
    "759":"Venezuela",
    "760":"Switzerland","761":"Switzerland","762":"Switzerland","763":"Switzerland","764":"Switzerland","765":"Switzerland","766":"Switzerland","767":"Switzerland","768":"Switzerland","769":"Switzerland",
    "770":"Colombia","771":"Colombia","773":"Uruguay","775":"Peru","777":"Bolivia","778":"Argentina","779":"Argentina",
    "780":"Chile","784":"Paraguay","786":"Ecuador",
    "789":"Brazil","790":"Brazil",
    "800":"Italy","801":"Italy","802":"Italy","803":"Italy","804":"Italy","805":"Italy","806":"Italy","807":"Italy","808":"Italy","809":"Italy",
    "810":"Italy","811":"Italy","812":"Italy","813":"Italy","814":"Italy","815":"Italy","816":"Italy","817":"Italy","818":"Italy","819":"Italy",
    "820":"Italy","821":"Italy","822":"Italy","823":"Italy","824":"Italy","825":"Italy","826":"Italy","827":"Italy","828":"Italy","829":"Italy",
    "830":"Italy","831":"Italy","832":"Italy","833":"Italy","834":"Italy","835":"Italy","836":"Italy","837":"Italy","838":"Italy","839":"Italy",
    "840":"Spain","841":"Spain","842":"Spain","843":"Spain","844":"Spain","845":"Spain","846":"Spain","847":"Spain","848":"Spain","849":"Spain",
    "850":"Cuba","858":"Slovakia","859":"Czech Republic","860":"Serbia","865":"Mongolia","867":"North Korea",
    "868":"Turkey","869":"Turkey",
    "870":"Netherlands","871":"Netherlands","872":"Netherlands","873":"Netherlands","874":"Netherlands","875":"Netherlands","876":"Netherlands","877":"Netherlands","878":"Netherlands","879":"Netherlands",
    "880":"South Korea",
    "884":"Cambodia","885":"Thailand","888":"Singapore",
    "890":"India",
    "893":"Vietnam","896":"Pakistan","899":"Indonesia",
    "900":"Austria","901":"Austria","902":"Austria","903":"Austria","904":"Austria","905":"Austria","906":"Austria","907":"Austria","908":"Austria","909":"Austria",
    "910":"Austria","911":"Austria","912":"Austria","913":"Austria","914":"Austria","915":"Austria","916":"Austria","917":"Austria","918":"Austria","919":"Austria",
    "930":"Australia","931":"Australia","932":"Australia","933":"Australia","934":"Australia","935":"Australia","936":"Australia","937":"Australia","938":"Australia","939":"Australia",
    "940":"New Zealand","941":"New Zealand","942":"New Zealand","943":"New Zealand","944":"New Zealand","945":"New Zealand","946":"New Zealand","947":"New Zealand","948":"New Zealand","949":"New Zealand",
    "955":"Malaysia","958":"Macau"
  },

  // WHO Essential Medicines List — core drugs used globally
  // These are recognized worldwide regardless of country
  WHO_ESSENTIAL: [
    {n:"Amoxicillin",g:"AMOXICILLIN",c:"Antibiotic",u:["infection","bacterial"]},
    {n:"Ampicillin",g:"AMPICILLIN",c:"Antibiotic",u:["infection","bacterial"]},
    {n:"Azithromycin",g:"AZITHROMYCIN",c:"Antibiotic",u:["infection","respiratory"]},
    {n:"Ciprofloxacin",g:"CIPROFLOXACIN",c:"Antibiotic",u:["infection","urinary"]},
    {n:"Doxycycline",g:"DOXYCYCLINE",c:"Antibiotic",u:["infection","malaria"]},
    {n:"Erythromycin",g:"ERYTHROMYCIN",c:"Antibiotic",u:["infection"]},
    {n:"Gentamicin",g:"GENTAMICIN",c:"Antibiotic",u:["infection","severe"]},
    {n:"Metronidazole",g:"METRONIDAZOLE",c:"Antibiotic",u:["infection","anaerobic"]},
    {n:"Clindamycin",g:"CLINDAMYCIN",c:"Antibiotic",u:["infection"]},
    {n:"Cephalexin",g:"CEPHALEXIN",c:"Antibiotic",u:["infection"]},
    {n:"Cotrimoxazole",g:"SULFAMETHOXAZOLE+TRIMETHOPRIM",c:"Antibiotic",u:["infection","hiv"]},
    {n:"Nitrofurantoin",g:"NITROFURANTOIN",c:"Antibiotic",u:["urinary","infection"]},
    {n:"Cloxacillin",g:"CLOXACILLIN",c:"Antibiotic",u:["infection","staph"]},
    {n:"Fluconazole",g:"FLUCONAZOLE",c:"Antifungal",u:["fungal","candida"]},
    {n:"Artemether-Lumefantrine",g:"ARTEMETHER+LUMEFANTRINE",c:"Antimalarial",u:["malaria"]},
    {n:"Chloroquine",g:"CHLOROQUINE",c:"Antimalarial",u:["malaria"]},
    {n:"Quinine",g:"QUININE",c:"Antimalarial",u:["malaria","severe"]},
    {n:"Sulfadoxine-Pyrimethamine",g:"SULFADOXINE+PYRIMETHAMINE",c:"Antimalarial",u:["malaria","prevention"]},
    {n:"Albendazole",g:"ALBENDAZOLE",c:"Anthelmintic",u:["worms","parasites"]},
    {n:"Mebendazole",g:"MEBENDAZOLE",c:"Anthelmintic",u:["worms","parasites"]},
    {n:"Paracetamol",g:"PARACETAMOL",c:"Analgesic",u:["pain","fever"]},
    {n:"Acetaminophen",g:"ACETAMINOPHEN",c:"Analgesic",u:["pain","fever"]},
    {n:"Ibuprofen",g:"IBUPROFEN",c:"NSAID",u:["pain","inflammation"]},
    {n:"Diclofenac",g:"DICLOFENAC",c:"NSAID",u:["pain","inflammation"]},
    {n:"Aspirin",g:"ASPIRIN",c:"NSAID/Antiplatelet",u:["pain","cardiovascular"]},
    {n:"Morphine",g:"MORPHINE",c:"Opioid",u:["pain","severe","palliative"]},
    {n:"Tramadol",g:"TRAMADOL",c:"Opioid",u:["pain","moderate"]},
    {n:"Metformin",g:"METFORMIN",c:"Antidiabetic",u:["diabetes","type2"]},
    {n:"Glibenclamide",g:"GLIBENCLAMIDE",c:"Antidiabetic",u:["diabetes","type2"]},
    {n:"Insulin",g:"INSULIN",c:"Antidiabetic",u:["diabetes"]},
    {n:"Metoprolol",g:"METOPROLOL",c:"Beta-blocker",u:["hypertension","heart"]},
    {n:"Atenolol",g:"ATENOLOL",c:"Beta-blocker",u:["hypertension"]},
    {n:"Amlodipine",g:"AMLODIPINE",c:"CCB",u:["hypertension"]},
    {n:"Nifedipine",g:"NIFEDIPINE",c:"CCB",u:["hypertension"]},
    {n:"Enalapril",g:"ENALAPRIL",c:"ACE Inhibitor",u:["hypertension","heart"]},
    {n:"Captopril",g:"CAPTOPRIL",c:"ACE Inhibitor",u:["hypertension"]},
    {n:"Lisinopril",g:"LISINOPRIL",c:"ACE Inhibitor",u:["hypertension"]},
    {n:"Losartan",g:"LOSARTAN",c:"ARB",u:["hypertension"]},
    {n:"Hydrochlorothiazide",g:"HYDROCHLOROTHIAZIDE",c:"Diuretic",u:["hypertension","edema"]},
    {n:"Furosemide",g:"FUROSEMIDE",c:"Diuretic",u:["edema","heart failure"]},
    {n:"Simvastatin",g:"SIMVASTATIN",c:"Statin",u:["cholesterol"]},
    {n:"Atorvastatin",g:"ATORVASTATIN",c:"Statin",u:["cholesterol"]},
    {n:"Warfarin",g:"WARFARIN",c:"Anticoagulant",u:["blood clots"]},
    {n:"Clopidogrel",g:"CLOPIDOGREL",c:"Antiplatelet",u:["cardiovascular"]},
    {n:"Heparin",g:"HEPARIN",c:"Anticoagulant",u:["blood clots","surgery"]},
    {n:"Omeprazole",g:"OMEPRAZOLE",c:"PPI",u:["ulcer","reflux"]},
    {n:"Ranitidine",g:"RANITIDINE",c:"H2 Blocker",u:["ulcer","reflux"]},
    {n:"ORS",g:"ORAL REHYDRATION SALTS",c:"Rehydration",u:["diarrhea","dehydration"]},
    {n:"Zinc Sulfate",g:"ZINC SULFATE",c:"Supplement",u:["diarrhea","zinc"]},
    {n:"Ferrous Sulfate",g:"FERROUS SULFATE",c:"Supplement",u:["anemia","iron"]},
    {n:"Folic Acid",g:"FOLIC ACID",c:"Supplement",u:["anemia","pregnancy"]},
    {n:"Salbutamol",g:"SALBUTAMOL",c:"Bronchodilator",u:["asthma"]},
    {n:"Beclomethasone",g:"BECLOMETHASONE",c:"Corticosteroid",u:["asthma"]},
    {n:"Prednisone",g:"PREDNISONE",c:"Corticosteroid",u:["inflammation","autoimmune"]},
    {n:"Dexamethasone",g:"DEXAMETHASONE",c:"Corticosteroid",u:["inflammation","covid"]},
    {n:"Hydrocortisone",g:"HYDROCORTISONE",c:"Corticosteroid",u:["adrenal","inflammation"]},
    {n:"Phenytoin",g:"PHENYTOIN",c:"Antiepileptic",u:["epilepsy","seizures"]},
    {n:"Carbamazepine",g:"CARBAMAZEPINE",c:"Antiepileptic",u:["epilepsy","seizures"]},
    {n:"Diazepam",g:"DIAZEPAM",c:"Benzodiazepine",u:["anxiety","seizures"]},
    {n:"Phenobarbital",g:"PHENOBARBITAL",c:"Antiepileptic",u:["epilepsy"]},
    {n:"Haloperidol",g:"HALOPERIDOL",c:"Antipsychotic",u:["psychosis"]},
    {n:"Chlorpromazine",g:"CHLORPROMAZINE",c:"Antipsychotic",u:["psychosis"]},
    {n:"Fluoxetine",g:"FLUOXETINE",c:"SSRI",u:["depression"]},
    {n:"Amitriptyline",g:"AMITRIPTYLINE",c:"TCA",u:["depression","pain"]},
    {n:"Promethazine",g:"PROMETHAZINE",c:"Antihistamine",u:["allergy","nausea"]},
    {n:"Cetirizine",g:"CETIRIZINE",c:"Antihistamine",u:["allergy"]},
    {n:"Loratadine",g:"LORATADINE",c:"Antihistamine",u:["allergy"]},
    {n:"Levothyroxine",g:"LEVOTHYROXINE",c:"Thyroid",u:["hypothyroid"]},
    {n:"Oxytocin",g:"OXYTOCIN",c:"Obstetric",u:["labor","postpartum"]},
    {n:"Misoprostol",g:"MISOPROSTOL",c:"Obstetric",u:["postpartum","ulcer"]},
    {n:"Oseltamivir",g:"OSELTAMIVIR",c:"Antiviral",u:["influenza"]},
    {n:"Acyclovir",g:"ACYCLOVIR",c:"Antiviral",u:["herpes"]},
    {n:"Zidovudine",g:"ZIDOVUDINE",c:"Antiretroviral",u:["hiv"]},
    {n:"Efavirenz",g:"EFAVIRENZ",c:"Antiretroviral",u:["hiv"]},
    {n:"Tenofovir",g:"TENOFOVIR",c:"Antiretroviral",u:["hiv","hepatitis"]},
    {n:"Rifampicin",g:"RIFAMPICIN",c:"Anti-TB",u:["tuberculosis"]},
    {n:"Isoniazid",g:"ISONIAZID",c:"Anti-TB",u:["tuberculosis"]},
    {n:"Ethambutol",g:"ETHAMBUTOL",c:"Anti-TB",u:["tuberculosis"]},
    {n:"Pyrazinamide",g:"PYRAZINAMIDE",c:"Anti-TB",u:["tuberculosis"]},
    {n:"Rosuvastatin",g:"ROSUVASTATIN",c:"Statin",u:["cholesterol"]},
    {n:"Pantoprazole",g:"PANTOPRAZOLE",c:"PPI",u:["ulcer","reflux"]},
    {n:"Esomeprazole",g:"ESOMEPRAZOLE",c:"PPI",u:["ulcer","reflux"]},
    {n:"Gabapentin",g:"GABAPENTIN",c:"Anticonvulsant",u:["pain","epilepsy"]},
    {n:"Sertraline",g:"SERTRALINE",c:"SSRI",u:["depression","anxiety"]},
    {n:"Escitalopram",g:"ESCITALOPRAM",c:"SSRI",u:["depression","anxiety"]},
    {n:"Duloxetine",g:"DULOXETINE",c:"SNRI",u:["depression","pain"]},
    {n:"Montelukast",g:"MONTELUKAST",c:"Leukotriene",u:["asthma"]},
    {n:"Valsartan",g:"VALSARTAN",c:"ARB",u:["hypertension"]},
    {n:"Telmisartan",g:"TELMISARTAN",c:"ARB",u:["hypertension"]},
    {n:"Empagliflozin",g:"EMPAGLIFLOZIN",c:"SGLT2",u:["diabetes","heart"]},
    {n:"Dapagliflozin",g:"DAPAGLIFLOZIN",c:"SGLT2",u:["diabetes","heart"]},
    {n:"Semaglutide",g:"SEMAGLUTIDE",c:"GLP-1",u:["diabetes","obesity"]},
    {n:"Rivaroxaban",g:"RIVAROXABAN",c:"Anticoagulant",u:["blood clots"]},
    {n:"Apixaban",g:"APIXABAN",c:"Anticoagulant",u:["blood clots"]},
  ],

  // Regional manufacturers — who makes drugs in each market
  REGIONAL_MANUFACTURERS: {
    "Kenya": ["Dawa Ltd","Beta Healthcare","Universal Corp of Kenya","Cosmos Pharma","Regent Pharma","Laboratory & Allied","Biodeal Laboratories","Elys Chemical","Regal Pharmaceuticals","Mac's Pharmaceuticals"],
    "Nigeria": ["Emzor Pharmaceutical","Fidson Healthcare","GlaxoSmithKline Nigeria","May & Baker Nigeria","Neimeth International","PharmaApproach","Swiss Pharma Nigeria","Chi Pharmaceuticals","Therapeutic Labs","Drugfield Pharma"],
    "India": ["Cipla","Sun Pharma","Dr. Reddy's","Lupin","Aurobindo","Torrent","Glenmark","Cadila Healthcare","Mankind Pharma","Alkem Labs","Biocon","Hetero Drugs","Natco Pharma","Strides Pharma","Intas Pharma"],
    "UAE": ["Julphar","Neopharma","Gulf Pharmaceutical Industries","Globalpharma","Aster DM Healthcare","Life Pharma","Medpharma","Pharmax Pharmaceuticals"],
    "South Africa": ["Aspen Pharmacare","Adcock Ingram","Cipla South Africa","Sanofi SA","Pharma Dynamics","Sandoz SA","Mylan SA"],
    "Egypt": ["EIPICO","Pharco Pharmaceuticals","Amoun Pharmaceutical","Eva Pharma","Hikma Egypt","Medical Union Pharmaceuticals","Nile Pharma"],
    "Brazil": ["EMS","Eurofarma","Aché Laboratórios","Cristália","Biolab","Hypera Pharma","Libbs","Blanver"],
    "Mexico": ["Pisa Farmacéutica","Laboratorios Sophia","Liomont","Silanes","Carnot","Senosiain","Armstrong"],
    "Pakistan": ["Martin Dow","Getz Pharma","Searle Pakistan","AGP Pharma","Sami Pharmaceuticals","Hilton Pharma","PharmEvo"],
    "Bangladesh": ["Square Pharmaceuticals","Incepta","Beximco","Healthcare Pharma","Renata","Eskayef","ACI Pharma"],
    "Indonesia": ["Kalbe Farma","Tempo Scan Pacific","Dexa Medica","Sanbe Farma","Kimia Farma","Bio Farma"],
    "Thailand": ["Siam Pharmaceutical","Thai Nakorn Patana","Government Pharmaceutical Organization","Bangkok Lab","Mega Lifesciences"],
    "Vietnam": ["Hau Giang Pharma","Domesco","Traphaco","Pymepharco","DHG Pharma","OPC Pharma"],
    "Ghana": ["Ernest Chemists","Danadams Pharmaceuticals","Entrance Pharmaceuticals","Tobinco Pharmaceuticals","Kinapharma"],
    "Tanzania": ["Shelys Pharmaceuticals","Tanzania Pharmaceutical Industries","Interchem Pharmaceuticals","Keko Pharmaceutical Industries"],
    "Saudi Arabia": ["SPIMACO","Tabuk Pharmaceutical","Jamjoom Pharmaceuticals","Riyadh Pharma","Saja Pharmaceuticals"],
    "Colombia": ["Tecnoquímicas","Laboratorios Baxter","Procaps","Lafrancol","Genfar"],
    "Argentina": ["Laboratorios Bagó","Roemmers","Gador","Richmond","Montpellier"],
    "US": ["Pfizer","Johnson & Johnson","AbbVie","Merck","Eli Lilly","Bristol-Myers Squibb","Amgen","Gilead","Regeneron","Moderna"],
    "EU": ["Novartis","Roche","Sanofi","AstraZeneca","Bayer","GSK","Novo Nordisk","Boehringer Ingelheim","Merck KGaA","UCB"],
    "China": ["Sinopharm","Hengrui Medicine","CSPC Pharmaceutical","Jiangsu Hansoh","Kelun Pharma","Luye Pharma"],
    "Japan": ["Takeda","Astellas","Daiichi Sankyo","Eisai","Otsuka","Shionogi","Chugai"],
    "South Korea": ["Samsung Bioepis","Celltrion","Hanmi Pharmaceutical","Yuhan","Green Cross","Daewoong"],
  },

  // Decode country from GTIN or EAN barcode
  decodeCountry: function(code) {
    if (!code || code.length < 3) return null;
    // Strip leading zeros for 14-digit GTIN to get EAN
    var ean = code.length === 14 ? code.substring(1) : code;
    if (ean.length < 3) return null;

    var p3 = ean.substring(0, 3);
    var p2 = ean.substring(0, 2);

    // Try 3-digit prefix first
    if (this.GS1_PREFIXES[p3]) return { country: this.GS1_PREFIXES[p3], prefix: p3, flag: this.getFlag(this.GS1_PREFIXES[p3]) };

    // Build range lookups for common ranges
    var num = parseInt(p3);
    if (num >= 0 && num <= 19) return { country: "US/Canada", prefix: p3, flag: "🇺🇸" };
    if (num >= 30 && num <= 39) return { country: "US (Drugs/Healthcare)", prefix: p3, flag: "🇺🇸" };
    if (num >= 40 && num <= 44) return { country: "Germany", prefix: p3, flag: "🇩🇪" };
    if (num >= 45 && num <= 49) return { country: "Japan", prefix: p3, flag: "🇯🇵" };
    if (num >= 50 && num <= 50) return { country: "UK", prefix: p3, flag: "🇬🇧" };
    if (num >= 60 && num <= 61) return { country: "South Africa", prefix: p3, flag: "🇿🇦" };
    if (num >= 64 && num <= 64) return { country: "Finland", prefix: p3, flag: "🇫🇮" };
    if (num >= 69 && num <= 69) return { country: "China", prefix: p3, flag: "🇨🇳" };
    if (num >= 80 && num <= 83) return { country: "Italy", prefix: p3, flag: "🇮🇹" };
    if (num >= 84 && num <= 84) return { country: "Spain", prefix: p3, flag: "🇪🇸" };
    if (num >= 87 && num <= 87) return { country: "Netherlands", prefix: p3, flag: "🇳🇱" };
    if (num >= 90 && num <= 91) return { country: "Austria", prefix: p3, flag: "🇦🇹" };

    return { country: "Unknown (prefix: " + p3 + ")", prefix: p3, flag: "🌐" };
  },

  getFlag: function(country) {
    var flags = {
      "US/Canada":"🇺🇸","US (Drugs)":"🇺🇸","US (Drugs/Healthcare)":"🇺🇸",
      "UK":"🇬🇧","France":"🇫🇷","Germany":"🇩🇪","Italy":"🇮🇹","Spain":"🇪🇸",
      "Japan":"🇯🇵","China":"🇨🇳","South Korea":"🇰🇷","India":"🇮🇳",
      "Brazil":"🇧🇷","Mexico":"🇲🇽","Argentina":"🇦🇷","Colombia":"🇨🇴",
      "South Africa":"🇿🇦","Kenya":"🇰🇪","Nigeria":"🇳🇬","Ghana":"🇬🇭","Egypt":"🇪🇬","Tanzania":"🇹🇿",
      "UAE":"🇦🇪","Saudi Arabia":"🇸🇦","Jordan":"🇯🇴","Kuwait":"🇰🇼","Qatar":"🇶🇦","Bahrain":"🇧🇭","Iran":"🇮🇷",
      "Indonesia":"🇮🇩","Thailand":"🇹🇭","Vietnam":"🇻🇳","Philippines":"🇵🇭","Malaysia":"🇲🇾","Singapore":"🇸🇬","Pakistan":"🇵🇰","Bangladesh":"🇧🇩","Sri Lanka":"🇱🇰","Cambodia":"🇰🇭",
      "Australia":"🇦🇺","New Zealand":"🇳🇿",
      "Russia":"🇷🇺","Ukraine":"🇺🇦","Turkey":"🇹🇷","Poland":"🇵🇱","Romania":"🇷🇴","Czech Republic":"🇨🇿","Hungary":"🇭🇺","Bulgaria":"🇧🇬","Croatia":"🇭🇷","Serbia":"🇷🇸","Slovenia":"🇸🇮",
      "Netherlands":"🇳🇱","Belgium/Luxembourg":"🇧🇪","Switzerland":"🇨🇭","Austria":"🇦🇹","Sweden":"🇸🇪","Norway":"🇳🇴","Denmark":"🇩🇰","Finland":"🇫🇮","Ireland":"🇮🇪","Portugal":"🇵🇹","Greece":"🇬🇷",
      "Israel":"🇮🇱","Morocco":"🇲🇦","Algeria":"🇩🇿","Tunisia":"🇹🇳","Libya":"🇱🇾","Cameroon":"🇨🇲","Côte d'Ivoire":"🇨🇮","Senegal":"🇸🇳","Mozambique":"🇲🇿","Namibia":"🇳🇦",
      "Guatemala":"🇬🇹","El Salvador":"🇸🇻","Honduras":"🇭🇳","Nicaragua":"🇳🇮","Costa Rica":"🇨🇷","Panama":"🇵🇦","Dominican Republic":"🇩🇴","Cuba":"🇨🇺","Chile":"🇨🇱","Peru":"🇵🇪","Ecuador":"🇪🇨","Bolivia":"🇧🇴","Venezuela":"🇻🇪","Uruguay":"🇺🇾","Paraguay":"🇵🇾",
      "Taiwan":"🇹🇼","Hong Kong":"🇭🇰","Macau":"🇲🇴","Mongolia":"🇲🇳",
      "Estonia":"🇪🇪","Latvia":"🇱🇻","Lithuania":"🇱🇹","Belarus":"🇧🇾","Moldova":"🇲🇩","Georgia":"🇬🇪","Armenia":"🇦🇲","Azerbaijan":"🇦🇿","Kazakhstan":"🇰🇿","Uzbekistan":"🇺🇿","Kyrgyzstan":"🇰🇬","Tajikistan":"🇹🇯",
      "Lebanon":"🇱🇧","Syria":"🇸🇾","Cyprus":"🇨🇾","Albania":"🇦🇱","North Macedonia":"🇲🇰","Malta":"🇲🇹","Iceland":"🇮🇸","Bosnia":"🇧🇦","Montenegro":"🇲🇪","Slovakia":"🇸🇰","Brunei":"🇧🇳","Mauritius":"🇲🇺"
    };
    return flags[country] || "🌐";
  },

  // Match a drug name against WHO Essential Medicines
  matchWHO: function(query) {
    if (!query) return null;
    var q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var i = 0; i < this.WHO_ESSENTIAL.length; i++) {
      var drug = this.WHO_ESSENTIAL[i];
      var name = drug.n.toLowerCase().replace(/[^a-z0-9]/g, '');
      var gen = drug.g.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (q.indexOf(name) > -1 || name.indexOf(q) > -1 || q.indexOf(gen) > -1 || gen.indexOf(q) > -1) {
        return drug;
      }
    }
    return null;
  },

  // Get likely manufacturers for a country
  getManufacturers: function(country) {
    for (var key in this.REGIONAL_MANUFACTURERS) {
      if (country.indexOf(key) > -1 || key.indexOf(country) > -1) {
        return this.REGIONAL_MANUFACTURERS[key];
      }
    }
    return this.REGIONAL_MANUFACTURERS["US"];
  }
};
