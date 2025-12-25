
拒绝服务（Denial of Service, DoS）攻击是一种使合约无法正常运行或消耗过多资源的攻击方式。在[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)中，DoS 攻击可能导致关键功能无法使用，资金被锁定，或者 Gas 成本过高。

## 什么是 DoS 攻击

### 基本概念

**DoS 攻击**：通过消耗资源、触发异常或阻塞执行，使合约的某些功能无法被正常用户使用。

### 智能合约中的 DoS 特点

1. **不可逆性**：合约部署后难以修复
2. **资金风险**：可能导致资金永久锁定
3. **Gas 限制**：区块 Gas 上限是硬性约束
4. **公开性**：攻击者可以研究所有代码

## DoS 攻击的类型

### 1. 外部调用失败型 DoS

**原理**：合约依赖外部调用成功，攻击者通过拒绝接收使调用失败。

#### 案例：拍卖退款

```solidity
pragma solidity ^0.8.0;

// ❌ 危险：存在 DoS 漏洞
contract VulnerableAuction {
    address public highestBidder;
    uint public highestBid;

    function bid() public payable {
        require(msg.value > highestBid, "Bid too low");

        // 退还前一个出价者的资金
        if (highestBidder != address(0)) {
            // ❌ 如果 transfer 失败，整个交易回滚
            payable(highestBidder).transfer(highestBid);
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
    }
}

// 攻击者合约
contract Attacker {
    VulnerableAuction auction;

    constructor(address _auction) {
        auction = VulnerableAuction(_auction);
    }

    function attack() public payable {
        auction.bid{value: msg.value}();
    }

    // 拒绝接收 ETH
    receive() external payable {
        revert("I don't want refunds!");
    }
}
```

**攻击流程**：
1. 攻击者出价成为最高出价者
2. 其他人尝试出更高价
3. 合约尝试退款给攻击者
4. 攻击者的 `receive()` 函数回滚
5. 整个 `bid()` 交易失败
6. 没人能超过攻击者的出价

**修复方案：拉取模式**

