# call 与 delegatecall

## 理解底层调用

在我们知道一个合约的接口后， 就我们的合约中调用其函数， 例如下调用`ERC20` 的`transfer` 方法来发送奖励：

```solidity
contract Award {
  function sendAward(address user) public {
    token.transfer(user, 100);
  }
}
```



然后这里也有一个前提：需要在编写我们的合约（这里为`Award`）前，先知道目标合约的接口（这里为 `transfer` ）。

但有时我们在编写合约时，还不知道目标合约的接口，甚至是目标合约还没有创建。一个典型的例子是智能合约钱包，智能合约钱包会代表我们的身份调用任何可能的合约。显然我们无法在编写智能合约钱包时，预知未来要交互的合约接口。

这个问题该如何解决呢？

你也许知道很多编程语言（如Java）有反射的概念，反射允许在运行时动态地调用函数或方法。地址的底层调用和反射非常类似。

使用地址的底层调用功能，是在运行时动态地决定调用目标合约和函数， 因此在编译时，可以不知道具体要调用的函数或方法。



在这一篇里就来介绍一下，地址的底层调用功能。



## 底层调用函数

地址类型提供了 3 个底层的成员函数：

- `targetAddr.call(bytes memory abiEncodeData) returns (bool, bytes memory)`

- `targetAddr.delegatecall(bytes memory abiEncodeData) returns (bool, bytes memory)`

- `targetAddr.staticcall(bytes memory abiEncodeData) returns (bool, bytes memory)`

**三种调用方式对比**：

| 调用方式 | 作用 | 上下文切换 | 状态修改 | 典型应用场景 |
|---------|------|----------|---------|------------|
| `call` | 常规调用 | ✅ 是 | ✅ 允许 | 调用其他合约、转账 ETH |
| `delegatecall` | 委托调用 | ❌ 否 | ✅ 允许（当前合约） | 代理模式、库合约 |
| `staticcall` | 静态调用 | ✅ 是 | ❌ 不允许 | 只读查询、view 函数调用 |

这三个函数都可以用于与目标合约（`targetAddr`）交互，均接受 [ABI 编码数据](2_ABI.md)作为参数（`abiEncodeData`）来调用对应的函数。



### 使用 call 调用示例

`call` 是最常用的底层调用方式，它有两个主要用途：**调用合约函数**和**转账 ETH**。

#### 1. 调用合约函数

在 [接口与函数调用](../solidity-basic/17_interface.md) 一节中，我们介绍过通过 `ICounter(_counter).set(10);` 调用以下 `set` 方法：

```solidity
pragma solidity ^0.8.0;

contract Counter {
    uint public counter;

    function set(uint x) public {
        counter = x;
    }
}
```

在 [ABI 一节](2_ABI.md) 我们知道调用 `set()` 函数，实际上发送的是 ABI 编码数据 `0x60fe47b1000000000000000000000000000000000000000000000000000000000000000a`

通过 `call` 就可以直接使用编码数据发起调用：

```solidity
pragma solidity ^0.8.0;

contract CallExample {
    function callSet(address _counter) public {
        bytes memory payload = abi.encodeWithSignature("set(uint256)", 10);
        (bool success, bytes memory returnData) = _counter.call(payload);
        require(success, "Call failed");
    }
}
```

这段代码在功能上和 `ICounter(_counter).set(10);` 等价，但 `call` 的方式可以动态构造 `payload` 编码数据对函数进行调用，从而实现对任意函数、任何类型及任意数量的参数的调用。

