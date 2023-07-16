# 错误处理

## 什么是错误处理

错误处理是指在程序发生错误时的处理方式，在EVM中和在程序中提到错误处理时，他们的含义并不完全相同。

### EVM 中错误处理

EVM 处理错误和我们常见的语言（如Java、JavaScript等）不一样，当 EVM 在执行时遇到错误，例如：访问越界的数组，除0等，EVM 会回退（revert）整个交易，当前交易所有调用（包含子调用）所改变的状态都会被撤销，因此不是出现部分状态被修改的情况。

在以太坊上，每个交易都是原子操作，在数据库里事务（transcation）一样，要么保证状态的修改要么全部成功，要么全部失败。



### 程序中错误处理

在合约代码中进行错误处理，主要指的是通过各种条件的检查，针对不符合预期的情况，进行错误捕获或抛出错误。

如果在程序中抛出了错误，不论是我们程序抛出的错误，或者是出现程序未处理的情况，EVM 都会回滚交易。

本节我们主要是介绍如何在合约程序中进行错误处理，我们会介绍一些检查条件的方法，如何定义错误，抛出错误，以及捕获错误。



## 定义错误 Error 





## 用 assert() 和 require() 进行错误检查

Solidity提供了两个函数assert()和require()来进行条件检查，并在条件不满足时抛出异常。

assert函数通常用来检查（测试）内部错误（发生了这样的错误，说明程序出现了一个bug），而require函数用来检查输入变量或合约状态变量是否满足条件，以及验证调用外部合约的返回值。另外，如果我们正确使用assert函数，那么有一些Solidity分析工具可以帮我们分析出智能合约中的错误。

还有另外一个触发异常的方法：使用revert函数，它可以用来标记错误并恢复当前的调用。

详细说明以下几个函数。

- assert(bool condition)：如果不满足条件，会导致无效的操作码，撤销状态更改，主要用于检查内部错误。
- require(bool condition)：如果条件不满足，则撤销状态更改，主要用于检查由输入或者外部组件引起的错误。
- require(bool condition, string memory message)：如果条件不满足，则撤销状态更改，主要用于检查由输入或者外部组件引起的错误，可以同时提供一个错误消息。
- revert()：终止运行并撤销状态更改。
- revert(string memory reason)：终止运行并撤销状态更改，可以同时提供一个解释性的字符串。

其实我们在前面介绍函数修改器的时候已经使用过require， 再通过一个示例代码来加深印象：

```solidity
pragma solidity >=0.5.0 ;


contract Sharer {
    function sendHalf(address addr) public payable returns (uint balance) {
        require(msg.value % 2 == 0, "Even value required.");
        uint balanceBeforeTransfer = this.balance;
        addr.transfer(msg.value / 2);
//由于转移函数在失败时抛出异常并且不能在这里回调，因此我们应该没有办法仍然有一半的钱
        assert(this.balance == balanceBeforeTransfer - msg.value / 2);
        return this.balance;
    }
}
```

在EVM里， 处理assert和require两种异常的方式是不一样的，虽然它们都会回退状态，不同点表现在：

（1）gas消耗不同。assert类型的异常会消耗掉所有剩余的gas，而require不会消耗掉剩余的gas（剩余gas会返还给调用者）。

（2）操作符不同。

当发生assert类型的异常时，Solidity会执行一个无效操作（无效指令0xfe）。当发生require类型的异常时，Solidity会执行一个回退操作（REVERT指令0xfd）。由此，我们可以知道，这两行代码等价的：

```solidity
if(msg.sender != owner) { revert(); }
require(msg.sender == owner);
```

下列情况将会产生一个assert式异常。

- 访问数组的索引太大或为负数（例如x[i]其中的i >= x.length或i < 0）。
- 访问固定长度bytesN的索引太大或为负数。
- 用零当除数做除法或模运算（例如 5 / 0 或 23 % 0 ）。
- 移位负数位。
- 将一个太大或负数值转换为一个枚举类型。
- 调用内部函数类型的零初始化变量。
- 调用assert的参数（表达式）最终结算为false。

下列情况将会产生一个require式异常。

- 调用require的参数（表达式）最终结算为false。
- 通过消息调用调用某个函数，但该函数没有正确结束（它耗尽了gas，没有匹配函数，或者本身抛出一个异常），上述函数不包括低级别的操作call、send、delegatecall、staticcall。低级操作不会抛出异常，而通过返回false来指示失败。
- 使用new关键字创建合约，但合约创建没有正确结束（请参阅上条有关”未正确结束“的解释）。
- 执行外部函数调用的函数不包含任何代码。
- 合约通过一个没有payable修饰符的公有函数（包括构造函数和fallback函数）接收Ether。
- 合约通过公有getter函数接收Ether 。
- .transfer()失败。

##  require还是assert?

以下是一些关于使用require还是assert的经验总结。

这些情况优先使用require()： 

（1）用于检查用户输入。

（2）用于检查合约调用返回值，如`require(external.send(amount))`。

（3）用于检查状态，如`msg.send == owner`。 

（4）通常用于函数的开头。 

（5）不知道使用哪一个的时候，就使用require。

这些情况优先使用assert()： 

（1）用于检查溢出错误，如`z = x + y ; assert(z >= x);`。 

（2）用于检查不应该发生的异常情况。 

（3）用于在状态改变之后，检查合约状态。 

（4）尽量少使用assert。 

（5）通常用于函数中间或结尾。

###  try/catch 

Solidity 0.6版本之后，加入try……catch……来捕获外部调用的异常，让我们在编写智能合约时，有更多的灵活性， 例如try/catch结构在以下场景有很有用。

