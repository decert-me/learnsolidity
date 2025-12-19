## 结构体定义

Solidity 使用 `struct` 关键字来定义一个自定义组合类型， 例如我们定义一个Person 结构体：

```solidity
struct Person {
    address account;
    bool gender;
    uint8 age;
}
```

`Person` 包含了3个成员，同时需要为每个成员定义其类型。 除可以使用基本类型作为成员以外，还可以使用[数组](./8_array.md)、结构体、[映射](./10_mapping.md)作为成员， 下面是一个更复杂的定义：

```solidity
struct School {
    Person[] cts;
    mapping(uint=>Person) indexs;
}


struct Student {
    string name;
    mapping(string=>uint) score;
    int age;
}
```

当时，不能在声明一个结构体的同时将自身结构体作为成员，如以下代码无法通过编译：

```solidity
struct Person {
    address account;
    bool gender;
    uint8 age;
    Person child;  //  错误
}
```

原因是这样的：EVM 会为结构体的成员会分配在一个连续的存储空间，如果结构体包含了自身， EVM 就无法确定存储空间的大小。



但是如果结构体有数组成员是结构体自身或 [映射](10_mapping.md)的值类型是结构体自身，是合法的定义（尽管编写程序时强烈不推荐这么做），如以下定义是合法的：

```solidity
struct Person {
        address account;
        bool gender;
        uint8 age;
        mapping(string=>Person) childs;  // 或  Person[]  manyChilds; 
    }
```

这个是为什么呢？这个是因为[变长的数据会单独分配存储槽](https://learnblockchain.cn/docs/solidity/internals/layout_in_storage.html#id2)（而不是连续的方式存储）， 在结构体中变长的数据只会有一个固定的存储槽来保存数据指向位置。因此当结构体用有一个变长的数据（即使包含自身）也不会影响 EVM 为结构体分配存储空间。



## 结构体变量声明与赋值

结构体是一个引用类型， 因此我们在声明变量的时候，需要标识变量的存储位置。

结构体变量声明及赋值有以下几个方式。

（1）仅声明变量而不赋值，此时会使用默认值创建结构体变量，例如：

```solidity
pragma solidity ^0.8.0;
contract testStruct {
  struct Person {
    address account;
    bool gender;
    uint8 age;
  }
  
  // 声明变量而不初始化
  // highlight-next-line
  Person person;   // 默认为storage
}
```

（2）按成员顺序（结构体声明时的顺序）赋值，例如：

```solidity
// 只能作为状态变量这样使用
Person person = Person(address(0x0), false, 18) ;
// 在函数内声明
Person memory person = Person(address(0x0), false, 18) ;
```

赋值时需要注意参数的类型、顺序的匹配。



（3）具名方式赋值。

使用具名方式可以不按成员定义的顺序赋值：

```solidity
// 使用具名变量初始化
Person person = Person({account: address(0x0), gender: false, age: 18}) ;

//在函数内声明
Person memory person =  Person({account: address(0x0), gender: false, age: 18}) ;
```



（4）以更新成员变量的方式给结构体变量赋值

```solidity
    Person person;
    // 在函数内
    function updatePersion() public {
        person.account = msg.sender;
        person.gender = true;
        person.age = 12;
    }
```





## 结构体访问器

`public` 状态变量，编译器会帮我们生成访问器函数， 如果是`public`的结构体变量，生成访问器函数没有参数，返回一个元组，元组对应结构体的成员。

例如，我们在Remix 可以部署以下合约：

```SolidityEditor
contract testStruct{

    struct Person {
        address account;
        bool gender;
        uint8 age;
    }

    Person public person = Person(address(0x1), true, 18) ;

}
```

编译器会生成类似的函数：

```solidity
  function person() external view returns (address account, bool gender, uint8 age) {
      return (person.account, person.gender, person.age);
  }
```

我们可以调用 `person()` 函数获得各成员的值。

以下我在Remix 调用示例：

![image-20230627231831537](https://img.learnblockchain.cn/pics/20230627231832.png)





## 小结

提炼本节的重点：结构体是一个用户自定义类型，是通过讲多个类型复合成一个新的类型。

定义好结构体类型之后，就可以用这个自定义类型声明变量并赋值，我们介绍了4 种赋值方法。



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
