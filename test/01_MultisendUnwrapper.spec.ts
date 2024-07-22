import { expect } from "chai"
import { ethers, deployments, getNamedAccounts } from "hardhat"
import { encodeMultisendPayload } from "./utils"

const setup = async () => {
  await deployments.fixture(["moduleProxy"])
  const { deployer, tester } = await getNamedAccounts()
  const multisendDeployement = await deployments.get("MultiSend")
  const multisendUnwrapperDeployment = await deployments.get("MultisendUnwrapper")
  const multisend = await ethers.getContractAt("MultiSend", multisendDeployement.address)
  const multisendUnwrapper = await ethers.getContractAt("MultisendUnwrapper", multisendUnwrapperDeployment.address)
  return { multisend, multisendDeployement, multisendUnwrapper, multisendUnwrapperDeployment, deployer, tester }
}

describe("MultisendUnwrapper", function () {
  describe("constructor", function () {
    it("Deploys successfully", async function () {
      const { multisendUnwrapperDeployment } = await setup()
      expect(multisendUnwrapperDeployment.address).to.not.be.equal(ethers.ZeroAddress)
    })
  })

  describe("unwrap()", function () {
    it("Should revert revert with `UnsupportedMode` if value is non-zero", async function () {
      const { multisendUnwrapper } = await setup()
      await expect(multisendUnwrapper.unwrap(ethers.ZeroAddress, 1, "0x", 1)).to.be.revertedWithCustomError(
        multisendUnwrapper,
        "UnsupportedMode",
      )
    })
    it("Shoudl revert with UnsupportedMode if operation is not `DelegateCall`", async function () {
      const { multisendUnwrapper } = await setup()
      await expect(multisendUnwrapper.unwrap(ethers.ZeroAddress, 0, "0x", 0)).to.be.revertedWithCustomError(
        multisendUnwrapper,
        "UnsupportedMode",
      )
    })
    it("Should correctly unwrap the multisend call", async function () {
      const { multisendUnwrapper, multisend } = await setup()

      const txData = {
        to: "0x1111111111111111111111111111111111111111",
        value: 0,
        data: "0x1337C0D3",
        operation: 0,
      }

      const multiSend = multisend.getFunction("multiSend")
      const multisendTx = (await multiSend.populateTransaction(encodeMultisendPayload([txData, txData]))).data as string

      const tx = await multisendUnwrapper.unwrap(await multisend.getAddress(), 0, multisendTx, 1)
      const expectedResult = [
        [txData.operation, txData.to, txData.value, txData.data],
        [txData.operation, txData.to, txData.value, txData.data],
      ]
      expect(tx).to.deep.equal(expectedResult)
    })
  })
})
