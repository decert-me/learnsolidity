在 Solidity 中，合约的创建是区块链应用开发的基本组成部分，特别是在创建去中心化应用（DApp）时。

在合约中创建合约可以通过多种方式创建，其中最常用的有两种：使用 create 和 create2。

在 Solidity 中，使用 new 关键字来创建新的合约实例是一种非常直观的方法。当你使用 new 关键字时，[Solidity](https://learnblockchain.cn/course/93) 编译器会自动处理大多数底层细节，如合约的部署和初始化。

本章将从初级到高级逐步深入探讨如何在 [Solidity](https://learnblockchain.cn/course/93) 中创建合约，并通过具体的示例来加深理解。

## 使用 create 创建合约
create 的用法很简单，就是 `new` 一个合约，并传入新合约构造函数所需的参数：

`Contract x = new Contract{value: _value}(params)`

举个例子

我们首先定义一个基础合约，之后我们将展示如何通过 new 关键字来创建这个合约的实例。

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Car {
    string public model;
    address public owner;

    constructor(string memory _model, address _owner) {
        model = _model;
        owner = _owner;
    }

    function getModel() public view returns(string memory) {
        return model;
    }
}

contract CarFactory {
    Car[] private cars;

    function createCar(string memory _model) public {
        Car car = new Car(_model, msg.sender);
        cars.push(car);
    }

    function getCarsCount() public view returns(uint) {
        return cars.length;
    }
}
```

在这个例子中，Car 合约有基本的属性和一个构造函数。CarFactory 是一个工厂合约，用于创建和存储 Car 合约的实例。使用 `new Car()` 可以轻松创建 Car 的新实例。


### 合约地址的计算
当使用 `create` 创建合约时，合约的地址取决于创建合约的地址（发送者）和该地址发起的交易数（nonce）。

具体的计算公式是使用 `keccak256` 哈希函数，将创建者地址和 `nonce`（转换为 RPL 编码）作为输入：

`keccak256(rlp([sender, nonce]))`

其中，`nonce` 是一个从 1 开始的计数器，表示从该地址部署的合约数量。

值得注意的是，这个计算与发送交易时使用的 `nonce` 不同，后者是指对应[账户](https://learnblockchain.cn/tags/账户?map=EVM)发起的所有类型交易（包括普通的 ETH 转账和调用合约功能）的数量。


## 使用 create2 创建合约

create2 提供了一种更灵活的方式来创建合约，允许用户指定一个用于生成合约地址的盐（salt）值。

这使得合约的地址可以在创建前被预测，是一种在某些高级场景（如在多合约系统中确保地址稳定）中非常有用的技术。

让我们设计一个简单的例子来展示如何使用 create2。

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Toy {
    uint public modelNumber;

    constructor(uint _modelNumber) {
        modelNumber = _modelNumber;
    }
}

contract ToyFactory {
    event ToyCreated(address toyAddress);

    function createToy(uint _modelNumber, bytes32 _salt) public {
        Toy toy = new Toy{salt: _salt}(_modelNumber);
        emit ToyCreated(address(toy));
    }
}
```

在这个 ToyFactory 合约中，我们使用 create2 通过提供一个 salt 值和模型号来创建 Toy 合约。这使得合约的地址可以被预测，从而实现更高程度上的控制。

### create2 的工作原理

合约地址的生成公式如下：
`keccak256( 0xff ++ sender_address ++ salt ++ keccak256(init_code))[12:]`

这个公式中的组件包括：
- 0xff：一个固定的前缀。
- sender_address：部署合约的地址。
- salt：一个由开发者指定的32字节值。
- init_code：合约的初始化字节码。
- [12:]：表示取结果的最后20字节作为地址。

### create2 应用场景

1. 可升级的[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)

create2 使得开发者可以预先知道新合约的地址，这对于设计可升级的[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)架构非常重要。通过预留一个已知的入口点（即合约地址），可以在未来通过在该地址部署新的合约来轻松升级系统。

2. 确定性部署

在某些情况下，如多签[钱包](https://learnblockchain.cn/tags/%E9%92%B1%E5%8C%85)或去中心化组织，需要在合约部署前就确定合约地址。create2 允许开发者共享地址而不实际部署合约。这意味着在所有相关方同意前，可以安全地分发和讨论合约。

实际示例：使用create2进行确定性部署

假设我们需要部署一个只有在多个股东同意后才能启动的投票系统。我们可以使用create2来提前生成并公布这个系统的地址。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // 投票逻辑...
}

contract VotingDeployer {
    event VotingCreated(address indexed votingAddress);

    function deployVoting(bytes32 _salt) public {
        Voting voting = new Voting{salt: _salt}();
        emit VotingCreated(address(voting));
    }

    function getPredictedAddress(bytes32 _salt) public view returns (address) {
        bytes memory bytecode = type(Voting).creationCode;
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff), 
                address(this), 
                _salt, 
                keccak256(bytecode)
            )
        );
        return address(uint160(uint256(hash)));
    }
}
```

在这个例子中，VotingDeployer 合约有两个函数：deployVoting 用于部署新的 Voting 合约，而 getPredictedAddress 则允许用户预先知道将会部署合约的地址。

## 理解创建合约

在日常开发中，使用 `new` 关键字创建合约看起来很简单，但深入理解其底层机制,可以：
- 理解 Creation Code 和 Runtime Code 的区别，可以有效减小合约体积，编写更健壮的代码
- 理解地址计算公式，才能准确预测合约地址，避免地址冲突和前置运行攻击
- 在可升级合约、多签钱包等复杂场景中正确应用
- 当部署失败时，能够快速定位原因（构造函数 revert、Gas 不足、地址冲突等）
- 理解 nonce 机制，在复杂的工厂合约中追踪合约创建
- 理解底层机制后，才能设计出更优雅的工厂模式


下面我们将深入探讨合约创建的底层原理。

### 合约字节码的组成

当你编写一个 Solidity 合约时，编译器会生成两种不同的字节码：

**1. Creation Code（创建代码）**
- 包含合约的构造函数逻辑（初始化）
- 执行后会返回 Runtime Code
- 只在合约部署时执行一次
- 不会被永久存储在区块链上

**2. Runtime Code（运行时代码）**
- 包含合约的所有函数实现
- 这是最终存储在区块链上的代码
- 用户调用合约时执行的就是这部分代码
- 永久存储，消耗存储 Gas

```solidity
// 示例：理解字节码
contract Example {
    uint public value;

    // 构造函数代码 -> Creation Code 的一部分
    constructor(uint _value) {
        value = _value;  // 初始化逻辑
    }

    // 函数代码 -> Runtime Code 的一部分
    function getValue() public view returns (uint) {
        return value;
    }
}
```

你可以通过编译器获取这两种字节码：
```solidity
bytes memory creationCode = type(Example).creationCode;  // 获取 Creation Code
bytes memory runtimeCode = type(Example).runtimeCode;    // 获取 Runtime Code
```

### EVM 层面的合约创建流程

当你使用 `new` 关键字创建合约时，EVM 会执行以下核心步骤：

**CREATE 操作码**

1. **计算地址**：基于部署者地址和 nonce 生成新合约地址
2. **执行 Creation Code**：运行构造函数，初始化状态变量
3. **存储 Runtime Code**：将最终的合约代码（最大 24KB）存储到新地址
4. **返回地址**：如果成功，返回新合约地址；如果失败（Gas 不足、构造函数 revert 等），回滚所有状态

**CREATE2 操作码**

CREATE2 的执行流程相同，但地址计算方式不同：
```solidity
// CREATE: 地址依赖 nonce（不易预测）
address = keccak256(rlp([sender, nonce]))[12:]

