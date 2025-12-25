# Merkle 树（Merkle Tree）

Merkle 树，也称为哈希树，是一种高效的数据验证结构，在区块链和智能合约中有着广泛的应用。通过 Merkle 树，我们可以在不存储完整数据集的情况下，高效地验证某个数据是否属于该数据集。

## 什么是 Merkle 树？

Merkle 树是一种二叉树结构，其中：
- **叶子节点**：存储数据的哈希值
- **非叶子节点**：存储其子节点哈希值的哈希
- **根节点（Merkle Root）**：树的顶部节点，代表整个数据集的"指纹"

### Merkle 树的结构

```
                    Root Hash
                   /          \
                  /            \
            Hash(AB)          Hash(CD)
            /    \            /    \
           /      \          /      \
       Hash(A)  Hash(B)  Hash(C)  Hash(D)
         |        |        |        |
       Data A   Data B   Data C   Data D
```

### Merkle 证明（Merkle Proof）

Merkle 证明允许我们验证某个数据是否在树中，而不需要提供完整的树结构。只需要提供：
1. 要验证的数据
2. 从该数据到根节点路径上的"兄弟"节点哈希

例如，要证明 Data A 在树中：
- 需要提供：Hash(B)、Hash(CD)
- 验证过程：Hash(Hash(Hash(A) + Hash(B)) + Hash(CD)) == Root Hash

## 为什么在智能合约中使用 Merkle 树？

### 优势

