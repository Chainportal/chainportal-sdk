//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/ChainPortalNFT.sol";
import "./DeployHelpers.s.sol";

contract DeployChainPortalNFT is ScaffoldETHDeploy {
  // use `deployer` from `ScaffoldETHDeploy`
  function run() external ScaffoldEthDeployerRunner {
    ChainPortalNFT chainPortalNFT = new ChainPortalNFT();
    console.logString(
      string.concat(
        "ChainPortalNFT deployed at: ", vm.toString(address(chainPortalNFT))
      )
    );
  }
}
