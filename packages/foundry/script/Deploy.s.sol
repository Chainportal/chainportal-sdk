//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployChainPortalNFT } from "./DeployChainPortalNFT.s.sol";

contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    DeployChainPortalNFT deployChainPortalNFT = new DeployChainPortalNFT();
    deployChainPortalNFT.run();

    // deploy more contracts here
    // DeployMyContract deployMyContract = new DeployMyContract();
    // deployMyContract.run();
  }
}
