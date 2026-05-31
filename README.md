# 💊 DawaTrace — Blockchain Drug Verification

> **One scan. One truth. One life saved.**

DawaTrace is a blockchain-powered pharmaceutical anti-counterfeit system that enables **instant drug verification** via QR code scanning. Built for the Zone01 Kisumu Blockchain Hackathon.

---

## 🎯 Problem

- **500,000 deaths/year** in sub-Saharan Africa from falsified medicines *(UNODC)*
- **1 in 10** medical products in developing countries are substandard or fake *(WHO)*
- **70%+** of Kenya's medicines are imported through fragmented, opaque supply chains *(PPB Kenya)*

**Consumers have zero way to verify if their medicine is real.**

## 💡 Solution

DawaTrace gives every medicine a verifiable digital identity on the blockchain:

```
🏭 Manufacturer → 🚛 Distributor → 🏥 Pharmacy → 📱 Consumer SCANS & VERIFIES
   registers          transfers        receives        ✅ or ❌ in seconds
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension *(optional — demo mode works without it)*

### Installation

```bash
git clone <repo-url>
cd dawatrace
npm install
```

### Run Demo (No Blockchain - Instant)

```bash
npm start
```

Open `http://localhost:3000` → the server redirects into the frontend shell and the app starts in **Demo Mode** automatically with pre-loaded data.

If you prefer to open the static file directly, `frontend/index.html` still works in a browser and will also fall back to demo mode.

### Run with Local Blockchain (Full Stack)

```bash
# Terminal 1 — Start blockchain
npx hardhat node

# Terminal 2 — Deploy contract + seed data
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 — Serve frontend locally
npm start
```

Open `http://localhost:3000` → Connect MetaMask to `localhost:8545` (Chain ID: `31337`).

### Run Tests

```bash
npx hardhat test
```

```
19 passing (2s) ✅
```

---

## 📱 Demo Flow

### Verify Authentic Medicine
1. Open `http://localhost:3000`
2. Click **"Enter Batch ID"** tab
3. Type: `DWT-AMX-2026-0528`
4. Click **Verify** → ✅ **Green result** with drug name, manufacturer, dates

### Verify Counterfeit
1. Type: `FAKE-DRUG-123`
2. Click **Verify** → ❌ **Red warning** — medicine not found on blockchain

### QR Code Scanning Demo
1. Go to **Manufacturer** page → click **QR** button on any batch → QR modal appears
2. **Screenshot or display** the QR on your phone screen
3. Go to **Verify Medicine** → click **Start Scanner** → allow camera
4. Hold the QR code in front of your webcam → auto-scans and auto-verifies

> 💡 **Pro tip:** Before the demo, screenshot the QR code for `DWT-AMX-2026-0528` and save it on your phone. During the live demo, just hold your phone up to the laptop webcam.

### Track Supply Chain
1. After a ✅ verification, click **"View Full Supply Chain"**
2. See the 3-step custody timeline:
   - 🏭 **Manufacturer** — Kenya Pharma Factory, Nairobi
   - 🚛 **Distributor** — MedDistribute Warehouse, Mombasa Road
   - 🏥 **Pharmacy** — Kisumu City Pharmacy, Oginga Odinga St

### Register New Batch
1. Go to **Manufacturer** → fill in drug name, batch number, expiry date
2. Click **Register Batch on Blockchain** → QR code modal pops up
3. New batch appears in **Recent Batches** list — ready to verify

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                    │
│         HTML5 / CSS3 / Vanilla JavaScript            │
│                                                     │
│  ┌──────────┐ ┌────────────┐ ┌───────┐ ┌─────────┐ │
│  │  Verify   │ │ Dashboard  │ │ Track │ │  About  │ │
│  └────┬─────┘ └─────┬──────┘ └───┬───┘ └─────────┘ │
│       │             │            │                  │
│  ┌────▼─────────────▼────────────▼───┐              │
│  │     ethers.js / Demo Mode         │              │
│  └────────────────┬──────────────────┘              │
└───────────────────┼─────────────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │   DrugRegistry.sol    │
        │   (Solidity 0.8.24)   │
        │                       │
        │ • registerParticipant │
        │ • registerDrugBatch   │
        │ • transferCustody     │
        │ • verifyDrugView      │
        │ • reportCounterfeit   │
        │ • getCustodyChain     │
        └───────────────────────┘
        Polygon / Hardhat Local
