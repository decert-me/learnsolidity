# 重入攻击与防御

重入攻击（Reentrancy Attack）是智能合约中最危险和最常见的漏洞之一。历史上最著名的 The DAO 攻击事件就是利用了重入漏洞，导致了价值 6000 万美元的以太币被盗。理解和防范重入攻击是每个 Solidity 开发者必须掌握的技能。

## 什么是重入攻击

重入攻击是指攻击者利用合约的外部调用，在原函数执行完毕前再次调用该函数或相关函数，从而破坏合约的预期执行流程。

### 攻击的基本原理

想象这样一个场景：

1. 你去银行取款 100 元
2. 银行检查你的余额：有 100 元 ✅
3. 银行给你 100 元现金
4. **在银行记账之前**，你瞬间回到步骤 1，再次取款
5. 银行再次检查余额：还是 100 元 ✅（因为还没记账）
6. 银行再次给你 100 元
7. 重复以上步骤...

这就是重入攻击的本质：**在状态更新之前重复执行函数**。

## The DAO 攻击事件

2016 年 6 月，The DAO 遭受重入攻击，攻击者利用 splitDAO 函数的重入漏洞，盗取了约 360 万个以太币（当时价值约 6000 万美元）。

这次攻击直接导致了以太坊的硬分叉，分裂成 Ethereum (ETH) 和 Ethereum Classic (ETC)。

> **历史教训：** The DAO 攻击是区块链历史上最重大的安全事件之一，它深刻地告诉我们：**智能合约的安全性至关重要，一个小的漏洞可能导致灾难性后果**。

## 漏洞代码示例

让我们看一个典型的存在重入漏洞的合约：

```solidity
pragma solidity ^0.8.0;

// ❌ 危险：存在重入漏洞的合约
contract VulnerableBank {
    mapping(address => uint) public balances;

    // 存款
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // 提款 - 存在重入漏洞！
    function withdraw() public {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // 危险：先转账，后更新状态
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        // 状态更新在转账之后！
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

### 攻击合约

攻击者可以这样利用上述漏洞：

```solidity
pragma solidity ^0.8.0;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw() external;
}

// 攻击合约
contract Attacker {
    IVulnerableBank public vulnerableBank;
    uint public constant DEPOSIT_AMOUNT = 1 ether;

    constructor(address _vulnerableBankAddress) {
        vulnerableBank = IVulnerableBank(_vulnerableBankAddress);
    }

    // 发起攻击
    function attack() external payable {
        require(msg.value >= DEPOSIT_AMOUNT, "Need at least 1 ETH");

        // 1. 先存入 1 ETH
        vulnerableBank.deposit{value: DEPOSIT_AMOUNT}();

        // 2. 开始提款，触发重入
        vulnerableBank.withdraw();
    }

    // 接收 ETH 的回调函数 - 这里是重入的关键！
    receive() external payable {
        // 如果银行还有余额，继续提款
        if (address(vulnerableBank).balance >= DEPOSIT_AMOUNT) {
            // 重入：再次调用 withdraw
            vulnerableBank.withdraw();
        }
    }

    // 获取攻击所得
    function getStolen() public {
        payable(msg.sender).transfer(address(this).balance);
    }
}
```

### 攻击流程分析

```
1. 攻击者存入 1 ETH
   VulnerableBank.balances[Attacker] = 1 ETH

2. 攻击者调用 withdraw()
   ├─ 检查余额：1 ETH ✅
   ├─ 转账 1 ETH 给 Attacker
   │   └─ 触发 Attacker.receive()
   │       └─ 银行还有钱？是的！
   │           └─ 再次调用 withdraw() ⚠️ 重入！
   │               ├─ 检查余额：还是 1 ETH ✅ (还没更新)
   │               ├─ 再次转账 1 ETH
   │               │   └─ 再次触发 receive()
   │               │       └─ 继续重入...
   │               └─ 直到银行余额不足
   └─ 最后才更新状态：balances[Attacker] = 0
