## MetaMask 钱包



MetaMask 钱包是EVM 开始者最常使用的钱包， MetaMask 有移动端版本和浏览器插件（也称为扩展程序）版本， 本文介绍的浏览器版本。



## MetaMask 插件下载

MetaMask 在 Chrome谷歌浏览器（同Microsoft Edge浏览器）、FireFox火狐浏览器 均提供了插件。

我们打开MetaMask钱包的官网首页 https://metamask.io/ 后，可以点接跳转到插件市场安装。



![image-20230311173636157](https://img.learnblockchain.cn/pics/20230311173640.png)



在下载时，请一定要仔细查看URL 链接， 确保是 `metamask.io`， 谨防钓鱼，调转到插件市场的界面如下：



![image-20230311173816568](https://img.learnblockchain.cn/pics/20230311173818.png)

然后，直接点击添加到 Chrome （ 由于我已经添加过，上图显示的从 Chrome 移除）， 这是最简单的安装方法。



在中国大陆会有部分用户无法打开插件市场， 如果你也无法打开，可以选择去 GitHub 下载 Zip 安装。



Metamask 的 GitHub 插件地址是： https://github.com/MetaMask/metamask-extension/releases/， 进入之后，可以看到如下下载包：

![image-20230311174151379](https://img.learnblockchain.cn/pics/20230311174152.png)

根据自己的浏览器，需要对应的zip包，下载解压。

然后进入到浏览器的扩展程序界面， 进入方法为：点击功能图标-> 选更多工具 -> 扩展程序， 如下图：

![截屏2023-03-11 17.43.44](https://img.learnblockchain.cn/pics/20230311174759.png)

进入扩展程序界面后，点“加载已解压的扩展程序”：

![image-20230311175126778](https://img.learnblockchain.cn/pics/20230311175128.png)

选择之前的解压包即可。

安装完成之后， 会在浏览器地址栏的右侧出现一个“小狐狸”的图标，点击这个图标就可以进入Metamask 界面。



## 创建钱包账号

单击浏览器中的MetaMask图标，如果是第一次使用， 我们需要创建钱包：



![5685d0c85dae6e4fc55e71aad4a5b110](https://img.learnblockchain.cn/pics/20230311175914.png)

然后一步步按找界面提示，输入密码，备份助记词，生成钱包后，点击右侧“小狐狸”图标， 界面如下：





![image-20230311180557273](https://img.learnblockchain.cn/pics/20230311180559.png)

此时你就创建好了一个钱包， 如上图 Account1 下方就是钱包的地址，这里为：`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` 。 

地址类似于银行卡账号，钱包之间转账就是使用该地址。



## 导入钱包账号



如果你之前在其他钱包创建过账号，或者要导入[Hardhat ](https://learnblockchain.cn/docs/hardhat/) 或 [Forge Anvil](https://learnblockchain.cn/docs/foundry/i18n/zh/reference/anvil/index.html) 模拟节点生成的钱包， 可以使用 MetaMask 的导入功能：



![image-20230311181215295](https://img.learnblockchain.cn/pics/20230311181217.png)

填入账号的私钥进行导入：



![image-20230311181318792](https://img.learnblockchain.cn/pics/20230311181320.png)



MetaMask 导入账号需要填入私钥，如果你之前的备份的是助记词，这需要使用助记词推导出私钥在填入，推荐使用 [Chaintool 工具的助记词推导](https://chaintool.tech/generateWallet)功能，如下图：

![image-20230311181831583](https://img.learnblockchain.cn/pics/20230311181832.png)



:::tip

ChainTool 是由一些爱好者组成的[开源组织](https://github.com/ChainToolDao)开发的一系列开源工具，ChainTool 所有工具均开源，提供开发者值得信赖的工具。

:::



另外一个建议是，开发不同的项目尽量使用不同的钱包，从而有更好的隐私效果。





## 给钱包账户充值

创建好账户后，在体验转账或交易之前， 我们需要先给账号充值，我们可以先去测试网的水龙头（Faucet）获取一些测试币。

这里使用 Goerli 测试网的水龙头：https://goerlifaucet.com/ ：

![image-20230311183639964](https://img.learnblockchain.cn/pics/20230311183643.png)



填入自己的地址， 点击"Send Me ETH" 即可，若水龙头网站不可用，[这里](https://github.com/ChainToolDao/chaintool-frontend/issues/3)收集了一些水龙头网站地址。



获取到测试币之后，然后把网络切换Goerli网络就可以体验转账了。





## 链接不同的 EVM 区块链

MetaMask 可以连接很多个不同的网络， 点击如下图切换到不同的网络：



![image-20230311184042325](https://img.learnblockchain.cn/pics/20230311184043.png)



以太坊测试网 Goerli ， Sepolia 是 MetaMask 默认支持的网络，现在 EVM 有众多的兼容链， 如果我们要添加其他的网络，可以上 [Chainlist](https://chainlist.org/zh)  一键添加。

![image-20230311184356187](https://img.learnblockchain.cn/pics/20230311184357.png)



### 添加本地网络

在开发的时候，经常要让 MetaMask 链接本地的网络，例如 Hardhat，在“网络选择”列表的最下方有一个“添加网络”， 手动输入 RPC URL 及链 ID， 这里以 Hardhat node 网络为例，输入信息如下：



![image-20230311185142989](https://img.learnblockchain.cn/pics/20230311185144.png) 



读完这篇文章，你应该知道如何使用 MetaMask 了。

