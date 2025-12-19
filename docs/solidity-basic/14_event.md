# 事件（Event）

这一节我们将介绍事件的使用，为什么需要事件，如何定义与触发事件，以及如何善用事件。

##  为什么需要事件

事件是以太坊上一个比较特殊的机制，以太坊虚拟机是一个封闭的沙盒环境，我们在EVM内部通过调用外部世界的接口，把信息转递给外部或从外部获得信息，因为以太坊没法对外部的信息达成共识。想象一下，你有一个智能合约，向一个网络API发出API请求，以获得一对资产的最新价格。当节点A处理一个触发这个API调用的交易时，得到响应`42`，并相应地更新合约状态。然后当节点B处理同样的交易时，价格发生了变化，响应是`40`，并相应地合约状态。然后节点C发出请求时，收到一个`404`的HTTP响应。当网络中的每个节点都可能对最新状态有不同的看法时，以太坊世界计算机就无法对最新状态达成共识。

那如何解决以太坊和外部世界的通信问题呢，答案是通过事件，在合约触发事件，将在链上生成**日志**，链下通过监听日志，获取沙盒环境内状态的变化。

![Solidity 事件](https://img.learnblockchain.cn/pics/20230715100542.png!decert.logo.water)

因此事件（Event）是合约与外部一个很重要的接口。

## 使用事件

事件是通过关键字`event`来声明的，`event` 不需要实现，只需要定义其事件名和参数。

我们也可以认为事件是一个用来被监听的接口（接口同样也不需要实现）。

通过 `emit` 关键字可以触发事件，此时会在链上生成一个日志条目。

以下定义了一个`Deposit` 事件并在 `deposit()` 函数中触发了该事件：

```solidity
pragma solidity ^0.8.0;

contract testEvent {
    // 定义事件
    event Deposit(address _from, uint _value);

    function deposit(uint value) public {
        // 触发事件
        emit Deposit(msg.sender, value);
    }
}
```

在 Remix 中调用 `deposit` 试试，直观感受一下生成的日志。

![solidity-event](https://img.learnblockchain.cn/pics/20230715121442.png!decert.logo.water)

我们会在进阶篇：[深入事件日志](../solidity-adv/1_event_logs.md)详细介绍日志，这里我们只需要知道从日志中可以获取到：

1. 事件来自哪一个合约
2. 获取到事件本身的信息及其相关参数信息

我也把该合约部署到了 [以太坊测试网](https://sepolia.etherscan.io/tx/0x694f489b3b6ecb5cdbe9e718d5493cc5bb842ddf878fb0c70bdc7e3545c2a3e6#eventlog)上， 在 `deposit`  交易信息里，可以看到如下日志：

![合约事件-deposit](https://img.learnblockchain.cn/pics/20230715154529.png!decert.logo.water)

日志包含的内容有：

1. `address`：表示当前事件来自哪个合约
2. `topics`：事件的主题
3. `data`：事件的参数数据（非索引的参数数据）

### 事件索引 `indexed`

在定义事件时，我们可以给某些事件参数加上 `indexed`， 例如：

```solidity
    event Deposit(address indexed _from, uint _value);  // 定义事件
```

其效果类似于在 sql 给某个表中的字段加索引一样，可以帮助高效地检索该数据。

我把加了`indexed`的合约部署到测试网，我们对比一下 `indexed` 是如何影响事件的。

可以看到[日志](https://sepolia.etherscan.io/tx/0xf43b5dfb69b4fe027dc1ace70fef16367be4f19506ddaeb41826c1f46c09f2c7#eventlog)有两个Topics（主题） ：

![合约事件-deposit2](https://img.learnblockchain.cn/pics/20230715162904.png!decert.logo.water)

有索引的参数放在 `topics` 下，没有索引的参数放在 `data` 下，以太坊会为日志地址及主题创建Bloom过滤器，以便更快的对数据检索。

> **索引限制：**
>
> - 每个事件最多可以有 3 个 `indexed` 参数
> - `indexed` 参数会存储在日志的 `topics` 中，便于快速检索
> - 不建议对复杂类型（如数组、结构体、字符串）使用 `indexed`，它们会被哈希后存储

## 获取事件

上面我们知道如何生成一个事件，接下来我们看看从外部如何获取到事件信息。

### 基本方法

通常有三种方法可以获取事件：

1. **通过交易收据获取事件** - 如果知道交易的Hash，可以通过交易收据查看事件日志
2. **使用过滤器获取过去事件** - 根据条件查询历史区块中的事件
3. **订阅实时事件** - 监听正在发生的事件

### 实践示例

在 Remix 中，部署合约后调用函数，可以在交易日志中直接看到触发的事件。

对于生产环境，通常使用 Web3.js、Ethers.js 等库来获取和监听事件。具体使用方法可以参考：

- [Web3.js 文档](https://learnblockchain.cn/docs/web3.js/)
- [Ethers.js 文档](https://learnblockchain.cn/ethers_v5/)

## 善用事件

我写过不少合约，但其实是在真正完整的开发面向用户的产品之后，才逐步理解事件。除了前面介绍的把链上状态变化通知到外界，以下两个场景我们也应该尽量优先考虑使用事件。

1. **如果合约中没有使用该变量，应该考虑用事件存储数据**
2. **如果需要完整的交易历史，请使用事件**

### 用事件存储数据

有不少刚转入Web3 的工程师，把智能合约当成数据库使用，习惯把需要用到的数据都保存在智能合约中，但最佳的实践是：**如无必要，勿加存储。**

倘若在合约中，**没有任何函数读取该变量，我们应该使用事件来存储数据**，Gas 成本会降低很多。

对比使用事件版本：

```solidity
contract EventDeposit {
    event Deposit(address indexed from, uint value);

    function deposit(uint value) public {
        emit Deposit(msg.sender, value);  // 使用事件记录
    }
}
```

和使用映射版本：

```solidity
contract StorageDeposit {
    mapping(address => uint) public deposits;

    function deposit(uint value) public {
        deposits[msg.sender] = value;  // 使用状态变量存储
    }
}
```

使用事件的版本 Gas 消耗远低于使用状态变量的版本。

如果仅需要在外部展示存款数据（合约中不需要读取数据），使用事件的版本和使用映射的版本可以达到相同的效果，只是前者是通过解析事件获取存款数据，后者是读取变量获取数据。

### 事件是"只写的数据库"

每次我们在触发事件时，这个事件的日志就会记录在区块链上，每次事件追加一条记录，因此事件实际上就是一个只写的数据库（只添加数据）。我们可以按照自己想要的方式在关系型数据库中重建所有的记录。

当然要实现这一点，**所有的状态变化必须触发事件**才行。

而存储状态则不同，状态变量是一个可修改的"数据库"， 读取变量获取的是当前值。

**如果需要完整的交易历史，就需要使用事件**。

### 最佳实践示例

```solidity
pragma solidity ^0.8.0;

contract TokenTransfer {
    // 定义事件记录所有转账
    event Transfer(address indexed from, address indexed to, uint256 value);

    mapping(address => uint256) private balances;

    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        // 触发事件，记录转账历史
        emit Transfer(msg.sender, to, amount);
    }
}
```

在这个例子中：
- `balances` 映射存储当前余额（需要在合约中读取）
- `Transfer` 事件记录所有转账历史（便于外部查询历史记录）

## 小结

事件是外部获取EVM内部状态变化的一个手段。在合约内触发事件后，在外部就可以获取或监听到该事件。

使用 `event` 关键字定义事件，使用 `emit` 来触发定义的事件。事件的主要特点：

- **成本低**：事件是很便宜的存储数据的方式，如果合约中没有任何函数读取该数据，应该选择事件来存储
- **可检索**：使用 `indexed` 关键字可以让参数可被高效检索
- **历史记录**：事件是"只写数据库"，适合记录完整的交易历史
- **外部通信**：事件是合约与外部世界通信的重要接口

### 进阶学习

想了解更多高级用法，可以参考：

- [深入事件日志](../solidity-adv/1_event_logs.md) - 理解日志的底层结构和Bloom过滤器
- [Ethers.js 事件处理](https://docs.ethers.org/v6) 