```solidity
// ✅ 安全：使用拉取模式
contract SecureAuction {
    address public highestBidder;
    uint public highestBid;

    mapping(address => uint) public pendingReturns;

    function bid() public payable {
        require(msg.value > highestBid, "Bid too low");

        if (highestBidder != address(0)) {
            // ✅ 记录待退款金额，而不是直接转账
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
    }

    // 用户主动提取退款
    function withdraw() public {
        uint amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

### 2. Gas 限制型 DoS

**原理**：通过增加操作的 Gas 消耗，使其超过区块 Gas 限制。

#### 案例：无限循环遍历

```solidity
// ❌ 危险：数组过大时无法执行
contract VulnerableDistributor {
    address[] public shareholders;
    mapping(address => uint) public shares;

    function addShareholder(address shareholder, uint share) public {
        shareholders.push(shareholder);
        shares[shareholder] = share;
    }

    // ❌ 股东太多时会超出 Gas 限制
    function distribute() public payable {
        for (uint i = 0; i < shareholders.length; i++) {
            address shareholder = shareholders[i];
            uint amount = msg.value * shares[shareholder] / 100;

            payable(shareholder).transfer(amount);
        }
    }
}
```

**攻击**：攻击者添加大量地址，使 `distribute()` 无法执行。

**修复方案 1：拉取模式**

```solidity
// ✅ 安全：用户主动领取
contract SecureDistributor {
    mapping(address => uint) public shares;
    mapping(address => uint) public pendingPayments;
    uint public totalShares;
    uint public totalDeposits;

    function addShareholder(address shareholder, uint share) public {
        shares[shareholder] = share;
        totalShares += share;
    }

    function deposit() public payable {
        totalDeposits += msg.value;

        // 只记录，不转账
        for (address shareholder in getActiveShareholders()) {
            uint amount = msg.value * shares[shareholder] / totalShares;
            pendingPayments[shareholder] += amount;
        }
    }

    function claim() public {
        uint amount = pendingPayments[msg.sender];
        require(amount > 0, "Nothing to claim");

        pendingPayments[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
```

**修复方案 2：分页处理**

```solidity
// ✅ 安全：分批处理
contract PaginatedDistributor {
    address[] public shareholders;
    mapping(address => uint) public shares;
    uint public lastProcessedIndex;

    function distribute(uint batchSize) public payable {
        uint end = lastProcessedIndex + batchSize;
        if (end > shareholders.length) {
            end = shareholders.length;
        }

        for (uint i = lastProcessedIndex; i < end; i++) {
            address shareholder = shareholders[i];
            uint amount = msg.value * shares[shareholder] / 100;

            (bool success, ) = payable(shareholder).call{value: amount}("");
            // 即使失败也继续，避免 DoS
        }

        lastProcessedIndex = end;
        if (lastProcessedIndex >= shareholders.length) {
            lastProcessedIndex = 0;  // 重置
        }
    }
}
```

### 3. 存储操作型 DoS

**原理**：通过大量存储操作消耗 Gas。

```solidity
// ❌ 危险：删除大数组消耗大量 Gas
contract VulnerableRegistry {
    address[] public users;

    function register() public {
        users.push(msg.sender);
    }

    // ❌ 用户太多时无法删除
    function reset() public {
        delete users;  // 清空大数组，Gas 爆炸
    }
}
```

**修复：使用映射而非数组**

```solidity
// ✅ 安全：使用映射
contract SecureRegistry {
    mapping(address => bool) public isRegistered;
    mapping(address => uint) public registrationTime;
    uint public userCount;

    function register() public {
        require(!isRegistered[msg.sender], "Already registered");

        isRegistered[msg.sender] = true;
        registrationTime[msg.sender] = block.timestamp;
        userCount++;
    }

    function unregister() public {
        require(isRegistered[msg.sender], "Not registered");

        isRegistered[msg.sender] = false;
        userCount--;
    }

    // 不需要清空所有数据，只需重置计数器
    function reset() public onlyOwner {
        userCount = 0;
        // 用户数据保留，通过 isRegistered 标记失效
    }
}
```

### 4. 区块 Gas 限制 DoS

**原理**：单笔交易消耗接近区块 Gas 限制，阻止其他交易。

```solidity
// ❌ 危险：可能消耗整个区块的 Gas
contract VulnerableToken {
    mapping(address => uint) public balances;
    address[] public holders;

    function transfer(address to, uint amount) public {
        balances[msg.sender] -= amount;
        balances[to] += amount;

        // ❌ 每次转账都要遍历所有持有者
        updateAllBalances();  // 超级昂贵的操作
    }

    function updateAllBalances() internal {
        for (uint i = 0; i < holders.length; i++) {
            // 一些复杂计算...
        }
    }
}
```

**修复：优化算法**

```solidity
// ✅ 安全：只更新必要的数据
contract EfficientToken {
    mapping(address => uint) public balances;

    function transfer(address to, uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        // ✅ 只更新相关账户
        emit Transfer(msg.sender, to, amount);
    }
}
```

### 5. 意外回滚型 DoS

**原理**：通过触发 `revert` 阻止合约执行。

```solidity
// ❌ 危险：任何人都可以阻止交易
contract VulnerableVoting {
    address[] public voters;
    mapping(address => bool) public hasVoted;

    function vote() public {
        // ❌ 检查所有投票者，任何一个是合约就可能失败
        for (uint i = 0; i < voters.length; i++) {
            require(voters[i].code.length == 0, "Only EOA can vote");
        }

        hasVoted[msg.sender] = true;
        voters.push(msg.sender);
    }
}
```

**攻击**：攻击者部署一个合约地址，使后续投票失败。

**修复**：

```solidity
// ✅ 安全：只检查当前投票者
contract SecureVoting {
    mapping(address => bool) public hasVoted;
    uint public voteCount;

    function vote() public {
        require(!hasVoted[msg.sender], "Already voted");
        // ✅ 只检查当前投票者
        require(msg.sender.code.length == 0, "Only EOA");

        hasVoted[msg.sender] = true;
        voteCount++;
    }
}
```

## 真实案例分析

### 案例 1：GovernMental 庞氏骗局

**2016 年，GovernMental 合约因 DoS 漏洞导致 1100 ETH 永久锁定**

**漏洞代码**：
```solidity
// 简化版本
contract GovernMental {
    address[] public creditorAddresses;
    mapping(address => uint) public creditorAmounts;

    function lendGovernmentMoney() public payable {
        creditorAddresses.push(msg.sender);
        creditorAmounts[msg.sender] += msg.value;
    }

    function resetGovernment() public {
        // ❌ 当数组太大时，无法执行
        for (uint i = 0; i < creditorAddresses.length; i++) {
            creditorAmounts[creditorAddresses[i]] = 0;
        }
        delete creditorAddresses;
    }
}
```

**问题**：
- 超过 1000+ 债权人后，`resetGovernment()` 消耗的 Gas 超过区块限制
- 资金永久锁定在合约中

**教训**：避免无界循环

### 案例 2：King of the Ether

**漏洞**：新国王必须向前任国王支付，如果失败则无法成为新国王。

```solidity
// 简化版本
contract KingOfEther {
    address public king;
    uint public price;

    function claimThrone() public payable {
        require(msg.value > price, "Not enough");

        // ❌ 如果前任国王拒绝接收，交易失败
        payable(king).transfer(price);

        king = msg.sender;
        price = msg.value;
    }
}
```

**攻击**：攻击者的合约拒绝接收 ETH，永久成为国王。

## 防御策略

### 策略 1：拉取模式（Pull Pattern）

```solidity
contract PullPattern {
    mapping(address => uint) public balances;

    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

**优点**：
- ✅ 用户自行承担失败风险
- ✅ 不会阻塞其他用户
- ✅ Gas 消耗可控

### 策略 2：限制数组大小

```solidity
contract LimitedArray {
    address[] public items;
    uint public constant MAX_ITEMS = 100;

    function addItem(address item) public {
        require(items.length < MAX_ITEMS, "Array full");
        items.push(item);
    }
}
```

### 策略 3：使用映射而非数组

```solidity
contract UseMapping {
    mapping(address => bool) public isActive;
    mapping(address => uint) public index;
    uint public count;

    function add(address user) public {
        require(!isActive[user], "Already exists");

        isActive[user] = true;
        index[user] = count;
        count++;
    }

    function remove(address user) public {
        require(isActive[user], "Not exists");

        isActive[user] = false;
        // 不需要遍历整个数组
    }
}
```

### 策略 4：分页/批处理

```solidity
contract BatchProcessor {
    address[] public items;

    function processBatch(uint start, uint end) public {
        require(end <= items.length, "Invalid range");
        require(end - start <= 50, "Batch too large");

        for (uint i = start; i < end; i++) {
            // 处理每一项
            processItem(items[i]);
        }
    }

    function processItem(address item) internal {
        // 具体逻辑
    }
}
```

### 策略 5：Gas 限制检查

```solidity
contract GasChecker {
    function safeOperation() public {
        uint gasStart = gasleft();

        // 执行操作
        performOperation();

        uint gasUsed = gasStart - gasleft();
        require(gasUsed < 1000000, "Too much gas");
    }

    function performOperation() internal {
        // 操作逻辑
    }
}
```

### 策略 6：使用 try-catch 处理失败

```solidity
contract TryCatchExample {
    function safeBatchTransfer(address[] memory recipients, uint[] memory amounts) public {
        for (uint i = 0; i < recipients.length; i++) {
            try this.transferTo(recipients[i], amounts[i]) {
                // 成功
            } catch {
                // 失败了也继续，记录日志
                emit TransferFailed(recipients[i], amounts[i]);
            }
        }
    }

    function transferTo(address to, uint amount) public {
        payable(to).transfer(amount);
    }
}
```

### 策略 7：紧急暂停机制

```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

contract Emergency is Pausable {
    function criticalOperation() public whenNotPaused {
        // 关键操作
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
```

## DoS 防护检查清单

### ✅ 代码审查

- [ ] 没有无界循环（`for` 循环有明确上限）
- [ ] 没有对数组进行全量删除操作
- [ ] 外部调用失败不会阻塞关键功能
- [ ] 使用拉取模式而非推送模式
- [ ] 数组大小有上限限制
- [ ] 优先使用映射而非数组
- [ ] 重要操作有分页/批处理选项
- [ ] 有紧急暂停机制

### ✅ Gas 优化

- [ ] 单笔交易 Gas 消耗 < 1M
- [ ] 循环次数有上限（通常 < 100）
- [ ] 避免不必要的存储操作
- [ ] 使用事件而非存储记录历史

### ✅ 错误处理

- [ ] 外部调用使用 `try-catch` 或检查返回值
- [ ] 失败不影响其他用户
- [ ] 有明确的错误信息

## Gas 优化技巧

### 1. 使用 `unchecked` 节省 Gas

```solidity
function loop() public {
    for (uint i = 0; i < 100; ) {
        // 处理...

        unchecked {
            i++;  // 节省 Gas
        }
    }
}
```

### 2. 缓存数组长度

```solidity
// ❌ 每次循环都读取 length（昂贵）
for (uint i = 0; i < arr.length; i++) {
    // ...
}

// ✅ 缓存 length
uint length = arr.length;
for (uint i = 0; i < length; i++) {
    // ...
}
```

### 3. 使用 `calldata` 而非 `memory`

```solidity
// ❌ memory 更贵
function process(uint[] memory data) public {
    // ...
}

// ✅ calldata 更便宜（如果不修改）
function process(uint[] calldata data) public {
    // ...
}
```

### 4. 短路评估

```solidity
// ✅ 将廉价检查放在前面
require(cheapCheck() && expensiveCheck(), "Failed");
```

## 实战示例：安全的代币分发合约

```solidity
pragma solidity ^0.8.0;

contract SecureTokenDistributor {
    mapping(address => uint) public allocations;
    mapping(address => bool) public claimed;

    address public owner;
    uint public totalAllocated;

    uint public constant MAX_BATCH_SIZE = 50;

    event Claimed(address indexed user, uint amount);
    event AllocationSet(address indexed user, uint amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ✅ 批量设置分配，有大小限制
    function setAllocations(
        address[] calldata users,
        uint[] calldata amounts
    ) public onlyOwner {
        require(users.length == amounts.length, "Length mismatch");
        require(users.length <= MAX_BATCH_SIZE, "Batch too large");

        for (uint i = 0; i < users.length; ) {
            allocations[users[i]] = amounts[i];
            totalAllocated += amounts[i];

            emit AllocationSet(users[i], amounts[i]);

            unchecked { i++; }
        }
    }

    // ✅ 用户主动领取（拉取模式）
    function claim() public {
        uint amount = allocations[msg.sender];
        require(amount > 0, "No allocation");
        require(!claimed[msg.sender], "Already claimed");

        claimed[msg.sender] = true;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Claimed(msg.sender, amount);
    }

    // ✅ 查询未领取的用户（链下查询）
    function checkUnclaimed(address[] calldata users)
        public
        view
        returns (address[] memory, uint[] memory)
    {
        uint count = 0;

        // 计数
        for (uint i = 0; i < users.length; i++) {
            if (!claimed[users[i]] && allocations[users[i]] > 0) {
                count++;
            }
        }

        // 构建结果
        address[] memory unclaimedUsers = new address[](count);
        uint[] memory unclaimedAmounts = new uint[](count);

        uint index = 0;
        for (uint i = 0; i < users.length; i++) {
            if (!claimed[users[i]] && allocations[users[i]] > 0) {
                unclaimedUsers[index] = users[i];
                unclaimedAmounts[index] = allocations[users[i]];
                index++;
            }
        }

        return (unclaimedUsers, unclaimedAmounts);
    }

    receive() external payable {}
}
```

## 小结

**DoS 攻击是[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)的常见威胁**：

🎯 **核心原则**
- 使用拉取模式而非推送模式
- 避免无界循环
- 限制数组大小
- 优化 [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 消耗

🛡️ **防御策略**
- 分页/批处理
- 使用映射代替数组
- try-catch 处理失败
- 紧急暂停机制

📋 **最佳实践**
- 代码审查检查清单
- [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 优化技巧
- 充分测试极端情况

> **记住**：在设计合约时，始终考虑"如果有一百万用户会怎样？"


