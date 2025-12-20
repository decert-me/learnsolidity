# 数字签名

## 什么是数字签名

数字签名是一种数学机制，用于验证数字信息的真实性和完整性。在区块链和智能合约中，数字签名扮演着至关重要的角色，它能够：

- **证明身份**：确认消息是由特定私钥的持有者创建的
- **防止篡改**：确保消息在传输过程中没有被修改
- **不可否认性**：签名者无法否认其签署的消息

在以太坊中，数字签名基于椭圆曲线密码学（ECDSA - Elliptic Curve Digital Signature Algorithm），使用 secp256k1 曲线。

### 你一直在用数字签名

其实，如果你使用过 MetaMask 或其他钱包发送交易，你已经在使用数字签名了！

**当你在 MetaMask 中点击"确认"发送交易时：**

1. **签名（链下）**：
   - MetaMask 使用你的私钥对交易数据进行签名，这个过程是在本地完成（私钥永远不会离开你的设备）
   - 交易及签名信息发送到以太坊节点

2. **验证（节点）**：
   - 节点收到交易后，使用签名恢复出发送者的地址
   - 验证恢复的地址是否与交易声称的发送者地址一致
   - 验证通过后，交易被打包进区块


**这就是为什么**：
- 你的私钥如此重要（它是你身份的唯一证明）
- 节点可以信任交易确实来自你（没有你的私钥无法伪造签名）
- 交易一旦发出就无法撤回（签名已经证明了你的授权）

本文介绍的是**消息签名**，它与**交易签名**其实是一样的（使用相同的签名算法），仅仅是场景不同，签名的内容有所不同。

交易签名签署的内容是交易数据（to, value, data, nonce、gas等），这个是约定的数据格式，由节点验证并执行。

本文介绍消息签名，可以自定义签名消息或数据结构，然后在合约中验证用户身份或授权某些操作。

在智能合约开发中，**消息签名**有多个重要用途：

### 1. 链下授权，链上验证

用户可以在链下对某个操作进行签名授权，然后由其他人提交到链上执行。这样可以：
- 节省 gas（用户不需要直接发送交易）
- 实现元交易（meta-transaction）
- 批量处理操作

### 2. 证明所有权

验证某个地址的所有者确实想要执行某个操作，而不是被恶意第三方冒充。


## 数字签名的工作原理

### 基本概念

数字签名涉及三个核心组件：

1. **私钥（Private Key）**：秘密密钥，用于生成签名
2. **公钥（Public Key）**：公开密钥，可以从私钥推导出来
3. **签名（Signature）**：对消息的加密证明

### 签名流程

```
消息 + 私钥 → 签名
消息 + 签名 + 公钥 → 验证（true/false）
```

**签名过程**：
1. 对消息进行哈希运算，得到消息摘要
2. 使用私钥对消息摘要进行签名
3. 生成签名数据（r, s, v）

**验证过程**：
1. 对消息进行相同的哈希运算
2. 使用签名和公钥（或地址）进行验证
3. 确认签名是否由对应的私钥创建

## 以太坊中的签名格式

以太坊使用 ECDSA 签名，签名结果包含三个值：

```
签名 = (r, s, v)
```

- **r**：签名的第一部分（32 字节）
- **s**：签名的第二部分（32 字节）
- **v**：恢复标识符（1 字节，通常是 27 或 28）

完整的签名通常表示为 65 字节的十六进制字符串：
```
0x[r(32字节)][s(32字节)][v(1字节)]
```

## 在 Solidity 中验证签名

### 使用 ecrecover

Solidity 提供了内置函数 `ecrecover` 来恢复签名者的地址：

```solidity
pragma solidity ^0.8.0;

contract SignatureVerifier {
    // 验证签名
    function verify(
        address _signer,
        string memory _message,
        bytes memory _signature
    ) public pure returns (bool) {
        // 1. 对消息进行哈希
        bytes32 messageHash = keccak256(abi.encodePacked(_message));

        // 2. 添加以太坊签名前缀
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        // 3. 从签名中恢复地址
        address recoveredSigner = recoverSigner(ethSignedMessageHash, _signature);

        // 4. 比较地址
        return recoveredSigner == _signer;
    }

    // 添加以太坊签名前缀
    function getEthSignedMessageHash(bytes32 _messageHash)
        public pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            _messageHash
        ));
    }

    // 从签名中恢复签名者地址
    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // 将签名拆分为 r, s, v
    function splitSignature(bytes memory sig)
        public pure returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            // 前 32 字节是长度，跳过
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
```

### 以太坊签名前缀

以太坊在签名时会添加一个特殊的前缀：`\x19Ethereum Signed Message:\n32`

这个前缀的作用是：
- 防止签名被用于其他用途（如交易签名）
- 明确表示这是一个以太坊签名的消息

**重要**：链下签名和链上验证时都必须使用相同的前缀！

## 使用 OpenZeppelin 库

OpenZeppelin 提供了更安全和易用的签名验证工具：

