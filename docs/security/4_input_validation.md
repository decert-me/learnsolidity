# 输入验证和数据校验

输入验证是智能合约安全的第一道防线。由于区块链上的所有交易都是公开的，攻击者可以发送任意数据来测试合约的边界。不当的输入验证可能导致各种安全问题，从资金损失到合约完全失控。

## 为什么输入验证如此重要

### 区块链的特殊性

1. **不可逆性**：交易一旦确认就无法撤销
2. **公开性**：所有人都可以调用你的合约
3. **高价值**：合约通常管理着真实资产
4. **复杂性**：多个合约相互调用，错误会传播

### 真实案例：Parity 多签钱包

**2017 年 7 月，Parity 多签钱包漏洞**

```solidity
// 简化的漏洞代码
function initWallet(address[] _owners, uint _required) public {
    // ❌ 没有检查是否已经初始化！
    owners = _owners;
    required = _required;
}
```

**问题**：
- 任何人都可以调用 `initWallet`
- 没有检查合约是否已经初始化
- 攻击者可以重新初始化钱包，成为所有者

**结果**：价值 3000 万美元的 ETH 被盗。

## 输入验证的基本原则

### 1. 永远不要信任用户输入

```solidity
// ❌ 危险：相信用户输入
function withdraw(uint amount) public {
    payable(msg.sender).transfer(amount);  // 没有任何检查！
}

// ✅ 安全：验证输入
function withdraw(uint amount) public {
    require(amount > 0, "Amount must be positive");
    require(amount <= balances[msg.sender], "Insufficient balance");
    require(amount <= address(this).balance, "Insufficient contract balance");

    balances[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);
}
```

### 2. 白名单优于黑名单

```solidity
// ❌ 黑名单：容易遗漏
function setRole(uint roleId) public {
    require(roleId != 0, "Cannot set admin role");  // 容易被绕过
    roles[msg.sender] = roleId;
}

// ✅ 白名单：明确允许的值
function setRole(uint roleId) public {
    require(
        roleId == ROLE_USER || roleId == ROLE_MODERATOR,
        "Invalid role"
    );
    roles[msg.sender] = roleId;
}
```

### 3. 尽早失败

```solidity
// ✅ 在函数开始就验证所有输入
function transfer(address to, uint amount) public {
    // 所有验证放在最前面
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Amount must be positive");
    require(balances[msg.sender] >= amount, "Insufficient balance");

    // 执行业务逻辑
    balances[msg.sender] -= amount;
    balances[to] += amount;
}
```

## 常见输入类型的验证

### 1. 地址验证

```solidity
contract AddressValidation {
    // ✅ 检查零地址
    function setRecipient(address _recipient) public {
        require(_recipient != address(0), "Invalid address");
        recipient = _recipient;
    }

    // ✅ 检查是否是合约地址
    function onlyEOA(address addr) public view {
        require(addr.code.length == 0, "Must be EOA");
    }

    // ✅ 检查是否是合约地址
    function onlyContract(address addr) public view {
        require(addr.code.length > 0, "Must be contract");
    }

    // ✅ 检查地址列表
    function setAddresses(address[] memory addrs) public {
        require(addrs.length > 0, "Empty array");
        require(addrs.length <= 100, "Too many addresses");

        for (uint i = 0; i < addrs.length; i++) {
            require(addrs[i] != address(0), "Invalid address");
            // 检查重复
            for (uint j = i + 1; j < addrs.length; j++) {
                require(addrs[i] != addrs[j], "Duplicate address");
            }
        }
    }
}
```

### 2. 数值验证

```solidity
contract NumericValidation {
    uint public constant MIN_AMOUNT = 1000;
    uint public constant MAX_AMOUNT = 1000000;

    // ✅ 范围检查
    function deposit(uint amount) public payable {
        require(amount >= MIN_AMOUNT, "Amount too small");
        require(amount <= MAX_AMOUNT, "Amount too large");
        require(msg.value == amount, "Value mismatch");

        balances[msg.sender] += amount;
    }

    // ✅ 百分比验证
    function setFee(uint feePercent) public {
        require(feePercent <= 100, "Fee cannot exceed 100%");
        fee = feePercent;
    }

    // ✅ 除数检查
    function divide(uint a, uint b) public pure returns (uint) {
        require(b != 0, "Division by zero");
        return a / b;
    }

    // ✅ 溢出前检查
    function multiply(uint a, uint b) public pure returns (uint) {
        if (a == 0) return 0;

        uint c = a * b;
        require(c / a == b, "Multiplication overflow");
        return c;
    }
}
```

