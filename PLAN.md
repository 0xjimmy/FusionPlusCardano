# Resolver
Creates escrow on both source and dest chain
(Cardano Preview and Some ETH testnet)


# Relayer
Gets orders from users
Talks to resolver, but how

Accepts user API request drop in pretending to be `@1inch/cross-chain-sdk` compatible
For talking with resolvers we can use our own internal requests for now

# User
Use SDK
https://portal.1inch.dev/documentation/apis/swap/fusion-plus/fusion-plus-sdk/for-integrators/sdk-overview
`import { SDK, NetworkEnum } from "@1inch/cross-chain-sdk";`
but replace URL with our mock relayer service

Sends order to relayer