# 地址高阶用法

 

这里有一个很多开发者忽略的知识点：如果给一个合约地址转账，即上面代码 x 是合约地址时，合约的receive函数或fallback函数会随着transfer调用一起执行（这个是EVM特性），而send()和transfer()的执行只会使用2300 gas，因此在接收者是一个合约地址的情况下，很容易出现receive函数或fallback函数把gas耗光而出现转账失败的情况。



    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, 'TransferHelper::safeTransferETH: ETH transfer failed');
    }



> 为了避免 gas不足导致转账失败的情况，可以下面底层函数call，使用addr.call{value:1 ether}("")来进行转账，这句代码在功能上等价于addr.transfer(y)，但call调用方式会用上当前交易所有可用的gas。

 

地址类型还有3个更底层的成员函数，通常用于与合约交互。

- `<address>.call(bytes memory) returns (bool, bytes memory)`

- `<address>.delegatecall(bytes memory) returns (bool, bytes memory)`

- `<address>.staticcall(bytes memory) returns (bool, bytes memory)`

 

这3个函数用直接控制的编码[给定有效载荷（payload）作为参数]与合约交互，返回成功状态及数据，默认发送所有可用gas。它是向另一个合约发送原始数据，支持任何类型、任意数量的参数。每个参数会按规则（接口定义ABI协议）打包成32字节并拼接到一起。Solidity提供了全局的函数abi.encode、abi.encodePacked、abi.encodeWithSelector和abi.encodeWithSignature用于编码结构化数据。

例如，下面的代码是用底层方法call调用合约register方法 。

```
bytes memory payload = abi.encodeWithSignature("register(string)", "MyName");
(bool success, bytes memory returnData) = address(nameReg).call(payload);
require(success);
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







