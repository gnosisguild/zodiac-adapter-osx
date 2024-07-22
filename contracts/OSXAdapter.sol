// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.26 <0.9.0;

import {Modifier} from "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import {Enum} from "@gnosis.pm/zodiac/contracts/core/Module.sol";
import {IOSx} from "./IOSx.sol";
import "./Types.sol";

contract OSXAdapter is Modifier {
    /// @notice Maps allowed multisend addresses to their corresponding transaction unwrappers.
    /// @dev Delegate calls to mapped addresses will be unwrapped into an array of calls.
    mapping(address multisend => ITransactionUnwrapper transactionUnwrapper) public transactionUnwrappers;

    event TransactionUnwrapperSet(address multisendAddress, ITransactionUnwrapper transactionUnwrapper);

    error DelegateCallNotAllowed();
    error MultisendAddressNotAllowed();
    error TransactionUnwrapperAlreadySet();

    constructor(address _owner, address _avatar, address _target) {
        bytes memory initializeParams = abi.encode(_owner, _avatar, _target);
        setUp(initializeParams);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param initializeParams Parameters of initialization encoded
    function setUp(bytes memory initializeParams) public override initializer {
        (address _owner, address _avatar, address _target) = abi.decode(initializeParams, (address, address, address));

        __Ownable_init(msg.sender);
        setAvatar(_avatar);
        setTarget(_target);
        transferOwnership(_owner);
    }

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) public override returns (bool success) {
        success = exec(to, value, data, operation);
    }

    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) public override returns (bool success, bytes memory returnData) {
        (success, returnData) = execAndReturnData(to, value, data, operation);
    }

    function setTransactionUnwrapper(
        address multisendAddress,
        ITransactionUnwrapper transactionUnwrapper
    ) public onlyOwner {
        require(transactionUnwrappers[multisendAddress] != transactionUnwrapper, TransactionUnwrapperAlreadySet());
        transactionUnwrappers[multisendAddress] = transactionUnwrapper;
        emit TransactionUnwrapperSet(multisendAddress, transactionUnwrapper);
    }

    /// @dev Passes a transaction to be executed by the avatar.
    /// @notice Can only be called by this contract.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    function exec(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) internal override returns (bool success) {
        Action[] memory actions = convertTransaction(to, value, data, operation);
        IOSx(target).execute(bytes32(0), actions, 0);
        success = true;
    }

    /// @dev Passes a transaction to be executed by the target and returns data.
    /// @notice Can only be called by this contract.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    function execAndReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) internal override returns (bool, bytes memory) {
        Action[] memory actions = convertTransaction(to, value, data, operation);
        (bytes[] memory returnData, ) = IOSx(target).execute(bytes32(0), actions, 0);
        return (true, abi.encode(returnData));
    }

    function convertTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) private view returns (Action[] memory) {
        if (operation == Enum.Operation.DelegateCall) {
            ITransactionUnwrapper transactionUnwrapper = transactionUnwrappers[to];
            require(transactionUnwrapper != ITransactionUnwrapper(address(0)), MultisendAddressNotAllowed());

            UnwrappedTransaction[] memory unwrappedTransactions = transactionUnwrapper.unwrap(
                to,
                value,
                data,
                operation
            );

            Action[] memory actions = new Action[](unwrappedTransactions.length);

            for (uint i = 0; i < unwrappedTransactions.length; i++) {
                actions[i] = convert(
                    unwrappedTransactions[i].to,
                    unwrappedTransactions[i].value,
                    unwrappedTransactions[i].data,
                    unwrappedTransactions[i].operation
                );
            }
            return actions;
        } else {
            Action[] memory actions = new Action[](1);
            actions[0] = convert(to, value, data, operation);
            return actions;
        }
    }

    function convert(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) private pure returns (Action memory action) {
        require(operation == Enum.Operation.Call, DelegateCallNotAllowed());
        action.to = to;
        action.value = value;
        action.data = data;
    }
}
