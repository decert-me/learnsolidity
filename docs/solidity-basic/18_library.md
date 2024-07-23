# 库

## 理解库

在软件开发中，有两个方式来实现代码的重用，一个是**[继承](./16_is.md)**，一个是**组合**。库（Library）就是通过组合的方式来实现代码的复用。

下面的图示了继承和组合的区别：

![solidity - 继承与库（组合）的区别](https://img.learnblockchain.cn/pics/20230730213842.png!decert.logo.water)

继承表示“是” （`is`） ， 如猫/狗（派生类/合约）是 动物（父类/合约）。

组合表示“有” （has)，  如猫/狗有四条腿。



库（Library）是一组预先编写好功能模块的集合，使用库可提高开发效率，并且一些知名库经过多次审计及时间考验，使用他们他们也可以提高代码质量。

我们常说要避免重复造轮子，轮子很多时候指的就是各种库。



[OpenZepplin](https://github.com/OpenZeppelin/openzeppelin-contracts) 代码库中，大量使用了继承与库，前面介绍的[ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol) 使用的是继承，而`utils` 工具中，有很多的使用库，例如：[`Address`](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol) 用来帮助我们进行各种底层调用。



## 使用库

 库使用关键字`library`来定义，例如，下面的代码定义了一个`Math`库。

```solidity
pragma solidity ^0.8.19;

// highlight-next-line
library Math {
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
```



`Math` 库封装了两个常用方法，`max()` 用来获取最大值，`min()` 用来获取最小值，这是库最典型的用法，将常用的功能封装起来，以便在多个不同的合约中复用。

> 这个是Math库，其实是 [OpenZepplin Math](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/Math.sol) 的简化版本。



在合约中引入库之后，可以直接调用库内的函数，参考下面的`TestMax`合约：

```solidity
import "./Math.sol";

contract TestMax {
    function max(uint x, uint y) public pure returns (uint) {
        // highlight-next-line
        return Math.max(x, y);
    }
}
```



在使用库时，要牢记：库是**函数的封装**， 库是**无状态**的，库内不能声明变量，也不能给库发送Ether。

库有两种使用方式：一种是库代码嵌入引用的合约里部署（可以称为“内嵌库”），一种是作为库合约单独部署（可以称为“链接库”）。

##  内嵌库

如果合约引用的库函数都是内部函数，那么编译器在编译合约的时候，会把库函数的代码嵌入合约里，就像合约自己实现了这些函数，这时的库并不会单独部署，上面的Math库就属于这个情况， 它的代码会在 `TestMax `合约编译时，加入到 `TestMax `合约里。

绝大部分的库都是内嵌的方式在使用。

> 注意：内嵌库在合约的字节码层，是没有复用的，内嵌库的字节码会存在于每一个引入该库的合约字节码中。



##  链接库

如果库代码内有[公共或外部函数](./2_solidity_layout.md#变量与函数的可见性)，库就可以被单独部署，它在以太坊链上有自己的地址，引用合约在部署合约的时候，需要通过库地址把库“链接”进合约里，合约是通过[委托调用](../solidity-adv/addr_call.md)的方式来调用库函数的。

下图是一个内嵌库和链接库在部署后的对比图：

![Solidity 内联库与链接库](https://img.learnblockchain.cn/pics/20230802174358.png!decert.logo.water)



在委托调用的方式下库合约函数是在发起的合约（下文称“主调合约”，即发起调用的合约）的上下文中执行的，因此库合约函数中使用的变量（如果有的话）都来自主调合约的变量（库代码不能声明自己的状态变量），库合约函数使用的`this`也是主调合约的地址。

  

把前面的Math库的add函数修改为外部函数，就可以通过链接库的方式来使用，示例代码如下：

```solidity
pragma solidity ^0.8.19;

// highlight-next-line
library Math {
    function max(uint256 a, uint256 b) external pure returns (uint256) {
        return a > b ? a : b;
    }

}
```

`TestMax`代码不用作任何的更改，不过因为`Math`库是独立部署的， `TestMax`合约要调用`Math`库就必须先知道后者的地址，这相当于`TestMax`合约会依赖于`Math`库，因此部署`TestMax`合约会有一点不同，需要让 `TestMax`合约与`Math`库建立链接， Solidity 开发框架会帮助我们进行链接，以[Hardhat](../tools/4_hardhat.md) 为例，部署脚本这样写就好：



```javascript
  const ExLib = await hre.ethers.getContractFactory("Math");
  const lib = await ExLib.deploy();
  await lib.deployed();

  await hre.ethers.getContractFactory("TestMax", {
    libraries: {
      Library: lib.address,
    },
  });

```



## **Using for**

上面，我们通过`Math.max(x, y)`语法来调用库函数，还有一个语法糖是使用`using LibA for B`，它表示把所有LibA的库函数关联到类型B。这样就可以在B类型直接调用库的函数，代码示例如下：

```solidity
contract testLib {
    using Math for uint;
    
    function callMax(uint x, uint y) public pure returns (uint) {
       return x.max(y);
    }

}
```



使用`using...for...`看上去就像扩展了类型的能力。比如，我们可以给数组添加一个indexOf函数，查看一个元素在数组中的位置，示例代码如下:

```solidity
pragma solidity >=0.4.16;


library Search {
    function indexOf(uint[] storage self, uint value)
        public
        view
        returns (uint)
    {
        for (uint i = 0; i < self.length; i++)
            if (self[i] == value) return i;
        return uint(-1);
    }
}


contract C {
    using Search for uint[];
    uint[] data;


    function append(uint value) public {
        data.push(value);
    }


    function replace(uint _old, uint _new) public {
        // 执行库函数调用
        uint index = data.indexOf(_old);
        if (index == uint(-1))
            data.push(_new);
        else
            data[index] = _new;
    }
}
```

这段代码中`indexOf`的第一个参数存储变量self，实际上对应着合约 C 的`data`变量。



路上使用`using LibA for B`语法糖，大部分时候，可以让我们的代码更简洁。

例如：有一个库函数：`isContract(address addr) ` ， 可以使用 `addr.isContract()`  来调用库函数，代码就更简洁了。



若使用 `using LibA for *`  可以把 LibA 中的函数关联到任意的类型上。



## 小结

本文，我们学习了库的的概念， 总结要点：

* 库是函数的封装， 主要用于代码复用
* 库是没有状态的，也不能给库发送 Ether

- 如果库函数都是 internal 的，库代码会嵌入到合约。 
- 如果库函数有external或 public ，库需要单独部署，并在部署合约时进行链接，EVM 中使用委托调用库方法。
- 给类型扩展功能：`Using lib for type`; 如： using Math for uint;





------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。
前往挑战 [Solidity 101：库](https://decert.me/quests/8867a83b-c3ba-43e2-afa7-324a7d5dcdc6)，完成挑战并获得技能认证 NFT。

DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。

