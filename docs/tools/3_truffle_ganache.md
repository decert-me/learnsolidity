# Truffle 开发框架



Truffle是一个基于以太坊的区块链应用程序开发框架，它提供了一套开发工具和开发环境，方便开发者快速构建和部署智能合约。本文将介绍 Truffle 的一些特点和使用方法。



Truffle 团队还开发了 Ganache， Ganache 是一个用于以太坊开发和测试的个人区块链网络，它可以让开发者在本地运行以太坊节点，从而无需连接到公共测试网络或主网进行开发和测试。Ganache还提供了许多有用的功能，如快速挖矿、预设的账户和私钥、以太坊虚拟机调试器等，这些功能可以大大提高开发和测试的效率。同时，Ganache还支持与Truffle框架无缝集成，使得开发者可以更加方便地进行智能合约的开发和测试。



以下按使用Truffle框架进行区块链应用程序开发的基本步骤进行介绍：

1. Truffle & Ganache 安装
2. 创建Truffle项目
3. 编写智能合约
4. 编译
5. 部署
6. 测试



本文对应的代码在： https://github.com/xilibi2003/training_camp_2/tree/main/w1_truffle

另外补充Truffle Console 及 truffle-flattener 的使用



##  Truffle & Ganache 安装

在计算机上**安装Truffle**。可以通过npm安装，使用以下命令：

```bash
npm install -g truffle
```

