# 映射（mapping）


映射类型是一种键值对的映射关系存储结构， 在功能上和Java的Map、Python的Dict差不多。



映射是一种使用非常广泛的类型，经常在合约中充当一个类似数据库的角色，比如在代币合约中用映射来存储账户的余额，在游戏合约里可以用映射来存储每个账号的级别，如：

```
mapping(address => uint) public balances;
mapping(address => uint) public userLevel;

```

映射的定义为`mapping(KeyType => ValueType)`， `KeyType` 表示键的类型，`ValueType` 表示键的类型。

我们可以通过键来获取到对应的值，例如：`balances[userAddr]`  用来获取某个地址的余额，访问形式很类似于通过下标来获取某个数组元素的值。 

类似的，给某个键赋值也是一样，下面是一段示例代码:

```solidity
pragma solidity >=0.8.0;

contract testMapping {
    mapping(address => uint) public balances;

    function update(uint newBalance) public {
      // highlight-next-line
        balances[msg.sender] = newBalance;
    }
    
    function get(address key) public view returns(uint) {
        return balances[key];
    }
}

```





## 映射特性与限制

1. 映射变量只能保存在存储中（`storage`），通常作为状态变量。

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

   ```solidity
   pragma solidity >=0.8.0;
   contract MappingExample {
         struct Funder {
           address addr;
           uint amount;
       } 
   
   		// highlight-next-line
       mapping (uint => Funder) idFunders;
       // highlight-next-line
       mapping (Funder => uint) funderIds;     // 错误， Key 不可以是结构体
   }
   ```

   



3. Solidity 里的映射是没有长度的，也没有键集合或值集合的概念，因此是没法对映射进行遍历。

   

```solidity
pragma solidity >=0.8.0;
contract MappingExample {
    mapping(address => uint)  balances; 

	  function length() public view returns(uint) {
	      // highlight-next-line
        return balances.length;  // 错误
    }
}
```



4. 映射是可以嵌套的， 嵌套映射是指映射的 Value 是另一个映射， 例如：

   ```solidity
   contract testMapping {
   	  // highlight-next-line
       mapping(address => mapping(address => uint)) tokenBalances; 
   }
   ```
   
   例如，我们一个合约里存了多种 Token， 我们可能就需要使用如上 `tokenBalances` 来保存每个用户在每个 token 上的余额。



### 映射访问器

对于状态变量标记为`public`的映射类型，编译器生成的访问器和数组一致，参数是键类型，返回值类型。

```solidity
mapping (uint => uint) public idScore;
```

会类似这样的访问器函数：

```solidity
function idScore(uint i) external returns (uint) {
   return idScore[i];
}
```

一个稍微复杂一些的例子，以下是一个嵌套映射 ：

```solidity
pragma solidity >0.8.0;
contract Complex {
    struct Data {
        uint a;
        bytes3 b;
        mapping (uint => uint) map;
    }
    mapping (uint => mapping(bool => Data[])) public data;
}
```

public 的 `data` 变量会生成以下访问器函数：

```solidity
function data(uint arg1, bool arg2, uint arg3) external returns (uint a, bytes3 b) {
    a = data[arg1][arg2][arg3].a;
    b = data[arg1][arg2][arg3].b;
}
```



## Solidity 数组 vs 映射

有时候，我们既可以使用数组存数据，有可以使用映射。

Solidity 数组更适合数据迭代（例如，使用 for 循环），而基于一个已知的键来获取值时，映射更适合（即不需要迭代获得数据）。

与从映射中获取数据相比，在 Solidity 中对数组进行迭代相对来说Gas消耗更大，而且尽量不要让数组太大。

## 可迭代映射

有时候，可能希望在智能合约中对映射进行迭代或者计算映射长度，这时可以可以创建一个键的数组，例如：

```solidity
pragma solidity >=0.8.0;

contract IterableMapping {
    mapping(address => uint) public balances; 
    address[] users;
    

	  function length() public view returns(uint) {
        return users.length; 
    }

    function insert(address key, uint value) public {
        balances[key] = value;
        users.push(key);
    }

}
```

Solidity 中有一个更复杂的[可迭代的映射的例子](https://learnblockchain.cn/docs/solidity/types.html#iterable-mappings)。

不过这种实现的可迭代映射， Gas 成本较高，还有另一个方式是使用 mapping 来实现一个链表，用链表来保存下一个元素来进行迭代（我比较推荐的实现）。

```solidity
pragma solidity >=0.8.0;

contract IterableMapping {
    mapping(address => uint) public balances; 
    mapping(address => address) public nextUser; 
    
    address constant GUARD = address(1);
    
    // 如果需要长度的话
    uint public listSize;
    
    function insert(address key, uint value) public {
        balances[key] = value;
        
        // 元素插入链表
        nextUser[key] = nextUser[GUARD];
        nextUser[GUARD] = key;
        listSize ++;
    }
    
}
```

如果有兴趣了解更多链表实现细节， 例如如何删除、迭代等，可以参考[专栏](https://learnblockchain.cn/column/1) 的[编写 O(1) 复杂度的可迭代映射](https://learnblockchain.cn/article/1632)。



## 小结

提炼本节的重点：映射类型是一种键值对的映射关系存储结构，映射类型变量只能保存在存储中， 且映射本身不支持迭代，不能获取长度。

我们也介绍了几种方法来实现可迭代映射。



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
