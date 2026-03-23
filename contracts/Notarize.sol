// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Notarize
/// @notice Anchors a content hash once and permanently records the first notarizer.
contract Notarize {
    error HashAlreadyNotarized(bytes32 hash);
    error ZeroHashNotAllowed();

    mapping(bytes32 => address) public notarizers;
    mapping(bytes32 => uint256) public firstBlockNumbers;

    event Notarized(
        bytes32 indexed hash,
        address indexed notarizer,
        uint256 blockNumber
    );

    /// @notice Stores the first notarization for a hash.
    /// @dev The contract is intentionally ownerless and immutable. A hash can only be anchored once.
    /// @param hash The keccak256 content fingerprint computed client-side.
    function notarize(bytes32 hash) external {
        if (hash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }

        if (firstBlockNumbers[hash] != 0) {
            revert HashAlreadyNotarized(hash);
        }

        notarizers[hash] = msg.sender;
        firstBlockNumbers[hash] = block.number;

        emit Notarized(hash, msg.sender, block.number);
    }
}
