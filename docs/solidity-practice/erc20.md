# 理解和实现 ERC20 代币

## 什么是 ERC20?
[ERC20](https://eips.ethereum.org/EIPS/eip-20) 是 Ethereum 网络上最出名且应用最广的代币标准之一。它提供了一个统一的接口标准，用于创建可互换代币，这些代币可以用来代表任何事物，从货币到积分等。

该标准定义了一组 API（应用程序编程接口），涉及到代币在智能合约中的转移方式，如何获取数据（比如各账户的代币余额），以及如何接收、记录和使用这些代币。


### ERC20 的关键方法与属性

ERC20 标准主要定义了以下几个函数和两个事件：

函数：
- `name() public view returns (string)`：可选；返回一个字符串值，表示代币的名称
- `symbol() public view returns (string)`：可选；返回一个字符串值，表示代币的简写或缩写。
- `decimals() public view returns (uint8)`：可选；返回一个 uint8 类型的值，表示代币可以分割到的小数位数。许多代币选择`18`为其小数值，因为这是 Ether(ETH) 使用的小数位数
- `totalSupply() public view returns (uint256)`：返回代币的总供应量
- `balanceOf(address _owner) public view returns (uint256 balance)`：返回特定地址(_owner)的代币余额
- `transfer(address _to, uint256 _value) public returns (bool success)`：从调用者的地址转移 _value 量的代币到地址 _to，成功返回 true
- `transferFrom(address _from, address _to, uint256 _value) public returns (bool success)`：允许 _spender 从 _from 转移 _value 量的代币到 _to
- `approve(address _spender, uint256 _value) public returns (bool success)`：允许 _spender 从调用者的账户多次取回总共 _value 量的代币
- `allowance(address _owner, address _spender) public view returns (uint256 remaining)`：返回 _spender 仍然被允许从 _owner 提取的代币数量

事件：
- `Transfer(address indexed _from, address indexed _to, uint256 _value)`：在代币被转移时触发。
- `Approval(address indexed _owner, address indexed _spender, uint256 _value)`：在调用 approve 函数时触发。

## 编写一个简单的 ERC20 代币合约

下面是一个简单的 ERC20 代币合约的实现
```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract BaseERC20 {
    string public name; 
    string public symbol; 
    uint8 public decimals; 

    uint256 public totalSupply; 

    mapping (address => uint256) balances; 

    mapping (address => mapping (address => uint256)) allowances; 

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        name = "MyToken"; 
        symbol = "MTK"; 
        decimals = 18; 
        totalSupply = 100000000 * 10 ** uint256(decimals);

        balances[msg.sender] = totalSupply;  
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];    
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value, "ERC20: transfer amount exceeds balance");

        balances[msg.sender] -= _value;    
        balances[_to] += _value;   

        emit Transfer(msg.sender, _to, _value);  
        return true;   
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balances[_from] >= _value, "ERC20: transfer amount exceeds balance");
        require(allowances[_from][msg.sender] >= _value,"ERC20: transfer amount exceeds allowance");

        balances[_from] -= _value; 
        balances[_to] += _value; 

        allowances[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value); 
        return true; 
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowances[msg.sender][_spender] = _value; 
        emit Approval(msg.sender, _spender, _value); 
        return true; 
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowances[_owner][_spender];
    }
}
```


## 使用 OpenZeppelin 创建 ERC20 代币

OpenZeppelin 是一个开源的区块链开发框架，旨在帮助开发者构建安全、稳健的智能合约。

对于想要创建 ERC20 代币的开发者来说，使用 OpenZeppelin 可以极大地简化开发过程，因为它内置了遵守 ERC20 标准的可复用合约，这些合约经过严格审计，能够减少潜在的安全风险。

安装好 OpenZeppelin 库后（安装方法见前面的 [Hardhat 开发框架](../tools/4_hardhat.md) 或者 [Foundry 开发框架](../tools/5_foundry.md)），你可以开始编写你的 ERC20 代币合约。

OpenZeppelin 提供了一些基础合约，你可以通过继承和扩展这些合约来创建你自己的代币合约。

下面是使用 OpenZeppelin 创建一个简单的 ERC20 代币的示例：

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 导入 OpenZeppelin 提供的 ERC20 标准合约
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 创建一个新的合约，继承自 OpenZeppelin 的 ERC20 合约
contract MyToken is ERC20 {
    // 构造函数将初始化 ERC20 供应量和代币名称
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        // 通过 _mint 函数铸造初始供应量的代币到部署合约的地址
        _mint(msg.sender, initialSupply);
    }
}
```

在这个例子中，我们通过几行代码就可以实现一个 ERC20 合约。

### 常见扩展合约
在使用 OpenZeppelin 库时，有多种用于扩展功能的合约可用。这些合约经过专门的设计以增加如访问控制、代币经济机制（如燃烧和铸造）以及安全功能（如防止重入攻击）等功能。

常见的扩展合约示例

1. 燃烧代币:

	ERC20Burnable：允许代币持有者销毁（burn）一定数量的代币，从而从流通中永久移除这些代币。
2. 暂停合约:

	ERC20Pausable：允许合约的管理员暂停合约的所有操作，这在遇到安全问题时是一种非常有用的应急措施。
3. 授权代币使用：

    ERC20Permit：允许代币持有者通过签署一个允许他人在其帐户上花费特定数量代币的许可，从而通过一次交易执行授权。这种机制使用了 EIP-2612 提案中定义的方法。

### 实现扩展合约

要实现一个扩展合约，开发者需要根据需求选择合适的 OpenZeppelin 基础合约，并通过 Solidity 的 `is` 关键字来继承它。

下面是一个简单的示例，说明如何创建一个可燃烧的 ERC20 代币：

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MyToken is ERC20, ERC20Burnable {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}
```

在这个例子中，MyToken 继承了 OpenZeppelin 的 ERC20 和 ERC20Burnable 合约。这样，它就拥有了 ERC20 代币的标准功能，并加上了可以燃烧代币的能力。

在 ERC20Burnable 合约中，`burn` 函数的实现通常如下：
```
function burn(uint256 amount) public virtual {
    _burn(_msgSender(), amount);
}
```

此函数由代币的持有者调用，并需要一个参数 `amount`，表示要销毁的代币数量。函数调用 `_burn` 方法，此方法定义在 OpenZeppelin 的 ERC20 基础合约中，用于从执行操作的地址中减少相应数量的代币，并相应减少总供应量。


## 总结

此章节的目的是向你展示如何从零开始创建一个遵循 ERC20 标准的代币合约，理解其方法的实际应用，并且知道如何使用 OpenZeppelin 合约来简化开发过程。