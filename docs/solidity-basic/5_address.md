# 使用地址类型

在[以太坊基础](https://learnblockchain.cn/article/22542)一节中，我们了解了[以太坊](https://learnblockchain.cn/tags/以太坊?map=EVM)的两种[账户](https://learnblockchain.cn/tags/账户?map=EVM)类型。现在让我们学习如何在 [Solidity](https://learnblockchain.cn/course/93) 合约中使用地址类型来表示这些[账户](https://learnblockchain.cn/tags/账户?map=EVM)。

## 地址类型基础

### 什么是地址类型？

[Solidity](https://learnblockchain.cn/course/93) 合约程序里，使用**地址类型**来表示[账户](https://learnblockchain.cn/tags/账户?map=EVM)，如下在合约中获取用户地址：

```solidity
pragma solidity ^0.8.0;

contract testAddr {
    address public user;

    function getUserAddress() public {
        user = msg.sender;
    }
}
```

### 两种地址类型

地址类型有两种：

- **`address`**：普通地址类型，保存一个 20 字节的值（以太坊地址的大小）
- **`address payable`**：可支付地址，可以接收以太币

> **为什么要区分？**
>
> 如果不做区分，当我们把 ETH 转到一个合约地址上，而该合约没有处理 ETH 的逻辑，那么 ETH 将永远锁死，任何人都无法提取。
>
> 因此 Solidity 要求：能接收 ETH 的地址必须显式声明为 `address payable`。

**类型转换**：

需要时，可以将 `address` 转换为 `address payable`：

```solidity
address addr = 0x1234567890123456789012345678901234567890;
address payable ap = payable(addr);
```

> **提示**：如果转换的是合约地址，该合约需要实现 `receive` 或 `payable fallback` 函数才能接收 ETH。详见[合约如何接收 ETH](./12_receive.md)。

## 地址类型的常用操作

### 1. 地址比较

地址类型支持相等性比较：`==`（相等）、`!=`（不相等）

```solidity
pragma solidity ^0.8.0;

contract Ownable {
    address private _owner;

    constructor() {
        _owner = msg.sender;
    }

    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }
}
```

> **零地址**：`address(0)` 表示零地址（0x0000...0000），通常用于表示"无地址"或初始化未设置的地址变量。

### 2. 查询地址余额

使用 `.balance` 属性可以查询任何地址的以太币余额（单位：wei）：

```solidity
pragma solidity ^0.8.0;

contract BalanceChecker {
    function getBalance(address addr) public view returns (uint256) {
        return addr.balance;
    }

    function getMyBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

> **单位说明**：wei 是[以太坊](https://learnblockchain.cn/tags/以太坊?map=EVM)的最小单位，1 ETH = 10^18 wei。[Solidity](https://learnblockchain.cn/course/93) 提供单位关键字：`wei`、`gwei`、`ether`。

### 3. 向地址转账

**推荐方式：使用 `call`** ✅

```solidity
pragma solidity ^0.8.0;

contract Transfer {
    function sendETH(address payable to) public payable {
        (bool success, ) = to.call{value: msg.value}("");
        require(success, "Transfer failed");
    }
}
```

**为什么不用 transfer/send？**

早期的 `transfer` 和 `send` 方法有 2300 gas 限制，容易在某些情况下失败。现代 Solidity 推荐使用 `call` 方法， 在进阶部分的 [底层调用](../solidity-adv/3_addr_call.md) 中，我们会进一步介绍 call 的使用。 


## 实践示例

让我们综合运用地址类型的知识，实现一个简单的存钱罐合约：

```solidity
pragma solidity ^0.8.0;

contract PiggyBank {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // 接收 ETH
    receive() external payable {}

    // 查询余额
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // 提取 ETH（只有 owner 可以）
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
```

这个合约演示了：
- 地址比较（验证 owner）
- 查询余额（`.balance`）
- 转账（`call`）
- 接收 ETH（`receive` 函数）

## 小结

本节我们学习了 Solidity 中的地址类型基础：

✅ **两种地址类型**：
- `address`：普通地址
- `address payable`：可接收 ETH 的地址

✅ **常用操作**：
- 地址比较：`==`、`!=`
- 查询余额：`.balance`
- 转账：使用 `call` 方法

✅ **重要提示**：
- 检查零地址：`require(addr != address(0))`
- 转账使用 `call` 而不是 `transfer`/`send`
- 注意防范重入攻击

### 进阶学习

如果你想深入了解地址类型的高级用法，可以参考：
- [地址底层调用（call/delegatecall/staticcall）](../solidity-adv/3_addr_call.md) - 动态调用合约、代理模式、转账方式对比
- [合约如何接收 ETH（receive/fallback）](./12_receive.md)
- [重入攻击防御](../security/9_reentrancy.md) - 防止转账重入攻击