### 3. 字符串和字节验证

```solidity
contract StringValidation {
    // ✅ 字符串长度检查
    function setName(string memory name) public {
        bytes memory nameBytes = bytes(name);
        require(nameBytes.length > 0, "Name cannot be empty");
        require(nameBytes.length <= 32, "Name too long");

        userName[msg.sender] = name;
    }

    // ✅ 字节数组长度检查
    function setData(bytes memory data) public {
        require(data.length > 0, "Data cannot be empty");
        require(data.length <= 1024, "Data too large");

        userData[msg.sender] = data;
    }

    // ✅ 检查特殊字符（gas 消耗较高，谨慎使用）
    function isAlphanumeric(string memory str) public pure returns (bool) {
        bytes memory b = bytes(str);

        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];

            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A)    // a-z
            )) {
                return false;
            }
        }
        return true;
    }
}
```

### 4. 数组验证

```solidity
contract ArrayValidation {
    uint public constant MAX_ARRAY_LENGTH = 100;

    // ✅ 数组长度限制
    function processBatch(uint[] memory values) public {
        require(values.length > 0, "Empty array");
        require(values.length <= MAX_ARRAY_LENGTH, "Array too large");

        for (uint i = 0; i < values.length; i++) {
            require(values[i] > 0, "Invalid value");
            // 处理数据
        }
    }

    // ✅ 检查数组元素唯一性
    function checkUnique(address[] memory addrs) public pure returns (bool) {
        for (uint i = 0; i < addrs.length; i++) {
            for (uint j = i + 1; j < addrs.length; j++) {
                if (addrs[i] == addrs[j]) {
                    return false;
                }
            }
        }
        return true;
    }

    // ✅ 双数组长度匹配
    function batchTransfer(
        address[] memory recipients,
        uint[] memory amounts
    ) public {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty arrays");
        require(recipients.length <= MAX_ARRAY_LENGTH, "Too many transfers");

        for (uint i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            // 执行转账
        }
    }
}
```

### 5. 枚举和状态验证

```solidity
contract StateValidation {
    enum Status { Pending, Active, Paused, Completed }
    Status public status;

    // ✅ 状态转换验证
    function activate() public {
        require(status == Status.Pending, "Can only activate from pending");
        status = Status.Active;
    }

    // ✅ 多状态检查
    function pause() public {
        require(
            status == Status.Pending || status == Status.Active,
            "Invalid state for pause"
        );
        status = Status.Paused;
    }

    // ✅ 枚举范围检查（如果从外部输入）
    function setStatus(uint _status) public {
        require(_status <= uint(Status.Completed), "Invalid status");
        status = Status(_status);
    }
}
```

## 时间和区块相关的验证

```solidity
contract TimeValidation {
    uint public startTime;
    uint public endTime;

    // ✅ 时间范围验证
    function setTimeRange(uint _start, uint _end) public {
        require(_start > block.timestamp, "Start time must be in future");
        require(_end > _start, "End must be after start");
        require(_end - _start >= 1 days, "Duration too short");
        require(_end - _start <= 365 days, "Duration too long");

        startTime = _start;
        endTime = _end;
    }

    // ✅ 检查是否在有效期内
    function isActive() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    modifier onlyDuringPeriod() {
        require(isActive(), "Not in active period");
        _;
    }

    // ✅ 区块号验证
    function setDeadlineBlock(uint blockNumber) public {
        require(blockNumber > block.number, "Block must be in future");
        require(blockNumber <= block.number + 1000000, "Too far in future");

        deadlineBlock = blockNumber;
    }
}
```

## 自定义验证函数和修饰器

### 使用修饰器封装验证逻辑

