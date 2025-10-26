// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IWETH9 is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract CETHWrapper is ERC7984ERC20Wrapper, SepoliaConfig {
    IWETH9 private immutable _weth;

    // Track unwrap-to-ETH requests so we can forward ETH to the original receiver
    mapping(uint256 requestID => address receiver) private _unwrapReceivers;

    constructor(IWETH9 weth)
        ERC7984("cETH", "cETH", "")
        ERC7984ERC20Wrapper(IERC20(address(weth)))
    {
        _weth = weth;
    }

    // Wrap native ETH directly into cETH. Refund any remainder that doesn't fit the wrapper rate.
    function wrapEth(address to) external payable {
        require(to != address(0), "invalid-to");
        uint256 r = rate();
        uint256 used = msg.value - (msg.value % r);
        require(used > 0, "zero-used");

        // deposit only the used amount into WETH
        (bool ok, ) = address(_weth).call{value: used}(abi.encodeWithSelector(IWETH9.deposit.selector));
        require(ok, "weth-deposit-failed");

        // mint cETH
        _mint(to, FHE.asEuint64(uint64(used / r)));

        // refund excess ETH if any
        uint256 excess = msg.value - used;
        if (excess > 0) {
            (bool sent, ) = msg.sender.call{value: excess}("");
            require(sent, "refund-failed");
        }
    }

    // Start an unwrap to native ETH. Burns cETH and schedules decryption.
    // Underlying WETH will be received by this contract, converted to ETH and forwarded.
    function requestUnwrapToEth(
        address from,
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        _requestUnwrapToEth(from, to, FHE.fromExternal(encryptedAmount, inputProof));
    }

    function requestUnwrapToEth(
        address from,
        address to,
        euint64 amount
    ) external {
        require(FHE.isAllowed(amount, msg.sender), "not-allowed-amount");
        _requestUnwrapToEth(from, to, amount);
    }

    // Finalize callback for unwrap-to-ETH flow. Called by the gateway once decryption completes.
    function finalizeUnwrapToEth(
        uint256 requestID,
        bytes calldata cleartexts,
        bytes calldata decryptionProof
    ) external {
        FHE.checkSignatures(requestID, cleartexts, decryptionProof);
        address to = _unwrapReceivers[requestID];
        require(to != address(0), "invalid-request");
        delete _unwrapReceivers[requestID];

        uint64 units = abi.decode(cleartexts, (uint64));
        uint256 amount = uint256(units) * rate();

        // We should already have enough WETH (held by this contract). Withdraw and forward ETH.
        _weth.withdraw(amount);
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "eth-send-failed");
    }

    function _requestUnwrapToEth(address from, address to, euint64 amount) internal {
        require(to != address(0), "invalid-to");
        require(from == msg.sender || isOperator(from, msg.sender), "unauthorized");

        // burn and get the actual burnt amount
        euint64 burnt = _burn(from, amount);

        // request decryption with our custom finalize callback
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = euint64.unwrap(burnt);
        uint256 requestID = FHE.requestDecryption(cts, this.finalizeUnwrapToEth.selector);

        // remember who receives ETH
        _unwrapReceivers[requestID] = to;
    }
}
