import { expect } from "chai";
import hre from "hardhat";

describe("Product ID Derivation", function () {
    let registry;

    before(async function () {
        const Factory = await hre.ethers.getContractFactory("DawaTraceV2");
        registry = await Factory.deploy();
        await registry.waitForDeployment();
    });

    it("contract computeProductId matches frontend abi.encode derivation", async function () {
        const gtin = "00312345678906";
        const serial = "SN-ABC123";

        const onChain = await registry.computeProductId(gtin, serial);
        const frontend = hre.ethers.keccak256(
            hre.ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [gtin, serial])
        );

        expect(frontend).to.equal(onChain);
    });

    it("abi.encode avoids encodePacked collision ambiguity", async function () {
        const idA = await registry.computeProductId("0312", "SN1");
        const idB = await registry.computeProductId("0312S", "N1");
        expect(idA).to.not.equal(idB);
    });

    it("matches ID used at registration time", async function () {
        const [, mfg] = await hre.ethers.getSigners();
        const MFG_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
        await registry.registerParticipant(mfg.address, "Teva", "L1", MFG_ROLE);

        const gtin = "00300456789012";
        const serial = "SN-DEMO0001";
        const expiry = Math.floor(Date.now() / 1000) + 365 * 86400;

        await registry.connect(mfg).registerProduct(gtin, serial, "LOT2026A01", "Amoxicillin", expiry);

        const expected = hre.ethers.keccak256(
            hre.ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [gtin, serial])
        );
        const stored = await registry.getProductIdAtIndex(0);
        expect(stored).to.equal(expected);
        expect(await registry.computeProductId(gtin, serial)).to.equal(expected);
    });
});
