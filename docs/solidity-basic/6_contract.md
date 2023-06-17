

# 使用合约

合约是一段包含了多个函数的程序，是部署到区块链的最小单元。合约部署到链上后，依旧使用地址来表示一个合约。



## 定义合约

每一个合约，合约本身也是一个数据类型， 称为合约类型，如下代码定义了一个`Hello`合约类型:

```solidity
pragma solidity ^0.8.0;

contract Hello {
  function sayHi() public view returns  (uint) {
	  return 10;
  }
}
```

如果你有其他语言的经验，合约类型和其他语言的类（`class`）很类似。



## 调用合约中的方法

上面定义了一个 `Hello` 合约类型， 有一个成员函数`sayHi`。

下面我们使用`Hello` 及成员函数`sayHi`：

```solidity
pragma solidity ^0.8.0;

contract Hello {
  function sayHi() public view returns  (uint) {
	  return 10;
  }
}

contract testContract {
	uint public x;

	function callsayHi() public returns (uint) {
	
		// highlight-start
		Hello c = new Hello();
		x = c.sayHi();
	  // highlight-end
		return x;
	}
}
```



`callsayHi` 函数中，声明一个合约类型的变量（`Hello c`）并**创建一个合约**对变量`c`初始化 （`new Hello()`），然后用`c.sayHi() `调用函数。

So easy... 对吧~  



在合约内部，可以使用`this`关键在表示当前的合约实例，**任何一个合约类型可以显式转换为`address`类型**，从而可以使用[地址类型](./5_address.md)的成员函数。

可以通过`address(this)`把当前合约转换位一个地址：



```solidity
pragma solidity ^0.8.0;

contract testAddr {

	function testTrasfer(address payable x) public {
    // highlight-next-line
      address myAddress = address(this);
	}
}
```







## 合约变量和函数

合约和其他语言的类（`class`）很类似，我们可以给合约添加变量与函数，也是使用`public` `private`等关键字来控制变量和函数是否可以被外部使用。

如前面的合约：

```solidity
contract Hello {
  function sayHi() public view returns  (uint) {
	  return 10;
  }
}

contract Counter {
	uint public counter;
}
```

`Hello` 合约定义了一个 `sayHi()` 方法， 使用了 `public` 修饰， 表示 `sayHi()` 方法可以在 `Hello`  之外访问。

`Counter` 合约定义了一个 `counter` 状态变量，也使用了 `public` 修饰。



除 `public` 之外，还有几个关键字，来修饰属性与函数的可见性。

### 可见性

Solidity对函数和状态变量提供了4种可见性：`external`、`public`、`internal`、`private`。



**public**：

声明为 `public` 的函数或变量，他们既可以在合约内部访问，也以合约接口形式暴露合约外部（其他合约或链下）调用。

