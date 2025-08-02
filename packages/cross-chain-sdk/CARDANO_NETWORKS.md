# Cardano Network Support

This SDK now supports Cardano networks alongside the existing Ethereum-compatible networks.

## Supported Networks

### New Networks Added:
- **Cardano Preview** (Chain ID: 42000) - Cardano testnet
- **Cardano** (Chain ID: 42001) - Cardano mainnet  
- **Sepolia** (Chain ID: 11155111) - Ethereum testnet

### Existing Networks:
All existing networks from the original NetworkEnum are still supported.

## Usage

### Import the Network Types

```typescript
import { 
    CustomNetworkEnum, 
    SupportedChain, 
    isSupportedChain,
    getNetworkName 
} from '@1inch/cross-chain-sdk'
```

### Using Custom Networks

```typescript
// Create orders with Cardano networks
const order = CrossChainOrder.new(
    escrowFactory,
    orderInfo,
    escrowParams,
    details,
    {
        srcChainId: CustomNetworkEnum.ETHEREUM,
        dstChainId: CustomNetworkEnum.CARDANO_PREVIEW // Cardano Preview
    }
)

// Check if a network is supported
if (isSupportedChain(CustomNetworkEnum.CARDANO)) {
    console.log('Cardano mainnet is supported!')
}

// Get network name
console.log(getNetworkName(CustomNetworkEnum.CARDANO_PREVIEW)) // "Cardano Preview"
```

### Network Constants

```typescript
// Network IDs
CustomNetworkEnum.CARDANO_PREVIEW // 42000
CustomNetworkEnum.CARDANO         // 42001
CustomNetworkEnum.SEPOLIA         // 11155111
```

## Important Notes

### Cardano Addresses
Cardano networks use a different addressing scheme than Ethereum. The current implementation uses placeholder addresses for Cardano networks in the deployment configurations. You'll need to:

1. Replace placeholder addresses with actual Cardano addresses
2. Implement Cardano-specific address handling
3. Create Cardano-specific escrow factory implementations if needed

### Escrow Factory
The escrow factory currently uses the default implementation for Cardano networks. You may need to create Cardano-specific implementations for full functionality.

## Example: Cross-Chain Order with Cardano

```typescript
import { 
    CrossChainOrder, 
    CustomNetworkEnum, 
    Address 
} from '@1inch/cross-chain-sdk'

// Create a cross-chain order from Ethereum to Cardano Preview
const order = CrossChainOrder.new(
    escrowFactoryAddress,
    {
        srcChainId: CustomNetworkEnum.ETHEREUM,
        dstChainId: CustomNetworkEnum.CARDANO_PREVIEW,
        srcToken: Address.fromString('0x...'), // Ethereum token
        dstToken: Address.fromString('0x...'), // Cardano token (placeholder)
        // ... other order parameters
    },
    escrowParams,
    details
)
```

## Testing

Run the tests to verify network support:

```bash
npm test
```

The test suite includes specific tests for the new network types in `network-types.spec.ts`. 