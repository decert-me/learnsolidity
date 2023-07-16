# 使用整型

和大多数语言一样，但我们要表达一个数值时，通常用整型（这种数据类型）来表达。

## uint/int

用 int/uint 表示有符号和无符号不同位数整数。支持关键字`uint8`到`uint256` ，`uint`和`int`默认对应的是`uint256` 和`int256`。

关键字末尾的数字以8步进，表示变量所占空间大小，整数取值范围跟空间有关， 比如`uint32`类型的取值范围是 0 到 `2^32-1`(2的32次方减1)。



之前我们的Counter 合约里就定义了一个 `uint` 变量`counter`：

```solidity
pragma solidity ^0.8.0;

contract Counter {
    uint public counter;
}
```



当没有为整型变量赋值时，会使用默认值 0。



:::tip

在 Solidity 0.8版本之前， 如果整数运算结果不在取值范围内，则会被溢出截断。 

从 0.8.0 开始，算术运算有两个计算模式：一个是 unchecked（不检查）模式，一个是”checked” （检查）模式。 

默认情况下，算术运算在 “checked” 模式下，即都会进行溢出检查，如果结果落在取值范围之外，调用会通过 [失败异常](https://learnblockchain.cn/docs/solidity/control-structures.html#assert-and-require) 回退。 你也可以通过 `unchecked { ... }` 切换到 “unchecked”模式，更多可参考文档 [unchecked](https://learnblockchain.cn/docs/solidity/control-structures.html#unchecked) 。

:::


:::info

当我们确定一个运算不会发生溢出时，使用 `unchecked` 模式，有更高的 GAS 效率。

:::


## 整型运算符


整型支持的运算符包括以下几种：


* 比较运算符： `<=`（小于等于）、<（小于） 、`==`（等于）、!=（不等于）、`>=`（大于等于）、>（大于）
* 位操作符： `&`（和）、|（或）、`^`（异或）、`~`（位取反） 
* 算术操作符：`+`（加号）、`-`（减）、-（负号），`*`，`/`,  %（取余数）, `**`（幂）
* 移位： `<<`（左移位）、 `>>`（右移位）



几点说明：

1. 整型变量除法总是会截断取整，但是整型常量不会截断。

2. 整数除 0 会抛出异常。

   



还可以通过变量的的类型，获取的取值范围，例如：对于整形 `X`，可以使用 `type(X).min` 和 `type(X).max` 去获取这个类型的最小值与最大值。


## 操练

### 关注溢出

大家操练一下以下代码，运行之前，先自己预测一下结果，看是否和运行结果不一样。

```SolidityEditor
pragma solidity ^0.8.0;
    
contract testInt {
    int8 a = -1;
    int16 b = 2;
    
    
    uint32 c = 10;
    uint8 d = 16;
    
    function add(uint x, uint y) public pure returns (uint z) {
        z = x + y;
    }
    
    function divide(uint x, uint y ) public pure returns (uint z) {
          z = x / y;
    }
    
    function leftshift(int x, uint y) public pure returns (int z){
        z = x << y;
    }
    
    function rightshift(int x, uint y) public pure returns (int z){
        z = x >> y;
    }
    
    function testPlusPlus() public pure returns (uint ) {
        uint x = 1;
        uint y = ++x; // c = ++a;
        return y;
    }
    
    function testMul1() public pure returns (uint8) {
       unchecked {
        uint8 x = 128;
        uint8 y = x * 2;
        return y;
       }
    }
    
    function testMul2() public pure returns (uint8) {
        uint8 x = 128;
        uint8 y = x * 2;
        return y;
    }
    
 }
```

  

尤其对比 `testMul1` 和 `testMul2` 。

`testMul1()` 的结果是0，而不是256，这是因为发生了溢出，溢出就像时钟一样，当秒针走到59之后，下一秒又从0开始。



![solidity - 整型溢出](https://img.learnblockchain.cn/pics/20230308190448.png)


`testMul2()` 调用则会失败（revert），如图：

![溢出回退](https://img.learnblockchain.cn/pics/20230308190731.png)



在 0.8.0 之前或者在 unchecked 模式下，我们都需要防止整型溢出问题，一个方法是对结果使用进行判断，防止出现异常值，例如：

```js

pragma solidity ^0.5.0;
function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);  // 做溢出判断，加法的结果肯定比任何一个元素大。
    return c;
}
```

### 关注 Gas

```
pragma solidity ^0.8.0;

contract testUintGas {
    uint z1;  
    function add_high_gas(uint x, uint y) public  {
        z1 = x + y;
    }

    uint z2;
    function add_less_gas(uint x, uint y) public  {
        unchecked {
            z2 = x + y;
        }
    }

}
```

前面提到，当我们确定一个运算不会发生溢出时，使用 `unchecked` 模式，有更高的 GAS 效率。

以下分别是 `add_high_gas` 和 `add_less_gas` 使用同样的参数消耗的Gas：



![solidity - 整型 gas](https://img.learnblockchain.cn/pics/20230608211624.png!decert.logo.water)



![solidity - 整型 gas](https://img.learnblockchain.cn/pics/20230608211553.png)

主要是对比 transaction cost 与 execution cost。
**transaction cost**： 是真实花费的gas， 对应着区块链浏览器中`gas_used`。

**execution cost**: 是纯粹函数执行的所需的 gas，不包含交易基础费用 21000， 也不包含交易calldata的费用。



## 小结


提炼本节的重点：整型是合约开发中使用最多的类型，使用也简单，当很多人容易忽视**整型运算的安全问题**（溢出，截断等），同时要注意在确定安全的情况下，使用 `unchecked` 来优化 GAS 消耗。


[中文 Solidity 文档 - 整型](https://learnblockchain.cn/docs/solidity/types.html#integers)

[英文 Solidity 文档 - 整型](https://docs.soliditylang.org/en/v0.8.19/types.html#integers)











