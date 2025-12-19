# 访问控制

访问控制是智能合约安全的基础，用于限制谁可以执行特定的操作。不当的访问控制可能导致合约被恶意利用，造成严重的安全问题。

本章你将学到：
- 访问控制的常见模式
- 如何使用 modifier 实现权限控制
- 多种角色权限管理方案
- 访问控制的最佳实践

## 基本的 Owner 模式

最简单的访问控制是 Owner（所有者）模式，只有合约所有者可以执行特定操作：

```solidity
pragma solidity ^0.8.0;

contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
}
```

### 使用示例

```solidity
contract MyContract is Ownable {
    uint256 public value;

    // 只有 owner 可以调用
    function setValue(uint256 _value) public onlyOwner {
        value = _value;
    }

    // 只有 owner 可以提取资金
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
```

## 多角色权限管理

使用 mapping 实现多角色权限系统：

```solidity
pragma solidity ^0.8.0;

contract RoleBasedAccessControl {
    mapping(address => mapping(bytes32 => bool)) private roles;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    constructor() {
        // 部署者获得管理员角色
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "Access denied");
        _;
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roles[account][role];
    }

    function grantRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        _revokeRole(role, account);
    }

    function _grantRole(bytes32 role, address account) internal {
        if (!hasRole(role, account)) {
            roles[account][role] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function _revokeRole(bytes32 role, address account) internal {
        if (hasRole(role, account)) {
            roles[account][role] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }
}
```

### 使用多角色系统

```solidity
contract Token is RoleBasedAccessControl {
    mapping(address => uint256) public balances;

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        balances[to] += amount;
    }

    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
    }
}
```

## 白名单/黑名单模式

使用映射实现白名单或黑名单：

```solidity
pragma solidity ^0.8.0;

contract WhitelistBlacklist is Ownable {
    mapping(address => bool) public whitelist;
    mapping(address => bool) public blacklist;

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }

    modifier notBlacklisted() {
        require(!blacklist[msg.sender], "Blacklisted");
        _;
    }

    function addToWhitelist(address account) public onlyOwner {
        whitelist[account] = true;
    }

    function removeFromWhitelist(address account) public onlyOwner {
        whitelist[account] = false;
    }

    function addToBlacklist(address account) public onlyOwner {
        blacklist[account] = true;
    }

    function removeFromBlacklist(address account) public onlyOwner {
        blacklist[account] = false;
    }
}
```

## 时间锁（Timelock）

添加时间延迟增强安全性：

```solidity
pragma solidity ^0.8.0;

contract TimelockController is Ownable {
    uint256 public constant DELAY = 2 days;

    struct Transaction {
        address target;
        uint256 value;
        bytes data;
        uint256 executeTime;
        bool executed;
    }

    mapping(bytes32 => Transaction) public transactions;

    event TransactionQueued(bytes32 indexed txId, address target, uint256 executeTime);
    event TransactionExecuted(bytes32 indexed txId);

    function queueTransaction(
        address target,
        uint256 value,
        bytes memory data
    ) public onlyOwner returns (bytes32) {
        bytes32 txId = keccak256(abi.encode(target, value, data, block.timestamp));

        transactions[txId] = Transaction({
            target: target,
            value: value,
            data: data,
            executeTime: block.timestamp + DELAY,
            executed: false
        });

        emit TransactionQueued(txId, target, block.timestamp + DELAY);
        return txId;
    }

    function executeTransaction(bytes32 txId) public onlyOwner {
        Transaction storage txn = transactions[txId];
        require(!txn.executed, "Already executed");
        require(block.timestamp >= txn.executeTime, "Too early");

        txn.executed = true;

        (bool success, ) = txn.target.call{value: txn.value}(txn.data);
        require(success, "Execution failed");

        emit TransactionExecuted(txId);
    }
}
```

## 常见安全问题

### 1. 缺少访问控制

❌ **错误示例**：
```solidity
contract Vulnerable {
    uint256 public value;

    // 任何人都可以修改！
    function setValue(uint256 _value) public {
        value = _value;
    }
}
```

✅ **正确示例**：
```solidity
contract Secure is Ownable {
    uint256 public value;

    function setValue(uint256 _value) public onlyOwner {
        value = _value;
    }
}
```

### 2. tx.origin 认证

❌ **错误示例**：
```solidity
contract Vulnerable {
    address public owner;

    // 不要使用 tx.origin！
    modifier onlyOwner() {
        require(tx.origin == owner, "Not owner");
        _;
    }
}
```

✅ **正确示例**：
```solidity
contract Secure {
    address public owner;

    // 使用 msg.sender
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}
```

### 3. 检查返回值

```solidity
contract Secure {
    address public owner;

    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "Not owner");
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Already owner");

        owner = newOwner;
    }
}
```

## 最佳实践

1. **最小权限原则**：只授予必要的权限
2. **使用 modifier**：保持代码简洁和可重用
3. **事件记录**：记录所有权限变更
4. **多重签名**：对于关键操作使用多重签名
5. **时间锁**：为敏感操作添加延迟
6. **避免 tx.origin**：始终使用 msg.sender
7. **验证输入**：检查地址是否为零地址等
8. **测试充分**：确保访问控制按预期工作

## 使用 OpenZeppelin

OpenZeppelin 提供了成熟的访问控制实现：

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyContract is Ownable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to) public onlyRole(MINTER_ROLE) {
        // mint logic
    }
}
```

## 小结

- **Owner 模式**：最简单的访问控制，适合单一管理员场景
- **角色管理**：使用 mapping 实现多角色权限系统
- **白名单/黑名单**：限制特定用户的访问
- **时间锁**：为敏感操作添加延迟保护
- **安全原则**：最小权限、使用 msg.sender、充分验证、记录事件

访问控制是智能合约安全的第一道防线，必须谨慎设计和实现。

------

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。

DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
