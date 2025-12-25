
在[代理合约与升级](https://learnblockchain.cn/article/22621)中，我们了解到升级运行的原理，理解代理模式面临**函数选择器冲突**的问题：当代理合约和实现合约有相同函数名时，会产生调用歧义。透明代理模式正是为了解决这个问题而诞生的。

本文将详细介绍透明代理的实现原理，并提供在 Foundry 中的完整实战指南。

## 回顾：函数选择器冲突问题

在基础篇中，我们看到了这样的问题：

```solidity
contract Proxy {
    address public implementation;

    // 升级函数
    function upgrade(address newImpl) external {
        implementation = newImpl;
    }

    fallback() external payable {
        // 转发到实现合约
    }
}

contract Implementation {
    // 业务函数：恰好也叫 upgrade，或者是函数选择器一样
    function upgrade(address user) external {
        // 业务逻辑：升级用户等级
    }
}
```

**问题**：
- 管理员调用 `proxy.upgrade(newImpl)` → 调用代理的升级函数 ✓
- 用户调用 `proxy.upgrade(userAddress)` → 也会调用代理的升级函数，但会因为权限检查失败 ✗

用户永远无法调用到实现合约中的 `upgrade` 函数！

## 透明代理的解决方案

透明代理的核心思想：**通过调用者身份来区分调用目标**。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin 的 StorageSlot 库
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly {
            r.slot := slot
        }
    }
}

contract TransparentProxy {
    // EIP-1967 标准存储槽
    bytes32 private constant IMPLEMENTATION_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);

    bytes32 private constant ADMIN_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);

    constructor(address _implementation, address _admin) {
        _setImplementation(_implementation);
        _setAdmin(_admin);
    }

    // 核心：delegatecall 转发
    function _delegate(address _implementation) internal virtual {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), _implementation, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    // fallback：关键的身份检查逻辑
    fallback() external payable {
        if (msg.sender == _getAdmin()) {
            // 管理员调用：在 fallback 中处理管理操作
            // 注意：代理合约不能有显式的管理函数，否则会产生函数选择器冲突
            bytes4 selector = bytes4(msg.data);

            // upgradeTo(address)
            if (selector == 0x3659cfe6) {
                address newImplementation = abi.decode(msg.data[4:], (address));
                _setImplementation(newImplementation);
                return;
            }
            // changeAdmin(address)
            else if (selector == 0x8f283970) {
                address newAdmin = abi.decode(msg.data[4:], (address));
                _setAdmin(newAdmin);
                return;
            }
            // 其他调用：管理员不能访问实现合约
            else {
                revert("Admin cannot call implementation");
            }
        } else {
            // 普通用户：转发到实现合约
            _delegate(_getImplementation());
        }
    }

    receive() external payable {
        if (msg.sender == _getAdmin()) {
            revert("Admin cannot call implementation");
        } else {
            _delegate(_getImplementation());
        }
    }

    // 读取实现合约地址
    function _getImplementation() private view returns (address) {
        return StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value;
    }

    // 读取管理员地址
    function _getAdmin() private view returns (address) {
        return StorageSlot.getAddressSlot(ADMIN_SLOT).value;
    }

    // 设置实现合约地址
    function _setImplementation(address _implementation) private {
        require(_implementation.code.length > 0, "Implementation is not a contract");
        StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value = _implementation;
    }

    // 设置管理员地址
    function _setAdmin(address _admin) private {
        require(_admin != address(0), "Admin cannot be zero address");
        StorageSlot.getAddressSlot(ADMIN_SLOT).value = _admin;
    }
}
```

### 代码详细解释

**1. EIP-1967 存储槽**

```solidity
bytes32 private constant IMPLEMENTATION_SLOT =
    bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);

bytes32 private constant ADMIN_SLOT =
    bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
