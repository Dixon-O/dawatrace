import hre from "hardhat";
import fs from "fs";

async function main() {
    console.log("🔗 Deploying DawaTraceV2...\n");

    const Factory = await hre.ethers.getContractFactory("DawaTraceV2");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    const address = await registry.getAddress();

    const signers = await hre.ethers.getSigners();
    const [admin, mfg1, mfg2, mfg3, distributor, pharmacy, regulator] = signers;

    const MFG_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
    const DIST_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
    const PHARM_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PHARMACY_ROLE"));
    const REG_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("REGULATOR_ROLE"));

    console.log(`✅ DawaTraceV2 deployed to: ${address}`);
    console.log(`   Admin: ${admin.address}\n`);

    // Register participants
    console.log("📋 Registering participants...\n");
    const parts = [
        { signer: mfg1, name: "Teva Pharmaceuticals", lic: "TEVA-MFG-2024", role: MFG_ROLE, label: "Manufacturer" },
        { signer: mfg2, name: "Cipla Ltd", lic: "CIPLA-MFG-2024", role: MFG_ROLE, label: "Manufacturer" },
        { signer: mfg3, name: "Beta Healthcare Kenya", lic: "BHK-MFG-2024", role: MFG_ROLE, label: "Manufacturer" },
        { signer: distributor, name: "McKesson Distribution", lic: "MCK-DST-2024", role: DIST_ROLE, label: "Distributor" },
        { signer: pharmacy, name: "CVS Pharmacy", lic: "CVS-PHA-2024", role: PHARM_ROLE, label: "Pharmacy" },
        { signer: regulator, name: "Kenya PPB", lic: "PPB-REG-2024", role: REG_ROLE, label: "Regulator" },
    ];
    for (const p of parts) {
        await registry.registerParticipant(p.signer.address, p.name, p.lic, p.role);
        console.log(`   ✅ ${p.label}: ${p.name} (${p.signer.address})`);
    }

    // Register sample products
    console.log("\n💊 Registering products...\n");
    const DAY = 86400;
    const now = Math.floor(Date.now() / 1000);
    const products = [
        { signer: mfg1, gtin: "00300456789012", sn: "SN-DEMO0001", lot: "LOT2026A01", name: "Amoxicillin 500mg Capsule", exp: now + 365*DAY },
        { signer: mfg1, gtin: "00300456789029", sn: "SN-DEMO0002", lot: "LOT2026B01", name: "Metformin 500mg Tablet", exp: now + 365*DAY },
        { signer: mfg2, gtin: "06100123456789", sn: "SN-DEMO0003", lot: "LOT2026C01", name: "Artemether-Lumefantrine 20/120mg", exp: now + 365*DAY },
        { signer: mfg3, gtin: "06100123456796", sn: "SN-DEMO0004", lot: "LOT2025X09", name: "Paracetamol 500mg Tablet", exp: now + 365*DAY },
        { signer: mfg1, gtin: "00300456789036", sn: "SN-DEMO0005", lot: "LOT2026D01", name: "Omeprazole 20mg Capsule", exp: now + 365*DAY },
    ];
    const pids = [];
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const tx = await registry.connect(p.signer).registerProduct(p.gtin, p.sn, p.lot, p.name, p.exp);
        await tx.wait();
        const pid = await registry.getProductIdAtIndex(i);
        pids.push(pid);
        console.log(`   ✅ ${i+1}/${products.length}: ${p.name} (${p.sn})`);
    }

    // Custody chains
    console.log("\n📦 Building custody chains...\n");
    await registry.connect(mfg1).transferCustody(pids[0], distributor.address, "McKesson DC, Columbus OH", "shipped");
    await registry.connect(distributor).transferCustody(pids[0], pharmacy.address, "CVS #4521, Chicago IL", "dispensed");
    console.log("   ✅ Amoxicillin: Manufacturer → Distributor → Pharmacy");

    await registry.connect(mfg1).transferCustody(pids[1], distributor.address, "McKesson DC, Indianapolis IN", "shipped");
    console.log("   ✅ Metformin: Manufacturer → Distributor");

    await registry.connect(mfg2).transferCustody(pids[2], distributor.address, "Mombasa Port, Kenya", "shipped");
    await registry.connect(distributor).transferCustody(pids[2], pharmacy.address, "Kisumu City Pharmacy", "dispensed");
    console.log("   ✅ Artemether-Lumefantrine: Manufacturer → Distributor → Pharmacy");

    // Recall a lot
    console.log("\n⚠️  Issuing recall...\n");
    await registry.connect(regulator).recallLot("LOT2025X09", "Failed dissolution testing — potency below specification");
    console.log("   ✅ LOT2025X09 recalled by Kenya PPB");

    // Verify
    console.log("\n🔍 Verification test...\n");
    const r = await registry.verifyProductView(pids[0]);
    console.log(`   Product: ${r.productName}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   GTIN: ${r.gtin} | Serial: ${r.serialNumber}`);
    console.log(`   Custody: ${r.custodyCount} events`);

    const r2 = await registry.verifyProductView(pids[3]);
    console.log(`\n   Product: ${r2.productName}`);
    console.log(`   Status: ${r2.status} — ${r2.recallReason}`);

    // Save deployment info
    const info = {
        contractAddress: address,
        contractName: "DawaTraceV2",
        network: hre.network.name,
        deployer: admin.address,
        participants: parts.map(p => ({ name: p.name, address: p.signer.address, role: p.label })),
        sampleProducts: products.length,
        timestamp: new Date().toISOString(),
    };
    fs.writeFileSync("./deployment.json", JSON.stringify(info, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DawaTraceV2 deployment complete!");
    console.log("=".repeat(60));
    console.log("\n📄 Saved to deployment.json\n");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
