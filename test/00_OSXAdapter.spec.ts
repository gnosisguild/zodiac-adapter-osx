import { expect } from "chai"
import { ethers, deployments, getNamedAccounts } from "hardhat"
import { encodeMultisendPayload } from "./utils"

const setup = async () => {
  await deployments.fixture(["moduleProxy"])
  const { deployer, tester } = await getNamedAccounts()
  const buttonDeployment = await deployments.get("Button")
  const OSXAdapterProxyDeployment = await deployments.get("OSXAdapterProxy")
  const multisendDeployment = await deployments.get("MultiSend")
  const multisendUnwrapperDeployment = await deployments.get("MultisendUnwrapper")
  const buttonContract = await ethers.getContractAt("Button", buttonDeployment.address)
  const OSXAdapterProxyContract = await ethers.getContractAt("OSXAdapter", OSXAdapterProxyDeployment.address)
  const multisend = await ethers.getContractAt("MultiSend", multisendDeployment.address)

  const data = buttonContract.interface.encodeFunctionData("pushButton")
  const txData = {
    to: await buttonContract.getAddress(),
    value: 0,
    data: data,
    operation: 0,
  }

  return {
    buttonContract,
    OSXAdapterProxyContract,
    multisendDeployment,
    multisend,
    multisendUnwrapperDeployment,
    deployer,
    tester,
    txData,
  }
}

describe("OSXAdapter", function () {
  describe("constructor / setup", function () {
    it("Should set owner, avatar, and target correctly", async function () {
      const factory = await ethers.getContractFactory("OSXAdapter")
      const { deployer: owner, user: avatar, tester: target } = await getNamedAccounts()
      const oSXAdapter = await factory.deploy(owner, avatar, target)
      expect(await oSXAdapter.owner()).to.equal(owner)
      expect(await oSXAdapter.avatar()).to.equal(avatar)
      const targetFunction = oSXAdapter.getFunction("target")
      expect(await targetFunction.call(oSXAdapter)).to.equal(target)
    })
  })

  describe("exec()", function () {
    it("Should revert if called by an account that is not enabled as a module", async function () {
      const { OSXAdapterProxyContract, tester, txData } = await setup()
      const testSigner = await ethers.getSigner(tester)
      expect(
        await OSXAdapterProxyContract.connect(testSigner).execTransactionFromModule(
          txData.to,
          txData.value,
          txData.data,
          txData.operation,
        ),
      )
        .to.be.revertedWithCustomError(OSXAdapterProxyContract, "NotAuthorized")
        .withArgs(tester)
    })
    it("Should revert if included calls fail", async function () {
      const { OSXAdapterProxyContract, multisend, tester, txData } = await setup()
      const testSigner = await ethers.getSigner(tester)
      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (
        await multiSend.populateTransaction(encodeMultisendPayload([txData, { ...txData, data: "0xbaddda7a" }]))
      ).data as string
      await expect(
        OSXAdapterProxyContract.connect(testSigner).execTransactionFromModule(
          await multisend.getAddress(),
          txData.value,
          multisendTx,
          1,
        ),
      ).to.be.reverted
    })
    it("Should return true if all included calls execute successfully", async function () {
      const { OSXAdapterProxyContract, deployer, txData } = await setup()
      const func = OSXAdapterProxyContract.getFunction("execTransactionFromModule")
      const result = await func.staticCall(txData.to, txData.value, txData.data, txData.operation)
      expect(result).to.be.true
    })
    it("Should trigger OSx to make external calls", async function () {
      const { buttonContract, OSXAdapterProxyContract, deployer, multisend, txData } = await setup()
      expect(await buttonContract.pushes()).to.equal(0)

      expect(await OSXAdapterProxyContract.enableModule(deployer))

      const enabledModules = await OSXAdapterProxyContract.getModulesPaginated(
        "0x0000000000000000000000000000000000000001",
        10,
      )

      // const multisendTx = encodeMultisendPayload([txData, txData])
      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (await multiSend.populateTransaction(encodeMultisendPayload([txData, txData]))).data as string
      expect(
        await OSXAdapterProxyContract.execTransactionFromModule(multisend.getAddress(), txData.value, multisendTx, 1),
      )

      expect(await buttonContract.pushes()).to.equal(2)
    })
    it("Should emit `ExecutionFromModuleSuccess` with correct args", async function () {
      const { buttonContract, OSXAdapterProxyContract, deployer, txData } = await setup()
      expect(await buttonContract.pushes()).to.equal(0)

      expect(await OSXAdapterProxyContract.enableModule(deployer))

      const enabledModules = await OSXAdapterProxyContract.getModulesPaginated(
        "0x0000000000000000000000000000000000000001",
        10,
      )

      expect(
        await OSXAdapterProxyContract.execTransactionFromModule(txData.to, txData.value, txData.data, txData.operation),
      )
        .to.emit(OSXAdapterProxyContract, "ExecutionFromModuleSuccess")
        .withArgs(deployer)
    })
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
