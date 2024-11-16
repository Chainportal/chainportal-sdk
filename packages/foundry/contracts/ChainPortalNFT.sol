// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract ChainPortalNFT is ERC721, ERC721Enumerable, ERC721Burnable {
	struct Metadata {
		uint256 score;
		uint256 level;
	}

	uint256 public tokenCounter;

	mapping(uint256 => Metadata) metadatas;

	event MetadataUpdated(uint256 tokenId, uint256 score, uint256 level);

	error InvalidOwner();

	constructor() ERC721("ChainPortal", "CPT") {}

	function safeMint() public {
		uint256 tokenId = tokenCounter++;
		_safeMint(_msgSender(), tokenId);
	}

	function updateMetadata(
		uint256 _tokenId,
		uint256 _score,
		uint256 _level
	) public {
		address owner = _requireOwned(_tokenId);

		if (owner != _msgSender()) {
			revert InvalidOwner();
		}

		metadatas[_tokenId].score = _score;
		metadatas[_tokenId].level = _level;

		emit MetadataUpdated(_tokenId, _score, _level);
	}

	function burn(uint256 _tokenId) public override {
		delete metadatas[_tokenId];

		_update(address(0), _tokenId, _msgSender());
	}

	function getTokenMetadatas(
		uint256[] memory _tokenIds
	) public view returns (Metadata[] memory) {
		Metadata[] memory tokenMetadatas = new Metadata[](_tokenIds.length);

		for (uint256 i; i < _tokenIds.length; i++) {
			tokenMetadatas[i] = metadatas[i];
		}

		return tokenMetadatas;
	}

	// The following functions are overrides required by Solidity.

	function _update(
		address to,
		uint256 tokenId,
		address auth
	) internal override(ERC721, ERC721Enumerable) returns (address) {
		return super._update(to, tokenId, auth);
	}

	function _increaseBalance(
		address account,
		uint128 value
	) internal override(ERC721, ERC721Enumerable) {
		super._increaseBalance(account, value);
	}

	function supportsInterface(
		bytes4 interfaceId
	) public view override(ERC721, ERC721Enumerable) returns (bool) {
		return super.supportsInterface(interfaceId);
	}
}