```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SignatureVerifierOZ {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    function verify(
        address signer,
        string memory message,
        bytes memory signature
    ) public pure returns (bool) {
        // 1. 对消息进行哈希
        bytes32 messageHash = keccak256(abi.encodePacked(message));

        // 2. 添加以太坊签名前缀
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // 3. 恢复签名者地址并验证
        address recoveredSigner = ethSignedMessageHash.recover(signature);

        return recoveredSigner == signer;
    }
}
```

## 链下签名示例

### 使用 ethers.js 签名

```javascript
const { ethers } = require("ethers");

async function signMessage() {
    // 创建钱包
    const wallet = new ethers.Wallet(privateKey);

    // 要签名的消息
    const message = "Hello, Ethereum!";

    // 签名（会自动添加以太坊前缀）
    const signature = await wallet.signMessage(message);

    console.log("Signature:", signature);
    // 输出: 0x[130个字符的十六进制字符串]

    return signature;
}

// 验证签名
function verifySignature(message, signature, expectedAddress) {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress === expectedAddress;
}
```

### 使用 web3.js 签名

```javascript
const Web3 = require("web3");
const web3 = new Web3();

async function signMessage() {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    const message = "Hello, Ethereum!";

    // 签名
    const signature = account.sign(message);

    console.log("Signature:", signature.signature);

    return signature.signature;
}
```

## 实际应用场景

### 场景 1：白名单铸造（Whitelist Minting）

NFT 项目常用签名来控制白名单用户的铸造权限：

```solidity
pragma solidity ^0.8.0;

contract WhitelistNFT {
    address public signer;
    mapping(address => bool) public hasMinted;

    constructor(address _signer) {
        signer = _signer;
    }

    function mint(bytes memory signature) external {
        require(!hasMinted[msg.sender], "Already minted");

        // 验证签名
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        require(
            recoverSigner(ethSignedMessageHash, signature) == signer,
            "Invalid signature"
        );

        hasMinted[msg.sender] = true;

        // 铸造 NFT...
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        internal pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            _messageHash
        ));
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        internal pure returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal pure returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
```

## 安全注意事项

### ⚠️ 1. 防止签名重放攻击

签名可以被多次使用，需要采取措施防止重放：

```solidity
// ❌ 危险：签名可以被重复使用
function vulnerable(bytes memory signature) public {
    require(verify(msg.sender, "approve", signature), "Invalid signature");
    // 执行操作...
}

// ✅ 安全：使用 nonce 防止重放
mapping(address => uint) public nonces;

function safe(bytes memory signature) public {
    bytes32 messageHash = keccak256(abi.encodePacked(
        msg.sender,
        nonces[msg.sender]
    ));

    require(verifyWithHash(msg.sender, messageHash, signature), "Invalid signature");

    nonces[msg.sender]++;  // 增加 nonce
    // 执行操作...
}
```

### ⚠️ 2. 使用唯一的消息内容

确保签名的消息包含足够的上下文信息：

```solidity
// ❌ 危险：消息过于简单
bytes32 messageHash = keccak256(abi.encodePacked("approve"));

// ✅ 安全：包含完整上下文
bytes32 messageHash = keccak256(abi.encodePacked(
    address(this),     // 合约地址
    msg.sender,        // 用户地址
    amount,            // 金额
    nonce,             // nonce
    block.chainid      // 链 ID
));
```

## 常见错误和调试

### 错误 1：签名验证总是失败

**可能原因**：
- 链下和链上的消息哈希不一致
- 忘记添加或错误添加以太坊签名前缀
- 签名格式错误（r, s, v 顺序）

**调试方法**：
```solidity
function debug(
    string memory message,
    bytes memory signature
) public pure returns (
    bytes32 messageHash,
    bytes32 ethSignedMessageHash,
    address recoveredSigner
) {
    messageHash = keccak256(abi.encodePacked(message));
    ethSignedMessageHash = keccak256(abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        messageHash
    ));

    (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
    recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
}
```

### 错误 2：Web3.js 和 ethers.js 签名差异

不同库的签名方式可能略有不同，但验证时都需要添加以太坊前缀。

## 小结

本节我们学习了数字签名在以太坊中的应用：

### 核心概念

- **数字签名**：使用私钥对消息签名，使用公钥验证
- **ECDSA**：以太坊使用的椭圆曲线签名算法
- **签名格式**：(r, s, v) 三个部分，共 65 字节
- **ecrecover**：Solidity 内置的签名恢复函数

### 关键要点

1. **以太坊前缀**：签名和验证都必须添加 `\x19Ethereum Signed Message:\n32`
2. **防重放**：使用 nonce 或其他机制防止签名被重复使用
3. **完整上下文**：消息应包含合约地址、链 ID 等信息
4. **安全验证**：检查签名长度、v 值、零地址等

### 应用场景

- 白名单铸造
- 元交易
- 链下订单
- 投票系统
- 多步骤授权

### 延伸阅读

- [EIP-712 结构化数据签名](./11_eip712.md) - 更安全的签名标准
- [OpenZeppelin ECDSA 文档](https://docs.openzeppelin.com/contracts/4.x/api/utils#ECDSA)