示例中的编码数据是通过 `encodeWithSignature` 构造，Solidity 提供了多个[编码函数](./2_ABI.md#编码函数)来构造编码数据，还可以通过工具和 Web3.js 等库在链下构造编码数据。

#### 2. 使用 call 转账 ETH

`call` 可以通过 `{value: amount}` 语法附加发送以太币：

```solidity
pragma solidity ^0.8.0;

contract Transfer {
    // 纯转账（不调用函数）
    function sendETH(address to) public payable {
        (bool success, ) = to.call{value: msg.value}("");
        require(success, "Transfer failed");
    }

    // 调用函数的同时发送 ETH
    function callWithEther(address target) public payable {
        bytes memory data = abi.encodeWithSignature("register(string)", "MyName");
        (bool success, ) = target.call{value: 1 ether}(data);
        require(success, "Call failed");
    }
}
```

当调用的数据为空， EVM 将把这个调用作为 [ETH 普通转账](https://learnblockchain.cn/article/22542#1.%20%E6%99%AE%E9%80%9A%E8%BD%AC%E8%B4%A6)，因此可以使用`call{value: msg.value}("")` 做作为 ETH 转账。

**为什么要使用 call 转账？**

在 Solidity 中有三种转账 ETH 的方式：`transfer`、`send` 和 `call`。

| 特性 | transfer | send | call |
|------|----------|------|------|
| Gas 限制 | 固定 2300 gas | 固定 2300 gas | 转发所有可用 gas |
| 失败处理 | 抛出异常 | 返回 false | 返回 bool |

 transfer/send 由于历史原因受到**2300 Gas 执行限制** ，会导致 gas 可能不足以执行接收方的 `receive` 或 `fallback` 函数。


**使用 call 的安全模式**：

虽然 `call` 更灵活，但需要注意防范重入攻击。推荐使用"检查-效果-交互"模式：

```solidity
pragma solidity ^0.8.0;

contract SafeWithdraw {
    mapping(address => uint) public balances;

    function withdraw() public {
        uint amount = balances[msg.sender];

        // ✅ 检查
        require(amount > 0, "No balance");

        // ✅ 效果（先更新状态）
        balances[msg.sender] = 0;

        // ✅ 交互（再进行外部调用）
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

> **重要提示**：
> - 使用底层方法调用合约函数时，当被调用的函数发生异常时（revert），异常不会冒泡到调用者（即不会自动回退），而是返回 `false`。因此在使用所有这些低级函数时，一定要记得检查返回值。
> - 使用 `call` 转账时务必防范重入攻击，详见[重入攻击防御章节](./9_reentrancy.md)。



## call 与 delegatecall 的区别

`call` 是常规调用，`delegatecall` 为委托调用，它们的核心区别在于**上下文切换**。

### 理解上下文切换

当我们在用钱包发起交易时，使用[合约接口调用函数](../solidity-basic/17_interface.md)，都是常规调用。每次常规调用都会切换上下文：

**常规调用（call）**：
- 切换上下文可以这样理解：每一个地址在 EVM 有一个独立的空间，空间有各自的摆设（变量布局）
- 切换上下文就像从一个空间进入另一个空间（也可以携带一些东西进入另一个空间）
- 每次进入一个空间后，只能使用当前空间内的东西
- `msg.sender` 变为调用者的地址
- 修改的是被调用合约的状态

**委托调用（delegatecall）**：
- 没有上下文的切换，它像是给你一个主人身份（委托）
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

## staticcall 静态调用

`staticcall` 是静态调用，它与 `call` 类似会切换上下文，但**不允许修改状态**。相当于调用 `view` 或 `pure` 函数。

### staticcall 的特点

1. **只读操作**：被调用的函数不能修改状态变量
2. **上下文切换**：与 `call` 一样会切换到被调用合约的上下文
3. **gas 效率**：对于只读操作，使用 `staticcall` 可以节省 gas
4. **安全性**：保证不会修改状态，适合用于查询操作

### staticcall 使用示例

```solidity
pragma solidity ^0.8.0;

contract DataProvider {
    uint public data = 100;

    function getData() public view returns (uint) {
        return data;
    }

    // 这个函数会修改状态，staticcall 调用会失败
    function setData(uint _data) public {
        data = _data;
    }
}

contract StaticCallExample {
    // 使用 staticcall 调用只读函数
    function callGetData(address target) public view returns (uint) {
        bytes memory payload = abi.encodeWithSignature("getData()");
        (bool success, bytes memory returnData) = target.staticcall(payload);
        require(success, "Static call failed");

        return abi.decode(returnData, (uint));
    }

    // 尝试使用 staticcall 调用会修改状态的函数（会失败）
    function trySetData(address target, uint newData) public returns (bool) {
        bytes memory payload = abi.encodeWithSignature("setData(uint256)", newData);
        (bool success, ) = target.staticcall(payload);
        // success 会是 false，因为 setData 试图修改状态
        return success;
    }
}
```

### staticcall 的应用场景

1. **查询其他合约的状态**：安全地读取其他合约的数据
2. **验证合约接口**：在不修改状态的情况下测试合约是否实现了某个接口
3. **Gas 估算**：估算函数调用的 gas 消耗而不实际执行
4. **安全检查**：确保某个调用不会修改状态




## 实际应用场景

### 场景 1：代理合约（delegatecall）

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

### 场景 2：库合约调用（delegatecall）

Solidity 的库合约使用 `delegatecall` 来确保库函数在调用者的上下文中执行。

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

### 场景 3：多签钱包（call）

多签钱包需要调用任意合约，使用 `call` 实现动态调用。

```solidity
pragma solidity ^0.8.0;

contract MultiSigWallet {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint confirmations;
    }

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;

    // 执行已确认的交易
    function executeTransaction(uint txIndex) public {
        Transaction storage txn = transactions[txIndex];
        require(!txn.executed, "Already executed");
        require(txn.confirmations >= required, "Not enough confirmations");

        txn.executed = true;

        // 使用 call 执行任意交易
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");
    }
}
```

## 底层调用的高级用法

### 控制 Gas 数量（gas 选项）

可以通过 `gas` 选项控制调用函数使用的 gas 数量。

```solidity
pragma solidity ^0.8.0;

contract CallWithGas {
    // 限制 gas 数量
    function callWithGasLimit(address target) public {
        bytes memory data = abi.encodeWithSignature("register(string)", "MyName");
        (bool success, ) = target.call{gas: 100000}(data);
        require(success, "Call failed");
    }
}
```

### 联合使用 value 和 gas

`value` 和 `gas` 选项可以联合使用，出现的顺序不重要。

```solidity
pragma solidity ^0.8.0;

contract CallWithBoth {
    function callWithGasAndValue(address target) public payable {
        bytes memory data = abi.encodeWithSignature("register(string)", "MyName");

        // 两种顺序都可以
        (bool success, ) = target.call{gas: 100000, value: 1 ether}(data);
        require(success, "Call failed");
    }
}
```

## 安全注意事项

### ⚠️ 重入攻击风险

底层调用函数会将控制权交给被调用合约，可能导致[重入攻击](../security/9_reentrancy.md)。

### ⚠️ 返回值检查

底层调用失败时不会自动 revert，必须手动检查返回值。

```solidity
// ❌ 错误：未检查返回值
function badCall(address target) public {
    target.call(abi.encodeWithSignature("someFunction()"));
    // 如果调用失败，代码继续执行
}

// ✅ 正确：检查返回值
function goodCall(address target) public {
    (bool success, ) = target.call(abi.encodeWithSignature("someFunction()"));
    require(success, "Call failed");
}
```

### ⚠️ delegatecall 的存储布局问题

使用 `delegatecall` 时，调用者和被调用合约必须有相同的存储布局。

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

## 小结

本节我们深入学习了地址类型的三个底层调用函数，这些是实现高级合约模式的基础。

### 核心概念

**三种调用方式**：
- `call`：常规调用，切换上下文，修改被调用合约状态
- `delegatecall`：委托调用，不切换上下文，修改当前合约状态
- `staticcall`：静态调用，切换上下文，不允许修改状态

使用底层调用可以在运行时构造调用数据。使用底层调用**必须注意**：
1. **检查返回值**：底层调用失败不会自动 revert
2. **防范重入**：使用检查-效果-交互模式
3. **存储布局**：delegatecall 要求存储布局一致
4. **谨慎使用**：只在必要时使用底层调用， 应该尽量使用接口调用

### 延伸阅读

- [ABI 编码和解码](./2_ABI.md)
- [重入攻击防御](./9_reentrancy.md)
