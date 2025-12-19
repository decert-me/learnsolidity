
和大多数语言一样， 在一个类型后面加上一个`[]`，就构成一个数组类型，表示可以存储一组该类型的值。

数组类型是一个[引用类型](https://learnblockchain.cn/article/22531)，在申明一个引用类型的变量，需要指定该变量的位置。

## 定义数组类型变量

数组类型有两种：固定长度的数组和动态长度的数组， 如：

```solidity
contract testArray {
    // 状态变量缺省位置为 storage 
    uint [10] tens; // 固定长度的数组
    uint [] numbers;  // 动态长度的数组
    
    // 作为参数，使用 calldata 
    function copy(uint[] calldata arrs) public {
        numbers = arrs;  //  赋值时，不同的数据位置的变量会进行拷贝。 
    }
    
    // 作为参数，使用 memory 
    function handle(uint[] memory arrs) internal {
    }
}
```



若元素类型为T，声明为T [k]， 表示固定长度为k的数组，类似的还可以有：`address [10] admins`， 此时 admins 最多有10个地址。
若元素类型为T，声明为T []， 表示动态长度的数组，类似的还可以有： `address [] admins`。

## 数组类型初始化

可以在数组声明时进行初始化：

```solidity
contract testArray {
    uint [] public u = [1, 2, 3];
    string[4] adaArr = ["This", "is", "an", "array"];
}
```

数组还可以用new关键字进行声明，创建基于运行时长度的内存数组，实例如下：

```solidity
contract testArray {
    uint[] arr1 = new uint[](1);

  // 函数内
	function test(uint len) public {
        // 在内存中，
        uint[] memory c = new uint[](len);      
        string[4] memory adaArr = ["This", "is", "an", "array"];
	}

}

```

使用 new 创建内存数组时，会根据长度在内存中分配相应的空间。

但是如果变量是在存储中（如 `arr1`），则表示分配一个起始空间，在之后运行过程中可以扩展该空间。

## 数组访问

数组通过下标进行访问，序号是从0开始的。例如，访问第1个元素时使用tens[0]，对某元素赋值，即tens[0] = 1， 固定长度的数组只能通过下标访问方式赋值。

```SolidityEditor
contract testArray {
    uint[10] tens; 
    function modifyOnTens(uint x) public {
        tens[0] = x;
        // tens.push(x);  // 错误;
	  }
}
```



Solidity 也支持多维数组。例如，声明一个类型为uint、长度为5的变长数组（5个元素都是变长数组），则可以声明为uint[][5]。要访问第3个动态数组的第2个元素，使用`x[2][1]`即可。访问第三个动态数组使用x[2]，数组的序号是从0开始的，序号顺序与定义相反。

> 注意，定义多维组和很多语言里顺序不一样，如在Java中，声明一个包含5个元素、每个元素都是数组的方式为`int[5][]`。





## 数组访问器

`public` 状态变量，编译器会帮我们生成访问器函数， 如果是`public`的数组变量，生成访问器函数有一个参数，参数是访问数组的下标索引。

例如，我们在Remix 可以部署以下合约：

```SolidityEditor
contract testArray {
    uint [] public arr = [1, 2, 3];
}
```

编译器会生成类似的函数：

```solidity
  function arr(uint i) external view returns (uint) {
      return arr[i];
  }
```

我们可以调用 `arr(uint i)` 函数获得某个元素的值。

![solidity-数组](https://img.learnblockchain.cn/pics/20230627222009.png!decert.logo.water)



一维数组的访问器函数有一个参数， 如果是多维数组，会有多个参数。 并且返回数组的一个元素。



如果我们要返回整个数据， 需要额外添加函数，如：

```solidity
  // 返回整个数组
  function getArray() external view returns  (uint[] memory) {
      return arr;
  }
```



## 数组成员

数组类型可以通过成员属性内获取数组状态以及可以通过成员函数来修改数组的状态，这些成员有：

- `length`属性：表示当前数组的长度（只读属性：不能通过修改 length 属性来更改数组的大小）。 如果是new创建的内存数组，一经创建长度就固定了，不可以修改。 
- `push()`：用来添加新的零初始化元素到数组末尾，并返回元素的引用，以便修改元素的内容，如：`x.push().t = 2`或`x.push() = b`，push方法只对存储（storage）中的动态数组有效。
- push(x)：用来添加给定元素到数组末尾。push(x) 没有返回值，方法只对存储（storage）中的动态数组有效。
- `pop()`：用来从数组末尾删除元素，数组的长度减1，会在移除的元素上隐含调用delete，释放存储空间（及时释放不使用的空间，可以节约gas）。pop()没有返回值，pop()方法只对存储（storage）中的动态数组有效。



自己演练一个，多次调用add后，查看`arr1`的长度：

```SolidityEditor
contract testArray {
    // storage 位置
    uint[] public arr1 = new uint[](1); 
    
    function add(uint x) public {
        arr1.push(x);
	  }

    function arr1Len() public view  returns (uint len) {
        return arr1.length;
	  }
}
```



## 数组切片

如果数组是在calldata 数据位置，可以使用数组切片来获取数组的连续的一个部分。

用法是：`x[start:end]` ， `start` 和 `end`是`uint256`类型（或结果为uint256的表达式），`x[start:end]` 的第一个元素是`x[start]`， 最后一个元素是`x[end - 1]`。`start`和`end`都可以是可选的：`start`默认是0，而end默认是数组长度。 如果`start`比`end`大或者end比数组长度还大，将会抛出异常。



如使用以下方法获得了[函数选择器](../solidity-adv/selector.md)。

```solidity

contract testArr {
    function forward(bytes calldata payload) external {
        bytes4 sig = bytes4(payload[:4]);  // 获得函数选择器
    }
}

```



 

## 关注数组 Gas 消耗

使用数组看起来很简单，大多数语言用法几乎，在其他语言中，我们不太关注执行的效率，但在智能合约中效率问题会突出，你能看出下面代码有什么问题吗？

```solidity
contract testArray {
    uint [] numbers;
    uint total;

    function addItem(uint x) public {
        numbers.push(x);
	  }

    function sum() public {
        uint len = numbers.length;
        for (uint i = 0; i < len; i++) {
            total += numbers[i];
        }
    }
}
```

先想一想...

...

分析问题：`sum()` 函数的gas消耗是随着`numbers` 元素线性增长的，如果`numbers` 元素非常多，`sum()` 消耗 gas 会超过区块 gas 限制而无法执行。 

常见的解决方法有：

1. 将非必要的计算转移到链下进行。
2. 想办法控制数组的长度。
3. 想方法分段计算，让每段的计算工作量 Gas 可控。

以下是分段计算的一个可能的解决方法：

```solidity
contract testArray {
    uint [] numbers;
    uint total;
    uint calced;  // 保存计算的到哪个位置了
    
    function sum(uint end) public {
        if (end > calced) {
            for (uint i = calced; i < end; i++) {
                total += numbers[i];
            }
            calced = end;
        }
    }
}
```



再次提醒， 在使用数组时，一定要避免数组遍历出现 gas 问题。

登链社区的 [Solidity 专栏](https://learnblockchain.cn/column/1) 有更多关于列表、数组的 gas 使用技巧。 



## 如何高效移除数组元素

首先，如非必要，不建议删除数组的元素。

如果一定要删除元素，那么要避免元素的移动， 而是把最后一个元素移动到删除元素那个位置， 例如：

```solidity
    // 移除元素推荐操作
    function remove(uint index) public {
        uint len = numbers.length;
        if (index == len - 1) {
            numbers.pop();
        } else {
            numbers[index] = numbers[len - 1];
            numbers.pop();
        }
    }
```





## string 和 bytes

还有两个特殊的数组类型：**string** 和 **bytes ** 。

`string` 是一个字符串，可以认为是一个字符数组， `string` 不支持数组的 `push` `pop` 方法。

`bytes` 是动态分配大小字节的数组，类似于byte[]，但是bytes的gas费用更低。bytes 也可以用来表达字符串， 但通常用于原始字节数据。bytes 支持数组的 `push` `pop` 方法。



**string** 和 **bytes **的声明几乎是一样的，形式如下：

```solidity
contract testStringBytes {
    bytes bs;
    bytes bs0 = "12abcd";
    bytes bs1 = "abc\x22\x22";   // 十六进制数
    bytes bs2 = "Tiny\u718A";   // 718A为汉字“熊”的Unicode编码值

    string str1 = "TinyXiong";

    string name;
    function setName(string calldata _name) public {
        name = _name;
	}
}
```

**注意**：bytes和string 都不支持用下标索引进行访问某个元素。

字符串s通过`bytes(s)`转为一个bytes，通过下标访问`bytes(s)[i]`获取到的不是对应字符，而是获取对应的UTF-8编码。比如中文的编码是变长的多字节，因此通过下标访问中文字符串得到的只是其中的一个编码。

如果使用一个长度有限制的字节数组，应该使用一个`bytes1`到`bytes32`的具体类型，因为它们占用空间更少，消耗的gas更低。



Solidity 语言本身提供的`string`功能比较弱，并没有提供一些实用函数，如获取字符串长度、获得子字符串、大小写转换、字符串拼接等函数。这些功能有第三方的库实现，在使用时，我们要心理有数：Solidity 处理字符串是gas不够高效的。

 

## 小结

提炼本节的重点：数组类型风为固定长度数组和动态长度的数组，固定长度数组多用于内存中，且只能通过下标赋值，动态大小数组支持`push`、`pop` 操作。

在遍历数组一定要必要出现 gas 问题，分段遍历或控制数组的长度都是可行的办法。



另外 **string** 和 **bytes ** 也是特殊的数组，但是功能上有一些限制。



\------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。


DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