// CREATE2: 地址依赖 salt（可预测）
address = keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
```

### 合约创建的 Gas 消耗

合约创建的 Gas 成本主要包括以下几部分：

**1. 基础费用**
- CREATE 操作码基础费用：32,000 Gas
- CREATE2 额外费用：需要计算 `keccak256(init_code)`

**2. Creation Code 执行费用**
- 构造函数中的所有操作
- 状态变量初始化
- 示例：SSTORE 操作消耗 20,000 Gas（首次设置）

**3. Runtime Code 存储费用**
- 每字节 200 Gas
- 示例：如果 Runtime Code 是 10KB，需要约 2,000,000 Gas

**4. 内存扩展费用**
- 处理 Creation Code 和 Runtime Code 时的内存使用

### 合约创建可能失败的情况

理解失败场景对于编写健壮的代码至关重要：

**1. 地址冲突**
```solidity
// CREATE2 可能遇到地址冲突
function createTwice(bytes32 salt) public {
    new MyContract{salt: salt}();  // 成功
    new MyContract{salt: salt}();  // 失败：地址已被占用
}
```

**2. Gas 不足**
```solidity
// 提供的 Gas 不足以完成部署
function createWithLowGas() public {
    new VeryLargeContract{gas: 100000}();  // 可能失败：Gas 不足
}
```

**3. 构造函数 revert**
```solidity
contract RequireContract {
    constructor(uint _value) {
        require(_value > 100, "Value too low");  // 会导致整个部署失败
    }
}

