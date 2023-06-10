

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



## 合约类型元数据成员



Solidity 从 0.6 版本开始，Solidity 增加了一些属性来获取合约类型类似的元信息。

如：对于合约C，可以通过type(C)来获得合约的类型信息，这些信息包含以下内容：

（1）`type(C).name` ：获得合约的名字。

（2）`type(C).creationCode`：获得创建合约的字节码。

（3）`type(C).runtimeCode`：获得合约运行时的字节码。

 

字节码是什么东西？ 先留一个坑， 以后有机会介绍 EVM 时，在详细介绍。



## 定义合约的变量和函数

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



## 额外知识点：如何区分合约地址及外部账号地址

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