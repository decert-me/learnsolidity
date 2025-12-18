# Remix IDE

如果你是第一次接触智能合约开发，可能会有些紧张：我需要配置复杂的开发环境吗？我需要安装很多工具吗？别担心，这正是我们从 Remix 开始的原因。

Remix 是一个运行在浏览器中的集成开发环境（IDE），这意味着你**不需要安装任何软件**，只需要打开浏览器，就可以立即开始编写你的第一个智能合约。对于初学者来说，Remix 是开发智能合约的最佳选择，它让你可以专注于学习 Solidity 语言本身，而不用被复杂的环境配置所困扰。

在这一节中，你将学会：
- 使用 Remix 编写你的第一个智能合约
- 编译合约代码
- 将合约部署到模拟环境和真实的测试网络
- 与部署的合约进行交互

让我们开始吧！

## Remix 简介

Remix 对初学者来说，是开发智能合约的最佳开发集成环境（IDE），它无需安装，可以直接快速上手。
Remix 是在以太坊上构建的最简单的开发工具，并且拥有大量插件来扩展其体验。

Remix 可帮助我们直接在浏览器中编写 Solidity 代码，并提供用于测试、调试和将智能合约部署到区块链的工具，除此之外，Remix 还提供：



1. 代码提示补全，代码高亮

2. 代码警告、错误提示

3. 运行日志输出

4. 代码调试

   

Remix 开箱即用，你可以打开 Remix 网站：https://remix.ethereum.org/ ， 进入到 Remix IDE：

