# 初探智能合约开发

Solidity 是一门专为以太坊虚拟机（EVM） 设计的静态类型、编译型高级语言。

我们从生命周期的角度来探索智能合约的编译、部署、运行，看看一个智能合约是如何从无到有创建的。

## Remix IDE

工欲善其事，必先利其器。开发智能合约，开发智能合约也得有一个工具，Remix是对初学者来说，开发智能合约的最佳开发集成环境（IDE），它无需安装，可以直接快速上手。

可以通过网站： https://remix.ethereum.org/ 进入Remix， 如下图：

![image-20230307092528768](https://img.learnblockchain.cn/pics/20230307092530.png)



通过上图的`New File` 可以创建一个合约文件，我们命名为`counter.sol`， 介绍就可以编写合约代码了。



## 合约编写

使用在上一节[认识以太坊](../ethereum/1_evm_core.md) 的 `Counter` 合约代码：


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

在 Remix IDE， 输入上面这段代码， 如图所示：

![image-20230307093629391](https://img.learnblockchain.cn/pics/20230307093630.png)



简单解读这个合约，这个智能合约的作用是在区块链上存储一个计数器变量 `counter`， `counter` 值将会被永久保存在区块链上。

`count()`函数让计数器加1，`get()`函数用来获取计数器值，



智能合约不要要编写入口方法（如main方法），每一个函数都可以被单独调用。

> 其实编译器会帮助合约生成main入口函数，EVM 在入口函数里用函数选择器去匹配调用的函数。





## 合约编译

上面提到 `Solidity` 是一门编译型语言，代码编写之后，需要对代码进行编译，在Remix左侧工具栏，选择由上至下的第3个图标，点击编译合约，如图所示:



![image-20230307094618895](https://img.learnblockchain.cn/pics/20230307094620.png)



也可以勾选自动编译，这样它就会在代码更新后，自动进行编译，如果合约代码编译出错，那么在编译信息栏会显示错误详情。

成功编译后，会输出两个重要的内容：**ABI** 和 **Bytecode（字节码）** 。

ABI 是  Application Binary Interface，即应用程序二进制接口，ABI 用来描述当前合约的所有接口，当我们与合约交互时，就需要使用 ABI。

字节码也称为创建时字节码，在部署合约时，我们需要把这段字节码发送到链上。



## 合约部署



编译之后， 如果代码没有错误，就可以部署到区块链网络上，我们在 [区块链网络](../ethereum/2_evm_network.md) 介绍过不同的网络。 一个正式的产品推荐的部署流程是：

1. 在本地的开发者网络（模拟网络）进行部署，测试及验证代码逻辑的正确性
2. 在测试网络进行灰度发布
3. 一切 OK 后部署在主网



### 部署到开发者网络

Remix 提供了一个 EVM 开发环境给我们测试合约，功能区切换到第三个标签页，在环境（Environment）一栏选择 Remix VM，点击 “Deploy” 进行部署，如图所示:



![image-20230307110340426](https://img.learnblockchain.cn/pics/20230307110341.png)



此时会提交一个创建合约的交易，此交易是向零地址发送编译时生成的字节码。交易被挖出后，会打包在一个区块中，交易详情会在控制台显示：

![image-20230307110832895](https://img.learnblockchain.cn/pics/20230307110834.png)





### 部署到真实网络

若需要部署到真实网络，不管是测试网还是主网，可以使用 Remix 链接到 MetaMask 钱包， 通过 MetaMask 来链接不同的网络：



![image25](https://img.learnblockchain.cn/pics/20230302190804.png)



然后在 Remix 的环境里选择`Injected Provider - MetaMask`， 如下图：

![Injected Provider](https://img.learnblockchain.cn/pics/20230307115511.png)





在部署到真实的网络时，需要一个有余额的账号，否则就没办法发起交易。 如果是测试网络我们可以通过水龙头获取测试币。若是主网，就需要购买代币了。



## 合约运行



合约部署后，在功能区的下方会出现智能合约部署后的地址以及合约所有可以调用的函数，如下图：



![合约运行](https://img.learnblockchain.cn/pics/20230307112514.png)



Remix里用橙色按钮来这个动作会修改区块链的状态，蓝色按钮则表示调用仅仅是读取状态。点击上方的count和get两个按钮，就可以调用对应的合约函数。



每次点击count时，计数器变量加1，点击get可以获得当前计数器的值。用户可以自己验证一下。

