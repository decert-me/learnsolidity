Foundry 是一个Solidity框架，用于构建、测试、模糊、调试和部署Solidity智能合约， Foundry 的优势是以Solidity 作为第一公民，完全使用 Solidity 进行开发与测试，如果你不太熟悉 JavaScript ， 使用 Foundry 是一个非常好的选择，而且Foundry 构建、测试的执行速度非常快。



Foundry 的测试功能非常强大，通过 [作弊码](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/cheatcodes.html#作弊码cheatcodes) 来操纵区块链的状态， 可以方便我们模拟各种情况， 还支持基于属性的模糊测试。



Foundry 有非常详细的文档，并且登链社区进行的详尽的翻译，见[Foundry 中文文档](https://learnblockchain.cn/docs/foundry/i18n/zh/)，对中文用户非常友好， 



在本文中，我们将介绍：



1. Foundry 安装
2. 初始化 Foundry 项目
3. 编写、编译智能合约
4. 编写自动化测试
5. 使用 Foundry 部署合约
6. 补充1：Anvil 本地节点使用
7. 补充2：Cast 与合约交互
8. 补充3：第 3 方库的安装
9. 补充4：标准库与作弊码
10. 补充5：Chisel - Solidity REPL


本文参考代码在：https://github.com/lbc-team/hello_foundry



## Foundry 安装

终端并输入以下命令：

 ```
 curl -L https://foundry.paradigm.xyz | bash
 ```

这会下载`foundryup`。 然后通过运行它安装 Foundry：

```
foundryup
```

安装完成后，Foundry 提供了四个命令行工具：

- **forge**: 用来执行初始化项目、管理依赖、测试、构建、部署智能合约
- **cast**: 执行以太坊 RPC 调用的命令行工具，进行智能合约调用、发送交易或检索任何类型的链数据
- **anvil**: 创建一个本地测试网节点，也可以用来分叉其他与 EVM 兼容的网络
- **chisel**: Solidity REPL（交互式解释器），可以在命令行中快速测试 Solidity 代码片段



## 初始化Foundry项目



通过 `forge` 的 `forge init` 初始化项目：

```
> forge init hello_decert
Installing forge-std in "/Users/emmett/course/hello_decert/lib/forge-std"  ...
Cloning into '/Users/emmett/BCProject/hello_decert/lib/forge-std'...
...
```

init 命令会创建一个项目目录，并安装好`forge-std` 库。


创建好的 Foundry 工程结构为：

```
> tree -L 2
.
├── foundry.toml
├── lib
│   └── forge-std
├── script
│   └── Counter.s.sol
├── src
│   └── Counter.sol
└── test
    └── Counter.t.sol

5 directories, 4 files
```



- `src`：智能合约目录
- `script` ：部署脚本文件
- `lib`: 依赖库目录
- `test`：智能合约测试用例文件夹
- `foundry.toml`：配置文件，配置连接的网络URL 及编译选项。



Foundry 使用 Git submodule 来管理依赖库， `.gitmodules` 文件记录了目录与子库的关系:

```
[submodule "lib/forge-std"]
	path = lib/forge-std
	url = https://github.com/foundry-rs/forge-std
```


## 合约开发及编译

合约开发推荐使用 Cursor 编辑器(或其他 AI 编辑器) + [solidity 插件](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)，在`contracts` 下新建一个合约文件 `Counter.sol` (`*.sol` 是 Solidity 合约文件的后缀名),  复制如下代码：

```
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.29;

contract Counter {
    uint256 public counter;

    function setNumber(uint256 newNumber) public {
        counter = newNumber;
    }

    function increment() public {
        counter++;
    }

    function count() public {
        counter = counter + 1;
    }
}

```



在`foundry.toml` 中使用`solc`配置编译器版本：

```
[profile.default]
src = 'src'
out = 'out'
libs = ['lib']

solc = "0.8.29" 
```

更多的配置项请参考 [ `foundry.toml` 配置 ](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/config/overview.html)  

之后就使用`forge build`编译合约了：

```
> forge build
[⠒] Compiling...
[⠔] Compiling 1 files with 0.8.29
[⠒] Solc 0.8.29 finished in 362.64ms
Compiler run successful
```



## 编写自动化测试

测试是用 Solidity 编写的。 如果测试功能 revert，则测试失败，否则通过。

### 测试 Case 编写

在测试目录下`test` 添加自己的测试用例，添加文件 `Counter.t.sol` ，foundry 测试用例使用 `.t.sol` 后缀，约定具有以`test`开头的函数的合约都被认为是一个测试， 以下是测试代码：

```
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    function testIncrement() public {
        counter.increment();
        assertEq(counter.counter(), 1);
    }

    function testSetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.counter(), x);
    }
}

```



我们来分析一下测试代码：

```
import "forge-std/Test.sol";
```

引入 [Forge 标准库](https://github.com/foundry-rs/forge-std) 的 `Test` 合约，并让测试合约继承 `Test` 合约， 这是使用 Forge 编写测试的首选方式。

 第 9 行 `setUp()` 函数用来进行一些初始化，它是每个测试用例运行之前调用的可选函数



第 14、19 行是以 `test` 为前缀的函数的两个测试用例，测试用例中使用 `assertEq` 断言判断相等。

`testSetNumber` 带有一个参数 `x`，它使用了**模糊测试（Fuzz Testing）**。模糊测试会自动生成随机输入来测试函数。[Forge 模糊器](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/fuzz-testing.html)默认会随机生成 256 个不同的 `x` 值来运行这个测试。

### 模糊测试（Fuzz Testing）

模糊测试是 Foundry 的强大功能，它通过提供随机输入来自动发现边界情况和潜在问题。

**基础用法**：任何带参数的测试函数都会自动成为模糊测试。

```solidity
// 普通测试：只运行一次
function testIncrement() public {
    counter.increment();
    assertEq(counter.counter(), 1);
}

// 模糊测试：会用 256 个随机的 x 值运行
function testSetNumber(uint256 x) public {
    counter.setNumber(x);
    assertEq(counter.counter(), x);
}
```

**过滤输入 - 使用 `vm.assume()`**：

当某些输入无效时，使用 `vm.assume()` 过滤：

```solidity
function testSetNumberNonZero(uint256 x) public {
    vm.assume(x != 0);  // 只测试非零值

    counter.setNumber(x);
    assertEq(counter.counter(), x);
    assertTrue(counter.counter() > 0);
}
```

**限制范围 - 使用 `bound()`**（推荐）：

相比 `assume()`，使用 `bound()` 更好，它会将输入映射到指定范围：

```solidity
function testSetNumberInRange(uint256 x) public {
    // 将 x 限制在 1-100 之间
    uint256 value = bound(x, 1, 100);

    counter.setNumber(value);
    assertEq(counter.counter(), value);
    assertTrue(counter.counter() >= 1 && counter.counter() <= 100);
}
```

**配置模糊测试**：

在 `foundry.toml` 中可以配置运行次数：

```toml
[fuzz]
runs = 1000  # 每个模糊测试运行 1000 次（默认 256）
```


### 运行测试



Forge 使用 [`forge test`](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/forge/forge-test.html) 命令运行测试用例（请先启动`anvil`）：

```
> forge test
[⠒] Compiling...
No files changed, compilation skipped

Running 2 tests for test/Counter.t.sol:CounterTest
[PASS] testIncrement() (gas: 28390)
[PASS] testSetNumber(uint256) (runs: 256, μ: 28064, ~: 28453)
Test result: ok. 2 passed; 0 failed; finished in 9.33ms
```

结果中的两个 `PASS` 表示测试通过了，并且列出了测试所消耗的 gas，

在 `testSetNumber(uint256)` 模糊测试中的`(runs: 256, μ: 28064, ~: 28453)`，含义是：

- "runs" 是指模糊器 fuzzer 测试的场景数量。 默认情况下，模糊器 fuzzer 将生成 256 个场景，但是，其可以使用 [`FOUNDRY_FUZZ_RUNS`](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/config/testing.html#runs) 环境变量进行配置。
- “μ”（希腊字母 mu）是所有模糊运行中使用的平均 Gas
- “~”（波浪号）是所有模糊运行中使用的中值 Gas



我们还可以在测试用例用 `console2.sol`  打印值的结果，修改一下 `testIncrement` 加入 console2.log， 修改后的代码为：

```
    function testIncrement() public {
        counter.increment();
        uint x = counter.counter();
        console2.log("x= %d", x);
        assertEq(x, 1);
    }
```



> `console2.sol` 包含 `console.sol` 的补丁，允许Forge 解码对控制台的调用追踪



`forge test` 的默认行为是只显示通过和失败测试的摘要。 可以使用`-vv`标志通过增加日志详细程度：

```
> forge test -vv
[⠒] Compiling...
No files changed, compilation skipped

Running 2 tests for test/Counter.t.sol:CounterTest
[PASS] testIncrement() (gas: 31626)
Logs:
  x= 1

[PASS] testSetNumber(uint256) (runs: 256, μ: 27597, ~: 28453)
Test result: ok. 2 passed; 0 failed; finished in 9.94ms
```

可以看到 Logs 下显示了测试用例中的打印的日志。


更多 Forge 测试使用参考[文档 - 测试](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/tests.html)， [文档 - 高级测试](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/advanced-testing.html)


## 部署合约

部署合约到真实区块链，需要先准备有足够费用的部署账号及区块链节点的 RPC  URL。

**部署账号领水**
如果是测试网，我们可以在水龙头获取测试币，这些是当前 Sepolia 网络可用的水龙头：

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [LearnWeb3 Faucet](https://learnweb3.io/faucets/sepolia)

在水龙头网站粘贴你的钱包地址，领取免费测试币，通常每次可以获得 0.5-1 ETH 的测试币，足够进行多次部署。

**获取 RPC URL**

在 Chainlist.org 可以找到很多免费的 RPC 节点。这些节点服务商： [Alchemy](https://www.alchemy.com/)、 [Infura](https://infura.io/)、 [QuickNode](https://www.quicknode.com/) 也有很多的免费访问额度。

### 使用 forge create 部署

Forge 提供 create 命令部署合约， 如：

```
forge create  src/Counter.sol:Counter  --rpc-url <RPC_URL>  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

`--private-key` 指定部署账号、 `--rpc-url` 指定部署网络，由于 create 命令需要输入的参数较长，且直接暴露私钥。因此更推荐使用部署脚本进行部署。

### 部署脚本

在 script  目录下创建一个脚本，`Counter.s.sol`：

```
pragma solidity ^0.8.29;

import "forge-std/Script.sol";
import "../src/Counter.sol";

contract CounterScript is Script {
		
    function run() external {
        string memory mnemonic = vm.envString("MNEMONIC");
				(address deployer, ) = deriveRememberKey(mnemonic, 0);
				
        vm.startBroadcast(deployer);
		Counter c = new Counter();
        console2.log("Counter deployed on %s", address(c));
        vm.stopBroadcast();
    }
}
```


我们来分析一下脚本代码：
默认情况下，脚本是通过调用名为 `run` 的函数（入口点）来执行的部署。

```
string memory mnemonic = vm.envString("MNEMONIC");
(address deployer, ) = deriveRememberKey(mnemonic, 0);
```

从 .env 文件中加载助记词，并推导出部署账号，如果 `.env` 配置的是私钥，这使用`uint256 deployer = vm.envUint("PRIVATE_KEY");` 加载账号。这样可以避免在命令行中输入过长信息。

```
vm.startBroadcast(deployerPrivateKey);
```

这是一个作弊码，表示使用该密钥来签署交易并广播。

```
Counter c = new Counter();
```

创建Counter 合约。



通常我们还会 `.env` 配置 RPC URL ，以方便在部署时指定网络，因此 `.env` 大概是这样：

```
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MNEMONIC=
```

可以在 `foundry.toml` 文件引用定义环境变量来定义端点：

```toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
local = "http://127.0.0.1:8545"
```

这样可以部署脚本中直接引用 `sepolia` 、 `local` 网络名。

脚本代码编写好了， 让我们运行它， 在项目的根目录运行：

```
> source .env

> forge script script/Counter.s.sol --rpc-url sepolia --broadcast
[⠒] Compiling...
[⠊] Compiling 1 files with 0.8.29
[⠒] Solc 0.8.29 finished in 738.87ms
Compiler run successful
Script ran successfully.
Gas used: 127361

== Logs ==
  Counter deployed on 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
...

```
部署成功打印出合约的地址。


forge script 支持在部署时进行代码验证，在 `foundry.toml` 文件中配置了 etherscan的 API KEY：

```
[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

然后需要在 script 命令中加入 `--verify`  就可以执行代码开源验证。


至此，我们已经知道了如何使用 Foundry 进行合约开发，下面继续补充一些常用知识点。


## 补充1： Anvil 使用

`anvil` 是 Foundry 团队开发的本地以太坊节点，专门为开发和测试而设计。它可以创建一个本地开发网节点，用于部署和测试智能合约，也可以用来分叉其他与 EVM 兼容的网络。

运行 `anvil` 效果如下

```
> anvil


                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ \  \ \ / / | | | |
    | (_| | | | | |  \ V /  | | | |
     \__,_| |_| |_|   \_/   |_| |_|

    1.4.4-nightly (87a024e99d 2025-10-30T06:04:50.015121000Z)
    https://github.com/foundry-rs/foundry

Available Accounts
==================

(0) "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" (10000 ETH)
(1) "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" (10000 ETH)
....

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
....

Wallet
==================
Mnemonic:          test test test test test test test test test test test junk
Derivation path:   m/44'/60'/0'/0/


Chain ID
==================
31337

Base Fee
==================
1000000000

Gas Limit
==================
30000000

Genesis Timestamp
==================
1766414056

Listening on 127.0.0.1:8545
```



anvil 命令常用到的功能选项有：

```
anvil --port <PORT>
```

设置节点端口

```
anvil --mnemonic=<MNEMONIC> 
```

使用自定义助记词

```
anvil --fork-url=$RPC_URL
```

从 RPC 节点 fork 区块链的当前状态，普通节点即可

```
anvil --fork-url=$RPC_URL --fork-block-number=<BLOCK>
```

Fork 指定区块高度的历史状态，**需要存档节点**（Archive Node），因为普通节点只保留最近的状态



anvil完整的功能选项可参考[文档](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/anvil/index.html#%E9%80%89%E9%A1%B9)



## 补充2：Cast 与合约交互使用
`cast` 命令可以用来和区块链交互，因此可以直接使用 `cast` 在命令行中调用合约。

例如 `cast call` 来调用`counter()` 方法：

```
> cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "counter()" --rpc-url local
0x0000000000000000000000000000000000000000000000000000000000000000
```
`0x9fe467...` 是被调用合约的地址，命令返回了结果 0。


使用 `cast send` 调用 `setNumber(uint256)` 方法，发起一个交易: 
```bash
> cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "setNumber(uint256)" 1 --rpc-url local --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

blockHash               0x9311823387753f28f47a5c87357e6207b13b223bd3afca5c1f1b31a5e4f8e400
blockNumber             1
contractAddress
cumulativeGasUsed       21204
effectiveGasPrice       4000000000
gasUsed                 21204
logs                    []
logsBloom               0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
root
status                  1
transactionHash         0x5c74da477ce3922337037d0e153fb99f9b325b49f2bf199a487ddb965f6d1727
transactionIndex        0
type                    2
```

调用的函数有参数，则直接写在函数的后面。

获取账号的余额（返回 Wei 为单位）：

```
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
9999999222505911124404
```


`cast` 命令功能非常多，更多参考[文档](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/cast/cast.html)



## 补充3：安装第 3 方库

使用 `forge install` 可以安装第三方的库，不同于 npm，forge 会把整个第三方的库的 Git 仓库作为子模块放在lib目录下。
使用命令如下：
```
forge install [OPTIONS] <github username>/<github project>@<tag>
```

例如，安装`openzepplin`使用命令：

```
> forge install OpenZeppelin/openzeppelin-contracts
Installing openzeppelin-contracts in "/Users/emmett/course/hello_decert/lib/openzeppelin-contracts" (url: Some("https://github.com/OpenZeppelin/openzeppelin-contracts"), tag: None)
    Installed openzeppelin-contracts v4.8.2

```

安装之后，`.gitmodules` 会添加新记录：

```
[submodule "lib/openzeppelin-contracts"]
	path = lib/openzeppelin-contracts
	url = https://github.com/OpenZeppelin/openzeppelin-contracts
	branch = v4.8.2
```

lib 下也会多一个openzeppelin文件夹:
```
> tree lib -L 1
lib
├── forge-std
└── openzeppelin-contracts
```

然后，就可以在代码中引用 openzeppelin 库代码了， 让我们给 `setNumber` 加一个限制：仅所有者才可以调用，代码如下：

```
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract Counter is Ownable {
    uint256 public number;

    function setNumber(uint256 newNumber) public onlyOwner {
        number = newNumber;
    }
    // ....
}
```


### 使用 npm 安装库

如果你使用NPM来安装库，也同样可以支持，在项目根目录下初始化项目，并安装库：

```
npm init -y
npm install @openzeppelin/contracts 
```

安装完成之后，把node_modules文件夹 配置在 foundry.toml 的 libs中：

```
[profile.default]
src = 'src'
out = 'out'
libs = ['lib','node_modules']
```




## 补充4： 标准库

标准库封装了很多好好的方法可以直接使用，分为 4 个部分：

- `Vm.sol`：提供作弊码（Cheatcodes）
- `console.sol` 和 `console2.sol`：Hardhat 风格的日志记录功能， `console2.sol` 包含 `console.sol` 的补丁，允许Forge 解码对控制台的调用追踪，但它与 Hardhat 不兼容。
- `Script.sol`：[Solidity 脚本](https://learnblockchain.cn/docs/foundry/i18n/zh/tutorials/solidity-scripting.html) 的基本实用程序
- `Test.sol`：DSTest 的超集，包含标准库、作弊码实例 (`vm`) 和 Foundry 控制台


介绍几个常用的作弊码：
1. `vm.startPrank(address)` 来模拟用户， 在`startPrank`之后的调用使用设置的地址作为`msg.sender` 直到`stopPrank` 被调用。

举例：

```
address owner = address(0x123);
// 模拟owner
vm.startPrank(owner);

erc20.transfer(0x...., 1);  //  从bob 账号转出
erc20.mint(100);
....

// 结束模拟
vm.stopPrank();
```

如果只有一个调用需要模拟可以使用 `prank(address)`

2. `warp(uint256)` 设置区块时间，可以用来测试时间的流逝。

举例：
```
vm.warp(1641070800);
emit log_uint(block.timestamp); // 1641070800
```

3. `roll(uint256)` 设置区块

举例：
```
vm.roll(100);
emit log_uint(block.number); // 100
```

更多用法可参考[作弊码文档](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/cheatcodes.html)。


## 补充5：Chisel - Solidity REPL

`chisel` 是 Foundry 的 Solidity REPL（交互式解释器），可以在命令行中快速测试和执行 Solidity 代码片段，无需创建完整的合约文件。

### 启动 Chisel

在终端中直接运行：

```bash
chisel
```

启动后会进入交互式环境：

```
Welcome to Chisel! Type `!help` to show available commands.
➜
```

### 基本用法

1. **直接执行 Solidity 代码**：

```solidity
➜ uint256 x = 100;
➜ x + 50
Type: uint256
├ Hex: 0x96
├ Hex (full word): 0x0000000000000000000000000000000000000000000000000000000000000096
└ Decimal: 150
```

2. **测试函数调用**：

```solidity
➜ bytes32 hash = keccak256(abi.encodePacked("hello"));
➜ hash
Type: bytes32
└ Data: 0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
```

3. **导入和使用第三方库**：

```solidity
➜ import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";
➜ // 现在可以使用 ERC20 合约
```

4. **查看变量**：

```solidity
➜ !source  // 显示当前会话中定义的所有变量和代码
```

### 常用命令

- `!help` - 显示帮助信息
- `!quit` 或 `!q` - 退出 chisel
- `!clear` - 清除当前会话
- `!source` - 显示当前会话的所有代码
- `!edit` - 使用编辑器编辑当前会话
- `!fork <RPC_URL>` - 分叉一个网络进行测试
- `!exec <file>` - 执行文件中的 Solidity 代码

### 实用场景

**1. 快速测试编码/解码**：

```solidity
➜ bytes memory data = abi.encode(uint256(100), address(0x123));
➜ (uint256 num, address addr) = abi.decode(data, (uint256, address));
➜ num
Decimal: 100
```

**2. 测试加密函数**：

```solidity
➜ bytes32 messageHash = keccak256("test message");
➜ bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n12", "test message"));
```

**3. 地址和数值转换**：

```solidity
➜ uint160 addr = uint160(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
➜ address token = address(addr);
```

chisel 非常适合：
- 快速验证 Solidity 语法
- 测试数据编码/解码
- 计算哈希值
- 学习和实验新的 Solidity 特性


## 小结

Foundry 是一个现代化的 Solidity 开发框架，以 Solidity 为中心，提供了完整的开发工具链：

**核心优势**：
- **快速**：构建和测试速度极快，采用 Rust 编写
- **纯 Solidity**：测试也用 Solidity 编写
- **四大工具**：`forge`、`cast` 、`anvil`、`chisel`
- **测试功能强大**： 丰富作弊码、模糊测试、Fork 主网、Gas 报告


Foundry 是当前 Solidity 开发中，使用最广泛的框架

Foundry 的使用你掌握了吗？ 去[挑战](https://decert.me/quests/3bca8f1f-df6b-469b-941e-79388ee280c6)一下看看，挑战完成你就可以领取到一枚技能认证 NFT。
