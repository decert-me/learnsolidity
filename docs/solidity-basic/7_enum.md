# 枚举类型

枚举（Enum）是一种用户自定义的数据类型，用于表示一组固定的命名常量。枚举让代码更具可读性和可维护性，特别适合表示有限的状态集合。

## 枚举的定义和使用

枚举使用 `enum` 关键字定义：

```solidity
pragma solidity ^0.8.0;

contract EnumBasics {
    // 定义一个枚举类型
    enum Status {
        Pending,    // 0
        Active,     // 1
        Inactive,   // 2
        Cancelled   // 3
    }

    // 声明枚举变量
    Status public currentStatus;

    // 设置枚举值
    function setStatus(Status _status) public {
        currentStatus = _status;
    }

    // 获取枚举值
    function getStatus() public view returns (Status) {
        return currentStatus;
    }
}
```

### 枚举的特点

- **从 0 开始编号**：第一个枚举值的整数值是 0，后续依次递增
- **默认值**：枚举变量的默认值是第一个枚举值（即 0）
- **值类型**：枚举是值类型，赋值时会进行拷贝
- **固定集合**：枚举值在定义后不能增加或删除

```solidity
pragma solidity ^0.8.0;

contract EnumDefaults {
    enum Color { Red, Green, Blue }

    Color public myColor;  // 默认值是 Red (0)

    function getDefaultColor() public view returns (Color) {
        return myColor;  // 返回 Red
    }

    function setGreen() public {
        myColor = Color.Green;  // 设置为 Green (1)
    }
}
```

## 枚举与整型的转换

枚举值在底层存储为 `uint8` 类型，可以与整型相互转换。

```solidity
pragma solidity ^0.8.0;

contract EnumConversion {
    enum Size { Small, Medium, Large, ExtraLarge }

    // 枚举转整型
    function enumToUint() public pure returns (uint) {
        Size s = Size.Large;
        return uint(s);  // 返回 2
    }

    // 整型转枚举（需要确保值在有效范围内）
    function uintToEnum(uint _value) public pure returns (Size) {
        require(_value <= uint(Size.ExtraLarge), "Invalid value");
        return Size(_value);
    }

    // 获取枚举的最小值和最大值
    function getRange() public pure returns (uint min, uint max) {
        min = uint(type(Size).min);  // 0
        max = uint(type(Size).max);  // 3
    }
}
```

> **类型转换安全：** 将整数转换为枚举时，必须确保整数值在枚举的有效范围内（0 到枚举值的数量-1），否则行为是未定义的。建议使用 `require` 进行检查。

## 枚举的操作

### 比较操作

枚举值支持相等和不等比较：

```solidity
pragma solidity ^0.8.0;

contract EnumComparison {
    enum OrderStatus { Created, Paid, Shipped, Delivered, Cancelled }

    OrderStatus public status = OrderStatus.Created;

    function isCreated() public view returns (bool) {
        return status == OrderStatus.Created;
    }

    function isNotCancelled() public view returns (bool) {
        return status != OrderStatus.Cancelled;
    }

    function canShip() public view returns (bool) {
        return status == OrderStatus.Paid;
    }
}
```

### 获取枚举信息

使用 `type()` 可以获取枚举的元信息：

```solidity
pragma solidity ^0.8.0;

contract EnumInfo {
    enum Level { Low, Medium, High, Critical }

    function getEnumInfo() public pure returns (uint min, uint max) {
        min = uint(type(Level).min);  // 最小值：0
        max = uint(type(Level).max);  // 最大值：3
        return (min, max);
    }

    function isValidLevel(uint value) public pure returns (bool) {
        return value >= uint(type(Level).min) && value <= uint(type(Level).max);
    }
}
```

## 实际应用场景

### 1. 订单状态管理

