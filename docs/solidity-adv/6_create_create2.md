# 合约内部创建合约

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

在这个例子中，VotingDeployer 合约有两个函数：deployVoting 用于部署新的 Voting 合约，而 getPredictedAddress 则允许用户预先知道将会部署合约的地址。

## 深入理解创建合约

理解如何使用 new 和 create2 不仅涉及语法，还包括了解底层的合约创建和部署机制。

当使用 new 时，你实际上是在发送一个特殊的交易，这个交易在 EVM 中创建和存储新合约的字节码。

同样，create2 不仅发送创建合约的交易，还允许开发者通过 salt 值影响合约的最终地址。


## 总结
通过这个章节，你应该对 Solidity 中创建合约的两种主要方法有了深入的理解。

使用 `new` 关键字和 `create` 操作码可以快速部署新合约，而 `create2` 则提供了更高级的控制，特别是在你需要预测合约地址或在更复杂的 DApp 架构中。