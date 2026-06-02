import hre from "hardhat";
import fs from "fs";

async function main() {
    console.log("🔗 Deploying DawaTrace DrugRegistry...\n");

    const DrugRegistry = await hre.ethers.getContractFactory("DrugRegistry");
    const registry = await DrugRegistry.deploy();
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    const signers = await hre.ethers.getSigners();
    const [owner, mfg1, mfg2, mfg3, distributor, pharmacy] = signers;

    console.log(`✅ DrugRegistry deployed to: ${address}`);
    console.log(`   Owner/Deployer: ${owner.address}\n`);

    // ============================================================
    // REGISTER PARTICIPANTS
    // ============================================================
    console.log("📋 Registering supply chain participants...\n");

    // 3 Manufacturers
    await registry.registerParticipant(mfg1.address, "Kenya Pharma Ltd", "KPL-MFG-2024-001", 1);
    console.log(`   ✅ Manufacturer: Kenya Pharma Ltd (${mfg1.address})`);

    await registry.registerParticipant(mfg2.address, "Beta Healthcare Intl", "BHI-MFG-2024-002", 1);
    console.log(`   ✅ Manufacturer: Beta Healthcare Intl (${mfg2.address})`);

    await registry.registerParticipant(mfg3.address, "Universal Corp of Kenya", "UCK-MFG-2024-003", 1);
    console.log(`   ✅ Manufacturer: Universal Corp of Kenya (${mfg3.address})`);

    // 1 Distributor
    await registry.registerParticipant(distributor.address, "MedDistribute East Africa", "MDE-DST-2024-042", 2);
    console.log(`   ✅ Distributor: MedDistribute East Africa (${distributor.address})`);

    // 1 Pharmacy
    await registry.registerParticipant(pharmacy.address, "Kisumu City Pharmacy", "KCP-PHA-2024-108", 3);
    console.log(`   ✅ Pharmacy: Kisumu City Pharmacy (${pharmacy.address})`);

    // ============================================================
    // REGISTER DRUG BATCHES (8 total)
    // ============================================================
    console.log("\n💊 Registering drug batches...\n");

    const DAY = 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);
    const batchIds = [];

    const batches = [
        { signer: mfg1, name: "Amoxicillin 500mg",                  num: "DWT-AMX-2026-0528", expiry: now + 365 * DAY },
        { signer: mfg1, name: "Ciprofloxacin 500mg",                num: "DWT-CIP-2025-1120", expiry: now + 300 * DAY },
        { signer: mfg2, name: "Ibuprofen 400mg",                    num: "DWT-IBU-2026-0610", expiry: now + 365 * DAY },
        { signer: mfg1, name: "Omeprazole 20mg",                    num: "DWT-OME-2026-0915", expiry: now + 365 * DAY },
        { signer: mfg3, name: "Metformin 500mg",                    num: "DWT-MET-2026-0301", expiry: now + 300 * DAY },
        { signer: mfg2, name: "Azithromycin 250mg",                 num: "DWT-AZI-2026-0130", expiry: now + 300 * DAY },
        { signer: mfg2, name: "Paracetamol 250mg",                  num: "DWT-PAR-2026-0415", expiry: now + 300 * DAY },
        { signer: mfg3, name: "Artemether-Lumefantrine 20/120mg",   num: "DWT-ART-2025-0812", expiry: now + 1 * DAY }, // Near-expiry for demo
    ];

    for (const batch of batches) {
        const tx = await registry.connect(batch.signer).registerDrugBatch(
            batch.name, batch.num, batch.expiry, ""
        );
        await tx.wait();
        const idx = batchIds.length;
        const batchId = await registry.getBatchIdAtIndex(idx);
        batchIds.push(batchId);
        const tag = batch.num === "DWT-ART-2025-0812" ? " (near-expiry)" : "";
        console.log(`   ✅ Batch ${idx + 1}/8: ${batch.num} — ${batch.name}${tag}`);
    }

    // ============================================================
    // BUILD CUSTODY CHAINS
    // ============================================================
    console.log("\n📦 Building custody chains...\n");

    // AMX: Manufacturer → Distributor → Pharmacy (3 transfers total including registration)
    await registry.connect(mfg1).transferCustody(batchIds[0], distributor.address, "MedDistribute Warehouse, Mombasa Road, Nairobi");
    await registry.connect(distributor).transferCustody(batchIds[0], pharmacy.address, "Kisumu City Pharmacy, Oginga Odinga St, Kisumu");
    console.log("   ✅ DWT-AMX-2026-0528: Manufacturer → Distributor → Pharmacy");

    // PAR: Manufacturer → Pharmacy (2 transfers)
    await registry.connect(mfg2).transferCustody(batchIds[6], pharmacy.address, "Nairobi Central Pharmacy, Tom Mboya St");
    console.log("   ✅ DWT-PAR-2026-0415: Manufacturer → Pharmacy");

    // ART: Manufacturer → Distributor → Pharmacy (3 transfers)
    await registry.connect(mfg3).transferCustody(batchIds[7], distributor.address, "PharmAccess Distributor, Eldoret");
    await registry.connect(distributor).transferCustody(batchIds[7], pharmacy.address, "Lake Region Pharmacy, Busia");
    console.log("   ✅ DWT-ART-2025-0812: Manufacturer → Distributor → Pharmacy");

    // ============================================================
    // VERIFICATION TEST
    // ============================================================
    console.log("\n🔍 Running verification test...\n");

    const result = await registry.verifyDrugView(batchIds[0]);
    console.log(`   Drug: ${result.drugName}`);
    console.log(`   Authentic: ${result.isAuthentic ? "✅ YES" : "❌ NO"}`);
    console.log(`   Expired: ${result.isExpired ? "⚠️ YES" : "✅ NO"}`);
    console.log(`   Custody transfers: ${result.custodyCount}`);

    // ============================================================
    // SAVE DEPLOYMENT INFO
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DawaTrace deployment complete!");
    console.log("=".repeat(60));

    const deploymentInfo = {
        contractAddress: address,
        network: hre.network.name,
        deployer: owner.address,
        participants: {
            manufacturers: [
                { name: "Kenya Pharma Ltd", address: mfg1.address },
                { name: "Beta Healthcare Intl", address: mfg2.address },
                { name: "Universal Corp of Kenya", address: mfg3.address },
            ],
            distributor: { name: "MedDistribute East Africa", address: distributor.address },
            pharmacy: { name: "Kisumu City Pharmacy", address: pharmacy.address },
        },
        batchCount: batches.length,
        timestamp: new Date().toISOString(),
    };

    fs.writeFileSync("./deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
