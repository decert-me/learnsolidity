# 映射（mapping）



映射类型和Java的Map、Python的Dict在功能上差不多，它是一种键值对的映射关系存储结构，定义方式为mapping(KT => KV)。如：

```
mapping( uint => string) idName;
```

映射是一种使用广泛的类型，经常在合约中充当一个类似数据库的角色，比如在代币合约中用映射来存储账户的余额，在游戏合约里可以用映射来存储每个账号的级别，如：

```
mapping(address => uint) public balances;
mapping(address => uint) public userLevel;
```

映射的访问和数组类似，可以用balances[userAddr]访问。

键类型有一些限制：不可以是映射、变长数组、合约、枚举、结构体。值的类型没有任何限制，可以为任何类型，包括映射类型。

下面是一段示例代码。

```solidity
pragma solidity >=0.8.0;

contract testMapping {
    mapping(address => uint) public balances;

    function update(uint newBalance) public {
        balances[msg.sender] = newBalance;
    }
}

```

**注意**： 映射是没有长度的，也没有键集合或值集合的概念。





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