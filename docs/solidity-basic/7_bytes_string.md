# 字符串和字节数组

在[智能合约](https://learnblockchain.cn/tags/%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6)开发中，大多数时候，使用多的整型、地址、合约类型，但有时也需要处理文本数据和原始字节数据。Solidity 提供了多种字节相关的类型来满足不同的使用场景。

## 字节类型概览

[Solidity](https://learnblockchain.cn/course/93) 提供了三种主要的字节相关类型：

1. **定长字节数组**：`bytes1`, `bytes2`, `bytes3`, ..., `bytes32`
2. **动态字节数组**：`bytes`
3. **字符串类型**：`string`

## 定长字节数组

定长字节数组使用 `bytes1` 到 `bytes32` 表示，数字表示字节的长度。例如 `bytes1` 表示1个字节，`bytes32` 表示32个字节。

```solidity
pragma solidity ^0.8.0;

contract BytesExample {
    bytes1 public a = 0x01;        // 1字节
    bytes2 public b = 0x0102;      // 2字节
    bytes4 public c = 0x01020304;  // 4字节
    bytes32 public d = 0x0102030405060708091011121314151617181920212223242526272829303132;
}
```

### 定长字节数组的特点

- **值类型**：在赋值或传参时会进行拷贝
- **固定长度**：定义后长度不可改变
- **支持索引访问**：可以通过下标访问每个字节（只读）
- **高效存储**：占用空间固定，Gas 消耗可预测

```solidity
pragma solidity ^0.8.0;

contract BytesAccess {
    bytes4 public data = 0x01020304;

    // 访问第一个字节
    function getFirstByte() public view returns (bytes1) {
        return data[0];  // 返回 0x01
    }

    // 获取长度
    function getLength() public pure returns (uint) {
        bytes4 temp = 0x01020304;
        return temp.length;  // 返回 4
    }
}
```

> 定长字节数组的索引访问是**只读**的，不能通过 `data[0] = 0xff` 这样的方式修改。

### 定长字节数组的运算

定长字节数组支持以下运算符：

- **比较运算符**：`==`, `!=`, `<`, `<=`, `>`, `>=`
- **位运算符**：`&`（与）, `|`（或）, `^`（异或）, `~`（取反）
- **移位运算符**：`<<`（左移）, `>>`（右移）
- **索引访问**：`[index]`（只读）

```solidity
pragma solidity ^0.8.0;

contract BytesOperations {
    function bitwiseOperations() public pure returns (bytes1, bytes1, bytes1) {
        bytes1 a = 0xf0;  // 11110000
        bytes1 b = 0x0f;  // 00001111

        bytes1 andResult = a & b;  // 00000000 = 0x00
        bytes1 orResult = a | b;   // 11111111 = 0xff
        bytes1 xorResult = a ^ b;  // 11111111 = 0xff

        return (andResult, orResult, xorResult);
    }

    function shiftOperations() public pure returns (bytes1, bytes1) {
        bytes1 data = 0x0f;  // 00001111

        bytes1 leftShift = data << 4;   // 11110000 = 0xf0
        bytes1 rightShift = data >> 2;  // 00000011 = 0x03

        return (leftShift, rightShift);
    }
}
```

## 动态字节数组 bytes

`bytes` 是一个动态大小的字节数组，适合存储任意长度的原始字节数据。

```solidity
pragma solidity ^0.8.0;

contract DynamicBytes {
    bytes public data;

    function setData(bytes memory _data) public {
        data = _data;
    }

    function getLength() public view returns (uint) {
        return data.length;
    }

    function getByteAt(uint index) public view returns (bytes1) {
        require(index < data.length, "Index out of bounds");
        return data[index];
    }

    function appendByte(bytes1 _byte) public {
        data.push(_byte);  // 在末尾添加一个字节
    }

    function removeLast() public {
        require(data.length > 0, "Array is empty");
        data.pop();  // 删除最后一个字节
    }
}
```

### bytes 的特点

- **引用类型**：需要指定数据位置（`memory`, `storage`, `calldata`）
- **动态长度**：可以在运行时改变长度
- **可修改**：可以通过索引修改元素，也可以使用 `push()` 和 `pop()`
- **更省 Gas**：相比 `bytes1[]` 数组，`bytes` 更加紧凑，节省 Gas

```solidity
pragma solidity ^0.8.0;

contract BytesModification {
    bytes public data = hex"010203";

    function modifyByte(uint index, bytes1 value) public {
        require(index < data.length, "Index out of bounds");
        data[index] = value;
    }

    function concatenateBytes(bytes memory a, bytes memory b)
        public
        pure
        returns (bytes memory)
    {
        return bytes.concat(a, b);
    }
}
```

> **提示：** 当需要存储任意长度的字节数据时，优先使用 `bytes` 而不是 `bytes1[]`，因为 `bytes` 更加紧凑，能节省 Gas 费用。

## 字符串类型 string

`string` 是 [Solidity](https://learnblockchain.cn/course/93) 中用于处理文本数据的类型，本质上是 UTF-8 编码的动态字节数组。

```solidity
pragma solidity ^0.8.0;

contract StringExample {
    string public name = "Hello, Solidity!";
    string public emoji = "🚀";

    function setName(string memory _name) public {
        name = _name;
    }

    function getName() public view returns (string memory) {
        return name;
    }
}
```

### string 的特点

- **引用类型**：需要指定数据位置
- **动态长度**：长度可变
- **UTF-8 编码**：支持多语言和表情符号
- **操作受限**：不能直接访问索引、不能获取长度、不能直接修改

> **警告：** `string` 类型**没有** `length` 属性，也**不支持**索引访问。如果需要操作字符串的字节，需要先转换为 `bytes`。

### 字符串操作

由于 Solidity 原生对字符串的操作支持有限，通常需要转换为 `bytes` 进行操作。

```solidity
pragma solidity ^0.8.0;

contract StringOperations {
    // 获取字符串长度（字节数）
    function getStringLength(string memory str) public pure returns (uint) {
        return bytes(str).length;
    }

    // 连接两个字符串
    function concatenate(string memory a, string memory b)
        public
        pure
        returns (string memory)
    {
        return string(bytes.concat(bytes(a), bytes(b)));
    }

    // 比较两个字符串是否相等
    function compareStrings(string memory a, string memory b)
        public
        pure
        returns (bool)
    {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    // 修改字符串的某个字节
    function modifyStringByte(string memory str, uint index, bytes1 newByte)
        public
        pure
        returns (string memory)
    {
        bytes memory strBytes = bytes(str);
        require(index < strBytes.length, "Index out of bounds");
        strBytes[index] = newByte;
        return string(strBytes);
    }
}
```

> **说明：** 字符串比较不能直接使用 `==`，而是通过比较两者的 `keccak256` 哈希值来判断是否相等。

## 类型转换

### string 与 bytes 的转换

```solidity
pragma solidity ^0.8.0;

contract TypeConversion {
    // string 转 bytes
    function stringToBytes(string memory str) public pure returns (bytes memory) {
        return bytes(str);
    }

    // bytes 转 string
    function bytesToString(bytes memory data) public pure returns (string memory) {
        return string(data);
    }
}
```

### bytes32 与 string 的转换

```solidity
pragma solidity ^0.8.0;

contract Bytes32StringConversion {
    // bytes32 转 string
    function bytes32ToString(bytes32 data) public pure returns (string memory) {
        // 找到实际的字符串长度（去除尾部的零字节）
        uint length = 0;
        while(length < 32 && data[length] != 0) {
            length++;
        }

        bytes memory bytesArray = new bytes(length);
        for(uint i = 0; i < length; i++) {
            bytesArray[i] = data[i];
        }

        return string(bytesArray);
    }

    // string 转 bytes32（字符串长度不能超过32字节）
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempBytes = bytes(source);
        require(tempBytes.length <= 32, "String too long");

        assembly {
            result := mload(add(tempBytes, 32))
        }
    }
}
```

## 实际应用场景

### 1. 存储用户名和描述

```solidity
pragma solidity ^0.8.0;

contract UserProfile {
    struct Profile {
        string username;
        string bio;
        bytes32 avatar;  // IPFS 哈希的一部分
    }

    mapping(address => Profile) public profiles;

    function setProfile(string memory _username, string memory _bio) public {
        profiles[msg.sender] = Profile({
            username: _username,
            bio: _bio,
            avatar: 0x0
        });
    }
}
```

### 2. 存储和验证数据

```solidity
pragma solidity ^0.8.0;

contract DataStorage {
    // 使用 bytes32 存储哈希值（节省 Gas）
    mapping(uint => bytes32) public dataHashes;

    function storeDataHash(uint id, bytes memory data) public {
        dataHashes[id] = keccak256(data);
    }

    function verifyData(uint id, bytes memory data) public view returns (bool) {
        return dataHashes[id] == keccak256(data);
    }
}
```

### 3. Token URI（NFT 元数据）

```solidity
pragma solidity ^0.8.0;

contract SimpleNFT {
    mapping(uint256 => string) private _tokenURIs;

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
    }
}
```

## Gas 消耗对比

不同的字节类型在 Gas 消耗上有显著差异：

| 类型 | 使用场景 | [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 效率 | 备注 |
|------|---------|---------|------|
| `bytes32` | 固定长度哈希、ID | ⭐⭐⭐⭐⭐ | 最省 Gas，推荐用于固定长度数据 |
| `bytes` | 变长原始数据 | ⭐⭐⭐⭐ | 比 `bytes1[]` 省 Gas |
| `bytes1[]` | 动态字节数组 | ⭐⭐ | 较耗 Gas，不推荐 |
| `string` | 文本数据 | ⭐⭐⭐ | 与 `bytes` 类似，用于 UTF-8 文本 |

> **Gas 优化建议：**
>
> 1. **固定长度数据优先使用定长类型**：如果数据长度确定（如哈希值），使用 `bytes32` 而不是 `bytes` 或 `string`
> 2. **变长数据使用 bytes**：需要存储变长原始数据时，使用 `bytes` 而不是 `bytes1[]`
> 3. **短字符串使用 bytes32**：如果字符串长度不超过32字节且长度相对固定，可以考虑使用 `bytes32`
> 4. **链下存储**：长文本数据（如文章、大段描述）应该存储在链外（[IPFS](https://learnblockchain.cn/tags/IPFS)），合约只存储哈希或 URI

## 操练

### 练习1：字符串工具合约

尝试实现一个字符串工具合约，包含以下功能：

```SolidityEditor
pragma solidity ^0.8.0;

contract StringUtils {
    // TODO: 实现字符串拼接
    function concat(string memory a, string memory b)
        public
        pure
        returns (string memory)
    {
        // 你的代码
    }

    // TODO: 判断字符串是否为空
    function isEmpty(string memory str) public pure returns (bool) {
        // 你的代码
    }

    // TODO: 获取字符串长度
    function length(string memory str) public pure returns (uint) {
        // 你的代码
    }
}
```

### 练习2：字节数组操作

实现一个字节数组操作合约：

```SolidityEditor
pragma solidity ^0.8.0;

contract BytesUtils {
    bytes public data;

    // TODO: 添加多个字节
    function appendBytes(bytes memory newData) public {
        // 你的代码
    }

    // TODO: 清空数组
    function clear() public {
        // 你的代码
    }

    // TODO: 反转字节数组
    function reverse() public {
        // 你的代码
    }
}
```

## 小结

- **定长字节数组** (`bytes1` - `bytes32`)：固定长度，Gas 效率最高，适合存储哈希、ID 等固定长度数据
- **动态字节数组** (`bytes`)：可变长度，适合存储原始字节数据，比 `bytes1[]` 更省 Gas
- **字符串** (`string`)：UTF-8 编码的文本，操作受限，需要转换为 `bytes` 后才能进行复杂操作
- **类型转换**：`string` 和 `bytes` 可以相互转换，`bytes32` 需要特殊处理
- **[Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 优化**：根据数据特点选择合适的类型，固定长度优先使用定长类型

字节类型和字符串是处理数据的重要工具。在实际开发中，根据具体场景选择合适的类型，可以提高合约的效率和可维护性。
