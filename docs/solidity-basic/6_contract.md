

# 使用合约

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

另外，`public` 类型的状态变量，会自动创建一个同名的公共函数（称为访问器），来获取状态变量的值。



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

构造函数可以是公有函数`public`，也可以是内部函数`internal`，当构造函数为`internal`时，表示此合约不可以部署，仅仅作为一个[抽象合约](../solidity_adv/abstract.md)。

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

```
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



## **视图函数**

可以将函数声明为view，表示这个函数不会修改状态，这个函数在通过DAPP外部调用时可以获得函数的返回值（对于会修改状态的函数，我们仅仅可以获得交易的hash）。

以下代码定义了一个名为 f() 的视图函数：

```
pragma solidity  >=0.5.0 <0.7.0;
contract C {
    function f(uint a, uint b) public view returns (uint) {
        return a * (b + 42) + now;
    }
}
```

 

下面的操作被认为是修改状态，在声明为view的函数中使用以下语句时，编译器会报错误。

（1）修改状态变量。

（2）触发一个事件。

（3）创建其它合约。

（4）使用selfdestruct。

（5）通过调用发送以太币。

（6）调用任何没有标记为view或者pure的函数。

（7）使用低级调用。

（8）使用包含特定操作码的内联汇编。





## **纯函数**

函数可以声明为pure，表示函数不读取也不修改状态。除了上一节列举的状态修改语句之外，以下操作被认为是读取状态。

（1）读取状态变量。

（2）访问`address(this).balance`或者`.balance`。 

（3）访问block、tx、msg中任意成员（除msg.sig和msg.data之外）。 

（4）调用任何未标记为pure的函数。

（5）使用包含某些操作码的内联汇编。

示例代码：

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