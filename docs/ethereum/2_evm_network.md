# EVM 兼容链及网络

繁荣的以太坊生态，尤其是在 DEFI 爆发之后，各大公链意识到与其开发自己特色的虚拟机，不如主动兼容以太坊虚拟机，从而可快速的承接以太坊应用。

## 兼容链

目前比较流行的 EVM 兼容链有：Polygon 链、BNB 链（BSC）、OK链、Avalanche C 链、Fantom 等。他们和以太坊链一样，使用相同的地址格式，使用相同的 EVM 代码，支持以太坊开发工具及钱包，但是这些 EVM 链各自定义了自己的共识机制，并且使用自己的原生币支付 Gas 手续费，因此手续费更低。



> 另外Layer2解决方案 Rollup，如 Arbitrum 和 Optimism 同样兼容 EVM（称之为EVM 等效性），他们与一层的链有一点点区别，在 Layer2 没有自己的区块号及区块时间。



还有一些原本非 EVM 的链，也建立 EVM 兼容性的项目，例如：

- NEAR Protocol 上的 Aurora
- 波卡上的 Moonbeam
- Cosmos 上的 Evmos
- Solana 上的 Neon

这些 EVM 生态链的存在又进一步繁荣了以太坊的生态。

每一个链有自己的chainId 和 相应的节点 RPC， 我们可以在 MetaMask 等钱包通过添加自定义网络 RPC（`Custom RPC`） 来添加他们，如下图：



![image25](https://img.learnblockchain.cn/pics/20230302190804.png)





在 https://chainlist.org/ 网络上，罗列了大部分的 EVM 兼容链，可以在上面找到 chainID ，及节点RPC地址，还可以方便的一键添加到 MetaMask 等钱包中。




## 区块链网络

每一个链通常又有自己的主网（Mainnet）、测试网（Testnet），每个网络有各自的区块链浏览器。

**主网网络（Mainnet）**

主网网络是真正的价值网络，我们需要使用真实的以太币、BNB 等原生币进行交易。


**测试网络（Testnet）**

在主网，任何合约的执行都会消耗真实的以太币，不适合开发、调试和测试。因此各个链会专门提供了测试网络，并会提供水龙头让开发者可以领取免费测试币。

例如以太坊提供了`Goerli` 和 `Sepolia` 测试网 ， `Polygon` 提供了 `Mumbai` 测试网

测试网络上通常会保持和和主网相同的共识设定，以便开发者有一个相同的模拟环境进行测试。



## 开发者网络或节点

很多开发框架提供工具（如Ganache、Hardhat 等），让开发者可以快速启动一个开发网络，从而方便开发者在本地进行开发、调试、测试。

这样的开发网络，通常开箱即用，它会帮助我们创建多个 存有很多以太币的测试账户。

如下图是 [Ganache](https://www.trufflesuite.com/ganache) 创建的一个开发模拟网络：

![img](https://img.learnblockchain.cn/pics/20230306203739.png)


如下是 Hardhat 提供的开发节点：

```
/home/decert > npx hardhat node
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...

```

通常，本地模拟的区块链，所有的数据都放在内存中，因此当节点重启时，所有的区块数据会消失。进行合约开发及测试时，需要注意。




