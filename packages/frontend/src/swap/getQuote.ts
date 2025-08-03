import { SDK, HashLock, randBigInt, type QuoteParams, CustomNetworkEnum } from "@1inch/cross-chain-sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ViemProviderConnector } from "../lib/fusion/viemProviderConnector";
import { encodePacked } from "viem/utils";
import { maxUint256, parseUnits, formatUnits } from "viem";
import type { LucidEvolution } from "@evolution-sdk/lucid";

export interface QuoteResult {
  quote: any;
  secrets: `0x${string}`[];
  secretHashes: `0x${string}`[];
  makerAddress: string;
  makerPrivateKey: string;
}

export async function getQuote(
  adaAmount: string, 
  lucid: LucidEvolution, 
  outputAddress: string
): Promise<QuoteResult> {
  // Validate input
  if (!adaAmount || parseFloat(adaAmount) <= 0) {
    throw new Error('Invalid ADA amount. Must be greater than 0.');
  }

  // Generate a new private key for the maker
  const makerPrivateKey = generatePrivateKey();
  const account = privateKeyToAccount(makerPrivateKey);
  const makerAddress = account.address;

  const nodeUrl = "https://rpc.sepolia.org";

  const blockchainProvider = new ViemProviderConnector(
    makerPrivateKey,
    nodeUrl,
  );

  const sdk = new SDK({
    url: "http://localhost:8787/fusion-plus",
    blockchainProvider,
  });

  // Parameters for ADA to ETH order
  const params = {
    srcChain: CustomNetworkEnum.CARDANO_PREVIEW,
    dstChain: CustomNetworkEnum.SEPOLIA,
    srcTokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as `0x${string}`,
    dstTokenAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" as `0x${string}`,
    amount: encodePacked(["uint256"], [parseUnits(adaAmount, 6)]), // ADA has 6 decimals (lovelace)
    enableEstimate: true,
    walletAddress: makerAddress,
  };

  // Get quote for the order
  const sdkQuoteParams: QuoteParams = {
    srcChainId: CustomNetworkEnum.CARDANO_PREVIEW,
    dstChainId: CustomNetworkEnum.SEPOLIA,
    srcTokenAddress: params.srcTokenAddress,
    dstTokenAddress: params.dstTokenAddress,
    amount: params.amount,
    walletAddress: params.walletAddress,
    enableEstimate: true,
  };
  
  const quoteWithSdk = await sdk.getQuote(sdkQuoteParams);

  // Calculate secrets and hash locks
  const secretsCount = quoteWithSdk.getPreset().secretsCount;
  const secrets = Array.from({ length: secretsCount }).map(() => 
    encodePacked(["uint256"], [randBigInt(maxUint256)])
  );
  const secretHashes = secrets.map((x) => HashLock.hashSecret(x) as `0x${string}`);
  
  console.log("Quote received:", quoteWithSdk);
  console.log("Secret hashes:", secretHashes);

  return {
    quote: quoteWithSdk,
    secrets,
    secretHashes,
    makerAddress,
    makerPrivateKey
  };
}
