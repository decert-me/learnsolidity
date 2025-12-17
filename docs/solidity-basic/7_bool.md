# 布尔类型

布尔类型（Boolean）是编程中最基础的数据类型之一，只有两个值：`true`（真）和 `false`（假）。在智能合约中，布尔类型常用于条件判断、权限控制和状态标记。

## 布尔值的定义和使用

在 Solidity 中，布尔类型用 `bool` 关键字表示：

```solidity
pragma solidity ^0.8.0;

contract BooleanBasics {
    bool public isActive = true;
    bool public isPaused = false;
    bool public isInitialized;  // 默认值为 false

    function setState(bool _active) public {
        isActive = _active;
    }

    function getState() public view returns (bool) {
        return isActive;
    }
}
```

:::tip

布尔变量的默认值是 `false`。如果声明一个布尔变量但不赋值，它会自动初始化为 `false`。

:::

## 逻辑运算符

Solidity 支持三种逻辑运算符：

### 1. 逻辑与（&&）

当且仅当两边都为 `true` 时，结果才为 `true`。

```solidity
pragma solidity ^0.8.0;

contract LogicalAnd {
    function andOperation() public pure returns (bool) {
        bool a = true;
        bool b = false;

        bool result1 = true && true;    // true
        bool result2 = true && false;   // false
        bool result3 = false && true;   // false
        bool result4 = false && false;  // false

        return a && b;  // false
    }

    // 实际应用：同时满足多个条件
    function canWithdraw(address user, uint amount) public view returns (bool) {
        bool hasBalance = address(user).balance >= amount;
        bool isNotPaused = true;  // 假设合约未暂停

        return hasBalance && isNotPaused;
    }
}
```

### 2. 逻辑或（||）

只要有一边为 `true`，结果就为 `true`。

```solidity
pragma solidity ^0.8.0;

contract LogicalOr {
    function orOperation() public pure returns (bool) {
        bool result1 = true || true;    // true
        bool result2 = true || false;   // true
        bool result3 = false || true;   // true
        bool result4 = false || false;  // false

        return result1;
    }

    // 实际应用：满足任一条件即可
    function hasPermission(address user, address owner, address admin)
        public
        pure
        returns (bool)
    {
        return user == owner || user == admin;
    }
}
```

### 3. 逻辑非（!）

取反操作，`true` 变 `false`，`false` 变 `true`。

```solidity
pragma solidity ^0.8.0;

contract LogicalNot {
    bool public isLocked = false;

    function notOperation() public pure returns (bool) {
        bool a = true;
        bool b = false;

        bool result1 = !a;  // false
        bool result2 = !b;  // true

        return !a;
    }

    // 实际应用：检查相反状态
    function canAccess() public view returns (bool) {
        return !isLocked;  // 如果未锁定，则可以访问
    }
}
```

### 逻辑运算真值表

#### AND (&&) 真值表
| A | B | A && B |
|---|---|--------|
| true | true | true |
| true | false | false |
| false | true | false |
| false | false | false |

#### OR (||) 真值表
| A | B | A \|\| B |
|---|---|----------|
| true | true | true |
| true | false | true |
| false | true | true |
| false | false | false |

#### NOT (!) 真值表
| A | !A |
|---|-----|
| true | false |
| false | true |

## 短路求值

Solidity 中的逻辑运算符支持**短路求值**（Short-circuit evaluation），这是一个重要的特性，既能提高效率，也能避免错误。

### && 的短路求值

如果左边为 `false`，则右边的表达式不会执行。

```solidity
pragma solidity ^0.8.0;

contract ShortCircuitAnd {
    uint public counter = 0;

    function incrementCounter() public returns (bool) {
        counter++;
        return true;
    }

    function testShortCircuit() public returns (uint) {
        // 因为 false && ... 中，右边不会执行
        // 所以 incrementCounter() 不会被调用
        bool result = false && incrementCounter();

        return counter;  // 返回 0，counter 没有增加
    }

    function testNoShortCircuit() public returns (uint) {
        // 因为 true && ... 中，需要判断右边
        // 所以 incrementCounter() 会被调用
        bool result = true && incrementCounter();

        return counter;  // 返回 1，counter 增加了
    }
}
```

### || 的短路求值

如果左边为 `true`，则右边的表达式不会执行。

```solidity
pragma solidity ^0.8.0;

contract ShortCircuitOr {
    uint public counter = 0;

    function incrementCounter() public returns (bool) {
        counter++;
        return false;
    }

    function testShortCircuit() public returns (uint) {
        // 因为 true || ... 中，右边不会执行
        bool result = true || incrementCounter();

        return counter;  // 返回 0
    }

    function testNoShortCircuit() public returns (uint) {
        // 因为 false || ... 中，需要判断右边
        bool result = false || incrementCounter();

        return counter;  // 返回 1
    }
}
```

