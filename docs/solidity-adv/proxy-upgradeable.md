# 可升级合约

在区块链开发中，智能合约一旦部署即无法更改是一个众所周知的限制。随着业务需求的变化，我们可能需要对已部署的合约进行修改或升级，而代理合约是解决这个问题的一种有效方式。

本章将深入介绍代理合约的不同升级模式，帮助开发者实现灵活且安全的智能合约系统。

前面已介绍了代理合约。通过代理合约进行升级的关键在于将状态存储与业务逻辑分离，其中代理负责状态存储，而业务逻辑则可以是可替换的。


## EIP-1967

在探讨智能合约的可升级性方案之前，了解 EIP-1967（代理存储槽） 标准至关重要。

EIP-1967 旨在为智能合约的升级模式提供一种标准化和安全的实现方法。该标准主要关注使用代理模式（Proxy Patterns）进行智能合约升级的流程，提高智能合约系统的透明性和可操作性。

### EIP-1967 主要内容

EIP-1967 提出了一种标准化的方法来存储关键信息，如实现合约的地址，到固定且已知的存储位置。这主要包括两个方面：

- 实现合约地址（implementation address）: 

    EIP-1967 建议将实现合约地址存储在特定的槽位`0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`

    该槽位通过`bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`计算得出。
- 管理员地址（admin address）: 

    合约的管理员（通常负责合约升级）地址存储在特定的槽位`0xb53127684a568b3173ae13b9f8a6016e243e63b6eb8ee141579563b1e0cad5ff`

    该槽位通过`bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)`计算得出。
- Beacon 合约地址

    Beacon 合约地址存储在特定的槽位`0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50`

    该槽位通过`bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)`计算得出。

这种方法的优点在于提供了一个既定且一致的位置来存储和查找这些关键数据，从而降低了错误配置和潜在安全风险，比如存储冲突。


## 代理合约升级模式

常见的三种升级模式：透明代理模式、UUPS、Beacon 模式，每种模式有其特点和使用场景，接下来将逐一介绍。

### 透明代理模式

在透明代理模式中，存在一个管理员地址独有的权限来升级智能合约。用户与合约的交互对用户完全透明，即用户不需要了解幕后的实现合约。

1. 工作原理

透明代理模式主要包括三个合约：

