# 映射（mapping）



映射类型是一种键值对的映射关系存储结构， 在功能上和Java的Map、Python的Dict差不多。



映射是一种使用非常广泛的类型，经常在合约中充当一个类似数据库的角色，比如在代币合约中用映射来存储账户的余额，在游戏合约里可以用映射来存储每个账号的级别，如：

```
mapping(address => uint) public balances;
mapping(address => uint) public userLevel;
```

映射的定义为`mapping(KeyType => ValueType)`， `KeyType` 表示键的类型，`ValueType` 表示键的类型。

我们可以通过键来获取到对应的值，例如：`balances[userAddr]`  用来获取某个地址的余额，访问形式很类似于通过下标来获取某个数组元素的值。 

类似的，给某个键赋值也是一样，下面是一段示例代码。

```solidity
pragma solidity >=0.8.0;

contract testMapping {
    mapping(address => uint) public balances;

    function update(uint newBalance) public {
      // highlight-next-line
        balances[msg.sender] = newBalance;
    }
}

```







## 映射特性与限制

1. 映射变量只能保存在存储中（`storage`）， 通常作为状态变量。



```solidity
pragma solidity >=0.8.0;

contract testMapping {
    mapping(address => uint)  balances;   // 正确, 默认为 storage

    function init(uint newBalance) public {
      // highlight-next-line
			mapping(address => uint) memory balances;   // 错误， 不可以为 memory
    }
}
```



2. 键类型有一些限制，仅支持Solidity内置值类型、`bytes`、`string` 、合约或枚举，不可以是复杂类型， 如：映射、变长数组、结构体。值的类型是没有任何限制，可以为任何类型。

   



3.  Solidity 里的映射是没有长度的，也没有键集合或值集合的概念。





4. 映射是可以嵌套的。

   嵌套映射是指从一个映射到另一个映射的映射。例如，如果我们有一个用户名和年龄，并想在一个特殊的ID的协助下存储这个信息，这样别人就只能借助这个ID来获得它，这在Solidity中被称为双重映射。





### 映射访问器

对于状态变量标记为public的映射类型，其处理方式和数组一致，参数是键类型，返回值类型。

```
mapping (uint => uint) public idScore;
```

会生成函数：

```
function idScore(uint i) external returns (uint) {
   return idScore[i];
}
```

来看一个稍微复杂一些的例子：

```
pragma solidity >0.5.0;
contract Complex {
    struct Data {
        uint a;
        bytes3 b;
        mapping (uint => uint) map;
    }
    mapping (uint => mapping(bool => Data[])) public data;
}
```

data 变量会生成以下函数：

```
function data(uint arg1, bool arg2, uint arg3) external returns (uint a, bytes3 b) {
    a = data[arg1][arg2][arg3].a;
    b = data[arg1][arg2][arg3].b;
}
```



## Solidity 数组 vs 映射

有时候，我们既可以使用数组存数据，有可以使用映射。

Solidity 数组更适合数据迭代（例如，使用 for 循环），而基于一个已知的键来获取值时，映射更适合（即不需要迭代获得数据）。

与从映射中获取数据相比，在 Solidity 中对数组进行迭代相对来说Gas消耗更大，而且尽量不要让数组太大。



另外有时候，可能希望在智能合约中同时存储有哪些键和值，这时开发者可能会需要创建一个键的数组，作为数据的参考，然后再从映射中检索值。