```

> **⚠️ 关键问题：** 漏洞的根本原因是：**在转账（外部调用）之后才更新状态（余额清零）**。在外部调用期间，合约的状态仍然是旧的，攻击者可以利用这个时间窗口重复调用。

## 防御方法

### 方法 1：Checks-Effects-Interactions 模式（推荐）

这是最重要的安全模式，要求按照以下顺序编写代码：

1. **Checks（检查）**：验证条件和权限
2. **Effects（状态变更）**：更新合约状态
3. **Interactions（外部交互）**：调用外部合约或转账

```solidity
pragma solidity ^0.8.0;

// ✅ 安全：使用 Checks-Effects-Interactions 模式
contract SecureBank {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        // 1. Checks - 检查条件
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // 2. Effects - 先更新状态！
        balances[msg.sender] = 0;

        // 3. Interactions - 最后才进行外部调用
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

> **为什么这样安全？** 即使攻击者在 `receive()` 中再次调用 `withdraw()`，此时 `balances[msg.sender]` 已经是 0 了，`require(balance > 0)` 会失败，攻击被阻止。

### 方法 2：使用 ReentrancyGuard（推荐）

OpenZeppelin 提供了一个可重用的重入防护合约。

```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ✅ 安全：使用 ReentrancyGuard
contract SecureBankWithGuard is ReentrancyGuard {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // nonReentrant 修饰符防止重入
    function withdraw() public nonReentrant {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

#### ReentrancyGuard 的工作原理

```solidity
// OpenZeppelin ReentrancyGuard 的简化实现
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        // 检查是否已经进入
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // 标记为已进入
        _status = _ENTERED;

        // 执行函数
        _;

        // 恢复状态
        _status = _NOT_ENTERED;
    }
}
```

### 方法 3：自定义重入锁

你也可以实现自己的重入锁：

```solidity
pragma solidity ^0.8.0;

