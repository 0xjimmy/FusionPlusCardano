import {NetworkEnum} from '@1inch/fusion-sdk'
import {TupleToUnion} from './type-utils'
import { CustomNetworkEnum } from './network-types'

export const SupportedChains = [
    NetworkEnum.ETHEREUM,
    NetworkEnum.POLYGON,
    NetworkEnum.BINANCE,
    NetworkEnum.OPTIMISM,
    NetworkEnum.ARBITRUM,
    NetworkEnum.AVALANCHE,
    NetworkEnum.GNOSIS,
    NetworkEnum.COINBASE,
    NetworkEnum.ZKSYNC,
    NetworkEnum.LINEA,
    NetworkEnum.SONIC,
    NetworkEnum.UNICHAIN,
    // Custom networks
    CustomNetworkEnum.CARDANO_PREVIEW,
    CustomNetworkEnum.CARDANO,
    CustomNetworkEnum.SEPOLIA
] as const

// Create a union type that includes both NetworkEnum and CustomNetworkEnum
type ExtendedNetworkEnum = NetworkEnum | CustomNetworkEnum

type UnsupportedChain = Exclude<
    ExtendedNetworkEnum,
    TupleToUnion<typeof SupportedChains>
>

export type SupportedChain = Exclude<ExtendedNetworkEnum, UnsupportedChain>

export const isSupportedChain = (chain: unknown): chain is SupportedChain =>
    SupportedChains.includes(chain as number)
