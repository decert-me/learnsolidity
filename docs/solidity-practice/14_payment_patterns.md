在[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)中处理 ETH 支付是一个常见且关键的功能。本章介绍安全的支付模式和最佳实践，帮助大家避免常见的支付相关漏洞。

本章你将学到：
- 提取模式（Withdrawal Pattern）
- 推送与拉取支付
- 批量支付的实现
- 支付相关的安全问题

## 提取模式（Withdrawal Pattern）

提取模式是最安全的支付方式，让用户主动提取资金，而不是合约主动推送。

### ❌ 不推荐：推送支付

```solidity
pragma solidity ^0.8.0;

// 不安全的推送支付
contract PushPayment {
    address[] public winners;

    function distributeRewards() public {
        for (uint i = 0; i < winners.length; i++) {
            // 如果某个地址是合约且 fallback 失败，整个交易回滚
            payable(winners[i]).transfer(1 ether);
        }
    }
}
```

**问题**：
1. 如果某个接收者拒绝接收 ETH，整个分配失败
2. 容易遭受重入攻击
3. [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 消耗不可控

### ✅ 推荐：拉取支付（提取模式）

```solidity
pragma solidity ^0.8.0;

contract PullPayment {
    mapping(address => uint256) public pendingWithdrawals;

    event PaymentReceived(address from, uint256 amount);
    event Withdrawal(address to, uint256 amount);

    // 记录应付款项
    function recordPayment(address recipient, uint256 amount) internal {
        pendingWithdrawals[recipient] += amount;
    }

    // 用户主动提取
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        // 先更新状态，防止重入攻击
        pendingWithdrawals[msg.sender] = 0;

        // 再转账
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    // 查询可提取金额
    function pendingAmount(address account) public view returns (uint256) {
        return pendingWithdrawals[account];
    }
}
```

## 完整的提取模式示例

```solidity
pragma solidity ^0.8.0;

contract Auction {
    address public highestBidder;
    uint256 public highestBid;
    mapping(address => uint256) public pendingReturns;

    event NewBid(address bidder, uint256 amount);
    event Withdrawal(address bidder, uint256 amount);

    function bid() public payable {
        require(msg.value > highestBid, "Bid too low");

        // 记录前一个最高出价者的待返还金额
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit NewBid(msg.sender, msg.value);
    }

    // 失败的竞拍者提取资金
    function withdraw() public {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        // 先更新状态
        pendingReturns[msg.sender] = 0;

        // 再转账
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }
}
```

## 批量支付

安全地处理多个接收者的支付：

```solidity
pragma solidity ^0.8.0;

contract BatchPayment {
    mapping(address => uint256) public balances;

    event PaymentQueued(address indexed recipient, uint256 amount);
    event PaymentWithdrawn(address indexed recipient, uint256 amount);

    // 批量设置待支付金额
    function queuePayments(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) public payable {
        require(recipients.length == amounts.length, "Length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(msg.value >= totalAmount, "Insufficient funds");

        for (uint256 i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amounts[i];
            emit PaymentQueued(recipients[i], amounts[i]);
        }
    }

    // 接收者提取
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit PaymentWithdrawn(msg.sender, amount);
    }

    // 批量提取（由接收者调用）
    function withdrawBatch(address[] calldata recipients) public {
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = balances[recipient];

            if (amount > 0) {
                balances[recipient] = 0;
                (bool success, ) = recipient.call{value: amount}("");
                if (success) {
                    emit PaymentWithdrawn(recipient, amount);
                } else {
                    // 失败时恢复余额
                    balances[recipient] = amount;
                }
            }
        }
    }
}
```

## 分红合约示例

```solidity
pragma solidity ^0.8.0;

contract DividendDistributor {
    address[] public shareholders;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public pendingDividends;

    uint256 public totalShares;
    uint256 public totalDividends;

    event DividendsDeposited(uint256 amount);
    event DividendClaimed(address indexed shareholder, uint256 amount);

    function addShareholder(address shareholder, uint256 shareAmount) public {
        require(shares[shareholder] == 0, "Already shareholder");

        shareholders.push(shareholder);
        shares[shareholder] = shareAmount;
        totalShares += shareAmount;
    }

    // 接收分红
    receive() external payable {
        require(totalShares > 0, "No shareholders");
        totalDividends += msg.value;

        // 按比例分配到各个股东
        for (uint256 i = 0; i < shareholders.length; i++) {
            address shareholder = shareholders[i];
            uint256 dividend = (msg.value * shares[shareholder]) / totalShares;
            pendingDividends[shareholder] += dividend;
        }

        emit DividendsDeposited(msg.value);
    }

    // 股东提取分红
    function claimDividend() public {
        uint256 amount = pendingDividends[msg.sender];
        require(amount > 0, "No dividends");

        pendingDividends[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit DividendClaimed(msg.sender, amount);
    }
}
```

## 支付分割（Payment Splitter）

将支付按比例分配给多个接收者：

```solidity
pragma solidity ^0.8.0;

contract PaymentSplitter {
    address[] public payees;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;

    uint256 public totalShares;
    uint256 public totalReleased;

    event PaymentReceived(address from, uint256 amount);
    event PaymentReleased(address to, uint256 amount);

    constructor(address[] memory _payees, uint256[] memory _shares) {
        require(_payees.length == _shares.length, "Length mismatch");
        require(_payees.length > 0, "No payees");

        for (uint256 i = 0; i < _payees.length; i++) {
            require(_shares[i] > 0, "Share is 0");
            payees.push(_payees[i]);
            shares[_payees[i]] = _shares[i];
            totalShares += _shares[i];
        }
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function release(address payable account) public {
        require(shares[account] > 0, "No shares");

        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = (totalReceived * shares[account]) / totalShares - released[account];

        require(payment > 0, "No payment due");

        released[account] += payment;
        totalReleased += payment;

        (bool success, ) = account.call{value: payment}("");
        require(success, "Transfer failed");

        emit PaymentReleased(account, payment);
    }
}
```

## 安全检查清单

✅ **必须遵守的规则**：

1. **使用 CEI 模式**（Checks-Effects-Interactions）
   ```solidity
   // ✅ 正确：先检查，再修改状态，最后交互
   function withdraw() public {
       uint256 amount = balances[msg.sender];  // Check
       require(amount > 0);

       balances[msg.sender] = 0;  // Effect

       (bool success, ) = msg.sender.call{value: amount}("");  // Interaction
       require(success);
   }
   ```

2. **防止重入攻击**
   ```solidity
   // ✅ 使用 ReentrancyGuard
   import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

   contract Secure is ReentrancyGuard {
       function withdraw() public nonReentrant {
           // safe withdrawal logic
       }
   }
   ```

3. **检查 call 返回值**
   ```solidity
   // ✅ 总是检查返回值
   (bool success, ) = recipient.call{value: amount}("");
   //   不推荐限制gas
   //  (bool success, ) = recipient.call{value: amount, gas: 2300}("");
   require(success, "Transfer failed");
   ```


## 小结

- **提取模式**：让用户主动提取资金，比推送支付更安全
- **CEI 模式**：先检查条件，再修改状态，最后进行外部调用
- **批量支付**：记录待支付金额，让用户自行提取
- **分红模式**：按比例计算并分配收益
- **安全原则**：防重入、检查返回值、使用 call 而非 transfer

使用提取模式可以有效避免重入攻击和其他支付相关的安全问题。
