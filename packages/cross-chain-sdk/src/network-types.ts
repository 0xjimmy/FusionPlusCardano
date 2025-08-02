import { NetworkEnum } from '@1inch/fusion-sdk'

// Extend NetworkEnum with custom networks
export const CustomNetworkEnum = {
    ...NetworkEnum,
    CARDANO_PREVIEW: 42000,
    CARDANO: 42001,
    SEPOLIA: 11155111
} as const

export type CustomNetworkEnum = typeof CustomNetworkEnum[keyof typeof CustomNetworkEnum]

// Helper function to check if a network is a custom network
export const isCustomNetwork = (network: number): network is CustomNetworkEnum => {
    return Object.values(CustomNetworkEnum).includes(network as CustomNetworkEnum)
}

// Helper function to get network name
export const getNetworkName = (network: CustomNetworkEnum): string => {
    switch (network) {
        case CustomNetworkEnum.CARDANO_PREVIEW:
            return 'Cardano Preview'
        case CustomNetworkEnum.CARDANO:
            return 'Cardano'
        case CustomNetworkEnum.SEPOLIA:
            return 'Sepolia'
        default:
            // For existing NetworkEnum values, we'll need to map them
            // This is a simplified mapping - you might want to expand this
            return `Network ${network}`
    }
} 