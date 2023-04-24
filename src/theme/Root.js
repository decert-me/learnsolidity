import React from 'react';
import { WagmiConfig, configureChains, createClient } from 'wagmi'
import { goerli, mainnet, polygon, polygonMumbai } from 'wagmi/chains'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { WalletConnectLegacyConnector } from 'wagmi/connectors/walletConnectLegacy'
import { publicProvider } from 'wagmi/providers/public'

export default function Root({children}) {

    const { chains, provider } = configureChains(
        [mainnet, goerli, polygonMumbai, polygon],
        [
          publicProvider(),
        ],
        { targetQuorum: 1 },
    )

    const wagmiClient = createClient({
        autoConnect: true,
        connectors: [
          new MetaMaskConnector({
            chains,
            options: {
              UNSTABLE_shimOnConnectSelectAccount: true,
            },
          }),
          new WalletConnectLegacyConnector({
            options: {
              qrcode: true,
            },
          })
        ],
        provider,
    })

    return (
        <WagmiConfig client={wagmiClient}>
          <div className={typeof window !== 'undefined' && window.screen.width <= 996 ? "custom-mobile" : ""}>
            {children}
          </div>
        </WagmiConfig>
    )
}