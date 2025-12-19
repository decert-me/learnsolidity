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
Remix 是在[以太坊](https://learnblockchain.cn/tags/以太坊?map=EVM)上构建的最简单的开发工具，并且拥有大量插件来扩展其体验。

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

当处于文件编辑功能时，功能操作区域显示的是文件浏览器，我们选中 `counter.sol` 文件，在右侧`文件编辑`区域输入在上一节[认识以太坊](https://learnblockchain.cn/article/22542) 的 `Counter` 合约代码

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

接下来，就可以把合约部署到链上了。一个正式的产品推荐的部署流程是：

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


在部署功能操作区，还有一些设置：如选择使用账号、设置交易 [GasLimit](https://learnblockchain.cn/article/22542#Gas%20-%3E%20%E7%87%83%E6%96%99)、选择发送到合约金额、选择要部署的合约（默认选择当前编辑的合约文件）。

> Remix VM  会为我们提供 10 个账号，每个账号有 100 ETH 。


通常这些都有默认值，刚开始学时时我们使用默认值即可。



点击部署时，会发起一笔 [创建合约交易](https://learnblockchain.cn/article/22542#2.%20%E9%83%A8%E7%BD%B2%E5%90%88%E7%BA%A6)， 交易完成后，会在链上生成一个[合约地址](https://learnblockchain.cn/article/22542#2.%20%E5%90%88%E7%BA%A6%E8%B4%A6%E6%88%B7%EF%BC%88Contract%20Account%EF%BC%89)， 同时在右下方`控制台/日志区`看到交易详情。

![image-20230311171242184](https://img.learnblockchain.cn/pics/20230311171244.png)



由于这个部署交易是在模拟环境下进行的，因此这个交易是即时完成的，同时使用的账号和消耗的 Gas 均是模拟的，下面我们部署到以太坊测试网 Sepolia 



### 部署到真实网络（Sepolia 测试网）

> 如果我们暂时只想学习 Solidity 语法，可以跳过这一节，继续使用 Remix VM 进行学习。等熟悉合约开发后，再回来尝试部署到真实网络。

要将合约部署到真实的区块链网络，你需要一个钱包来管理账户和支付 Gas 费用。

**MetaMask 安装与设置**

1. **安装钱包**：访问 [metamask.io](https://metamask.io/) 下载浏览器插件
2. **创建账户**：按提示设置密码并**备份助记词**（⚠️ 助记词务必妥善保管）
3. **获取测试币**：访问 [Sepolia 水龙头](https://sepoliafaucet.com/)，粘贴你的钱包地址，领取免费测试币

完成上述设置后，就可以开始部署了。

**步骤 1：连接 MetaMask**

在 Remix 的环境选项中，选择 `Injected Provider - MetaMask`：

![连接 MetaMask](https://img.learnblockchain.cn/pics/20251218173823.png)

Remix 会自动加载 MetaMask 当前选择的网络。上图显示的是 Sepolia，因为 MetaMask 当前连接的是 Sepolia 测试网。

下图是 MetaMask 的[钱包](https://learnblockchain.cn/tags/%E9%92%B1%E5%8C%85)界面：

![image-20251218173545922](https://img.learnblockchain.cn/pics/20251218173926.png)

**步骤 2：部署合约**

点击"Deploy"按钮，MetaMask 会弹出交易确认对话框：

![确认交易](https://img.learnblockchain.cn/pics/20251218174652.png)

这个对话框显示：
- **[Gas](https://learnblockchain.cn/tags/Gas?map=EVM) 费用**：部署合约需要支付的手续费
- **合约地址**：部署成功后合约的地址
- **交易详情**：可以查看更多交易信息

点击"确认"后，MetaMask 会对这笔交易进行签名并发送到 Sepolia 网络。

**步骤 3：等待交易确认**

与模拟环境不同，真实网络上的交易需要矿工打包确认：
- Sepolia 测试网通常需要 12 秒+
- 交易确认后，Remix 会在控制台显示交易详情
- 部署的合约地址会显示在功能操作区域的下方

![部署成功](https://img.learnblockchain.cn/pics/20230311171244.png)

✅ 恭喜！你已经成功将合约部署到真实的区块链网络上了！



## 调用合约函数



合约部署后，在功能区的下方会出现智能合约部署后的地址以及合约所有可以调用的函数，如下图：

![合约运行](https://img.learnblockchain.cn/pics/20230307112514.png)

Remix里用橙色按钮来这个动作会修改区块链的状态，蓝色按钮则表示调用仅仅是读取状态。点击上方的count和get两个按钮，就可以调用对应的合约函数。

点击count时，会发起一笔交易，交易打包后，计数器变量加1：

![image-20230311213140723](https://img.learnblockchain.cn/pics/20230311213142.png)



点击get可以获得当前计数器的值。用户可以自己验证一下。

## 小结

在这一节中，我们学习了智能合约开发的完整流程：

✅ **Remix IDE**：浏览器中的开发环境，无需安装任何软件
✅ **合约开发流程**：编写 → 编译 → 部署 → 调用
✅ **两种部署方式**：
   - **Remix VM**（推荐入门）：模拟环境，即时反馈，适合学习语法
   - **真实网络**（可选）：需要 MetaMask [钱包](https://learnblockchain.cn/tags/%E9%92%B1%E5%8C%85)，体验真实区块链

**推荐的学习路径**：
1. 📚 **现阶段**：使用 Remix VM 学习 [Solidity](https://learnblockchain.cn/course/93) 语法和合约开发
2. 🎯 **掌握基础后**：尝试部署到 Sepolia 测试网，体验真实区块链
3. 🚀 **项目开发**：使用 [Foundry](./5_foundry.md) 或 [Hardhat](./4_hardhat.md) 框架

**扩展阅读**：
- 需要连接多个网络或本地开发环境？查看 [MetaMask 进阶使用](../appendix/metamask_advanced.md)

现在你已经掌握了开发环境的使用，可以开始学习 [Solidity](https://learnblockchain.cn/course/93) 语法了！下一节我们将深入了解合约的代码结构。

