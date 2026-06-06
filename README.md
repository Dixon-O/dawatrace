# 💊 DawaTrace

**Blockchain-powered pharmaceutical verification and traceability platform.**

DawaTrace enables instant verification of medicine authenticity across global pharmaceutical supply chains using smart contract technology, AI-powered risk scoring, and multi-source pharmaceutical intelligence. Consumers scan any QR code or barcode to receive a 0–100 trust score backed by cryptographic provenance, regulatory cross-referencing, and clone detection.

---

## Problem

The World Health Organization estimates that **1 in 10 medical products** circulating in low- and middle-income countries is substandard or falsified. In Sub-Saharan Africa, counterfeit rates reach **30%**. Current systems verify identifiers but fail to verify physical reality — counterfeiters clone valid barcodes, copy packaging, and exploit fragmented supply chains.

DawaTrace provides the verification infrastructure to combat this crisis.

---

## How It Works

```
🏭 Manufacturer → 🚛 Distributor → 🏥 Pharmacy → 📱 Consumer SCANS & VERIFIES
   registers          transfers        receives        Trust Score 0-100
```

1. **Manufacturers** register products on-chain with GS1-compatible identifiers (GTIN, serial, lot, expiry)
2. **Custody transfers** are recorded at each supply chain handoff with location and event type
3. **Consumers** verify any medicine by scanning a QR code, barcode, or entering a serial number
4. **Regulators** issue recalls (per-product or per-lot) and audit full provenance chains
5. **Risk Engine** computes a trust score from cryptographic signatures, scan counts, custody depth, recall status, and expiry

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Frontend (SPA)                             │
│               HTML5 / CSS3 / Vanilla JavaScript                  │
│                                                                  │
│  ┌────────┐ ┌──────────┐ ┌───────┐ ┌─────────┐ ┌─────────────┐ │
│  │ Verify │ │Dashboard │ │ Track │ │ Recalls │ │  Analytics  │ │
│  └───┬────┘ └────┬─────┘ └───┬───┘ └────┬────┘ └──────┬──────┘ │
│      │           │           │           │             │        │
│  ┌───▼───────────▼───────────▼───────────▼─────────────▼──────┐ │
│  │                   ethers.js v6 / Demo Mode                 │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │              Global Pharmaceutical Lookup                   │ │
│  │  OpenFDA → RxNorm → WHO Essential → GS1 Prefix Decode     │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │      DawaTraceV2.sol         │
                │      (Solidity 0.8.24)       │
                │                              │
                │  • OpenZeppelin AccessControl │
                │  • registerProduct (GS1)     │
                │  • transferCustody           │
                │  • verifyProductView         │
                │  • recallProduct / recallLot │
                │  • getCustodyChain           │
                │  • getParticipantRole        │
                └──────────────────────────────┘
                    Hardhat Local / EVM Chain
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension *(optional — demo mode works without it)*

### Installation

```bash
git clone https://github.com/Dixon-O/dawatrace.git
cd dawatrace
npm install
```

### Run in Demo Mode (No Blockchain Required)

```bash
npx serve -s frontend -l 3000
```

Open `http://localhost:3000` — the app loads **1,000 pharmaceutical products** from FDA, EMA, and Kenya PPB sources. All features work without a blockchain connection.

### Run with Local Blockchain (Full Stack)

```bash
# Terminal 1 — Start local blockchain
npx hardhat node

# Terminal 2 — Deploy contract + seed data
npx hardhat run scripts/deploy-v2.js --network localhost

# Terminal 3 — Serve frontend
npx serve -s frontend -l 3000
```

Open `http://localhost:3000` → Click **Connect Wallet** → MetaMask auto-switches to `localhost:8545` (Chain ID: `31337`).

### Run Tests

```bash
npx hardhat test
```

```
  DawaTraceV2
    Deployment
      ✔ Should grant deployer DEFAULT_ADMIN_ROLE
      ✔ Should start with zero products and participants
    Participant Registration
      ✔ Should register a manufacturer with role
      ✔ Should reject non-admin registration
      ✔ Should reject duplicate registration
      ✔ Should deactivate participant and revoke roles
      ✔ Should emit ParticipantRegistered event
    Product Registration
      ✔ Should register product with GS1 fields
      ✔ Should reject non-manufacturer
      ✔ Should store correct GS1 data
      ✔ Should set manufacturer as initial holder
      ✔ Should emit ProductRegistered event
    Custody Transfer
      ✔ Should transfer manufacturer to distributor
      ✔ Should transfer distributor to pharmacy
      ✔ Should reject transfer by non-holder
      ✔ Should build full custody chain
    Verification
      ✔ Should return GENUINE for valid product
      ✔ Should return COUNTERFEIT for unknown product
      ✔ Should return EXPIRED for expired product
      ✔ Should return RECALLED for recalled product
      ✔ Anyone can verify without a role
    Recalls
      ✔ Regulator can recall a product
      ✔ Regulator can recall a lot
      ✔ Non-regulator cannot recall
      ✔ Lot recall affects product verification
    Role Detection
      ✔ Should return correct role string
      ✔ Should return CONSUMER for unregistered address
      ✔ Should return ADMIN for deployer

  28 passing
```