**1. [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 效率**
- 只需在合约中存储一个 32 字节的 Merkle Root
- 验证过程在链下计算证明，链上只需验证
- 适合大规模白名单、空投等场景

**2. 隐私保护**
- 不需要公开完整的数据列表
- 用户只需提供自己的证明

**3. 动态更新**
- 可以通过更新 Merkle Root 来更新数据集
- 无需重新部署合约

### 常见应用场景

1. **白名单验证**：NFT 白名单铸造、私募白名单
2. **空投分发**：验证地址是否有资格领取空投
3. **数据验证**：验证大型数据集中的某个数据
4. **投票系统**：验证投票权重
5. **权益证明**：验证用户持有的代币数量

例如：
[Uniswap](https://learnblockchain.cn/tags/Uniswap?map=EVM) 使用 Merkle 树向 V2 用户分发 UNI 代币，节省了大量 [Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 费用。
ENS 使用 Merkle 树向域名持有者分发 ENS 治理代币。
很多热门 [NFT](https://learnblockchain.cn/tags/NFT) 项目（如 BAYC、Azuki）使用 Merkle 树实现白名单铸造。


## Merkle 树验证数据

在实际开发中，强烈建议使用经过充分测试和审计的库，而不是自己实现 Merkle 树验证逻辑。[OpenZeppelin](https://learnblockchain.cn/tags/OpenZeppelin?map=EVM) 提供了标准的 MerkleProof 实现。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @dev 使用 OpenZeppelin 的 MerkleProof 库进行验证
 */
contract MerkleVerifier {
    bytes32 public merkleRoot;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev 验证地址是否在白名单中
     * @param proof Merkle 证明
     * @param account 要验证的地址
     * @return 是否验证通过
     */
    function verifyAddress(
        bytes32[] calldata proof,
        address account
    ) public view returns (bool) {
        // 计算叶子节点哈希
        bytes32 leaf = keccak256(abi.encodePacked(account));

        // 使用 OpenZeppelin 的 verify 函数
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    /**
     * @dev 验证地址和数量
     * @param proof Merkle 证明
     * @param account 地址
     * @param amount 数量
     * @return 是否验证通过
     */
    function verifyAddressWithAmount(
        bytes32[] calldata proof,
        address account,
        uint256 amount
    ) public view returns (bool) {
        // 叶子节点包含地址和数量
        bytes32 leaf = keccak256(abi.encodePacked(account, amount));

        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    /**
     * @dev 更新 Merkle Root（需要权限控制）
     */
    function updateMerkleRoot(bytes32 _newRoot) external {
        // 实际使用中应添加 onlyOwner 等权限控制
        merkleRoot = _newRoot;
    }
}
```


### 实战：NFT 白名单铸造

这是一个常见的应用场景：只允许白名单用户铸造 [NFT](https://learnblockchain.cn/tags/NFT)。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract WhitelistNFT is ERC721, Ownable {
    bytes32 public merkleRoot;
    uint256 public nextTokenId;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.01 ether;

    // 记录已铸造的地址
    mapping(address => bool) public hasMinted;

    event MerkleRootUpdated(bytes32 newRoot);
    event NFTMinted(address indexed to, uint256 tokenId);

    constructor(
        bytes32 _merkleRoot
    ) ERC721("Whitelist NFT", "WNFT") Ownable(msg.sender) {
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev 白名单铸造
     * @param proof Merkle 证明
     */
    function whitelistMint(bytes32[] calldata proof) external payable {
        // 检查是否已铸造
        require(!hasMinted[msg.sender], "Already minted");

        // 检查供应量
        require(nextTokenId < MAX_SUPPLY, "Max supply reached");

        // 检查支付金额
        require(msg.value >= MINT_PRICE, "Insufficient payment");

        // 验证 Merkle 证明
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "Invalid Merkle proof"
        );

        // 铸造
        hasMinted[msg.sender] = true;
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);

        emit NFTMinted(msg.sender, tokenId);
    }

    /**
     * @dev 更新 Merkle Root（只有 owner 可以调用）
     * @param _merkleRoot 新的 Merkle Root
     */
    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    /**
     * @dev 提取合约余额
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
```

### 实战：空投分发

允许用户根据 Merkle 证明领取不同数量的代币。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop is Ownable {
    IERC20 public token;
    bytes32 public merkleRoot;

    // 记录已领取的地址
    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed account, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);

    constructor(address _token, bytes32 _merkleRoot) Ownable(msg.sender) {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev 领取空投
     * @param amount 领取数量
     * @param proof Merkle 证明
     */
    function claim(uint256 amount, bytes32[] calldata proof) external {
        // 检查是否已领取
        require(!hasClaimed[msg.sender], "Already claimed");

        // 验证 Merkle 证明
        // 叶子节点包含地址和数量
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "Invalid Merkle proof"
        );

        // 标记为已领取
        hasClaimed[msg.sender] = true;

        // 转账
        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit Claimed(msg.sender, amount);
    }

    /**
     * @dev 更新 Merkle Root
     * @param _merkleRoot 新的 Merkle Root
     */
    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    /**
     * @dev 提取剩余代币
     */
    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Transfer failed");
    }
}
```

## 生成 Merkle 树和证明（JavaScript）

在实际应用中，我们需要在链下生成 Merkle 树和证明。以下是使用 JavaScript 的示例：

### 安装依赖

```bash
npm install merkletreejs keccak256
```

### 生成 Merkle 树

```javascript
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// 白名单地址
const whitelistAddresses = [
    "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
    "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
    "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    // ... 更多地址
];

// 1. 创建叶子节点（对地址进行哈希）
const leaves = whitelistAddresses.map(addr => keccak256(addr));

// 2. 创建 Merkle 树
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// 3. 获取 Merkle Root
const root = tree.getRoot().toString('hex');
console.log("Merkle Root:", "0x" + root);

// 4. 为特定地址生成证明
const address = whitelistAddresses[0];
const leaf = keccak256(address);
const proof = tree.getProof(leaf).map(x => "0x" + x.data.toString('hex'));

console.log("Proof for", address, ":", proof);

// 5. 验证证明
const verified = tree.verify(proof, leaf, root);
console.log("Verification:", verified);
```

### 生成空投 Merkle 树（包含金额）

```javascript
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');

// 空投列表：地址和对应的金额
const airdropList = [
    { address: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", amount: "1000" },
    { address: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", amount: "2000" },
    { address: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db", amount: "1500" },
    // ... 更多条目
];

// 1. 创建叶子节点（对地址和金额进行编码和哈希）
const leaves = airdropList.map(item => {
    // 使用 ethers.js 进行 ABI 编码
    const encoded = ethers.solidityPacked(
        ['address', 'uint256'],
        [item.address, ethers.parseEther(item.amount)]
    );
    return keccak256(encoded);
});

// 2. 创建 Merkle 树
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// 3. 获取 Merkle Root
const root = tree.getRoot().toString('hex');
console.log("Merkle Root:", "0x" + root);

// 4. 为每个地址生成证明
airdropList.forEach(item => {
    const encoded = ethers.solidityPacked(
        ['address', 'uint256'],
        [item.address, ethers.parseEther(item.amount)]
    );
    const leaf = keccak256(encoded);
    const proof = tree.getProof(leaf).map(x => "0x" + x.data.toString('hex'));

    console.log(`\nAddress: ${item.address}`);
    console.log(`Amount: ${item.amount} tokens`);
    console.log(`Proof:`, proof);
});
```

## 最佳实践

### 1. 在叶子节点中包含必要信息

```solidity
// ❌ 只包含地址
bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

// ✅ 包含地址和数量
bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));

// ✅ 包含更多信息以防止证明重用
bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount, nonce));
```

### 2. 防止重复领取

```solidity
// ✅ 使用 mapping 记录已领取
mapping(address => bool) public hasClaimed;

function claim(bytes32[] calldata proof) external {
    require(!hasClaimed[msg.sender], "Already claimed");
    hasClaimed[msg.sender] = true;
    // ...
}
```

### 3. 提供更新 Merkle Root 的功能

```solidity
// ✅ 允许 owner 更新 Merkle Root
function updateMerkleRoot(bytes32 _newRoot) external onlyOwner {
    merkleRoot = _newRoot;
    emit MerkleRootUpdated(_newRoot);
}
```

### 4. 验证输入参数

```solidity
function claim(
    uint256 amount,
    bytes32[] calldata proof
) external {
    // ✅ 验证数量是否合理
    require(amount > 0, "Amount must be positive");
    require(amount <= MAX_CLAIM_AMOUNT, "Amount too large");

    // ✅ 验证证明长度
    require(proof.length > 0, "Empty proof");
    require(proof.length <= 32, "Proof too long"); // 防止 DoS

    // ...
}
```

## Gas 优化

### 1. 使用 calldata 而非 memory

```solidity
// ❌ 使用 memory
function verify(bytes32[] memory proof, ...) external {
    // ...
}

// ✅ 使用 calldata（更省 Gas）
function verify(bytes32[] calldata proof, ...) external {
    // ...
}
```

### 2. 批量验证

```solidity
// 如果需要验证多个项目，可以批量处理
function verifyMultiple(
    bytes32[] calldata proof,
    bytes32[] calldata leaves
) external view returns (bool[] memory) {
    bool[] memory results = new bool[](leaves.length);
    for (uint i = 0; i < leaves.length; i++) {
        results[i] = MerkleProof.verify(proof, merkleRoot, leaves[i]);
    }
    return results;
}
```


## 总结

Merkle 树是智能合约开发中的重要工具，其极高的Gas效率，使其特别适合大规模数据验证的场景。

掌握 Merkle 树后，你将能够构建更高效、更经济的智能合约系统！
