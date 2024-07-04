# 可升级合约

在区块链开发中，智能合约一旦部署即无法更改是一个众所周知的限制。随着业务需求的变化，我们可能需要对已部署的合约进行修改或升级，而代理合约是解决这个问题的一种有效方式。

本章将深入介绍代理合约的不同升级模式，帮助开发者实现灵活且安全的智能合约系统。

前面已介绍了代理合约。通过代理合约进行升级的关键在于将状态存储与业务逻辑分离，其中代理负责状态存储，而业务逻辑则可以是可替换的。


## 代理合约升级模式

常见的升级模式：透明代理模式、UUPS（Universal Upgradeable Proxy Standard，通用升级代理标准）模式，每种模式有其特点和使用场景，接下来将逐一介绍。

### 透明代理模式

在透明代理模式中，存在一个管理员地址独有的权限来升级智能合约。用户与合约的交互对用户完全透明，即用户不需要了解幕后的实现合约。

所有的调用都是通过代理合约进行的。当调用代理合约时，它会检查调用者是否为管理员。如果是管理员调用管理功能（例如更改实现合约），调用直接在代理合约中处理。如果是普通用户调用业务逻辑，代理合约将使用`delegatecall`指令将调用委托给当前的实现合约。

![透明代理示意图](https://img.learnblockchain.cn/proxy-transparent.png)

简单透明代理合约例子：

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 逻辑合约
contract TransparentLogic {
    address public logicAddress; // 防止存储冲突
    address public adminAddress; // 防止存储冲突
    uint public count;

    function incrementCounter() public {
        count += 1;
    }

    function getCount() public view returns (uint) {
        return count;
    }
}

// 代理合约
contract TransparentProxy {
    address public logicAddress; // 逻辑合约地址
    address public adminAddress; // 管理员地址
    uint public count;

    constructor(address logic) {
        logicAddress = logic;
        adminAddress = msg.sender;
    }

    function upgrade(address newLogic) public {
        require(msg.sender == adminAddress, "Only admin"); // 限制了只能是管理员才能调用
        logicAddress = newLogic;
    }

    fallback() external payable {
        require(msg.sender != adminAddress, "Admin not allowed"); // 限制了调用者不能是管理员
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

合约代码解释：
- TransparentProxy.upgrade() 函数用来升级合约（替换旧的实现合约地址），限制了只能是管理员才能调用
- TransparentProxy.fallback() 函数会检查调用者是不是管理员，调用者为非管理员时才通过`delegatecall`委托实现合约调用


### UUPS 模式

UUPS（Universal Upgradeable Proxy Standard，通用升级代理标准）模式通过实现合约本身的逻辑来控制升级的过程。

UUPS 中的实现合约包括业务逻辑和升级逻辑。实现合约内有一个专门的函数用于修改存储实现合约地址的变量，这使得实现合约可以更改其自身的逻辑。当需要升级合约时，通过在实现合约中调用一个特殊的更新函数来更改指向新合约的地址，从而实现逻辑的更换，同时保留存储在代理合约中的状态数据。

简单 UUPS 代理合约例子：

```
// 实现合约
contract UUPSLogic {
    address public logicAddress; // 防止存储冲突
    address public adminAddress; // 防止存储冲突
    uint public count;

    function incrementCounter() public {
        count += 1;
    }

    function getCount() public view returns (uint) {
        return count;
    }

    function upgrade(address newLogic) public {
        require(msg.sender == adminAddress, "Only admin");
        logicAddress = newLogic;
    }
}

// 代理合约
contract UUPSProxy {
    address public logicAddress; // 逻辑合约地址
    address public adminAddress; // 管理员地址
    uint public count;

    constructor(address logic) {
        logicAddress = logic;
        adminAddress = msg.sender;
    }

    fallback() external payable {
        _fallback(logicAddress);
    }

    receive() external payable {
        _fallback(logicAddress);
    }

    function _fallback(address logic) internal {
        // ... 
    }
}
```

与透明代理模式不同，升级函数（`upgrade()`）位于实现合约中，而代理合约中不存在升级的逻辑。另外，`fallback()`函数不需要检查调用者是否是管理员，可以节省gas。


## EIP-1967
在实际生产活动中，未了避免存储冲突（见上一章节），可以采用 EIP-1967 提出的代理存储槽标准。

EIP-1967 旨在为智能合约的升级模式提供一种标准化和安全的实现方法。该标准主要关注使用代理模式进行智能合约升级的流程，提高智能合约系统的透明性和可操作性。

### EIP-1967 主要内容

EIP-1967 提出了一种标准化的方法来存储关键信息，如实现合约的地址，到固定且已知的存储位置。这主要包括两个方面：

- 实现合约地址（implementation address）: 

    实现合约地址存储在特定的槽位`0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`

    该槽位通过`bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`计算得出。
- 管理员地址（admin address）: 

    合约的管理员（通常负责合约升级）地址存储在特定的槽位`0xb53127684a568b3173ae13b9f8a6016e243e63b6eb8ee141579563b1e0cad5ff`

    该槽位通过`bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)`计算得出。
- Beacon 合约地址

    Beacon 合约地址存储在特定的槽位`0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50`

    该槽位通过`bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)`计算得出。

这种方法的优点在于提供了一个既定且一致的位置来存储和查找这些关键数据，从而降低了错误配置和潜在安全风险，比如存储冲突。


## 参考
- [EIP-1967 代理存储槽](https://github.com/ethereum/ercs/blob/master/ERCS/erc-1967.md)
- [EIP-1822 UUPS](https://github.com/ethereum/ercs/blob/master/ERCS/erc-1822.md)
- [编写可升级合约](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)


## 总结

通过本章的学习，我们对代理合约的不同升级模式有了深入的了解，包括它们的工作原理、优缺点和具体实施方式。这些知识对于设计灵活且可靠的智能合约系统至关重要。