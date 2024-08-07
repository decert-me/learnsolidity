# call 与 delegatecall

## 理解底层调用

在我们知道一个合约的接口后， 就我们的合约中调用其函数， 例如下调用`ERC20` 的`transfer` 方法来发送奖励：

```solidity
contract Award {
  function sendAward(address user) public {
    token.transfer(user, 100);
  }
}
```



然后这里也有一个前提：需要在编写我们的合约（这里为`Award`）前，先知道目标合约的接口（这里为 `transfer` ）。

但有时我们在编写合约时，还不知道目标合约的接口，甚至是目标合约还没有创建。一个典型的例子是智能合约钱包，智能合约钱包会代表我们的身份调用任何可能的合约。显然我们无法在编写智能合约钱包时，预知未来要交互的合约接口。

这个问题该如何解决呢？

你也许知道很多编程语言（如Java）有反射的概念，反射允许在运行时动态地调用函数或方法。地址的底层调用和反射非常类似。

使用地址的底层调用功能，是在运行时动态地决定调用目标合约和函数， 因此在编译时，可以不知道具体要调用的函数或方法。



在这一篇里就来介绍一下，地址的底层调用功能。



## 底层调用

 地址类型还有3个底层的成员函数：

- `targetAddr.call(bytes memory abiEncodeData) returns (bool, bytes memory)`

- `targetAddr.delegatecall(bytes memory abiEncodeData) returns (bool, bytes memory)`

- `targetAddr.staticcall(bytes memory abiEncodeData) returns (bool, bytes memory)`

 `call` 是常规调用，`delegatecall` 为委托调用，`staticcall` 是静态调用（不修改合约状态， 相当于调用 `view` 方法）。

这三个函数都可以用于与目标合约（`targetAddr`）交互，三个函数均接受 [abi 编码数据](ABI.md)作为参数（`abiEncodeData`）来调用对应的函数。



### 调用举例

在 [接口与函数调用](./17_interface.md) 一节中，我们介绍过通过 `ICounter(_counter).set(10);`  调用以下`set`方法：

```solidity
contract Counter {
  uint public counter;

  function set(uint x) public {
      counter = x;
  }
}
```



在 [ABI 一节](ABI.md) 我们知道调用 `set()`函数，实际上发送的是 ABI 编码数据`0x60fe47b1000000000000000000000000000000000000000000000000000000000000000a`

通过`call` 就可以直接使用编码数据发起调用：

```solidity
bytes memory payload = abi.encodeWithSignature("set(uint256)", 10);
(bool success, bytes memory returnData) = address(_counter).call(payload);
require(success);
```

这段代码在功能上和  `ICounter(_counter).set(10);` 等价，但 `call`的方式可以动态构造 `payload` 编码数据对函数进行调用，从而实现对任意函数、任何类型及任意数量的参数的调用。