Truffle 的安装依赖 Node.js 开发包（使用[v14 - v18](https://trufflesuite.com/docs/truffle/how-to/install/#install-nodejs)），Node.js 的安装参考[这里](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm)。

安装完成之后，可以使用  `truffle version` 检查一下。



安装 Ganache，作为开发节点。

前往 Ganache 网站 https://trufflesuite.com/ganache/ 下载， Ganache 提供了多个平台的版本，还有控制台命令行版本。

Ganache 安装好，截图如下：



![image-20230312145312368](https://img.learnblockchain.cn/pics/20230312145313.png)



## 创建Truffle项目

使用以下命令创建一个新的Truffle项目：

```
> truffle init
Starting init...
================

> Copying project files to /Users/emmett/course/training_camp_2/th

Init successful, sweet!

Try our scaffold commands to get started:
  $ truffle create contract YourContractName # scaffold a contract
  $ truffle create test YourTestName         # scaffold a test

http://trufflesuite.com/docs
```



Truffle 也提供了模板项目，他们称为 Boxes，在[Truffle Boxes](https://trufflesuite.com/boxes/) 页面提供所有的模板，模板会提供很多基础代码，如果想基于模板项目开发，可以通过以下命令创建项目：

```
 truffle unbox  aboxname
```


Truffle项目默认包含以下文件及目录：

- contracts：存放智能合约文件目录
- migrations：迁移文件、用来指示如何部署智能合约
- test：智能合约测试用例文件夹。
- truffle-config.js：配置文件，配置truffle连接的网络及编译选项。



## 合约编写

合约开发推荐使用 VSCode 编辑器 + [solidity 插件](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity):

![image-20230312155111537](https://img.learnblockchain.cn/pics/20230312155112.png)



配置好了编辑器， 就可以开始写合约了，使用 `truffle create` 创建一个名为 `Counter` 的合约：

```bash
truffle create contract Counter
```



在`contracts/` 会新建一个`Counter.sol`  文件，并且有默认的合约代码：

```js
// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Counter {
  constructor() public {
  }
}

```

我们可以在VSCode 编辑器把代码修改为：

```js
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint counter;

    constructor() {
        counter = 0;
    }

    function count() public {
        counter = counter + 1;
    }

    function get() public view returns (uint) {
        return counter;
    }
}
```



接下来就可以编译这个合约了。

## Truffle 编译

我们需要先告诉 Truffle 使用哪一个版本的编译器来编译合约，`truffle-config.js` 是 Truffle 框架用于项目配置，在这个文件中，你可以指定编译器、网络、账户和合约的路径等各种配置。



使用`solc`: 这个选项用来配置 Solidity 编译器的参数，也可以通过这个选项指定编译器的优化等级、版本等参数，这里使用如下配置：


```js
  module.exports = {
   	  compilers: {
      solc: {
        version: "0.8.9"
      }
    }
  }
  
```

（配置详细可参考[英文文档](https://trufflesuite.com/docs/truffle/reference/configuration/) 及 [中文文档](https://learnblockchain.cn/docs/truffle/reference/configuration.html))

接下来就可以进行编译了， 编译使用 `truffle compile` : 


```bash
➜ > truffle compile

Compiling your contracts...

===========================

> Compiling ./contracts/Counter.sol
> Artifacts written to …/build/contracts
> Compiled successfully using:
- solc: 0.8.9+commit.e5eed63a.Emscripten.clang
```

成功编译后，会在 `build/contracts/`  目录下生成`Counter.json`， `Counter.json`包含了智能合约的 ABI 、字节码（Bytecode）以及合约元数据等。

Counter.json 较大，这里不贴内容，可以在[这里](https://github.com/xilibi2003/training_camp_2/blob/main/w1_truffle/build/contracts/Counter.json)查看到完整的内容。



:::tip

知识点补充：

智能合约的 **ABI（Application Binary Interface）**信息，其中包括了合约的函数、事件等接口信息。这个文件通常会在与其他合约交互时使用，因为它可以被其他合约和 DApp 使用。

`Bytecode ` 是部署合约所需的字节码（也称为创建时字节码），部署合约时，就是把该字节码作为交易的输入数据发送链上。

**元数据（Metadata）**，其中包括合约的编译器版本、源代码哈希等信息，可以用于验证智能合约的真实性和完整性。

:::



## 部署合约



在部署合约前，还需要确定：

1. 确定部署到哪一个[网络](https://decert.me/tutorial/solidity/ethereum/evm_network)， 这可以使用  `truffle-config.js` 来进行配置
2. 确定如何部署合约，例如传递什么参数给合约，这需要我们编写部署脚本



之后就可以运行  `truffle migrate` 执行部署。



###  配置部署到哪一个网络



推荐的部署流程是：

1. 在本地的开发者网络（如：Ganache）进行部署，测试及验证代码逻辑的正确性
2. 在测试网络（如：Goerli）进行灰度发布
3. 一切 OK 后部署在主网（如： 以太坊主网）





`truffle-config.js`  中，使用 `networks`: 选项用来配置不同的网络。你可以通过指定不同的网络配置，来连接不同的EVM网络， 如下配置了两个网络：

```js
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      gas: 5500000           //  gas limit
      gasPrice: 10000000000,  // 10 Gwei 
    },
    
    goerli: {
      provider: () => new HDWalletProvider(MNEMONIC,  NODE_RPC_URL),
      network_id: 5,       // Goerli's chain id
      confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  }
};
```

（配置详细可参考[英文文档](https://trufflesuite.com/docs/truffle/reference/configuration/) 及 [中文文档](https://learnblockchain.cn/docs/truffle/reference/configuration.html))

`development`  网络连接了启动的 Ganache ，通过 IP 及 port 指定。

如果是真实的网络，如上的 goerli 网络，则需要提供提交交易账号的`助记词` 与 节点RPC URL （节点 URL 可以在https://chainlist.org/ 获取）。



注意要在 Goerli 上进行部署，你需要将Goerli-ETH发送到将要进行部署的地址中。 可以从水龙头免费或一些测试币，这是Goerli的一个水龙头:

\- [Alchemy Goerli Faucet](https://goerlifaucet.com/)





### 编写部署脚本

编写部署脚本（也称迁移文件），放在 `migrations`  目录下，添加一个文件 `1_counter.js`:



```js title="1_counter.js"
const Counter = artifacts.require("Counter");

module.exports = function (deployer) {

 deployer.deploy(Counter);

};
```



（部署脚本的编写可参考[英文文档](https://trufflesuite.com/docs/truffle/how-to/contracts/run-migrations/#migration-files) 及 [中文文档](https://learnblockchain.cn/docs/truffle/getting-started/running-migrations.html))

部署脚本前面有一个序号，是因为Truffle 按序号（从小到大）依次执行部署脚本。



### 执行部署

使用 `truffle migrate`  就可以部署合约：

```
truffle migrate [ -f 序号 --network 网络名称]
```

可以通过 -f 指定部署哪一个需要的部署脚本， 使用 `--network` 指定部署到哪一个网络。



在进行部署时，会发起一笔 [创建合约交易](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B0%83%E7%94%A8%E5%90%88%E7%BA%A6%E6%96%B9%E6%B3%95)， 交易完成后，会在链上生成一个[合约地址](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)， 如下图就是创建合约交易的详情：

![image-20230312145336098](https://img.learnblockchain.cn/pics/20230312145337.png) 



若部署到 Ganache 上，在 Ganache 中，可以出块记录，以及相关的交易详情。

部署信息如合约地址也会写入之前编译生成的构建文件`build/contracts/Counter.json`中。



## Truffle 测试

软件开发中，测试是重要的一环，在智能合约开发中，由于区块链不可篡改特性，测试尤其重要。



打开终端，在 Truffle 项目目录，并输入 `truffle create test Counter` 命令来创建一个测试文件，它会在 `./test/` 目录下创建一个名为 `counter.js` 的测试文件：

```
const Counter = artifacts.require("Counter");

contract("Counter", function (/* accounts */) {
  it("should assert true", async function () {
    await Counter.deployed();
    return assert.isTrue(true);
  });
});

```



在测试文件中，我们加入对`get` 及 `count` 方法的检查， 以下是一个简单的示例。

```js
var Counter = artifacts.require("Counter");

contract("Counter", function(accounts) {
  
  // it定义一个测试用例
  it("Counter", async function() {  
    let counter = await Counter.deployed()
    let num = await counter.get();
    // 满足断言则测试用例通过
    assert.equal(num, 0);  
  });
});
```



在测试文件中，通过导入需要测试的合约文件，创建一个合约实例，并在测试函数中调用它的方法，然后断言方法返回的结果是否符合预期。



在上面的代码中，我们创建了一个测试套件，并在其中定义了以个测试函数。测试函数测试合约的 `get` 方法是否返回正确的值。



在每个测试函数中，我们首先通过 `await MyContract.deployed()` 创建了一个合约实例，然后调用相应的方法，并使用 `assert` 断言方法返回的结果是否符合预期。最后，我们可以使用 `truffle test` 命令来运行所有测试：



```bash
$ truffle test

$ truffle test ./path/to/test/file.js
```



总之，编写测试时需要考虑合约的各种情况和边界条件，并断言实际结果是否与预期结果一致。通过编写测试可以帮助我们确保合约的正确性和健壮性，同时也是良好的编程习惯。





## 补充 1： Truffle console

Truffle console是Truffle框架提供的一个交互式命令行界面，用于与Solidity智能合约交互。使用Truffle console可以在开发和测试阶段快速地测试和验证合约功能，而无需手动部署和调用合约。



在项目根目录下使用以下命令， 启动`Truffle console`。



````
> truffle console

truffle(development)> 
````



启动Truffle console并连接到当前项目的默认网络（通常是开发网络）。一旦连接成功，您可以在控制台中执行各种操作。



下面是获取部署的合约实例以及调用 count 方法的示例：

```
truffle(development)> let counter = await Counter.deployed()
truffle(development)> counter.count()

```

 更多交互可参考[文档](https://trufflesuite.com/docs/truffle/how-to/contracts/interact-with-your-contracts/) 。





## 补充 2：truffle-flattener

Truffle-flattener 是一个命令行工具，可以将合约文件中的所有合约代码合并为一个单一的文件，以方便我们进行代码开源验证。

我们可以全局安装这个命令行工具：`npm install -g truffle-flattener`。然后，在项目的根目录下，可以使用以下命令来生成单一的合约文件：

```bash
truffle-flattener contracts/MyContract.sol > flattened/MyContract.sol
```



## 小结

本文介绍了Truffle开发框架的一些基本概念和使用方法，包括Truffle框架的基本结构、配置文件和命令、智能合约的编译和测试、Truffle console的使用，以及Truffle-flattener的简介。这些内容涵盖了Truffle框架的基本使用，有助于初学者快速入门Truffle开发。



这里有两个参考文档：

- 文档：https://trufflesuite.com/docs/truffle/
- 中文文档：https://learnblockchain.cn/docs/truffle/



不过，目前合约开发使用 Truffle 工具的项目越来越少， 有更多的人开始使用 [Hardhat](./4_hardhat.md) 和 [Foundry](./5_foundry.md)。



