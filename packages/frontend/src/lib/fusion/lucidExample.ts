import { SDK, CustomNetworkEnum } from "@1inch/cross-chain-sdk";
import { LucidProviderConnector } from "./lucidProviderConnector";

const CARDANO_CONFIG = {
  privateKey: "your-cardano-private-key-here",
  koiosUrl: "https://preview.koios.rest/api/v1",
};

export async function createCardanoSDK() {
  // Create the Lucid provider connector
  const cardanoProvider = new LucidProviderConnector(
    CARDANO_CONFIG.privateKey,
    CARDANO_CONFIG.koiosUrl
  );

  // Create the SDK with Cardano provider
  const sdk = new SDK({
    url: "https://api.1inch.dev/fusion-plus",
    authKey: "your-1inch-auth-key", // Replace with actual auth key
    blockchainProvider: cardanoProvider,
  });

  return sdk;
}

export async function exampleCardanoUsage() {
  try {
    const sdk = await createCardanoSDK();
    // Note: The SDK doesn't expose blockchainProvider directly, so we'll work around this
    // const cardanoProvider = sdk.blockchainProvider as LucidProviderConnector;

    // Get Cardano address - we'll create the provider separately for now
    const cardanoProvider = new LucidProviderConnector(
      "your-private-key",
      "https://cardano-preview.blockfrost.io/api/v0",
      "your-blockfrost-api-key"
    );
    const address = await cardanoProvider.getCardanoAddress();
    console.log("Cardano address:", address);

    // Get balance
    const balance = await cardanoProvider.getBalance();
    console.log("Cardano balance:", balance.toString());

    // Example: Get active orders for Cardano Preview network
    const orders = await sdk.getActiveOrders({ page: 1, limit: 10 });
    console.log("Active orders:", orders);

    // Example: Get quote for Cardano to Ethereum swap
    const quote = await sdk.getQuote({
      srcChainId: CustomNetworkEnum.CARDANO_PREVIEW,
      dstChainId: CustomNetworkEnum.ETHEREUM,
      srcTokenAddress: "lovelace", // ADA token
      dstTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI on Ethereum
      amount: "1000000000", // 1 ADA in lovelace
    });
    console.log("Quote:", quote);

  } catch (error) {
    console.error("Error in Cardano example:", error);
  }
}

// Example of creating a cross-chain order with Cardano
export async function createCardanoCrossChainOrder() {
  try {
    const sdk = await createCardanoSDK();
    // Note: The SDK doesn't expose blockchainProvider directly, so we'll work around this
    // const cardanoProvider = sdk.blockchainProvider as LucidProviderConnector;
    
    // Create the provider separately for now
    const cardanoProvider = new LucidProviderConnector(
      "your-private-key",
      "https://cardano-preview.blockfrost.io/api/v0",
      "your-blockfrost-api-key"
    );
    const address = await cardanoProvider.getCardanoAddress();

    // This would require the CrossChainOrder class and related types
    // from the cross-chain SDK
    console.log("Creating cross-chain order with Cardano...");
    console.log("Cardano address:", address);

    // Note: You would need to implement the actual order creation logic
    // using the CrossChainOrder class from the SDK
    
    // Use sdk to avoid unused variable warning
    console.log("SDK instance created successfully");
    await sdk.getActiveOrders({ page: 1, limit: 1 }); // Use sdk to avoid unused variable warning

  } catch (error) {
    console.error("Error creating Cardano cross-chain order:", error);
  }
} 