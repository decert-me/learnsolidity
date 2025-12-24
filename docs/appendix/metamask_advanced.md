# MetaMask 进阶使用

> 📖 **适用对象**：需要使用本地开发环境或连接多个区块链网络的开发者。如果你刚开始学习 Solidity，可以先跳过这部分内容。

## 添加其他 EVM 兼容链

访问 [Chainlist](https://chainlist.org/zh) 可以一键添加各种 EVM 兼容链（如 Polygon、BSC、Arbitrum 等）到 MetaMask。

![Chainlist](https://img.learnblockchain.cn/pics/20230311184357.png)

**使用步骤**：
1. 访问 https://chainlist.org/zh
2. 搜索你想添加的网络
3. 点击"Connect Wallet"连接 MetaMask
4. 点击"Add to MetaMask"，确认添加

## 连接本地开发网络

使用 [Hardhat](https://learnblockchain.cn/article/22640) 或 [Foundry](https://learnblockchain.cn/article/22641) 时，需要添加本地网络：

在 MetaMask 中手动添加网络，填入以下信息：

```
网络名称：Hardhat Local
RPC URL：http://127.0.0.1:8545
链 ID：31337
货币符号：ETH
```

![添加本地网络](https://img.learnblockchain.cn/pics/20230311185144.png)

**说明**：
- Hardhat 默认使用 `http://127.0.0.1:8545` 和链 ID `31337`
- Foundry 的 Anvil 使用相同的配置
- 启动本地节点后，才能连接成功

## 导入开发测试账号

本地开发环境（Hardhat/Foundry）会生成测试账号，你可以将其导入 MetaMask：

1. 复制测试账号的私钥（通常在终端输出中）
2. 在 MetaMask 中点击账户图标
3. 选择"导入账户"
4. 粘贴私钥

![导入账户](https://img.learnblockchain.cn/pics/20230311181318792.png)

### 从助记词推导私钥

如果你只有助记词，可以使用 [ChainTool](https://chaintool.tech/generateWallet) 推导出私钥：

![助记词推导](https://img.learnblockchain.cn/pics/20230311181831583.png)

> **提示**：ChainTool 是[开源工具](https://github.com/ChainToolDao)，所有操作在本地进行，不会上传数据。

## 安全最佳实践

⚠️ **严格遵守以下规则**：

1. **账户隔离**
   - 开发测试账号 ≠ 真实资金账号
   - 不同项目使用不同的测试账号
   - 永远不要将真实账户的私钥导入开发环境

2. **私钥管理**
   - 私钥一旦泄露，资产将无法找回
   - 不要将私钥提交到 Git 仓库
   - 不要在聊天工具中分享私钥
   - 使用环境变量或密钥管理工具

3. **测试网络使用**
   - 充分测试后再部署到主网
   - 测试网代币没有价值，可以随意使用
   - 主网部署前进行安全审计

4. **识别钓鱼**
   - 确认网站 URL（MetaMask 官网：`metamask.io`）
   - 不要点击可疑链接
   - 检查浏览器地址栏的锁图标

## 更多网络资源

需要连接其他 EVM 兼容链？查看 [EVM 兼容链列表](./evm_network.md) 了解详细信息。
