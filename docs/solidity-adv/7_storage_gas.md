在 Solidity 编程中，优化合约的 gas 消耗不仅是性能问题，更是经济问题。理解 EVM 的存储机制和 gas 计算规则，是编写高效智能合约的关键。

本文将深入探讨：
- EVM 存储机制的底层原理
- 各种存储位置的 gas 成本
- 实用的优化技巧和实测对比
- 常见的反模式和陷阱

## 存储位置概览

> 在[类型一节](https://learnblockchain.cn/article/22531)中，我们已经学习了 Solidity 中的数据位置概念。这里我们深入讨论它们的实现原理和优化策略。

Solidity 中有四种数据位置，它们在 EVM 层面有完全不同的实现：

| 位置 | EVM 实现 | 持久性 | 典型成本 | 适用场景 |
|------|---------|--------|---------|---------|
| **storage** | 合约存储槽 | 永久 | 20,000 gas (写) | 状态变量 |
| **memory** | 内存 | 函数调用期间 | 3 gas + 扩展成本 | 临时数据 |
| **calldata** | 交易数据 | 函数调用期间 | 3 gas (只读) | 外部函数参数 |
| **transient** | 临时存储 | 交易期间 | 100 gas (写) | 重入锁、临时标记 |


## EVM 存储机制解析

### Storage：存储槽

**核心概念**：
- EVM 的 storage 由 2^256 个存储槽（slot）组成，每个槽 32 字节
- 状态变量按声明顺序从 slot 0 开始分配
- Solidity 会尝试将多个小变量打包到同一个槽中

**操作码成本**（基于 EIP-2929）：
```
SLOAD（读）：
  - 冷访问（首次）：2,100 gas
  - 热访问（同一交易中再次访问）：100 gas

SSTORE（写）：
  - 从零改为非零：20,000 gas
  - 从非零改为另一个非零：2,900 gas（热访问）
  - 从非零改为零：-15,000 gas（退还 gas）
```

### Memory：临时内存

**成本模型**：
Memory 的成本是**二次增长**的：

```
cost = 3 * word_count + (word_count^2 / 512)
```

这意味着使用的内存越多，边际成本越高。

**示例**：
- 前 724 字节：~3 gas/字节
- 第 1KB - 10KB：~5 gas/字节
- 超过 100KB：成本急剧上升

### Calldata：交易数据

**成本**：
- 零字节：4 gas/字节
- 非零字节：16 gas/字节（EIP-2028 后）
- 读取：3 gas（CALLDATALOAD）

**为什么便宜**：
- 直接读取交易数据，无需复制到 memory
- 只读，无法修改

### Transient Storage（EIP-1153）

**特点**（Solidity 0.8.24+）：
- 只在当前交易生命周期内存在
- 交易结束自动清零
- 成本介于 storage 和 memory 之间

**操作码成本**：
```
TLOAD：100 gas
TSTORE：100 gas
```

## Storage 优化

### 1. 变量打包（Packing）

**原理**：充分利用 32 字节的存储槽。
**变量打包规则**：

```solidity
contract StorageLayout {
    // ❌ 低效：占用 3 个槽
    uint128 a;  // slot 0 (前 16 字节)
    uint256 b;  // slot 1 (完整 32 字节，无法与 a 共享槽)
    uint128 c;  // slot 2 (前 16 字节)

    // ✅ 高效：占用 2 个槽
    uint128 d;  // slot 3 (前 16 字节)
    uint128 e;  // slot 3 (后 16 字节) - 与 d 共享槽！
    uint256 f;  // slot 4 (完整 32 字节)
}
```

**打包规则详解**：
1. 按声明顺序分配
2. 如果当前变量能放入当前槽的剩余空间，就打包进去
3. 如果放不下，就开始新的槽
4. `uint256`、动态类型（数组、mapping、string）总是开始新槽


**实测对比**：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ❌ 未优化：3 个 SSTORE 操作
contract Unoptimized {
    uint64 a;   // slot 0
    uint128 b;  // slot 1
    uint64 c;   // slot 2

    function set(uint64 _a, uint128 _b, uint64 _c) external {
        a = _a;  // SSTORE to slot 0: 20,000 gas
        b = _b;  // SSTORE to slot 1: 20,000 gas
        c = _c;  // SSTORE to slot 2: 20,000 gas
    }
}

// ✅ 优化后：1 个 SSTORE 操作
contract Optimized {
    uint64 a;   // slot 0 (bytes 0-7)
    uint64 c;   // slot 0 (bytes 8-15)
    uint128 b;  // slot 0 (bytes 16-31)

    function set(uint64 _a, uint128 _b, uint64 _c) external {
        a = _a;  // SSTORE to slot 0: 20,000 gas
        c = _c;  // 修改同一个 slot: 2,900 gas
        b = _b;  // 修改同一个 slot: 100 gas (热访问)
    }
}
```

**Gas 对比**（使用 `forge snapshot`）：
```
Unoptimized.set(): 60,000 gas
Optimized.set():   23,000 gas
节省: 62%
```

**注意事项**：
- 打包后的变量在读写时需要额外的位运算（AND、OR、SHIFT）
- 如果变量经常单独访问，打包反而可能增加成本
- 权衡：存储成本 vs 计算成本

### 2. 使用 `immutable` 和 `constant`

**原理**：
- `constant`：编译时确定，值直接嵌入到合约的字节码中，不占用 storage 槽位
- `immutable`：部署时确定，值保存在合约的不可变字节码（immutable bytecode）中，而非 storage 槽位

**存储位置对比**：
- 普通状态变量：存储在 storage 槽位中，每次读取需要 SLOAD 操作（2,100 gas 冷访问）
- `constant` 变量：编译器将值直接替换到使用处，相当于硬编码（~3 gas）
- `immutable` 变量：存储在合约字节码的特殊区域，通过 PUSH 指令读取（~100 gas）

**实测对比**：

```solidity
contract StorageCost {
    address public owner;           // storage: 2,100 gas (冷读)
    address public immutable OWNER; // immutable: ~100 gas

    uint256 public constant MAX = 100; // constant: ~3 gas (直接使用值)

    constructor() {
        owner = msg.sender;
        OWNER = msg.sender;
    }

    function getOwner() external view returns (address) {
        return owner;  // SLOAD: 2,100 gas (首次)
    }

    function getOwnerImmutable() external view returns (address) {
        return OWNER;  // 直接从代码读取: ~100 gas
    }

    function getMax() external pure returns (uint256) {
        return MAX;  // PUSH: 3 gas
    }
}
```

**适用场景**：
- ✅ `constant`：编译时就知道的值（魔数、配置）
- ✅ `immutable`：部署时确定、后续不变的值（工厂地址、初始化参数）
- ❌ 不适用：需要修改的值

### 3. 删除存储变量可退还 Gas

**原理**：将存储槽从非零改为零会退还部分 gas（EIP-3529 后为 4,800 gas）。

```solidity
contract GasRefund {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        // SSTORE from 0 to non-0: 20,000 gas
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        // 使用 `delete` 而不是 `= 0` 更清晰（效果相同）
        delete balances[msg.sender];  // SSTORE from non-0 to 0: 4,800 gas refund

        payable(msg.sender).transfer(amount);
    }
}
```

注意:**Gas 退款**是有上限的（交易 gas 使用量的 20%）

### 4. 缓存存储变量到内存

**原理**：避免重复的 SLOAD 操作。

```solidity
contract CachingExample {
    uint256[] public data;

    // ❌ 未优化：每次循环都 SLOAD
    function sumBad() external view returns (uint256) {
        uint256 total;
        for (uint i = 0; i < data.length; i++) {  // 每次都读 data.length
            total += data[i];
        }
        return total;
        // Gas: 2,100 + (2,100 * n) for length checks
    }

    // ✅ 优化：缓存长度到内存
    function sumGood() external view returns (uint256) {
        uint256 len = data.length;  // 一次 SLOAD: 2,100 gas
        uint256 total;
        for (uint i = 0; i < len; i++) {  // 读 memory: 3 gas
            total += data[i];
        }
        return total;
    }

    // ✅ 更好：缓存整个数组到内存（如果数组不大）
    function sumBest() external view returns (uint256) {
        uint256[] memory cached = data;  // 批量复制到 memory
        uint256 total;
        for (uint i = 0; i < cached.length; i++) {
            total += cached[i];  // 全部从 memory 读取
        }
        return total;
    }
}
```

**权衡**：
- 缓存到 memory 有初始成本（复制数据）
- 如果只访问少数元素，不缓存更好
- 如果多次访问，缓存划算

### 5. Mapping vs Array 的选择

**成本对比**：

```solidity
contract DataStructureComparison {
    mapping(uint => uint) public map;
    uint[] public array;

    // Mapping 写入
    function writeToMap(uint key, uint value) external {
        map[key] = value;
        // Gas: 20,000 (首次) 或 2,900 (更新)
    }

    // Array 写入
    function writeToArray(uint value) external {
        array.push(value);
        // Gas: 20,000 (存储值) + 20,000 (更新长度) = 40,000
        // 如果需要扩展存储，成本更高
    }

    // Array 读取（通过索引）
    function readArray(uint index) external view returns (uint) {
        return array[index];
        // Gas: 2,100 (冷) + 额外的边界检查
    }

    // Mapping 读取
    function readMap(uint key) external view returns (uint) {
        return map[key];
        // Gas: 2,100 (冷)
    }
}
```

**选择指南**：
- ✅ **Mapping**：需要通过键快速查找、不需要遍历
- ✅ **Array**：需要遍历所有元素、需要知道长度
- ⚠️ **Array** 的 `push` 操作成本高（需要更新长度）
- ⚠️ **Array** 不适合频繁的中间插入/删除

### 6. Bytes vs String

**原理**：`bytes` 比 `string` 更灵活，且可以优化。

```solidity
contract BytesVsString {
    // ✅ 短字符串（≤31 字节）优化
    bytes32 public shortBytes;  // 1 个 slot，32 字节

    // ❌ string 总是动态类型
    string public shortString;  // 至少 2 个 slot（长度 + 数据指针）

    // 对于短数据，bytes32 更省 gas
    function setShortBytes(bytes32 data) external {
        shortBytes = data;  // 20,000 gas
    }

    function setShortString(string memory data) external {
        shortString = data;  // 40,000+ gas
    }
}
```

**选择指南**：
- ✅ 固定长度、已知长度：使用 `bytesN`（bytes1 到 bytes32）
- ✅ 需要字节级操作：使用 `bytes`
- ✅ 需要 UTF-8 编码的文本：使用 `string`

## Memory 优化

### Memory 扩展成本

**问题**：Memory 成本是二次增长的，大量使用会导致 gas 爆炸。

```solidity
contract MemoryExpansion {
    // ❌ 创建大数组会触发昂贵的 memory 扩展
    function createLargeArray() external pure returns (uint) {
        uint[] memory large = new uint[](10000);  // 可能消耗几十万 gas
        return large.length;
    }

    // ✅ 使用 calldata 避免复制
    function processLargeArray(uint[] calldata data) external pure returns (uint) {
        uint sum;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];  // 直接从 calldata 读取
        }
        return sum;
    }
}
```

### 避免不必要的 Memory 分配

```solidity
contract MemoryOptimization {
    struct User {
        address addr;
        uint256 balance;
        string name;
    }

    mapping(address => User) public users;

    // ❌ 复制整个结构体到 memory
    function getUserNameBad(address addr) external view returns (string memory) {
        User memory user = users[addr];  // 复制整个 User
        return user.name;
    }

    // ✅ 直接返回需要的字段
    function getUserNameGood(address addr) external view returns (string memory) {
        return users[addr].name;  // 只复制 name 字段
    }

    // ✅ 使用 storage 指针（只读时）
    function getUserNameBest(address addr) external view returns (string memory) {
        User storage user = users[addr];  // storage 指针，不复制
        return user.name;
    }
}
```

## Calldata 优化

### External vs Public

**区别**：
- `external`：参数强制为 `calldata`
- `public`：参数默认为 `memory`（需要复制）

```solidity
contract CalldataOptimization {
    // ❌ public 会复制数组到 memory
    function processBad(uint[] memory data) public pure returns (uint) {
        uint sum;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum;
    }

    // ✅ external 直接使用 calldata
    function processGood(uint[] calldata data) external pure returns (uint) {
        uint sum;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum;
    }
}
```

**Gas 对比**（100 个元素的数组）：
```
processBad():  ~50,000 gas
processGood(): ~30,000 gas
节省: 40%
```

### 何时使用 Memory vs Calldata

```solidity
contract MemoryVsCalldata {
    // ✅ 只读：使用 calldata
    function sumArray(uint[] calldata data) external pure returns (uint) {
        uint sum;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum;
    }

    // ✅ 需要修改：使用 memory
    function doubleArray(uint[] calldata data) external pure returns (uint[] memory) {
        uint[] memory result = new uint[](data.length);
        for (uint i = 0; i < data.length; i++) {
            result[i] = data[i] * 2;  // 修改数据，必须用 memory
        }
        return result;
    }

    // ⚠️ 内部调用：只能用 memory
    function internalFunction(uint[] memory data) internal pure returns (uint) {
        return data[0];
    }
}
```

## 使用 Event 替代 Storage

如果数据不需要在链上可查询，可以使用事件，Events 比 Storage 便宜得多。

```solidity
contract EventVsStorage {
    // 完全存储：昂贵但可查询
    mapping(address => uint256[]) public userTransactions;

    function recordTransaction(uint256 amount) external {
        userTransactions[msg.sender].push(amount);
        // 成本：20,000 + 20,000 (length) + ... = 40,000+ gas
    }

    // 使用 Event：便宜但需要链下索引
    event Transaction(address indexed user, uint256 amount, uint256 timestamp);

    function recordTransactionEvent(uint256 amount) external {
        emit Transaction(msg.sender, amount, block.timestamp);
        // 成本：~2,000 gas
    }
}
```

**成本对比**：
```
Storage: 40,000+ gas
Event:   ~2,000 gas
节省: 95%
```

**选择指南**：
- ✅ 需要在合约中查询：使用 Storage
- ✅ 只需要历史记录（链下可查）：使用 Event
- ✅ 混合：重要的当前状态用 Storage，历史记录用 Event


## 优化的权衡

### 何时不应该优化

1. **牺牲可读性**：过度优化会让代码难以维护
2. **牺牲安全性**：使用 `unchecked` 要非常谨慎
3. **边际收益小**：优化节省不到 1% 的 gas 可能不值得
4. **增加复杂度**：复杂的优化可能引入 bug

### 优化的优先级

1. **算法优化**：O(n²) → O(n) 比微优化重要得多
2. **Storage 优化**：成本最高，优先优化
3. **批量操作**：合并交易可以大幅节省
4. **Memory/Calldata**：在高频调用路径上重要
5. **微优化**：位运算、unchecked 等，最后考虑

## 总结

**核心原则**：
1. **Storage 最贵**：能用 memory/calldata 就不用 storage
2. **冷热访问**：同一交易中多次访问同一 slot 成本降低

**延伸阅读**：
- [Rareskills Gas Optimization](https://www.rareskills.io/post/gas-optimization)
- [Solidity Gas 优化手册（中文）](https://decert.me/tutorial/rareskills-gas-optimization/)
- [EIP-2929: Gas cost increases for state access opcodes](https://eips.ethereum.org/EIPS/eip-2929)
- [EIP-1153: Transient storage opcodes](https://eips.ethereum.org/EIPS/eip-1153)
