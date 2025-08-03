import { Koios, Lucid, type WalletApi } from "@evolution-sdk/lucid";
import { Data, Constr } from "@evolution-sdk/lucid";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { getDeploymentConfig } from "./cardanoConfig";

// Simple cache to prevent multiple Lucid instances
let cachedLucid: any = null;
let cachedNetwork: string | null = null;

// Simple function to connect Lace wallet to Lucid
export async function connectLaceWallet(network: "preview" | "mainnet" = "preview") {
  console.log("🔍 Debugging window.cardano:", window.cardano);
  console.log("🔍 Available wallet providers:", Object.keys(window.cardano || {}));
  
  // Check if we already have a cached instance for this network
  if (cachedLucid && cachedNetwork === network) {
    console.log("♻️ Reusing cached Lucid instance for network:", network);
    return cachedLucid;
  }
  
  if (typeof window === "undefined") {
    throw new Error("Window is undefined - not in browser environment");
  }
  
  if (!window.cardano) {
    throw new Error("No Cardano wallet providers found. Please install a Cardano wallet extension.");
  }
  
  // Check for Lace wallet specifically
  if (!window.cardano.lace) {
    console.log("❌ Lace wallet not found in window.cardano");
    console.log("🔍 Available providers:", Object.keys(window.cardano));
    
    // Try to find any available wallet
    const availableWallets = Object.keys(window.cardano).filter(key => 
      window.cardano[key] && typeof window.cardano[key].enable === 'function'
    );
    
    if (availableWallets.length > 0) {
      console.log("✅ Found available wallets:", availableWallets);
      // For now, let's try the first available wallet
      const walletName = availableWallets[0];
      console.log(`🔄 Trying to use ${walletName} instead of Lace`);
      
      try {
        const api = await window.cardano[walletName].enable();
        console.log(`✅ Successfully enabled ${walletName}`);
        
        // Create Lucid instance
        const config = network === "preview" 
          ? { apiUrl: "https://preview.koios.rest/api/v1" }
          : { apiUrl: "https://api.koios.rest/api/v1" };
        
        const lucid = await Lucid(new Koios(config.apiUrl), "Preview");
        
        // Select wallet from API
        lucid.selectWallet.fromAPI(api);
        
        console.log("✅ Connected to Cardano wallet");
        return lucid;
      } catch (error) {
        console.error(`❌ Failed to connect to ${walletName}:`, error);
        throw new Error(`Failed to connect to ${walletName}: ${error}`);
      }
    }
    
    throw new Error("No compatible Cardano wallet found. Please install Lace or another Cardano wallet extension.");
  }

  try {
    // Enable Lace wallet
    const api = await window.cardano.lace.enable();
    
    // Create Lucid instance
    const config = network === "preview" 
      ? { apiUrl: "https://preview.koios.rest/api/v1" }
      : { apiUrl: "https://api.koios.rest/api/v1" };
    
    const lucid = await Lucid(new Koios(config.apiUrl), "Preview");
    
    // Select wallet from API
    lucid.selectWallet.fromAPI(api);
    
    console.log("✅ Connected to Lace wallet");
    return lucid;
  } catch (error) {
    console.error("Failed to connect to Lace wallet:", error);
    throw new Error("Failed to connect to Lace wallet");
  }
}

// Simple function to create source escrow
export async function createSourceEscrow(
  lucid: any,
  amount: bigint,
  takerAddress: string,
  secretHash: string,
  expireTimestamp: bigint,
  network: "preview" | "mainnet" = "preview"
): Promise<{ txHash: string; scriptAddress: string }> {
  try {
    const deploymentConfig = getDeploymentConfig(network);
    const makerAddress = await lucid.wallet.address();
    
    // Create the datum for the source escrow
    const datum = Data.to(new Constr(0, [
      expireTimestamp,
      makerAddress,
      takerAddress,
      secretHash
    ]));

    // Create the script address
    const scriptAddress = deploymentConfig.scriptAddress;

    // Build the transaction
    const tx = await lucid
      .newTx()
      .pay.ToContract(
        scriptAddress,
        { kind: "inline", value: datum },
        { lovelace: amount }
      )
      .complete();

    // Sign and submit the transaction
    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();

    console.log("✅ Source escrow created successfully!");
    console.log(`Transaction hash: ${txHash}`);
    console.log(`Script address: ${scriptAddress}`);

    return { txHash, scriptAddress };
  } catch (error) {
    console.error("Failed to create source escrow:", error);
    throw new Error(`Failed to create source escrow: ${error}`);
  }
}

// Helper function to generate secret and hash
export function generateSecretAndHash(): { secret: string; secretHash: string } {
  const secretBytes = new Uint8Array(32);
  crypto.getRandomValues(secretBytes);
  const secret = bytesToHex(secretBytes);
  const secretHashBytes = keccak_256(secretBytes);
  const secretHash = bytesToHex(secretHashBytes);
  
  return { secret, secretHash };
}

// Helper function to calculate expiration timestamp
export function calculateExpirationTimestamp(hoursFromNow: number = 1): bigint {
  const currentTime = Date.now();
  const expireTimestamp = Math.floor(currentTime / 1000) + (hoursFromNow * 3600);
  return BigInt(expireTimestamp);
}

// Use any type to avoid conflicts with existing declarations 