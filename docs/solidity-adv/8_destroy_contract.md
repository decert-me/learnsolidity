# 销毁合约

## selfdestruct

`selfdestruct` 是 Solidity 中的一种特殊函数，用于销毁合约。销毁合约后，合约的代码和存储都将从区块链中移除，合约剩余的以太币将被发送到指定的地址。

## 语法

`selfdestruct(address payable recipient);`
- `recipient`: 当合约被销毁时，剩余的资金将被发送到这个地址。该地址必须是 `payable` 的。

## 使用示例

以下是一个简单的合约示例，展示了如何使用 `selfdestruct`。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleContract {
    address payable public owner;

    // 构造函数，设置合约拥有者
    constructor() {
        owner = msg.sender;
    }

    // 接受以太币的函数
    function deposit() public payable {}

    // 合约拥有者可以销毁合约
    function destroy() public {
        require(msg.sender == owner, "You are not the owner");
        selfdestruct(payable(owner));
    }
}
```

在这个示例中，`SimpleContract` 合约有一个 `deposit` 函数可以接收以太币存款。合约的拥有者可以调用 `destroy` 函数来销毁合约。
`destroy` 函数使用了 `selfdestruct(payable(owner));` 把合约剩余的以太币发送回拥有者地址，并销毁合约。

## 应用场景

1. 清理有缺陷的合约

    在一些情况下，需要永久停止一个智能合约的功能。通过 `selfdestruct`，可以销毁合约并确保它无法再被调用。

2. 资金返还

    当合约的某些部分完成使命后，可能需要清空并返还剩余资金。使用 `selfdestruct` 可以将资金发送到特定地址。注意，ERC-20 等代币无法返还。

## 注意事项

1. 确保只有授权用户可以调用 `selfdestruct` 函数
2. 在使用 `selfdestruct` 之前，考虑是否有其他更安全的替代方案
3. 记住，即使合约被销毁，它的交易历史仍会保留在区块链上

## 变迁

### 从 `suicide` 到 `selfdestruct`

在 Solidity 的早期版本中，`selfdestruct` 最早被命名为 `suicide`。它的功能与今天的 `selfdestruct` 类似：销毁合约并将剩余的资金发送到指定的地址。在当时，以太坊和智能合约的发展还在起步阶段，大家对于这个函数的命名并没有太多的顾虑。

随着以太坊和 Solidity 社区的不断发展，开发者们意识到 `suicide` 这个名称带有负面的含义，可能引起误解和反感。因此，在 Solidity 0.5.0 版本中，开发者决定将 `suicide` 重命名为 `selfdestruct`。这不仅使命名更加直观和贴切，同时也避免了伦理和道德上的不良影响。

### 伦敦升级

当 `selfdestruct` 被调用时，合约的代码和存储会被删除，合约地址上的所有剩余以太币会发送到指定地址。这种操作不仅能收回部分 gas（与删除的数据量有关），还会在结算时，根据当前的 gas 消耗返还一定比例的已消耗 gas 给执行者。

“gas 返还”是一种激励机制，旨在鼓励开发者清理不再需要的存储数据，从而优化区块链的整体存储.

不过，在伦敦升级后（[EIP-3529](https://eips.ethereum.org/EIPS/eip-3529)），`selfdestruct` 操作不会再返还 gas。

### 上海升级

上海升级后（[EIP-6049](https://eips.ethereum.org/EIPS/eip-6049)，solidity v0.8.18），`selfdestruct` 视为已弃用，编译器将对其使用发出警告，不再建议使用。

### 坎昆升级

坎昆升级后（[EIP-6780]()，solidity v0.8.24），`selfdestruct` 只发送剩余的以太币，不会清除合约的代码和存储。除非在同一个交易中部署和销毁合约。

## 总结

`selfdestruct` 是 Solidity 中一个功能强大的函数，用于安全有效地销毁合约并返还剩余资金。正确地使用 `selfdestruct` 可以有效地管理智能合约的生命周期，但错误的使用也可能导致不可预见的风险。在使用该函数时，务必做好周全的设计和测试工作，以确保合约的安全性和可靠性。