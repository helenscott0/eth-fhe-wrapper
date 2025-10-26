import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy WETH9
  const weth = await deploy("WETH9", {
    from: deployer,
    log: true,
  });
  console.log(`WETH9: ${weth.address}`);

  // Deploy cETH wrapper with WETH as underlying
  const ceth = await deploy("CETHWrapper", {
    from: deployer,
    args: [weth.address],
    log: true,
  });
  console.log(`CETHWrapper: ${ceth.address}`);
};
export default func;
func.id = "deploy_ceth"; // id required to prevent reexecution
func.tags = ["CETHWrapper"];
