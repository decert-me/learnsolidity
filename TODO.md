# Solidity 教程 TODO 清单

本文档记录了 Solidity 教程项目需要补充和完善的内容。

## 📊 项目现状

- **已完成教程**: 19 个（11 个高级 + 6 个实战 + 2 个工具）
- **主要模块**: Solidity 高级技术、代理模式、签名、Gas优化、基础实战
- **主要缺口**: 安全实践、DeFi 实战、NFT 进阶、DAO 治理、测试专题

---

## 🔴 高优先级任务（P0）

### 2. 智能合约安全基础（待完成）


#### ⬜ 2.3 整数溢出与安全数学
**文件**: `docs/solidity-adv/14_overflow.md`

**内容要点**:
- 整数溢出/下溢的概念
- Solidity 0.8.0 之前的问题
- Solidity 0.8.0+ 的自动检查
- `unchecked` 块的使用场景
- SafeMath 库（历史遗留）
- 实际案例分析

---

#### ⬜ 2.4 常见安全漏洞汇总
**文件**: `docs/solidity-adv/15_security_best_practices.md`

**内容要点**:
- 前置运行攻击 (Front-running)
- 时间戳依赖漏洞
- 随机数安全问题
- 短地址攻击
- 未初始化的存储指针
- 委托调用安全
- 自毁合约风险
- 安全审计检查清单
- 推荐的安全工具（Slither, Mythril）

---

## 🟡 中优先级任务（P1）

### 3. DeFi 实战案例（待完成）

#### ⬜ 3.1 DEX 核心机制
**文件**: `docs/solidity-practice/5_dex_amm.md`

**内容要点**:
- 自动做市商 (AMM) 原理
- 恒定乘积公式 x * y = k
- Uniswap V2 核心逻辑
- 流动性池 (Liquidity Pool)
- 添加/移除流动性
- Swap 交易实现
- 价格计算和滑点
- LP Token 机制
- 手续费分配

**示例代码**:
```solidity
// 简化版 Uniswap V2 Pair
// Swap 函数实现
```

---

#### ✅ 3.2 质押合约
**文件**: `docs/solidity-practice/6_staking.md`

**内容要点**:
- 质押的基本概念
- 质押奖励计算机制
- 时间加权收益
- 质押/解除质押流程
- 奖励分配算法
- 紧急提款
- 实战：编写一个 ERC20 质押池

**示例代码**:
```solidity
// 基础质押合约
// 奖励计算公式
```

---

#### ✅ 3.3 借贷协议基础
**文件**: `docs/solidity-practice/7_lending.md`

**内容要点**:
- 抵押借贷原理
- 健康因子 (Health Factor)
- 利率模型（固定/浮动）
- 清算机制
- 超额抵押的必要性
- Compound/Aave 简化实现
- Oracle 价格预言机集成

---

#### ✅ 3.4 闪电贷
**文件**: `docs/solidity-practice/8_flashloan.md`

**内容要点**:
- 闪电贷的原理
- 无抵押借贷为何可行
- 原子性交易保证
- 闪电贷攻击案例分析
- 使用场景：套利、清算、抵押品互换
- Aave 闪电贷实现
- 编写闪电贷接收合约

---

### 4. NFT 进阶实战

#### ✅ 4.1 NFT 市场合约
**文件**: `docs/solidity-practice/9_nft_marketplace.md`

**内容要点**:
- 市场合约架构设计
- 挂单 (Listing) 功能
- 出价 (Offer) 系统
- 拍卖机制（英式/荷兰式）
- 成交和资金托管
- 版税分配机制
- 手续费收取
- OpenSea Seaport 协议简介

**示例代码**:
```solidity
// NFT 市场核心合约
// 版税计算和分配
```

---

#### ✅ 4.2 动态 NFT
**文件**: `docs/solidity-practice/10_dynamic_nft.md`

**内容要点**:
- 什么是动态 NFT
- 元数据更新机制
- 链上 vs 链下元数据
- Base64 编码的链上 SVG
- Chainlink Automation 触发更新
- 游戏道具 NFT 案例
- 实战：创建一个可进化的 NFT

---

#### ✅ 4.3 NFT 高级标准
**文件**: `docs/solidity-practice/11_nft_advanced_standards.md`

**内容要点**:
- ERC721A：Gas 优化的批量铸造
- ERC2981：NFT 版税标准
- ERC4907：可租赁 NFT
- ERC6551：Token Bound Accounts (NFT 绑定账户)
- Soul Bound Token (SBT)：不可转让代币
- 各标准的应用场景

---

### 5. DAO 治理

#### ✅ 5.1 DAO 治理基础
**文件**: `docs/solidity-practice/12_dao_governance.md`

**内容要点**:
- DAO 的基本概念
- 治理代币
- 提案创建和投票
- 时间锁 (Timelock)
- 委托投票
- 投票权重计算
- 快照机制
- Governor Bravo 模式
- OpenZeppelin Governor 合约

