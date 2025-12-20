函数是 Solidity 合约中最核心的组成部分，它定义了合约的行为和功能。在[合约结构章节](https://learnblockchain.cn/article/22529)中，我们已经对函数有了初步了解，本节将深入讲解 Solidity 函数的各个方面。

## 函数的基本语法

函数的完整语法格式如下：

```solidity
function 函数名(参数类型 参数名) 可见性 状态可变性 [修饰器] returns (返回值类型) {
    // 函数体
}
```

一个简单的例子：

```solidity
pragma solidity ^0.8.0;

contract Calculator {
    function add(uint a, uint b) public pure returns (uint) {
        return a + b;
    }
}
```

## 函数可见性

函数的可见性决定了函数可以从哪里被调用。Solidity 提供了[四种可见性](https://learnblockchain.cn/article/22529)级别：`public`、`external`、`internal`、`private`。

这里我们重点介绍可见性对函数调用方式的影响。

### 可见性与调用方式

```solidity
pragma solidity ^0.8.0;

contract VisibilityExample {
    uint public value = 100;

    // public 函数可以被内部和外部调用
    function publicFunc() public returns (uint) {
        return value;
    }

    // external 函数只能被外部调用
    function externalFunc() external returns (uint) {
        return value;
    }

    // internal 函数只能被内部和子合约调用
    function internalFunc() internal returns (uint) {
        return value;
    }

    // private 函数只能在当前合约内调用
    function privateFunc() private returns (uint) {
        return value;
    }

    function testCalls() public returns (uint) {
        // ✅ 可以内部调用 public 函数
        uint a = publicFunc();

        // ❌ 不能直接内部调用 external 函数
        // uint b = externalFunc();

        // ✅ 可以通过 this 外部调用 external 函数
        uint c = this.externalFunc();

        // ✅ 可以调用 internal 函数
        uint d = internalFunc();

        // ✅ 可以调用 private 函数
        uint e = privateFunc();

        return a + c + d + e;
    }
}
```

> **提示：** `public` 状态变量会自动生成一个同名的 getter 函数。例如，`uint public value` 会自动生成 `function value() public view returns (uint)`。

### 可见性对比表

| 可见性 | 当前合约 | 子合约 | 外部调用 | 推荐使用场景 |
|--------|---------|--------|---------|-------------|
| `public` | ✅ | ✅ | ✅ | 需要内外部都能调用的函数 |
| `external` | ⚠️（通过this） | ⚠️（通过this） | ✅ | 只需外部调用的函数 |
| `internal` | ✅ | ✅ | ❌ | 合约内部和继承使用的辅助函数 |
| `private` | ✅ | ❌ | ❌ | 当前合约私有的实现细节 |

### 如何选择可见性？

在实际开发中，选择正确的可见性非常重要。以下是一些实用的决策指南：

**函数可见性的选择原则**：

1. **优先使用最严格的可见性**
   - 从 `private` 开始，只在必要时放宽到 `internal`、`external` 或 `public`
   - 这样可以减少攻击面，提高合约安全性

2. **根据调用方式选择**
   - 只需内部调用 → `internal` 或 `private`
   - 只需外部调用 → `external`
   - 内外部都需要 → `public`

3. **根据继承需求选择**
   - 子合约需要访问 → `internal` 或 `public`
   - 子合约不需要访问 → `private`

**常见错误示例**：

```solidity
pragma solidity ^0.8.0;

// ❌ 错误：不必要地使用 public
contract BadExample {
    // 这个函数只在内部使用，不应该是 public
    function _calculateFee(uint amount) public pure returns (uint) {
        return amount * 3 / 100;
    }

    function process(uint amount) public pure returns (uint) {
        uint fee = _calculateFee(amount);
        return amount - fee;
    }
}

// ✅ 正确：使用 internal
contract GoodExample {
    function _calculateFee(uint amount) internal pure returns (uint) {
        return amount * 3 / 100;
    }

    function process(uint amount) public pure returns (uint) {
        uint fee = _calculateFee(amount);
        return amount - fee;
    }
}
```

**快速决策树**：

```
需要外部调用吗？
├─ 是
│  ├─ 也需要内部调用吗？
│  │  ├─ 是 → public
│  │  └─ 否 → external
│  └─
└─ 否
   ├─ 子合约需要访问吗？
   │  ├─ 是 → internal
   │  └─ 否 → private
   └─
```

## 函数调用方式

Solidity 中主要有两种函数调用方式：

1. **内部调用**：直接使用函数名调用，如 `functionName()`
   - 在同一执行上下文中运行
   - `msg.sender` 和 `msg.value` 保持不变
   - Gas 消耗较低

2. **外部调用**：通过合约实例或 `this` 调用，如 `this.functionName()`
   - 创建新的调用上下文
   - `msg.sender` 可能变化
   - Gas 消耗较高

```solidity
pragma solidity ^0.8.0;

contract CallExample {
    uint public counter = 0;

    function increment() public {
        counter++;
    }

    function testInternalCall() public {
        // 内部调用 - 直接函数名
        increment();
    }

    function testExternalCall() public {
        // 外部调用 - 通过 this
        this.increment();
    }
}
```

> **重要提示：**
>
> - 优先使用内部调用，[Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 消耗更低
> - 外部调用其他合约时要注意安全风险（重入攻击等）
> - 详见[重入攻击防御章节](../security/9_reentrancy.md)和[底层调用章节](../solidity-adv/3_addr_call.md)

## 函数状态可变性

[Solidity 合约长什么样？](https://learnblockchain.cn/article/22529) 我们介绍过状态可变性，可变性修饰符描述了函数对区块链状态的影响。我们复习一下，形容函数的可变性有 3 个关键字：

**view**：用 view 修饰的函数，称为视图函数，它只能读取状态，而不能修改状态。
**pure**：用 pure 修饰的函数，称为纯函数，它既不能读取也不能修改状态。
**payable**：用 payable 修饰的函数表示可以接受以太币，如果未指定，该函数将自动拒绝所有发送给它的以太币。

这里我们补充一些实用的技巧：

### 状态可变性的选择建议

```solidity
pragma solidity ^0.8.0;

contract StateMutability {
    uint public value = 100;

    // ❌ 不好：没有明确状态可变性
    function getValue1() public returns (uint) {
        return value;
    }

    // ✅ 好：明确标记为 view
    function getValue2() public view returns (uint) {
        return value;
    }

    // ✅ 纯计算使用 pure
    function calculate(uint a, uint b) public pure returns (uint) {
        return a + b;
    }

    // ✅ 接收以太币使用 payable
    function deposit() public payable {
        // 处理存款
    }
}
```

> **最佳实践：**
>
> 1. 不修改状态的函数应该标记为 `view` 或 `pure`
> 2. 这样可以节省 [Gas](https://learnblockchain.cn/tags/Gas?map=EVM)（外部调用时免费）
> 3. 编译器会检查是否违反了承诺
> 4. 提高代码可读性和安全性

## 函数参数和返回值

### 参数的数据位置

对于引用类型（数组、结构体、映射、字符串），必须显式指定数据位置：

```solidity
pragma solidity ^0.8.0;

contract DataLocation {
    struct User {
        string name;
        uint age;
    }

    User[] public users;

    // memory: 临时数据，函数调用后释放
    function addUser(string memory name, uint age) public {
        users.push(User(name, age));
    }

    // calldata: 只读的外部数据，最省 Gas（仅用于 external 函数）
    function processData(uint[] calldata data) external pure returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum;
    }

    // storage: 引用存储中的数据（仅 internal/private 函数）
    function updateUser(uint index, string memory newName) internal {
        User storage user = users[index];
        user.name = newName;
    }
}
```

> **数据位置对比：**
>
> - `memory`：函数参数和局部变量的默认位置，可读写
> - `calldata`：只读，最省 Gas，只能用于外部函数参数
> - `storage`：永久存储，最贵，用于引用状态变量

### 多返回值和解构赋值

```solidity
pragma solidity ^0.8.0;

contract MultipleReturns {
    // 返回多个值
    function getValues() public pure returns (uint, bool, string memory) {
        return (42, true, "Hello");
    }

    // 命名返回值（推荐）
    function getNamedValues()
        public
        pure
        returns (uint number, bool flag, string memory text)
    {
        number = 42;
        flag = true;
        text = "Hello";
        // 可以省略 return 语句
    }

    function useValues() public pure returns (uint) {
        // 接收所有返回值
        (uint num, bool flag, string memory text) = getValues();

        // 只接收部分返回值
        (uint num2, , ) = getValues();

        // 忽略某些返回值
        (, bool flag2, ) = getValues();

        return num + num2;
    }
}
```

## 函数重载

[Solidity](https://learnblockchain.cn/course/93) 支持函数重载，即同一个合约中可以有多个同名但参数不同的函数。

```solidity
pragma solidity ^0.8.0;

contract Overloading {
    // 无参数版本
    function process() public pure returns (uint) {
        return 0;
    }

    // 单参数版本
    function process(uint x) public pure returns (uint) {
        return x * 2;
    }

    // 不同类型参数
    function process(string memory text) public pure returns (uint) {
        return bytes(text).length;
    }
}
```

> **重载限制：**
>
> 1. 仅通过返回值类型不同无法重载
> 2. 参数的数据位置（`memory`/`calldata`）不影响重载
> 3. 调用时必须能够明确区分要调用哪个函数

## 构造函数

在[Solidity 合约长什么样？](https://learnblockchain.cn/article/22529#合约构造函数) 一文中, 介绍了构造函数的基础知识，这里补充一些用法：

### 带参数的构造函数

```solidity
pragma solidity ^0.8.0;

contract Token {
    string public name;
    string public symbol;
    address public owner;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }
}

// 部署时需要传入参数：
// new Token("My Token", "MTK")
```

### payable 构造函数

```solidity
pragma solidity ^0.8.0;

contract CrowdFunding {
    address public owner;
    uint public initialFunding;

    // payable 构造函数可以在部署时接收以太币
    constructor() payable {
        owner = msg.sender;
        initialFunding = msg.value;
        require(msg.value >= 1 ether, "Minimum 1 ETH required");
    }
}
```

## 特殊函数：receive 和 fallback

`receive` 和 `fallback` 是两个特殊的函数，用于处理以太币接收和未知函数调用。

关于这两个函数的详细说明，请参考[接收和发送 ETH 章节](https://learnblockchain.cn/article/22554)。

这里做一个简要总结：

```solidity
// 接收纯转账时调用
receive() external payable {
    // 处理接收的 ETH
}

// 调用不存在的函数或带数据的转账时调用
fallback() external payable {
    // 处理未知调用
}
```

## 函数修改器

函数修改器（Modifier）用于在函数执行前后添加额外的逻辑，常用于权限检查、状态验证等。

关于修改器的详细说明，请参考[函数修改器章节](https://learnblockchain.cn/article/22555)。

## 实用技巧和最佳实践

### 1. 明确函数的意图

```solidity
// ❌ 不好：不清楚函数的作用
function doSomething(uint x) public returns (uint) {
    return x * 2;
}

// ✅ 好：函数名和参数名清晰明了
function calculateDoubleValue(uint originalValue) public pure returns (uint) {
    return originalValue * 2;
}
```

### 2. 合理使用可见性

```solidity
// ❌ 不好：所有函数都是 public
contract BadExample {
    function helperFunction() public { }
    function publicAPI() public { }
}

// ✅ 好：根据实际需要设置可见性
contract GoodExample {
    function _helperFunction() internal { }  // 内部辅助函数
    function publicAPI() external { }         // 外部接口
}
```

### 3. 检查外部调用的返回值

```solidity
// ❌ 不好：忽略返回值
contract BadExample {
    function transfer(address token, address to, uint amount) public {
        IERC20(token).transfer(to, amount);  // 可能失败但未检查
    }
}

// ✅ 好：检查返回值
contract GoodExample {
    function transfer(address token, address to, uint amount) public {
        bool success = IERC20(token).transfer(to, amount);
        require(success, "Transfer failed");
    }
}
```

## 操练

### 练习：实现一个多功能计算器

```SolidityEditor
pragma solidity ^0.8.0;

contract Calculator {
    uint public lastResult;

    // TODO: 实现加法（修改状态，保存结果）
    function add(uint a, uint b) public returns (uint) {
        // 你的代码
    }

    // TODO: 实现减法（纯函数，不修改状态）
    function subtract(uint a, uint b) public pure returns (uint) {
        // 你的代码
    }

    // TODO: 实现乘法（使用 lastResult）
    function multiplyByLast(uint a) public view returns (uint) {
        // 你的代码
    }

    // TODO: 实现函数重载版本的 add
    function add(uint a, uint b, uint c) public returns (uint) {
        // 你的代码
    }
}
```

## 小结

本节我们深入学习了 [Solidity](https://learnblockchain.cn/course/93) 函数的核心知识：

- **函数语法**：理解函数的完整语法结构
- **可见性**：`public`、`external`、`internal`、`private` 的区别和应用
- **调用方式**：内部调用和外部调用的基本区别
- **状态可变性**：`view`、`pure`、`payable` 的使用场景
- **参数和返回值**：数据位置、多返回值、解构赋值
- **函数重载**：同名函数的不同参数版本
- **特殊函数**：`constructor`、`receive`、`fallback` 的作用
- **最佳实践**：安全编码、代码可读性

掌握这些知识后，你就能编写出高效、安全且易维护的[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)了！

### 进阶学习

对于更高级的主题，可以参考：

- [底层调用](../solidity-adv/3_addr_call.md) - 学习 call、delegatecall、staticcall
- [ABI 编码](../solidity-adv/2_ABI.md) - 了解函数选择器和数据编码
- [重入攻击防御](../security/9_reentrancy.md) - 外部调用的安全最佳实践
