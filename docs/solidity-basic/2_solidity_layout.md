# 开始编写合约

前面介绍 [MetaMask](https://decert.me/tutorial/solidity/tools/metamask/) 和 [Remix](https://decert.me/tutorial/solidity/tools/remix) 使用时，我们了解了如何编译部署 Solidity智能合约。

现在我们开始进入从代码逐步学习Solidity。 

先来看看我们的第一个合约。

## 第一个合约：Counter 

```solidity
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

// 定义一个合约
// highlight-next-line
contract Counter {
    uint public counter;
    
    constructor() {
        counter = 0;
    }
    
    function count() public {
        counter = counter + 1;
    }
    
    function get() public view returns (uint) {
        return counter;
    }
}
```



合约是可部署到区块链的最小单元， 一个合约通常由**状态变量（合约数据）**和**合约函数**组成。

> 在学习智能合约时，通常以 Counter 计数器作为入门合约，而不是通常打印 HelloWorld， 这个因为合约主要是用来处理状态的转换，另外，合约程序实际上是在节点上运行，因此是看不到打印输出的。



##  声明编译器版本

编写合约首先要做的是声明编译器版本， 告诉编译器如何编译当前的合约代码，适合使用什么版本的编译器来编译。

编译器版本声明的语法如下：

```solidity
pragma solidity >=0.8.0;
```

它的含义是使用大于等于`0.8.0` 版本的编译编译 `Counter` 合约。类似的表示还有：

```solidity
pragma solidity >=0.8.0 <0.9.0;

pragma solidity ^0.8.0;
```

版本表达式遵循npm版本语义，可以参考 https://docs.npmjs.com/misc/semver。



## 定义合约

Solidity 使用 `contract`  定义合约，这里定义了一个名为  `Counter` 的合约。

```solidity
contract Counter {
}
```

合约和其他语言的类（`class`）很类似。在Solidity中，合约本身也是一个数据类型， 称为合约类型。

合约部署到链上后，使用[地址](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)来表示一个合约。



合约由**状态变量（合约数据）**和**合约函数**组成。

> 合约还可以定义事件、自定义类型等，留在以后讨论。



### 合约构造函数



构造函数是在创建合约时执行的一个特殊函数，其作用主要是用来初始化合约， `constructor` 关键字声明的一个构造函数。

如果没有初始化代码也可以省略构造函数（此时，编译器会添加一个默认的构造函数`constructor() public {}`）。

状态变量的初始化，也可以在声明时进行指定，未指定时，默认为0。



下面是一个构造函数的示例代码： 

```solidity
pragma solidity >=0.7.0;

contract Base {
    uint x;
    address owner;
    constructor(uint _x) public {
       x = _x;
       owner = msg.sender;
    }
}
```



## 变量与函数的可见性

合约（`contract`）和其他语言的类（`class`）很类似，合约添加的变量与函数，也是使用`public` `private`等关键字来控制变量和函数是否可以被外部使用。

如`Counter`合约的如下定义：

```solidity
	uint public counter;
```

使用了 `public` 关键字， 表示 counter 是可以被公开访问的。

除 `public` 之外，还有几个关键字，来修饰属性与函数的可见性。

Solidity对函数和状态变量提供了4种可见性：`external`、`public`、`internal`、`private`。



###  public

声明为 `public` 的函数或变量，他们既可以在合约内部访问，也以合约接口形式暴露合约外部（其他合约或链下）调用。

另外，`public` 类型的状态变量，会自动创建一个同名的外部函数（称为[访问器](https://learnblockchain.cn/docs/solidity/contracts.html#getter-functions)），来获取状态变量的值。



###  external

 `external` 不可以修饰状态变量，声明为 `external` 的函数只能在外部调用，因此称为外部函数。

如何现在合约内部调用外部函数，需要使用`this.func()` （而不是 `func()`）,  前面有合约地址来调用函数，这个方式称为外部调用。

:::note

`addr.fun()` 形式为外部调用，`func()`形式为内部调用， 外部调用也称为消息调用，会切换上下文。内部调用则是在当前上下文里跳转。

:::



所有暴露给外部的函数 （声明为 `external` 和  `public`），构成了合约的对外接口。



### internal

声明为 `internal` 函数和状态变量只能在当前合约中调用或者在派生合约（子合约）里访问。



###  private



声明为 `private` 函数和状态变量仅可在当前定义它们的合约中使用，并且不能被派生合约使用。

这个有一个对比表格：

![可见性](https://img.learnblockchain.cn/pics/20230610124717.png)



:::note

合约内的所有数据（包括公共及私有数据），即便私有数据无法通过合约访问，但在链上都是透明可见的，因此无法将某些函数或变量标记为`private`，来阻止其他人看到该数据。

:::



## 定义变量

Solidity 是一个静态类型语言，在定义每个变量时，需要在声明该变量的类型。

```solidity
uint public counter;
```

这行代码声明了一个变量，变量名为 counter，类型为 [uint](./4_int.md)（一个256位的无符号整数），它是可以被公开访问的。

定义变量按格式： `变量类型` `变量可见性` `变量名`。变量可见性是可选的，没有显示申明可见性时，会使用缺省值 `internal`。

合约中的变量会在区块链上分配一个存储单元。在以太坊中，所有的变量构成了整个区块链网络的状态，所以合约中变量通常称为状态变量。

有两个特殊的“变量“：常量和不可变量， 他们不在链上分配存储单元。

### 常量

在合约里可以定义常量，使用 `constant` 来声明一个常量，常量不占用合约的存储空间，而是在编译时使用对应的表达式值替换常量名。

```solidity
pragma solidity >=0.8.0;

contract C {
    uint constant x = 32**22 + 8;
    string constant text = "abc";
}
```

使用`constant`修饰的状态变量，只能使用在编译时有确定值的表达式来给变量赋值。

:::note

因此任何通过访问存储数据、区块链数据（如`now`、`address(this).balance`或者`block.number`）或执行数据（`msg.value`或`gasleft()`）或对外部合约的调用来给它们赋值都是不允许的（因为它们的值无法在编译期确定）。

不过对于内建函数，如`keccak256`、`sha256`、`ripemd160`、`ecrecover`、`addmod`和`mulmod`，是允许的（尽管它们调用的是外部预编译合约），如这句代码就是合法的：

```
bytes32 constant myHash = keccak256("abc");
```

:::



`constant` 目前仅支持修饰 strings及值类型。



### 不可变量

不可变量的性质和常量很类似，同样在变量赋值之后，就无法修改。不可变量在构造函数中进行赋值，构造函数是在部署的时候执行，因此这是运行时赋值。



Solidity 中使用 `immutable` 来定义一个不可变量，`immutable`不可变量同样不会占用状态变量存储空间，在部署时，变量的值会被追加的运行时字节码中，因此它比使用状态变量便宜的多，同样带来了更多的安全性（确保了这个值无法再修改）。

不可变量特性在很多时候非常有用，最常见的如ERC20代币用来指示小数位置的`decimals`变量，它应该是一个不能修改的变量，很多时候我们需要在创建合约的时候指定它的值，这时`immutable`就大有用武之地，类似的还有保存创建者地址、关联合约地址等。 

 

以下是`immutable`的使用举例：

```solidity
contract Example {    
    uint immutable decimals;
    uint immutable maxBalance;
    
    constructor(uint _decimals, address _reference) public {
       decimals = _decimals;
       maxBalance = _reference.balance; 
    }
}
```



## 定义函数

还记得么，合约由**状态变量（合约数据）**和**合约函数**组成，刚才介绍了定义变量，现在来看看定义函数：

```solidity
    function count() public {
        counter = counter + 1;
    }
```

使用 `function` 关键字定义函数，这行代码声明了一个名为 `count()` 函数，`public`  表示这个函数可以被公开访问。

 `count()` 函数的作用是对`counter`状态变量加 1 ，因此调用这个函数会修改区块链状态，这时我们就需要[通过一个交易来调用该函数](https://decert.me/tutorial/solidity/tools/remix#%E8%B0%83%E7%94%A8%E5%90%88%E7%BA%A6%E5%87%BD%E6%95%B0)，调用者为交易提供 Gas，验证者（矿工）收取 Gas 打包交易，经过区块链共识后，`counter`变量才真正算完成加1 。



这里的 `count()` 函数非常简单，我们还可以根据需要定义函数的参数与返回值以及指定该函数是否要修改状态，一个函数定义形式可以这样表示：

```solidity
function 函数名(<参数类型> <参数名>) <可见性> <状态可变性> [returns(<返回类型>)]{ 

}
```



### 函数参数

Solidity  中参数的声明方式与变量声明类似，如：

```solidity
    function addAB(uint a, uint b) public {
        counter = counter + a + b;
    }
```

`addAB` 函数接受两个整数参数。

### 函数返回值

以下函数定义了返回值：

```solidity
    function addAB(uint a, uint b) public returns (uint result) {
        counter = counter + a + b;
        // highlight-next-line
				result = counter; // return counter;
    }
```

其实在Solidity 中，返回值与参数的处理方式是一样的，代码中 返回值 `result` 也称为输出参数，我们可以在函数体里直接为它赋值，或直接在 `return` 语句中提供返回值。

返回值可以仅指定其类型，省略名称，例如： 

```solidity
function addAB(uint a, uint b) public returns (uint) {
	  ....
    return counter + a + b;
}
```



Solidity 支持函数有多个返回值，例如：

```solidity
pragma solidity >0.5.0;
contract C {
		// highlight-next-line
    function f() public pure returns (uint, bool, uint) {
        return (7, true, 2);
    }
     function g() public {
        // 获取返回值
        // highlight-next-line
        (uint x, bool b, uint y) = f();
     }    
}
```



### 状态可变性（mutability）

有些函数还还会有一个关键字来描述该函数，会怎样修改区块链状态，形容函数的可变性有 3 个关键字：

- view：用 view 修饰的函数，称为视图函数，它只能读取状态，而不能修改状态。
- pure：用 pure 修饰的函数，称为纯函数，它既不能读取也不能修改状态。
- payable：用 payable 修饰的函数表示可以[接受以太币](./receive)，如果未指定，该函数将自动拒绝所有发送给它的以太币。

>  `view` , `pure` , `payable`  通常被称为修饰符

### 视图函数

这是一个视图函数：

```solidity
    // highlight-next-line
    function cal(uint a, uint b) public view returns (uint) {
        return a * (b + 42) + now;
    }
```

`cal()` 函数不修改状态，它不需要提交交易，也不需要花费交易费，调用视图函数时，只需要当前链接的节点执行，就可返回结果。

> 而交易需要全网节点共识之后才会真正确认，状态修改才会生效。



如果视图函数在一个会修改状态的函数中调用，那么视图函数会消耗 Gas 的。例如在以下代码的`set`函数调用了 `cal`函数：

```solidity
    function set(uint a, uint b) public returns (uint) {
			return cal(a, b);
    }
```

此时 set 函数 的 gas 包含了 `cal`函数的 gas。

我们可以这样理解：外部调用试图函数时 Gas 价格为0， 而在修改状态的函数中，Gas 价格随交易设定。





如果在声明为`view`的函数中修改了状态，则编译器会报错误，除直接修改状态变量外，其他如：触发事件，发送代币等都会视为修改状态。详细可参考[Solidity文档](https://learnblockchain.cn/docs/solidity/contracts.html#state-mutability)。

 

前面提到 `public` 类型的状态变量，编译器会自动创建一个同名的外部视图函数（称为[访问器](https://learnblockchain.cn/docs/solidity/contracts.html#getter-functions)），来获取状态变量的值。

如果状态变量的类型是[值类型](./3_types.md)，自动的访问器没有参数，直接返回状态变量的值， 例如：

```solidity
pragma solidity >=0.8.0;

contract C {
    uint public data = 42;
}
```

会生成函数：

```solidity
function data() external view returns (uint) {
	return data;
}
```

因此，我们可以直接在外部调用合约的`data()`方法。



### 纯函数

纯函数表示函数不读取也不修改状态， 函数声明为`pure` 表示函数是纯函数，纯函数仅做计算， 例如：

```solidity
pragma solidity >=0.5.0 <0.7.0;

contract C {
    function f(uint a, uint b) public pure returns (uint) {
        return a * (b + 42);
    }
}
```



## 练一练

以下代码`set` 和 `get` 需要你补全功能，动手练习一下吧。

```SolidityEditor
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint counter;
    
    constructor() {
    }
    
    // 如何给 counter 赋值
    function set(uint x) public {
        
    }
     
    // 如何返回  counter 变量
    function get() public view returns (uint) {
        
    }
}
```



## 小结

提炼本节的重点：合约和类（`class`）很类似， 合约里可以定义多个变量及函数，变量和函数使用可见性来指示他们可以怎样的访问。

合约函数还有一个状态可变性（mutability），用来限制它如何修改状态。

这一节我们介绍了Solidity合约代码结构，我们准备了一个 [Solidity 基础测试题](https://decert.me/quests/10002)，挑战通过你就可以领取到一枚技能认证 NFT。 

学习 Solidity 不要忘了翻看 [Solidity 文档手册](https://learnblockchain.cn/docs/solidity/)



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
