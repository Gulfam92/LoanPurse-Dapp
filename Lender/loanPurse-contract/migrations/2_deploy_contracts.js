var LoanPurse = artifacts.require("LoanPurse");

module.exports = function(deployer) {
  deployer.deploy(LoanPurse);
};