示例中的编码数据是通过 `encodeWithSignature` 构造，Solidity 提供了多个[编码函数](./2_ABI.md#Solidity_编码函数)来构造编码数据，还可以通过工具和 Web3.js 等库在链下构造编码数据。



使用底层方法调用合约函数时， 当被调用的函数发生异常时（revert），异常不会冒泡到调用者（即不会回退）， 而是返回错误 false。因此在使用所有这些低级函数时，一定要记得检查返回值。



## call 与 delegatecall

 `call` 是常规调用，`delegatecall` 为委托调用，`staticcall` 是静态调用，不修改合约状态， 相当于普通的 `view` 方法调用。

常规调用  `call`  与 委托调用 `delegatecall` 的区别是什么呢？

当我们在用钱包发起交易时，用[合约接口调用函数](../solidity-basic/17_interface.md)，都是常规调用，每次常规调用都会切换上下文，切换上下文可以这样理解：每一个地址在 EVM 有一个独立的空间，空间有各自的摆设（变量布局），切换上下文就像从一个空间进入另一个空间（也可以携带一些东西进入另一个空间），每次进入一个空间后，只能使用当前空间内的东西。



委托调用不一样，没有上下文的切换，它像是给你一个主人身份（委托），你可以在当下空间做你想做的事。



我们用一个代码实例看看常规调用  `call`  与 委托调用 `delegatecall`  的不同的：

```solidity
pragma solidity ^0.8.0;

contract Counter {
    uint public counter;
    address public sender;

    function count() public {
        counter += 1;
        sender = msg.sender;
    }
}

contract CallTest {
    uint public counter;
    address public sender;


    function lowCallCount(address addr) public {
    //  (Counter(c)).count();
        bytes memory methodData =abi.encodeWithSignature("count()");
        addr.call(methodData);
    }

    // 只是调用代码，合约环境还是当前合约。
    function lowDelegatecallCount(address addr) public {
        bytes memory methodData = abi.encodeWithSignature("count()");
        addr.delegatecall(methodData);
    }

}
```



在 Remix 中，分别部署 `Counter` 和 `CallTest` 合约，然后用 `Counter` 部署地址作为参数调用 `lowCallCount`   ，想一下，是  `Counter` 还是  `CallTest` 合约的 `counter` 的值增加了？ 再试试调用 `lowDelegatecallCount`  看看。



结果：

```
lowCallCount()  ->  Counter::counter + 1   

lowDelegatecallCount() -> CallTest::counter + 1   
```



 `lowCallCount` 函数中使用`call`，上下文从 `CallTest` 地址空间跳到了 `Counter`地址空间， 因此是`Counter`内部的 `counter` 值 + 1 了。

`lowDelegatecallCount` 函数中使用`delegatecall`，上下文保证在 `CallTest` 地址空间，因此是`CallTest`的 `counter` 值 + 1 了。







###  案例场景

代理合约，

数组切片在获取calldata中的ABI解码数据（函数选择器 ）的时候非常有用，示例代码如下：

```solidity
pragma solidity >=0.5.0 ;

contract Proxy {
    /// 被当前合约管理的客户端合约地址
    address client;

    constructor(address _client) public {
        client = _client
    }

    /// 在进行参数验证之后，转发到由 client 实现的 "setOwner(address)"
    function forward(bytes calldata _payload) external {
        
        bytes4 sig = abi.decode(_payload[:4], (bytes4));
        
        if (sig == bytes4(keccak256("setOwner(address)"))) {
            address owner = abi.decode(_payload[4:], (address));
            require(owner != address(0), "Address of owner cannot be zero.");
        }
        (bool status,) = client.delegatecall(_payload);
        require(status, "Forwarded call failed.");
    }
}
```

 





**注意**：所有这些函数都是低级函数，应谨慎使用。因为我们在调用一个合约的同时就将控制权交给了被调合约，当我们对一个未知的合约进行这样的调用时，这个合约可能是恶意的，并且被调合约又可以回调我们的合约，这可能发生重入攻击。与其他合约交互的常规方法是在合约对象上调用函数（x.f()）。

底层函数还可以通过value选项附加发送ether（delegatecall不支持`.value()`），如上面用来避免转账失败的方法：addr.call{value:1 ether}("")。 

下面则表示调用函数register()时，同时存入1eth。

```
address(nameReg).call{value:1 ether}(abi.encodeWithSignature("register(string)", "MyName"));
```

底层函数还可以通过gas选项控制的调用函数使用gas数量。

```
address(nameReg).call{gas: 1000000}(abi.encodeWithSignature("register(string)", "MyName"));
```

它们还可以联合使用，出现的顺序不重要。

```
address(nameReg).call{gas: 1000000, value: 1 ether}(abi.encodeWithSignature("register(string)", "MyName"));
```

使用函数delegatecall()也是类似的方式，delegatecall被称为“委托调用”，顾名思义，是把一个功能委托到另一个合约，它使用当前合约（发起调用的合约）的上下文环境（如存储状态，余额 等），同时使用另一个合约的函数。 delegatecall()多用于调用库代码以及合约升级。





这里有一个很多开发者忽略的知识点：如果给一个合约地址转账，即上面代码 x 是合约地址时，合约的receive函数或fallback函数会随着transfer调用一起执行（这个是EVM特性），而send()和transfer()的执行只会使用2300 gas，因此在接收者是一个合约地址的情况下，很容易出现receive函数或fallback函数把gas耗光而出现转账失败的情况。



    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, 'TransferHelper::safeTransferETH: ETH transfer failed');
    }



> 为了避免 gas不足导致转账失败的情况，可以下面底层函数call，使用addr.call{value:1 ether}("")来进行转账，这句代码在功能上等价于addr.transfer(y)，但call调用方式会用上当前交易所有可用的 gas。





        // addr.call{gas:1000}(methodData);
        // addr.call{gas:1000, value: 1 ether}(methodData);





