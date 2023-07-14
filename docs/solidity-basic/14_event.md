# 事件（Event）

##  为什么需要事件

事件是以太坊上一个比较特殊的机制，以太坊虚拟机是一个封闭的沙盒环境，我们在EVM内部通过调用外部世界的接口，把信息转递给外部或从外部获得信息，因为以太坊没法对外部的信息达成共识。想象一下，你有一个智能合约，向一个网络API发出API请求，以获得一对资产的最新价格。当节点A处理一个触发这个API调用的交易时，得到响应`42`，并相应地更新合约状态。然后当节点B处理同样的交易时，价格发生了变化，响应是`40`，并相应地合约状态。然后节点C发出请求时，收到一个`404`的HTTP响应。当网络中的每个节点都可能对最新状态有不同的看法时，以太坊世界计算机就无法对最新状态达成共识。

那如何解决以太坊和外部世界的通信问题呢，答案是通过事件，在合约触发事件，将在链上生成**日志**，链下通过监听日志，获取沙盒环境内状态的变化。

因此事件（Event）是合约与外部一个很重要的接口。

## 使用事件

事件是通过关键字`event`来声明的，`event` 不需要实现，只需要定义其事件名和参数。

我们也可以认为事件是一个用来被监听的接口（接口同样也不需要实现）。

通过 `emit` 关键字可以触发事件，此时会在链上生成一个日志条目。



以下定义了一个`Deposit` 事件并在 `deposit()` 函数中触发了该事件：

```solidity
pragma solidity >0.8.0;

contract testEvent {
    constructor() public {
    }
		
		// highlight-next-line
    event Deposit(address _from, uint _value);  // 定义事件

    function deposit(uint value) public {
        // 忽略其他的代码
    		// highlight-next-line
        emit Deposit(msg.sender, value);  // 触发事件
    }
  }
}
```



在 Remix 中调用 `deposit` 试试，直观感受一下看看生成的日志是什么样子。

![image-20230714155352541](https://img.learnblockchain.cn/pics/20230714155353.png)

事件触发的日志(logs)包含的信息如下：

```js
[
	{
		"from": "0xf8e81D47203A594245E36C48e151709F0C19fBe8",
		"topic": "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
		"event": "Deposit",
		"args": {
			"0": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
			"1": "1000",
			"_from": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
			"_value": "1000"
		}
	}
]
```

Logs 是一个数组，当函数触发多个事件时，Logs 就会有多条记录，每一个条记录又包含：

1. `from`  ：表示当前事件来自哪个合约。
2. ` topic`：事件的主题，下面会有单独的[一节](#事件主题)来介绍。
3. `event`:  事件名 
4. `args`: 事件参数数据， 这里有两个参数， 分别对应着 `_from`, `_value` 。



## 事件主题

事件主题的作用是提供一种有效的方法，用来方便从区块中的所有交易中过滤出感兴趣的事件。

一个事件可以包含多个







如果使用 Web3.js ，则监听 Deposit 事件方法如下：

```javascript
var abi = /* 编译器生成的abi */;
var addr = "0x1234...ab67"; /* 合约地址 */
var CI = new web3.eth.contract(abi, addr);


// 通过传一个回调函数来监听 Deposit
CI.event.Deposit(function(error, result){
    // result会包含除参数之外的一些其他信息
    if (!error)
        console.log(result);
});

```



## 如何监听事件

如果在事件中使用indexed修饰，表示对这个字段建立索引，这样就可以进行额外的过滤。

示例代码：

```
event PersonCreated(uint indexed age, uint indexed height);

 // 通过参数触发
emit PersonCreated(26, 176);
```

要想过滤出所有26岁的人，方法如下：

```javascript
var createdEvent = myContract.PersonCreated({age: 26});
createdEvent.watch(function(err, result) {
        if (err) {
        console.log(err)
        return;
        }
        console.log("Found ", result);
})
```



## 更多事件



廉价的存储
