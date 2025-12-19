# 数据类型

在[上一节](https://learnblockchain.cn/article/22529)中，我们学习了合约的基本结构，了解了如何定义状态变量和函数。现在让我们深入探索 Solidity 的类型系统。

[Solidity](https://learnblockchain.cn/course/93) 是一门**静态类型语言**，这意味着每个变量（状态变量或局部变量）的类型都必须在编译时确定。这与 C、C++、Java 等语言类似，需要在编码时为每个变量显式指定类型。

[Solidity](https://learnblockchain.cn/course/93) 提供了丰富的基本类型，你也可以使用基本类型组合出新的复杂类型，如结构体。理解类型系统是编写安全、高效[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)的基础。

## 类型分类

[Solidity](https://learnblockchain.cn/tags/Solidity?map=EVM) 类型分：

* 值类型（Value Types） 
* 引用类型（Reference Types）
* 映射类型（Mapping Types）

这篇文章，我们会各种类型的特性过一个概括性介绍，在随后的几篇文章中，我们会对一些重要的类型分别做介绍。

## 值类型

值类型变量表示可以用 32 个字节（或更少）表示的数据。**值类型的特点是：在赋值或传参时，总是进行值拷贝**。

值类型包含：
 * [布尔类型（Booleans）](./7_bool.md)
 * [整型（Integers）](./4_int.md)
 * 定长浮点型（Fixed Point Numbers）
 * [定长字节数组（Fixed-size byte arrays）](./7_bytes_string.md)
 * 有理数和整型常量（Rational and Integer Literals)
 * 字符串常量（String literals）
 * 十六进制常量（Hexadecimal literals）
 * [枚举（Enums）](./7_enum.md)
 * 函数类型（Function Types）
 * [地址类型（Address)](./5_address.md)
 * 地址常量（Address Literals）
 * 用户定义值类型

**值类型示例**：

```solidity
pragma solidity >=0.8.0;

contract ValueTypeExample {
    // 值类型赋值会进行拷贝
    function testValueType() public pure returns (uint, uint) {
        uint a = 10;
        uint b = a;  // 拷贝 a 的值给 b
        b = 20;      // 修改 b 不会影响 a
        return (a, b);  // 返回 (10, 20)
    }
}
```

> **提示：** 对于 `public` 类型的状态变量，Solidity 编译器会自动创建一个同名的访问器函数，用来获取状态变量的值（不用再额外写函数来获取变量的值）。



## 引用类型

引用类型用来表示复杂类型，占用的空间通常超过 32 字节，拷贝时开销很大。因此可以使用引用的方式，**通过多个不同名称的变量指向同一个值**。

引用类型包括：
- **数组（Arrays）** - 固定长度数组和动态数组，详见[数组](./8_array.md)
- **结构体（Structs）** - 自定义的复合数据类型，详见[结构体](./9_struct.md)
- **bytes/字符串（String）** - 动态长度的字节数组与 UTF-8 字符串，详见[结构体](./7_bytes_string.md)


### 数据位置（Data Location）

在定义引用类型时，必须显式指定一个额外的属性来标识数据的存储位置：

* **memory（内存）**：变量在运行时存在，其生命周期只存在于函数调用期间。函数执行完毕后，内存中的数据会被释放。

* **storage（存储）**：保存状态变量，只要合约存在就一直保存在区块链中。这是最昂贵的存储方式，因为数据永久保存在链上。

* **calldata（调用数据）**：用来存储函数参数的特殊数据位置，用来接收外部数据。它是一个不可修改的、非持久的函数参数存储区域，通常用于 `external` 函数的参数。

* **transient（瞬时存储）**：在 2024 年 Cancun 升级中新添加的存储位置，从 Solidity 0.8.24 版本开始支持。瞬时存储的数据只在单个交易的执行期间存在，交易结束后会被清除。可以通过 `transient` 关键字使用，适合用于防重入锁等场景。瞬时存储**仅支持值类型**。


### 引用类型赋值规则

**核心规则：** 引用类型在进行赋值时的行为取决于数据位置：

| 赋值方式 | 行为 | 说明 |
|---------|------|------|
| **不同位置赋值** | 创建副本（拷贝） | `memory` → `storage` 或 `storage` → `memory` |
| **同一位置赋值** | 创建引用（指针） | `storage` → `storage` 或 `memory` → `memory` |

**示例代码**：

```solidity
pragma solidity >=0.8.0;

contract ReferenceTypeExample {
    uint[] x; // 状态变量 x 的数据存储位置是 storage

    function testAssignment(uint[] memory memoryArray) public {
        // 1. 不同位置赋值 - 创建副本
        x = memoryArray; // 从 memory 拷贝到 storage

        // 2. 同一位置赋值 - 创建引用
        uint[] storage y = x;  // y 和 x 指向同一个 storage 位置
        y.push(100);           // 修改 y 也会修改 x

        // 3. memory 到 memory - 也是创建引用
        uint[] memory z = memoryArray;
        z[0] = 999;  // 修改 z 也会修改 memoryArray
    }

    function getReferenceExample() public view returns (uint[] memory) {
        return x;
    }
}
```

> **重要提示：**
> - 状态变量（state variables）总是存储在 `storage` 中
> - 函数参数默认存储在 `memory` 中（`external` 函数参数除外，它们在 `calldata` 中）
> - 局部变量如果是引用类型，必须显式指定数据位置



不同数据位置的 Gas 消耗对比（从高到低）：

| 存储位置 | Gas 消耗 | 生命周期 | 可修改性 |
|---------|---------|---------|---------|
| **storage** | 最高 | 永久保存（合约存在期间） | 可修改 |
| **memory** | 中等 | 函数调用期间 | 可修改 |
| **transient** | 较低 | 单个交易期间 | 可修改 |
| **calldata** | 最低 | 函数调用期间 | 不可修改（只读） |

**选择建议**：
- 状态变量必须使用 `storage`
- 函数内的临时数组/结构体使用 `memory`
- `external` 函数的参数优先使用 `calldata`（更省 Gas）
- 需要在交易内共享但不需要永久保存的数据使用 `transient`



## 映射类型

映射（Mapping）类型在功能上类似于 Java 的 `Map` 或 Python 的 `Dict`，它是一种**键值对**的映射关系存储结构。

**定义语法**：
```solidity
mapping(KeyType => ValueType) mappingName;
```




> **深入学习：** 映射类型的详细用法和高级特性，将在后续的数据结构章节中详细介绍。



## 小结

本节我们对 [Solidity](https://learnblockchain.cn/tags/Solidity?map=EVM) 的类型有一个基础了解：**类型分3类**：
- **值类型**：赋值和传参时进行拷贝，包括整型、布尔、地址等
- **引用类型**：可以通过引用方式共享数据，包括数组、结构体、字符串等
- **映射类型**：键值对存储结构，只能用于状态变量

引用类型我们需要考虑**数据位置**：
- `storage` - 永久存储，最贵
- `memory` - 临时存储，中等开销
- `calldata` - 只读参数，最便宜

不同位置赋值时进行拷贝，相同位置创建则引用

掌握这些基础知识后，我们就可以开始学习具体的类型用法了。在接下来的章节中，我们将深入学习每一种类型的详细用法和最佳实践。

---

准备好挑战了吗？前往 [Solidity 101：数据结构](https://decert.me/quests/c3e4fda2-d6b9-4c49-ba12-c1d56bc4a0ea)，完成挑战并获得技能认证 [NFT](https://learnblockchain.cn/tags/NFT)。
