# 事件（Event）

##  为什么需要事件

事件是以太坊上一个比较特殊的机制，以太坊虚拟机是一个封闭的沙盒环境，我们在EVM内部通过调用外部世界的接口，把信息转递给外部或从外部获得信息，因为以太坊没法对外部的信息达成共识。想象一下，你有一个智能合约，向一个网络API发出API请求，以获得一对资产的最新价格。当节点A处理一个触发这个API调用的交易时，得到响应`42`，并相应地更新合约状态。然后当节点B处理同样的交易时，价格发生了变化，响应是`40`，并相应地合约状态。然后节点C发出请求时，收到一个`404`的HTTP响应。当网络中的每个节点都可能对最新状态有不同的看法时，以太坊世界计算机就无法对最新状态达成共识。

那如何解决以太坊和外部世界的通信问题呢，答案是通过事件，在合约触发事件，将在链上生成**日志**，链下通过监听日志，获取沙盒环境内状态的变化。

因此事件（Event）是合约与外部一个很重要的接口。

## 使用事件

事件是通过关键字`event`来声明的，`event` 不需要实现，只需要定义其事件名和参数。

我们也可以认为事件是一个用来被监听的接口（接口同样也不需要实现）。

通过 `emit` 关键字可以触发事件，此时会在链上生成一个日志条目。



以下定义了一个`Deposit` 事件并在 deposit 函数中触发了该事件：

```solidity
pragma solidity >0.5.0;

contract testEvent {
    constructor() public {
    }
		
		// highlight-next-line
    event Deposit(address _from, uint _value);  // 定义事件

    function deposit(uint value) public {
    // do something
    
    		// highlight-next-line
        emit Deposit(msg.sender, value);  // 触发事件
    }
  }
}
```





如果使用 Web3.js ，则监听 Deposit 事件方法如下：

```
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

