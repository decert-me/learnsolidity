# ABI 应用二进制接口

## 什么是ABI

大家应该很熟悉 API（Application Programming Interfaces），API 是一个接口，用它来访问某个服务，可以把API 理解两个软件彼此之间进行通信的桥梁。

**ABI** （Application Binary Interfaces），则是用来定义了智能合约中可以进行交互的方法、事件和错误，类似可以把 ABI 理解为与EVM 进行交互的桥梁。

EVM 是以太坊虚拟机，和其他的机器一样，他们无法执行人类可读代码的， 只能够识别和运行二进制数据，这是一串由 0 和 1 所组成的数据流。因此在调用函数时，需要借助 ABI ，把人类可读函数转化为EVM可读的字节码。



![Solidity - ABI - EVM 字节码](https://img.learnblockchain.cn/pics/20230803220935.png!decert.logo.water)

一句话总结：ABI 是 **编码和解码规范**，用来规范外部与 EVM 的交互，也可用于合约间的交互。



## ABI 接口描述

在 Solidity 中，我们编译代码以后，会得到两个重要东西：bytecode（字节码） 和 ABI 接口描述。

> 参考 Remix IDE 一文，[合约编译](https://learnblockchain.cn/article/22528#%E5%90%88%E7%BA%A6%E7%BC%96%E8%AF%91)。

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





## 函数选择器详解

在深入了解 ABI 编码之前，我们需要先理解函数选择器（Function Selector）的概念。

### 什么是函数选择器

**函数选择器**是函数的唯一标识符，它是函数签名的 `keccak256` 哈希的前 4 个字节。每个公开的函数都有一个唯一的选择器。

```solidity
pragma solidity ^0.8.0;

contract FunctionSelector {
    // 函数签名格式：functionName(paramType1,paramType2,...)
    // 注意：不包含参数名，不包含空格，不包含返回值类型

    function transfer(address to, uint256 amount) public returns (bool) {
        // transfer 的选择器是 0xa9059cbb
        // 计算方式：bytes4(keccak256("transfer(address,uint256)"))
        return true;
    }
}
```

### 计算函数选择器

有两种方式可以获取函数选择器：

**方法1：手动计算**

```solidity
pragma solidity ^0.8.0;

contract SelectorExample {
    // 手动计算函数选择器
    function getTransferSelector() public pure returns (bytes4) {
        return bytes4(keccak256("transfer(address,uint256)"));
        // 返回: 0xa9059cbb
    }

    function getSetSelector() public pure returns (bytes4) {
        return bytes4(keccak256("set(uint256)"));
        // 返回: 0x60fe47b1
    }
}
```

**方法2：使用 `.selector` 属性**

Solidity 提供了更简洁的方式来获取函数选择器：

```solidity
pragma solidity ^0.8.0;

contract SelectorProperty {
    function transfer(address to, uint256 amount) public returns (bool) {
        return true;
    }

    function getSelector() public pure returns (bytes4) {
        // 使用 .selector 属性直接获取
        return this.transfer.selector;
        // 返回: 0xa9059cbb
    }
}
```

### 使用选择器进行底层调用

函数选择器在底层调用时非常有用，特别是配合 `call` 使用：

```solidity
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract LowLevelCall {
    // 方法1：使用 encodeWithSignature
    function callTransfer1(address token, address to, uint256 amount) public {
        bytes memory data = abi.encodeWithSignature(
            "transfer(address,uint256)",
            to,
            amount
        );

        (bool success, ) = token.call(data);
        require(success, "Transfer failed");
    }

    // 方法2：使用 encodeWithSelector
    function callTransfer2(address token, address to, uint256 amount) public {
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("transfer(address,uint256)")),
            to,
            amount
        );

        (bool success, ) = token.call(data);
        require(success, "Transfer failed");
    }

    // 方法3：使用接口的 selector 属性
    function callTransfer3(address token, address to, uint256 amount) public {
        bytes memory data = abi.encodeWithSelector(
            IERC20.transfer.selector,
            to,
            amount
        );

        (bool success, ) = token.call(data);
        require(success, "Transfer failed");
    }
}
```

### 函数选择器的应用场景

函数选择器在以下场景中非常重要：

1. **底层调用时构造 calldata**
   - 使用 `call`、`delegatecall`、`staticcall` 时需要构造正确的调用数据
   - 函数选择器是 calldata 的前 4 个字节

2. **实现代理合约的函数路由**
   - 代理合约通过 `fallback` 函数捕获调用
   - 根据函数选择器将调用转发到实现合约

3. **跨合约调用的编码**
   - 动态调用其他合约的函数
   - 根据业务逻辑选择要调用的函数

4. **分析交易的函数调用**
   - 区块链浏览器通过函数选择器识别交易调用的函数
   - 可以查询和反查函数选择器

### 函数签名的注意事项

在计算函数选择器时，函数签名必须遵循严格的格式：

```solidity
✅ 正确的函数签名：
"transfer(address,uint256)"
"balanceOf(address)"
"approve(address,uint256)"

❌ 错误的函数签名：
"transfer(address to, uint256 amount)"  // 不能包含参数名
"transfer(address, uint256)"            // 不能有空格
"transfer(address,uint256) returns (bool)" // 不能包含返回值
```

**示例：常见函数选择器**

```solidity
// ERC20 标准函数选择器
transfer(address,uint256)        → 0xa9059cbb
approve(address,uint256)         → 0x095ea7b3
transferFrom(address,address,uint256) → 0x23b872dd
balanceOf(address)               → 0x70a08231

// ERC721 标准函数选择器
safeTransferFrom(address,address,uint256) → 0x42842e0e
ownerOf(uint256)                 → 0x6352211e
```

## ABI 编码

我们以调用 `set()` 函数为例，看看 ABI 是如何进行的，合约部署在 sepolia 网络，调用 `set(10)`:



![remix - call](https://img.learnblockchain.cn/pics/20230825150223.png!decert.logo.water)

 区块链浏览器[交易记录](https://sepolia.etherscan.io/tx/0x644cf28068b2e0f144e36f5f65a42897a1904ebe99b958c692fc0b97546c1197)如下：

![input -data](https://img.learnblockchain.cn/pics/20230825164320.png!decert.logo.water)



调用 `set()`函数，经过 ABI 编码后，提交到链上的数据是： `0x60fe47b1000000000000000000000000000000000000000000000000000000000000000a`

![调用合约底层表现](https://img.learnblockchain.cn/pics/20230828221231.png!/scale/50)





该编码数据是如何生成的呢？

它包含两个部分：

1. **函数选择器**(前 4 个字节)
2. **参数编码**

`0x60fe47b1` 是函数选择器， 它是 ABI 描述中函数的签名：`set(uint256)` 进行 keccak256 哈希运算之后，取前4个字节：

```solidity
  bytes4(keccak256("set(uint256)")) == 0x60fe47b1
```

> 关于函数选择器的详细说明，请参考前面的[函数选择器详解](#函数选择器详解)章节。



参数部分 10 的十六进制是 `a`， 然后扩展到 32个字节， 参数编码细节可以参考文档 [应用二进制接口说明](https://learnblockchain.cn/docs/solidity/abi-spec.html#abi) 。 

大部分时候，我们不需要了解详细的编码规则，Solidity / web3.js / ethers.js 库都提供了编码函数，例如在 Solidity 中，可通过以下代码获得完整的编码：

```solidity
// 编码函数及参数 
abi.encodeWithSignature("set(uint256)", 10)

// 编码参数
uint a = 10;
abi.encode(a);   // 0x000000000000000000000000000000000000000000000000000000000000000a

```









### Solidity 编码函数

Solidity 中有 5 个函数：`abi.encode`, `abi.encodePacked`, `abi.encodeWithSignature`, `abi.encodeWithSelector` 及`abi.encodeCall` 用于编码。

> 我们可以在 [Chisel](https://learnblockchain.cn/article/6408) 里演练这几个编码函数，Chisel 是Foundry 提供的 Solidity 交互式命令工具



###  abi.encode

`encode()` 方法按EVM标准规则对参数编码，编码时每个参数按32个字节填充`0` 再拼在一起，当[与合约交互](addr_call.md)时需要编码参数时，就使用该方法。

```solidity
// 单个参数
uint a = 10;
abi.encode(a);   // 0x000000000000000000000000000000000000000000000000000000000000000a

uint8 s = 2;   // 占一个字节
abi.encode(s);  // 0x0000000000000000000000000000000000000000000000000000000000000002

address addr = 0xe74c813e3f545122e88A72FB1dF94052F93B808f;
abi.encode(addr); // 0x000000000000000000000000e74c813e3f545122e88a72fb1df94052f93b808f

// 多个参数
abi.encode(addr, a);  // 0x000000000000000000000000e74c813e3f545122e88a72fb1df94052f93b808f000000000000000000000000000000000000000000000000000000000000000a

bool b = true;
abi.encode(addr, a, b);  // 0x000000000000000000000000e74c813e3f545122e88a72fb1df94052f93b808f000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001

```

若是动态类型的数据，编码会更加复杂：

```solidity
// 动态类型的数据
uint[] memory arr = new uint[](2);
arr[0] =  1;
arr[1] = 2;

abi.encode(addr, a, b, array) // 0x000000000000000000000000e74c813e3f545122e88a72fb1df94052f93b808f000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002
```

参数的编码规则，可查看[这里](https://learnblockchain.cn/docs/solidity/abi-spec.html#id3) 



### abi.encodePacked

`encodePacked` 称为紧密编码，和  `encode()` 方法不同，参数在编码拼接时不会填充`0`， 而是使用实际占用的空间然后把各参数拼在一起，如果编码结果不是32字节整数倍数时，再末尾依旧会填充`0`）。例如在使用[EIP712](https://learnblockchain.cn/2019/04/24/token-EIP712) 时，需要对一些数据编码，就需要使用到 `encodePacked` 。



```solidity
// 单个参数
uint a = 10;
abi.encodePacked(a);   // 0x000000000000000000000000000000000000000000000000000000000000000a

uint8 s = 2; // 占一个字节
abi.encodePacked(s);  // 0x0000000000000000000000000000000000000000000000000000000000000002

address addr = 0xe74c813e3f545122e88A72FB1dF94052F93B808f;
abi.encodePacked(addr);

bool b = true;
// 多个参数
abi.encodePacked(addr, s, b);  // 0xe74c813e3f545122e88a72fb1df94052f93b808f020100000000000000000000
```



### abi.encodeWithSignature

对函数签名及参数进行编码，第一个参数是函数签名，后面按EVM标准规则对参数进行编码，这样就可以直接获得 调用函数所需的 ABI 编码数据。

```solidity
abi.encodeWithSignature("set(uint256)", 10) // 0x60fe47b1000000000000000000000000000000000000000000000000000000000000000a

// 参考上方 addr, s, b 的定义
abi.encodeWithSignature("addUser(address,uint8,bool)", addr, s, b) // 0x63f67eb5000000000000000000000000e74c813e3f545122e88a72fb1df94052f93b808f00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001
```



### abi.encodeWithSelector

它与`abi.encodeWithSignature`功能类似，只不过第一个参数为4个字节的`函数选择器`。

> 关于如何计算和使用函数选择器，请参考[函数选择器详解](#函数选择器详解)章节。

例如：

```solidity
abi.encodeWithSelector(0x60fe47b1, 10);
// 等价于
abi.encodeWithSelector(bytes4(keccak256("set(uint256)")), 10); // 0x60fe47b1000000000000000000000000000000000000000000000000000000000000000a


abi.encodeWithSelector(0x63f67eb5, addr, s, b);
// 等价于
abi.encodeWithSelector(bytes4(keccak256(""addUser(address,uint8,bool)")), addr, s, b) // 0x63f67eb5000000000000000000000000e74c813e3f545122e88a72fb1df94052f93b808f00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001
```



### abi.encodeCall

`encodeCall` 可以通过函数指针，来对函数及参数编码，在执行编码时，执行完整的类型检查, 确保类型匹配函数签名。例如：

```solidity
interface IERC20 {
    function transfer(address recipient, uint amount) external returns (bool);
}

contract EncodeCall {
    function encodeCallData(address _to, uint _value) public pure returns (bytes memory) {
        return abi.encodeCall(IERC20.transfer, (_to, _value));
    }
}
```





## ABI 解码

解码是编码的”逆过程“， 区块链浏览器为何能把我们提交给链上的 `0x60fe47b1000000...0a` 显示为函数`set(uint256 x)`， 就是对数据进行了解码。



![input -data](https://img.learnblockchain.cn/pics/20230825164320.png!decert.logo.water)

准确来说，仅能对参数进行解码，函数选择器的计算过程中， 使用了 keccak256 哈希运算，哈希是不可逆的。

但当我们开源合约代码之后， 区块链浏览器可以计算出所有函数的函数选择器，从而可以通过函数选择器匹配对应的函数签名。



ABI 解码一个重要的使用场景是，解析交易中的[事件日志](https://learnblockchain.cn/article/22556)。

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

