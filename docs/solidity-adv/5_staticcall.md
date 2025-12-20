# staticcall 静态调用

## 什么是 staticcall

`staticcall` 是地址类型提供的一个只读底层调用函数，它与 [call](3_call.md) 类似会切换上下文，但**不允许修改状态**。相当于调用 `view` 或 `pure` 函数。

**函数签名**：
```solidity
targetAddr.staticcall(bytes memory abiEncodeData) returns (bool, bytes memory)
```

**三种调用方式对比**：

| 调用方式 | 作用 | 上下文切换 | 状态修改 | 典型应用场景 |
|---------|------|----------|---------|------------|
| `call` | 常规调用 | ✅ 是 | ✅ 允许 | 调用其他合约、转账 ETH |
| `delegatecall` | 委托调用 | ❌ 否 | ✅ 允许（当前合约） | 代理模式、库合约 |
| `staticcall` | 静态调用 | ✅ 是 | ❌ 不允许 | 只读查询、view 函数调用 |

## staticcall 的特点

1. **只读操作**：被调用的函数不能修改状态变量
2. **上下文切换**：与 `call` 一样会切换到被调用合约的上下文
3. **Gas 效率**：对于只读操作，使用 `staticcall` 可以节省 gas
4. **安全性**：保证不会修改状态，适合用于查询操作

## staticcall 使用示例

### 基本用法

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

**运行结果**：
- `callGetData()` 会成功返回 100
- `trySetData()` 会返回 `false`，因为 `setData` 试图修改状态

### 查询复杂数据

`staticcall` 可以安全地读取复杂的数据结构：

```solidity
pragma solidity ^0.8.0;

contract TokenContract {
    mapping(address => uint) public balances;

    function getBalance(address user) public view returns (uint) {
        return balances[user];
    }

    function getUserInfo(address user) public view returns (uint balance, bool isVIP) {
        balance = balances[user];
        isVIP = balances[user] > 1000;
    }
}

contract TokenQuery {
    // 查询单个值
    function queryBalance(address token, address user) public view returns (uint) {
        bytes memory payload = abi.encodeWithSignature("getBalance(address)", user);
        (bool success, bytes memory data) = token.staticcall(payload);
        require(success, "Query failed");

        return abi.decode(data, (uint));
    }

    // 查询多个返回值
    function queryUserInfo(address token, address user)
        public view returns (uint balance, bool isVIP)
    {
        bytes memory payload = abi.encodeWithSignature("getUserInfo(address)", user);
        (bool success, bytes memory data) = token.staticcall(payload);
        require(success, "Query failed");

        (balance, isVIP) = abi.decode(data, (uint, bool));
    }
}
```

## staticcall 的应用场景

### 1. 查询其他合约的状态

安全地读取其他合约的数据，确保不会意外修改状态。

```solidity
pragma solidity ^0.8.0;

contract PriceOracle {
    function getPrice(address token) public view returns (uint) {
        // 返回代币价格
        return 100;
    }
}

contract DeFiProtocol {
    address public oracle;

    constructor(address _oracle) {
        oracle = _oracle;
    }

    // 使用 staticcall 查询价格，确保不会修改 oracle 合约的状态
    function checkPrice(address token) public view returns (uint) {
        bytes memory payload = abi.encodeWithSignature("getPrice(address)", token);
        (bool success, bytes memory data) = oracle.staticcall(payload);
        require(success, "Price query failed");

        return abi.decode(data, (uint));
    }
}
```

### 2. 验证合约接口

在不修改状态的情况下测试合约是否实现了某个接口。

```solidity
pragma solidity ^0.8.0;

contract InterfaceChecker {
    // 检查合约是否实现了 ERC20 的 balanceOf 函数
    function supportsBalanceOf(address token) public view returns (bool) {
        bytes memory payload = abi.encodeWithSignature("balanceOf(address)", address(this));
        (bool success, ) = token.staticcall(payload);
        return success;
    }

    // 检查合约是否实现了特定的 getter 函数
    function hasGetter(address target, string memory functionSig) public view returns (bool) {
        bytes memory payload = abi.encodeWithSignature(functionSig);
        (bool success, ) = target.staticcall(payload);
        return success;
    }
}
```

### 3. Gas 估算

估算函数调用的 gas 消耗而不实际执行修改操作。

```solidity
pragma solidity ^0.8.0;

contract GasEstimator {
    // 估算调用某个函数需要的 gas（仅适用于只读函数）
    function estimateGas(address target, bytes memory data)
        public view returns (bool success, uint gasUsed)
    {
        uint gasBefore = gasleft();
        (success, ) = target.staticcall(data);
        uint gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
    }
}
```

