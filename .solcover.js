module.exports = {
  skipFiles: ["test/MultiSend.sol", "test/MockOSXDAO.sol", "test/IModuleProxyFactory.sol", "test/Button.sol"],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
