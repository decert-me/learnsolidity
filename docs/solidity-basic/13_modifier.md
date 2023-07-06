# 函数修改器（modifier）





函数修改器可以用来改变一个函数的行为，比如用于在函数执行前检查某种前置条件。熟悉Python的读者会发现，函数修改器的作用和Python的装饰器很相似。

函数修改器使用关键字modifier , 以下代码定义了一个onlyOwner函数修改器。

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

上面使用函数修改器onlyOwner修饰了transferOwner()，这样的话，只有在满足创建者的情况下才能成功调用transferOwner()。

函数修改器一般是带有一个特殊符号“_;”，修改器所修饰的函数体会被插入到“_;”的位置。

因此transferOwner扩展开就是：

```solidity
function transferOwner(address _newO) public {
    require(
        msg.sender == owner,
        "Only owner can call this function."
    );
    owner = _newO;
}
```

#### 修改器可继承

修改器也是一种可被继承合约的属性，同时还可被继承合约重写（Override）。例如：

```solidity
contract mortal is owned {


    // 只有在合约里保存的owner调用close函数，才会生效
    function close() public onlyOwner {
        selfdestruct(owner);
    }
}
```

mortal合约从上面的owned继承了onlyOwner修饰符，并将其应用于close函数。

#### noReentrancy

onlyOwner是一个常用的修改器，以下代码用noReentrancy来防止重复调用，这也同样十分常见。

```solidity
contract Mutex {
    bool locked;
    modifier noReentrancy() {
        require(
            !locked,
            "Reentrant call."
        );
        locked = true;
        _;
        locked = false;
    }


    function f() public noReentrancy returns (uint) {
        (bool success,) = msg.sender.call("");
        require(success);
        return 7;
    }
```

f()函数中，使用底层的call调用，而call调用的目标函数也可能反过来调用f()函数（可能发生不可知问题），通过给f()函数加入互斥量locked保护，可以阻止call调用再次调用f。

注意： 在f()函数中`return 7`语句返回之后，修改器中的语句`locked = false`仍会执行。

#### 修改器带参数

修改器可以接收参数，例如：

```solidity
contract testModifty {


    modifier over22(uint age) {
        require (age >= 22);
            _;


    }


    function marry(uint age) public over22(age) {
       // do something
    }
}
```

以上marry()函数只有满足age >= 22才可以成功调用。

#### 多个函数修改器

我们通过理解多个函数修改器的执行次序，修改器或函数体中显式的return语句仅仅跳出当前的修改器和函数体。返回变量会被赋值，但整个执行逻辑会从前一个修改器中的定义的 “_” 之后继续执行。 来看看下面的例子：

```solidity
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

上面的智能合约在运行test1()之后，状态变量a的值是多少？是1、11、12还是13呢？答案是11，大家可以运行get_a获取a的值。我们来分析一下test1，它扩展之后是这样的：

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



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。