另外，`public` 类型的状态变量，会自动创建一个同名的公共函数（称为[访问器](https://learnblockchain.cn/docs/solidity/contracts.html#getter-functions)），来获取状态变量的值。



**external**：

 `external` 不可以修饰状态变量，声明为 `external` 的函数只能在外部调用，因此称为外部函数。

如何现在合约内部调用外部函数，需要使用`this.func()` （而不是 `func()`）,  前面有合约地址来调用函数，这个方式称为外部调用。

:::note

`addr.fun()` 形式为外部调用，`func()`形式为内部调用， 外部调用也称为消息调用，会切换上下文。内部调用则是在当前上下文里跳转。

:::



所有暴露给外部的函数 （声明为 `external` 和  `public`），构成了合约的对外接口。



**internal**： 

声明为 `internal` 函数和状态变量只能在当前合约中调用或者在派生合约（子合约）里访问。



**private**：



声明为 `private` 函数和状态变量仅可在当前定义它们的合约中使用，并且不能被派生合约使用。



![可见性](https://img.learnblockchain.cn/pics/20230610124717.png)



:::note

合约内的所有数据（包括公共及私有数据），即便私有数据无法通过合约访问，但在链上都是透明可见的，因此无法将某些函数或变量标记为`private`，来阻止其他人看到该数据。

:::



### 定义状态变量与函数



```solidity
pragma solidity  >=0.8.0;

contract C {
		// 定义状态变量
    // highlight-next-line
    uint public data;
    
    // 定义函数
    // highlight-next-line
    function f(uint a) private pure returns (uint b) {
       return a + 1;
    }
    
    // 定义函数
    // highlight-next-line
    function setData(uint a) internal { 
    		data = a;
    }
    
}
```



定义状态变量按格式： `变量类型` `变量可见性` `变量名`， 如: `uint public data`;

定义函数时， 可见性修饰符在参数列表和返回关键字中间。



### 合约的构造函数



构造函数是在创建合约时执行的一个特殊函数，其作用主要是用来初始化合约， `constructor` 关键字声明的一个构造函数。

如果没有初始化代码也可以省略构造函数（此时，编译器会添加一个默认的构造函数`constructor() public {}`）。

状态变量的初始化，也可以在声明时进行指定，未指定时，默认为0。

构造函数可以是公有函数`public`，也可以是内部函数`internal`，当构造函数为`internal`时，表示此合约不可以部署，仅仅作为一个[抽象合约](../solidity-adv/abstract.md)。

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



## 常量

在合约里可以定义常量，使用 `constant` 来声明一个常量，常量不占用合约的存库空间，而是在编译时使用对应的表达式值替换常量名。

```solidity
pragma solidity >=0.8.0;

contract C {
    uint constant x = 32**22 + 8;
    string constant text = "abc";
}
```

使用constant修饰的状态变量，只能使用在编译时有确定值的表达式来给变量赋值。任何通过访问存储数据、区块链数据（如now、address(this).balance或者block.number）或执行数据（msg.value或gasleft()）或对外部合约的调用来给它们赋值都是不允许的（因为它们的值无法在编译期确定）。不过对于内建函数，如keccak256、sha256、ripemd160、ecrecover、addmod和mulmod，是允许的（尽管它们调用的是外部预编译合约），下面这句代码就是合法的：

```
bytes32 constant myHash = keccak256("abc");
```

constant目前仅支持修饰strings及值类型。



## 不可变量

不可变量的性质和常量很类似，同样在变量赋值之后，就无法修改。不可变量在构造函数中进行赋值，构造函数是在部署的时候执行，因此这是运行时赋值。



Solidity 中使用 `immutable` 来定义一个不可变量，`immutable`不可变量同样不会占用状态变量存储空间，在部署时，变量的值会被追加的运行时字节码中，因此它比使用状态变量便宜的多，同样带来了更多的安全性（确保了这个值无法再修改）。

这个特性在很多时候非常有用，最常见的如ERC20代币用来指示小数位置的decimals变量，它应该是一个不能修改的变量，很多时候我们需要在创建合约的时候指定它的值，这时immutable就大有用武之地，类似的还有保存创建者地址、关联合约地址等。 

 

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



## 视图函数

视图函数表示这个函数不会修改状态， 将函数声明为 `view` 就是一个视图函数。

```solidity
pragma solidity >=0.8.0;
contract C {
    // highlight-next-line
    function cal(uint a, uint b) public view returns (uint) {
        return a * (b + 42) + now;
    }
    
    function set(uint a, uint b) public returns (uint) {
			return cal(a, b);
    }
}
```

当我们调用一个普通的合约函数（会修改区块链状态）， 这笔交易需要全网节点共识之后才会真正确认，状态修改才会生效。

而调用视图函数时，只需要当前链接的节点执行，就可返回结果。



:::note

有一个点要注意，平时我们（从外部）调用视图函数是不需要支付手续费。当视图函数本身依赖是会消耗 gas 的，我们可以理解为外部调用时Gas价格为0。

如果视图函数是在一个普通函数中调用，那么这个视图函数是会消耗 GAS 的。 例如上面代码的`set`函数调用的 gas 就包含`cal`函数的 gas。

:::



如果在声明为`view`的函数中修改了状态，则编译器会报错误，除直接修改状态变量外，其他如：触发事件，发送代币等都会视为修改状态。详细可参考[Solidity文档](https://learnblockchain.cn/docs/solidity/contracts.html#state-mutability)。

 

## 纯函数

纯函数表示函数不读取也不修改状态， 函数声明为pure 表示函数是纯函数，纯函数仅做计算， 例如：

```solidity
pragma solidity >=0.5.0 <0.7.0;

contract C {
    function f(uint a, uint b) public pure returns (uint) {
        return a * (b + 42);
    }
}
```





## 额外知识点1：如何区分合约地址及外部账号地址

我们经常需要区分一个地址是合约地址还是外部账号地址，区分的关键是看这个地址有没有与之相关联的代码。EVM提供了一个操作码EXTCODESIZE，用来获取地址相关联的代码大小（长度），如果是外部账号地址，则没有代码返回。因此我们可以使用以下方法判断合约地址及外部账号地址。

```
function isContract(address addr) internal view returns (bool) {
  uint256 size;
  assembly { size := extcodesize(addr) }
  return size > 0;
  }
```

如果是在合约外部判断，则可以使用`web3.eth.getCode()`（一个Web3的API），或者是对应的JSON-RPC方法——eth_getcode。getCode()用来获取参数地址所对应合约的代码，如果参数是一个外部账号地址，则返回“0x”；如果参数是合约，则返回对应的字节码，下面两行代码分别对应无代码和有代码的输出。

```
>web3.eth.getCode(“0xa5Acc472597C1e1651270da9081Cc5a0b38258E3”) 
“0x”
>web3.eth.getCode(“0xd5677cf67b5aa051bb40496e68ad359eb97cfbf8”) “0x600160008035811a818181146012578301005b601b6001356025565b8060005260206000f25b600060078202905091905056” 
```

这时候，通过对比getCode()的输出内容，就可以很容易判断出是哪一种地址。





## 额外知识点2: 合约类型元数据成员



Solidity 从 0.6 版本开始，Solidity 增加了一些属性来获取合约类型类似的元信息。

如：对于合约C，可以通过type(C)来获得合约的类型信息，这些信息包含以下内容：

（1）`type(C).name` ：获得合约的名字。

（2）`type(C).creationCode`：获得创建合约的字节码。

（3）`type(C).runtimeCode`：获得合约运行时的字节码。

 

字节码是什么东西？ 先留一个坑， 以后有机会介绍 EVM 时，在详细介绍。



## 小结

提炼本节的重点：合约和类（`class`）很类似， 我们可以在合约里定义多个变量、常量及函数，可以给函数确定可见性。

我们定义的合约是一个自定义的类型，由于合约账号在链上也使用地址表示，因此合约类型可以和地址类型相互转换。



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。