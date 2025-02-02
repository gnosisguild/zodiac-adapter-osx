import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { deploy } = deployments
  const { deployer: deployerAddress } = await getNamedAccounts()
  const deployer = await ethers.getSigner(deployerAddress)

  const mockOSXDAODeployment = await deploy("MockOSXDAO", {
    from: deployerAddress,
  })

  const buttonDeployment = await deploy("Button", {
    from: deployerAddress,
  })

  const multisendUnwrapperDeployment = await deploy("MultisendUnwrapper", {
    from: deployerAddress,
  })

  const multisendContract = await deploy("MultiSend", {
    from: deployerAddress,
  })

  // Make the MockOSXDAO the owner of the button
  const buttonContract = await ethers.getContractAt("Button", buttonDeployment.address, deployer)
  const currentOwner = await buttonContract.owner()
  if (currentOwner !== mockOSXDAODeployment.address) {
    const tx = await buttonContract.transferOwnership(mockOSXDAODeployment.address)
    tx.wait()
  }
}

deploy.tags = ["testDependencies"]
export default deploy
