## Remix

Remix 是用于以太坊开发的开源、Web 集成开发环境 (IDE)。是初学者首选的开发环境。
Remix 是在以太坊上构建的最简单的开发工具，并且拥有大量插件来扩展其体验。

Remix 可帮助我们直接在浏览器中编写 Solidity 代码，并提供用于测试、调试和将智能合约部署到区块链的工具，除此之外，Remix 还提供：



1. 代码提示补全，代码高亮

1. 代码警告、错误提示

1. 运行日志输出

1. 代码调试

   

Remix开箱即用，你可以打开 Remix 网站：https://remix.ethereum.org/ ， 进入到 Remix IDE：

![image-20230311155750476](https://img.learnblockchain.cn/pics/20230311155751.png)



`Remix` 包含 4 个区域，上图用 4 个框分别标记了

1. 最左侧`功能切换`：不同图标对应不同的功能，选中不同的功能，`功能操作`  也会跟随变化
2. `功能操作`：各种功能展示与使用
3. `文件编辑`：代码编辑的地方
4. `控制台/日志区`：显示与合约交互的结果，也可以输入命令。



下面按合约流程：新建合约、合约代码编写、编译、部署，调用合约一一介绍。



## 新建合约

新建合约文件可以按如下界面所示操作：

![image-20230311160725855](https://img.learnblockchain.cn/pics/20230311160727.png)

既可以新建文件、也可以从本机或 GitHub 加载文件，这里我们新建一个 `counter.sol`  合约。





## 合约代码编写

当处于文件编辑功能时，功能操作区域显示的是文件浏览器，我们选中 `counter.sol` 文件，在右侧`文件编辑`区域输入一下代码：



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

这是一个简单的计数器合约，每当我们调用count()函数时，计数器增加1， 输入完代码后，你应该看到如下图：

![image-20230311161731866](https://img.learnblockchain.cn/pics/20230311161733.png)



介绍我们来编译一下这个合约。



## 合约编译

切换到`编译`功能， 选择编译器版本，进行编译。

![image-20230311163240128](https://img.learnblockchain.cn/pics/20230311163242.png)



我们也可以勾选上自动编译，这样代码编辑时，会自动编译，合约编译成功后，会输出两个重要的内容： ABI （`合约接口描述`） 和 `Bytecode `字节码。



:::tip

知识点补充：

` ABI`  描述了合约的所有接口，但我们与合约交互时，就是通过 ABI 来知晓合约有哪些方法。

`Bytecode ` 是部署合约所需的字节码，部署合约时，就是把该字节码作为交易的输入数据发送链上。
:::



## 合约部署

接下来，就可以把合约部署到链上了， Remix 提供模拟链上环境， 也可以通过 Metamask 链接到真实的区块链网络进行部署。

推荐做法是先部署到 `Remix VM` 模拟环境进行测试，然后部署到真实的区块链网络，选择不同的区块链环境方法下：

![image-20230311164659166](https://img.learnblockchain.cn/pics/20230311164703.png)



### 部署到 VM

这里我们选择 `Remix VM(Merge)` ，这个是当前以太坊主网（以太坊合并之后）运行的虚拟机功能一样，然后点击“Deploy” 部署：

![image-20230311165330108](https://img.learnblockchain.cn/pics/20230311165331.png)



在部署功能操作区，还有一些设置：如选择使用账号、设置交易 [GasLimit](https://decert.me/tutorial/solidity/ethereum/evm_core#gas)、选择发送到合约金额、选择要部署的合约（默认选择当前编辑的合约文件）。

通常这些都有默认值，初学者使用默认值即可。



点击部署时，会发起一笔 [创建合约交易](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B0%83%E7%94%A8%E5%90%88%E7%BA%A6%E6%96%B9%E6%B3%95)， 交易完成后，会在链上生成一个[合约地址](https://decert.me/tutorial/solidity/ethereum/evm_core#%E8%B4%A6%E6%88%B7)， 同时在右下方`控制台/日志区`看到交易详情。

![image-20230311171242184](https://img.learnblockchain.cn/pics/20230311171244.png)



由于这个部署交易是在模拟环境下进行的，因此这个交易是即时完成的，同时使用的账号和消耗的 Gas 均是模拟的，下面我们部署到以太坊测试 Goerli 



### 



## 调用合约函数



## 





