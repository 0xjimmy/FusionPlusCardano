// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DestinationEscrow} from "src/DestinationEscrow.sol";
import {ERC20} from "lib/solady/src/tokens/ERC20.sol";
import {SafeTransferLib} from "lib/solady/src/utils/SafeTransferLib.sol";

contract MockERC20 is ERC20 {
    string private _name = "MockToken";
    string private _symbol = "MOCK";

    function name() public view override returns (string memory) { return _name; }
    function symbol() public view override returns (string memory) { return _symbol; }
    function decimals() public pure override returns (uint8) { return 18; }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DestinationEscrowTest is Test {
    using SafeTransferLib for address;

    DestinationEscrow escrow;
    address owner = address(0xA11CE);
    address user = address(0xB0B);
    address refunder = address(0xC0FFEE);

    MockERC20 token;

    function setUp() public {
        vm.prank(owner);
        escrow = new DestinationEscrow(owner);
        token = new MockERC20();
    }

    function testDepositAndReleaseETH() public {
        bytes32 swapId = keccak256("swap-eth-1");
        uint256 amount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.deal(owner, amount);
        vm.prank(owner);
        escrow.deposit{value: amount}(swapId, address(0), user, amount, deadline);

        vm.prank(owner);
        escrow.release(swapId, user);

        assertEq(user.balance, amount);
    }

    function testDepositAndRefundETHAfterDeadline() public {
        bytes32 swapId = keccak256("swap-eth-2");
        uint256 amount = 2 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.deal(owner, amount);
        vm.prank(owner);
        escrow.deposit{value: amount}(swapId, address(0), user, amount, deadline);

        vm.warp(deadline + 1);
        vm.prank(owner);
        escrow.refund(swapId, refunder);

        assertEq(refunder.balance, amount);
    }

    function testERC20DepositAndRelease() public {
        bytes32 swapId = keccak256("swap-erc20-1");
        uint256 amount = 1_000e18;
        uint256 deadline = block.timestamp + 1 days;

        token.mint(owner, amount);
        vm.prank(owner);
        address(token).safeApprove(address(escrow), amount);

        vm.prank(owner);
        escrow.deposit(swapId, address(token), user, amount, deadline);

        assertEq(token.balanceOf(address(escrow)), amount);

        vm.prank(owner);
        escrow.release(swapId, user);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testERC20DepositAndRefundAfterDeadline() public {
        bytes32 swapId = keccak256("swap-erc20-2");
        uint256 amount = 500e18;
        uint256 deadline = block.timestamp + 1 days;

        token.mint(owner, amount);
        vm.prank(owner);
        address(token).safeApprove(address(escrow), amount);

        vm.prank(owner);
        escrow.deposit(swapId, address(token), user, amount, deadline);

        vm.warp(deadline + 1);
        vm.prank(owner);
        escrow.refund(swapId, refunder);

        assertEq(token.balanceOf(refunder), amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testRefundBeforeDeadlineReverts() public {
        bytes32 swapId = keccak256("swap-early-refund");
        uint256 amount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.deal(owner, amount);
        vm.prank(owner);
        escrow.deposit{value: amount}(swapId, address(0), user, amount, deadline);

        vm.expectRevert(DestinationEscrow.DeadlinePassed.selector);
        vm.prank(owner);
        escrow.refund(swapId, refunder);
    }

    function testDoubleReleaseReverts() public {
        bytes32 swapId = keccak256("swap-double-release");
        uint256 amount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.deal(owner, amount);
        vm.prank(owner);
        escrow.deposit{value: amount}(swapId, address(0), user, amount, deadline);

        vm.prank(owner);
        escrow.release(swapId, user);

        vm.expectRevert(DestinationEscrow.AlreadyReleased.selector);
        vm.prank(owner);
        escrow.release(swapId, user);
    }

    function testDoubleRefundReverts() public {
        bytes32 swapId = keccak256("swap-double-refund");
        uint256 amount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.deal(owner, amount);
        vm.prank(owner);
        escrow.deposit{value: amount}(swapId, address(0), user, amount, deadline);

        vm.warp(deadline + 1);
        vm.prank(owner);
        escrow.refund(swapId, refunder);

        vm.expectRevert(DestinationEscrow.AlreadyRefunded.selector);
        vm.prank(owner);
        escrow.refund(swapId, refunder);
    }

    function testReleaseNonexistentReverts() public {
        vm.expectRevert(DestinationEscrow.NotDeposited.selector);
        vm.prank(owner);
        escrow.release(keccak256("none"), user);
    }

    function testRescueToken() public {
        uint256 amount = 100e18;
        token.mint(address(this), amount);
        address(token).safeTransfer(address(escrow), amount);

        vm.prank(owner);
        escrow.rescueToken(address(token), user, amount);
        assertEq(token.balanceOf(user), amount);
    }
}