### 4. 安全检查

确保某个调用不会修改状态，用于安全验证。

```solidity
pragma solidity ^0.8.0;

contract SafetyChecker {
    // 检查调用是否为只读操作
    function isReadOnly(address target, bytes memory data) public view returns (bool) {
        // 如果 staticcall 成功，说明该调用不会修改状态
        (bool success, ) = target.staticcall(data);
        return success;
    }

    // 批量检查多个调用
    function checkMultipleCalls(address[] memory targets, bytes[] memory datas)
        public view returns (bool[] memory results)
    {
        require(targets.length == datas.length, "Length mismatch");
        results = new bool[](targets.length);

        for (uint i = 0; i < targets.length; i++) {
            (results[i], ) = targets[i].staticcall(datas[i]);
        }
    }
}
```

## staticcall 与 view 函数的关系

当你在 Solidity 中调用一个 `view` 或 `pure` 函数时，编译器会自动使用 `staticcall`：

```solidity
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address account) external view returns (uint);
}

contract Example {
    // 方法 1：使用接口调用（编译器自动使用 staticcall）
    function getBalance1(address token, address user) public view returns (uint) {
        return IERC20(token).balanceOf(user);
    }

    // 方法 2：显式使用 staticcall
    function getBalance2(address token, address user) public view returns (uint) {
        bytes memory payload = abi.encodeWithSignature("balanceOf(address)", user);
        (bool success, bytes memory data) = token.staticcall(payload);
        require(success, "Call failed");
        return abi.decode(data, (uint));
    }

    // 两种方法功能相同，但方法 1 更简洁，方法 2 更灵活
}
```

## 安全注意事项

### ⚠️ 返回值检查

与 `call` 和 `delegatecall` 一样，`staticcall` 失败时不会自动 revert。

```solidity
// ❌ 错误：未检查返回值
function badStaticCall(address target) public view returns (uint) {
    (, bytes memory data) = target.staticcall(abi.encodeWithSignature("getValue()"));
    return abi.decode(data, (uint));  // 如果调用失败，data 为空，解码会失败
}

// ✅ 正确：检查返回值
function goodStaticCall(address target) public view returns (uint) {
    (bool success, bytes memory data) = target.staticcall(abi.encodeWithSignature("getValue()"));
    require(success, "Static call failed");
    return abi.decode(data, (uint));
}
```

### ⚠️ 不保证真正只读

虽然 `staticcall` 在 EVM 层面禁止状态修改，但无法阻止被调用合约使用内联汇编绕过限制。

```solidity
// ⚠️ 理论上可以绕过（但不推荐，且在大多数情况下会失败）
contract Tricky {
    uint public value;

    function sneakyModify() public view returns (uint) {
        // 这段代码会在 staticcall 中失败
        // assembly {
        //     sstore(0, 999)  // 尝试修改存储
        // }
        return value;
    }
}
```

**安全建议**：
- 只对可信的合约使用 `staticcall`
- 验证合约源代码，确保没有可疑的内联汇编
- 使用已审计的合约接口

## staticcall 的限制

1. **不能发送 ETH**：`staticcall` 不支持 `{value: amount}` 语法
2. **只能调用只读函数**：如果目标函数修改状态，调用会失败
3. **返回数据解码**：需要手动解码返回数据

```solidity
// ❌ 错误：staticcall 不能发送 ETH
function wrongUsage(address target) public {
    // 编译错误：staticcall 不支持 value
    // target.staticcall{value: 1 ether}("");
}

// ✅ 正确：如需发送 ETH，使用 call
function correctUsage(address target) public payable {
    (bool success, ) = target.call{value: msg.value}("");
    require(success);
}
```

## 小结

本节我们深入学习了 `staticcall` 静态调用：

### 核心概念

- **staticcall 的作用**：静态调用，会切换上下文，但不允许修改状态
- **主要应用**：查询数据、验证接口、Gas 估算、安全检查
- **关键特性**：保证只读，适合安全查询

### 使用场景

`staticcall` 最适合：
1. 查询其他合约的状态数据
2. 验证合约是否实现了某个接口
3. 估算函数调用的 gas 消耗
4. 确保调用不会修改状态

### 使用注意事项

使用 `staticcall` **必须注意**：
1. **检查返回值**：调用失败不会自动 revert
2. **不能发送 ETH**：不支持 `{value}` 语法
3. **手动解码**：需要使用 `abi.decode` 解码返回数据
4. **只读限制**：目标函数不能修改状态

### 延伸阅读

- [call 常规调用](./3_call.md)
- [delegatecall 委托调用](./4_delegatecall.md)
- [ABI 编码和解码](./2_ABI.md)