**示例代码**:
```solidity
// 简单的 DAO 投票合约
// Timelock 实现
```
\# Solidity 实战章节说明

本目录包含 Solidity 实战开发的各类教程和最佳实践。

## 📚 已完成章节

### 代币标准系列
- [1. ERC20 代币标准](./1_erc20.md) - 同质化代币标准和实现
- [2. ERC721 NFT 标准](./2_erc721.md) - 非同质化代币（NFT）标准
- [3. ERC1155 多代币标准](./3_erc1155.md) - 支持 FT 和 NFT 的统一标准

### 签名与安全系列
- [4. EIP712 结构化数据签名](./4_eip712.md) - 结构化数据的签名标准

### 设计模式系列
- [10. 状态机模式](./10_state_machine.md) - 智能合约状态管理模式
- [14. 支付模式](./14_payment_patterns.md) - 安全的支付和资金管理模式

## 🚧 规划中的章节

以下章节正在规划或开发中：

### 代币标准扩展（5-9）
- 5. ERC20 高级特性 - Permit、快照、投票权等
- 6. ERC721 进阶 - 批量铸造、白名单、预售等
- 7. 代币经济学 - 通缩、通胀、销毁机制
- 8. 跨链代币 - 桥接和跨链资产管理
- 9. 代币安全 - 常见漏洞和防护措施

### 高级模式（11-13）
- 11. 访问控制模式 - RBAC、多签等
- 12. 升级模式 - 代理合约、可升级合约
- 13. 存储模式 - 高效的数据存储方案

### 更多实战主题（15+）
- 15. DEX 实现 - AMM、订单簿等
- 16. NFT 市场 - 拍卖、交易市场实现
- 17. DAO 治理 - 提案、投票系统
- 18. DeFi 借贷 - 抵押、清算机制

## 📖 学习路径建议

### 初级开发者
1. 从代币标准系列开始（1-3）
2. 学习基础的签名机制（4）
3. 掌握基本的设计模式（10, 14）

### 中级开发者
- 深入学习各类代币的高级特性（5-9）
- 掌握访问控制和升级模式（11-12）
- 学习复杂的 DApp 实现（15-18）

### 高级开发者
- 研究所有安全相关主题
- 实践大型 DApp 项目
- 贡献开源和审计合约

## 🤝 贡献指南

欢迎贡献新的章节或改进现有内容！请确保：
- 代码使用最新的 Solidity 版本（^0.8.0）
- 遵循安全最佳实践
- 包含完整的代码示例和注释
- 提供清晰的中文说明

## 📝 文档质量

所有章节均经过：
- ✅ 代码安全性审查
- ✅ 最佳实践验证
- ✅ OpenZeppelin 标准适配
- ✅ 详细的中文注释

---

**注意**：章节编号不连续是为了预留扩展空间，方便后续补充相关主题的内容。


---

## 🟢 低优先级任务（P2）

### 7. 进阶技术专题

#### ⬜ 7.1 内联汇编 (Yul)
**文件**: `docs/solidity-adv/13_assembly_yul.md`

**内容要点**:
- 什么是 Yul
- 为什么需要汇编
- 基本语法
- 常用操作码
- Gas 优化案例
- 安全注意事项
- 实战示例

---

#### ⬜ 7.2 自定义错误
**文件**: `docs/solidity-adv/14_custom_errors.md`

**内容要点**:
- Solidity 0.8.4+ 自定义错误
- 与 require 字符串的 Gas 对比
- 错误参数传递
- 错误处理最佳实践
- 迁移指南

---

#### ⬜ 7.3 多签钱包实现
**文件**: `docs/solidity-practice/13_multisig_wallet.md`

**内容要点**:
- 多签钱包原理
- 签名收集和验证
- 交易提交和执行
- 所有者管理
- Gnosis Safe 简介
- 实战：实现一个 2/3 多签钱包

---

#### ⬜ 7.4 Merkle Tree 应用
**文件**: `docs/solidity-adv/15_merkle_tree.md`

**内容要点**:
- Merkle Tree 原理
- 白名单验证
- 空投 (Airdrop) 合约
- Gas 优化
- OpenZeppelin MerkleProof

---

#### ⬜ 7.5 元交易 (Meta Transaction)
**文件**: `docs/solidity-adv/16_meta_transaction.md`

**内容要点**:
- 无 Gas 交易原理
- EIP-2771 标准
- Relayer 中继器
- ERC20 Permit (EIP-2612)
- Gasless 方案对比

---

### 8. 更多 ERC 标准

#### ⬜ 8.1 ERC4626 代币化金库
**文件**: `docs/solidity-practice/14_erc4626.md`

**内容要点**:
- 金库标准介绍
- Shares 和 Assets 概念
- 存款/取款实现
- 收益分配
- Yearn Vault 案例

---

#### ⬜ 8.2 ERC777 高级代币
**文件**: `docs/solidity-practice/15_erc777.md`

**内容要点**:
- ERC777 vs ERC20
- Hooks 机制
- 操作员 (Operator)
- 兼容性问题

