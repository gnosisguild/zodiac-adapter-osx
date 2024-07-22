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
  describe("constructor / setup", function () {
    it("Should set owner, avatar, and target correctly")
  })

  describe("exec()", function () {
    it("Should revert if called by an account that is not enabled as a module")
    it("Should revert if included calls fail")
    it("Should return true if all included calls execute successfully")
    it("Should trigger OSx to make external calls", async function () {
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

      const result = await (
        await OSXAdapterProxyContract.execTransactionFromModule(txData.to, txData.value, txData.data, txData.operation)
      ).wait()

      expect(await buttonContract.pushes()).to.equal(1)
    })
    it("Should emit `ExecutionFromModuleSuccess` with correct args")
  })

  describe("execAndReturnData()", function () {
    it("Should revert if called by an account that is not enabled as a module")
    it("Should revert if any included calls fail")
    it("Should return true if all included calls execute successfully")
    it("Should return any data returned by the executed calls")
    it("Should emit `ExecutionFromModuleSuccess` with correct args")
  })

  describe("execTransactionFromModule()", function () {
    it("Should call exec()")
    it("Should return true if exec() call is successful")
  })

  describe("execTransactionFromModuleReturnData()", function () {
    it("Should call execAndReturnData()")
    it("Should return true if execAndReturnData() call is successful")
    it("Should return returnData from successful execAndReturnData() call")
  })

  describe("setTransactionUnwrapper()", function () {
    it("Should revert if called by account other than `owner`")
    it("Should revert with TransactionUnwrapperAlreadySet() if duplicate address is given")
    it("Should correctly set the give transaction unwrapper address")
    it("Should emit `TransactionUnwaperSet` with correct args")
  })

  describe("Convert()", function () {
    it("Should revert with `DelegateCallNotAllowed` if operation is delegate call")
    it("Should encode call params in into Action struct")
  })

  describe("ConvertTransaction()", function () {
    it(
      "Should revert with `UnwrapperNotAllowed` if operation is delegate call and target is not enabled as a transaction unwrapper",
    )
    it("Should convert a single encoded call")
    it("Should convert multiple encoded calls")
  })
})
