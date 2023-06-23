

# 合约类型

每一个合约，合约本身也是一个数据类型， 称为合约类型，如下代码定义了一个`Hello`合约类型:

```solidity
pragma solidity ^0.8.0;

contract Hello {
  function sayHi() public view returns  (uint) {
	  return 10;
  }
}
```



## 使用合约类型

我们要如何使用合约类型呢，我们可以通过合约类型创建出一个合约事例（即部署一个合约）。

这里是一个例子：

```solidity
pragma solidity ^0.8.0;

contract Hello {
  function sayHi() public view returns  (uint) {
	  return 10;
  }
}

contract HelloCreator {
	uint public x;
	Hello public h;

	function createHello() public returns (address) {
    // highlight-next-line
		h = new Hello();
		return address(h);
  }
}
```

上面的代码，调用 `HelloCreator` 合约的 `createHello` 函数可以创建一个合约。

我们在 Remix 演练一下，先部署`HelloCreator` 合约（注意不是部署Hello）:

![image-20230623163833081](https://img.learnblockchain.cn/pics/20230623163834.png)

然后调用`createHello` 在链上创建一个`Hello`合约：

![image-20230623164119207](https://img.learnblockchain.cn/pics/20230623164120.png)

右下角的日志中，可以看到创建的合约地址`0x93Ff8fe9BF4005...`。让我们在Remix 加载该合约，并调用 `sayHi` 来验证该合约确实部署成功了。

在 Remix 使用 `Hello`的地址加载`Hello`， 选择`Hello`合约， 在At Address 处填入合约地址，如图：



![image-20230623164622328](https://img.learnblockchain.cn/pics/20230623164624.png)



然后调用`sayHi()` : 

![](https://img.learnblockchain.cn/pics/20230623164825.png)





`callsayHi` 函数中，声明一个合约类型的变量（`Hello c`）并**创建一个合约**对变量`c`初始化 （`new Hello()`），然后用`c.sayHi() `调用函数。

So easy... 对吧~  




```solidity
function callHi() public returns (uint) {

	// highlight-start

	x = h.sayHi();
  // highlight-end
	return x;
}
```

## 合约类型元数据成员



Solidity 从 0.6 版本开始，Solidity 增加了一些属性来获取合约类型类似的元信息。

如：对于合约C，可以通过type(C)来获得合约的类型信息，这些信息包含以下内容：

（1）`type(C).name` ：获得合约的名字。

（2）`type(C).creationCode`：获得创建合约的字节码。

（3）`type(C).runtimeCode`：获得合约运行时的字节码。

 

字节码是什么东西？ 先留一个坑， 以后有机会介绍 EVM 时，在详细介绍。





## 额外知识点1：如何区分合约及外部地址

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





## 额外知识点2: 



## 小结

提炼本节的重点：合约和类（`class`）很类似， 我们可以在合约里定义多个变量、常量及函数，可以给函数确定可见性。

我们定义的合约是一个自定义的类型，由于合约账号在链上也使用地址表示，因此合约类型可以和地址类型相互转换。



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。