// ✅ 安全：使用自定义重入锁
contract SecureBankWithLock {
    mapping(address => uint) public balances;
    bool private locked;

    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public noReentrant {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

### 方法 4：限制 Gas（不推荐作为唯一防御）

使用 `transfer()` 或 `send()` 限制 Gas 为 2300，但这**不是可靠的防御方法**。

```solidity
pragma solidity ^0.8.0;

contract GasLimitedBank {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        balances[msg.sender] = 0;

        // transfer 限制 Gas 为 2300
        // 攻击者的 receive() 函数会因 Gas 不足而失败
        payable(msg.sender).transfer(balance);
    }
}
```

> **为什么不推荐？**
>
> 1. **Gas 成本可能改变**：EVM 的 opcode 成本在硬分叉后可能改变
> 2. **限制了合法使用**：接收方可能是合约，需要执行一些逻辑
> 3. **不是根本解决方案**：应该从设计上避免重入，而不是依赖 Gas 限制

## 跨函数重入攻击

重入攻击不仅限于同一个函数，还可能发生在不同函数之间。

### 跨函数重入示例

```solidity
pragma solidity ^0.8.0;

// ❌ 危险：跨函数重入
contract CrossFunctionReentrancy {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // 外部调用，可能触发重入
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        // 后更新状态
        balances[msg.sender] = 0;
    }

    // 另一个函数也依赖 balances
    function transfer(address to, uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

攻击者可以在 `withdraw()` 的外部调用中调用 `transfer()`，此时 `balances[msg.sender]` 还未清零！

```solidity
// 攻击合约
contract CrossFunctionAttacker {
    CrossFunctionReentrancy public target;
    address public accomplice;

    constructor(address _target, address _accomplice) {
        target = CrossFunctionReentrancy(_target);
        accomplice = _accomplice;
    }

    function attack() external payable {
        target.deposit{value: msg.value}();
        target.withdraw();
    }

    receive() external payable {
        // 在 withdraw 更新状态前，把余额转给同伙
        target.transfer(accomplice, msg.value);
    }
}
```

### 防御跨函数重入

使用 `ReentrancyGuard` 保护所有可能被重入的函数：

```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ✅ 安全：所有函数都加上保护
contract SecureCrossFunctionContract is ReentrancyGuard {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // 保护 withdraw
    function withdraw() public nonReentrant {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // 保护 transfer
    function transfer(address to, uint amount) public nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

## 只读重入攻击

在某些情况下，即使是 `view` 函数也可能受到重入攻击的影响。

```solidity
pragma solidity ^0.8.0;

// ❌ 危险：只读重入
contract VulnerableVault {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // 先转账
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success);

        // 后更新
        balances[msg.sender] = 0;
    }

    // view 函数，用于获取总价值
    function getTotalValue() public view returns (uint) {
        return address(this).balance;
    }
}

// 价格预言机，依赖 vault 的余额
contract PriceOracle {
    VulnerableVault public vault;

    constructor(address _vault) {
        vault = VulnerableVault(_vault);
    }

    function getPrice() public view returns (uint) {
        // 基于 vault 余额计算价格
        return vault.getTotalValue() * 100;
    }
}

// 攻击者利用只读重入
contract ReadOnlyReentrancyAttacker {
    VulnerableVault public vault;
    PriceOracle public oracle;

    constructor(address _vault, address _oracle) {
        vault = VulnerableVault(_vault);
        oracle = PriceOracle(_oracle);
    }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    receive() external payable {
        // 在 withdraw 还未更新状态时
        // vault.getTotalValue() 返回的还是包含已提款金额的余额
        uint manipulatedPrice = oracle.getPrice();
        // 利用错误的价格进行套利...
    }
}
```

> **只读重入的危险：** 即使函数只读取状态不修改状态，如果读取的状态是"不一致"的（已转账但未更新），也可能被利用。

## 实战：编写安全的 DeFi 合约

让我们实现一个安全的质押池合约：

```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ✅ 安全的质押池
contract SecureStakingPool is ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    mapping(address => uint) public stakedBalance;
    mapping(address => uint) public rewards;

    uint public totalStaked;
    uint public rewardRate = 100; // 每个区块的奖励率

    mapping(address => uint) private lastUpdateBlock;

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    // 更新奖励
    function updateReward(address account) internal {
        if (stakedBalance[account] > 0) {
            uint blocks = block.number - lastUpdateBlock[account];
            rewards[account] += stakedBalance[account] * blocks * rewardRate / 1e18;
        }
        lastUpdateBlock[account] = block.number;
    }

    // 质押代币
    function stake(uint amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");

        // 1. Checks
        require(
            stakingToken.balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );

        // 更新奖励
        updateReward(msg.sender);

        // 2. Effects - 先更新状态
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        // 3. Interactions - 最后外部调用
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }

    // 取出质押
    function unstake(uint amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");

        // 1. Checks
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked");

        // 更新奖励
        updateReward(msg.sender);

        // 2. Effects - 先更新状态
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // 3. Interactions - 最后外部调用
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
    }

    // 领取奖励
    function claimRewards() external nonReentrant {
        // 更新奖励
        updateReward(msg.sender);

        // 1. Checks
        uint reward = rewards[msg.sender];
        require(reward > 0, "No rewards");

        // 2. Effects - 先更新状态
        rewards[msg.sender] = 0;

        // 3. Interactions - 最后外部调用
        require(rewardToken.transfer(msg.sender, reward), "Transfer failed");
    }

    // 查询可领取奖励
    function pendingRewards(address account) external view returns (uint) {
        uint pending = rewards[account];
        if (stakedBalance[account] > 0) {
            uint blocks = block.number - lastUpdateBlock[account];
            pending += stakedBalance[account] * blocks * rewardRate / 1e18;
        }
        return pending;
    }
}
```

## 检查清单：如何避免重入攻击

在编写合约时，请遵循以下检查清单：

### ✅ 设计阶段

- [ ] 识别所有外部调用（`call`、`transfer`、`send`、外部合约调用）
- [ ] 确定每个函数是否需要重入保护
- [ ] 规划状态更新的顺序

### ✅ 编码阶段

- [ ] 遵循 **Checks-Effects-Interactions** 模式
- [ ] 在外部调用**之前**更新所有相关状态
- [ ] 对涉及资金转移的函数使用 `nonReentrant` 修饰符
- [ ] 考虑跨函数重入的可能性
- [ ] 对只读函数的一致性保持警惕

### ✅ 审计阶段

- [ ] 检查所有 `call`、`delegatecall` 的使用
- [ ] 检查所有代币转账（ERC20、ERC721 等）
- [ ] 模拟攻击场景，尝试重入
- [ ] 使用安全工具（Slither、Mythril）扫描

## 常见误区

### ❌ 误区 1：只保护提款函数

```solidity
// 错误：只保护了 withdraw
contract IncompleteProtection {
    mapping(address => uint) public balances;

    function withdraw() public nonReentrant {
        // ...
    }

    // 忘记保护 transfer！
    function transfer(address to, uint amount) public {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**正确做法**：保护所有可能被重入的函数。

### ❌ 误区 2：依赖 Gas 限制

```solidity
// 错误：认为 transfer 的 2300 Gas 限制可以阻止重入
function withdraw() public {
    uint balance = balances[msg.sender];
    // 先更新状态是更好的选择！
    payable(msg.sender).transfer(balance);
    balances[msg.sender] = 0;
}
```

**正确做法**：先更新状态，不要依赖 Gas 限制。

### ❌ 误区 3：认为 view 函数是安全的

```solidity
// 错误：认为 view 函数不需要考虑重入
function getBalance() public view returns (uint) {
    // 如果在重入攻击期间调用，返回的可能是不一致的状态
    return balances[msg.sender];
}
```

**正确做法**：确保状态的一致性，必要时也使用重入保护。

## 实用工具

### Slither 静态分析

```bash
pip3 install slither-analyzer
slither vulnerable_contract.sol
```

Slither 可以自动检测重入漏洞。

### Mythril 符号执行

```bash
pip3 install mythril
myth analyze vulnerable_contract.sol
```

Mythril 可以发现潜在的重入攻击路径。

## 操练

### 练习 1：修复重入漏洞

```SolidityEditor
pragma solidity ^0.8.0;

// TODO: 修复这个合约的重入漏洞
contract VulnerableAuction {
    mapping(address => uint) public bids;
    address public highestBidder;
    uint public highestBid;

    function bid() public payable {
        require(msg.value > highestBid, "Bid too low");

        // 退还前一个最高出价
        if (highestBidder != address(0)) {
            (bool success, ) = highestBidder.call{value: highestBid}("");
            require(success, "Refund failed");
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        bids[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint amount = bids[msg.sender];
        require(amount > 0, "No bids");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdraw failed");

        bids[msg.sender] = 0;
    }
}
```

### 练习 2：实现安全的众筹合约

```SolidityEditor
pragma solidity ^0.8.0;

// TODO: 实现一个安全的众筹合约
contract CrowdFunding {
    address public owner;
    uint public goal;
    uint public deadline;
    mapping(address => uint) public contributions;
    uint public totalContributions;
    bool public goalReached;

    // TODO: 实现贡献函数
    function contribute() public payable {
        // 你的代码
    }

    // TODO: 实现退款函数（如果未达成目标）
    function refund() public {
        // 你的代码 - 注意防止重入！
    }

    // TODO: 实现提款函数（项目方提取资金）
    function withdraw() public {
        // 你的代码 - 注意防止重入！
    }
}
```

## 小结

重入攻击是智能合约安全中最关键的问题之一。记住以下要点：

- **Checks-Effects-Interactions 模式**：这是防止重入的黄金法则
  - Checks：检查条件
  - Effects：更新状态
  - Interactions：外部调用

- **使用 ReentrancyGuard**：OpenZeppelin 提供的可靠保护

- **全面保护**：不仅是提款函数，所有涉及外部调用的函数都要考虑

- **跨函数重入**：攻击可能发生在不同函数之间

- **只读重入**：即使是 view 函数也可能被利用

- **不要依赖 Gas 限制**：这不是可靠的防御方法

- **使用安全工具**：Slither、Mythril 可以帮助发现漏洞

**永远记住**：在外部调用**之前**更新状态！

---

来 [DeCert.me](https://decert.me/quests/10003) 码一个未来，DeCert 让每一位开发者轻松构建自己的可信履历。

DeCert.me 由登链社区 [@UpchainDAO](https://twitter.com/upchaindao) 孵化，欢迎 [Discord 频道](https://discord.com/invite/kuSZHftTqe) 一起交流。

本教程来自贡献者 [@Tiny熊](https://twitter.com/tinyxiong_eth)。
