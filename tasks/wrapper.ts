import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("wrapper:addresses", "Print deployed addresses").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const weth = await deployments.get("WETH9");
  const ceth = await deployments.get("CETHWrapper");
  console.log(`WETH9       : ${weth.address}`);
  console.log(`CETHWrapper : ${ceth.address}`);
});

task("wrapper:wrap-eth", "Wrap native ETH into cETH")
  .addParam("amount", "ETH amount in wei")
  .addOptionalParam("to", "Recipient address (defaults to sender)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    const ceth = await deployments.get("CETHWrapper");
    const contract = await ethers.getContractAt("CETHWrapper", ceth.address);

    const to = args.to || signer.address;
    const amount = BigInt(args.amount);
    const tx = await contract.connect(signer).wrapEth(to, { value: amount });
    console.log(`wrapEth tx: ${tx.hash}`);
    await tx.wait();
  });

task("wrapper:balance", "Read encrypted cETH balance and decrypt (mock/local only)")
  .addOptionalParam("holder", "Holder address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const [signer] = await ethers.getSigners();
    const ceth = await deployments.get("CETHWrapper");
    const contract = await ethers.getContractAt("CETHWrapper", ceth.address);

    const holder = args.holder || signer.address;
    const enc = await contract.confidentialBalanceOf(holder);
    console.log(`encrypted balance: ${enc}`);
    if (fhevm.isMock) {
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, enc, ceth.address, signer);
      console.log(`clear balance: ${clear}`);
    } else {
      console.log("Run decryption with Zama relayer front-end or gateway flow.");
    }
  });

task("wrapper:unwrap-eth", "Request unwrap cETH to native ETH")
  .addParam("units", "cETH units to unwrap (clear amount)")
  .addOptionalParam("from", "From address (defaults to sender)")
  .addOptionalParam("to", "ETH receiver (defaults to sender)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const [signer] = await ethers.getSigners();
    const ceth = await deployments.get("CETHWrapper");
    const contract = await ethers.getContractAt("CETHWrapper", ceth.address);

    const from = args.from || signer.address;
    const to = args.to || signer.address;

    // build encrypted input from clear units
    await fhevm.initializeCLIApi();
    const input = await fhevm.createEncryptedInput(ceth.address, signer.address).add64(parseInt(args.units)).encrypt();

    const tx = await contract
      .connect(signer)
      .requestUnwrapToEth(from, to, input.handles[0], input.inputProof);
    console.log(`unwrap request tx: ${tx.hash}`);
    await tx.wait();
  });

