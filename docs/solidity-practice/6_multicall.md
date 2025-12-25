# Multicall：批量调用合约

Multicall 是一种在单个交易中批量调用多个合约函数的技术。它有两种主要应用场景：**批量读取数据**和**批量执行操作**。同时，根据使用 [call](../solidity-adv/3_call.md) 还是 [delegatecall](../solidity-adv/4_delegatecall.md)，又有不同的实现方式和应用场景。

## 理解 Multicall 的两种场景

### 场景 1：批量读取（Batch Read）

**目的**：在一次请求中读取多个合约的状态，而不需要发送多个 RPC 请求。

**特点**：
- 只读操作，不修改状态
- 不消耗 Gas（使用 eth_call）
- 提升前端查询效率
- 使用 `call` 调用外部合约

**典型应用**：
- 读取多个账户的 Token 余额
- 获取多个 NFT 的元数据
- 查询多个 DeFi 池的状态
- 批量获取价格信息

### 场景 2：批量执行（Batch Write）

**目的**：在一个交易中执行多个操作，实现原子性和节省 Gas。

**特点**：
- 修改链上状态
- 消耗 Gas（真实交易）
- 原子性：要么全部成功，要么全部失败
- 根据情况可以使用 `call` 或 `delegatecall`

**典型应用**：
- 批量转账
- 授权 + 交易（approve + swap）
- 批量铸造 NFT
- 复杂的 DeFi 操作

## call vs delegatecall

在使用 Multicall 前，我们需要先了解 [call](../solidity-adv/3_call.md) 和 [delegatecall](../solidity-adv/4_delegatecall.md) 的工作方式。

我们简单的复习一下： call 调用时，会切换上下文，用于调用其他独立合约的函数。
delegatecall 在调用发起者的上下文执行，用于在自己的合约中执行自己的函数，实现批量操作

## 实现 1：批量读取（使用 call）

这是最常见的 Multicall 场景，用于批量查询链上数据。

### 基础实现

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MulticallRead
 * @dev 用于批量读取多个合约的状态
 */
contract MulticallRead {
    struct Call {
        address target;   // 目标合约地址
        bytes callData;   // 调用数据
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    /**
     * @dev 批量读取，返回所有结果
     * @param calls 调用列表
     * @return blockNumber 当前区块号
     * @return results 结果数组
     */
    function aggregate(
        Call[] memory calls
    ) public view returns (uint256 blockNumber, Result[] memory results) {
        blockNumber = block.number;
        results = new Result[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            // 使用 staticcall 确保只读
            (bool success, bytes memory returnData) = calls[i].target.staticcall(
                calls[i].callData
            );

            results[i] = Result({
                success: success,
                returnData: returnData
            });
        }
    }

    /**
     * @dev 批量读取，要求所有调用都成功
     * @param calls 调用列表
     * @return blockNumber 当前区块号
     * @return returnData 返回数据数组
     */
    function aggregateStrict(
        Call[] memory calls
    ) public view returns (uint256 blockNumber, bytes[] memory returnData) {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory data) = calls[i].target.staticcall(
                calls[i].callData
            );

            require(success, "Multicall: call failed");
            returnData[i] = data;
        }
    }

    /**
     * @dev 批量获取 ETH 余额
     * @param addresses 地址列表
     * @return balances 余额数组
     */
    function getEthBalances(
        address[] memory addresses
    ) public view returns (uint256[] memory balances) {
        balances = new uint256[](addresses.length);

        for (uint256 i = 0; i < addresses.length; i++) {
            balances[i] = addresses[i].balance;
        }
    }

    /**
     * @dev 获取区块信息
     */
    function getBlockInfo()
        public
        view
        returns (
            uint256 blockNumber,
            uint256 blockTimestamp,
            bytes32 blockHash
        )
    {
        blockNumber = block.number;
        blockTimestamp = block.timestamp;
        blockHash = blockhash(block.number - 1);
    }
}
```

### 使用示例：批量查询 Token 余额

```javascript
const { ethers } = require('ethers');

