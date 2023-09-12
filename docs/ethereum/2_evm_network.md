# EVM 兼容链及网络

在以太坊生态系统中，出现了一系列与以太坊虚拟机（EVM）兼容的区块链，以及不同的网络，这些都对区块链开发和应用产生了重要影响。为了更好地理解这些概念，让我们对它们进行详细解释。

## 兼容链

EVM兼容链是那些设计和实现与以太坊虚拟机（EVM）兼容的区块链。这意味着它们可以运行与以太坊相同的智能合约，使用相同的编程语言和工具。这一兼容性使得开发者可以轻松将他们的以太坊应用迁移到这些链上，而无需进行大规模修改。目前，有许多流行的EVM兼容链，其中包括Polygon链、BNB链（BSC）、OK链、Avalanche C链、Fantom等。

每个EVM兼容链都有自己的共识机制和原生代币，这些代币用于支付交易手续费（Gas）。由于竞争和不同的设计选择，这些链通常具有较低的交易费用，这对于用户和开发者来说是一个吸引人的特点。

此外，还存在一种称为Layer2解决方案的技术，如Arbitrum和Optimism，它们也兼容EVM，但在第二层网络上运行，与主要区块链有所不同。这些解决方案通常用于扩展区块链的性能和吞吐量。

一些最初并不支持EVM的区块链项目也开始了EVM兼容性的开发，如：

- NEAR Protocol上的Aurora
- 波卡上的Moonbeam
- Cosmos上的Evmos
- Solana上的Neon

这些EVM生态链的存在进一步丰富了以太坊的生态系统。

每个链都有自己的chainId和相应的节点RPC，您可以在MetaMask等钱包中通过添加自定义网络RPC来添加它们，如下图所示：

<img src="https://raw.githubusercontent.com/anglee2002/Picbed/main/CleanShot%202023-09-12%20at%2010.03.11%402x.png" alt="CleanShot 2023-09-12 at 10.03.11@2x" style="zoom:50%;" />

[Chainlist](https://chainlist.org/)列出了大多数EVM兼容链，您可以在那里找到chainID和节点RPC地址，并可以轻松地将它们添加到MetaMask等钱包中。

## 区块链网络

在每个区块链上，通常都存在多个网络，其中最重要的是主网（Mainnet）和测试网（Testnet）。

**主网网络（Mainnet）**

主网网络是真正的生产环境，其中的交易使用真实的代币进行结算。这是真正的价值交换发生的地方，因此需要小心谨慎。

**测试网络（Testnet）**

在主网上进行开发和测试可能会非常昂贵，因为每个操作都需要使用真实代币支付Gas费用。为了解决这个问题，每个区块链都提供了测试网络，这些网络上的代币没有实际价值，而且通常可以通过水龙头免费获得。开发者可以在测试网络上构建和测试智能合约，以确保它们在主网上能够正确运行。

## 开发者网络或节点

为了在本地进行区块链开发和测试，开发者通常会使用开发者网络或本地节点。这些网络是虚拟的区块链环境，可以在本地计算机上轻松运行。它们通常具有以下特点：

- 提供了模拟的区块链数据，包括交易和区块。
- 允许开发者创建测试账户，并分配虚拟代币以供测试使用。
- 可以在没有真实交易费用的情况下进行开发和测试。

一些流行的开发者网络包括Ganache和Hardhat。这些工具使开发者能够在本地模拟区块链环境，以便更轻松地开发、调试和测试智能合约。需要注意的是，这些本地模拟的区块链数据通常存储在内存中，因此在重启节点后数据将会丢失，这是开发过程中需要考虑的重要因素。

以下是由Hardhat提供的开发节点示例：

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





