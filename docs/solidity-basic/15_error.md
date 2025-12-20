在智能合约开发中，错误处理是保证合约安全和健壮性的重要手段。本章将介绍 [Solidity](https://learnblockchain.cn/course/93) 中的错误处理机制。

本章你将学到：
- EVM 如何处理错误
- 如何使用 require、assert、revert 抛出异常
- 如何使用 try/catch 捕获异常
- 自定义错误类型

## EVM 的错误处理机制

EVM 的错误处理方式与常见编程语言（如 Java、JavaScript）不同。当 EVM 执行过程中遇到错误（如数组越界、除以零等），会**回退（revert）整个交易**，撤销当前交易的所有状态改变（包括所有子调用的改变）。

在[以太坊](https://learnblockchain.cn/tags/以太坊?map=EVM)上，每个交易都是原子操作，就像数据库中的事务（transaction）一样，要么全部成功，要么全部失败，不会出现部分状态被修改的情况。

![EVM 的错误处理方式](https://img.learnblockchain.cn/pics/20230717102500.png!decert.logo.water)

## 合约中的错误处理

在合约代码中处理错误有两种方式：

1. **抛出错误**：主动检查条件，不满足时抛出异常
2. **捕获错误**：捕获外部调用的异常，避免交易回退

进行错误处理的核心是：通过条件检查，针对不符合预期的情况，进行错误捕获或抛出错误。

如果程序抛出了错误（无论是主动抛出还是 EVM 自动触发），[EVM](https://learnblockchain.cn/tags/EVM?map=EVM) 都会回滚整个交易。

## 抛出异常

[Solidity](https://learnblockchain.cn/course/93) 提供了 3 种方法来抛出异常：`require()`、`assert()`、`revert()`。

### require() - 输入验证

`require` 函数通常用于在执行逻辑前检查输入或合约状态是否满足条件，以及验证外部调用的返回值。

**语法形式**：
- `require(bool condition)`：条件不满足时撤销交易
- `require(bool condition, string memory message)`：条件不满足时撤销交易并返回错误消息

**使用示例**：

```solidity
pragma solidity ^0.8.0;

contract VotingSystem {
    address private _owner;

    constructor() {
        _owner = msg.sender;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function vote(uint age) public {
        // 检查年龄条件
        require(age >= 18, "只有18岁以上才可以投票");
        // 投票逻辑...
    }

    function transferOwnership(address newOwner) public {
        // 检查调用者权限
        require(owner() == msg.sender, "调用者不是 Owner");
        require(newOwner != address(0), "新 Owner 不能是零地址");
        _owner = newOwner;
    }
}
```

**触发 require 式异常的情况**：

除了代码主动调用 `require()` 不满足条件外，以下情况也会触发 require 式异常（Error 类型）：

1. 通过消息调用某个函数，但该函数没有正确结束（耗尽 Gas、没有匹配函数、或本身抛出异常）。注意：[低级别操作](../solidity-adv/3_addr_call.md)（call、send、delegatecall、staticcall）不会抛出异常，而是返回 false
2. 使用 `new` 关键字创建合约失败
3. 调用不存在的外部函数
4. 向无法[接收 ETH](https://learnblockchain.cn/article/22554) 的合约 `transfer()`，或附加 ETH 调用没有 payable 修饰符的函数

**Gas 处理**：当 require 式异常发生时，EVM 使用 `REVERT` 操作码回滚交易，**剩余未使用的 Gas 会返还**给交易发起者。

### assert() - 内部错误检查

`assert(bool condition)` 函数用于检查内部逻辑错误。assert 假定程序应该满足条件检查，如果条件为 false，说明程序出现了严重的内部错误。

**使用场景**：用于检查不应该发生的异常情况，如不变量（invariant）检查。

```solidity
pragma solidity ^0.8.0;

contract AssetExample {
    bool private _initialized;

    function checkInitValue() internal {
        // 检查不变量：_initialized 应该永远为 false
        assert(!_initialized);
        // 其他逻辑...
    }

    function safeAdd(uint a, uint b) internal pure returns (uint) {
        uint c = a + b;
        // 检查溢出（0.8.0+ 版本自动检查，此处仅作示例）
        assert(c >= a);
        return c;
    }
}
```

**触发 assert 式异常的情况**：

除了代码主动调用 `assert()` 不满足条件外，以下情况也会触发 assert 式异常（Panic 类型）：

1. 访问数组索引越界（如 `x[i]` 其中 `i >= x.length` 或 `i < 0`）
2. 访问固定长度 `bytesN` 的索引越界
3. 除以零或对零取模（如 `5 / 0` 或 `23 % 0`）
4. 移位负数位
5. 将过大或负数值转换为枚举类型
6. 调用未初始化的内部函数类型变量

**Gas 处理**：
- **0.8.0 之前**：触发 `INVALID` 操作码，消耗所有剩余 Gas
- **0.8.0 及之后**：使用 `REVERT` 操作码，剩余 Gas 会返还

### require() vs assert()

**使用 require() 的场景**：
1. ✅ 检查用户输入
2. ✅ 检查合约调用返回值（如 `require(external.send(amount))`）
3. ✅ 检查状态条件（如 `msg.sender == owner`）
4. ✅ 通常用于函数开头
5. ✅ 不确定用哪个时，使用 require

**使用 assert() 的场景**：
1. ✅ 检查溢出错误（如 `z = x + y; assert(z >= x);`）
2. ✅ 检查不应该发生的异常情况
3. ✅ 在状态改变后检查合约状态
4. ✅ 通常用于函数中间或结尾
5. ✅ 尽量少使用

### revert() - 灵活的错误处理

`revert()` 可以直接撤销交易，功能类似 `require()`，但更加灵活。

**语法形式**：
- `revert CustomError(arg1, arg2);`：回退并抛出自定义错误（0.8.4+ 推荐）
- `revert()` / `revert(string memory reason)`：回退并可选返回错误消息

**推荐使用自定义错误**：只需 4 字节编码就可以描述错误，比字符串消耗更少的 Gas。

```solidity
pragma solidity ^0.8.4;

contract AccessControl {
    address public owner;

    // 定义自定义错误
    error NotOwner();
    error InvalidAddress();

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) public {
        // 使用自定义错误
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert InvalidAddress();

        owner = newOwner;
    }
}
```

**功能等价**：

以下两种写法功能相同：

```solidity
// 方式 1：使用 if + revert
if (msg.sender != owner) {
    revert NotOwner();
}

// 方式 2：使用 require
require(msg.sender == owner, "调用者不是 Owner");
```

但使用自定义错误的方式 1 消耗的 Gas 更低。

## 捕获异常 - try/catch

在与其他合约[交互](https://learnblockchain.cn/article/22559)（[外部调用](./11_function.md#函数调用方式)）时，如果不想因外部调用失败而回滚整个交易，可以使用 `try...catch...` 捕获异常。

### 基本用法

```solidity
pragma solidity ^0.8.0;

contract CalledContract {
    function getTwo() external pure returns (uint256) {
        return 2;
    }

    function failing() external pure {
        revert("This function always fails");
    }
}

contract TryCatcher {
    CalledContract public externalContract;
    uint256 public result;
    bool public success;

    constructor(address _addr) {
        externalContract = CalledContract(_addr);
    }

    function executeExternal() public {
        // 使用 try/catch 捕获外部调用
        try externalContract.getTwo() returns (uint256 v) {
            // 外部调用成功
            result = v + 2;
            success = true;
        } catch {
            // 外部调用失败
            result = 0;
            success = false;
        }
    }
}
```

**要点**：
- `try/catch` 只能捕获外部调用的异常
- 可以获取外部调用的返回值
- 返回值变量只在 try 代码块内有效

### 重要限制

**try/catch 无法捕获内部异常**：

```solidity
function executeEx() public {
    try externalContract.getTwo() {
        // ❌ 即使外部调用成功，这里的 revert 也会回滚整个交易
        // catch 无法捕获内部代码的异常
        revert("Internal error");
    } catch {
        // 不会执行到这里
    }
}
```

### catch 子句

catch 提供了不同的子句来捕获不同类型的异常：

```solidity
contract TryCatcher {
    event SuccessEvent();
    event ErrorEvent(string reason);
    event PanicEvent(uint errorCode);
    event LowLevelEvent(bytes data);

    CalledContract public externalContract;

    function executeWithDetailedCatch() public {
        try externalContract.someFunction() {
            // 成功执行
            emit SuccessEvent();
        } catch Error(string memory reason) {
            // 捕获 require/revert 错误（带字符串）
            emit ErrorEvent(reason);
        } catch Panic(uint errorCode) {
            // 捕获 assert 错误和 panic
            emit PanicEvent(errorCode);
        } catch (bytes memory lowLevelData) {
            // 捕获其他低级错误
            emit LowLevelEvent(lowLevelData);
        }
    }
}
```

**catch 子句说明**：
- `catch Error(string memory reason)`：捕获 `require(condition, "reason")` 或 `revert("reason")` 类型的错误
- `catch Panic(uint errorCode)`：捕获 `assert` 类型的错误
- `catch (bytes memory returnData)`：捕获所有其他错误（通用兜底）

## 实践示例

### 安全的外部调用

```solidity
contract SafeCaller {
    event CallSuccess(uint256 value);
    event CallFailed(string reason);

    function safeExternalCall(address target) public {
        (bool success, bytes memory data) = target.call(
            abi.encodeWithSignature("getValue()")
        );

        if (success) {
            uint256 value = abi.decode(data, (uint256));
            emit CallSuccess(value);
        } else {
            // 解码错误信息
            if (data.length > 0) {
                string memory reason = abi.decode(data, (string));
                emit CallFailed(reason);
            } else {
                emit CallFailed("Call failed without reason");
            }
        }
    }
}
```

### 组合使用

```solidity
contract ComprehensiveExample {
    address public owner;

    error Unauthorized();
    error InvalidAmount(uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function processPayment(uint256 amount) public payable {
        // 1. 使用 require 检查基本条件
        require(msg.value > 0, "Must send ETH");

        // 2. 使用 revert 自定义错误
        if (msg.sender != owner) revert Unauthorized();
        if (amount == 0) revert InvalidAmount(amount);

        // 3. 使用 assert 检查不变量
        uint256 newBalance = address(this).balance;
        assert(newBalance >= msg.value);

        // 处理支付逻辑...
    }
}
```

## 小结

- **[EVM](https://learnblockchain.cn/tags/EVM?map=EVM) 错误处理**：错误发生时回退整个交易，恢复所有状态改变（原子性）
- **三种抛出方式**：
  - `require`：用于输入验证和前置条件检查
  - `assert`：用于内部错误和不变量检查
  - `revert`：更灵活，支持自定义错误（推荐）
- **自定义错误**：使用 `error` 定义，节省 Gas 且提供更好的错误信息
- **异常捕获**：使用 `try/catch` 捕获外部调用异常，避免整个交易失败
- **Gas 返还**：0.8.0+ 版本，错误发生时剩余 [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 会返还

正确的错误处理是编写安全、健壮智能合约的基础。