```

- 使用特殊的存储槽位存储关键数据
- 这些槽位是通过哈希计算得出的，几乎不可能与实现合约的变量冲突
- 实现合约可以自由定义自己的存储变量，无需担心冲突

**2. StorageSlot 库**

```solidity
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly {
            r.slot := slot
        }
    }
}
```

- 用于访问特定存储槽的辅助库
- 使用内联汇编直接操作存储槽位
- OpenZeppelin 提供了这个库，实际使用时可以直接导入

**3. 核心：Fallback 中的身份检查和操作处理**

```solidity
fallback() external payable {
    if (msg.sender == _getAdmin()) {
        // 管理员调用：在 fallback 中处理管理操作
        bytes4 selector = bytes4(msg.data);
        if (selector == 0x3659cfe6) {  // upgradeTo(address)
            address newImplementation = abi.decode(msg.data[4:], (address));
            _setImplementation(newImplementation);
            return;
        }
        // ... 其他管理操作
    } else {
        // 普通用户：转发到实现合约
        _delegate(_getImplementation());
    }
}
```

**这是透明代理的核心机制！**

**关键设计原则：代理合约不能有显式函数**
- ❌ 代理合约不能定义 `function upgradeTo(address)` 这样的显式函数
- ✅ 所有管理操作都在 fallback 中通过解析 calldata 处理
- **原因**：任何显式函数都可能与实现合约的函数产生选择器冲突
- 如果代理有 `upgradeTo` 函数，实现合约也有 `upgradeTo` 函数，就会产生冲突
- 通过在 fallback 中处理，代理合约零函数定义，**彻底避免了函数选择器冲突**
- 在 fallback 中，根据用户身份不同，普通用户调用业务函数，管理员尝试调用升级管理函数。 



> 为什么叫"透明"？

透明代理之所以叫"透明"，是因为对于**普通用户**来说，代理机制是完全透明的：
- 用户只需要与代理合约交互,用户不需要知道背后有实现合约
- 升级操作对用户完全无感知
- 用户看到的就像是一个普通合约

## 简单示例展示升级

现在让我们看如何编写实现合约并使用透明代理。

### V1 实现合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 实现合约 V1
contract CounterV1 {
    // 业务状态变量（从 slot 0 开始）
    uint public count;

    function increment() public {
        count += 1;
    }

    function getCount() public view returns (uint) {
        return count;
    }
}
```

**关键点**：
- 实现合约不需要预留 `implementation` 和 `admin` 变量
- 因为代理使用 EIP-1967 标准存储槽（特殊的槽位，不会冲突）
- 业务变量可以从 slot 0 开始自由定义

### V2 升级版本

```solidity
// 升级后的实现合约 V2
contract CounterV2 {
    // 存储布局必须与 V1 保持一致
    uint public count;  // slot 0 - 保持不变

    // V1 的功能
    function increment() public {
        count += 1;
    }

    function getCount() public view returns (uint) {
        return count;
    }

    // V2 新增功能：减少计数
    function decrement() public {
        require(count > 0, "Count is already zero");
        count -= 1;
    }

    // V2 新增功能：重置计数
    function reset() public {
        count = 0;
    }
}
```

### 部署和使用

```solidity
// 1. 部署实现合约 V1
CounterV1 implV1 = new CounterV1();

// 2. 部署透明代理（使用前面定义的 TransparentProxy）
TransparentProxy proxy = new TransparentProxy(address(implV1));

// 3. 普通用户调用业务函数
address user = address(0x1234);
vm.prank(user);
CounterV1(address(proxy)).increment();

vm.prank(user);
uint count = CounterV1(address(proxy)).getCount();
console.log("Count:", count); // 输出：1

// 4. 管理员升级合约
CounterV2 implV2 = new CounterV2();

// 管理员通过 fallback 调用 upgrade
address admin = proxy.admin();
vm.prank(admin);
(bool success,) = address(proxy).call(
    abi.encodeWithSignature("upgrade(address)", address(implV2))
);
require(success, "Upgrade failed");

// 5. 升级后，数据保留
vm.prank(user);
uint countAfterUpgrade = CounterV2(address(proxy)).getCount();
console.log("Count after upgrade:", countAfterUpgrade); // 输出：1（数据保留！）

// 6. 使用 V2 的新功能
vm.prank(user);
CounterV2(address(proxy)).decrement();

vm.prank(user);
console.log("Count after decrement:", CounterV2(address(proxy)).getCount()); // 输出：0

// 7. 管理员无法调用业务函数
vm.prank(admin);
try CounterV2(address(proxy)).increment() {
    revert("Should not reach here");
} catch {
    console.log("Admin cannot call implementation functions");
}
```

