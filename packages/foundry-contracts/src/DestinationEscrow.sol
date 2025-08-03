// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "./../lib/solady/src/auth/Ownable.sol";
import {SafeTransferLib} from "./../lib/solady/src/utils/SafeTransferLib.sol";
import {ERC20} from "./../lib/solady/src/tokens/ERC20.sol";

contract DestinationEscrow is Ownable {
    using SafeTransferLib for address;

    error AlreadyReleased(bytes32 swapId);
    error AlreadyRefunded(bytes32 swapId);
    error DeadlinePassed();
    error NotDeposited(bytes32 swapId);

    struct Deposit {
        address token;
        address sender;
        address recipient;
        uint256 amount;
        uint256 deadline;
        bool released;
        bool refunded;
    }

    mapping(bytes32 => Deposit) public deposits;

    event Deposited(bytes32 indexed swapId, address indexed token, address indexed sender, address recipient, uint256 amount, uint256 deadline);
    event Released(bytes32 indexed swapId, address indexed to, uint256 amount);
    event Refunded(bytes32 indexed swapId, address indexed to, uint256 amount);

    constructor(address owner_) {
        _initializeOwner(owner_);
    }

    function deposit(bytes32 swapId, address token, address recipient, uint256 amount, uint256 deadline) external payable onlyOwner {
        Deposit storage d = deposits[swapId];
        if (d.amount != 0) revert AlreadyReleased(swapId);
        deposits[swapId] = Deposit({token: token, sender: msg.sender, recipient: recipient, amount: amount, deadline: deadline, released: false, refunded: false});
        if (token == address(0)) {
            if (msg.value != amount) revert();
        } else {
            token.safeTransferFrom(msg.sender, address(this), amount);
        }
        emit Deposited(swapId, token, msg.sender, recipient, amount, deadline);
    }

    function release(bytes32 swapId, address to) external onlyOwner {
        Deposit storage d = deposits[swapId];
        if (d.amount == 0) revert NotDeposited(swapId);
        if (d.refunded) revert AlreadyRefunded(swapId);
        if (d.released) revert AlreadyReleased(swapId);
        d.released = true;
        uint256 amount = d.amount;
        d.amount = 0;
        address token = d.token;
        if (token == address(0)) {
            to.safeTransferETH(amount);
        } else {
            token.safeTransfer(to, amount);
        }
        emit Released(swapId, to, amount);
    }

    function refund(bytes32 swapId, address to) external onlyOwner {
        Deposit storage d = deposits[swapId];
        if (d.amount == 0) revert NotDeposited(swapId);
        if (block.timestamp <= d.deadline) revert DeadlinePassed();
        if (d.released) revert AlreadyReleased(swapId);
        if (d.refunded) revert AlreadyRefunded(swapId);
        d.refunded = true;
        uint256 amount = d.amount;
        d.amount = 0;
        address token = d.token;
        if (token == address(0)) {
            to.safeTransferETH(amount);
        } else {
            token.safeTransfer(to, amount);
        }
        emit Refunded(swapId, to, amount);
    }

    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0)) to.safeTransferETH(amount);
        else token.safeTransfer(to, amount);
    }
}
