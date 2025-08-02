import type { BlockchainProviderConnector, EIP712TypedData } from "@1inch/cross-chain-sdk";
import { createPublicClient, type PublicClient, createWalletClient, type WalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export class ViemProviderConnector implements BlockchainProviderConnector {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private privateKey: string;

  constructor(privateKey: string, rpcUrl: string) {
    this.privateKey = privateKey;
    
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: privateKeyToAccount(privateKey as `0x${string}`),
      chain: sepolia,
      transport: http(rpcUrl),
    });
  }

  async signTypedData(
    _walletAddress: string,
    typedData: EIP712TypedData,
  ): Promise<string> {
    console.log("signTypedData", typedData);
    console.log("domain", typedData.domain);
    console.log("types", typedData.types);
    console.log("primaryType", typedData.primaryType);
    console.log("message", typedData.message);
    const signature = await this.walletClient.signTypedData({
      account: privateKeyToAccount(this.privateKey as `0x${string}`),
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });
    
    return signature;
  }

  async ethCall(contractAddress: string, callData: string): Promise<string> {
    const result = await this.publicClient.call({
      to: contractAddress as `0x${string}`,
      data: callData as `0x${string}`,
    });
    
    return result.data || "0x";
  }
}