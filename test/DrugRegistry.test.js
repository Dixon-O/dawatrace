import { expect } from "chai";
import hre from "hardhat";

describe("DrugRegistry", function () {
    let registry, owner, manufacturer, distributor, pharmacy, consumer;

    beforeEach(async function () {
        [owner, manufacturer, distributor, pharmacy, consumer] = await hre.ethers.getSigners();
        const DrugRegistry = await hre.ethers.getContractFactory("DrugRegistry");
        registry = await DrugRegistry.deploy();
        await registry.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the deployer as owner", async function () {
            expect(await registry.owner()).to.equal(owner.address);
        });

        it("Should start with zero participants and batches", async function () {
            expect(await registry.getTotalParticipants()).to.equal(0);
            expect(await registry.getTotalBatches()).to.equal(0);
        });
    });

    describe("Participant Registration", function () {
        it("Should register a manufacturer", async function () {
            await registry.registerParticipant(
                manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1
            );
            const p = await registry.participants(manufacturer.address);
            expect(p.name).to.equal("Kenya Pharma Ltd");
            expect(p.role).to.equal(1);
            expect(p.isRegistered).to.be.true;
        });

        it("Should reject duplicate registration", async function () {
            await registry.registerParticipant(
                manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1
            );
            await expect(
                registry.registerParticipant(manufacturer.address, "Other", "X", 1)
            ).to.be.revertedWith("Already registered");
        });

        it("Should reject non-owner registration", async function () {
            await expect(
                registry.connect(consumer).registerParticipant(
                    manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1
                )
            ).to.be.revertedWith("Only owner can perform this action");
        });

        it("Should emit ParticipantRegistered event", async function () {
            await expect(
                registry.registerParticipant(manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1)
            ).to.emit(registry, "ParticipantRegistered");
        });
    });

    describe("Drug Batch Registration", function () {
        let expiryDate;

        beforeEach(async function () {
            await registry.registerParticipant(
                manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1
            );
            expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        });

        it("Should register a drug batch", async function () {
            await registry.connect(manufacturer).registerDrugBatch(
                "Amoxicillin 500mg", "AMX-001", expiryDate, ""
            );
            expect(await registry.getTotalBatches()).to.equal(1);
        });

        it("Should reject non-manufacturer batch registration", async function () {
            await expect(
                registry.connect(consumer).registerDrugBatch(
                    "Amoxicillin 500mg", "AMX-001", expiryDate, ""
                )
            ).to.be.revertedWith("Only manufacturers can perform this action");
        });

        it("Should emit DrugBatchRegistered event", async function () {
            await expect(
                registry.connect(manufacturer).registerDrugBatch(
                    "Amoxicillin 500mg", "AMX-001", expiryDate, ""
                )
            ).to.emit(registry, "DrugBatchRegistered");
        });

        it("Should set manufacturer as initial holder", async function () {
            const tx = await registry.connect(manufacturer).registerDrugBatch(
                "Amoxicillin 500mg", "AMX-001", expiryDate, ""
            );
            const receipt = await tx.wait();
            const event = receipt.logs.find(
                (log) => log.fragment && log.fragment.name === "DrugBatchRegistered"
            );
            const batchId = event.args[0];
            expect(await registry.currentHolder(batchId)).to.equal(manufacturer.address);
        });
    });

    describe("Custody Transfer", function () {
        let batchId, expiryDate;

        beforeEach(async function () {
            await registry.registerParticipant(manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1);
            await registry.registerParticipant(distributor.address, "MedDist EA", "MDE-001", 2);
            await registry.registerParticipant(pharmacy.address, "Kisumu Pharmacy", "KCP-001", 3);

            expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
            const tx = await registry.connect(manufacturer).registerDrugBatch(
                "Amoxicillin 500mg", "AMX-001", expiryDate, ""
            );
            const receipt = await tx.wait();
            const event = receipt.logs.find(
                (log) => log.fragment && log.fragment.name === "DrugBatchRegistered"
            );
            batchId = event.args[0];
        });

        it("Should transfer from manufacturer to distributor", async function () {
            await registry.connect(manufacturer).transferCustody(
                batchId, distributor.address, "Nairobi Hub"
            );
            expect(await registry.currentHolder(batchId)).to.equal(distributor.address);
        });

        it("Should transfer from distributor to pharmacy", async function () {
            await registry.connect(manufacturer).transferCustody(
                batchId, distributor.address, "Nairobi Hub"
            );
            await registry.connect(distributor).transferCustody(
                batchId, pharmacy.address, "Kisumu"
            );
            expect(await registry.currentHolder(batchId)).to.equal(pharmacy.address);
        });

        it("Should reject transfer by non-holder", async function () {
            await expect(
                registry.connect(distributor).transferCustody(
                    batchId, pharmacy.address, "Kisumu"
                )
            ).to.be.revertedWith("You don't hold this batch");
        });

        it("Should build full custody chain", async function () {
            await registry.connect(manufacturer).transferCustody(
                batchId, distributor.address, "Nairobi Hub"
            );
            await registry.connect(distributor).transferCustody(
                batchId, pharmacy.address, "Kisumu"
            );
            const chain = await registry.getCustodyChain(batchId);
            expect(chain.length).to.equal(3);
        });

        it("Should emit CustodyTransferred event", async function () {
            await expect(
                registry.connect(manufacturer).transferCustody(
                    batchId, distributor.address, "Nairobi Hub"
                )
            ).to.emit(registry, "CustodyTransferred");
        });
    });

    describe("Verification", function () {
        let batchId, expiryDate;

        beforeEach(async function () {
            await registry.registerParticipant(manufacturer.address, "Kenya Pharma Ltd", "KPL-001", 1);
            expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
            const tx = await registry.connect(manufacturer).registerDrugBatch(
                "Amoxicillin 500mg", "AMX-001", expiryDate, ""
            );
            const receipt = await tx.wait();
            const event = receipt.logs.find(
                (log) => log.fragment && log.fragment.name === "DrugBatchRegistered"
            );
            batchId = event.args[0];
        });

        it("Should verify authentic drug (view)", async function () {
            const result = await registry.verifyDrugView(batchId);
            expect(result.isAuthentic).to.be.true;
            expect(result.drugName).to.equal("Amoxicillin 500mg");
            expect(result.manufacturerName).to.equal("Kenya Pharma Ltd");
            expect(result.isExpired).to.be.false;
        });

        it("Should flag non-existent batch as not authentic", async function () {
            const fakeBatchId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("fake"));
            const result = await registry.verifyDrugView(fakeBatchId);
            expect(result.isAuthentic).to.be.false;
        });

        it("Anyone can verify (no registration required)", async function () {
            const result = await registry.connect(consumer).verifyDrugView(batchId);
            expect(result.isAuthentic).to.be.true;
        });
    });

    describe("Counterfeit Reporting", function () {
        it("Should emit CounterfeitReported event", async function () {
            const fakeBatchId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("fake"));
            await expect(
                registry.connect(consumer).reportCounterfeit(fakeBatchId, "-0.091,34.768")
            ).to.emit(registry, "CounterfeitReported");
        });
    });
});