```solidity
pragma solidity ^0.8.0;

contract OrderManagement {
    enum OrderStatus {
        Pending,      // 待支付
        Paid,         // 已支付
        Processing,   // 处理中
        Shipped,      // 已发货
        Delivered,    // 已送达
        Cancelled,    // 已取消
        Refunded      // 已退款
    }

    struct Order {
        uint id;
        address customer;
        OrderStatus status;
        uint amount;
    }

    mapping(uint => Order) public orders;
    uint public nextOrderId;

    event OrderStatusChanged(uint orderId, OrderStatus oldStatus, OrderStatus newStatus);

    // 创建订单
    function createOrder(uint amount) public returns (uint) {
        uint orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            customer: msg.sender,
            status: OrderStatus.Pending,
            amount: amount
        });
        return orderId;
    }

    // 支付订单
    function payOrder(uint orderId) public payable {
        Order storage order = orders[orderId];
        require(order.customer == msg.sender, "Not your order");
        require(order.status == OrderStatus.Pending, "Invalid status");
        require(msg.value == order.amount, "Incorrect amount");

        OrderStatus oldStatus = order.status;
        order.status = OrderStatus.Paid;
        emit OrderStatusChanged(orderId, oldStatus, order.status);
    }

    // 发货
    function shipOrder(uint orderId) public {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Paid, "Order not paid");

        OrderStatus oldStatus = order.status;
        order.status = OrderStatus.Shipped;
        emit OrderStatusChanged(orderId, oldStatus, order.status);
    }

    // 取消订单
    function cancelOrder(uint orderId) public {
        Order storage order = orders[orderId];
        require(order.customer == msg.sender, "Not your order");
        require(
            order.status == OrderStatus.Pending ||
            order.status == OrderStatus.Paid,
            "Cannot cancel"
        );

        OrderStatus oldStatus = order.status;
        order.status = OrderStatus.Cancelled;
        emit OrderStatusChanged(orderId, oldStatus, order.status);
    }
}
```

### 2. 投票系统

```solidity
pragma solidity ^0.8.0;

contract VotingSystem {
    enum VoteOption { Abstain, Yes, No }
    enum ProposalState { Pending, Active, Passed, Rejected, Executed }

    struct Proposal {
        string description;
        ProposalState state;
        uint yesVotes;
        uint noVotes;
        uint startTime;
        uint endTime;
    }

    mapping(uint => Proposal) public proposals;
    mapping(uint => mapping(address => VoteOption)) public votes;
    uint public proposalCount;

    // 创建提案
    function createProposal(string memory description, uint duration) public {
        uint proposalId = proposalCount++;
        proposals[proposalId] = Proposal({
            description: description,
            state: ProposalState.Pending,
            yesVotes: 0,
            noVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration
        });
    }

    // 激活提案
    function activateProposal(uint proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Pending, "Invalid state");
        proposal.state = ProposalState.Active;
    }

    // 投票
    function vote(uint proposalId, VoteOption option) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Not active");
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(votes[proposalId][msg.sender] == VoteOption.Abstain, "Already voted");

        votes[proposalId][msg.sender] = option;

        if (option == VoteOption.Yes) {
            proposal.yesVotes++;
        } else if (option == VoteOption.No) {
            proposal.noVotes++;
        }
    }

    // 结束投票
    function finalizeProposal(uint proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Not active");
        require(block.timestamp >= proposal.endTime, "Voting not ended");

        if (proposal.yesVotes > proposal.noVotes) {
            proposal.state = ProposalState.Passed;
        } else {
            proposal.state = ProposalState.Rejected;
        }
    }
}
```

### 3. 游戏角色状态

```solidity
pragma solidity ^0.8.0;

contract GameCharacter {
    enum CharacterClass { Warrior, Mage, Archer, Rogue }
    enum CharacterState { Idle, Fighting, Resting, Dead }

    struct Character {
        string name;
        CharacterClass class;
        CharacterState state;
        uint health;
        uint level;
    }

    mapping(address => Character) public characters;

    // 创建角色
    function createCharacter(string memory name, CharacterClass class) public {
        require(bytes(characters[msg.sender].name).length == 0, "Character exists");

        characters[msg.sender] = Character({
            name: name,
            class: class,
            state: CharacterState.Idle,
            health: 100,
            level: 1
        });
    }

    // 开始战斗
    function startBattle() public {
        Character storage char = characters[msg.sender];
        require(bytes(char.name).length > 0, "No character");
        require(char.state == CharacterState.Idle, "Not idle");
        require(char.health > 0, "Character dead");

        char.state = CharacterState.Fighting;
    }

    // 休息恢复
    function rest() public {
        Character storage char = characters[msg.sender];
        require(char.state == CharacterState.Idle, "Must be idle");

        char.state = CharacterState.Resting;
        // 恢复生命值逻辑
        if (char.health < 100) {
            char.health = 100;
        }
        char.state = CharacterState.Idle;
    }

    // 获取角色类型说明
    function getClassDescription(CharacterClass class) public pure returns (string memory) {
        if (class == CharacterClass.Warrior) {
            return "Strong melee fighter";
        } else if (class == CharacterClass.Mage) {
            return "Powerful magic user";
        } else if (class == CharacterClass.Archer) {
            return "Skilled ranged attacker";
        } else {
            return "Stealthy assassin";
        }
    }
}
```

