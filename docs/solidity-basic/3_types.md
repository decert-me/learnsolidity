# 数据类型

对以太坊上智能合约开发有了一些宏观的了解，现在开始探索Solidity 语言特性，我们知道Solidity 是一门静态类型语言，和常见的静态类型语言有C、C++、Java类似，需要在编码时为每个变量（本地或状态变量）指定类型。

类型可以是 Solidity 提供了几种基本类型，也可以用户使用基本类型组合出复杂类型，如结构体。

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
 * 地址类型（Address) 
 * 地址常量（Address Literals）
 * 用户定义值

## 引用类型

引用类型用来表示复杂类型，占用的空间超过32字节，拷贝时开销很大，因此可以使用引用的方式，通过多个不同名称的变量指向一个值。引用类型包括**结构体**、**数组**。

在定义引用类型时，有一个额外属性来标识数据的存储位置，这个属性有：

* memory（内存）： 变量在运行时存在，其生命周期只存在于函数调用期间。

* storage（存储）：保存状态变量，只要合约存在就一直保存在区块链中。

* calldata（调用数据）：用来存储函数参数的特殊数据位置，用来接收外部数据，是一个不可修改的、非持久的函数参数存储区域。