// MulticallRead 合约
const multicall = new ethers.Contract(
    MULTICALL_ADDRESS,
    MULTICALL_ABI,
    provider
);

// ERC20 Token 合约
const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

// 准备调用
const addresses = ['0x123...', '0x456...', '0x789...'];
const calls = addresses.map(addr => ({
    target: TOKEN_ADDRESS,
    callData: token.interface.encodeFunctionData('balanceOf', [addr])
}));

// 执行批量查询
const [blockNumber, results] = await multicall.aggregate(calls);

// 解析结果
const balances = results.map(result => {
    if (result.success) {
        return token.interface.decodeFunctionResult('balanceOf', result.returnData)[0];
    }
    return 0n;
});

console.log('Block:', blockNumber);
console.log('Balances:', balances);
```

## 实现 2：批量执行外部合约（使用 call）

用于在一个交易中调用多个不同合约的函数。

### 基础实现

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MulticallWrite
 * @dev 用于批量执行多个合约的函数调用
 */
contract MulticallWrite {
    struct Call {
        address target;
        bytes callData;
        uint256 value;  // 要发送的 ETH 数量
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    /**
     * @dev 批量执行，允许部分失败
     * @param calls 调用列表
     * @return results 结果数组
     */
    function aggregate(
        Call[] calldata calls
    ) external payable returns (Result[] memory results) {
        results = new Result[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            // 使用 call 调用外部合约
            (bool success, bytes memory returnData) = calls[i].target.call{
                value: calls[i].value
            }(calls[i].callData);

            results[i] = Result({
                success: success,
                returnData: returnData
            });
        }
    }

    /**
     * @dev 批量执行，要求全部成功
     * @param calls 调用列表
     * @return returnData 返回数据数组
     */
    function aggregateStrict(
        Call[] calldata calls
    ) external payable returns (bytes[] memory returnData) {
        returnData = new bytes[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory data) = calls[i].target.call{
                value: calls[i].value
            }(calls[i].callData);

            require(success, "Multicall: call failed");
            returnData[i] = data;
        }

        // 退还多余的 ETH
        if (address(this).balance > 0) {
            payable(msg.sender).transfer(address(this).balance);
        }
    }

    // 接收 ETH
    receive() external payable {}
}
```

### 使用场景：授权 + 交易

```solidity
// 示例：在一个交易中完成授权和交易
// 前端代码
const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
const multicall = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI, signer);

const calls = [
    // 1. 授权 Token
    {
        target: TOKEN_ADDRESS,
        callData: token.interface.encodeFunctionData('approve', [
            DEX_ADDRESS,
            ethers.parseEther('1000')
        ]),
        value: 0
    },
    // 2. 执行交易
    {
        target: DEX_ADDRESS,
        callData: dex.interface.encodeFunctionData('swap', [
            TOKEN_A,
            TOKEN_B,
            ethers.parseEther('100')
        ]),
        value: 0
    }
];

// 在一个交易中执行
const tx = await multicall.aggregateStrict(calls);
await tx.wait();
```

---

## 实现 3：批量执行自身函数（使用 delegatecall）

用于在一个交易中执行同一个合约的多个函数。这是最常见的合约内置 Multicall 模式。

### 基础实现

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Multicallable
 * @dev 为合约添加 multicall 功能的抽象合约
 */
