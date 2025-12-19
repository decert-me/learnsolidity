# 合约如何接收 ETH



我们要把合约的ETH 转出是很容易的，我们在[地址](https://learnblockchain.cn/article/22565)一节已经介绍过。

而当我们要向合约里转入ETH时，情况比我们想象的复杂一些，被转入的合约需要明确表达其可以接收 ETH，以防因合约没有处理的ETH的，导致ETH永远锁死在合约中。

> 提示： ERC20 代币向合约转账时，并没有对合约进行类似的检查，因此也时不时会发生 [ERC20](https://learnblockchain.cn/tags/ERC20?map=EVM)  因误转入合约而锁死。



可以在合约中明确声明两个函数来表示合约可以接收 ETH， 他们是 `receive` 函数和 `fallback`函数。

`receive` 函数和 `fallback`函数都是在转账时被动调用的，通常称为：回调函数，表示有转账了，告诉我（合约）一下。

![image-20230710174812242](https://img.learnblockchain.cn/pics/20230710174814.png!decert.logo.water)

## receive函数（接收函数）

合约的 receive（接收）函数是一种特殊的函数，专门用来表示合约可以接收以太币，接收函数的声明为： 

```solidity
receive() external payable { 

}
```

函数名只有一个`receive`关键字，而不需要`function`关键字，也没有参数和返回值，并且必须是 `external`可见性和`payable`修饰。

一个合约最多有一个接收函数。

[在Remix验证一下](https://remix.ethereum.org/?#language=solidity&version=soljson-v0.8.20+commit.a1b79de6.js&code=Ly8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IE1JVApwcmFnbWEgc29saWRpdHkgXjAuOC4wOwoKY29udHJhY3QgdGVzdFBheWFibGUgewogICAgcmVjZWl2ZSgpIGV4dGVybmFsIHBheWFibGUgewogICAgfSAgCn0&lang=en&optimize=false&runs=200&evmVersion=null)， 部署以下合约：

```solidity
contract testPayable {
    event Received(address, uint);
    receive() external payable {
            emit Received(msg.sender, msg.value);
    }  
}
```

>  请注意，这个合约仅验证接收以太币，他们没有转出的逻辑，因此，所有发送给它的以太币，都没有办法取回。

部署后，`testPayable` 合约的余额为0 ， 在 `Remix` 如何给合约地址转账呢？ 

 介绍一个技巧，在[以太坊核心概念](https://learnblockchain.cn/article/22542)中，转账交易与调用合约函数的差别在于有没有附加data数据，若data为空即是转账。在Remix 中，提供了一个底层交易方法，可以输入任意的附加data数据， 因此我们只要在这个底层交易不填入附加data数据就可以实现向合约转账， 因此只要如下图操作，就可以实现转账：



![image-20230702194752931](https://img.learnblockchain.cn/pics/20230702194754.png)

执行后，合约的余额，将变更为1 ETH：



![image-20230702194825312](https://img.learnblockchain.cn/pics/20230702194826.png!decert.logo.water)

大家可以做一个对比验证，如果`testPayable` 合约没有实现`receive`函数，此时转账交易会抛出异常，合约无法接收ETH。

当对合约进行转账时（不论使用MetaMask钱包转账，还是合约中使用`addr.send()`或者`addr.transfer()`对合约转账），合约在收到ETH时会执行`receive`函数。

若是使用`addr.send()`或者`addr.transfer()`对合约转账，EVM在执行 transfer 和 send 函数只使用固定的 2300 gas， 这个gas 基本上只够`receive`函数输出一条日志，如果`receive`函数有更多逻辑，就需要使用[底层调用call](../solidity-adv/addr_call.md)对合约转账:



```solidity
function safeTransferETH(address to, uint256 value) internal {
    (bool success, ) = to.call{value: value}(new bytes(0));
    require(success, 'TransferHelper::safeTransferETH: ETH transfer failed');
}
```



特别要说明的是，以下操作的消耗会大于2300 gas。

（1）写存储变量；

（2）创建一个合约；

（3）执行一个外部函数调用，会花费比较多的gas；

（4）发送以太币。





> 合约需要定义 receive 函数才能接收以太币，是在通常我们处理的转账情况。
>
> 有一些例外，即便合约没有定义 receive 函数， 验证者的出块和交易奖励依旧可以打入到该合约。另外在销毁合约时（selfdestruct）被销毁合约的ETH需要转到另一个地址，或后者是合约，也不要求定义 receive 函数。



##   fallback函数 (回退函数）

和接收函数类似，fallback函数也是一个特殊的函数，中文一般称为“回退函数”。 

如果用户对合约进行调用时，合约中没有找到用户要调用的函数， fallback 函数就会被调用（可以理解为最终回退到这个函数）。

同样的，若是对合约进行 ETH 转账，而合约又没有实现`receive`函数，也会回退到 fallback 函数（不过此时要求fallback函数需要能接收ETH， 有 payable 修饰）。



fallback函数的声明如下：

```solidity
fallback() external payable { ... }
```

>  注意，在solidity 0.6里，回退函数是一个无名函数（没有函数名的函数），如果你看到一些老合约代码出现没有名字的函数，不用感到奇怪，它就是回退函数。

和接收函数类似，一个合约最多有一个`fallback`函数，这个函数无参数，也无返回值，也没有`function`关键字, 必须是`external`可见性。

 

下面的这段代码可以帮助我们进一步理解receive函数与fallback函数。

```solidity
pragma solidity >= 0.8.0;
contract Test {
    // 发送到这个合约的所有消息都会调用此函数（因为该合约没有其它函数）
    // 向这个合约发送以太币会导致异常，因为fallback函数没有 payable 修饰符
    fallback() external { x = 1; }
    uint x;
}


// 这个合约会保留所有发送给它的以太币，没有办法返还
contract TestPayable {
    // 除了纯转账外，所有的调用都会调用这个函数
    // 因为除了receive函数外，没有其他的函数
    // 任何对合约非空calldata调用会执行回退函数(即使是调用函数附加以太)
    fallback() external payable { x = 1; y = msg.value; }
    // 纯转账调用这个函数，例如对每个空empty calldata的调用
    receive() external payable { x = 2; y = msg.value; }
    uint x;
    uint y;
}

contract Caller {

    function callTest(Test test) public returns (bool) {
        (bool success,) = address(test).call(abi.encodeWithSignature("nonExistingFunction()"));
        require(success);
        //  test.x结果变成 == 1
        // address(test)不允许直接调用send, 因为test没有payable回退函数
        //  转化为address payable类型 , 然后才可以调用send
        address payable testPayable = payable(address(test));
        // 以下这句将不会编译，但如果有人向该合约发送以太币，交易将失败并拒绝以太币
        // test.send(2 ether）;
    }
    function callTestPayable(TestPayable test) public returns (bool) {
        (bool success,) = address(test).call(abi.encodeWithSignature("nonExistingFunction()"));
        require(success);
        // test.x结果为 1，test.y结果为0
        (success,) = address(test).call{value: 1}(abi.encodeWithSignature("nonExistingFunction()"));
        require(success);
        // test.x结果为1，test.y结果为1
        // 发送以太币，TestPayable的receive函数被调用
        require(address(test).send(2 ether));
        // test.x结果为2，test.y结果为2 ether
    }
}
```

以上代码，使用了地址上的底层调用，来模拟调用不存在的函数，这部分内容将在 [地址高阶用法](../solidity-adv/addr_call.md) 进一步介绍。

再次提醒，当使用合约中使用send和transfer向合约转账时，[EVM](https://learnblockchain.cn/tags/EVM?map=EVM) 仅会提供 2300 gas来执行， 如果`receive`或`fallback`函数的实现需要较多的运算量，会导致转账失败。



## 合约函数接受以太币(payable)

有时我们希望调用某个合约函数时，把以太币转给合约，这个时候我们只需要在合约函数上添加一个 `payable` 修饰符。

例如，我们要实现一个Bank， 用户调用`deposit() `把 ETH 存入合约Bank， 调用`withdraw` 从合约取出自己的 ETH。

```solidity
contract Bank {
    mapping(address => uint) public deposits;
    
    function deposit() public payable {
        deposits[msg.sender] += msg.value;
    }
    
    
    // 从合约取款
    function withdraw() public {
        uint d = deposits[msg.sender];
        deposits[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value:  d}("");
        require(success, "Failed to send Ether");
    }
}
```

此时我们可以不需要要合约中实现 `receive` 或 `fallback` 函数，大家可以直接在 Remix 中演练一下。

![image-20230703215441410](https://img.learnblockchain.cn/pics/20230703215444.png)



也许大家会注意到一个细节，当函数可以附加ETH时，Remix会在函数按钮上显示红色。



思考一个问题： 如果想在合约部署时把ETH转入合约要怎么做呢？

类似的， 只需要在  构造函数中加入 `payable` 就可以，例如：

```solidity
contract testPayable {
    constructor() payable {
    }
}
```



## 小结

本节介绍了合约如何接收 ETH，理解了 `receive` 和 `fallback` 函数的作用，以及 `payable` 修饰符的作用：

1. **`payable` 修饰符**：表示该函数可以接收 ETH
2. **`receive` 函数**：在合约接收 ETH（且无 calldata）时被调用的函数
3. **`fallback` 函数**：在匹配不到对应的函数（`receive` 函数或其他函数找不到）时被调用的函数

我画了一个图，`receive` 和 `fallback` 函数在什么时候被调用就一目了然了：

![image-20230703223858675](https://img.learnblockchain.cn/pics/20230703223900.png!decert.logo.water)

理解这些机制对于编写安全的[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)非常重要，可以避免 ETH 被永久锁定在合约中。

### 进阶学习

想了解更多关于合约接收 ETH 的知识，可以参考：

- [底层调用](../solidity-adv/3_addr_call.md) - 深入理解 call、delegatecall 和 staticcall
- [重入攻击](../security/9_reentrancy.md) - 学习在接收 ETH 时如何防范重入攻击
- [支付模式](../solidity-practice/14_payment_patterns.md) - 学习[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)中的支付最佳实践
