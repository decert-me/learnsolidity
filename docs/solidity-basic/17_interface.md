在上一节[继承](https://learnblockchain.cn/article/22558)中，我们已经理解了一些抽象的概念：把各个合约都拥有的功能，作为统一接口在父合约里提供，让所有的子合约都可以继承。

接口（Interface）则更进一步，是一种定义了一组**抽象方法的规范**，接口描述了一组兑现应该具有哪些方法，但并不提供这些方法的具体实现。

**接口只用来定义方法，而没有实现的方法体。抽象合约则可以有方法的实现**，抽象合约可以实现一个或多个接口，以满足接口定义的方法要求。



![solidity 继承与接口](https://img.learnblockchain.cn/pics/20230730113739.png!decert.logo.water)



接口的作用主要体现在以下几个方面：

1. 规范行为：接口定义了一组方法，要求实现这个接口的合约必须提供这些方法的具体实现。通过实现接口，可以确保一组合约拥有相同的方法，并且这些方法的功能和行为是一致的，从而增强了代码的一致性和可预测性。

2. 解耦合：接口可以将定义方法的部分与具体实现合约分离，从而实现了解耦合。因此我们可以**基于接口来进行合约间的相互调用， 而不是基于实现**。

   

接口也是合约设计中的方法规范，用于定义合约之间的协作方式，提高代码的可维护性和可读性。



## 使用接口

[Solidity](https://learnblockchain.cn/course/93) 用`Interface` 关键字定义接口，以下是一段示例代码定义了一个名为`ICounter` 的接口：

```solidity
pragma solidity ^0.8.10;

// highlight-next-line
interface ICounter {
    function increment() external;
}

```

由于接口是一组方法规范的，因此接口：

- 无任何实现的函数
- 不能继承自其他接口
- 没有构造方法
- 没有状态变量



合约可以实现一个接口：

```solidity
contract Counter is ICounter {
    uint public count;

    function increment() external override {
        count += 1;
    }
}
```

接口中的所有方法都是隐含的 `virtual` 方法，因此即便没有 `virtual`，也可以被重写。



### 利用接口调用合约

软件设计中，有一个很重要的原则：**依赖接口，而不是依赖实现**。

假设我们链上已经部署了一个`Counter`合约， 合约地址为`0xabcd....`， 源代码文件：`Counter.sol` ，代码如下：

```solidity
pragma solidity ^0.8.0;

contract Counter is ICounter {
    uint public count;

    function increment() external override {
        count += 1;
    }
}

```

如何在我们的合约里调用链上`Counter`合约的`increment()`方法呢？



```solidity
import "./ICounter.sol";

contract MyContract {
    // highlight-next-line
    function incrementCounter(address _counter) external {
        ICounter(_counter).increment();
    }
}

```



高亮代码`ICounter(_counter).increment();`  的含义是：把合约地址 `_counter`  类型转化为接口`ICounter`类型（接口类型与[合约类型](https://learnblockchain.cn/article/22561)一样，也是自定义类型），再调用接口内的`increment()` 方法。



还有一个方法是**基于具体的实现合约**，例如：

```solidity
import "./Counter.sol";

contract MyContract {
    function incrementCounter(address _counter) external {
        // highlight-next-line
        Counter(_counter).increment();
    }
}
```

代码`Counter(_counter).increment();`  的含义是：把合约地址 `_counter`  类型转化为合约`Counter`类似，再调用合约里的`increment()` 方法。



依赖接口与依赖实现两个方法在EVM层面没有区别，最终都是通过合约地址找到对应的函数来执行。

但是用**接口**来进行合约交互时，会更明确得传递一个含义：我在调用该接口，而不管他的实现，可以有任意的合约来进行实现。另外在接口文件里，由于没有实现细节，代码会更清晰，因此我会更推荐是用接口，



### 调用 ERC20 合约进行转账

合约间的交互，使用非常广泛，因此，这里再举一个示例：实现一个奖励合约，给用户发放 ERC20 代币奖励。

[ERC20](https://learnblockchain.cn/tags/ERC20?map=EVM) 代币如下：

```solidity
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {}
}
```



先在脑海里想一想如何实现？

我们可以通过 IERC20 接口调用`MyToken` 的 `transfer`  方法，把奖励合约中的`MyToken`发送给用户。

代码可以这样写：

```solidity
contract Award {
  IERC20 immutable token;
  // 部署时传入 MyToken 合约地址
  constructor(address t) {
     token = IERC20(t);
  }

  function sendAward(address user) public {
     token.transfer(user, 100);
  }
}
```

`sendAward`函数用来发送奖金，当然需要需要在 `Award` 合约创建好之后，向 `Award` 转入一些`MyToken`。



如果文章不好理解，[区块链技术集训营](https://learnblockchain.cn/course/28) 视频课程可以让大家学的更轻松。





## 小结

- **接口定义**：使用 `interface` 关键字定义，是一组抽象方法的规范
- **设计原则**：在合约间相互调用时，应该依赖接口而不是依赖实现（依赖倒置原则）
- **接口特点**：
  - 所有函数都必须是 external
  - 不能有构造函数
  - 不能有状态变量
  - 不能继承其他合约（但可以继承其他接口）
- **使用方式**：接口也是一个类型，通过将地址转换为接口类型，即可调用相应的函数

接口是合约间交互的标准方式，使用接口可以降低耦合度，提高代码的可维护性和可扩展性。

### 进阶学习

想了解更多关于接口的知识，可以参考：

- [ERC20 标准](https://learnblockchain.cn/article/22659) - 学习如何实现 [ERC20](https://learnblockchain.cn/tags/ERC20?map=EVM) 接口
- [ERC721 标准](https://learnblockchain.cn/article/22660) - 学习 [NFT](https://learnblockchain.cn/tags/NFT) 接口的实现
- [跨合约调用](../solidity-adv/3_addr_call.md) - 深入理解合约间的交互方式