---

#### ⬜ 8.3 ERC3525 半同质化代币
**文件**: `docs/solidity-practice/16_erc3525.md`

**内容要点**:
- 半同质化代币概念
- Slot 和 Value
- 金融票据应用
- 碳信用代币化

---

### 9. 前端集成

#### ⬜ 9.1 Web3.js / Ethers.js 使用
**文件**: `docs/tools/7_web3_ethers.md`

**内容要点**:
- Provider 连接
- 钱包集成
- 合约实例化
- 读取合约数据
- 发送交易
- 事件监听
- 错误处理

---

#### ⬜ 9.2 React DApp 开发
**文件**: `docs/tools/8_react_dapp.md`

**内容要点**:
- React + Wagmi 集成
- RainbowKit 钱包连接
- useContract Hook
- 交易状态管理
- 多链支持
- 完整 DApp 示例

---

### 10. 附录扩展

#### ⬜ 10.1 Solidity 版本变更历史
**文件**: `docs/appendix/2_version_history.md`

**内容要点**:
- 重要版本里程碑
- 0.8.0：默认溢出检查
- 0.8.4：自定义错误
- 0.8.13：ABI Encoder V2 默认
- 破坏性变更汇总

---

#### ⬜ 10.2 Gas 优化技巧大全
**文件**: `docs/appendix/3_gas_optimization.md`

**内容要点**:
- 存储优化（打包变量）
- 内存 vs 存储
- 短路运算符
- 批量操作
- 事件 vs 存储
- 优化案例分析

---

#### ⬜ 10.3 开发资源清单
**文件**: `docs/appendix/4_resources.md`

**内容要点**:
- 官方文档链接
- 常用开发工具
- 安全审计工具
- 测试网水龙头
- 区块浏览器
- 学习资源推荐
- 社区和论坛

---

#### ⬜ 10.4 安全审计检查清单
**文件**: `docs/appendix/5_security_checklist.md`

**内容要点**:
- 代码审计要点
- 常见漏洞检查
- 测试覆盖要求
- 部署前检查
- 紧急暂停机制

---

#### ⬜ 10.5 Solidity 风格指南
**文件**: `docs/appendix/6_style_guide.md`

**内容要点**:
- 命名规范
- 代码布局
- 注释规范 (NatSpec)
- 文件组织
- 最佳实践

---

#### ⬜ 10.6 OpenZeppelin 合约库指南
**文件**: `docs/appendix/7_openzeppelin.md`

**内容要点**:
- OpenZeppelin 简介
- 常用合约模块
- 安全合约（Ownable、ReentrancyGuard）
- 代币标准实现
- 实用工具（Address、SafeMath）
- 版本选择和升级

---

## 📈 项目改进建议

### 内容质量提升
- [ ] 为每个高级主题添加"常见错误"章节
- [ ] 增加更多真实项目案例分析
- [ ] 添加视频教程链接（如果有）
- [ ] 增加互动练习题

### 结构优化
- [ ] 为每个主要模块添加学习路径图
- [ ] 创建关键概念索引
- [ ] 添加难度标记（初级/中级/高级）
- [ ] 建立知识点依赖关系图

### 实践增强
- [ ] 为每个章节添加 Remix 在线演示链接
- [ ] 提供完整的项目模板仓库
- [ ] 添加代码审查和优化建议
- [ ] 建立常见问题 FAQ

### 工具和配置
- [ ] 添加 VS Code Solidity 插件配置指南
- [ ] 提供 Hardhat/Foundry 项目模板
- [ ] 集成 GitHub Actions CI/CD 示例
- [ ] 添加本地开发环境搭建指南

---

## 📝 贡献指南

如果你想参与教程的编写，请：

1. 选择一个 TODO 任务
2. 在 GitHub 创建对应的 Issue
3. Fork 项目并创建功能分支
4. 编写教程内容，遵循现有格式
5. 提交 Pull Request

**教程编写规范**:
- 使用中文编写
- 代码示例要完整可运行
- 添加适当的图示和表格
- 包含实际应用场景
- 提供扩展阅读链接

---

## 🗓️ 里程碑规划

### 阶段 1：基础完善（1-2个月）
- 完成所有 P0 高优先级任务
- 补全基础章节
- 添加安全实践内容

### 阶段 2：实战扩展（2-3个月）
- 完成 P1 中优先级 DeFi 实战
- 完成 NFT 进阶内容
- 添加完整的测试指南

### 阶段 3：进阶深化（3-4个月）
- 完成 P2 低优先级进阶主题
- 添加更多 ERC 标准
- 完善附录和工具文档

### 阶段 4：持续改进
- 根据社区反馈更新
- 跟进 Solidity 最新版本
- 添加最新的 DeFi 协议案例

---

**最后更新**: 2025-12-17
**维护者**: [@Tiny熊](https://twitter.com/tinyxiong_eth)
**贡献者**: 欢迎所有开发者参与贡献！