- 代理合约（Proxy Contract）：用户接触点，负责接收所有请求并将其委托给实现合约。它存储实现合约地址，并通过 `fallback` 函数实现委托调用。
- 实现合约（Implementation Contract）：包含逻辑代码的合约。可以被升级为新的实现合约版本，而不影响代理合约或存储的数据。
- 管理合约（Proxy Admin Contract）：用于管理谁可以升级实现合约，通常由一个或几个特定的管理员账户控制。
![alt text](https://img.learnblockchain.cn/proxy-transparent.png)

在透明代理模式中，所有的调用都是通过代理合约进行的。当调用代理合约时，它会检查调用者是否为管理员。如果是管理员调用管理功能（例如更改实现合约），调用直接在代理合约中处理。如果是普通用户调用业务逻辑，代理合约将使用 `delegatecall` 指令将调用委托给当前的实现合约。

2. OpenZeppelin 实现的透明代理模式合约

OpenZeppelin 提供了一套实现透明代理模式的标准合约，包括 `TransparentUpgradeableProxy` 和 `ProxyAdmin`

代码实现解释：

- TransparentUpgradeableProxy
`TransparentUpgradeableProxy` 是一个特定的代理合约，该合约维护一个指向实现合约的地址（也称为实现合约）并执行所有请求的功能，将函数调用转发至底层的实现合约。

代码结构如下：
```
contract TransparentUpgradeableProxy is Proxy, ProxyAdminStorage {
    constructor(address _logic, address admin_, bytes memory _data) payable {
        assert(IMPLEMENTATION_SLOT == bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1));
        _setImplementation(_logic);
        _setAdmin(admin_);
        if (_data.length > 0) {
            (bool success, ) = _logic.delegatecall(_data);
            require(success);
        }
    }

    function _implementation() internal view override returns (address impl) {
        return _implementation();
    }

    function _beforeFallback() internal override {
        require(msg.sender != _admin(), "admin cannot fallback to proxy target");
        super._beforeFallback();
    }
}
```

在这个合约中：

	• 构造函数设置了实现合约地址和管理员地址
	• `_implementation()` 函数返回当前实现合约的地址，保存在 EIP-1967 建议特定实现合约地址存储槽位。
	• `_beforeFallback()` 是一个内部函数，确保合约管理员不能直接调用代理的功能，除非通过特定的管理接口。这是“透明代理”模式的核心特征，它通过区分通常用户与管理员调用来防止管理员权限被滥用。

- ProxyAdmin

ProxyAdmin 是用于管理代理和其实现合约之间关系的合约，具有升级实现合约的功能。

代码结构如下：
```
contract ProxyAdmin is Ownable {

    function getProxyImplementation(TransparentUpgradeableProxy proxy) public view returns (address) {
        return proxy.implementation();
    }

    function getProxyAdmin(TransparentUpgradeableProxy proxy) public view returns (address) {
        return proxy.admin();
    }

    function changeProxyAdmin(TransparentUpgradeableProxy proxy, address newAdmin) public onlyOwner {
        proxy.changeAdmin(newAdmin);
    }

    function upgrade(TransparentUpgradeableProxy proxy, address newImplementation) public onlyOwner {
        proxy.upgradeTo(newImplementation);
    }

    function upgradeAndCall(TransparentUpgradeableProxy proxy, address newImplementation, bytes memory data) payable public onlyOwner {
        proxy.upgradeToAndCall{value: msg.value}(newImplementation, data);
    }
}
```

在ProxyAdmin合约中：

	• 提供了查询当前代理使用的实现合约和代理管理员的函数。
	• 允许代理的所有者（通常也是合约的部署者）更换代理的管理员用户或升级实现合约。


### UUPS模式

UUPS（Universal Upgradeable Proxy Standard，通用升级代理标准）模式通过实现合约本身的逻辑来控制升级的过程，不需要额外的代理合约。

1. 工作原理

    与透明代理合约相比，UUPS 使用一种更为节省 gas 和简化的升级方法。其关键在于将升级逻辑直接嵌入到实现合约中，而不是将其保留在单独的 ProxyAdmin 合约中。

    UUPS 中的实现合约包括业务逻辑和升级逻辑。实现合约内有一个专门的函数用于修改存储实现合约地址的变量，这使得实现合约可以更改其自身的逻辑。

    当需要升级合约时，通过在实现合约中调用一个特殊的更新函数来更改指向新合约的地址，从而实现逻辑的更换，同时保留存储在代理合约中的状态数据。

2. OpenZeppelin 实现的 UUPS

    OpenZeppelin 提供了一套标准的库和合约，能够轻松实现和部署 UUPS 可升级的智能合约。这种方式将升级功能融入到智能合约的逻辑中，而不依赖于外部的管理员合约。

    代码实现解释：

    - UUPSUpgradeable

    UUPSUpgradeable 是一个合约接口，包含核心的升级逻辑。这个接口要求实现合约继承并实现`upgradeTo()`和`upgradeToAndCall()`方法，这些方法用来切换合约的实现和（可选）执行额外的初始化或迁移逻辑。

    代码结构示例：
    ```
    contract UUPSUpgradeable is Initializable, ERC1967Upgrade {
        function upgradeTo(address newImplementation) public virtual {
            require(_authorizeUpgrade(newImplementation), "UUPSUpgradeable: unauthorized");
            _upgradeToAndCall(newImplementation, bytes(""), false);
        }

        function upgradeToAndCall(address newImplementation, bytes memory data, bool forceCall) public payable virtual {
            require(_authorizeUpgrade(newImplementation), "UUPSUpgradeable: unauthorized");
            _upgradeToAndCall(newImplementation, data, forceCall);
        }

        function _authorizeUpgrade(address newImplementation) internal virtual returns (bool);
    }
    ```

    在这个合约的示例中：

    -` _authorizeUpgrade()`是一个内部函数，通常需要在派生合约中覆盖实现具体的权限检查逻辑，用于验证升级操作的合法性。
    - `upgradeTo()`和`upgradeToAndCall()`是被外部调用的函数，用于更改实现合约的地址。如果合约升级需要调用新合约的函数初始化状态或执行迁移，则使用`upgradeToAndCall()`
    - 实现合约合约开发者在实现自己的业务实现合约时，应继承自`UUPSUpgradeable`并实现必要的升级授权检查：

    ```
    contract MyContract is UUPSUpgradeable, OtherFeatures {
        function _authorizeUpgrade(address newImplementation) internal override onlyOwner returns (bool) {
            return true;
        }
    }
    ```

    在上面的例子中，`_authorizeUpgrade`函数检查是否只有合约所有者可以进行升级。

    以上就是如何使用 OpenZeppelin 实现 UUPS 模式的合约。这种方式将升级的控制权和逻辑直接集成到实现合约中，减少了外部干预的需要，同时提高了合约系统的灵活性和安全性。


### Beacon 模式

Beacon 模式是升级智能合约的另一种方式，这种模式通过中心化的 Beacon 合约来控制多个实例合约的升级。所有这些实例合约都链接到一个共同的 Beacon 合约，该合约存储了当前的逻辑合约地址。当需要升级时，只需要在 Beacon 合约中更改实现合约地址，便可使所有依赖的实例合约都使用新版本的实现。这种模式特别适合于大量合约实例共享同一套逻辑的场景。

1. 工作原理

    Beacon 模式中主要包括两种类型的合约：

    • Beacon 合约：负责存储当前有效的逻辑合约地址，并提供获取该地址的方法。它由管理员进行管理，管理员有权限修改实现合约地址。
    • Proxy 合约：接收用户请求，并将这些请求通过 `delegatecall` 转发到 Beacon 合约指向的实现合约。

    当 Beacon 合约中的实现地址更新时，所有实例合约自动切换到新的实现合约，因此升级变得非常高效。

2. OpenZeppelin 实现的 Beacon 模式合约

    OpenZeppelin 为 Beacon 模式提供了一个标准的实现，包括 UpgradeableBeacon 和 BeaconProxy 合约。

    - UpgradeableBeacon

    UpgradeableBeacon 是一个负责存储和更新实现合约地址的合约。它还提供了一个只有所有者才能调用的函数来更新实现合约地址。

    代码结构如下：
    ```
    contract UpgradeableBeacon is Ownable {
        address private _implementation;

        event Upgraded(address indexed implementation);

        constructor(address initialImplementation) {
            _setImplementation(initialImplementation);
        }

        function implementation() public view returns (address) {
            return _implementation;
        }

        function upgrade(address newImplementation) public onlyOwner {
            _setImplementation(newImplementation);
            emit Upgraded(newImplementation);
        }

        function _setImplementation(address newImplementation) private {
            require(Address.isContract(newImplementation), "UpgradeableBeacon: new implementation is not a contract");
            _implementation = newImplementation;
        }
    }
    ```
    在这个合约中，构造函数接收一个初始的实现合约地址。upgrade 函数允许所有者更新地址。更新时会通过 Upgraded 事件通知外部。

    - BeaconProxy

    `BeaconProxy`是一个代理合约，它从`UpgradeableBeacon`获取当前的实现合约地址，并将所有调用委托给该实现合约。

    代码结构如下：
    ```
    contract BeaconProxy is Proxy {
        address private _beacon;

        constructor(address beacon, bytes memory data) {
            _beacon = beacon;
            if (data.length > 0) {
                (bool success, ) = _implementation().delegatecall(data);
                require(success);
            }
        }

        function _implementation() internal view override returns (address) {
            return IBeacon(_beacon).implementation();
        }
    }
    ```
    在这个实现中，`BeaconProxy`构造函数设置了`Beacon`合约地址，并可选择性地初始化代理。`_implementation`函数用于从`Beacon`合约获取当前的实现地址。

通过 Beacon 模式，升级过程简化，尤其适合那些具有多个实例需要升级的场景。


## 参考
- [EIP-1967](https://github.com/ethereum/ercs/blob/master/ERCS/erc-1967.md)
- [EIP-1822](https://github.com/ethereum/ercs/blob/master/ERCS/erc-1822.md)
- [编写可升级合约](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)


## 总结

通过本章的学习，我们对代理合约的不同升级模式有了深入的了解，包括它们的工作原理、优缺点和具体实施方式。这些知识对于设计灵活且可靠的智能合约系统至关重要。