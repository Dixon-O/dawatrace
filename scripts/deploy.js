const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🔗 Deploying DawaTrace DrugRegistry...\n");

    const DrugRegistry = await hre.ethers.getContractFactory("DrugRegistry");
    const registry = await DrugRegistry.deploy();
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log(`✅ DrugRegistry deployed to: ${address}`);
    console.log(`   Owner: ${(await hre.ethers.getSigners())[0].address}\n`);

    const [owner, manufacturer, distributor, pharmacy] = await hre.ethers.getSigners();

    console.log("📋 Registering sample participants...");

    await registry.registerParticipant(
        manufacturer.address,
        "Kenya Pharma Ltd (and peers)",
        "KPL-MFG-2024-001",
        1
    );
    console.log(`   ✅ Manufacturer: Kenya Pharma Ltd (${manufacturer.address})`);

    await registry.registerParticipant(
        distributor.address,
        "MedDistribute East Africa",
        "MDE-DST-2024-042",
        2
    );
    console.log(`   ✅ Distributor: MedDistribute East Africa (${distributor.address})`);

    await registry.registerParticipant(
        pharmacy.address,
        "Kisumu City Pharmacy (and peers)",
        "KCP-PHA-2024-108",
        3
    );
    console.log(`   ✅ Pharmacy: Kisumu City Pharmacy (${pharmacy.address})`);

    console.log("\n💊 Registering sample drug batches...");

    // Batch 1: Amoxicillin (Authentic)
    const exp1 = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
    let tx = await registry.connect(manufacturer).registerDrugBatch(
        "Amoxicillin 500mg",
        "DWT-AMX-2026-0528",
        exp1,
        ""
    );
    await tx.wait();
    console.log(`   ✅ Registered Batch: DWT-AMX-2026-0528 (Amoxicillin)`);

    // Batch 2: Paracetamol (Authentic)
    const exp2 = Math.floor(Date.now() / 1000) + (300 * 24 * 60 * 60);
    tx = await registry.connect(manufacturer).registerDrugBatch(
        "Paracetamol 250mg",
        "DWT-PAR-2026-0415",
        exp2,
        ""
    );
    await tx.wait();
    console.log(`   ✅ Registered Batch: DWT-PAR-2026-0415 (Paracetamol)`);

    // Batch 3: Artemether-Lumefantrine (Expired)
    const exp3 = Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60);
    tx = await registry.connect(manufacturer).registerDrugBatch(
        "Artemether-Lumefantrine 20/120mg",
        "DWT-ART-2025-0812",
        exp3,
        ""
    );
    await tx.wait();
    console.log(`   ✅ Registered Batch: DWT-ART-2025-0812 (Artemether - EXPIRED)`);

    console.log("\n📦 Transferring custody for DWT-AMX-2026-0528...");
    const batchIdAMX = await registry.getBatchIdAtIndex(0);
    await registry.connect(manufacturer).transferCustody(
        batchIdAMX,
        distributor.address,
        "MedDistribute Warehouse, Mombasa Road"
    );
    await registry.connect(distributor).transferCustody(
        batchIdAMX,
        pharmacy.address,
        "Kisumu City Pharmacy, Oginga Odinga St"
    );
    console.log("   ✅ Custody Chain Built: Manufacturer → Distributor → Pharmacy");

    console.log("\n🔍 Verifying Amoxicillin batch...");
    const result = await registry.verifyDrugView(batchIdAMX);
    console.log(`   Authentic: ${result.isAuthentic ? "✅ YES" : "❌ NO"}`);
    console.log(`   Expired: ${result.isExpired ? "⚠️ YES" : "✅ NO"}`);
    console.log(`   Custody transfers: ${result.custodyCount}`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DawaTrace deployment complete!");
    console.log("=".repeat(60));

    const deploymentInfo = {
        contractAddress: address,
        network: hre.network.name,
        deployer: owner.address,
        sampleBatchId: "DWT-AMX-2026-0528",
        sampleManufacturer: manufacturer.address,
        sampleDistributor: distributor.address,
        samplePharmacy: pharmacy.address,
    };

    fs.writeFileSync(
        "./deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n📄 Deployment info saved to deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
