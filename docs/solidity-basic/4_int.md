# 使用整型

在[上一节](https://learnblockchain.cn/article/22531)中，我们了解了 Solidity 的类型系统。现在让我们深入学习最常用的类型之一：整型。

和大多数编程语言一样，当我们要表达一个数值时，通常用整型来表达。整型是[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)中使用最频繁的数据类型，用于处理代币数量、余额、时间戳等各种数值。

## uint/int

[Solidity](https://learnblockchain.cn/course/93) 提供了 `int` 和 `uint` 两类整型，分别表示**有符号整数**和**无符号整数**。

### 类型规格

支持从 `uint8` 到 `uint256`（以及对应的 `int8` 到 `int256`），关键字末尾的数字以 **8 步进**，表示变量所占的位数（bit）。

- `uint` 默认等同于 `uint256`
- `int` 默认等同于 `int256`

### 取值范围对比

| 类型 | 位数 | 取值范围 | 存储大小 |
|------|------|---------|---------|
| `uint8` | 8 位 | 0 到 255 (2^8-1) | 1 字节 |
| `uint32` | 32 位 | 0 到 4,294,967,295 (2^32-1) | 4 字节 |
| `uint256` | 256 位 | 0 到 2^256-1 | 32 字节 |
| `int8` | 8 位 | -128 到 127 | 1 字节 |
| `int32` | 32 位 | -2,147,483,648 到 2,147,483,647 | 4 字节 |
| `int256` | 256 位 | -2^255 到 2^255-1 | 32 字节 |



### 使用示例

之前我们的 Counter 合约里就定义了一个 `uint` 变量 `counter`：

```solidity
pragma solidity ^0.8.0;

contract Counter {
    uint public counter;  // 默认值为 0
}
```

**默认值**：当没有为整型变量赋值时，会使用默认值 0。

```solidity
pragma solidity ^0.8.0;

contract DefaultValues {
    uint public a;     // 默认值：0
    int public b;      // 默认值：0
    uint8 public c;    // 默认值：0

    function checkDefaults() public view returns (uint, int, uint8) {
        return (a, b, c);  // 返回 (0, 0, 0)
    }
}
```



> **提示：**
>
> 在 [Solidity](https://learnblockchain.cn/course/93) 0.8版本之前， 如果整数运算结果不在取值范围内，则会被溢出截断。
>
> 从 0.8.0 开始，算术运算有两个计算模式：一个是 unchecked（不检查）模式，一个是"checked" （检查）模式。
>
> 默认情况下，算术运算在 "checked" 模式下，即都会进行溢出检查，如果结果落在取值范围之外，调用会通过 [失败异常](https://learnblockchain.cn/docs/solidity/control-structures.html#assert-and-require) 回退。 你也可以通过 `unchecked { ... }` 切换到 "unchecked"模式，更多可参考文档 [unchecked](https://learnblockchain.cn/docs/solidity/control-structures.html#unchecked) 。


> **Gas 优化：** 当我们确定一个运算不会发生溢出时，使用 `unchecked` 模式，有更高的 GAS 效率。


## 整型运算符

整型支持的运算符包括以下几种：

### 1. 比较运算符

* `<=`（小于等于）、`<`（小于）、`==`（等于）、`!=`（不等于）、`>=`（大于等于）、`>`（大于）

```solidity
pragma solidity ^0.8.0;

contract ComparisonExample {
    function compare(uint a, uint b) public pure returns (bool, bool, bool) {
        return (a > b, a == b, a < b);
    }
}
```

### 2. 算术操作符

* `+`（加）、`-`（减）、`*`（乘）、`/`（除）、`%`（取余）、`**`（幂）

```solidity
pragma solidity ^0.8.0;

contract ArithmeticExample {
    function arithmetic(uint a, uint b) public pure returns (uint, uint, uint, uint, uint) {
        return (
            a + b,      // 加法
            a - b,      // 减法（a 必须 >= b，否则会 revert）
            a * b,      // 乘法
            a / b,      // 除法（会截断小数部分）
            a % b       // 取余
        );
    }

    function power(uint base, uint exponent) public pure returns (uint) {
        return base ** exponent;  // 幂运算
    }
}
```

### 3. 位操作符

* `&`（按位与）、`|`（按位或）、`^`（按位异或）、`~`（按位取反）

```solidity
pragma solidity ^0.8.0;

contract BitwiseExample {
    function bitwiseOperations(uint a, uint b) public pure returns (uint, uint, uint, uint) {
        return (
            a & b,   // 按位与：5 & 3 = 1 (0101 & 0011 = 0001)
            a | b,   // 按位或：5 | 3 = 7 (0101 | 0011 = 0111)
            a ^ b,   // 按位异或：5 ^ 3 = 6 (0101 ^ 0011 = 0110)
            ~a       // 按位取反
        );
    }
}
```

### 4. 移位操作符

* `<<`（左移位）、`>>`（右移位）

```solidity
pragma solidity ^0.8.0;

contract ShiftExample {
    function shiftOperations(uint x) public pure returns (uint, uint) {
        return (
            x << 1,  // 左移 1 位，相当于乘以 2
            x >> 1   // 右移 1 位，相当于除以 2（整数除法）
        );
    }
}
```

### 重要说明

1. **整数除法会截断**：整型变量除法总是会截断取整（向下取整）
   ```solidity
   uint result = 5 / 2;  // 结果是 2，不是 2.5
   ```

2. **除零会抛出异常**：整数除以 0 会导致交易回退
   ```solidity
   uint result = 10 / 0;  // ❌ 会 revert
   ```

3. **负数右移的特殊行为**：有符号整数右移会保留符号位（算术右移）
   ```solidity
   int x = -8;
   int result = x >> 1;  // 结果是 -4，而不是一个很大的正数
   ```

   



还可以通过变量的类型，获取其取值范围。例如：对于整型 `X`，可以使用 `type(X).min` 和 `type(X).max` 去获取这个类型的最小值与最大值。

```solidity
pragma solidity ^0.8.0;

contract TypeLimits {
    function getUint8Limits() public pure returns (uint, uint) {
        return (type(uint8).min, type(uint8).max);  // 返回 (0, 255)
    }

    function getInt8Limits() public pure returns (int, int) {
        return (type(int8).min, type(int8).max);    // 返回 (-128, 127)
    }
}


## 操练

### 练习：探索整型运算

下面的代码包含了多个测试函数，帮助你理解整型运算的各种特性。**在运行之前，先自己预测一下每个函数的返回结果！**

```SolidityEditor
pragma solidity ^0.8.0;

contract testInt {
    int8 a = -1;
    int16 b = 2;
    uint32 c = 10;
    uint8 d = 16;

    function add(uint x, uint y) public pure returns (uint z) {
        z = x + y;
    }

    function divide(uint x, uint y ) public pure returns (uint z) {
          z = x / y;
    }

    function leftshift(int x, uint y) public pure returns (int z){
        z = x << y;
    }

    function rightshift(int x, uint y) public pure returns (int z){
        z = x >> y;
    }

    function testPlusPlus() public pure returns (uint ) {
        uint x = 1;
        uint y = ++x; // c = ++a;
        return y;
    }

    function testMul1() public pure returns (uint8) {
       unchecked {
        uint8 x = 128;
        uint8 y = x * 2;
        return y;
       }
    }

    function testMul2() public pure returns (uint8) {
        uint8 x = 128;
        uint8 y = x * 2;
        return y;
    }
}
```

### 测试任务

**任务 1：基础运算**
- 调用 `add(10, 20)`，预测结果是？
- 调用 `divide(5, 2)`，预测结果是？（提示：整数除法）
- 调用 `divide(10, 0)`，会发生什么？

**任务 2：位运算**
- 调用 `leftshift(4, 1)`，预测结果是？（提示：左移相当于乘以 2）
- 调用 `rightshift(8, 2)`，预测结果是？（提示：右移相当于除以 2）

**任务 3：自增运算符**
- 调用 `testPlusPlus()`，返回值是 1 还是 2？（提示：前置自增 `++x` vs 后置自增 `x++`）

**任务 4：溢出对比** ⚠️ **重点！**
- 调用 `testMul1()`，预测结果是？
- 调用 `testMul2()`，预测结果是？
- 思考：为什么两个函数的结果不同？

`testMul1()` 的结果是0，而不是256，这是因为发生了溢出，溢出就像时钟一样，当秒针走到59之后，下一秒又从0开始。



![solidity - 整型溢出](https://img.learnblockchain.cn/pics/20230308190448.png)


`testMul2()` 调用则会失败（revert），如图：

![溢出回退](https://img.learnblockchain.cn/pics/20230308190731.png)



在 0.8.0 之前或者在 unchecked 模式下，我们都需要防止整型溢出问题，一个方法是对结果使用进行判断，防止出现异常值，例如：

```solidity
pragma solidity ^0.5.0;

function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);  // 做溢出判断，加法的结果肯定比任何一个元素大。
    return c;
}
```

### 关注 Gas

```solidity
pragma solidity ^0.8.0;

contract testUintGas {
    uint z1;
    function add_high_gas(uint x, uint y) public  {
        z1 = x + y;
    }

    uint z2;
    function add_less_gas(uint x, uint y) public  {
        unchecked {
            z2 = x + y;
        }
    }
}
```

前面提到，当我们确定一个运算不会发生溢出时，使用 `unchecked` 模式，有更高的 GAS 效率。

以下是 `add_high_gas` 和 `add_less_gas` 使用同样参数时的 Gas 消耗对比：

![solidity - 整型 gas](https://img.learnblockchain.cn/pics/20230608211624.png!decert.logo.water)

![solidity - 整型 gas](https://img.learnblockchain.cn/pics/20230608211553.png)

**Gas 消耗对比表**：

| 函数 | Transaction Cost | Execution Cost | 说明 |
|------|-----------------|----------------|------|
| `add_high_gas` | 43,684 gas | 22,496 gas | 默认 checked 模式 |
| `add_less_gas` | 43,572 gas | 22,384 gas | unchecked 模式 |
| **节省** | **112 gas** | **112 gas** | 约节省 0.26% |

**Gas 指标说明**：
- **Transaction Cost**：真实花费的 gas，对应区块链浏览器中的 `gas_used`
- **Execution Cost**：纯粹函数执行所需的 gas，不包含交易基础费用（21,000 gas）和 calldata 费用

> **优化建议：** 虽然单次节省的 gas 不多，但在循环或频繁调用的场景下，累计节省会很可观。前提是你必须确保运算不会溢出！



## uint vs int 的选择

在实际开发中，如何选择使用 `uint` 还是 `int`？

### 使用 uint（无符号）的场景

✅ **推荐使用 uint**：
- 代币数量、余额（不会为负）
- 数组索引、长度
- 时间戳、区块号
- 计数器、ID
- 价格、费用

```solidity
contract TokenExample {
    mapping(address => uint) public balances;  // ✅ 余额不会为负
    uint public totalSupply;                    // ✅ 总供应量
    uint[] public tokenIds;                     // ✅ 数组索引和长度都是 uint
}
```

### 使用 int（有符号）的场景

✅ **推荐使用 int**：
- 需要表示正负的数值（如温度、坐标）
- 需要进行减法可能为负的计算
- 需要表示相对变化（增加/减少）
- 需要进行正负数学运算

```solidity
contract SignedExample {
    int public temperature;           // ✅ 温度可以为负
    int public priceChange;           // ✅ 价格变化（正负）

    function calculateDelta(uint oldValue, uint newValue) public pure returns (int) {
        return int(newValue) - int(oldValue);  // ✅ 可能为负的差值
    }
}
```

## 常见陷阱

### 陷阱 1：无符号整数的下溢

```solidity
// ❌ 错误示例
uint x = 0;
x = x - 1;  // 会 revert（在 checked 模式下）

// ✅ 正确做法
uint x = 0;
if (x > 0) {
    x = x - 1;
}
```

### 陷阱 2：整数除法截断

```solidity
// ❌ 错误示例
uint result = 5 / 2;  // 结果是 2，不是 2.5

// ✅ 正确做法（如果需要精度）
uint result = (5 * 1e18) / 2;  // 使用更大的分子保留精度
// 结果是 2.5 * 1e18
```

### 陷阱 3：类型转换时的截断

```solidity
// ❌ 危险示例
uint256 big = 300;
uint8 small = uint8(big);  // small = 44 (300 % 256)

// ✅ 安全做法
uint256 big = 300;
require(big <= type(uint8).max, "Value too large");
uint8 small = uint8(big);
```

### 陷阱 4：比较运算时的类型问题

```solidity
// ❌ 容易出错
int a = -1;
uint b = 1;
// a < b 的结果可能不是你期望的！因为涉及类型转换

// ✅ 明确类型
int a = -1;
int b = 1;
bool result = a < b;  // 明确使用相同类型
```

## 小结

本节我们深入学习了 Solidity 中的整型，这是合约开发中使用最频繁的类型。让我们回顾一下重点：

- `uint` 和 `int` 分别表示无符号和有符号整数
- 支持 8 到 256 位，步进为 8（`uint8`、`uint16`...`uint256`）
- `uint` 和 `int` 默认为 256 位
- 默认值为 0
- 使用较小的整型时，考虑溢出风险以及截断问题

### 延伸阅读

- [中文 Solidity 文档 - 整型](https://learnblockchain.cn/docs/solidity/types.html#integers)
- [英文 Solidity 文档 - 整型](https://docs.soliditylang.org/en/v0.8.19/types.html#integers)











