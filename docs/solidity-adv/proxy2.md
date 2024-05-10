# 代理合约

## 简介

在代理模式中，一个代理合约充当用户和功能实现合约（也称为逻辑合约）之间的中介。代理合约管理对逻辑合约的调用以及来自用户的所有请求，并按需重定向这些请求。大多数情况下，此模式用于实现智能合约的可升级性，因为直接修改链上智能合约的代码是不可能的。

这种分离合约设计不仅提高了智能合约的灵活性，还有助于降低合约部署的风险与成本，当逻辑合约需要升级或修复时，可以不改动已存储在区块链上的数据。

## 基本原理及组件

1. 代理合约:
	- 用户调用的是代理合约
	- 它持有存储（状态变量）并重定向用户交互到逻辑合约
	- 一般情况下，代理合约具有一个存储指向逻辑合约地址的状态变量
2. 逻辑合约:
	- 实现业务逻辑
	- 可以在不影响已存储数据（由代理合约维护）的情况下升级
3. 注册表合约（可选）:
	- 管理不同版本的逻辑合约地址。
	- 代理合约可以通过注册表查询当前活动的逻辑合约

## 实现步骤

1. 创建逻辑合约

首先，开发者需要编写一个包含实际业务逻辑的合约。

代码示例如下：

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LogicContract {
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

    constructor(address _logic) {
        logicAddress = _logic;
    }

    function upgradeLogic(address _newLogic) public onlyOwner {
        logicAddress = _newLogic;
    }

    fallback() external payable {
        (bool success, ) = logicAddress.delegatecall(msg.data);
        require(success, "Delegatecall failed.");
    }
}
```

3. 合约部署与使用:
	• 部署逻辑合约，并记下其地址。
	• 使用逻辑合约的地址作为参数，部署代理合约。
	• 通过代理合约地址调用功能，实际执行会在逻辑合约的上下文中进行。


当需要升级合约时，只需部署新的逻辑合约并更新代理合约中的逻辑合约地址。这允许合约升级而不丢失任何现有数据。


## 安全考虑

- 权限控制：确保只有可信的地址（如合约的拥有者或管理员）可以更新逻辑合约地址
- 数据和代码分离：正确处理存储布局和逻辑实现的分离，防止存储冲突
- 透明代理模式：使用已知设计模式，如 EIP-1967, 以减少未知的攻击面

## 总结

代理合约是智能合约开发中一个极其强大且必需的模式，特别是在需要可升级性解决方案时。然而，要正确实现该模式，需要对 Solidity 和智能合约的行为有深入的理解。正确的设计和实现可确保系统的安全性和可靠性，同时也提供了卓越的灵活性和可维护性。