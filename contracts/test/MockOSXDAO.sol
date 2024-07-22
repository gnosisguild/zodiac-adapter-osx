// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.26;

import "../Types.sol";

contract MockOSXDAO {
    /// @notice The ID of the permission required to call the OSx `execute` function.
    bytes32 public constant EXECUTE_PERMISSION_ID = keccak256("EXECUTE_PERMISSION");

    mapping(address sender => mapping(bytes32 permissionId => bool granted)) public permissions;

    error NotAuthorized(address unacceptedAddress);
    error RecipentAlreadyHasPermission(address recipient);

    receive() external payable {}

    function grantExecutePermission(address recipient) external {
        require(!permissions[recipient][EXECUTE_PERMISSION_ID], RecipentAlreadyHasPermission(recipient));
        permissions[recipient][EXECUTE_PERMISSION_ID] = true;
    }

    function execute(
        bytes32,
        Action[] memory actions,
        uint256
    ) external returns (bytes[] memory responses, uint256 failureMap) {
        require(permissions[msg.sender][EXECUTE_PERMISSION_ID], NotAuthorized(msg.sender));

        bool success;
        for (uint i = 0; i < actions.length; i++) {
            (success, responses[i]) = actions[i].to.call{value: actions[i].value}(actions[i].data);

            if (!success) {
                assembly {
                    revert(add(responses, 0x20), mload(responses))
                }
            }
        }

        failureMap = 0;
    }
}
