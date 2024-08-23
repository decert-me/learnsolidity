# Solidity 0.8.26 变更

## require 中的自定义错误支持

Solidity 中的自定义错误为用户提供了一种方便且高效的方式来解释操作失败的原因。Solidity 0.8.26 引入了一个备受期待的功能，使得可以在 require 函数中使用错误。

在 0.8.26 版本之前的 require 函数提供了两种重载：

*   require(bool)，将会回滚而不提供任何数据（甚至没有错误选择器）。
*   require(bool, string)，将会回滚并提供 Error(string)。

在这个版本中，我们引入了一个新的重载以支持自定义错误：

*   require(bool, error)，将会使用作为第二个参数提供的自定义用户错误进行回滚。

让我们通过一个例子来理解带有自定义错误的 require 函数的用法：

    // SPDX-License-Identifier: GPL-3.0
    pragma solidity ^0.8.26;
    
    /// 转账的余额不足。需要 `required` 但只有 `available` 可用。
    /// @param available 可用余额。
    /// @param required 请求转账的金额。
    error InsufficientBalance(uint256 available, uint256 required);
    
    // 这将只能通过 IR 编译
    contract TestToken {
        mapping(address => uint) balance;
        function transferWithRequireError(address to, uint256 amount) public {
            require(
                balance[msg.sender] >= amount,
                InsufficientBalance(balance[msg.sender], amount)
            );
            balance[msg.sender] -= amount;
            balance[to] += amount;
        }
        // ...
    }
    

请注意，就像之前可用的 require 重载一样，参数会无条件地进行评估，因此请特别注意确保它们不是具有意外副作用的表达式。例如，在 require(condition, CustomError(f())) 和 require(condition, f()) 中，对函数 f() 的调用将始终被执行，无论提供的条件是 true 还是 false。

请注意，目前仅支持通过 IR 管道使用 require 的自定义错误，即通过 Yul 进行编译。对于旧管道，请使用 if (!condition) revert CustomError(); 模式。
