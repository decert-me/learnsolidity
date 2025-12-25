# 开始学习 Solidity



[《Solidity 开发教程》](https://learnblockchain.cn/course/93) 是一个系统深入介绍 Solidity 开发的教程。

中文世界的很多 Solidity 资料，要么较旧，要么比较基础，本教程在 2023 在 Decert.me 上发布后，不断更新迭代，包含 50+ 篇系统教程、300+ 个代码示例，涵盖语言基础、进阶特性、实战应用和安全开发全链路。应该说是目前 **中文世界最值得推荐的 Solidity 学习教程**

## 关于 Solidity 

Solidity 是专为以太坊平台设计的编程语言，现在是所有 EVM 兼容链的智能合约开发语言，是区块链开发者必备的技能之一。

学习 Solidity 可以让你：
- 构建自己的 Web3 应用（DApp、DeFi、NFT、DAO 等）
- 深入理解区块链项目的运行原理
- 获得更多的职业发展机会

## 开始学习之前

在开始本课程之前，你应该具备一定的区块链基础知识。你可以在[区块链基础](https://learnblockchain.cn/course/92)课程中获取相关知识。

## 关于本教程

本教程分为 6 个部分，循序渐进地帮助大家掌握 Solidity 开发：

### 1. [认识以太坊](https://learnblockchain.cn/article/22542)
   - 了解以太坊的基础原理和智能合约的概念
   - 学习如何与以太坊进行交互，了解 EVM 及 Gas 机制
   - 掌握不同钱包账户的概念
   - 了解 MetaMask 的使用

### 2. Solidity 基础
从零开始学习 Solidity 语言核心特性，包括：
   - 使用 [Remix IDE](https://learnblockchain.cn/article/22528) 编写、部署和运行第一个合约
   - [Solidity 程序结构](https://learnblockchain.cn/article/22529)
   - 数据类型：[整数](https://learnblockchain.cn/article/22532)、[布尔](https://learnblockchain.cn/article/22562)、[地址](https://learnblockchain.cn/article/22543)、[字节和字符串](https://learnblockchain.cn/article/22563)、[数组](https://learnblockchain.cn/article/22565)、[映射](https://learnblockchain.cn/article/22552)、[结构体](https://learnblockchain.cn/article/22566)、[枚举](https://learnblockchain.cn/article/22564)
   - [函数](https://learnblockchain.cn/article/22553)：定义、可见性、[修饰器](https://learnblockchain.cn/article/22555)、[特殊函数（receive/fallback）](https://learnblockchain.cn/article/22554)
   - [合约基础](https://learnblockchain.cn/article/22561)：状态变量、[事件](https://learnblockchain.cn/article/22556)、[错误处理](https://learnblockchain.cn/article/22557)
   - 面向对象：[继承](https://learnblockchain.cn/article/22558)、[接口](https://learnblockchain.cn/article/22559)、[库](https://learnblockchain.cn/article/22560)
   - Solidity 0.8+ 新特性：[瞬态存储（transient）](https://learnblockchain.cn/article/22611)

### 3. Solidity 进阶
深入理解合约的底层机制和高级特性：
   - [事件和日志机制](https://learnblockchain.cn/article/22614)
   - [ABI 编码和解码](https://learnblockchain.cn/article/22615)
   - 合约间调用：[call](https://learnblockchain.cn/article/22616)、[delegatecall](https://learnblockchain.cn/article/22617)、[staticcall](https://learnblockchain.cn/article/22618)
   - [合约创建：create 和 create2](https://learnblockchain.cn/article/22619)
   - [存储布局和 Gas 优化](https://learnblockchain.cn/article/22620)
   - [代理合约模式](https://learnblockchain.cn/article/22621)：[透明代理](https://learnblockchain.cn/article/22622)、[UUPS 代理](https://learnblockchain.cn/article/22612)
   - [数字签名和验证](https://learnblockchain.cn/article/22613)

### 4. Solidity 实战
掌握常见的智能合约标准和设计模式：
   - **代币标准**：[ERC20（同质化代币）](https://learnblockchain.cn/article/22659)、[ERC721（NFT）](https://learnblockchain.cn/article/22660)、[ERC1155（多代币标准）](https://learnblockchain.cn/article/22661)
   - **签名标准**：[EIP-712 结构化数据签名](https://learnblockchain.cn/article/22662)
   - **设计模式**：[状态机模式](https://learnblockchain.cn/article/22657)、[支付模式](https://learnblockchain.cn/article/22658)
   - 了解如何使用 OpenZeppelin 库加速开发

### 5. [智能合约安全](https://learnblockchain.cn/article/22676)
安全是智能合约开发的重中之重，本部分涵盖：
   - [安全性概述](https://learnblockchain.cn/article/22670)：历史事件、安全挑战、最佳实践
   - 常见攻击模式：[重入攻击](https://learnblockchain.cn/article/22675)、[访问控制漏洞](https://learnblockchain.cn/article/22671)、[抢跑攻击](https://learnblockchain.cn/article/22674)、[DoS 攻击](https://learnblockchain.cn/article/22673)
   - [输入验证和数据校验](https://learnblockchain.cn/article/22672)
   - 安全开发工具：Slither、Foundry、Echidna
   - CTF 实战练习（Ethernaut、Damn Vulnerable DeFi）

### 6. 开发工具
介绍主流的 Solidity 开发工具链：
   - **[Hardhat](https://learnblockchain.cn/article/22640)**：灵活的以太坊开发环境，支持测试、部署、调试
   - **[Foundry](https://learnblockchain.cn/article/22641)**：用 Solidity 编写测试的现代化工具，高性能、强大的模糊测试能力

### 附录
补充内容和参考资料：
   - Solidity 版本更新说明（v0.8.26+）
   - EVM 网络配置
   - MetaMask 高级用法


## 学习路径建议

**初学者路径**：
1. 认识以太坊 → 2. Solidity 基础 → 3. Solidity 进阶 → 4. Solidity 实战

**安全开发路径**：
在完成基础学习后，深入学习第 5 部分"智能合约安全"，通过 CTF 挑战提升实战能力。

**全栈开发路径**：
学习完所有章节后，掌握第 6 部分的开发工具，建立完整的开发工作流。


## 如何使用本教程

1. **循序渐进**：按照章节顺序学习，每个章节都基于前面的知识
2. **实践为主**：在 Remix 中运行每个示例代码，修改参数观察结果
3. **完成挑战**：完成每章的练习题，巩固所学知识
4. **参与社区**：在遇到问题时，积极在社区寻求帮助
5. **安全第一**：在开发时始终将安全性放在首位

## 学习成果认证

完成学习后，你可以前往 [Solidity 101 挑战](https://decert.me/collection/9)，通过实战挑战检验学习成果，并获得技能认证 NFT。

---

祝你学习顺利！
