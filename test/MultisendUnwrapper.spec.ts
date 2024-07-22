import { expect } from "chai"
import { ethers, deployments, getNamedAccounts } from "hardhat"

const setup = async () => {
  await deployments.fixture(["moduleProxy"])
  const { deployer, tester } = await getNamedAccounts()
  const multisendUnwrapperDeployment = await deployments.get("MultisendUnwrapper")
  const multisendUnwrapper = await ethers.getContractAt("MultisendUnwrapper", multisendUnwrapperDeployment.address)
  return { multisendUnwrapper, multisendUnwrapperDeployment, deployer, tester }
}

describe.only("MultisendUnwrapper", function () {
  describe("constructor", function () {
    it("Deploys successfully", async function () {
      const { multisendUnwrapperDeployment } = await setup()
      expect(multisendUnwrapperDeployment.address).to.not.be.equal(ethers.ZeroAddress)
    })
  })

  describe("unwrap()", function () {
    it("Should revert revert with `UnsupportedMode` if value is non-zero")
    it("Shoudl revert with UnsupportedMode if operation is not `DelegateCall`")
    it("Should correctly unwrap the multisend call")
  })
})
