# ABI 应用二进制接口

## 什么是ABI

大家应该很熟悉 API（Application Programming Interfaces），API 是一个接口，用它来访问某个服务，可以把API 理解两个软件彼此之间进行通信的桥梁。

**ABI** （Application Binary Interfaces），则是用来定义了智能合约中可以进行交互的方法、事件和错误，类似可以把 ABI 理解为与EVM 进行交互的桥梁。

EVM 是以太坊虚拟机，和其他的机器一样，他们无法执行人类可读代码的， 只能够识别和运行二进制数据，这是一串由 0 和 1 所组成的数据流。因此在调用函数时，需要借助 ABI ，把人类可读函数转化为EVM可读的字节码。



![Solidity - ABI - EVM 字节码](https://img.learnblockchain.cn/pics/20230803220935.png!decert.logo.water)

一句话总结：ABI 是 **编码和解码规范**，用来规范外部与 EVM 的交互，也可用于合约间的交互。



## ABI 接口描述

在 Solidity 中，我们编译代码以后，会得到两个重要东西（称为`artifact`）：bytecode（字节码） 和 ABI 接口描述。

> 参考 Remix IDE 一文，合约的[编译与部署](https://decert.me/tutorial/solidity/tools/remix#%E5%90%88%E7%BA%A6%E7%BC%96%E8%AF%91)。

ABI 接口描述是 JSON 格式的文件，定义了智能合约中外部可以进行交互的**方法**、**事件**和可解释的**错误**。

例如，下面的 Counter ：

```solidity
contract Counter {
  uint public counter;
  address private owner;

  error NotOwner();
  event Set(uint _value);  // 定义事件

  constructor() {
    owner = msg.sender;
  }

  function set(uint x) public {
      if(owner != msg.sender)  revert NotOwner();
      counter = x;
      emit Set(x);

  }
}
```



编译之后生成的 ABI 为：

```json
[
	{
		"inputs": [],
		"name": "NotOwner",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_value",
				"type": "uint256"
			}
		],
		"name": "Set",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "counter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "x",
				"type": "uint256"
			}
		],
		"name": "set",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
```

这是一个 JSON 格式的数组，每个对象定义了合约方法中可公开调用的方法（函数）， 合约声明的事件及错误等。

以 `set` 函数为例：

```json
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "x",
				"type": "uint256"
			}
		],
		"name": "set",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
```

可以里面定义了`type `:  定义是函数、事件或错误等，`name` ：表示函数名称、事件名称、自定义错误名称， `inputs`: 函数输入参数，`outputs` ： 函数输出参数， 

ABI JSON 的详细的规范可参考 [Solidity 文档](https://learnblockchain.cn/docs/solidity/abi-spec.html#json)，这里不重复。



当我们要调用一个函数时，使用 ABI JSON 的规范的要求，进行编码，传给 EVM， 同时在 EVM 层生成的字节数据（如时间日志等），ABI JSON 的规范进行解码。

![EVM - ABI 编码规范](https://img.learnblockchain.cn/pics/20230825121313.png!decert.logo.water)





## ABI 编码

我们以调用 `set()` 函数为例，看看 ABI 是如何进行的，合约部署在 sepolia 网络，调用 `set(10)`:



![remix - call](https://img.learnblockchain.cn/pics/20230825150223.png!decert.logo.water)

 区块链浏览器[交易记录](https://sepolia.etherscan.io/tx/0x644cf28068b2e0f144e36f5f65a42897a1904ebe99b958c692fc0b97546c1197)如下：

![input -data](https://img.learnblockchain.cn/pics/20230825164320.png!decert.logo.water)



调用 `set()`函数，经过 ABI 编码后，提交到链上的数据是： `0x60fe47b1000000000000000000000000000000000000000000000000000000000000000a`

![调用合约底层表现](https://img.learnblockchain.cn/pics/20230828221231.png!/scale/50)





该编码数据是如何生成的呢？

它包含两个部分：

1. 函数选择器(4字节)
2. 参数编码



`0x60fe47b1` 是函数选择器， 它是ABI 描述中函数的签名：`set(uint256)` 进行 keccak256 哈希运算之后，取前4个字节：

```
  bytes4(keccak256("set(uint256)")) == 0x60fe47b1
```



参数部分 10 的十六进制是 `a`， 然后扩展到 32个字节， 参数编码细节可以参考文档 [应用二进制接口说明](https://learnblockchain.cn/docs/solidity/abi-spec.html#abi) 。 

大部分时候，我们不需要了解详细的编码规则，Solidity / web3.js / ethers.js 库都提供了编码函数，例如在 Solidity 中，可通过以下代码获得完整的编码：

```solidity
// 编码函数及参数 
abi.encodeWithSignature("set(uint256)", 10)

// 编码参数
uint a = 10;
abi.encode(a);   // 0x000000000000000000000000000000000000000000000000000000000000000a

```



## ABI 解码

解码是编码的”逆过程“， 区块链浏览器为何能把我们提交给链上的 `0x60fe47b1000000...0a` 显示为函数`set(uint256 x)`， 就是对数据进行了解码。



![input -data](https://img.learnblockchain.cn/pics/20230825164320.png!decert.logo.water)

准确来说，仅能对参数进行解码，函数选择器的计算过程中， 使用了 keccak256 哈希运算，哈希是不可逆的。

但当我们开源合约代码之后， 区块链浏览器可以计算出所有函数的函数选择器，从而可以通过函数选择器匹配对应的函数签名。



ABI 解码一个重要的使用场景是，解析交易中的[事件日志](../solidity-basic/14_event.md)。

在刚才的[交易](https://sepolia.etherscan.io/tx/0x644cf28068b2e0f144e36f5f65a42897a1904ebe99b958c692fc0b97546c1197#eventlog)中，链上记录了如下日志：

![solidity logs 日志](https://img.learnblockchain.cn/pics/20230825185945.png!decert.logo.water)

日志的包含Topics 和 Data 两部分，我们该如何获知其表示的含义呢？

其实，Topics 的第一个主题是事件签名的 Keccak256 哈希，在上面 ABI JOSN 描述中，包含 `Set` 事件的描述，对应的事件签名是 `Set(uint256)`, Keccak256 哈希结果是主题值。

![solidity 日志主题](https://img.learnblockchain.cn/pics/20230825191226.png!decert.logo.water)

通过匹配，我们就可以知道 EVM 产生的该条日志是由 `Set(uint256)`  事件生成， 从而根据事件的参数列表解析日志数据。Solidity / web3.js / ethers.js 库都提供了解码函数， 例如：

```solidity
// solidity decode
(x) = abi.decode(data, (uint));

// ethers.js
const SetEvent = new ethers.utils.Interface(["event Set(uint256 value)"]);
let decodedData = SetEvent.parseLog(event);
```



## ABI 编解码可视化工具

ChainToolDAO 开发了几个可视化工具，帮助我们来编解码。

1. 函数选择器的查询及反查 ：https://chaintool.tech/querySelector
2. 事件签名的 Topic 查询：https://chaintool.tech/topicID
3. Hash 工具提供Keccak-256 及 Base64：https://chaintool.tech/hashTool 
4. 交易数据（calldata）的编码与解码： https://chaintool.tech/calldata

![EVM- 交易数据（calldata）的编码与解码](https://img.learnblockchain.cn/pics/20230825205705.png!decert.logo.water)



## 小结 

本文，我们学习了 ABI 的概念，ABI 是一个编解码的规范，是人类可读信息与以太坊虚拟机执行二进制数据的桥梁。

在理解 ABI 之上，分别介绍了 ABI 接口描述，ABI 编码与ABI 解码。



------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。