abstract contract Multicallable {
    /**
     * @dev 批量调用本合约的函数
     * @param data 函数调用数据数组
     * @return results 返回数据数组
     */
    function multicall(
        bytes[] calldata data
    ) external returns (bytes[] memory results) {
        results = new bytes[](data.length);

        for (uint256 i = 0; i < data.length; i++) {
            // 使用 delegatecall 在当前合约上下文中执行
            (bool success, bytes memory result) = address(this).delegatecall(
                data[i]
            );

            if (!success) {
                // 转发 revert 消息
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }

            results[i] = result;
        }
    }
}
```

### 为什么使用 delegatecall？

使用 `delegatecall` 的关键优势：

1. **保持 msg.sender**：调用的函数看到的 `msg.sender` 是原始调用者，而不是 multicall 合约
2. **使用自己的 storage**：所有状态变更都发生在当前合约中
3. **无需授权**：不需要额外的授权步骤

**对比示例**：

```solidity
contract Token {
    mapping(address => uint256) public balances;

    function transfer(address to, uint256 amount) public {
        // 使用 call：msg.sender 会是 multicall 合约
        // 使用 delegatecall：msg.sender 是原始调用者
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

### 实战：支持 Multicall 的 DeFi 合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DeFiVault
 * @dev 支持 multicall 的 DeFi 金库合约
 */
contract DeFiVault is Multicallable {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public deposits;

    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);

    /**
     * @dev 存款
     */
    function deposit(address token, uint256 amount) public {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;
        emit Deposit(msg.sender, token, amount);
    }

    /**
     * @dev 取款
     */
    function withdraw(address token, uint256 amount) public {
        require(deposits[msg.sender][token] >= amount, "Insufficient balance");
        deposits[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, token, amount);
    }

    /**
     * @dev 查询余额
     */
    function balanceOf(address user, address token) public view returns (uint256) {
        return deposits[user][token];
    }

    /**
     * 使用 multicall 可以实现：
     * 1. 一次存入多个 Token
     * 2. 一次取出多个 Token
     * 3. 存入部分 + 取出部分
     *
     * 示例（前端）：
     * const calls = [
     *     vault.interface.encodeFunctionData('deposit', [tokenA, amount1]),
     *     vault.interface.encodeFunctionData('deposit', [tokenB, amount2]),
     *     vault.interface.encodeFunctionData('withdraw', [tokenC, amount3])
     * ];
     *
     * await vault.multicall(calls);
     */
}
```

## 对比三种实现方式

| 特性 | 批量读取（call） | 批量执行外部（call） | 批量执行自身（delegatecall） |
|------|------------------|---------------------|---------------------------|
| **使用场景** | 查询多个合约状态 | 调用多个独立合约 | 调用自己的多个函数 |
| **Gas 消耗** | 0（eth_call） | 正常交易 Gas | 正常交易 Gas |
| **调用方式** | staticcall | call | delegatecall |
| **msg.sender** | - | multicall 合约 | 原始调用者 |
| **storage** | 只读 | 目标合约 | 当前合约 |
| **典型应用** | Token 余额查询 | 授权+交易 | 批量存款/取款 |

---

## 安全考虑

### 1. delegatecall 的风险

```solidity
// ❌ 危险：允许 delegatecall 到任意地址
function dangerousMulticall(address target, bytes[] calldata data) external {
    for (uint256 i = 0; i < data.length; i++) {
        (bool success,) = target.delegatecall(data[i]);
        require(success);
    }
}

// ✅ 安全：只 delegatecall 到自己
abstract contract Multicallable {
    function multicall(bytes[] calldata data) external {
        for (uint256 i = 0; i < data.length; i++) {
            (bool success,) = address(this).delegatecall(data[i]);
            require(success);
        }
    }
}
```

### 2. 重入攻击防护

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ✅ 添加重入保护
contract SafeMulticall is Multicallable, ReentrancyGuard {
    function multicall(
        bytes[] calldata data
    ) external override nonReentrant returns (bytes[] memory) {
        return super.multicall(data);
    }
}
```

### 3. 验证函数选择器

```solidity
// ✅ 只允许调用特定函数
contract RestrictedMulticall is Multicallable {
    mapping(bytes4 => bool) public allowedSelectors;

    constructor() {
        allowedSelectors[this.deposit.selector] = true;
        allowedSelectors[this.withdraw.selector] = true;
    }

    function multicall(
        bytes[] calldata data
    ) external override returns (bytes[] memory) {
        for (uint256 i = 0; i < data.length; i++) {
            bytes4 selector = bytes4(data[i][:4]);
            require(allowedSelectors[selector], "Selector not allowed");
        }
        return super.multicall(data);
    }
}
```

### 4. Gas 限制

```solidity
// ✅ 限制调用数量，防止 DoS
function multicall(
    bytes[] calldata data
) external returns (bytes[] memory results) {
    require(data.length <= 50, "Too many calls");

    results = new bytes[](data.length);
    for (uint256 i = 0; i < data.length; i++) {
        (bool success, bytes memory result) = address(this).delegatecall(data[i]);
        require(success);
        results[i] = result;
    }
}
```

---

## 最佳实践

### 1. 选择合适的实现方式

```solidity
// 读取场景：使用 staticcall
function batchRead(Call[] memory calls) public view returns (bytes[] memory) {
    bytes[] memory results = new bytes[](calls.length);
    for (uint256 i = 0; i < calls.length; i++) {
        (bool success, bytes memory data) = calls[i].target.staticcall(calls[i].callData);
        require(success);
        results[i] = data;
    }
    return results;
}

// 写入外部合约：使用 call
function batchExecute(Call[] calldata calls) external payable {
    for (uint256 i = 0; i < calls.length; i++) {
        (bool success,) = calls[i].target.call{value: calls[i].value}(calls[i].callData);
        require(success);
    }
}

// 写入自己合约：使用 delegatecall
function multicall(bytes[] calldata data) external {
    for (uint256 i = 0; i < data.length; i++) {
        (bool success,) = address(this).delegatecall(data[i]);
        require(success);
    }
}
```

### 2. 错误处理

```solidity
// ✅ 提供灵活的错误处理选项
function multicall(
    bytes[] calldata data,
    bool revertOnError
) external returns (bytes[] memory results) {
    results = new bytes[](data.length);

    for (uint256 i = 0; i < data.length; i++) {
        (bool success, bytes memory result) = address(this).delegatecall(data[i]);

        if (revertOnError) {
            require(success, "Multicall: call failed");
        }

        results[i] = success ? result : bytes("");
    }
}
```

### 3. 事件记录

```solidity
// ✅ 记录批量操作
event BatchExecuted(address indexed caller, uint256 callsCount, bool success);

function multicall(bytes[] calldata data) external returns (bytes[] memory results) {
    results = new bytes[](data.length);
    bool allSuccess = true;

    for (uint256 i = 0; i < data.length; i++) {
        (bool success, bytes memory result) = address(this).delegatecall(data[i]);
        if (!success) allSuccess = false;
        results[i] = result;
    }

    emit BatchExecuted(msg.sender, data.length, allSuccess);
    return results;
}
```

---

## 常用的 Multicall 合约

### Multicall2 / Multicall3

这些是社区广泛使用的标准 Multicall 合约：

- **Ethereum Mainnet**: `0xcA11bde05977b3631167028862bE2a173976CA11`
- **多链支持**：相同地址部署在大多数 EVM 链上

**Multicall3 新增功能**：
- 支持在失败时不回滚
- 返回区块信息和 Gas 使用量
- 支持 `value` 转账

---

## 总结

Multicall 有三种主要使用模式：

### 1. 批量读取（staticcall）
- **目的**：高效查询多个合约状态
- **特点**：不消耗 Gas，纯查询
- **场景**：前端批量获取数据

### 2. 批量执行外部合约（call）
- **目的**：在一个交易中调用多个独立合约
- **特点**：msg.sender 是 multicall 合约
- **场景**：授权+交易、跨协议操作

### 3. 批量执行自身函数（delegatecall）
- **目的**：在一个交易中调用自己的多个函数
- **特点**：msg.sender 是原始调用者
- **场景**：批量存款、批量铸造、复杂策略

**核心要点**：
- ✅ 根据场景选择合适的调用方式
- ✅ delegatecall 只用于调用自己的函数
- ✅ 注意安全性：重入、权限、Gas 限制
- ✅ 提供灵活的错误处理机制

掌握这三种模式后，你将能够构建更高效、用户友好的 DApp！
