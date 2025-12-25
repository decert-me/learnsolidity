在实际编程中，我们经常需要将多个相关的数据组合在一起，形成一个复合类型。例如，描述一个人需要姓名、年龄、地址等多个属性。[Solidity](https://learnblockchain.cn/course/93) 提供了结构体（Struct）来实现这种需求。

结构体允许我们创建自定义的复合类型，将不同类型的数据组合成一个新的类型，使代码更加清晰和易于维护。

本章你将学到：
- 如何定义结构体
- 结构体变量的声明和赋值方法
- 结构体的访问器函数

## 结构体定义

[Solidity](https://learnblockchain.cn/course/93) 使用 `struct` 关键字来定义一个自定义组合类型。例如我们定义一个 Person 结构体：

```solidity
struct Person {
    address account;
    bool gender;
    uint8 age;
}
```

`Person` 包含了3个成员，同时需要为每个成员定义其类型。 除可以使用基本类型作为成员以外，还可以使用[数组](https://learnblockchain.cn/article/22565)、结构体、[映射](https://learnblockchain.cn/article/22552)作为成员， 下面是一个更复杂的定义：

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

原因是这样的：EVM 会为结构体的成员会分配在一个连续的存储空间，如果结构体包含了自身， [EVM](https://learnblockchain.cn/tags/EVM?map=EVM) 就无法确定存储空间的大小。



但是如果结构体有数组成员是结构体自身或 [映射](https://learnblockchain.cn/article/22552)的值类型是结构体自身，是合法的定义（尽管编写程序时强烈不推荐这么做），如以下定义是合法的：

```solidity
struct Person {
        address account;
        bool gender;
        uint8 age;
        mapping(string=>Person) childs;  // 或  Person[]  manyChilds; 
    }
```

这个是为什么呢？这个是因为[变长的数据会单独分配存储槽](https://learnblockchain.cn/docs/solidity/internals/layout_in_storage.html#id2)（而不是连续的方式存储）， 在结构体中变长的数据只会有一个固定的存储槽来保存数据指向位置。因此当结构体用有一个变长的数据（即使包含自身）也不会影响 [EVM](https://learnblockchain.cn/tags/EVM?map=EVM) 为结构体分配存储空间。



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

- **结构体定义**：使用 `struct` 关键字定义自定义复合类型，将多个类型组合成一个新的类型
- **成员类型**：可以使用基本类型、数组、映射、其他结构体作为成员
- **自引用限制**：结构体不能直接包含自身作为成员，但可以包含自身类型的数组或映射
- **赋值方法**：支持 4 种赋值方式（默认值、按顺序、具名、逐个成员赋值）
- **访问器**：public 结构体变量会生成访问器函数，返回所有成员的元组

结构体是组织复杂数据的重要工具。合理使用结构体可以让[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)的数据结构更加清晰，代码更易维护。

### 进阶学习

想了解更多关于结构体的知识，可以参考：

- [存储布局](https://learnblockchain.cn/article/22620) - 学习结构体在 storage 中的存储方式
