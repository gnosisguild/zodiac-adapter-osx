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

  describe("execTransactionFromModule()", function () {
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
    it("Should revert if any included calls fail", async function () {
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

  describe("execTransactionFromModuleReturnData()", function () {
    it("Should revert if called by an account that is not enabled as a module", async function () {
      const { OSXAdapterProxyContract, tester, txData } = await setup()
      const testSigner = await ethers.getSigner(tester)
      expect(
        await OSXAdapterProxyContract.connect(testSigner).execTransactionFromModuleReturnData(
          txData.to,
          txData.value,
          txData.data,
          txData.operation,
        ),
      )
        .to.be.revertedWithCustomError(OSXAdapterProxyContract, "NotAuthorized")
        .withArgs(tester)
    })
    it("Should revert if any included calls fail", async function () {
      const { OSXAdapterProxyContract, multisend, tester, txData } = await setup()
      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (
        await multiSend.populateTransaction(encodeMultisendPayload([txData, { ...txData, data: "0xbaddda7a" }]))
      ).data as string
      await expect(
        OSXAdapterProxyContract.execTransactionFromModuleReturnData(
          await multisend.getAddress(),
          txData.value,
          multisendTx,
          1,
        ),
      ).to.be.reverted
    })
    it("Should return true if all included calls execute successfully", async function () {
      const { OSXAdapterProxyContract, multisend, deployer, txData } = await setup()
      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (await multiSend.populateTransaction(encodeMultisendPayload([txData, txData]))).data as string
      const func = OSXAdapterProxyContract.getFunction("execTransactionFromModuleReturnData")
      const result = await func.staticCall(await multisend.getAddress(), 0, multisendTx, 1)
      expect(result.success).to.be.true
    })
    it("Should return any data returned by the executed calls", async function () {
      const { OSXAdapterProxyContract, multisend, deployer } = await setup()

      const txData = {
        to: await OSXAdapterProxyContract.getAddress(),
        value: 0,
        data: OSXAdapterProxyContract.interface.encodeFunctionData("owner"),
        operation: 0,
      }

      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (await multiSend.populateTransaction(encodeMultisendPayload([txData, txData]))).data as string
      const func = OSXAdapterProxyContract.getFunction("execTransactionFromModuleReturnData")
      const result = await func.staticCall(await multisend.getAddress(), 0, multisendTx, 1)
      const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(["bytes[]"], result.returnData)
      expect(decodedResult).to.deep.equal([[deployer, deployer]])
    })
    it("Should emit `ExecutionFromModuleSuccess` with correct args", async function () {
      const { OSXAdapterProxyContract, multisend, deployer } = await setup()

      const txData = {
        to: await OSXAdapterProxyContract.getAddress(),
        value: 0,
        data: OSXAdapterProxyContract.interface.encodeFunctionData("owner"),
        operation: 0,
      }

      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (await multiSend.populateTransaction(encodeMultisendPayload([txData, txData]))).data as string
      expect(
        await OSXAdapterProxyContract.execTransactionFromModuleReturnData(
          await multisend.getAddress(),
          0,
          multisendTx,
          1,
        ),
      )
        .to.emit(OSXAdapterProxyContract, "ExecutionFromModuleSuccess")
        .withArgs(deployer)
    })
  })

  describe("setTransactionUnwrapper()", function () {
    it("Should revert if called by account other than `owner`", async function () {
      const { OSXAdapterProxyContract, tester } = await setup()
      const testSigner = await ethers.getSigner(tester)
      expect(
        OSXAdapterProxyContract.connect(testSigner).setTransactionUnwrapper(tester, tester),
      ).to.be.revertedWithCustomError(OSXAdapterProxyContract, "NotAuthorized")
    })
    it("Should revert with TransactionUnwrapperAlreadySet() if duplicate address is given", async function () {
      const { OSXAdapterProxyContract, multisend, multisendUnwrapperDeployment, deployer } = await setup()
      expect(
        OSXAdapterProxyContract.setTransactionUnwrapper(
          await multisend.getAddress(),
          multisendUnwrapperDeployment.address,
        ),
      ).to.be.revertedWithCustomError(OSXAdapterProxyContract, "TransactionUnwrapperAlreadySet")
    })
    it("Should correctly set the give transaction unwrapper address", async function () {
      const { OSXAdapterProxyContract, multisend, deployer } = await setup()
      expect(await OSXAdapterProxyContract.setTransactionUnwrapper(await multisend.getAddress(), deployer))
      expect(await OSXAdapterProxyContract.transactionUnwrappers(await multisend.getAddress())).to.equal(deployer)
    })
    it("Should emit `TransactionUnwaperSet` with correct args", async function () {
      const { OSXAdapterProxyContract, multisend, deployer } = await setup()
      expect(await OSXAdapterProxyContract.setTransactionUnwrapper(await multisend.getAddress(), deployer))
        .to.emit(OSXAdapterProxyContract, "TransactionUnwaperSet")
        .withArgs(await multisend.getAddress(), deployer)
    })
  })
})
