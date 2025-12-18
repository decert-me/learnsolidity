# 事件（Event）

这一节我们将介绍事件的使用，为什么需要事件，如何定义与触发事件，并且介绍了3个方法获取事件。在最后一个部分，我还结合自己的实践经验，介绍如何善用事件。



##  为什么需要事件

事件是以太坊上一个比较特殊的机制，以太坊虚拟机是一个封闭的沙盒环境，我们在EVM内部通过调用外部世界的接口，把信息转递给外部或从外部获得信息，因为以太坊没法对外部的信息达成共识。想象一下，你有一个智能合约，向一个网络API发出API请求，以获得一对资产的最新价格。当节点A处理一个触发这个API调用的交易时，得到响应`42`，并相应地更新合约状态。然后当节点B处理同样的交易时，价格发生了变化，响应是`40`，并相应地合约状态。然后节点C发出请求时，收到一个`404`的HTTP响应。当网络中的每个节点都可能对最新状态有不同的看法时，以太坊世界计算机就无法对最新状态达成共识。

那如何解决以太坊和外部世界的通信问题呢，答案是通过事件，在合约触发事件，将在链上生成**日志**，链下通过监听日志，获取沙盒环境内状态的变化。




![Solidity 事件](https://img.learnblockchain.cn/pics/20230715100542.png!decert.logo.water)






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

 JSON-RPC  提供[eth_gettransactionreceipt](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactionreceipt)  获取交易收集，也可以直接使用 JSON-RPC的包装库如 [Web3.js](https://learnblockchain.cn/docs/web3.js/) 、 [ethers.js](https://learnblockchain.cn/ethers_v5/)  等库，Remix 已经嵌入了 [Web3.js](https://learnblockchain.cn/docs/web3.js/) 和 [ethers.js](https://learnblockchain.cn/ethers_v5/) 库， 因此可以直接在[Remix 控制台](https://learnblockchain.cn/article/22528)通过输入 `web3.eth.getTransactionReceipt(hash)` 获取收据，如下图：

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

getLogs 的参数就是要制定的过滤条件，可以按需设置如：获取某个区块高度区间里某合约地址的所有事件，获取任意合约来自某个主题事件等。





### 使用过滤器获取实时事件

如果实时获取当前发生的事件，可以使用  JSON-RPC  提供的 [eth_subscribe](https://docs.infura.io/networks/ethereum/json-rpc-methods/subscription-methods/eth_subscribe) 订阅方法，Web3.js 对应的接口 [web3.eth.subscribe](https://learnblockchain.cn/docs/web3.js/web3-eth-subscribe.html?highlight=subscribe%20logs#web3-eth-subscribe)， Ethers.js 在 Provider 使用 [`on`  进行监听](https://learnblockchain.cn/ethers_v5/api/providers/provider/)。需要注意的是， 要订阅需要和节点建立**Web Socket 长连接**。

Web3.js 示例：

```javascript
const web3 = new Web3("ws://localhost:8545");  

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
let provider = new ethers.providers.WebSocketProvider('ws://127.0.0.1:8545/')

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



 JSON-RPC 的包装库也提供更高层的方法来监听事件，使用 Web3.js ，可以用合约 abi 创建合约兑现来监听 Deposit 事件方法如下：

```javascript
var abi = /* 编译器生成的abi */;
var addr = "0x1234...ab67"; /* 合约地址 */
var contractInstance = new web3.eth.contract(abi, addr);


// 通过传一个回调函数来监听 Deposit
contractInstance.event.Deposit(function(error, result){
    // result会包含除参数之外的一些其他信息
    if (!error)
        console.log(result);
});

```

若要过滤 indexed 字段建立索引，给事件提供一个额外的过滤参数即可：

```javascript
contractInstance.events.Deposit({
    filter: {_from: ["0x.....", "0x..."]}, // 过滤某些地址
    fromBlock: 0
}, function(error, event){
    console.log(event);
})
```



## 善用事件

我写过不少合约，但其实是在真正完整的开发面向用户的产品之后，才逐步理解事件。除了前面介绍的把链上状态变化通知到外界，以下两个场景我们也应该尽量优先考虑使用事件。

1. **如果合约中没有使用该变量，应该考虑用事件存储数据**
2. **如果需要完整的交易历史，请使用事件**



### 用事件存储数据

有不少刚转入Web3 的工程师，把智能合约当成数据库使用，习惯把需要用到的数据都保存在智能合约中，但最佳的实践是：**如无必要，勿加存储。**

倘若在合约中，**没有任何函数读取该变量，我们应该使用事件来存储数据**，Gas 成本降低很多。

使用事件版本的`deposit()` 的Gas 消耗是 22750 。

```solidity
    // gas: 22750
    function deposit(uint value) public {
        emit Deposit(msg.sender, value);  // 触发事件
    }
```



对比看一下用映射来存储数据的版本：

```solidity
contract testDeposit {

    mapping(address => uint) public deposits;
    
    // Gas: 43577
    function deposit(uint value) public {
        deposits[msg.sender] = value;
    }
}
```

`deposit()` 的Gas 消耗是 43577 。

![mapping 与事件](https://img.learnblockchain.cn/pics/20230716183802.png!decert.logo.water)

可以看出两个版本的差别非常大。

如果仅需要在外部展示存款数据（合约中不需要读取数据），使用事件的版本和使用映射的版本可以达到相同的效果，只是前者是通过解析事件获取存款数据，后者是读取变量获取数据。



### 事件是“只写的数据库“

每次我们在触发事件时，这个事件的日志就会记录在区块链上，每次事件追加一条记录，因此事件实际上就是一个只写的数据库（只添加数据）。我们可以按照自己想要的方式在关系型数据库中重建所有的记录。

当然要实现这一点，**所有的状态变化必须触发事件**才行。



而存储状态则不同，状态变量是一个可修改的”数据库“， 读取变量获取的是当前值。

**如果需要完整的交易历史，就需要使用事件**。



## 小结

事件是外部事件获取EVM内部状态变化的一个手段。在合约内触发事件后，在外部就可以获取或监听到该事件。

使用 `event` 关键字定义事件，使用 `emit` 来触发定义的事件。在外部有三种可以获取到合约内部的事件：

1. 通过交易收据获取事件
2. 使用过滤器获取过去事件
3. 使用过滤器获取实时事件



事件是很便宜的存储数据的方式，没有任何函数读取该数据，应该使用选择事件来存储，如何需要交易历史（通常是刚需），也需要使用事件把每一次状态变化记录下来。



------
来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。
前往挑战 [Solidity 101：事件](https://decert.me/quests/99f33f9d-8544-48bf-ad71-4ed92b78b675)，完成挑战并获得技能认证 NFT。

DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。

