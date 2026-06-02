# 💊 DawaTrace

**Blockchain-powered pharmaceutical supply chain verification platform.**

DawaTrace enables instant verification of medicine authenticity across Kenya's pharmaceutical supply chain using smart contract technology. It provides an immutable, transparent record of every handoff — from manufacturer to distributor to pharmacy — so consumers can confirm their medicine is genuine with a single scan.

---

## Problem

The World Health Organization estimates that **1 in 10 medical products** circulating in low- and middle-income countries is substandard or falsified. In Sub-Saharan Africa, that figure rises to **30%**. Counterfeit medicines kill an estimated **250,000 children annually** from fake antimalarials alone.

DawaTrace provides the verification infrastructure to combat this crisis.

---

## How It Works

```
🏭 Manufacturer → 🚛 Distributor → 🏥 Pharmacy → 📱 Consumer SCANS & VERIFIES
   registers          transfers        receives        ✅ or ❌ in seconds
```

1. **Manufacturers** register drug batches on-chain with immutable metadata
2. **Custody transfers** are recorded at each handoff point, enforcing supply chain order
3. **Consumers** verify any medicine instantly by entering its batch ID or scanning a QR code
4. **Regulators** can audit the full provenance chain of any batch in real time

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                        │
│           HTML5 / CSS3 / Vanilla JavaScript              │
│                                                         │
│  ┌──────────┐ ┌────────────┐ ┌───────┐ ┌───────────┐   │
│  │  Verify   │ │ Dashboard  │ │ Track │ │ Analytics │   │
│  └────┬─────┘ └─────┬──────┘ └───┬───┘ └─────┬─────┘   │
│       │             │            │            │         │
│  ┌────▼─────────────▼────────────▼────────────▼───┐     │
│  │          ethers.js v6 / Demo Mode              │     │
│  └────────────────────┬───────────────────────────┘     │
└───────────────────────┼─────────────────────────────────┘
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

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension *(optional — demo mode works without it)*

### Installation

```bash
git clone <repo-url>
cd dawatrace
npm install
```

### Run in Demo Mode (No Blockchain Required)

```bash
npm run serve
```

Open `http://localhost:3000` — the app starts in **Demo Mode** automatically with pre-loaded sample data. All features are fully functional without a blockchain connection.

### Run with Local Blockchain (Full Stack)

```bash
# Terminal 1 — Start local blockchain
npm run node

# Terminal 2 — Deploy contract + seed data
npm run deploy

# Terminal 3 — Serve frontend
npm run serve
```

Open `http://localhost:3000` → Click **Connect Wallet** → MetaMask auto-switches to `localhost:8545` (Chain ID: `31337`).

### Run Tests

```bash
npm test
```

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

  19 passing
```

---

## Dual-Mode Architecture

| Mode | When | How It Works |
|------|------|-------------|
| **Demo Mode** | Default (no wallet) | Pre-loaded data, simulated responses, no blockchain needed |
| **Live Mode** | MetaMask connected | Real smart contract calls on Hardhat local or Polygon |

The system seamlessly switches between modes. All UI features work identically in both modes — live mode simply reads/writes real on-chain data.

---

## Smart Contract Features

| Feature | Description |
|---------|-------------|
| **Role-based access control** | Owner, Manufacturer, Distributor, Pharmacy — each with specific permissions |
| **Batch registration** | Drug name, batch number, expiry date, IPFS metadata hash |
| **Custody transfer enforcement** | Supply chain order: Manufacturer → Distributor → Pharmacy |
| **Free verification** | `verifyDrugView()` is a view function — zero gas cost for consumers |
| **Counterfeit reporting** | On-chain reports with GPS coordinates / location data |
| **Event-driven architecture** | 5 events for frontend reactivity and audit trails |
| **Full enumeration** | Batch IDs and participants are enumerable for dashboard views |

---

## Project Structure

```
dawatrace/
├── contracts/
│   └── DrugRegistry.sol           # Core smart contract
├── scripts/
│   └── deploy.js                  # Deployment + data seeding (8 batches)
├── test/
│   └── DrugRegistry.test.js       # 19 comprehensive tests
├── frontend/
│   ├── index.html                 # SPA shell with semantic HTML5
│   ├── app.js                     # Full application logic (dual-mode)
│   └── styles.css                 # Responsive design system
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Scripts and dependencies
├── deployment.json                # Auto-generated contract address
└── README.md
```

---

## Demo Batch IDs

| Batch ID | Drug | Manufacturer | Status |
|----------|------|-------------|--------|
| `DWT-AMX-2026-0528` | Amoxicillin 500mg | Kenya Pharma Ltd | ✅ Authentic |
| `DWT-CIP-2025-1120` | Ciprofloxacin 500mg | Kenya Pharma Ltd | ✅ Authentic |
| `DWT-IBU-2026-0610` | Ibuprofen 400mg | Beta Healthcare Intl | ✅ Authentic |
| `DWT-OME-2026-0915` | Omeprazole 20mg | Kenya Pharma Ltd | ✅ Authentic |
| `DWT-MET-2026-0301` | Metformin 500mg | Universal Corp of Kenya | ✅ Authentic |
| `DWT-AZI-2026-0130` | Azithromycin 250mg | Beta Healthcare Intl | ✅ Authentic |
| `DWT-PAR-2026-0415` | Paracetamol 250mg | Beta Healthcare Intl | ✅ Authentic |
| `DWT-ART-2025-0812` | Artemether-Lumefantrine | Universal Corp of Kenya | ⚠️ Expired |
| `FAKE-DRUG-123` | — | — | ❌ Counterfeit |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24 |
| Blockchain | Polygon (Hardhat local for development) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Contract Interaction | ethers.js v6 |
| Testing | Hardhat + Chai + Mocha |
| QR Generation | goqr.me API |

---

## Team

Built at **Zone01 Kisumu**.

---

## License

MIT