```

### Dual-Mode System

| Mode | When | How It Works |
|------|------|-------------|
| **Demo Mode** | Default (no wallet) | Pre-loaded data, instant responses, no blockchain needed |
| **Live Mode** | MetaMask connected | Real smart contract calls on Hardhat or Polygon |

---

## 📁 Project Structure

```
pharmachain/
├── contracts/
│   └── DrugRegistry.sol       # Core smart contract (350 lines)
├── scripts/
│   └── deploy.js              # Deployment + demo data seeding
├── test/
│   └── DrugRegistry.test.js   # 19 comprehensive tests
├── frontend/
│   ├── index.html             # Single-page app (4 pages)
│   ├── app.js                 # Frontend logic + demo mode
│   ├── styles.css             # Premium dark theme (1225 lines)
│   └── spec.md                # UI specification for future devs
├── hardhat.config.js          # Hardhat v2 configuration
├── deployment.json            # Auto-generated contract address
├── PITCH.md                   # 2-minute pitch script
├── JUDGE_QA.md                # Top 3 judge Q&A prep
└── README.md                  # This file
```

---

## 🔒 Smart Contract Features

| Feature | Description |
|---------|------------|
| **Role-based access** | Manufacturer, Distributor, Pharmacy — each with specific permissions |
| **Batch registration** | Drug name, batch number, expiry date, IPFS metadata hash |
| **Custody transfer** | Enforces supply chain order: Manufacturer → Distributor → Pharmacy |
| **Free verification** | `verifyDrugView()` is a view function — zero gas cost for consumers |
| **Counterfeit reporting** | Anonymous on-chain reports with GPS coordinates |
| **Event-driven** | 4 events for frontend reactivity and audit trails |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24 |
| Blockchain | Polygon (Hardhat local for dev) |
| Frontend | HTML5, CSS3, Vanilla JS |
| Contract Interaction | ethers.js v6 |
| QR Generation | qrcode.js |
| QR Scanning | html5-qrcode v2.3.8 |
| Testing | Hardhat + Chai + Mocha |

---

## 📊 Test Results

```
  DrugRegistry
    Deployment
      ✔ Should set the deployer as owner
      ✔ Should start with zero participants and batches
    Participant Registration
      ✔ Should register a manufacturer
      ✔ Should reject duplicate registration
      ✔ Should reject non-owner registration
      ✔ Should emit ParticipantRegistered event
    Drug Batch Registration
      ✔ Should register a drug batch
      ✔ Should reject non-manufacturer batch registration
      ✔ Should emit DrugBatchRegistered event
      ✔ Should set manufacturer as initial holder
    Custody Transfer
      ✔ Should transfer from manufacturer to distributor
      ✔ Should transfer from distributor to pharmacy
      ✔ Should reject transfer by non-holder
      ✔ Should build full custody chain
      ✔ Should emit CustodyTransferred event
    Verification
      ✔ Should verify authentic drug (view)
      ✔ Should flag non-existent batch as not authentic
      ✔ Anyone can verify (no registration required)
    Counterfeit Reporting
      ✔ Should emit CounterfeitReported event

  19 passing (2s)
```

---

## 🎤 Demo Batch IDs

| Batch ID | Drug | Status |
|----------|------|--------|
| `DWT-AMX-2026-0528` | Amoxicillin 500mg | ✅ Authentic |
| `DWT-PAR-2026-0415` | Paracetamol 250mg | ✅ Authentic |
| `DWT-ART-2025-0812` | Artemether-Lumefantrine | ⚠️ Expired |
| `FAKE-DRUG-123` | — | ❌ Counterfeit |

---

## 🧑‍💻 Team

Built at the **Zone01 Kisumu Blockchain Hackathon**, May 2026.

---

## 📜 License

MIT
