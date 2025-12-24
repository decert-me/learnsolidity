# delegatecall 委托调用

## 什么是 delegatecall

`delegatecall` 是地址类型提供的一个特殊的底层调用函数，它与 [call](https://learnblockchain.cn/article/22616) 的核心区别在于**不切换执行上下文**。

**函数签名**：
```solidity
targetAddr.delegatecall(bytes memory abiEncodeData) returns (bool, bytes memory)
```

**三种调用方式对比**：

| 调用方式 | 作用 | 上下文切换 | 状态修改 | 典型应用场景 |
|---------|------|----------|---------|------------|
| `call` | 常规调用 | ✅ 是 | ✅ 允许 | 调用其他合约、转账 ETH |
| `delegatecall` | 委托调用 | ❌ 否 | ✅ 允许（当前合约） | 代理模式、库合约 |
| `staticcall` | 静态调用 | ✅ 是 | ❌ 不允许 | 只读查询、view 函数调用 |

## delegatecall 与 call 的区别

### 理解上下文切换

当我们在用钱包发起交易时，使用[合约接口调用函数](https://learnblockchain.cn/article/22559)，都是常规调用。每次常规调用都会切换上下文：

**常规调用（call）**：
- 切换上下文可以这样理解：每一个地址在 EVM 有一个独立的空间，空间有各自的摆设（变量布局）
- 切换上下文就像从一个空间进入另一个空间（也可以携带一些东西进入另一个空间）
- 每次进入一个空间后，只能使用当前空间内的东西
- `msg.sender` 变为调用者的地址
- 修改的是被调用合约的状态

**委托调用（delegatecall）**：
- 没有上下文的切换，它像是给调用的代码一个主人身份（委托）
- 你可以在当前空间做你想做的事
- `msg.sender` 保持为原始调用者
- 修改的是调用者合约的状态（使用被调用合约的代码）

### 代码示例对比

我们用一个代码实例看看常规调用 `call` 与委托调用 `delegatecall` 的不同：

```solidity
pragma solidity ^0.8.0;

contract Counter {
    uint public counter;
    address public sender;

    function count() public {
        counter += 1;
        sender = msg.sender;
    }
}

contract CallTest {
    uint public counter;
    address public sender;

    function lowCallCount(address addr) public {
        // 使用 call 进行常规调用
        bytes memory methodData = abi.encodeWithSignature("count()");
        (bool success, ) = addr.call(methodData);
        require(success, "Call failed");
    }

    // 使用 delegatecall 进行委托调用
    function lowDelegatecallCount(address addr) public {
        bytes memory methodData = abi.encodeWithSignature("count()");
        (bool success, ) = addr.delegatecall(methodData);
        require(success, "Delegatecall failed");
    }
}
```

**实验步骤**：

在 Remix 中，分别部署 `Counter` 和 `CallTest` 合约，然后用 `Counter` 部署地址作为参数调用 `lowCallCount`，想一下，是 `Counter` 还是 `CallTest` 合约的 `counter` 的值增加了？再试试调用 `lowDelegatecallCount` 看看。

**结果分析**：

```
lowCallCount()           ->  Counter::counter + 1   (Counter 合约的状态被修改)
                            Counter::sender = CallTest 合约地址

lowDelegatecallCount()   ->  CallTest::counter + 1  (CallTest 合约的状态被修改)
                            CallTest::sender = 原始调用者地址
```

**原理解释**：

- `lowCallCount` 函数中使用 `call`，上下文从 `CallTest` 地址空间跳到了 `Counter` 地址空间，因此是 `Counter` 内部的 `counter` 值 + 1 了。

- `lowDelegatecallCount` 函数中使用 `delegatecall`，上下文保持在 `CallTest` 地址空间，因此是 `CallTest` 的 `counter` 值 + 1 了。

## delegatecall 的应用场景

### 场景 1：代理合约

代理合约是 `delegatecall` 最典型的应用场景。通过代理模式，可以实现合约的升级而不改变合约地址。

```solidity
pragma solidity ^0.8.0;

contract Proxy {
    // 存储实现合约的地址
    address public implementation;
    address public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    // 只有 owner 可以升级实现合约
    function upgradeTo(address newImplementation) external {
        require(msg.sender == owner, "Only owner");
        implementation = newImplementation;
    }

    // 转发所有调用到实现合约
    fallback() external payable {
        address impl = implementation;
        require(impl != address(0), "Implementation not set");

        assembly {
            // 复制 calldata 到内存
            calldatacopy(0, 0, calldatasize())

            // 使用 delegatecall 调用实现合约
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)

            // 复制返回数据
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
```

**代理合约的优势**：
- 合约地址不变，用户交互接口保持一致
- 可以升级业务逻辑，修复漏洞或添加新功能
- 节省 gas，数据存储在代理合约中

> **延伸阅读**：
> - [代理合约与升级](https://learnblockchain.cn/article/22621)

### 场景 2：库合约调用

[Solidity](https://learnblockchain.cn/course/93) 的库合约使用 `delegatecall` 来确保库函数在调用者的上下文中执行。

```solidity
pragma solidity ^0.8.0;

library SafeMath {
    function add(uint a, uint b) internal pure returns (uint) {
        uint c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
}

contract Calculator {
    using SafeMath for uint;

    uint public result;

    function calculate(uint a, uint b) public {
        // 实际上会使用 delegatecall 调用库函数
        result = a.add(b);
    }
}
```

**库合约的特点**：
- 库函数在调用者的上下文中执行
- 可以访问和修改调用者的状态变量
- 代码复用，节省部署成本

## 安全注意事项

### ⚠️ 存储布局必须一致

使用 `delegatecall` 时，调用者和被调用合约必须有相同的存储布局，否则会导致数据混乱。

```solidity
// ❌ 危险：存储布局不匹配
contract Implementation {
    uint public a;
    uint public b;
}

contract Proxy {
    uint public b;  // 顺序不同！
    uint public a;

    function execute(address impl) public {
        // 会导致数据混乱
        impl.delegatecall(abi.encodeWithSignature("someFunction()"));
    }
}

// ✅ 安全：存储布局匹配
contract CorrectProxy {
    uint public a;
    uint public b;  // 顺序相同

    function execute(address impl) public {
        (bool success, ) = impl.delegatecall(
            abi.encodeWithSignature("someFunction()")
        );
        require(success);
    }
}
```

**存储布局冲突示例**：

假设逻辑合约 `Logic` 中先声明的是 `uint public count;`，而代理合约 `Proxy` 中先声明的是 `address public logicAddress;`。当 `Proxy` 使用 `delegatecall` 调用 `Logic` 中的函数修改 `count` 时，实际上会错误地改变代理合约 `logicAddress` 的存储位置的内容。

| Proxy | Logic | 问题 |
|-------|-------|------|
| address logicAddress | uint256 count | ❌ 存储冲突 |
| uint256 count | address not_used | |

**存储布局安全建议**：
1. 代理合约和实现合约的状态变量顺序必须完全一致
2. 升级合约时只能在末尾添加新的状态变量
3. 不能修改已有状态变量的类型或顺序
4. 使用 OpenZeppelin 的升级插件来检查存储布局

### ⚠️ 返回值检查

与 `call` 一样，`delegatecall` 失败时不会自动 revert，必须手动检查返回值。

```solidity
// ❌ 错误：未检查返回值
function badDelegatecall(address target) public {
    target.delegatecall(abi.encodeWithSignature("someFunction()"));
}

// ✅ 正确：检查返回值
function goodDelegatecall(address target) public {
    (bool success, ) = target.delegatecall(abi.encodeWithSignature("someFunction()"));
    require(success, "Delegatecall failed");
}
```

## 小结

本节我们深入学习了 `delegatecall` 委托调用：

### 核心概念

- **delegatecall 的作用**：委托调用，不切换上下文，修改当前合约的状态
- **主要应用**：代理合约、库合约
- **关键特性**：保持 `msg.sender`，在调用者上下文中执行

### 使用注意事项

使用 `delegatecall` **必须注意**：
1. **存储布局一致**：调用者和被调用合约的状态变量顺序必须相同
2. **检查返回值**：底层调用失败不会自动 revert


### 延伸阅读

- [call 常规调用](https://learnblockchain.cn/article/22616)
- [staticcall 静态调用](https://learnblockchain.cn/article/22618)
- [代理合约](https://learnblockchain.cn/article/22621)
- [合约升级模式](https://learnblockchain.cn/article/22622)
