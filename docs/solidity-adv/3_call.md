# call 调用

## 理解底层调用

在我们知道一个合约的接口后，就可以在我们的合约中调用其函数，例如调用 `ERC20` 的 `transfer` 方法来发送奖励：

```solidity
contract Award {
  function sendAward(address user) public {
    token.transfer(user, 100);
  }
}
```

然而这里也有一个前提：需要在编写我们的合约（这里为 `Award`）前，先知道目标合约的接口（这里为 `transfer`）。

但有时我们在编写合约时，还不知道目标合约的接口，甚至是目标合约还没有创建。一个典型的例子是智能合约钱包，智能合约钱包会代表我们的身份调用任何可能的合约。显然我们无法在编写智能合约钱包时，预知未来要交互的合约接口。

这个问题该如何解决呢？

你也许知道很多编程语言（如Java）有反射的概念，反射允许在运行时动态地调用函数或方法。地址的底层调用和反射非常类似。

使用地址的底层调用功能，是在运行时动态地决定调用目标合约和函数，因此在编译时，可以不知道具体要调用的函数或方法。

在这一篇里我们就来介绍 `call` 底层调用函数。

## 底层调用函数概览

地址类型提供了 3 个底层的成员函数：

- `targetAddr.call(bytes memory abiEncodeData) returns (bool, bytes memory)`
- `targetAddr.delegatecall(bytes memory abiEncodeData) returns (bool, bytes memory)` - 详见 [delegatecall](4_delegatecall.md)
- `targetAddr.staticcall(bytes memory abiEncodeData) returns (bool, bytes memory)` - 详见 [staticcall](5_staticcall.md)

**三种调用方式对比**：

| 调用方式 | 作用 | 上下文切换 | 状态修改 | 典型应用场景 |
|---------|------|----------|---------|------------|
| `call` | 常规调用 | ✅ 是 | ✅ 允许 | 调用其他合约、转账 ETH |
| `delegatecall` | 委托调用 | ❌ 否 | ✅ 允许（当前合约） | 代理模式、库合约 |
| `staticcall` | 静态调用 | ✅ 是 | ❌ 不允许 | 只读查询、view 函数调用 |

这三个函数都可以用于与目标合约（`targetAddr`）交互，均接受 [ABI 编码数据](2_ABI.md)作为参数（`abiEncodeData`）来调用对应的函数。

## call 调用详解

`call` 是最常用的底层调用方式，它有两个主要用途：**调用合约函数**和**转账 ETH**。

### 1. 调用合约函数

在 [接口与函数调用](https://learnblockchain.cn/article/22559) 一节中，我们介绍过通过 `ICounter(_counter).set(10);` 调用以下 `set` 方法：

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

### 2. 使用 call 转账 ETH

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

当调用的数据为空，EVM 将把这个调用作为 [ETH 普通转账](https://learnblockchain.cn/article/22542#1.%20%E6%99%AE%E9%80%9A%E8%BD%AC%E8%B4%A6)，因此可以使用 `call{value: msg.value}("")` 作为 ETH 转账。

**为什么要使用 call 转账？**

在 Solidity 中有三种转账 ETH 的方式：`transfer`、`send` 和 `call`。

| 特性 | transfer | send | call |
|------|----------|------|------|
| Gas 限制 | 固定 2300 gas | 固定 2300 gas | 转发所有可用 gas |
| 失败处理 | 抛出异常 | 返回 false | 返回 bool |

transfer/send 由于历史原因受到 **2300 Gas 执行限制**，会导致 gas 可能不足以执行接收方的 `receive` 或 `fallback` 函数。

### 3. 使用 call 的安全模式

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
> - 使用 `call` 转账时务必防范重入攻击。

## 底层调用的高级用法

### 控制 Gas 数量

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

## call 的应用场景

### 合约钱包

合约钱包需要代表用户调用任意合约，使用 `call` 实现动态调用。这是 `call` 最典型的应用场景之一。

```solidity
pragma solidity ^0.8.0;

contract ContractWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // 接收 ETH
    receive() external payable {}

    // 执行任意调用
    function execute(
        address target,
        uint value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory) {
        // 使用 call 执行任意交易
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Transaction failed");
        return result;
    }

    // 批量执行多个调用
    function executeBatch(
        address[] calldata targets,
        uint[] calldata values,
        bytes[] calldata datas
    ) external onlyOwner {
        require(
            targets.length == values.length && values.length == datas.length,
            "Length mismatch"
        );

        for (uint i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "Batch transaction failed");
        }
    }
}
```

**合约钱包的优势**：
- 可以调用任何合约的任何函数，无需预先知道接口
- 支持批量操作，一次交易执行多个调用
- 可以携带 ETH 进行调用
- 作为用户的代理身份与链上应用交互

## 安全注意事项

### ⚠️ 重入攻击风险

底层调用函数会将控制权交给被调用合约，可能导致重入攻击。在使用 `call` 转账时，务必遵循"检查-效果-交互"模式来防范。

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

## 小结

本节我们深入学习了 `call` 底层调用函数：

### 核心概念

- **call 的作用**：常规调用，会切换上下文，修改被调用合约的状态
- **主要用途**：调用合约函数、转账 ETH
- **高级选项**：可以使用 `gas` 和 `value` 选项

### 使用注意事项

使用 `call` 调用**必须注意**：
1. **检查返回值**：底层调用失败不会自动 revert
2. **防范重入**：使用检查-效果-交互模式
3. **谨慎使用**：只在必要时使用底层调用，应该尽量使用接口调用

### 延伸阅读

- [ABI 编码和解码](./2_ABI.md)
- [delegatecall 委托调用](./4_delegatecall.md)
- [staticcall 静态调用](./5_staticcall.md)
