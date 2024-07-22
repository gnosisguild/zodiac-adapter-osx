// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.26 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

interface IMultisend {
    function multiSend(bytes memory transactions) external payable;
}

struct UnwrappedTransaction {
    Enum.Operation operation;
    address to;
    uint256 value;
    bytes data;
    // We wanna deal in calldata slices. We return location, let invoker slice
    // uint256 dataLocation;
    // uint256 dataSize;
}

/// @notice The action struct to be consumed by the DAO's `execute` function resulting in an external call.
/// @param to The address to call.
/// @param value The native token value to be sent with the call.
/// @param data The bytes-encoded function selector and calldata for the call.
struct Action {
    address to;
    uint256 value;
    bytes data;
}

interface ITransactionUnwrapper {
    function unwrap(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external view returns (UnwrappedTransaction[] memory result);
}
