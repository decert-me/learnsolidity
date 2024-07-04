# 存储模式与 gas 优化

在 Solidity 编程中，优化合约的 gas 消耗不只是一个性能问题，更是一个经济问题，因为 gas 费用直接关联到合约的使用成本。

Solidity 中的存储模式对 gas 消耗有直接影响，因此理解不同的存储方式以及如何优化它们对于开发高效和成本效益的智能合约至关重要。

## 存储概览

在Solidity中，有三种类型的存储位置：storage、memory 和 calldata，它们各有不同的用途和成本影响：

1. Storage：是合约在区块链上的永久存储。写入或修改存储的操作是最昂贵的，读取相对较便宜。
2. Memory：是临时存储，仅在外部函数调用期间存在。其数据在函数调用结束后消失。读写 memory 比 storage 便宜得多。
3. Calldata：是非持久性的存储位置，只存在于链上的函数调用期间，主要用于存储函数参数。calldata 类型的访问成本通常比memory低。

## 深入分析存储模式

理解这三种存储类型的使用场景和优化策略，是避免不必要的高 gas 消耗和优化智能合约性能的关键。

接下来会逐一深入讨论：

### Storage 优化

考虑到 storage 是最昂贵的存储方式，优化 storage 使用是减少 gas 成本的首要策略。

主要的优化方法包括：
1. 整合变量

    将多个较小的变量打包到一个或多个更大的存储槽中可以有效减少 gas 消耗。

    Solidity 中的存储是按照槽（32字节）组织的。尝试将多个较小的变量（如uint128，uint64等）组合在一个uint256中。这样做，相比每个小的数据类型占用单独的槽，可以减少必要的存储操作数量。

    示例：
    ```
    // 较低效的方式，以下三个变量打包两个槽中
    contract Bad {
        uint64 public value1;
        uint128 public value2;
        uint64 public value3;
    }
    ```

    ```
    // 更高效的方式，以下三个变量打包到一个槽中
    contract Good {
        uint64 public value1;
        uint64 public value3;
        uint128 public value2;
    }
    ```

2. 使用更紧凑的数据类型：

    根据实际的应用需求选择最合适的数据类型。

    例如，如果你知道存储的整数永远不会超过255，使用 uint8 而不 uint256 将更省 Storage 空间。

    但注意，函数操作中使用较小类型（小于 uint256）可能会增加 gas 消费，因为 EVM 在操作中会将它们转换为256位。

3. 删除不必要的存储变量：

    分析合约，确保只存储必要的变量。如果某些数据可以通过计算得出，则无需将其存储在状态变量中。

4. 避免在循环中使用存储变量：

    尽量避免在循环中读取或写入存储变量，因为这将多次执行昂贵的存储操作。

    如果可能，将变量缓存到内存中（声明为 memory 类型），在循环外部进行一次写入。
    示例：
    ```
    uint256[] public values;

    // 较低效的方式：在循环中频繁读/写存储
    function bad(uint256[] memory newValues) public {
        for (uint i = 0; i < newValues.length; i++) {
            values[i] = newValues[i];
        }
    }
    ```

    ```
    // 更高效的方式：使用内存数据进行操作，之后写回存储
    function good(uint256[] memory newValues) public {
        uint256[] memory tempValues = values;
        for (uint i = 0; i < newValues.length; i++) {
            tempValues[i] = newValues[i];
        }
        values = tempValues;
    }
    ```

### Memory 优化

尽管内存的使用比 storage 便宜，了解何时使用内存也能帮助进一步优化 gas 消耗：
- 避免在内存中复制大的数据结构，尽可能使用指针。
- 准确计算函数的内存使用，尽量减少不必要的内存占用。

```
contract MemoryExample {
    function processLargeArray(uint[] calldata data) external pure returns (uint[] memory) {
        uint[] memory temp = new uint[](data.length);
        for (uint i = 0; i < data.length; ++i) {
            temp[i] = data[i] * 2;  // 对数据进行处理
        }
        return temp;
    }
}
```

### Calldata 优化
calldata 类型的数据访问成本通常比 memory 低，因为它直接操作输入数据，避免了额外的内存分配。

以下是一个简单的例子，说明如何在 Solidity 中使用 calldata 优化 gas 消耗：

```
pragma solidity ^0.8.0;

contract CalldataExample {
    // 函数输入参数使用 calldata 而非 memory
    function sum(uint256[] calldata numbers) external pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < numbers.length; ++i) {
            sum += numbers[i];
        }
        return sum;
    }
}
```

在这个例子中，函数 `sum` 将一个 `uint256` 数组作为输入，该数组被指定为 `calldata` 类型。

这意味着在数组处理时不会进行内存复制，从而节省 gas。

## 结语

在 Solidity 中有效地管理和优化不同的存储方式，不仅能显著降低合约执行的 gas 成本，还能大幅提高合约的执行效率。通过运用以上的策略并结合实际的开发经验，开发者可以设计出既经济高效又性能优异的智能合约。

> 关于更多提升 gas 效率的技巧，可以查看 Decert.me 翻译的《[Gas 优化手册](https://decert.me/tutorial/rareskills-gas-optimization/)》。