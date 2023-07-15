# 事件（Event）

##  为什么需要事件

事件是以太坊上一个比较特殊的机制，以太坊虚拟机是一个封闭的沙盒环境，我们在EVM内部通过调用外部世界的接口，把信息转递给外部或从外部获得信息，因为以太坊没法对外部的信息达成共识。想象一下，你有一个智能合约，向一个网络API发出API请求，以获得一对资产的最新价格。当节点A处理一个触发这个API调用的交易时，得到响应`42`，并相应地更新合约状态。然后当节点B处理同样的交易时，价格发生了变化，响应是`40`，并相应地合约状态。然后节点C发出请求时，收到一个`404`的HTTP响应。当网络中的每个节点都可能对最新状态有不同的看法时，以太坊世界计算机就无法对最新状态达成共识。

那如何解决以太坊和外部世界的通信问题呢，答案是通过事件，在合约触发事件，将在链上生成**日志**，链下通过监听日志，获取沙盒环境内状态的变化。





<img src="https://img.learnblockchain.cn/pics/20230715100542.png!decert.logo.water" alt="Solidity 事件" style="zoom:40%;" />





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



在 Remix 中调用 `deposit` 试试，直观感受一下生成的日志。



![solidity-event](https://img.learnblockchain.cn/pics/20230715121442.png!decert.logo.water)



我们会在进阶篇：[深入事件日志](../solidity-adv/event_logs.md)详细介绍日志，这里我们只需要知道从日志中可以获取到

1. 事件来自哪一个合约
2. 获取到事件本身的信息及其相关参数信息。



我也把该合约部署到了 [以太坊测试网](https://sepolia.etherscan.io/tx/0x694f489b3b6ecb5cdbe9e718d5493cc5bb842ddf878fb0c70bdc7e3545c2a3e6#eventlog)上， 在 `deposit`  交易信息里，可以看到如下日志：

![合约事件-deposit](https://img.learnblockchain.cn/pics/20230715154529.png!decert.logo.water)

日志包含的内容有：

1. `address`  ：表示当前事件来自哪个合约。
2. ` topics`：事件的主题
3. `data`:  事件的参数数据（非索引的参数数据）。



### 事件索引 `indexed`

在定义事件时，我们可以给某些事件参数加上 `indexed`， 例如：

```solidity
    event Deposit(address indexed _from, uint _value);  // 定义事件
```

其效果类似于在 sql 给某个表中的字段加索引一样，可以帮助高效地检索该数据。

我把加了`indexed`的合约部署到测试网，我们对比一下 `indexed` 是如何影响事件的。

可以看到[日志](https://sepolia.etherscan.io/tx/0xf43b5dfb69b4fe027dc1ace70fef16367be4f19506ddaeb41826c1f46c09f2c7#eventlog)有两个Topics（主题） ：

![合约事件-deposit2](https://img.learnblockchain.cn/pics/20230715162904.png!decert.logo.water)

有索引的参数放在 `topics `下，没有索引的参数放在 `data `下，以太坊会为日志地址及主题创建Bloom过滤器，以便更快的对数据检索。







## 获取事件

上面我们知道如何生成一个事件，接下来我们看看从外部如何获取到事件信息，通常我们有三个方法：

1. 通过交易收据获取事件
2. 使用过滤器获取过去事件
3. 使用过滤器获取实时事件



### 通过交易收据获取事件

在交易收据中，会记录交易完整的日志，如果我们知道交易的Hash，就可以通过交易收据获取事件。

 JSON-RPC  提供[eth_gettransactionreceipt](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactionreceipt)  获取交易收集，也可以直接使用 JSON-RPC的包装库如 [Web3.js](https://learnblockchain.cn/docs/web3.js/) 、 [ethers.js](https://learnblockchain.cn/ethers_v5/)  等库，Remix 已经嵌入了 [Web3.js](https://learnblockchain.cn/docs/web3.js/) 和 [ethers.js](https://learnblockchain.cn/ethers_v5/) 库， 因此可以直接在[Remix 控制台](../tools/2_remix.md)通过输入 `web3.eth.getTransactionReceipt(hash)` 获取收据，如下图：

![image-20230715122126495](https://img.learnblockchain.cn/pics/20230715122129.png!decert.logo.water)

获取到的收据信息如下：

```json
{
    "transactionHash":"0x5bc2d1fe7d696191ab70bc14a65e90b3c5fc4156c4a1bee979d0d4c5a0a5bc36",
    "transactionIndex":0,
    "blockHash":"0x52fc5f1b701d844cc7befcddbdb6615c6dee2b37c7c3fa480bf20aef73de4213",
    "blockNumber":2,
    "gasUsed":22750,
    "cumulativeGasUsed":22750,
    "logs":[
        {
            "logIndex":1,
            "blockNumber":2,
            "blockHash":"0x52fc5f1b701d844cc7befcddbdb6615c6dee2b37c7c3fa480bf20aef73de4213",
            "transactionHash":"0x5bc2d1fe7d696191ab70bc14a65e90b3c5fc4156c4a1bee979d0d4c5a0a5bc36",
            "transactionIndex":0,
            "address":"0xd9145CCE52D386f254917e481eB44e9943F39138",
            "data":"0x0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc400000000000000000000000000000000000000000000000000000000000003e8",
            "topics":[
                "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c"
            ],
            "id":"log_456a547b"
        }
    ],
    "status":true,
    "to":"0xd9145CCE52D386f254917e481eB44e9943F39138"
}
```

事件触发的日志，保存记录在 logs 字段下：

```js
[
        {
            "logIndex":1,
            "blockNumber":2,
            "blockHash":"0x52fc5f1b701d844cc7befcddbdb6615c6dee2b37c7c3fa480bf20aef73de4213",
            "transactionHash":"0x5bc2d1fe7d696191ab70bc14a65e90b3c5fc4156c4a1bee979d0d4c5a0a5bc36",
            "transactionIndex":0,
            "address":"0xd9145CCE52D386f254917e481eB44e9943F39138",
            "data":"0x0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc400000000000000000000000000000000000000000000000000000000000003e8",
            "topics":[
                "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c"
            ],
            "id":"log_456a547b"
        }
    ]
```

Logs 是一个数组，当函数触发多个事件时，Logs 就会有多条记录，每一个事件记录包含 `address` ,` topics`, `data` 和前面浏览器中看到信息是对应的。



### 使用过滤器获取事件

很多时候，我们其实并不知道交易的Hash， JSON-RPC  提供了 [eth_getLogs](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs) 来根据条件获取**过去**发生的事件。

Web3.js 对应的接口为 [getpastlogs](https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#getpastlogs)， Ethers.js 对应的接口为 [getLogs](https://learnblockchain.cn/ethers_v5/api/providers/provider/#Provider--log-methods)



```json
web3.eth.getPastLogs({
    address: "0xd9145CCE52D386f254917e481eB44e9943F39138",
    topics: ["0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c"]
})
.then(console.log);
```

 获取到的日志数据和收据中Logs 字段下的数据一致。



### 使用过滤器获取实时事件

如果实时获取当前发生的事件，可以使用  JSON-RPC  提供的 [eth_subscribe](https://docs.infura.io/networks/ethereum/json-rpc-methods/subscription-methods/eth_subscribe) 订阅方法，Web3.js 对应的接口 [web3.eth.subscribe](https://learnblockchain.cn/docs/web3.js/web3-eth-subscribe.html?highlight=subscribe%20logs#web3-eth-subscribe)， Ethers.js 在 Provider 使用 [`on`  进行监听](https://learnblockchain.cn/ethers_v5/api/providers/provider/)。需要注意的是， 要订阅需要和节点建立**Web Socket 长连接**。

Web3.js 示例：

```javascript
const web3 = new Web3("ws://localhost:7545");

var subscription = web3.eth.subscribe('logs', {
    address: '0x123456..',
    topics: ['0x12345...']
}, function(error, result){
    if (!error)
        console.log(result);
});
```



Ethers.js 示例：

```javascript
filter = {
    address: "0x123456",
    topics: [
        '0x12345...' // utils.id("Deposit(address,uint256)")
    ]
}
provider.on(filter, (log, event) => {
    //  
})
```





https://web3js.readthedocs.io/en/v1.10.0/web3-eth-contract.html

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
