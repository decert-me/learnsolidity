# ABI 应用二进制接口

## 什么是ABI

大家应该很熟悉 API（Application Programming Interfaces），API 是一个接口，用它来访问某个服务，可以把API 理解两个软件彼此之间进行通信的桥梁。

**ABI** （Application Binary Interfaces），则是用来定义了智能合约中可以进行交互的方法、事件和错误，类似可以把 ABI 理解为与EVM 进行交互的桥梁。

EVM 是以太坊虚拟机，和其他的机器一样，他们无法执行人类可读代码的， 只能够识别和运行二进制数据，这是一串由 0 和 1 所组成的数据流。因此在调用函数时，需要借助 ABI ，把人类可读函数转化为EVM可读的字节码。



![Solidity - ABI - EVM 字节码](https://img.learnblockchain.cn/pics/20230803220935.png!decert.logo.water)





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
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
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







## ABI 编码



浏览器调用



## ABI 解码





## ABI 可视化工具



