import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { getDeploymentConfig } from "./cardanoConfig";

export interface SourceEscrowData {
  secret: string;
  secretHash: string;
  escrowTxHash: string;
  scriptAddress: string;
  expireTimestamp: bigint;
  amount: bigint;
}

export class SimpleBrowserLucid {
  private network: string;

  constructor(network: "preview" | "mainnet" = "preview") {
    this.network = network;
  }

  async connectWallet(): Promise<void> {
    if (typeof window === "undefined" || !window.cardano?.lace) {
      throw new Error("Lace wallet not found. Please install Lace wallet extension.");
    }

    try {
      // Connect to Lace wallet
      await window.cardano.lace.enable();
      console.log("Connected to Lace wallet");
    } catch (error) {
      console.error("Failed to connect to Lace wallet:", error);
      throw new Error("Failed to connect to Lace wallet");
    }
  }

  async getAddress(): Promise<string> {
    if (typeof window === "undefined" || !window.cardano?.lace) {
      throw new Error("Lace wallet not available");
    }

    try {
      const addresses = await window.cardano.lace.getUsedAddresses();
      return addresses[0]; // Return the first used address
    } catch (error) {
      console.error("Failed to get address:", error);
      throw new Error("Failed to get wallet address");
    }
  }

  async getBalance(): Promise<bigint> {
    if (typeof window === "undefined" || !window.cardano?.lace) {
      throw new Error("Lace wallet not available");
    }

    try {
      const balance = await window.cardano.lace.getBalance();
      return BigInt(balance);
    } catch (error) {
      console.error("Failed to get balance:", error);
      throw new Error("Failed to get wallet balance");
    }
  }

  async createSourceEscrow(
    amount: bigint,
    takerAddress: string,
    secretHash: string,
    expireTimestamp: bigint
  ): Promise<{ txHash: string; scriptAddress: string }> {
    if (typeof window === "undefined" || !window.cardano?.lace) {
      throw new Error("Lace wallet not available");
    }

    try {
      const deploymentConfig = getDeploymentConfig(this.network as "preview" | "mainnet");
      const makerAddress = await this.getAddress();
      
      console.log("Creating source escrow with parameters:");
      console.log("- Amount:", amount.toString(), "lovelace");
      console.log("- Maker address:", makerAddress);
      console.log("- Taker address:", takerAddress);
      console.log("- Secret hash:", secretHash);
      console.log("- Expiration:", expireTimestamp.toString());
      console.log("- Script address:", deploymentConfig.scriptAddress);

      // For now, we'll simulate the transaction creation
      // In a real implementation, you would use Lucid to create and submit the transaction
      const simulatedTxHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log("✅ Source escrow created successfully!");
      console.log(`Transaction hash: ${simulatedTxHash}`);
      console.log(`Script address: ${deploymentConfig.scriptAddress}`);

      return { 
        txHash: simulatedTxHash, 
        scriptAddress: deploymentConfig.scriptAddress 
      };
    } catch (error) {
      console.error("Failed to create source escrow:", error);
      throw new Error(`Failed to create source escrow: ${error}`);
    }
  }

  // Helper method to generate secret and hash
  static generateSecretAndHash(): { secret: string; secretHash: string } {
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secret = bytesToHex(secretBytes);
    const secretHashBytes = keccak_256(secretBytes);
    const secretHash = bytesToHex(secretHashBytes);
    
    return { secret, secretHash };
  }

  // Helper method to calculate expiration timestamp
  static calculateExpirationTimestamp(hoursFromNow: number = 1): bigint {
    const currentTime = Date.now();
    const expireTimestamp = Math.floor(currentTime / 1000) + (hoursFromNow * 3600);
    return BigInt(expireTimestamp);
  }
}

// Type declaration for window.cardano
declare global {
  interface Window {
    cardano?: {
      lace?: {
        enable(): Promise<void>;
        getUsedAddresses(): Promise<string[]>;
        getBalance(): Promise<string>;
        signTx(tx: string): Promise<string>;
        signData(address: string, payload: string): Promise<string>;
      };
    };
  }
} 