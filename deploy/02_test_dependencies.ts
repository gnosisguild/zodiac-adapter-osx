import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("Deploying 'external' dependencies (Button and Avatar)")
  const { deployments, getNamedAccounts, ethers } = hre
  const { deploy } = deployments
  const { deployer: deployerAddress } = await getNamedAccounts()
  const deployer = await ethers.getSigner(deployerAddress)

  const mockOSXDAODeployment = await deploy("MockOSXDAO", {
    from: deployerAddress,
  })
  console.log("MockOSXDAO deployed to:", mockOSXDAODeployment.address)

  const buttonDeployment = await deploy("Button", {
    from: deployerAddress,
  })
  console.log("Button deployed to:", buttonDeployment.address)

  // Make the MockOSXDAO the owner of the button
  const buttonContract = await ethers.getContractAt("Button", buttonDeployment.address, deployer)
  const currentOwner = await buttonContract.owner()
  if (currentOwner !== mockOSXDAODeployment.address) {
    const tx = await buttonContract.transferOwnership(mockOSXDAODeployment.address)
    tx.wait()
    console.log("MockOSXDAO set as owner of the button")
  } else {
    console.log("Owner of button is already set correctly")
  }
}

deploy.tags = ["testDependencies"]
export default deploy
