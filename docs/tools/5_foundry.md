# Foundry 开发框架

Foundry 是一个Solidity框架，用于构建、测试、模糊、调试和部署Solidity智能合约， Foundry 的优势是以Solidity 作为第一公民，完全使用 Solidity 进行开发与测试，如果你不太熟悉 JavaScript ， 使用 Foundry 是一个非常好的选择，而且Foundry 构建、测试的执行速度非常快。



Foundry 的测试功能非常强大，通过 [作弊码](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/cheatcodes.html#作弊码cheatcodes) 来操纵区块链的状态， 可以方便我们模拟各种情况， 还支持基于属性的模糊测试。



Foundry 有非常详细的文档，并且登链社区进行的详尽的翻译，见[Foundry 中文文档](https://learnblockchain.cn/docs/foundry/i18n/zh/)，对中文用户非常友好， 



在本文中，我们将介绍：



1. Foundry 安装
2. 初始化Foundry项目
3. 编写、编译智能合约
4. 编写自动化测试
5. 使用 Foundry 部署合约
6. 补充1： Anvil 使用
7. 补充2：Cast 与合约交互使用
8. 补充3： 第 3 方库的安装 
9. 补充4： 标准库



本文对应的代码在：https://github.com/xilibi2003/training_camp_2/tree/main/w1_foundry



## Foundry 安装

终端并输入以下命令：

 ```
 curl -L https://foundry.paradigm.xyz | bash
 ```

这会下载`foundryup`。 然后通过运行它安装 Foundry：

```
foundryup
```

安装安装后，有三个命令行工具 `forge`, `cast`, `anvil` 组成

- **forge**: 用来执行初始化项目、管理依赖、测试、构建、部署智能合约 ;
- **cast**:  执行以太坊 RPC 调用的命令行工具, 进行智能合约调用、发送交易或检索任何类型的链数据
- **anvil**:  创建一个本地测试网节点, 也可以用来分叉其他与 EVM 兼容的网络。



## 初始化Foundry项目



通过 `forge` 的 `forge init` 初始化项目：

```
> forge init hello_decert
Installing forge-std in "/Users/emmett/course/hello_decert/lib/forge-std" (url: Some("https://github.com/foundry-rs/forge-std"), tag: None)
    Installed forge-std v1.5.1
    Initialized forge project.
```

init 命令会创建一个项目目录，并安装好`forge-std` 库。

如需手动安装依赖库使用： `forge install forge/forge-std`



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
	branch = v1.5.0
```

<details>
  <summary>了解 Git submodule  </summary>
  <div> 1. Git submodule 是 Git 中用于管理子模块的工具。允许在一个 Git 仓库中把另一个 Git 仓库作为子目录，实现代码共享和重用（而不是拷贝代码）。
    <br/>
    2. 将子仓库添加到当前库使用：git submodule add <url_to_repository> <path_to_submodule> ， 在当前库下会生成 .gitmodules 文件用来跟踪子库。
    <br/>
    3. 如果我们 clone 的库包含子库，需要使用 git submodule init 及 git submodule update 来获取子库的代码。
    <br/>
  </div>
</details>



**如果我们是克隆一个Foundry 项目，这通过`git submodule init` 和 `git submodule update` 拉取依赖库代码。**

## 合约开发及编译

合约开发推荐使用 VSCode 编辑器 + [solidity 插件](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)，在`contracts` 下新建一个合约文件 `Counter.sol` (`*.sol` 是 Solidity 合约文件的后缀名),  复制如下代码：

```
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

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

solc = "0.8.18" 
```

更多的配置项请参考 [ `foundry.toml` 配置 ](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/config/overview.html)  

之后就使用`forge build`编译合约了：

```
> forge build
[⠒] Compiling...
[⠔] Compiling 1 files with 0.8.18
[⠒] Solc 0.8.18 finished in 362.64ms
Compiler run successful
```



## 编写自动化测试

测试是用 Solidity 编写的。 如果测试功能 revert，则测试失败，否则通过。

### 测试 Case 编写

在测试目录下`test` 添加自己的测试用例，添加文件 `Counter.t.sol` ，foundry 测试用例使用 `.t.sol` 后缀，约定具有以`test`开头的函数的合约都被认为是一个测试， 以下是测试代码：

```
pragma solidity ^0.8.13;

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

`testSetNumber` 带有一个参数 `x`，  它使用了基于属性的模糊测试， [forge 模糊器](https://learnblockchain.cn/docs/foundry/i18n/zh/forge/fuzz-testing.html)默认会随机指定256 个值运行测试。



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

部署合约到区块链，需要先准备有币的账号及区块链节点的 RPC  URL。

Forge 提供 create 命令部署合约， 如：

```
forge create  src/Counter.sol:Counter  --rpc-url <RPC_URL>  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

create 命令需要输入的参数较多，使用部署脚本是更推荐的做法是使用 [solidity-scripting](https://learnblockchain.cn/docs/foundry/i18n/zh/tutorials/solidity-scripting.html) 部署。



为此我们需要稍微配置 Foundry 。

通常我们会创建一个 `.env` 保存私密信息（如：私钥），`.env` 文件应遵循以下格式：

```
GOERLI_RPC_URL=
MNEMONIC=
```

.env 中记录自己的助记词及RPC  URL。

编辑 `foundry.toml` 文件： 

```toml
[rpc_endpoints]
goerli = "${GOERLI_RPC_URL}"
```



然后在 script  目录下创建一个脚本，`Counter.s.sol`：

```
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Counter.sol";

contract CounterScript is Script {
		
    function run() external {
        string memory mnemonic = vm.envString("MNEMONIC");
				(address deployer, ) = deriveRememberKey(mnemonic, 0);
				
        vm.startBroadcast(deployer);
				new Counter();
        vm.stopBroadcast();
    }
}
```

我们来分析一下脚本代码：

```
contract CounterScript is Script {
```

创建一个名为 `CounterScript` 的合约，它从 Forge Std 继承了 `Script`。

```
function run() external {
```

默认情况下，脚本是通过调用名为 `run` 的函数（入口点）来执行的部署。



```
string memory mnemonic = vm.envString("MNEMONIC");
(address deployer, ) = deriveRememberKey(mnemonic, 0);
```

从 .env 文件中加载助记词，并推导出部署账号，如果 `.env` 配置的是私钥，这使用`uint256 deployer = vm.envUint("PRIVATE_KEY");` 加载账号



```
vm.startBroadcast(deployerPrivateKey);
```

这是一个作弊码，表示使用该密钥来签署交易并广播。

```
new Counter();
```

创建Counter 合约。

脚本代码编写好了， 让我们运行它， 在项目的根目录运行：

```

> source .env

> forge script script/Counter.s.sol --rpc-url goerli --broadcast 
```

goerli 是我们之前在`foundry.toml` 文件中配置的端点。



forge script 支持在部署时进行代码验证，在 `foundry.toml` 文件中配置了 etherscan的 API KEY：

```
[etherscan]
goerli = { key = "${ETHERSCAN_API_KEY}" }
```

然后需要在 script 命令中加入 `--verify`  就可以执行代码开源验证。



至此，我们已经知道了如何使用 Foundry 进行合约开发，下面继续补充一些常用知识点。



## 补充1： Anvil 使用

`anvil` 命令创建一个本地开发网节点（好像是对 hardhat node的封装 ），用于部署和测试智能合约。它也可以用来分叉其他与 EVM 兼容的网络。

运行 `anvil` 效果如下

```
> anvil


                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ \  \ \ / / | | | |
    | (_| | | | | |  \ V /  | | | |
     \__,_| |_| |_|   \_/   |_| |_|

    0.1.0 (1d9a34e 2023-03-07T00:07:41.730822Z)
    https://github.com/foundry-rs/foundry

Available Accounts
==================

(0) "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" (10000 ETH)
(1) "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" (10000 ETH)
(2) "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" (10000 ETH)
....

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
(2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Wallet
==================
Mnemonic:          test test test test test test test test test test test junk
Derivation path:   m/44'/60'/0'/0/


Base Fee
==================

1000000000

Gas Limit
==================

30000000

Genesis Timestamp
==================

1678704146

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
anvil --fork-url=$RPC --fork-block-number=<BLOCK>
```

 从节点URL（需要是存档节点）fork 区块链状态，可以指定某个区块时的状态。



完整的功能选项可参考[文档](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/anvil/index.html#%E9%80%89%E9%A1%B9)







## 补充2：Cast 与合约交互使用



## 补充3： 第 3 方库的安装





## 补充4： 标准库



有用的合约的集合，使编写测试更容易、更快、更人性化，分为 4 个部分：

- `Vm.sol`：最新的作弊码接口
- `console.sol` 和 `console2.sol`：Hardhat 风格的日志记录功能， `console2.sol` 包含 `console.sol` 的补丁，允许Forge 解码对控制台的调用追踪，但它与 Hardhat 不兼容。
- `Script.sol`：[Solidity 脚本](https://learnblockchain.cn/docs/foundry/i18n/zh/tutorials/solidity-scripting.html) 的基本实用程序
- `Test.sol`：DSTest 的超集，包含标准库、作弊码实例 (`vm`) 和 Foundry 控制台







## 小结