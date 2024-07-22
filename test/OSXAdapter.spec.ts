import { expect } from "chai"
import { ethers, deployments, getNamedAccounts } from "hardhat"

const setup = async () => {
  await deployments.fixture(["moduleProxy"])
  const { deployer, tester } = await getNamedAccounts()
  const buttonDeployment = await deployments.get("Button")
  const OSXAdapterProxyDeployment = await deployments.get("OSXAdapterProxy")
  const buttonContract = await ethers.getContractAt("Button", buttonDeployment.address)
  const OSXAdapterProxyContract = await ethers.getContractAt("OSXAdapter", OSXAdapterProxyDeployment.address)
  return { buttonContract, OSXAdapterProxyContract, deployer, tester }
}

describe("OSXAdapter", function () {
  it("Should be possible to 'press the button' through OSXAdapter", async function () {
    const { buttonContract, OSXAdapterProxyContract, deployer } = await setup()
    expect(await buttonContract.pushes()).to.equal(0)

    expect(await OSXAdapterProxyContract.enableModule(deployer))

    const enabledModules = await OSXAdapterProxyContract.getModulesPaginated(
      "0x0000000000000000000000000000000000000001",
      10,
    )

    const data = buttonContract.interface.encodeFunctionData("pushButton")

    const txData = {
      to: await buttonContract.getAddress(),
      value: 0,
      data: data,
      operation: 0,
    }

    const tx = OSXAdapterProxyContract.interface.encodeFunctionData("execTransactionFromModule", [
      txData.to,
      txData.value,
      txData.data,
      txData.operation,
    ])

    await OSXAdapterProxyContract.execTransactionFromModule(txData.to, txData.value, txData.data, txData.operation)

    expect(await buttonContract.pushes()).to.equal(1)
  })
})