- 如果一个调用回滚（revert）了，我们不想终止交易的执行。
- 我们想在同一个交易中重试调用、存储错误状态、对失败的调用做出处理等。

在 Solidity 0.6之前，模拟 try/catch仅有的方式是使用低级的调用，如call、delegatecall和staticcall，这是一个简单的示例，在Solidity 0.6之前实现某种try/catch。 

```solidity
pragma solidity <0.6.0;
contract OldTryCatch {
    function execute(uint256 amount) external {
        // 如果执行失败，低级的call会返回false
        (bool success, bytes memory returnData) = address(this).call(
            abi.encodeWithSignature(
                "onlyEven(uint256)",
                  amount
            )
        );
        if (success) {
            // handle success            
        } else {
            // handle exception
        }
    }
    function onlyEven(uint256 a) public {
        // Code that can revert
        require(a % 2 == 0, "Ups! Reverting");
        // ...
    }
}
```

当调用execute(uint256 amount)，输入的参数amount会通过低级的call调用传给onlyEven(uint256)函数，call调用会返回布尔值作为第一个参数来指示调用的成功与否，而不会让整个交易失败。不过低级的call调用会绕过一些安全检查，需要谨慎使用。

在最新的编译器中，可以这样写： 

```solidity
function execute(uint256 amount) external {
    try this.onlyEven(amount) {
        ...
    } catch {
        ...
    }
}
```

注意，try/catch仅适用于外部调用，因此上面调用this.onlyEven()，另外try大括号内的代码块是不能被catch本身捕获的。 

```solidity
function callEx() public {
    try externalContract.someFunction() {
        // 尽管外部调用成功了，依旧会回退交易，无法被catch
        revert();
    } catch {
       ...
    }
}
```

#### try/catch 获得返回值

对外部调用进行try/catch时，允许获得外部调用的返回值，示例代码： 

```solidity
contract CalledContract {    
    function getTwo() public returns (uint256) {
        return 2;
    }
}


contract TryCatcher {
    CalledContract public externalContract;


    function execute() public returns (uint256, bool) {


        try externalContract.getTwo() returns (uint256 v) {
            uint256 newValue = v + 2;
            return (newValue, true);
        } catch {
            emit CatchEvent();
        }
        
        // ...
    }
}
```

注意本地变量newValue和返回值只在try代码块内有效。类似地，也可以在catch块内声明变量。

在catch语句中也可以使用返回值，外部调用失败时返回的数据将转换为bytes，catch中考虑了各种可能的revert原因，不过如果由于某种原因转码bytes失败，则try/catch也会失败，会回退整个交易。

catch语句中使用以下语法： 

```
contract TryCatcher {
    
    event ReturnDataEvent(bytes someData);
    
    // ...


    function execute() public returns (uint256, bool) {


        try externalContract.someFunction() {
            // ...
        } catch (bytes memory returnData) {            
            emit ReturnDataEvent(returnData);
        }
    }
}
```

#### 指定 catch 条件子句

Solidity的try/catch也可以包括特定的catch条件子句。 例如： 

```solidity
contract TryCatcher {
    
    event ReturnDataEvent(bytes someData);
    event CatchStringEvent(string someString);
    event SuccessEvent();
    
    // ...


    function execute() public {


        try externalContract.someFunction() {
            emit SuccessEvent();
        } catch Error(string memory revertReason) {
            emit CatchStringEvent(revertReason);
        } catch (bytes memory returnData) {
            emit ReturnDataEvent(returnData);
        }
    }
}
```

如果错误是由require(condition，"reason string")或revert("reason string")引起的，则错误与catch Error(string memory revertReason)子句匹配，然后与之匹配代码块被执行（就是紧接的大括号内的代码）。在任何其他情况下（例如 assert失败），都会执行更通用的catch(bytes memory returnData)子句。

注意：catch Error(string memory revertReason)不能捕获除上述两种情况以外的任何错误。 如果我们仅使用它（不使用其他子句），最终将丢失一些错误。通常需要将catch或catch(bytes memory returnData)与catch Error(string memory revertReason)一起使用，以确保我们涵盖了所有可能的revert原因。

在一些特定的情况下，如果catch Error(string memory revertReason)解码返回的字符串失败，catch(bytes memory returnData)（如果存在）将能够捕获它。 

#### 处理 out-of-gas 失败

首先要明确，如果交易没有足够的gas执行，则out of gas错误是不能捕获到的。

在某些情况下，我们可能需要为外部调用指定gas，因此即使交易中有足够的gas，如果外部调用的执行需要的gas比我们设置的多，内部out of gas错误可能会被低级的catch子句捕获。

```solidity
pragma solidity <0.7.0;
contract CalledContract {
    function someFunction() public returns (uint256) {
        require(true, "This time not reverting");
    }
}


contract TryCatcher {
    event ReturnDataEvent(bytes someData);
    event SuccessEvent();
    CalledContract public externalContract;
    constructor() public {
        externalContract = new CalledContract();
    }
    
    function execute() public {
 // 设置gas为20
        try externalContract.someFunction.gas(20)() {
            // ...
        } catch Error(string memory revertReason) {
            // ...
        } catch (bytes memory returnData) {
            emit ReturnDataEvent(returnData);
        }
    }
} 
```

当gas设置为20时，try调用的执行将用掉所有的gas，最后一个catch语句将捕获异常：catch (bytes memory returnData)。 如果将gas设置为更大的量（例如2000），执行try块将会成功。