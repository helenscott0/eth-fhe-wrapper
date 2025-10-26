import { ethers, deployments, fhevm } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("CETHWrapper", function () {
  let alice: HardhatEthersSigner;
  let cethAddr: string;
  let ceth: any;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("Skipping CETHWrapper tests on non-mock networks");
      this.skip();
    }
    await deployments.fixture();
    [alice] = await ethers.getSigners();
    const dep = await deployments.get("CETHWrapper");
    cethAddr = dep.address;
    ceth = await ethers.getContractAt("CETHWrapper", cethAddr);
  });

  it("wraps ETH and updates encrypted balance", async function () {
    const rate = await ceth.rate();
    const amount = rate * 5n; // 5 units
    const tx = await ceth.connect(alice).wrapEth(alice.address, { value: amount });
    await tx.wait();

    const encBal = await ceth.confidentialBalanceOf(alice.address);
    expect(encBal).to.not.eq(ethers.ZeroHash);

    const clearBal = await fhevm.userDecryptEuint(FhevmType.euint64, encBal, cethAddr, alice);
    expect(BigInt(clearBal)).to.eq(5n);
  });
});