### 短路求值的实际应用

短路求值可以避免错误并节省 Gas：

```solidity
pragma solidity ^0.8.0;

contract ShortCircuitBenefit {
    mapping(address => uint) public balances;

    // 利用短路求值避免除零错误
    function safeDivide(uint a, uint b) public pure returns (uint) {
        // 如果 b == 0，右边的除法不会执行，避免了错误
        return (b != 0) && (a / b > 10) ? a / b : 0;
    }

    // 利用短路求值节省 Gas
    function canWithdraw(address user, uint amount) public view returns (bool) {
        // 如果余额不足，就不需要执行后面的复杂检查
        return balances[user] >= amount && complexCheck(user);
    }

    function complexCheck(address user) internal view returns (bool) {
        // 假设这是一个复杂且消耗 Gas 的检查
        return true;
    }
}
```

:::tip Gas 优化

在使用 `&&` 时，把更可能为 `false` 的条件放在前面；使用 `||` 时，把更可能为 `true` 的条件放在前面。这样可以通过短路求值节省 Gas。

:::

## 比较运算符

Solidity 支持六种比较运算符，比较的结果是布尔值：

```solidity
pragma solidity ^0.8.0;

contract ComparisonOperators {
    function compareNumbers(uint a, uint b) public pure returns (
        bool isEqual,
        bool isNotEqual,
        bool isLess,
        bool isLessOrEqual,
        bool isGreater,
        bool isGreaterOrEqual
    ) {
        isEqual = (a == b);           // 等于
        isNotEqual = (a != b);        // 不等于
        isLess = (a < b);             // 小于
        isLessOrEqual = (a <= b);     // 小于等于
        isGreater = (a > b);          // 大于
        isGreaterOrEqual = (a >= b);  // 大于等于

        return (isEqual, isNotEqual, isLess, isLessOrEqual, isGreater, isGreaterOrEqual);
    }

    function compareAddresses(address a, address b) public pure returns (bool) {
        return a == b;  // 地址比较
    }

    function compareBools(bool a, bool b) public pure returns (bool) {
        return a == b;  // 布尔比较
    }
}
```

## 在条件语句中的应用

布尔类型最常见的用途是在条件语句中进行判断。

### if-else 语句

```solidity
pragma solidity ^0.8.0;

contract ConditionalStatements {
    bool public isPaused = false;

    function doSomething() public view returns (string memory) {
        if (isPaused) {
            return "Contract is paused";
        } else {
            return "Contract is active";
        }
    }

    function checkAge(uint age) public pure returns (string memory) {
        if (age < 18) {
            return "Minor";
        } else if (age < 65) {
            return "Adult";
        } else {
            return "Senior";
        }
    }
}
```

### require 断言

```solidity
pragma solidity ^0.8.0;

contract RequireExample {
    address public owner;
    bool public isPaused;

    constructor() {
        owner = msg.sender;
    }

    function restrictedFunction() public view {
        require(!isPaused, "Contract is paused");
        require(msg.sender == owner, "Not owner");
        // 函数逻辑
    }
}
```

### 三元运算符

```solidity
pragma solidity ^0.8.0;

contract TernaryOperator {
    function max(uint a, uint b) public pure returns (uint) {
        return a > b ? a : b;
    }

    function getStatus(bool isActive) public pure returns (string memory) {
        return isActive ? "Active" : "Inactive";
    }

    function abs(int x) public pure returns (int) {
        return x >= 0 ? x : -x;
    }
}
```

## 实际应用场景

### 1. 权限控制

```solidity
pragma solidity ^0.8.0;

contract AccessControl {
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isModerator;

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    modifier onlyAdminOrModerator() {
        require(
            isAdmin[msg.sender] || isModerator[msg.sender],
            "No permission"
        );
        _;
    }

    function addAdmin(address user) public onlyAdmin {
        isAdmin[user] = true;
    }

    function moderateContent() public onlyAdminOrModerator {
        // 管理员或版主都可以执行
    }
}
```

### 2. 状态管理

```solidity
pragma solidity ^0.8.0;

contract StateManagement {
    bool public isPaused;
    bool public isInitialized;
    bool public isFinalized;

    function initialize() public {
        require(!isInitialized, "Already initialized");
        isInitialized = true;
        // 初始化逻辑
    }

    function pause() public {
        require(!isPaused, "Already paused");
        isPaused = true;
    }

    function unpause() public {
        require(isPaused, "Not paused");
        isPaused = false;
    }

    function doSomething() public {
        require(isInitialized, "Not initialized");
        require(!isPaused, "Contract is paused");
        require(!isFinalized, "Contract is finalized");
        // 业务逻辑
    }
}
```

### 3. 功能开关

