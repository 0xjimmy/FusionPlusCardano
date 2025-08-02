import { CustomNetworkEnum, isCustomNetwork, getNetworkName } from './network-types'
import { SupportedChains, isSupportedChain } from './chains'

describe('Network Types', () => {
    describe('CustomNetworkEnum', () => {
        it('should have correct values for Cardano networks', () => {
            expect(CustomNetworkEnum.CARDANO_PREVIEW).toBe(42000)
            expect(CustomNetworkEnum.CARDANO).toBe(42001)
            expect(CustomNetworkEnum.SEPOLIA).toBe(11155111)
        })

        it('should include all existing NetworkEnum values', () => {
            // Check that some key NetworkEnum values are present
            expect(CustomNetworkEnum.ETHEREUM).toBeDefined()
            expect(CustomNetworkEnum.POLYGON).toBeDefined()
            expect(CustomNetworkEnum.ARBITRUM).toBeDefined()
        })
    })

    describe('isCustomNetwork', () => {
        it('should return true for custom networks', () => {
            expect(isCustomNetwork(CustomNetworkEnum.CARDANO_PREVIEW)).toBe(true)
            expect(isCustomNetwork(CustomNetworkEnum.CARDANO)).toBe(true)
            expect(isCustomNetwork(CustomNetworkEnum.SEPOLIA)).toBe(true)
        })

        it('should return false for non-custom networks', () => {
            expect(isCustomNetwork(999999)).toBe(false)
        })
    })

    describe('getNetworkName', () => {
        it('should return correct names for custom networks', () => {
            expect(getNetworkName(CustomNetworkEnum.CARDANO_PREVIEW)).toBe('Cardano Preview')
            expect(getNetworkName(CustomNetworkEnum.CARDANO)).toBe('Cardano')
            expect(getNetworkName(CustomNetworkEnum.SEPOLIA)).toBe('Sepolia')
        })
    })

    describe('SupportedChains', () => {
        it('should include custom networks', () => {
            expect(SupportedChains).toContain(CustomNetworkEnum.CARDANO_PREVIEW)
            expect(SupportedChains).toContain(CustomNetworkEnum.CARDANO)
            expect(SupportedChains).toContain(CustomNetworkEnum.SEPOLIA)
        })

        it('should recognize custom networks as supported', () => {
            expect(isSupportedChain(CustomNetworkEnum.CARDANO_PREVIEW)).toBe(true)
            expect(isSupportedChain(CustomNetworkEnum.CARDANO)).toBe(true)
            expect(isSupportedChain(CustomNetworkEnum.SEPOLIA)).toBe(true)
        })
    })
}) 