## 在 Foundry 中使用透明代理

简单示例用来帮助我们理解升级是如何运作的，在实际开发中，我们使用 OpenZeppelin 的 Foundry Upgrades 插件来部署和升级透明代理。

### 1. 安装依赖

```bash
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-foundry-upgrades
```

### 2. 配置 foundry.toml

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

### 3. 编写实现合约

```solidity
// src/BoxV1.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BoxV1 is Initializable, OwnableUpgradeable {
    uint256 private value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function store(uint256 newValue) public {
        value = newValue;
    }

    function retrieve() public view returns (uint256) {
        return value;
    }
}
```

**重要说明**：
- 使用 `Initializable` 代替构造函数
- 使用 `initialize` 函数进行初始化
- `_disableInitializers()` 防止实现合约被直接初始化

### 4. 编写升级版本

```solidity
// src/BoxV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BoxV2 is Initializable, OwnableUpgradeable {
    uint256 private value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function store(uint256 newValue) public {
        value = newValue;
    }

    function retrieve() public view returns (uint256) {
        return value;
    }

    // 新功能：增加值
    function increment() public {
        value = value + 1;
    }
}
```

### 5. 使用 Upgrades 插件部署

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

        // 使用插件部署透明代理
        address proxy = Upgrades.deployTransparentProxy(
            "BoxV1.sol",
            owner,
            abi.encodeCall(BoxV1.initialize, owner)
        );

        vm.stopBroadcast();

        console.log("Proxy deployed at:", proxy);
    }
}
```

**插件做了什么**：
1. **验证合约安全性**：检查合约是否适合用于代理模式（如不能有 `selfdestruct`、`delegatecall` 到用户输入的地址等）
2. **部署实现合约**：自动编译并部署 `BoxV1` 实现合约
3. **部署透明代理**：部署 OpenZeppelin 的 `TransparentUpgradeableProxy` 合约
4. **创建 ProxyAdmin**：自动部署 `ProxyAdmin` 合约管理代理
5. **调用初始化函数**：通过代理调用 `initialize` 函数
6. **保存部署信息**：记录代理地址、实现地址等，供后续升级使用

### 6. 使用 Upgrades 插件升级

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

        // 使用插件升级
        Upgrades.upgradeProxy(
            proxy,
            "BoxV2.sol",
            ""
        );

        vm.stopBroadcast();
        console.log("Proxy upgraded to BoxV2");
    }
}
```

**插件做了什么**：
1. **验证存储布局兼容性**：
   - 对比 `BoxV1` 和 `BoxV2` 的存储布局
   - 检查是否有变量顺序改变、类型改变等不兼容的修改
   - 如果不兼容会报错并阻止升级

2. **验证升级安全性**：
   - 检查新合约是否引入了不安全的操作
   - 验证构造函数是否正确处理（应该调用 `_disableInitializers()`）

3. **部署新实现合约**：自动编译并部署 `BoxV2`

4. **执行升级**：
   - 通过 `ProxyAdmin` 调用代理的升级函数
   - 将代理的实现地址更新为 `BoxV2`

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


## 总结

透明代理模式是最常用的合约升级方案之一, **核心特点**：
- **代理合约零函数定义**：所有操作通过 fallback 处理，彻底避免函数选择器冲突
- 管理员拥有升级权限，但不能调用实现合约的函数
- 调用者身份检查：普通用户透明访问实现合约，管理员只能执行管理操作
- 使用 EIP-1967 标准存储槽避免存储冲突
