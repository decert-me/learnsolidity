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

## 实际应用示例

枚举非常适合表示状态，例如订单状态管理：

```solidity
pragma solidity ^0.8.0;

contract SimpleOrder {
    enum OrderStatus {
        Pending,      // 待支付
        Paid,         // 已支付
        Shipped,      // 已发货
        Cancelled     // 已取消
    }

    struct Order {
        uint id;
        address customer;
        OrderStatus status;
    }

    mapping(uint => Order) public orders;
    uint public nextOrderId;

    // 创建订单
    function createOrder() public returns (uint) {
        uint orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            customer: msg.sender,
            status: OrderStatus.Pending
        });
        return orderId;
    }

    // 支付订单
    function payOrder(uint orderId) public {
        Order storage order = orders[orderId];
        require(order.customer == msg.sender, "Not your order");
        require(order.status == OrderStatus.Pending, "Invalid status");

        order.status = OrderStatus.Paid;
    }

    // 发货
    function shipOrder(uint orderId) public {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Paid, "Order not paid");
        order.status = OrderStatus.Shipped;
    }

    // 取消订单
    function cancelOrder(uint orderId) public {
        Order storage order = orders[orderId];
        require(order.customer == msg.sender, "Not your order");
        require(order.status == OrderStatus.Pending, "Can only cancel pending orders");

        order.status = OrderStatus.Cancelled;
    }
}
```

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

### 练习：实现简单的工作流

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

    // TODO: 开始任务（从 Todo 转到 InProgress）
    function startTask(uint taskId) public {
        // 你的代码
    }

    // TODO: 提交审查（从 InProgress 转到 Review）
    function submitForReview(uint taskId) public {
        // 你的代码
    }

    // TODO: 完成任务（从 Review 转到 Done）
    function completeTask(uint taskId) public {
        // 你的代码
    }
}
```

## 小结

- **枚举定义**：使用 `enum` 关键字定义一组命名常量，从 0 开始编号
- **默认值**：枚举变量的默认值是第一个枚举值（0）
- **类型转换**：可以与 `uint` 相互转换，但需要注意范围检查
- **应用场景**：非常适合表示有限的状态集合，如订单状态、工作流状态等
- **最佳实践**：使用枚举而不是魔法数字，添加状态转换验证，发出状态变化事件

枚举是编写清晰、可维护[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)的重要工具，善用枚举可以大大提高代码质量！

### 进阶学习

想了解更多高级用法，可以参考：

- [状态机模式](../solidity-practice/10_state_machine.md) - 复杂状态管理的设计模式
