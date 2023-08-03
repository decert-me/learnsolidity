# 函数修改器（modifier）

## 修改器作用

函数修改器可以用来改变一个函数的行为，比如用于在函数执行前检查某种前置条件。



函数修改器使用关键字 `modifier` , 以下代码定义了一个 `onlyOwner` 函数修改器， 然后使用修改器 `onlyOwner` 修饰 `transferOwner()` 函数：

```solidity
pragma solidity >=0.8.0;


contract owned {
    function owned() public { owner = msg.sender; }
    address owner;

    // highlight-next-line
    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }


   function transferOwner(address _newO) public onlyOwner {
        owner = _newO;
    }
}
```

查看 `onlyOwner` 修改器的代码，很容易理解其作用是限定交易的发送者只能是`owner` 。

但我们用 `onlyOwner`  去修饰其他的函数时，后者也需要修改器的条件，因此对于 `transferOwner()` 函数来说，只有 `owner` 才能成功调用`transferOwner()`。



函数修改器的工作原理是这样的：

函数修改器一般是带有一个特殊符号 `_;` ； 修改器所修饰的函数的函数体会被插入到`_;`的位置。

因此函数 `transferOwner`扩展开后，就是：

```solidity
function transferOwner(address _newO) public {
    require(
        msg.sender == owner,
        "Only owner can call this function."
    );
    owner = _newO;
}
```



因此，可以把修改器当做一个语法糖，用更简介的方式来组织限定条件。



## 修改器可带参数

修改器可以接收参数，例如：

```solidity
contract testModifty {

    modifier over22(uint age) {
        require (age >= 22, "too small age");
        _;
    }


    function marry(uint age) public over22(age) {
       // do something
    }
}
```

以上`marry()`函数只有满足`age >= 22`才可以成功调用。

## 多修改器一起使用

多个修改器可以一起修饰某个函数，此时会根据定义函数修改器的顺序嵌套执行。

 猜测一下，下面的例子执行`test1()` 后，a 的结果是什么？

```SolidityEditor
contract modifysample {
    uint a = 10;

    modifier mf1 (uint b) {
        uint c = b;
        _;
        c = a;
        a = 11;
    }

     modifier mf2 () {
        uint c = a;
        _;
    }

    modifier mf3() {
        a = 12;
        return ;
        _;
        a = 13;
    }

    function test1() mf1(a) mf2 mf3 public   {
        a = 1;
    }

    function get_a() public constant returns (uint)   {
        return a;
    }
}
```

在运行之前，先自己思考一下，这里涉及两个知识点，第一，函数修改器可以按顺序嵌套，第二，修改器或函数体中显式的return语句仅仅跳出当前的修改器和函数体，整个执行逻辑会从前一个修改器中的定义的 “_” 之后继续执行。



因此上面的智能合约在运行test1()之后，状态变量a的值是多少？是1、11、12还是13呢？答案是11，大家可以运行`get_a`获取a的值。我们来分析一下`test1`函数，它扩展之后是这样的：

```
uint c = b;
        uint c = a;
            a = 12;
            return ;
            _;
            a = 13;
c = a;
a = 11;
```

这个时候就一目了然了，最后a为11。



## 修改器可继承

修改器也是可被[继承](./16_is.md)的，同时还可被继承合约重写（Override）。例如：

```solidity
contract mortal is owned {


    // 只有在合约里保存的owner调用close函数，才会生效
    function close() public onlyOwner {
        selfdestruct(owner);
    }
}
```

`mortal`合约从上面的`owned`继承了`onlyOwner`修饰符，并将其应用于close函数。





## 小结

函数修改器是一个语法糖，同来给修饰的函数添加一些额外的功能或检查。

常用于如：检查输入条件、权限控制、重入控制、防止重复初始化等场景。



------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。



