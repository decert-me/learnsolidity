# 使用地址类型

在前面的[开发工具 -  MetaMask 钱包](../tools/1_metamask) 一节中，我们创建了自己的钱包[账号](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)。

## 账户与地址

Solidity 合约程序里，使用**地址类型**来表示我们的账号，如下在合约中，获取了用户地址，保存在地址类型（address）中：

```solidity
contract testAddr { 
  address public user;
	function getUserAddress() public {
		user = msg.sender;
	}
}
```



地址类型有两种：

- `address`：保存一个20字节的值（以太坊地址的大小）。 

- `address payable`：表示可支付地址（可接受以太币的地址），在地址格式上，其实与`address` 完全相同，也是20字节。

  

:::note

那为什么要使用 `address`  和 `address payable` 两种类型呢？

如果不做区分，当我们把 ETH 转到一个地址上时，恰巧如果后者是一个合约地址（即[合约账户](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)）又没有处理ETH的逻辑，那么 ETH 将永远锁死在该合约地址上，任何人都无法提取和使用它。

因此，需要做此区分，显示的表达，一个地址可以接受ETH， 表示其有处理ETH的逻辑(EOA 账户本身可转账ETH)。

:::



`address`  和 `address payable` 两种类型尽管格式一样，但`address payable`拥有的两个成员函数`transfer`和`send` （`address`  没有这两个方法），`transfer`和`send`  的作用是向该地址转账，下文会进一步介绍。



在编写合约时，大部分时候，使用`address`就好，当需要向地址转账时，可以使用以下代码把`address` 转换为`address payable` ：

```
address payable ap = payable(addr);
```

:::note

上面的转换方法是在 Solidity 0.6 加入，如果使用的 Solidity 0.5 版本的编译器，则使用 `address payable ap = address(uint160(addr))；`

:::



若被转换的地址是一个是合约地址时，则合约需要实现了接收（`receive`）函数或`payable`回退函数（参考[合约如何接收 ETH](./receive.md)）。

如果转换的合约地址上没有接收或 payable 回退函数，可以使用这个魔法`payable(address(addr))` ， 即先转为普通地址类型，在转换为`address payable`类型 。



## 地址类型上支持哪些操作

## 地址比较

地址类型支持的类似整型的比较运算：`==`（两个地址相同）、`!=`（两个地址不相同）， 例如：

```solidity
    function _onlyOwner() internal view {
        // highlight-next-line
        require(owner() == msg.sender, "调用者不是 Owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        // highlight-next-line
        require(newOwner != address(0), "新的 Owner 不可以是 零地址");
	      /// ....
    }

```



地址类型还支持其他介个运算： <=、<、>= 以及 > 。



## 对地址转账及获取余额

地址类型还有一些成员函数属性及函数，因此在在表现上还类似面向对象语言的中的类（内置类）， 先介绍获取余额与转账：



`<address>.balance` 属性 :  返回地址的余额， 余额以wei为单位 (uint256)。

`<address payable>.transfer(uint256 amount)` :  用来向地址发送`amount`数量以太币(wei)，transfer 函数只使用固定的 2300 gas ,  发送失败时抛出异常。

`<address payable>.send(uint256 amount) returns (bool)`:  `send` 功能上和`transfer` 函数一样，同样使用固定的 2300 gas ,  但是在发送失败时不抛出异常，而是返回`false`。

:::note
你也许发现了 `addr.transfer(y)`与`require(addr.send(y))` 是等价的， 对的。

send是transfer的低级版本。如果执行失败，当前的合约不会因为异常而终止， 而在使用 send 的时候，如果不检查返回值，就会有额外风险， 编写智能合约风险真是无处不在呀。

:::





### 使用示例

```solidity
pragma solidity ^0.8.0;

contract testAddr {
   
   // 如果合约的余额大于等于10，而x小于10,则给x转10 wei
	function testTrasfer(address payable x) public {
	   address myAddress = address(this);
	   // highlight-start
	   if (x.balance < 10 && myAddress.balance >= 10) {
	       x.transfer(10);
	   }
	   // highlight-end
	}
}
```



上面代码的 `address myAddress = address(this);` 就是把合约转换为地址类型，然后用`.balance`获取余额， 再使用 `.transfer` 向 x 转账。 

>  在[账户](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)中，在 EVM 层面是，外部用户账户和合约账户是一样的，因此可以把合约转换为地址类型。



`send` 和`transfer` 函数只使用 2300 gas，在对合约地址转账时，会调用合约上的函数，很容易因 gas 不足而失败，一个推荐的转账方法是：

```solidity
function safeTransferETH(address to, uint256 value) internal {
    (bool success, ) = to.call{value: value}(new bytes(0));
    require(success, 'TransferHelper::safeTransferETH: ETH transfer failed');
}
```

`safeTransferETH` 函数涉及两个新的知识点：[合约接收以太币](./recerve.md)和地址类型上[成员函数 call 的用法](../solidity-adv/addr_call.md)，本节不展开，大家通过链接前往阅读。



## 小结

提炼本节的重点：Solidity 合约程序里，使用**地址类型`address`**来表示的账号， 合约和普通地址，都可以用`address` 类型表示。

在地址类型上用`.balance`获取该地址的余额， 使用 `.transfer` / `.send`向该地址转账。



学习 Solidity 不要忘了翻看 [Solidity 文档手册](https://learnblockchain.cn/docs/solidity/)

\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
