import { expect } from "chai";
import hre from "hardhat";

describe("DawaTraceV2", function () {
    let registry, admin, mfg1, mfg2, distributor, pharmacy, regulator, consumer;
    let MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, PHARMACY_ROLE, REGULATOR_ROLE, ADMIN_ROLE;

    beforeEach(async function () {
        [admin, mfg1, mfg2, distributor, pharmacy, regulator, consumer] = await hre.ethers.getSigners();
        const Factory = await hre.ethers.getContractFactory("DawaTraceV2");
        registry = await Factory.deploy();
        await registry.waitForDeployment();

        MANUFACTURER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
        DISTRIBUTOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
        PHARMACY_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PHARMACY_ROLE"));
        REGULATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("REGULATOR_ROLE"));
        ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    });

    describe("Deployment", function () {
        it("Should grant deployer DEFAULT_ADMIN_ROLE", async function () {
            expect(await registry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
        });
        it("Should start with zero products and participants", async function () {
            expect(await registry.getTotalProducts()).to.equal(0);
            expect(await registry.getTotalParticipants()).to.equal(0);
        });
    });

    describe("Participant Registration", function () {
        it("Should register a manufacturer with role", async function () {
            await registry.registerParticipant(mfg1.address, "Teva Pharma", "LIC-001", MANUFACTURER_ROLE);
            const p = await registry.participants(mfg1.address);
            expect(p.name).to.equal("Teva Pharma");
            expect(p.isActive).to.be.true;
            expect(await registry.hasRole(MANUFACTURER_ROLE, mfg1.address)).to.be.true;
        });
        it("Should reject non-admin registration", async function () {
            await expect(
                registry.connect(consumer).registerParticipant(mfg1.address, "X", "Y", MANUFACTURER_ROLE)
            ).to.be.reverted;
        });
        it("Should reject duplicate registration", async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            await expect(
                registry.registerParticipant(mfg1.address, "Other", "L2", MANUFACTURER_ROLE)
            ).to.be.revertedWith("Already registered");
        });
        it("Should deactivate participant and revoke roles", async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            await registry.deactivateParticipant(mfg1.address);
            const p = await registry.participants(mfg1.address);
            expect(p.isActive).to.be.false;
            expect(await registry.hasRole(MANUFACTURER_ROLE, mfg1.address)).to.be.false;
        });
        it("Should emit ParticipantRegistered event", async function () {
            await expect(
                registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE)
            ).to.emit(registry, "ParticipantRegistered");
        });
    });

    describe("Product Registration", function () {
        let expiryDate;
        beforeEach(async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            expiryDate = Math.floor(Date.now() / 1000) + 365 * 86400;
        });
        it("Should register product with GS1 fields", async function () {
            const tx = await registry.connect(mfg1).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amoxicillin 500mg", expiryDate);
            await tx.wait();
            expect(await registry.getTotalProducts()).to.equal(1);
        });
        it("Should reject non-manufacturer", async function () {
            await expect(
                registry.connect(consumer).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amox", expiryDate)
            ).to.be.reverted;
        });
        it("Should store correct GS1 data", async function () {
            await registry.connect(mfg1).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amoxicillin 500mg", expiryDate);
            const pid = await registry.getProductIdAtIndex(0);
            const p = await registry.products(pid);
            expect(p.gtin).to.equal("00312345678906");
            expect(p.serialNumber).to.equal("SN-ABC123");
            expect(p.lotNumber).to.equal("LOT2026A");
            expect(p.productName).to.equal("Amoxicillin 500mg");
        });
        it("Should set manufacturer as initial holder", async function () {
            await registry.connect(mfg1).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amox", expiryDate);
            const pid = await registry.getProductIdAtIndex(0);
            expect(await registry.currentHolder(pid)).to.equal(mfg1.address);
        });
        it("Should emit ProductRegistered event", async function () {
            await expect(
                registry.connect(mfg1).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amox", expiryDate)
            ).to.emit(registry, "ProductRegistered");
        });
    });

    describe("Custody Transfer", function () {
        let productId, expiryDate;
        beforeEach(async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            await registry.registerParticipant(distributor.address, "McKesson", "L2", DISTRIBUTOR_ROLE);
            await registry.registerParticipant(pharmacy.address, "CVS", "L3", PHARMACY_ROLE);
            expiryDate = Math.floor(Date.now() / 1000) + 365 * 86400;
            await registry.connect(mfg1).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amox", expiryDate);
            productId = await registry.getProductIdAtIndex(0);
        });
        it("Should transfer manufacturer to distributor", async function () {
            await registry.connect(mfg1).transferCustody(productId, distributor.address, "Warehouse A", "shipped");
            expect(await registry.currentHolder(productId)).to.equal(distributor.address);
        });
        it("Should transfer distributor to pharmacy", async function () {
            await registry.connect(mfg1).transferCustody(productId, distributor.address, "Warehouse", "shipped");
            await registry.connect(distributor).transferCustody(productId, pharmacy.address, "Store", "received");
            expect(await registry.currentHolder(productId)).to.equal(pharmacy.address);
        });
        it("Should reject transfer by non-holder", async function () {
            await expect(
                registry.connect(distributor).transferCustody(productId, pharmacy.address, "X", "shipped")
            ).to.be.revertedWith("You don't hold this product");
        });
        it("Should build full custody chain", async function () {
            await registry.connect(mfg1).transferCustody(productId, distributor.address, "W", "shipped");
            await registry.connect(distributor).transferCustody(productId, pharmacy.address, "S", "received");
            const chain = await registry.getCustodyChain(productId);
            expect(chain.length).to.equal(3); // initial + 2 transfers
        });
    });

    describe("Verification", function () {
        let productId, expiryDate;
        beforeEach(async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            expiryDate = Math.floor(Date.now() / 1000) + 365 * 86400;
            await registry.connect(mfg1).registerProduct("00312345678906", "SN-ABC123", "LOT2026A", "Amoxicillin", expiryDate);
            productId = await registry.getProductIdAtIndex(0);
        });
        it("Should return GENUINE for valid product", async function () {
            const r = await registry.verifyProductView(productId);
            expect(r.status).to.equal("GENUINE");
            expect(r.isAuthentic).to.be.true;
            expect(r.exists).to.be.true;
        });
        it("Should return COUNTERFEIT for unknown product", async function () {
            const fakeId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("fake"));
            const r = await registry.verifyProductView(fakeId);
            expect(r.status).to.equal("COUNTERFEIT");
            expect(r.exists).to.be.false;
        });
        it("Should return EXPIRED for expired product", async function () {
            const shortExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
            await registry.connect(mfg1).registerProduct("00399999999999", "SN-EXP001", "LOTEXP", "ExpDrug", shortExpiry);
            const pid = await registry.getProductIdAtIndex(1);
            await hre.network.provider.send("evm_increaseTime", [7200]); // 2 hours
            await hre.network.provider.send("evm_mine");
            const r = await registry.verifyProductView(pid);
            expect(r.status).to.equal("EXPIRED");
            expect(r.isExpired).to.be.true;
        });
        it("Should return RECALLED for recalled product", async function () {
            await registry.registerParticipant(regulator.address, "PPB", "R1", REGULATOR_ROLE);
            await registry.connect(regulator).recallProduct(productId, "Contamination");
            const r = await registry.verifyProductView(productId);
            expect(r.status).to.equal("RECALLED");
            expect(r.isRecalled).to.be.true;
            expect(r.recallReason).to.equal("Contamination");
        });
        it("Anyone can verify without a role", async function () {
            const r = await registry.connect(consumer).verifyProductView(productId);
            expect(r.status).to.equal("GENUINE");
        });
    });

    describe("Recalls", function () {
        let productId;
        beforeEach(async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            await registry.registerParticipant(regulator.address, "PPB", "R1", REGULATOR_ROLE);
            const exp = Math.floor(Date.now() / 1000) + 365 * 86400;
            await registry.connect(mfg1).registerProduct("00312345678906", "SN-RCL001", "LOTRCL", "DrugX", exp);
            productId = await registry.getProductIdAtIndex(0);
        });
        it("Regulator can recall a product", async function () {
            await expect(
                registry.connect(regulator).recallProduct(productId, "Impurity detected")
            ).to.emit(registry, "ProductRecalled");
        });
        it("Regulator can recall a lot", async function () {
            await expect(
                registry.connect(regulator).recallLot("LOTRCL", "Failed testing")
            ).to.emit(registry, "LotRecalled");
        });
        it("Non-regulator cannot recall", async function () {
            await expect(
                registry.connect(consumer).recallProduct(productId, "hack")
            ).to.be.revertedWith("Only regulator or admin");
        });
        it("Lot recall affects product verification", async function () {
            await registry.connect(regulator).recallLot("LOTRCL", "Potency issue");
            const r = await registry.verifyProductView(productId);
            expect(r.status).to.equal("RECALLED");
        });
    });

    describe("Role Detection", function () {
        it("Should return correct role string", async function () {
            await registry.registerParticipant(mfg1.address, "Teva", "L1", MANUFACTURER_ROLE);
            expect(await registry.getParticipantRole(mfg1.address)).to.equal("MANUFACTURER");
        });
        it("Should return CONSUMER for unregistered address", async function () {
            expect(await registry.getParticipantRole(consumer.address)).to.equal("CONSUMER");
        });
        it("Should return ADMIN for deployer", async function () {
            expect(await registry.getParticipantRole(admin.address)).to.equal("ADMIN");
        });
    });
});