```solidity
contract ValidationModifiers {
    address public owner;
    mapping(address => uint) public balances;

    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    modifier validAmount(uint amount) {
        require(amount > 0, "Amount must be positive");
        require(amount <= 1000 ether, "Amount too large");
        _;
    }

    modifier sufficientBalance(uint amount) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        _;
    }

    // 使用多个修饰器
    function transfer(address to, uint amount)
        public
        validAddress(to)
        validAmount(amount)
        sufficientBalance(amount)
    {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

### 创建验证库

```solidity
library InputValidator {
    // 地址验证
    function validateAddress(address addr) internal pure {
        require(addr != address(0), "Invalid address");
    }

    // 范围验证
    function validateRange(uint value, uint min, uint max) internal pure {
        require(value >= min && value <= max, "Value out of range");
    }

    // 数组长度验证
    function validateArrayLength(uint length, uint max) internal pure {
        require(length > 0, "Empty array");
        require(length <= max, "Array too large");
    }

    // 百分比验证
    function validatePercentage(uint percent) internal pure {
        require(percent <= 100, "Invalid percentage");
    }
}

contract UsingValidator {
    using InputValidator for *;

    function setFee(uint feePercent) public {
        feePercent.validatePercentage();
        fee = feePercent;
    }

    function setRecipient(address recipient) public {
        recipient.validateAddress();
        defaultRecipient = recipient;
    }
}
```

## 常见的验证陷阱

### 陷阱 1：使用 tx.origin 进行身份验证

```solidity
// ❌ 危险：使用 tx.origin
function withdraw() public {
    require(tx.origin == owner, "Not owner");  // 可被钓鱼攻击
    // ...
}

// ✅ 安全：使用 msg.sender
function withdraw() public {
    require(msg.sender == owner, "Not owner");
    // ...
}
```

### 陷阱 2：不检查返回值

```solidity
// ❌ 危险：不检查 transfer 返回值
function unsafeTransfer(address token, address to, uint amount) public {
    IERC20(token).transfer(to, amount);  // 可能失败但不revert
}

// ✅ 安全：检查返回值
function safeTransfer(address token, address to, uint amount) public {
    bool success = IERC20(token).transfer(to, amount);
    require(success, "Transfer failed");
}

// ✅ 更好：使用 SafeERC20
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

function bestTransfer(address token, address to, uint amount) public {
    SafeERC20.safeTransfer(IERC20(token), to, amount);
}
```

### 陷阱 3：不检查外部调用结果

```solidity
// ❌ 危险：假设调用成功
function dangerousCall(address target, bytes memory data) public {
    target.call(data);  // 忽略返回值
}

// ✅ 安全：检查调用结果
function safeCall(address target, bytes memory data) public {
    (bool success, bytes memory returnData) = target.call(data);
    require(success, "Call failed");
}
```

### 陷阱 4：整数除法精度损失

```solidity
// ❌ 危险：精度损失
function calculateFee(uint amount) public pure returns (uint) {
    return amount / 100 * 3;  // 先除后乘，损失精度
}

// ✅ 安全：先乘后除
function calculateFee(uint amount) public pure returns (uint) {
    return amount * 3 / 100;  // 先乘后除，保留精度
}
```

## 实践检查清单

### 基本验证
- [ ] 所有地址参数检查非零
- [ ] 所有数值参数检查范围
- [ ] 所有数组参数检查长度
- [ ] 所有字符串参数检查长度
- [ ] 除法操作检查除数非零

### 状态验证
- [ ] 检查合约当前状态
- [ ] 验证状态转换的合法性
- [ ] 防止重复初始化
- [ ] 防止重复执行关键操作

### 权限验证
- [ ] 使用 msg.sender 而非 tx.origin
- [ ] 检查调用者权限
- [ ] 实现适当的访问控制

### 时间验证
- [ ] 验证时间范围的合理性
- [ ] 检查操作是否在有效期内
- [ ] 防止时间戳操纵

### 外部调用验证
- [ ] 检查外部调用返回值
- [ ] 使用 SafeERC20 处理代币
- [ ] 防御重入攻击

## 小结

核心原则： **永远不信任输入**、**系统化验证**、**详尽的测试边界**。
**记住**：输入验证是防御的重要防线。花时间做好输入验证，能避免大部分的安全问题。
