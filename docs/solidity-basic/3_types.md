# 数据类型

对以太坊上智能合约开发有了一些宏观的了解，现在开始探索Solidity 语言特性，我们知道Solidity 是一门静态类型语言，和常见的静态类型语言有C、C++、Java类似，需要在编码时为每个变量（本地或状态变量）指定类型。

Solidity 提供了几种基本类型，用户也可以使用基本类型组合出新的类型，如结构体。

## 类型分类

Solidity 类型分：

* 值类型（Value Types） 
* 引用类型（Reference Types）
* 映射类型（Mapping Types）

## 值类型

值类型变量用表示可以用32个字节表示的数据，在赋值或传参时，总是进行拷贝。

值类型包含：
 * 布尔类型（Booleans）
 * [整型（Integers）](./4_int.md)
 * 定长浮点型（Fixed Point Numbers）
 * 定长字节数组（Fixed-size byte arrays）
 * 有理数和整型常量（Rational and Integer Literals) 
 * 字符串常量（String literals）
 * 十六进制常量（Hexadecimal literals）
 * 枚举（Enums）
 * 函数类型（Function Types）
 * [地址类型（Address)](./5_address.md) 
 * 地址常量（Address Literals）
 * 用户定义值类型



对于public类型的状态变量，Solidity 编译器还会自动创建一个访问器函数，这是一个与状态变量名字相同的函数，用来获取状态变量的值（不用再额外写函数来获取变量的值）。



## 引用类型

引用类型用来表示复杂类型，占用的空间超过32字节，拷贝时开销很大，因此可以使用引用的方式，通过多个不同名称的变量指向一个值。引用类型包括**数组** 和**结构体**。

在定义引用类型时，有一个额外属性来标识数据的存储位置，这个属性有：

* memory（内存）： 变量在运行时存在，其生命周期只存在于函数调用期间。

* storage（存储）：保存状态变量，只要合约存在就一直保存在区块链中。

* calldata（调用数据）：用来存储函数参数的特殊数据位置，用来接收外部数据，是一个不可修改的、非持久的函数参数存储区域。



记住一个规则：**不同引用类型在进行赋值的时候，只有在不同的数据位置赋值时会进行一份拷贝，而在同一数据位置内通常是增加一个引用**。

```solidity
pragma solidity >=0.4.0 <0.7.0;

contract Tiny {
    uint[] x; // 状态变量 x 的数据存储位置是 storage

    function f(uint[] memory memoryArray) public {
        x = memoryArray; // 数组拷贝到storage中， 因为 memory 变量赋值给 storage。
        uint[] storage y = x;  // 仅分配一个指针（x y 指向同一个位置），
    }

}
```



不同的数据位置的gas消耗时不一样的：

- 存储（storage）会在永久保存合约状态变量，开销最大。
- 内存（memory）仅保存临时变量，函数调用之后释放，开销很小。
- 调用数据（**calldata）** 最便宜。



## 映射类型

映射类型和Java的Map、Python的Dict在功能上差不多，它是一种键值对的映射关系存储结构，定义方式为mapping(KT => KV)。



