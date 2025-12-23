# UUPS 升级模式

在[代理合约与升级](https://learnblockchain.cn/article/22621)中，我们了解到升级运行的原理，理解代理模式面临**函数选择器冲突**的问题：当代理合约和实现合约有相同函数名时，会产生调用歧义。上一篇的透明代理模式是一个方案，本文的UUPS（Universal Upgradeable Proxy Standard，通用可升级代理标准）是一种更加 gas 优化的合约升级方案。与透明代理不同，UUPS 将升级逻辑放在实现合约中，而不是代理合约中。

本文将详细介绍 UUPS 模式，并展示如何在 Foundry 中实际使用。

## UUPS vs 透明代理

让我们先快速对比一下 UUPS 和透明代理的优缺点：

透明代理: 将升级逻辑固定在代理中，升级逻辑相对简单且自动处理，带来的成本是每次调用需检查身份（+约 2,500 gas）

UUPS：将升级逻辑在实现中，有更好的 Gas 控制，但是开发时，需要将升级逻辑考虑在其中。

我们来详细看一下 UUPS 的工作原理。

## UUPS 的工作原理

UUPS 的核心思想是：**升级逻辑是业务逻辑的一部分**。

### 调用流程

1. 用户调用代理合约
2. 代理合约直接通过 `delegatecall` 转发到实现合约，无需身份检查（UUPS 省 gas 的原因）
3. 实现合约执行业务逻辑或升级逻辑

### 升级流程

1. 管理员调用代理合约的 `upgradeTo()` 函数
2. 代理合约通过 `delegatecall` 转发到当前实现合约
3. 实现合约的 `upgradeTo()` 函数验证权限并更新存储槽
4. 存储槽指向新的实现合约


## 简单实现示例

让我们看一个简单的 UUPS 实现：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// UUPS 实现合约
contract CounterV1 {
    // 遵循 EIP-1967 存储槽标准
    bytes32 private constant IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    bytes32 private constant ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6eb8ee141579563b1e0cad5ff;

    uint256 public count;

    // 修饰符：只有管理员可以调用
    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "Only admin");
        _;
    }

    function increment() public {
        count += 1;
    }

    function getCount() public view returns (uint256) {
        return count;
    }

    // UUPS 升级函数（在实现合约中！）
    function upgradeTo(address newImplementation) external onlyAdmin {
        _setImplementation(newImplementation);
    }

    // 获取实现合约地址
    function _getImplementation() private view returns (address impl) {
        assembly {
            impl := sload(IMPLEMENTATION_SLOT)
        }
    }

    // 设置实现合约地址
    function _setImplementation(address newImplementation) private {
        assembly {
            sstore(IMPLEMENTATION_SLOT, newImplementation)
        }
    }

    // 获取管理员地址
    function _getAdmin() private view returns (address adm) {
        assembly {
            adm := sload(ADMIN_SLOT)
        }
    }
}

// UUPS 代理合约
contract UUPSProxy {
    bytes32 private constant IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    bytes32 private constant ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6eb8ee141579563b1e0cad5ff;

    constructor(address _implementation, address _admin) {
        assembly {
            sstore(IMPLEMENTATION_SLOT, _implementation)
            sstore(ADMIN_SLOT, _admin)
        }
    }

    // 简单转发，无需检查身份
    fallback() external payable {
        assembly {
            let impl := sload(IMPLEMENTATION_SLOT)

            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
```

### 代码说明

**UUPS 代理合约**只负责转发调用，没有身份检查逻辑，没有升级函数

**UUPS 实现合约**：
- 包含业务逻辑（`increment`, `getCount`）
- 包含升级逻辑（`upgradeTo`）
- 使用 EIP-1967 标准存储槽

### 升级示例

```solidity
// 升级后的实现合约
contract CounterV2 {
    bytes32 private constant IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    bytes32 private constant ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6eb8ee141579563b1e0cad5ff;

    uint256 public count;

    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "Only admin");
        _;
    }

    function increment() public {
        count += 1;
    }

    // 新功能：减少计数
    function decrement() public {
        count -= 1;
    }

    function getCount() public view returns (uint256) {
        return count;
    }

    // ⚠️ 重要：每个版本都必须包含升级函数！
    function upgradeTo(address newImplementation) external onlyAdmin {
        _setImplementation(newImplementation);
    }

    function _getImplementation() private view returns (address impl) {
        assembly { impl := sload(IMPLEMENTATION_SLOT) }
    }

    function _setImplementation(address newImplementation) private {
        assembly { sstore(IMPLEMENTATION_SLOT, newImplementation) }
    }

    function _getAdmin() private view returns (address adm) {
        assembly { adm := sload(ADMIN_SLOT) }
    }
}
```

## UUPS 的关键风险

### 忘记实现升级函数

这是 UUPS 最大的风险！如果新的实现合约忘记包含 `upgradeTo()` 函数，合约将**永久无法升级**。

```solidity
// ❌ 危险：忘记添加升级函数
contract CounterV2 {
    uint256 public count;

    function increment() public {
        count += 1;
    }

    // 忘记了 upgradeTo() 函数！
    // 升级到这个版本后，合约将永久无法再升级
}
```

### 解决方案：使用 OpenZeppelin 的 UUPSUpgradeable

OpenZeppelin 提供了一个基础合约，确保每个实现都包含升级逻辑：

```solidity
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CounterV2 is UUPSUpgradeable {
    uint256 public count;

    function increment() public {
        count += 1;
    }

    // 只需实现这个函数来控制谁可以升级
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
```


> UUPS 模式基于 EIP-1822 标准，标准定义了：
> 1. **代理存储槽**：使用 EIP-1967 定义的存储位置
> 2. **升级接口**：`upgradeTo(address)` 和 `upgradeToAndCall(address, bytes)`
> 3. **升级事件**：`Upgraded(address indexed implementation)`

> OpenZeppelin 的 `UUPSUpgradeable` 完全遵循这个标准。 -->

## 在 Foundry 中使用 UUPS

让我们看看如何在 Foundry 中实际使用 UUPS 模式。

### 1. 安装依赖

```bash
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-foundry-upgrades
```

### 2. 编写 UUPS 实现合约

```solidity
// src/BoxV1.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BoxV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function store(uint256 newValue) public {
        value = newValue;
    }

    function retrieve() public view returns (uint256) {
        return value;
    }

    // 授权升级函数：只有 owner 可以升级
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
```

**关键点**：
- 继承 `UUPSUpgradeable`
- 实现 `_authorizeUpgrade` 函数来控制谁可以升级
- 使用 `initializer` 而不是 `constructor`

### 3. 编写升级版本

```solidity
// src/BoxV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BoxV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function store(uint256 newValue) public {
        value = newValue;
    }

    function retrieve() public view returns (uint256) {
        return value;
    }

    // 新功能
    function increment() public {
        value = value + 1;
    }

    // ⚠️ 必须包含这个函数
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
```

### 4. 配置 foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
ffi = true
ast = true
build_info = true
extra_output = ["storageLayout"]
```