---

## Smart Contract — DawaTraceV2.sol

Built on OpenZeppelin `AccessControl` with five roles:

| Role | Permissions |
|------|-------------|
| `DEFAULT_ADMIN_ROLE` | Register participants, grant/revoke roles, full access |
| `MANUFACTURER_ROLE` | Register products with GS1 data, initiate custody transfers |
| `DISTRIBUTOR_ROLE` | Receive and transfer product custody |
| `PHARMACY_ROLE` | Receive product custody (final dispensing point) |
| `REGULATOR_ROLE` | Issue product and lot recalls |

### On-Chain Features

| Feature | Description |
|---------|-------------|
| **GS1-compatible data model** | GTIN (14-digit), serial number, lot number, expiry date |
| **Multi-status verification** | GENUINE, EXPIRED, RECALLED, SUSPICIOUS, COUNTERFEIT |
| **Recall system** | Per-product (`recallProduct`) and per-lot (`recallLot`) with reason |
| **Scan counting** | Incremental counter per product for clone/duplicate detection |
| **Free verification** | `verifyProductView()` is a `view` function — zero gas for consumers |
| **Custody chain** | Full provenance trail with location, event type, and timestamps |
| **Role detection** | `getParticipantRole()` returns role string for frontend RBAC |

---

## Global Pharmaceutical Lookup

When a scanned product is not in the local database, a multi-source cascade identifies it:

| Step | Source | Coverage |
|------|--------|----------|
| 0 | **GS1 Barcode Prefix** | 200+ countries — instant country + regulator decode |
| 1 | **OpenFDA API** | US drugs — live NDC/brand name lookup |
| 2 | **RxNorm (NIH)** | Global — drug name normalization and identification |
| 3 | **WHO Essential Medicines** | Global — 90+ core medicines used worldwide |
| 4 | **GS1 + Regional Inference** | 20+ markets — manufacturer and regulator mapping |
| 5 | **OpenFDA Drug Labels** | US — broader label text search fallback |

### Supported Barcode Regions

| Region | Countries |
|--------|-----------|
| Africa | 🇰🇪 Kenya, 🇳🇬 Nigeria, 🇿🇦 South Africa, 🇬🇭 Ghana, 🇹🇿 Tanzania, 🇪🇬 Egypt, 🇲🇦 Morocco, 🇨🇲 Cameroon + more |
| Middle East | 🇦🇪 UAE, 🇸🇦 Saudi Arabia, 🇰🇼 Kuwait, 🇶🇦 Qatar, 🇧🇭 Bahrain, 🇯🇴 Jordan, 🇮🇷 Iran |
| South Asia | 🇮🇳 India, 🇵🇰 Pakistan, 🇧🇩 Bangladesh, 🇱🇰 Sri Lanka |
| Southeast Asia | 🇮🇩 Indonesia, 🇹🇭 Thailand, 🇻🇳 Vietnam, 🇵🇭 Philippines, 🇲🇾 Malaysia, 🇸🇬 Singapore |
| East Asia | 🇨🇳 China, 🇯🇵 Japan, 🇰🇷 South Korea, 🇹🇼 Taiwan |
| Americas | 🇺🇸 US, 🇧🇷 Brazil, 🇲🇽 Mexico, 🇦🇷 Argentina, 🇨🇴 Colombia, 🇨🇱 Chile, 🇵🇪 Peru + more |
| Europe | 🇬🇧 UK, 🇩🇪 Germany, 🇫🇷 France, 🇮🇹 Italy, 🇪🇸 Spain, 🇳🇱 Netherlands, 🇨🇭 Switzerland + 25 more |

### Regulatory Bodies Identified (40+)

FDA (US), MHRA (UK), EMA (EU), PPB (Kenya), NAFDAC (Nigeria), CDSCO (India), SAHPRA (South Africa), ANVISA (Brazil), COFEPRIS (Mexico), SFDA (Saudi Arabia), PMDA (Japan), NMPA (China), TGA (Australia), BPOM (Indonesia), DRAP (Pakistan), and more.

---

## Risk Engine

Every verification produces a **0–100 trust score** with transparent risk signals:

