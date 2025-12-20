在前面的章节中，我们学习了 Solidity 的基本数据类型（整型、布尔、地址等）。实际上，**合约本身也是一种数据类型**，称为合约类型。理解合约类型对于合约间的交互至关重要。

本章你将学到：
- 什么是合约类型
- 如何使用 `new` 关键字创建合约
- 如何与已部署的合约交互

## 什么是合约类型

每一个合约，合约本身就是一个数据类型，称为合约类型。如下代码定义了一个 `Hello` 合约类型:

```solidity
pragma solidity ^0.8.0;

contract Hello {
    function sayHi() public pure returns (uint) {
        return 10;
    }
}
```

就像我们可以声明 `uint x` 或 `address addr` 一样，我们也可以声明 `Hello h` 来表示一个 Hello 合约类型的变量。

## 使用合约类型

我们要如何使用合约类型呢？主要有两种方式：

1. **创建新合约**：使用 `new` 关键字部署一个新合约
2. **引用已存在的合约**：使用合约地址加载已部署的合约

### 创建新合约

我们可以通过合约类型创建出一个合约实例（即部署一个合约）。这里是一个例子：

```solidity
pragma solidity ^0.8.0;

contract Hello {
    function sayHi() public pure returns (uint) {
        return 10;
    }
}

contract HelloCreator {
    uint public x;
    Hello public h;

    function createHello() public returns (address) {
        // 使用 new 关键字创建合约
        h = new Hello();
        return address(h);
    }
}
```

上面的代码，调用 `HelloCreator` 合约的 `createHello` 函数可以创建一个合约（`new Hello()`）。

### 在 Remix 中演练

我们在 Remix 演练一下，先部署 `HelloCreator` 合约（注意不是部署 Hello）:

![solidity-合约](https://img.learnblockchain.cn/pics/20230623163834.png!decert.logo.water)

然后调用 `createHello` 在链上创建一个 `Hello` 合约：

![solidity-创建合约](https://img.learnblockchain.cn/pics/20230623164120.png!decert.logo.water)

右下角的日志中，可以看到创建的合约地址 `0x93Ff8fe9BF4005...`。让我们在 Remix 加载该合约，并调用 `sayHi` 来验证该合约确实部署成功了。

在 Remix 使用 `Hello` 的地址加载 `Hello`， 选择 `Hello` 合约， 在 At Address 处填入合约地址，如图：

![solidity-加载合约](https://img.learnblockchain.cn/pics/20230623164624.png!decert.logo.water)

然后调用 `sayHi()` :

![solidity-调用合约函数](https://img.learnblockchain.cn/pics/20230623164825.png!decert.logo.water)

### 合约间的交互

`createHello` 函数中，创建的合约赋值给了状态变量 `h`， 在 `HelloCreator` 合约中，也可以利用 `h` 来调用 `sayHi` 函数。例如，可以在 `HelloCreator` 合约中，添加如下函数：

```solidity
function callHi() public returns (uint) {
    // 通过合约类型变量调用函数
    x = h.sayHi();
    return x;
}
```

这展示了合约间交互的基本模式：一个合约可以调用另一个合约的公开函数。

## 合约类型的转换

合约类型可以与地址类型相互转换：

```solidity
contract TypeConversion {
    Hello public hello;

    function createAndConvert() public {
        hello = new Hello();

        // 合约类型转换为地址
        address helloAddr = address(hello);

        // 地址转换为合约类型
        Hello h2 = Hello(helloAddr);
    }
}
```

这种转换在合约间交互时非常常见。

## 小结

本节我们学习了合约类型的概念和使用：

- **合约是一种类型**：就像 uint、address 一样，合约也是 [Solidity](https://learnblockchain.cn/course/93) 的一种数据类型
- **创建合约**：使用 `new` 关键字可以在合约中部署新的合约
- **合约交互**：通过合约类型变量，可以调用其他合约的公开函数
- **类型转换**：合约类型可以与地址类型相互转换

理解合约类型是掌握 [Solidity](https://learnblockchain.cn/course/93) 合约间交互的基础，这在构建复杂的 [DApp](https://learnblockchain.cn/tags/DApp) 时非常重要。

## 操练

尝试完成以下练习：

```solidity
pragma solidity ^0.8.0;

// TODO: 定义一个 Counter 合约，包含：
// - 一个 count 状态变量
// - increment() 函数增加计数
// - getCount() 函数返回当前计数

// TODO: 定义一个 CounterFactory 合约，包含：
// - createCounter() 函数创建新的 Counter
// - incrementCounter() 函数调用创建的 Counter 的 increment
// - getCounterValue() 函数获取 Counter 的当前值
```

### 进阶学习

想了解更多关于合约创建的知识，可以参考：

- [合约创建：create 与 create2](../solidity-adv/4_create_create2.md) - 学习合约创建的底层机制
- [接口](https://learnblockchain.cn/article/22559) - 学习如何通过接口与其他合约交互
- [代理合约](../solidity-adv/6_proxy.md) - 学习代理模式的合约交互