### 4. 交易状态机

```solidity
pragma solidity ^0.8.0;

contract Escrow {
    enum EscrowState {
        Created,          // 创建
        FundsDeposited,   // 资金已存入
        InDispute,        // 争议中
        Completed,        // 完成
        Refunded,         // 已退款
        Cancelled         // 已取消
    }

    struct EscrowTransaction {
        address buyer;
        address seller;
        uint amount;
        EscrowState state;
    }

    mapping(uint => EscrowTransaction) public transactions;
    uint public transactionCount;

    event StateChanged(uint transactionId, EscrowState newState);

    // 创建托管交易
    function createEscrow(address seller) public payable returns (uint) {
        require(msg.value > 0, "Must send funds");

        uint txId = transactionCount++;
        transactions[txId] = EscrowTransaction({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            state: EscrowState.FundsDeposited
        });

        emit StateChanged(txId, EscrowState.FundsDeposited);
        return txId;
    }

    // 完成交易（资金转给卖家）
    function completeEscrow(uint txId) public {
        EscrowTransaction storage txn = transactions[txId];
        require(msg.sender == txn.buyer, "Only buyer can complete");
        require(txn.state == EscrowState.FundsDeposited, "Invalid state");

        txn.state = EscrowState.Completed;
        payable(txn.seller).transfer(txn.amount);

        emit StateChanged(txId, EscrowState.Completed);
    }

    // 发起争议
    function raiseDispute(uint txId) public {
        EscrowTransaction storage txn = transactions[txId];
        require(
            msg.sender == txn.buyer || msg.sender == txn.seller,
            "Not authorized"
        );
        require(txn.state == EscrowState.FundsDeposited, "Invalid state");

        txn.state = EscrowState.InDispute;
        emit StateChanged(txId, EscrowState.InDispute);
    }

    // 退款给买家
    function refund(uint txId) public {
        EscrowTransaction storage txn = transactions[txId];
        require(msg.sender == txn.seller, "Only seller can refund");
        require(
            txn.state == EscrowState.FundsDeposited ||
            txn.state == EscrowState.InDispute,
            "Invalid state"
        );

        txn.state = EscrowState.Refunded;
        payable(txn.buyer).transfer(txn.amount);

        emit StateChanged(txId, EscrowState.Refunded);
    }
}
```

## 枚举与字符串转换

Solidity 原生不支持枚举与字符串的直接转换，但可以通过辅助函数实现：

```solidity
pragma solidity ^0.8.0;

contract EnumToString {
    enum Status { Pending, Active, Completed, Cancelled }

    // 枚举转字符串
    function statusToString(Status _status) public pure returns (string memory) {
        if (_status == Status.Pending) return "Pending";
        if (_status == Status.Active) return "Active";
        if (_status == Status.Completed) return "Completed";
        if (_status == Status.Cancelled) return "Cancelled";
        return "Unknown";
    }

    // 字符串转枚举（简化版，实际需要更复杂的字符串比较）
    function stringToStatus(string memory _status)
        public
        pure
        returns (Status)
    {
        bytes32 statusHash = keccak256(bytes(_status));

        if (statusHash == keccak256("Pending")) return Status.Pending;
        if (statusHash == keccak256("Active")) return Status.Active;
        if (statusHash == keccak256("Completed")) return Status.Completed;
        if (statusHash == keccak256("Cancelled")) return Status.Cancelled;

        revert("Invalid status string");
    }
}
```

## 存储和 Gas 优化

### 枚举的存储大小

枚举在存储时使用能容纳所有枚举值的最小整数类型：

```solidity
pragma solidity ^0.8.0;

contract EnumStorage {
    // 4个值，可以用 uint8 存储（0-255）
    enum SmallEnum { A, B, C, D }  // 使用 uint8

    // 256个值，需要 uint8
    enum MediumEnum { V0, V1 /* ... 省略 ... */, V255 }  // 使用 uint8

    // 257个值，需要 uint16
    enum LargeEnum { V0, V1 /* ... 省略 ... */, V256 }  // 使用 uint16
}
```