function tryCreate(uint _value) public returns (address) {
    try new RequireContract(_value) returns (RequireContract c) {
        return address(c);
    } catch {
        return address(0);  // 部署失败
    }
}
```

**4. 代码大小超限**

EIP-170 规定合约的 Runtime Code 不能超过 24576 字节（24KB）。当创建的**目标合约**代码太大时，部署会失败。

```solidity
// ❌ 目标合约太大，创建时会失败
contract VeryLargeContract {
    // 包含数百个函数、大量状态变量或复杂业务逻辑
    // 编译后 Runtime Code 可能超过 24KB
    function func1() public { /* ... */ }
    function func2() public { /* ... */ }
    // ... 数百个函数
}

contract Factory {
    function deploy() public {
        new VeryLargeContract();  // 失败：目标合约超过 24KB
    }
}

// ✅ 解决方案：拆分合约或使用库
contract MainContract {
    // 将逻辑分散到多个库中，减小合约体积
    function doWork() public {
        LibraryA.doSomething();
        LibraryB.doSomethingElse();
    }
}

library LibraryA { /* ... */ }
library LibraryB { /* ... */ }
```

**5. 调用深度超限**

EVM 限制调用栈深度为 1024 层。如果在合约创建过程中发生递归调用（如合约在构造函数中创建另一个合约，而后者又创建新合约），可能会达到深度限制。

```solidity
// ❌ 递归创建可能超过调用深度限制
contract RecursiveCreator {
    constructor(uint depth) {
        if (depth > 0) {
            new RecursiveCreator(depth - 1);  // 深度超过 1024 会失败
        }
    }
}

// ✅ 实际开发中应避免递归创建合约
contract SafeFactory {
    function createMultiple(uint count) public {
        for (uint i = 0; i < count; i++) {
            new SimpleContract();  // 迭代而非递归
        }
    }
}
```

## 总结

通过本章节的学习，应该对 Solidity 中创建合约有了全面而深入的理解：

**核心概念**
- `new` 关键字底层使用 CREATE 或 CREATE2 操作码
- CREATE：地址基于部署者地址和 nonce，不易预测
- CREATE2：地址基于部署者、salt 和字节码，可预测
- 合约字节码分为 Creation Code 和 Runtime Code
- CREATE2 适用于可升级合约、确定性部署等场景


掌握这些知识后，你将能够在实际项目中灵活运用合约创建技术，设计更加健壮和高效的智能合约系统。