```solidity
pragma solidity ^0.8.0;

contract FeatureFlags {
    bool public tradingEnabled;
    bool public stakingEnabled;
    bool public withdrawalEnabled;

    address public owner;

    constructor() {
        owner = msg.sender;
        tradingEnabled = true;
        stakingEnabled = false;
        withdrawalEnabled = true;
    }

    function toggleTrading() public {
        require(msg.sender == owner, "Not owner");
        tradingEnabled = !tradingEnabled;
    }

    function trade() public {
        require(tradingEnabled, "Trading is disabled");
        // 交易逻辑
    }

    function stake() public {
        require(stakingEnabled, "Staking is disabled");
        // 质押逻辑
    }
}
```

### 4. 白名单/黑名单

```solidity
pragma solidity ^0.8.0;

contract WhitelistBlacklist {
    mapping(address => bool) public whitelist;
    mapping(address => bool) public blacklist;

    function addToWhitelist(address user) public {
        whitelist[user] = true;
    }

    function addToBlacklist(address user) public {
        blacklist[user] = true;
    }

    function canTransfer(address user) public view returns (bool) {
        // 黑名单中的用户不能转账
        if (blacklist[user]) {
            return false;
        }
        // 如果有白名单机制，必须在白名单中
        // return whitelist[user];

        return true;
    }

    function transfer(address to) public {
        require(canTransfer(msg.sender), "Transfer not allowed");
        require(canTransfer(to), "Recipient cannot receive");
        // 转账逻辑
    }
}
```

## 存储和 Gas 优化

### 布尔值的存储

布尔值在存储时占用一个完整的存储槽（32字节），即使它只需要1位来表示。

```solidity
pragma solidity ^0.8.0;

contract BoolStorage {
    // 每个 bool 占用一个存储槽（浪费）
    bool public flag1;  // 槽 0
    bool public flag2;  // 槽 1
    bool public flag3;  // 槽 2

    // 更好的方式：将多个 bool 与其他小类型变量打包
    bool public flag4;      // 槽 3
    uint8 public value1;    // 槽 3（与 flag4 打包）
    uint8 public value2;    // 槽 3（与 flag4 打包）
    address public addr;    // 槽 3（与 flag4 打包，地址20字节）
}
```

:::tip 存储优化

将布尔变量与其他小于32字节的变量一起声明，可以打包到同一个存储槽中，节省 Gas。

:::

### 使用 uint256 代替多个 bool

如果需要存储大量布尔标志，可以使用位运算和 `uint256` 来优化：

```solidity
pragma solidity ^0.8.0;

contract BitmapFlags {
    // 一个 uint256 可以存储 256 个布尔标志
    uint256 private flags;

    function setFlag(uint8 position) public {
        require(position < 256, "Position out of range");
        flags |= (1 << position);  // 设置为 true
    }

    function clearFlag(uint8 position) public {
        require(position < 256, "Position out of range");
        flags &= ~(1 << position);  // 设置为 false
    }

    function getFlag(uint8 position) public view returns (bool) {
        require(position < 256, "Position out of range");
        return (flags & (1 << position)) != 0;
    }
}
```

这种方式可以在一个存储槽中存储256个标志，大大节省存储成本。

## 操练

### 练习1：实现访问控制合约

```SolidityEditor
pragma solidity ^0.8.0;

contract AccessControlPractice {
    address public owner;
    mapping(address => bool) public admins;

    constructor() {
        owner = msg.sender;
    }

    // TODO: 实现检查是否为 owner 或 admin 的函数
    function isAuthorized(address user) public view returns (bool) {
        // 你的代码
    }

    // TODO: 实现只有授权用户才能调用的函数
    function restrictedAction() public {
        // 你的代码
    }
}
```

### 练习2：实现功能开关合约

```SolidityEditor
pragma solidity ^0.8.0;

contract FeatureToggle {
    bool public feature1Enabled;
    bool public feature2Enabled;

    // TODO: 实现切换功能开关
    function toggleFeature1() public {
        // 你的代码
    }

    // TODO: 实现检查所有功能是否都启用
    function allFeaturesEnabled() public view returns (bool) {
        // 你的代码
    }

    // TODO: 实现至少一个功能启用的检查
    function anyFeatureEnabled() public view returns (bool) {
        // 你的代码
    }
}
```

## 小结

- **布尔类型**：只有 `true` 和 `false` 两个值，默认值为 `false`
- **逻辑运算符**：`&&`（与）、`||`（或）、`!`（非）
- **短路求值**：`&&` 和 `||` 支持短路求值，可以提高效率和避免错误
- **比较运算符**：`==`、`!=`、`<`、`<=`、`>`、`>=` 返回布尔值
- **应用场景**：权限控制、状态管理、功能开关、白名单/黑名单
- **Gas 优化**：与其他小类型变量打包存储，或使用位运算优化多个标志的存储

布尔类型虽然简单，但在智能合约中有着广泛而重要的应用！