**配置说明**：
- `ffi = true`：允许插件调用外部程序进行验证
- `ast = true`：生成抽象语法树，用于分析合约结构
- `build_info = true`：保存构建信息
- `extra_output = ["storageLayout"]`：输出存储布局信息，用于升级时的兼容性检查

### 5. 使用插件部署

```solidity
// script/DeployBox.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import "../src/BoxV1.sol";

contract DeployBox is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast();

        // 使用插件部署 UUPS 代理
        address proxy = Upgrades.deployUUPSProxy(
            "BoxV1.sol",
            abi.encodeCall(BoxV1.initialize, owner)
        );

        console.log("UUPS Proxy deployed at:", proxy);

        vm.stopBroadcast();
    }
}
```

**插件做了什么**：
1. **验证 UUPS 实现**：
   - 检查合约是否继承了 `UUPSUpgradeable`
   - 验证是否实现了 `_authorizeUpgrade` 函数
   - 确保构造函数调用了 `_disableInitializers()`

2. **部署实现合约**：自动编译并部署 `BoxV1` 实现合约

3. **部署 ERC1967 代理**：部署标准的 `ERC1967Proxy` 合约（简单转发）

4. **调用初始化函数**：通过代理调用 `initialize` 函数初始化状态

5. **保存部署信息**：记录代理地址、实现地址等，供后续升级使用

### 6. 使用插件升级

```solidity
// script/UpgradeBox.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";

contract UpgradeBox is Script {
    function run() external {
        address proxy = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast();

        // 使用插件升级 UUPS
        Upgrades.upgradeProxy(
            proxy,
            "BoxV2.sol",
            ""
        );

        console.log("UUPS Proxy upgraded to BoxV2");

        vm.stopBroadcast();
    }
}
```

**插件做了什么**：
1. **验证存储布局兼容性**：
   - 对比 `BoxV1` 和 `BoxV2` 的存储布局
   - 检查是否有变量顺序改变、类型改变等不兼容的修改
   - 如果不兼容会报错并阻止升级

2. **验证 UUPS 升级安全性**：
   - 确认新合约也继承了 `UUPSUpgradeable`
   - 验证新合约实现了 `_authorizeUpgrade` 函数
   - 如果新合约缺少升级函数，会警告或报错

3. **部署新实现合约**：自动编译并部署 `BoxV2`

4. **执行升级**：
   - 通过代理调用当前实现合约的 `upgradeToAndCall` 函数
   - 实现合约验证权限（通过 `_authorizeUpgrade`）
   - 更新 EIP-1967 存储槽指向新实现

5. **可选的迁移调用**：如果提供了第三个参数（初始化数据），会在升级后调用迁移函数

### 7. 运行脚本

```bash
# 部署
forge script script/DeployBox.s.sol:DeployBox \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify

# 升级
forge script script/UpgradeBox.s.sol:UpgradeBox \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify
```


> UUPS 实践注意, 应该始终继承 UUPSUpgradeable



## 参考资料

- [透明代理模式](https://learnblockchain.cn/article/22622)
- [EIP-1822 UUPS 标准](https://eips.ethereum.org/EIPS/eip-1822)
- [OpenZeppelin UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [OpenZeppelin Foundry Upgrades](https://github.com/OpenZeppelin/openzeppelin-foundry-upgrades)

## 总结

UUPS 是一种 gas 优化的合约升级方案, **核心特点**：升级逻辑在实现合约中, 代理合约简单，只负责转发。

**最佳实践**是使用 OpenZeppelin 的 `UUPSUpgradeable`及 Foundry Upgrades 插件自动验证
