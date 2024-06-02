# 代理合约

## 简介

代理合约是一种特定类型的智能合约，其主要作用是作为其他合约的代表或中介。这些代理合约允许用户通过它们与区块链进行直接交互，同时管理一个指向实际执行逻辑的实现合约（也称为逻辑合约）的指针。通过此机制，即使底层业务逻辑发生变化，用户与区块链的交互方式也能保持一致。


## 代理合约的作用：

1. 可升级性

    区块链上一旦部署的合约代码是不可改变的，这意味着无法直接修改合约中的错误。通过使用代理合约，开发者可以简单地更新指向一个新的、已修改的逻辑合约，从而不需要更改原有代理合约的情况下更新智能合约逻辑。

    例如，如果发现原合约中存在安全隐患，通过更换逻辑合约可以快速响应，修复漏洞。
2. 节省成本

    在以太坊网络上部署新的智能合约通常需要消耗大量的 gas。在一些应用中，如代币发行，可能需要为每个新项目部署一个新的合约。如果每个合约都有类似的功能，这将导致巨大的 gas 费用。

    可以为所有项目只部署一个代币逻辑合约，并部署轻量级的代理合约，指向同一逻辑合约。这样，每个代理合约的部署成本都会比完整功能合约要低得多，从而大量节约 gas。

## 基本原理及组件

1. 代理合约:
	- 用户实际上是在与代理合约进行交互
	- 代理合约管理自身的状态变量
	- 代理合约通常包含一个指向逻辑合约的地址变量
2. 逻辑合约:
	- 负责业务逻辑的实现
	- 可以升级而不影响由代理合约维护的数据。例如，可以更新计算公式或增加新的功能，而不改变用户的数据结构

## 实现步骤

1. 创建逻辑合约

    首先，开发者需要编写一个包含实际业务逻辑的合约，比如：

   ```
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    contract Logic{
        address public logicAddress; // 没用上，但是这里占位是为了防止存储冲突
        uint public count;

        function incrementCounter() public {
            count += 1;
        }

        function getCount() public view returns (uint) {
            return count;
        }
    }
   ```
    注意合约中的状态变量`logicAddress`，是为了避免与`Proxy`合约存储冲突，下面会介绍。
2. 编写代理合约

    在代理合约中，任何非直接调用的函数都会通过`fallback`函数被重定向并使用`delegatecall`在逻辑合约上执行。这种机制允许代理合约借用逻辑合约的代码进行操作，但是在自己的存储上下文中执行。

    代码示例如下
   ```
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    import "@openzeppelin/contracts/access/Ownable.sol";

    contract Proxy {
        address public logicAddress;
        uint public count;

        constructor(address _logic) {
            logicAddress = _logic;
        }

        // should be restricted to admin
        function upgradeLogic(address _newLogic) public {
            logicAddress = _newLogic;
        }

        fallback() external payable {
            _fallback(logicAddress);
        }

        receive() external payable {
            _fallback(logicAddress);
        }

        function _fallback(address logic) internal {
            // 通过 delegatecall 调用逻辑合约的函数，并返回数据
            assembly {
                // Copy msg.data. We take full control of memory in this inline assembly
                // block because it will not return to Solidity code. We overwrite the
                // Solidity scratch pad at memory position 0.
                calldatacopy(0, 0, calldatasize())

                // Call the implementation.
                // out and outsize are 0 because we don't know the size yet.
                let result := delegatecall(gas(), logic, 0, calldatasize(), 0, 0)

                // Copy the returned data.
                returndatacopy(0, 0, returndatasize())

                switch result
                // delegatecall returns 0 on error.
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
            }
        }
    }
   ```

3. 合约部署与使用:
	- 部署逻辑合约，并记下其地址
	- 使用逻辑合约的地址作为参数，部署代理合约
	- 通过代理合约地址调用逻辑合约的功能

当需要升级合约时，只需部署新的逻辑合约并更新代理合约中的逻辑合约地址。这允许合约升级而不丢失任何现有数据。

[图]()

安全考虑

- 权限控制：确保只有可信的地址（如合约的拥有者或管理员）可以更新逻辑合约地址
- 数据和代码分离：正确处理存储布局和逻辑实现的分离，防止存储冲突


## Delegate Call 和 存储冲突 

在 Solidity 中，`delegatecall`是一种特殊的函数调用，使得一个合约（比如代理合约）能够调用另一个合约（比如逻辑合约）的函数，并在代理合约的存储环境中执行这些函数。尽管执行的代码来自于逻辑合约，状态变量的更新和存储操作却完全在代理合约的存储结构中进行。

然而，这也带来了存储冲突的风险。存储冲突主要发生在逻辑合约和代理合约的存储布局不匹配的情况下。为了理解这种冲突，下面详细描述两种可能的场景：

场景1：存储布局不一致

在示例中，代理合约 Proxy 和逻辑合约`Logic`都有自己的状态变量。 但是，这两个合约的状态变量必须严格按照相同的顺序和类型声明，以确保每一个状态变量都映射到相同的存储位置。

假设逻辑合约`Logic`中先声明的是`uint public count;`，而代理合约 Proxy 中先声明的是`address public logicAddress;`。这种情况下，当`Proxy`使用`delegatecall`调用`Logic`中的`incrementCounter()`方法时，它本意是修改`count`的值，但由于存储布局的不匹配，实际上它会错误地改变代理合约`logicAddress`的存储位置的内容。如下所示：


| Proxy                  | Logic                 |                     |
|  ----                  | ----                  | ----                |
| address logicAddress   | uint256 count         | <=== 存储冲突        |
| uint256 count          | address not_used      |                     |


场景2：升级导致的冲突

即使最初的存储布局是匹配的，合约升级也可能引入新的存储冲突。

假设`Logic`合约在某次升级中添加了新的状态变量或者改变了变量的顺序。如果新的逻辑合约被代理合约引用，而没有相应调整代理合约的存储布局，那么执行`delegatecall`时就会出现预期之外的存储修改。

比如，`Logic V2`中，调整了变量`foo`和`bar`的位置，会导致存储冲突：
| Proxy                  | Logic V1               | Logic V2             |                    |
|  ----                  |  ----                  | ----                 | ----               |
| address logicAddress   | address not_used       | address not_used     |                    |
| uint256 count          | uint256 count          | uint256 count        |                    |
| address foo            | address foo            | address bar          | <=== 存储冲突，V2 bar 变量对应 Proxy 中的 foo |
| address bar            | address bar            | address foo          | <=== 存储冲突，V2 foo 变量对应 Proxy 中的 bar |


`delegatecall`是一个非常强大的功能，它允许合约逻辑的重用和灵活的升级。然而，它也带来了存储冲突的风险，这要求开发者在设计和实施时必须极其谨慎。

在实际的区块链开发工作中，为了确保代理合约的安全和升级的灵活性，通常采用成熟的开源库，如 OpenZeppelin。OpenZeppelin 提供了一些模块来处理代理合约的升级和存储布局问题，还提供了常见的几种代理合约升级模式。下一章节将介绍常用的代理合约升级模式。


## 总结

代理合约是智能合约开发中一个极其强大且必需的模式，特别是在需要可升级性解决方案时。然而，要正确实现该模式，需要对 Solidity 和智能合约的行为有深入的理解。正确的设计和实现可确保系统的安全性和可靠性，同时也提供了卓越的灵活性和可维护性。