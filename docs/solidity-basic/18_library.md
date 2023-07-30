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

> 要理解一点，内嵌库在合约的字节码层，是没有复用的，内嵌库的字节码会存在于每一个引入该库的合约字节码中。



##  链接库

如果库代码内有[公共或外部函数](./2_solidity_layout.md#变量与函数的可见性)，库就可以被单独部署，它在以太坊链上有自己的地址，引用合约在部署合约的时候，需要通过库地址把库“链接”进合约里，合约是通过委托调用的方式来调用库函数的。



前面提到，库没有自己的状态，因为在委托调用的方式下库合约函数是在发起的合约（下文称“主调合约”，即发起调用的合约）的上下文中执行的，因此库合约函数中使用的变量（如果有的话）都来自主调合约的变量，库合约函数使用的this也是主调合约的地址。

 

我们也可以从另一个角度来理解为什么库不能有自己的状态，库是单独部署，而它又会被多个合约引用（这也是库最主要的功能：避免在多个合约里重复部署，以节约gas），如果库拥有自己的状态，那它一定会被多个调用合约修改状态，将无法保证调用库函数输出结果的确定性。

 

把前面的SafeMath库的add函数修改为外部函数，就可以通过链接库的方式来使用，示例代码如下。

```solidity
pragma solidity >=0.5.0;
library SafeMath {
  function add(uint a, uint b) external pure returns (uint) {
     uint c = a + b;
     require(c >= a, "SafeMath: addition overflow");
     return c;
  }
}
```

AddTest代码不用作任何的更改，因为SafeMath库是独立部署的，AddTest合约要调用SafeMath库就必须先知道后者的地址，这相当于AddTest合约会依赖于SafeMath库，因此部署AddTest合约会有一点不同，需要一个AddTest合约与SafeMath库建立连接的步骤。

 

先来回顾一下合约的部署过程：第一步是由编译器生成合约的字节码，第二步把字节码作为交易的附加数据提交交易。

编译器在编译引用了SafeMath库的AddTest时，编译出来的字节码会留一个空，部署AddTest时，需要用SafeMath库地址把这个空给填上（这就是链接过程）。

> 感兴趣的读者可以用命令行编译器solc操作一下，使用命令： `solc --optimize --bin AddTest.sol`可以生成AddTest合约的字节码，其中有一段用双下划线留出的空，类似这样：__$239d231e517799327d948ebf93f0befb5c98$__，这个空就需要用SafeMath库地址替换，该占位符是完整的库名称的keccak256哈希的十六进制编码的34个字符的前缀。

 

大部分时候库的部署、链接并不需要手动进行，而是可以依赖开发工具来完成，例如使用Truffle（在本书第7章会作进一步介绍）来进行部署，这时仅需要下面 3 行部署语句：

```
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, AddTest);
  deployer.deploy(AddTest)；
```

如果不理解，可以在阅读完第7章之后，再回头看这3行部署语句。

## **Using for**

在上一节中，我们是通过`SafeMath.add(x, y)`这种方式来调用库函数，还有一个方式是使用`using LibA for B`，它表示把所有LibA的库函数关联到类型B。这样就可以在B类型直接调用库的函数，代码示例如下：

```
contract testLib {
    using SafeMath for uint;
    function add (uint x, uint y) public pure returns (uint) {
       return x.add(y);
    }
}
```

使用`using SafeMath for uint;`后，就可以直接在uint类型的x上调用`x.add(y)`，代码明显更加简洁了。

`using LibA for *`则表示LibA中的函数可以关联到任意的类型上。使用using...for...看上去就像扩展了类型的能力。比如，我们可以给数组添加一个indexOf函数，查看一个元素在数组中的位置，示例代码如下。

```
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

这段代码中indexOf的第一个参数存储变量self，实际上对应着合约C的data变量。



## 小结

- 与合约类似（一个特殊合约），是函数的封装，用于代码复用。
- 如果库函数都是 internal 的，库代码会嵌入到合约。 
- 如果库函数有external或 public ，库需要单独部署，并在部署合约时进行链接，使用委托调用
- 没有状态变量
- 不能给库发送 Ether
- 给类型扩展功能：Using lib for type; 如： using SafeMath for uint;





------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。