![image-20230311155750476](https://img.learnblockchain.cn/pics/20230311155751.png)



`Remix` 包含 4 个区域，上图用 4 个框分别标记了

1. 最左侧`功能切换`：不同图标对应不同的功能，选中不同的功能，`功能操作`  也会跟随变化
2. `功能操作`：各种功能展示与使用
3. `文件编辑`：代码编辑的地方
4. `控制台/日志区`：显示与合约交互的结果，也可以输入命令。


Solidity 是一门编译型高级语言，需要经过编译、部署才能运行。

下面我们使用 Remix 探索新建合约、合约代码编写、编译、部署，调用合约的完整过程。

## 创建合约

在文件浏览器界面有一个“Create”，按钮，如下操作：


![remix - 创建文件](https://img.learnblockchain.cn/attachments/2025/12/GsvFHuNd6943c00e77da8.png)

我们创建一个新的合约“Create new file” ，并在随后将合约命令为 `counter.sol`  。



## 合约代码编写

当处于文件编辑功能时，功能操作区域显示的是文件浏览器，我们选中 `counter.sol` 文件，在右侧`文件编辑`区域输入在上一节[认识以太坊](../ethereum/1_evm_core.md) 的 `Counter` 合约代码

```js title="counter.sol"
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

这是一个简单的计数器合约，这个智能合约的作用是在区块链上存储一个计数器变量 `counter`， `counter` 值将会被永久保存在区块链上。

`count()`函数让计数器加1，`get()`函数用来获取计数器值。

智能合约不需要编写入口方法（如main方法），每一个函数都可以被单独调用。

> 其实编译器会帮助合约生成main入口函数，EVM 在入口函数里用函数选择器去匹配调用的函数。



 输入完代码后，你应该看到如下图：

![image-20230311161731866](https://img.learnblockchain.cn/pics/20230311161733.png)



 `Solidity` 是一门编译型语言，代码编写之后，需要对代码进行编译。





## 合约编译

切换到`编译`功能， 选择编译器版本，进行编译。

![image-20230311163240128](https://img.learnblockchain.cn/pics/20230311163242.png)


我们也可以勾选上自动编译，这样代码编辑时，会自动编译，合约编译成功后，会输出两个重要的内容： ABI （`合约接口描述`） 和 `Bytecode `字节码。


> ` ABI`  是  Application Binary Interface，即应用程序二进制接口，ABI 用来描述当前合约的所有接口，当我们与合约交互时，就需要使用 ABI。 `Bytecode ` 是部署合约所需的字节码（也称为创建时字节码），部署合约时，就是把该字节码作为交易的输入数据发送链上。



## 合约部署

接下来，就可以把合约部署到链上了，编译之后， 如果代码没有错误，就可以部署到区块链网络上，之前在 [区块链网络](../ethereum/2_evm_network.md) 介绍过不同的网络。 一个正式的产品推荐的部署流程是：

1. 在本地的开发者网络（模拟网络）进行部署，测试及验证代码逻辑的正确性
2. 在测试网络进行灰度发布
3. 一切 OK 后部署在主网



 Remix 提供多种部署环境：

![部署环境](https://img.learnblockchain.cn/pics/20251218170053.png)

**Remix VM**  是 Remix 提供的模拟网络环境：
**Browser extension** :  也可以通过钱包插件（如 Metamask ）连接到区块链网络进行部署
**DEV**： 可以连接到本地开发环境模拟的节点网络。


在这里，我们也先部署到模拟环境，然后部署到测试网络。

### 部署到 Remix 模拟环境 

环境（ENVIRONMENT）一栏选择 `Remix VM(Osaka)` ，Remix VM 表示Remix 在浏览器提供的一个模拟环境，Osaka 是以太坊主网的一个版本号，然后点击“Deploy” 部署：

![Remix - deploy](https://img.learnblockchain.cn/pics/20251218173011.png)


在部署功能操作区，还有一些设置：如选择使用账号、设置交易 [GasLimit](https://decert.me/tutorial/solidity/ethereum/evm_core#gas)、选择发送到合约金额、选择要部署的合约（默认选择当前编辑的合约文件）。

> Remix VM  会为我们提供 10 个账号，每个账号有 100 ETH 。


通常这些都有默认值，刚开始学时时我们使用默认值即可。



点击部署时，会发起一笔 [创建合约交易](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B0%83%E7%94%A8%E5%90%88%E7%BA%A6%E6%96%B9%E6%B3%95)， 交易完成后，会在链上生成一个[合约地址](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)， 同时在右下方`控制台/日志区`看到交易详情。

![image-20230311171242184](https://img.learnblockchain.cn/pics/20230311171244.png)



由于这个部署交易是在模拟环境下进行的，因此这个交易是即时完成的，同时使用的账号和消耗的 Gas 均是模拟的，下面我们部署到以太坊测试网 Sepolia 



### 部署到真实网络

部署到真实网络，不管是测试网还是主网，在 Remix 的环境里选择`Injected Provider - MetaMask`， 如下图：

![image-20251218173821995](https://img.learnblockchain.cn/pics/20251218173823.png)



Remix 会加载我们在 MetaMask 中选择的网络，如上图显示的是 Sepolia， 是因为当前 MetaMask 选择的是 Sepolia 网络，下图是 MetaMask 的钱包界面：

![image-20251218173545922](https://img.learnblockchain.cn/pics/20251218173926.png)


在部署到真实的网络时，需要一个有余额的账号， 因为我们需要为部署交易支付手续费。 如果是测试网络，则可以通过水龙头获取测试币。若是主网，就需要购买代币了。可参考[ Metamask 介绍](1_metamask.md)。 

再次点击“Deploy” 部署合约，这次把合约部署到 Sepolia 测试网络上， MetaMask 会弹出一个交易确认对话框，如下图：


![image-20251218174650981](https://img.learnblockchain.cn/pics/20251218174652.png)

让我们确认交易费用，点击“确认”时，同时会对这笔交易签名，并发送到 Sepolia 网络中。

待交易完成后，同样会在功能操作区域的下方列出合约地址及对应的函数。



## 调用合约函数



合约部署后，在功能区的下方会出现智能合约部署后的地址以及合约所有可以调用的函数，如下图：

![合约运行](https://img.learnblockchain.cn/pics/20230307112514.png)

Remix里用橙色按钮来这个动作会修改区块链的状态，蓝色按钮则表示调用仅仅是读取状态。点击上方的count和get两个按钮，就可以调用对应的合约函数。

点击count时，会发起一笔交易，交易打包后，计数器变量加1：

![image-20230311213140723](https://img.learnblockchain.cn/pics/20230311213142.png)



点击get可以获得当前计数器的值。用户可以自己验证一下。



## 小结


在这一节，我们介绍了如何使用`Remix`编译，部署到模拟网络及正式网络，调用智能合约。

Remix 对初学者非常友好，非常适合开发小合约及验证性代码。


如果是更大的的项目，使用 [Foundry](./5_foundry.md) 或 [Hardhat](./4_hardhat.md) 开发框架合适更合适的选择。

