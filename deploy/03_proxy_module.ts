import { ZeroHash } from "ethers"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { createFactory, deployModAsProxy } from "../factories/moduleProxyFactory"

import MODULE_CONTRACT_ARTIFACT from "../artifacts/contracts/OSXAdapter.sol/OSXAdapter.json"

const deploy: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  ethers,
  getChainId,
}: HardhatRuntimeEnvironment) {
  const { deployer: deployerAddress } = await getNamedAccounts()
  const deployer = await ethers.getSigner(deployerAddress)

  const buttonDeployment = await deployments.get("Button")
  const mockOSXDAODeployment = await deployments.get("MockOSXDAO")
  const OSXAdapterMastercopyDeployment = await deployments.get("OSXAdapterMastercopy")

  /// const chainId = await getChainId()
  // const network: SupportedNetworks = Number(chainId)
  // if ((await ethers.provider.getCode(ContractAddresses[network][KnownContracts.FACTORY])) === "0x") {
  //   // the Module Factory should already be deployed to all supported chains
  //   // if you are deploying to a chain where its not deployed yet (most likely locale test chains), run deployModuleFactory from the zodiac package
  //   throw Error("The Module Factory is not deployed on this network. Please deploy it first.")
  // }

  // Deploys the ModuleFactory (and the Singleton factory) if it is not already deployed
  const factory = await createFactory(deployer)
  const { transaction } = await deployModAsProxy(
    factory,
    OSXAdapterMastercopyDeployment.address,
    {
      values: [deployerAddress, mockOSXDAODeployment.address, mockOSXDAODeployment.address],
      types: ["address", "address", "address"],
    },
    ZeroHash,
  )
  const deploymentTransaction = await deployer.sendTransaction(transaction)
  const receipt = (await deploymentTransaction.wait())!
  const OSXAdapterProxyAddress = receipt.logs[1].address

  deployments.save("OSXAdapterProxy", {
    abi: MODULE_CONTRACT_ARTIFACT.abi,
    address: OSXAdapterProxyAddress,
  })

  // Enable OSXAdapter as a module on the MockOSXDAO to give it access to the execute() function
  const mockOSXDAOContract = await ethers.getContractAt("MockOSXDAO", mockOSXDAODeployment.address, deployer)
  let hasPermission = await mockOSXDAOContract.permissions(OSXAdapterProxyAddress, ethers.id("EXECUTE_PERMISSION"))
  if (!hasPermission) {
    const tx = await mockOSXDAOContract.grantExecutePermission(OSXAdapterProxyAddress)
    tx.wait()
  }

  // Set Multisend unwrapper
  const multisend = await deployments.get("MultiSend")
  const multisendUnwrapperDeployment = await deployments.get("MultisendUnwrapper")
  const OSXAdapterProxy = await ethers.getContractAt("OSXAdapter", OSXAdapterProxyAddress, deployer)
  await OSXAdapterProxy.setTransactionUnwrapper(multisend.address, multisendUnwrapperDeployment.address)
}

deploy.tags = ["moduleProxy"]
deploy.dependencies = ["moduleMastercopy", "testDependencies"]

export default deploy