| Factor | Impact |
|--------|--------|
| Product recalled | −80 |
| Product expired | −60 |
| High scan count (>10) | −20 to −40 |
| No supply chain events | −20 |
| Incomplete chain (<3 events) | −5 |
| Cryptographic signature valid | Baseline 100 |

### Status Classification

| Score | Status | Meaning |
|-------|--------|---------|
| 80–100 | ✅ GENUINE | Authentic, verified product |
| 50–79 | ⚠️ SUSPICIOUS | Anomalies detected — investigate |
| 1–49 | ❌ COUNTERFEIT | High likelihood of counterfeit |
| 0 | ❌ COUNTERFEIT | Not found in any registry |
| Any | 🚨 RECALLED | Active recall on product or lot |
| Any | ⏰ EXPIRED | Past expiry date |
| 35–50 | 🔍 UNTRACKED | Found in external registry, not on-chain |

---

## Frontend Features

| Feature | Description |
|---------|-------------|
| **Multi-format scanner** | QR Code, GS1 DataMatrix, Code 128, EAN-13, UPC-A, EAN-8, Code 39, UPC-E |
| **GS1 DataMatrix parser** | Extracts GTIN (AI 01), expiry (AI 17), lot (AI 10), serial (AI 21) |
| **Image upload scan** | Upload a photo of a barcode/QR for analysis |
| **SMS/USSD mock** | Simulated text-based verification for low-connectivity regions |
| **Trust gauge** | SVG circular gauge with animated trust score visualization |
| **Supply chain timeline** | Visual custody chain with event type icons and locations |
| **Role-aware UI** | Dashboard, Admin panel, and actions adapt to connected wallet's RBAC role |
| **Product registration** | Manufacturers can register new products on-chain |
| **Recall management** | Regulators can issue lot-wide recalls |
| **QR generation** | Generate printable QR codes for registered products |
| **Mobile-first** | Responsive design optimized for crypto wallet browsers (MetaMask, TrustWallet) |

---

## Dual-Mode Architecture

| Mode | When | How It Works |
|------|------|-------------|
| **Demo Mode** | Default (no wallet) | 1,000 pre-loaded products, global lookup cascade, all features functional |
| **Live Mode** | MetaMask connected | Real smart contract calls on Hardhat local or any EVM chain |

---

## Dataset

The demo dataset includes **1,000 pharmaceutical products** generated from real-world pharmaceutical data:

| Category | Count | Examples |
|----------|-------|---------|
| ✅ Genuine | 700 | Amoxicillin, Metformin, Atorvastatin, Artemether-Lumefantrine |
| ⏰ Expired | 100 | Products past expiry with realistic shelf life data |
| 🚨 Recalled | 50 | Products with lot-level recalls and documented reasons |
| ❌ Counterfeit | 100 | Unknown serials not in any registry |
| ⚠️ Suspicious | 50 | Cloned serials from genuine products |

**Sources**: FDA NDC Directory, EMA Medicines Database, WHO Essential Medicines List, Kenya PPB Register

**Regions**: 🇺🇸 US (400) · 🇰🇪 Kenya (300) · 🇪🇺 EU (300)

---

## Project Structure

```
dawatrace/
├── contracts/
│   ├── DawaTraceV2.sol              # Core smart contract (RBAC + GS1 + Recalls)
│   └── DrugRegistry.sol             # Legacy V1 contract
├── scripts/
│   └── deploy-v2.js                 # Deployment + participant + product seeding
├── test/
│   └── DawaTraceV2.test.js          # 28 comprehensive tests
├── data/
│   └── generate-dataset.js          # Dataset generator (1,000 products)
├── frontend/
│   ├── index.html                   # SPA shell
│   ├── app.js                       # Application logic (dual-mode)
│   ├── styles.css                   # Design system (responsive)
│   ├── global-reference.js          # GS1 prefixes + WHO + regional data
│   ├── audit.html                   # Automated test suite
│   └── data/
│       └── products.json            # 1,000-product dataset
├── vercel.json                      # Vercel deployment config
├── hardhat.config.js                # Hardhat configuration
├── deployment.json                  # Auto-generated contract address
└── package.json
```

---

## Deployment (Vercel)

```bash
# Static deployment — no server required
# vercel.json already configured
```

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Set **Output Directory** to `frontend`
3. Deploy

The site runs in Demo Mode by default. Connect a wallet to switch to Live Mode.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24, OpenZeppelin AccessControl |
| Blockchain | Hardhat Local / EVM-compatible chains |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Contract Interaction | ethers.js v6.13.4 |
| Barcode Scanning | html5-qrcode 2.3.8 |
| External APIs | OpenFDA, RxNorm (NIH) |
| Testing | Hardhat + Chai + Mocha |
| Deployment | Vercel (static) |

---

## License

MIT
