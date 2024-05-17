# 代理合约

## 简介

代理合约是一种特定类型的智能合约，其主要作用是作为其他合约的代表或中介。这些代理合约允许用户通过它们与区块链进行直接交互，同时管理一个指向实际执行逻辑的实现合约（也称为逻辑合约）的指针。通过此机制，即使底层业务逻辑发生变化，用户与区块链的交互方式也能保持一致。


## 代理合约的作用：

1. 可升级性

    区块链上一旦部署的合约代码是不可改变的，这意味着无法直接修改合约中的错误。通过使用代理合约，开发者可以简单地更新指向一个新的、已修改的逻辑合约，从而不需要更改原有代理合约的情况下更新智能合约逻辑。

    例如，如果发现原合约中存在安全隐患，通过更换逻辑合约可以快速响应，修复漏洞。
2. 节省成本

    在以太坊网络上部署新的智能合约通常需要消耗大量的 gas。在一些应用中，如代币发行，可能需要为每个新项目部署一个新的合约。如果每个合约都有类似的功能，这将导致巨大的 gas 费用。

    可以为所有项目只部署一个代币逻辑合约，并部署轻量级的代理合约，指向同一逻辑合约。这样，每个代理合约的部署成本都会比完整功能合约要低得多，从而大量节约 gas。

## 基本原理及组件

1. 代理合约:
	• 用户实际上是在与代理合约进行交互。
	• 代理合约管理自身的状态变量，并通过这些变量指向逻辑合约。
	• 通常，代理合约会包含一个状态变量，即逻辑合约的地址。
2. 逻辑合约:
	• 实现业务逻辑。
	• 可以升级而不影响由代理合约维护的数据存储。例如，可以更新计算公式或增加新的功能，而不改变用户的数据结构


## 实现步骤

1. 创建逻辑合约

首先，开发者需要编写一个包含实际业务逻辑的合约：

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Logic{
    address public not_used;
    uint public count;

    function incrementCounter() public {
        count += 1;
    }

    function getCount() public view returns (uint) {
        return count;
    }
}
```

2. 编写代理合约
在代理合约中，任何非直接调用的函数都会通过 `fallback` 函数被重定向并使用 `delegatecall` 在逻辑合约上执行。这种机制允许代理合约借用逻辑合约的代码进行操作，但是在自己的存储上下文中执行。

代码示例如下
```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Proxy {
    address public logicAddress;
    uint public count;

    constructor(address _logic) {
        logicAddress = _logic;
    }

    // should be restricted to admin
    function upgradeLogic(address _newLogic) public {
        logicAddress = _newLogic;
    }

    fallback() external payable {
        _fallback(logicAddress);
    }

    receive() external payable {
        _fallback(logicAddress);
    }

    function _fallback(address logic) internal {
        // 通过 delegatecall 待用逻辑合约的函数，并返回数据
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), logic, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
```

3. 合约部署与使用:
	- 部署逻辑合约，并记下其地址。
	- 使用逻辑合约的地址作为参数，部署代理合约。
	- 通过代理合约地址调用逻辑合约的功能

当需要升级合约时，只需部署新的逻辑合约并更新代理合约中的逻辑合约地址。这允许合约升级而不丢失任何现有数据。

## 安全考虑

- 权限控制：确保只有可信的地址（如合约的拥有者或管理员）可以更新逻辑合约地址
- 数据和代码分离：正确处理存储布局和逻辑实现的分离，防止存储冲突


代理合约中常见的存储冲突以及升级模式将在下一章节介绍。

## 总结

代理合约是智能合约开发中一个极其强大且必需的模式，特别是在需要可升级性解决方案时。然而，要正确实现该模式，需要对 Solidity 和智能合约的行为有深入的理解。正确的设计和实现可确保系统的安全性和可靠性，同时也提供了卓越的灵活性和可维护性。