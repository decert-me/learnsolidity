## 接口与合约交互



在上一节[继承](./15_is.md)中，我们已经理解了一些抽象的概念：把各个合约都拥有的功能，作为统一接口在父合约里提供，让所有的子合约都可以继承。

接口（Interface）则更进一步，是一种定义了一组**抽象方法的规范**，接口描述了一组兑现应该具有哪些方法，但并不提供这些方法的具体实现。

**接口只用来定义方法，而没有实现的方法体。抽象合约则可以有方法的实现**，抽象合约可以实现一个或多个接口，以满足接口定义的方法要求。



![solidity 继承与接口](https://img.learnblockchain.cn/pics/20230730113739.png!decert.logo.water)



接口的作用主要体现在以下几个方面：

1. 规范行为：接口定义了一组方法，要求实现这个接口的合约必须提供这些方法的具体实现。通过实现接口，可以确保一组合约拥有相同的方法，并且这些方法的功能和行为是一致的，从而增强了代码的一致性和可预测性。

2. 解耦合：接口可以将定义方法的部分与具体实现合约分离，从而实现了解耦合。因此我们可以**基于接口来进行合约间的相互调用， 而不是基于实现**。

   

接口也是合约设计中的方法规范，用于定义合约之间的协作方式，提高代码的可维护性和可读性。



## 使用接口

Solidity 用`Interface` 关键字定义接口，以下是一段示例代码定义了一个名为`ICounter` 的接口：

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

软件设计中，有一个很重要的原则：依赖接口，而不是依赖实现。

```solidity
pragma solidity ^0.8.0;

contract Counter {
    uint public count;

    function increment() external {
        count += 1;
    }
}

interface ICounter {
   function count() external view returns (uint);
   function increment() external;
}

contract MyContract {
    function incrementCounter(address _counter) external {
        ICounter(_counter).increment();
    }

    function getCount(address _counter) external view returns (uint) {
        return ICounter(_counter).count();
    }
}

```





除了接口的抽象功能外，接口广泛使用于合约之间的通信，即一个合约调用另一个合约的接口。

例如，有一个SimpleToken合约实现了上面的IToken接口：

```
contract SimpleToken is IToken {
function transfer(address recipient, uint256 amount) public override {
....
}
```

另外一个奖例合约（假设合约名为Award）则通过给SimpleToken合约给用户发送奖金，奖金就是SimpleToken合约表示的代币，这时Award就需要与SimpleToken通信（外部函数调用），代码可以这样写：

```
contract Award {
  IToken immutable token;
  // 部署时传入SimpleToken合约地址
  constrcutor(IToken t) {
     token = t;
  }
  function sendBonus(address user) public {
     token.transfer(user, 100);
  }
}
```

sendBonus函数用来发送奖金，通过接口函数调用SimpleToken实现转账。