### 打包优化

枚举可以与其他变量打包到同一个存储槽中：

```solidity
pragma solidity ^0.8.0;

contract EnumPacking {
    enum Status { Pending, Active, Completed }

    // 糟糕的布局
    Status public status1;     // 槽 0
    uint256 public value1;     // 槽 1
    Status public status2;     // 槽 2

    // 优化的布局（打包）
    Status public status3;     // 槽 3
    uint128 public value2;     // 槽 3（与 status3 打包）
    uint64 public value3;      // 槽 3（与 status3 打包）
}
```

> **Gas 优化：** 将枚举与其他小类型变量（如 `uint8`、`uint64`、`address` 等）组合声明，可以打包到同一个存储槽中，减少存储操作的 Gas 消耗。

## 最佳实践

### 1. 使用枚举提高可读性

```solidity
// ❌ 不好：使用魔法数字
contract BadExample {
    uint public status;  // 0=pending, 1=active, 2=completed ???

    function setActive() public {
        status = 1;  // 魔法数字，含义不明
    }
}

// ✅ 好：使用枚举
contract GoodExample {
    enum Status { Pending, Active, Completed }
    Status public status;

    function setActive() public {
        status = Status.Active;  // 清晰明了
    }
}
```

### 2. 为状态转换添加验证

```solidity
pragma solidity ^0.8.0;

contract StateTransitions {
    enum State { Created, Started, Paused, Completed }
    State public currentState = State.Created;

    // 验证状态转换是否合法
    function start() public {
        require(currentState == State.Created, "Can only start from Created");
        currentState = State.Started;
    }

    function pause() public {
        require(currentState == State.Started, "Can only pause when Started");
        currentState = State.Paused;
    }

    function resume() public {
        require(currentState == State.Paused, "Can only resume when Paused");
        currentState = State.Started;
    }

    function complete() public {
        require(
            currentState == State.Started || currentState == State.Paused,
            "Invalid state to complete"
        );
        currentState = State.Completed;
    }
}
```

### 3. 为状态变化发出事件

```solidity
pragma solidity ^0.8.0;

contract StateEvents {
    enum Status { Pending, Active, Completed, Cancelled }
    Status public status;

    event StatusChanged(Status indexed oldStatus, Status indexed newStatus, uint timestamp);

    function changeStatus(Status newStatus) public {
        Status oldStatus = status;
        status = newStatus;
        emit StatusChanged(oldStatus, newStatus, block.timestamp);
    }
}
```

## 操练

### 练习1：实现简单的工作流

```SolidityEditor
pragma solidity ^0.8.0;

contract WorkflowPractice {
    enum TaskStatus { Todo, InProgress, Review, Done }

    struct Task {
        string description;
        TaskStatus status;
    }

    mapping(uint => Task) public tasks;
    uint public taskCount;

    // TODO: 创建任务
    function createTask(string memory description) public returns (uint) {
        // 你的代码
    }

    // TODO: 开始任务
    function startTask(uint taskId) public {
        // 你的代码
    }

    // TODO: 提交审查
    function submitForReview(uint taskId) public {
        // 你的代码
    }

    // TODO: 完成任务
    function completeTask(uint taskId) public {
        // 你的代码
    }
}
```

### 练习2：实现简单的拍卖合约

```SolidityEditor
pragma solidity ^0.8.0;

contract AuctionPractice {
    enum AuctionState { Created, Active, Ended, Cancelled }

    struct Auction {
        address seller;
        uint startingPrice;
        AuctionState state;
        address highestBidder;
        uint highestBid;
    }

    // TODO: 实现拍卖的状态转换和出价逻辑
}
```

## 小结

- **枚举定义**：使用 `enum` 关键字定义一组命名常量，从 0 开始编号
- **默认值**：枚举变量的默认值是第一个枚举值（0）
- **类型转换**：可以与 `uint` 相互转换，但需要注意范围检查
- **应用场景**：非常适合表示有限的状态集合，如订单状态、游戏状态、投票选项等
- **状态机**：枚举是实现状态机的理想选择，可以使状态转换逻辑清晰且安全
- **Gas 优化**：与其他小类型变量打包存储可以节省 Gas
- **最佳实践**：使用枚举而不是魔法数字，添加状态转换验证，发出状态变化事件

枚举是编写清晰、可维护智能合约的重要工具，善用枚举可以大大提高代码质量！

