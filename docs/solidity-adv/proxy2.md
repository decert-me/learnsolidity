# 代理合约

## 简介
代理合约 (proxy contract) 是一种特定类型的合约，其主要目的是充当其他合约的代表或中介，直接与区块链交互。

代理合约整合了另外一个合约（通常被称为逻辑合约或实现合约）的功能，并在调用合约功能时将调用重定向到这些合约上。

## 代理合约的作用：

1. 可升级性：  
	在区块链上，当合约一旦被部署，它的代码就是不可变的。这意味着任何想要修改或错误修复的需求不能直接应用于已部署的合约。

    使用代理合约，我们可以将这个不可变的合约指向一个可以被更新和改变的新合约，从而实现智能合约代码的动态更新或迭代升级。
2. 节省成本：
	• 部署新的智能合约到以太坊网络上通常需要消耗更多的 gas。通过使用代理模式，只需要部署一次代理合约，之后通过更新逻辑合约来改变行为，从而大量节省了因重复部署相似合约而产生的 gas 费用。


## 基本原理及组件

1. 代理合约:
	- 用户调用的是代理合约
	- 代理合约持有存储（状态变量）并重定向用户交互到逻辑合约
	- 一般情况下，代理合约具有一个存储指向逻辑合约地址的状态变量
2. 逻辑合约:
	- 实现业务逻辑
	- 可以在不影响已存储数据（由代理合约维护）的情况下升级

## 实现步骤

1. 创建逻辑合约

首先，开发者需要编写一个包含实际业务逻辑的合约。

代码示例如下：

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
在代理合约中，任何非直接调用的函数都会通过 `fallback` 函数被重定向并使用 `delegatecall` 在逻辑合约上执行。这允许代理合约借用逻辑合约的代码，但是在自己的存储上下文中执行。

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
	- 通过代理合约地址调用功能，实际执行会在逻辑合约的上下文中进行。


当需要升级合约时，只需部署新的逻辑合约并更新代理合约中的逻辑合约地址。这允许合约升级而不丢失任何现有数据。


## 安全考虑

- 权限控制：确保只有可信的地址（如合约的拥有者或管理员）可以更新逻辑合约地址
- 数据和代码分离：正确处理存储布局和逻辑实现的分离，防止存储冲突


代理合约设计刀的存储冲突以及常见的代理升级模式将在下一章节介绍

## 总结

代理合约是智能合约开发中一个极其强大且必需的模式，特别是在需要可升级性解决方案时。然而，要正确实现该模式，需要对 Solidity 和智能合约的行为有深入的理解。正确的设计和实现可确保系统的安全性和可靠性，同时也提供了卓越的灵活性和可维护性。