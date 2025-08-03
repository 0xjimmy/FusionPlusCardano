import { SDK, HashLock, type MerkleLeaf, OrderStatus } from "@1inch/cross-chain-sdk";
import { ViemProviderConnector } from "../lib/fusion/viemProviderConnector";
import { keccak256, encodePacked } from "viem/utils";
import { parseUnits } from "viem";
import type { LucidEvolution } from "@evolution-sdk/lucid";
import { validatorToAddress, Data, Constr, paymentCredentialOf } from "@evolution-sdk/lucid";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { QuoteResult } from "./getQuote";
import plutusJson from "../../../aiken-resolver/plutus.json";
import { z } from "zod";
import { TAKER_ADDRESS_CARDANO } from "../lib/fusion/constants";

const rescueWithdrawSchema = z.object({
  txHash: z.string().min(1, 'Transaction hash is required'),
  outputIndex: z.number().min(0, 'Output index must be non-negative'),
  secret: z.string().min(1, 'Secret is required')
});

export interface SwapResult {
  completeSwapResponse: any;
  secrets: `0x${string}`[];
  secretHashes: `0x${string}`[];
  makerAddress: string;
  orderHash: string;
  escrowTxHash: string;
  scriptAddress: string;
  datum: string;
  secretHash: string;
  expireTimestamp: number;
  makerPkh: string;
  takerPkh: string;
  redemptionTxHash?: string;
}

export async function executeSwap(
  adaAmount: string,
  lucid: LucidEvolution,
  quoteResult: QuoteResult
): Promise<SwapResult> {
  const { quote, secrets, secretHashes, makerAddress, makerPrivateKey } = quoteResult;

  const nodeUrl = "https://rpc.sepolia.org";

  const blockchainProvider = new ViemProviderConnector(
    makerPrivateKey,
    nodeUrl,
  );

  const sdk = new SDK({
    url: "http://localhost:8787/fusion-plus",
    blockchainProvider,
  });

  // Create hash lock based on secrets count
  const secretsCount = quote.getPreset().secretsCount;
  const hashLock = secretsCount === 1
    ? HashLock.forSingleFill(secrets[0])
    : HashLock.forMultipleFills(
        secretHashes.map((secretHash, i) => 
          keccak256(encodePacked(["uint64", "bytes32"], [BigInt(i), secretHash])) as MerkleLeaf
        )
      );

  console.log("Creating order with quote:", quote);

  // Create the order
  const order = await sdk.createOrder(quote, {
    walletAddress: makerAddress,
    hashLock,
    secretHashes,
    // Optional fee configuration
    fee: {
      takingFeeBps: 100, // 1% fee
      takingFeeReceiver: "0x0000000000000000000000000000000000000000", // fee receiver address
    },
  });

  console.log("Order hash:", order.hash);
  console.log("Secret hashes:", secretHashes);

  // Create source escrow
  console.log("🔧 Creating source escrow...");
  
  // Get maker and taker PKHs
  const makerWalletAddress = await lucid.wallet().address();
  const makerPkh = paymentCredentialOf(makerWalletAddress).hash;
  
  // Get taker PKH from the taker address in constants
  const takerPkh = paymentCredentialOf(TAKER_ADDRESS_CARDANO).hash;
  
  // Use the first secret for the escrow (assuming single fill for simplicity)
  const secretBytes = new Uint8Array(Buffer.from(secrets[0].slice(2), 'hex')); // Remove '0x' prefix
  const secretHashBytes = keccak_256(secretBytes);
  
  const currentTime = Date.now();
  const expireTimestamp = Math.floor(currentTime / 1000) + 3600; // 1 hour from now in seconds
  
  // Create the datum as a Constr with raw values
  const datum = Data.to(new Constr(0, [
    BigInt(expireTimestamp),
    makerPkh,
    takerPkh,
    bytesToHex(secretHashBytes)
  ]));
  
  // Get the source escrow spending validator from plutus.json
  const sourceEscrowValidator = plutusJson.validators.find(
    v => v.title === "source_escrow.source_escrow.spend"
  );
  
  if (!sourceEscrowValidator) {
    throw new Error("Source escrow spending validator not found in plutus.json");
  }
  
  const spendingValidator = {
    type: "PlutusV3" as const,
    script: sourceEscrowValidator.compiledCode
  };
  
  const scriptAddress = validatorToAddress("Preview", spendingValidator);
  
  // Convert ADA amount to lovelace
  const lovelaceAmount = parseUnits(adaAmount, 6); // ADA has 6 decimals
  
  // Build the transaction to lock ADA in the escrow
  const escrowTx = await lucid
    .newTx()
    .pay.ToContract(
      scriptAddress,
      { kind: "inline", value: datum },
      { lovelace: lovelaceAmount }
    )
    .complete();
  
  // Sign and submit the escrow transaction
  const signedEscrowTx = await escrowTx.sign.withWallet().complete();
  const escrowTxHash = await signedEscrowTx.submit();
  
  console.log("✅ Source escrow created successfully!");
  console.log(`Escrow transaction hash: ${escrowTxHash}`);
  console.log(`Script address: ${scriptAddress}`);
  console.log(`Locked amount: ${adaAmount} ADA`);
  console.log(`Expiration timestamp: ${expireTimestamp} (${new Date(expireTimestamp * 1000).toISOString()})`);
  console.log(`Secret hash: ${bytesToHex(secretHashBytes)}`);
  console.log(`Maker PKH: ${makerPkh}`);
  console.log(`Taker PKH: ${takerPkh}`);
 
  // Manual polling for transaction confirmation
  console.log("Waiting for transaction confirmation...");
  let isConfirmed = false;
  let attempts = 0;
  const maxAttempts = 50; // 250 seconds max wait time (50 * 5 seconds)
  
  while (!isConfirmed && attempts < maxAttempts) {
    try {
      // Wait 5 seconds before checking
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try to fetch transaction status from Koios
      const response = await fetch("https://preview.koios.rest/api/v1/tx_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyIjoic3Rha2UxdTkzNGs0eGtwenhncm5jdnh0NXFoMGtkNHVwdmVtYW5wczRlMHJ1bjVzamY5ZHMzZng4dTkiLCJleHAiOjE3NjA5NDMyNDEsInRpZXIiOjEsInByb2pJRCI6ImRlbW8tZnVzaW9uIn0.JY7hHVFSmpH8XPFyZ7qXvA04XktAM1YEaizq8CYRw1Y"
        },
        body: JSON.stringify({
          _tx_hashes: [escrowTxHash]
        }),
      });
      
      if (response.ok) {
        const txStatus = await response.json();
        if (txStatus && txStatus.length > 0 && txStatus[0].num_confirmations > 0) {
          isConfirmed = true;
          console.log(`Transaction confirmed with ${txStatus[0].num_confirmations} confirmations`);
        } else {
          console.log(`Attempt ${attempts + 1}/${maxAttempts}: Transaction not yet confirmed`);
        }
      }
    } catch (error) {
      console.log(`Attempt ${attempts + 1}/${maxAttempts}: Error checking transaction status`, error);
    }
    
    attempts++;
  }
  
  if (!isConfirmed) {
    throw new Error("Transaction confirmation timeout");
  }

  // Get the output index (assuming it's 0 for the first output)
  const outputIndex = 0;

  // Call the /resolver/complete-swap API instead of submitting order
  const completeSwapPayload = {
    txHash: escrowTxHash,
    outputIndex: outputIndex,
    secret: secrets[0] // Use the first secret
  };

  // Validate the payload
  const validatedPayload = rescueWithdrawSchema.parse(completeSwapPayload);

  console.log("Calling /resolver/complete-swap with payload:", validatedPayload);

  // Make the API call
  const response = await fetch("http://localhost:8787/resolver/complete-swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedPayload),
  });

  if (!response.ok) {
    throw new Error(`Failed to complete swap: ${response.statusText}`);
  }

  const completeSwapResponse = await response.json();
  console.log("Complete swap response:", completeSwapResponse);

  // Extract the redemption transaction hash from the response
  const redemptionTxHash = completeSwapResponse.details?.redemptionTxHash;
  
  if (redemptionTxHash) {
    console.log("Monitoring redemption transaction:", redemptionTxHash);
    
    // Poll the redemption transaction for confirmation
    let redemptionConfirmed = false;
    let redemptionAttempts = 0;
    const maxRedemptionAttempts = 50; // 250 seconds max wait time
    
    while (!redemptionConfirmed && redemptionAttempts < maxRedemptionAttempts) {
      try {
        // Wait 5 seconds before checking
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check redemption transaction status
        const redemptionResponse = await fetch("https://preview.koios.rest/api/v1/tx_status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyIjoic3Rha2UxdTkzNGs0eGtwenhncm5jdnh0NXFoMGtkNHVwdmVtYW5wczRlMHJ1bjVzamY5ZHMzZng4dTkiLCJleHAiOjE3NjA5NDMyNDEsInRpZXIiOjEsInByb2pJRCI6ImRlbW8tZnVzaW9uIn0.JY7hHVFSmpH8XPFyZ7qXvA04XktAM1YEaizq8CYRw1Y"
          },
          body: JSON.stringify({
            _tx_hashes: [redemptionTxHash]
          }),
        });
        
        if (redemptionResponse.ok) {
          const redemptionTxStatus = await redemptionResponse.json();
          if (redemptionTxStatus && redemptionTxStatus.length > 0 && redemptionTxStatus[0].num_confirmations > 0) {
            redemptionConfirmed = true;
            console.log(`✅ Redemption transaction confirmed with ${redemptionTxStatus[0].num_confirmations} confirmations`);
            console.log(`🎉 Swap completed successfully! Funds redeemed to taker wallet.`);
          } else {
            console.log(`Redemption attempt ${redemptionAttempts + 1}/${maxRedemptionAttempts}: Transaction not yet confirmed`);
          }
        }
      } catch (error) {
        console.log(`Redemption attempt ${redemptionAttempts + 1}/${maxRedemptionAttempts}: Error checking transaction status`, error);
      }
      
      redemptionAttempts++;
    }
    
    if (!redemptionConfirmed) {
      console.warn("⚠️ Redemption transaction confirmation timeout - but swap may still be processing");
    }
  } else {
    console.warn("⚠️ No redemption transaction hash found in response");
  }

  return {
    completeSwapResponse,
    secrets,
    secretHashes,
    makerAddress,
    orderHash: order.hash,
    escrowTxHash,
    scriptAddress,
    datum,
    secretHash: bytesToHex(secretHashBytes),
    expireTimestamp,
    makerPkh,
    takerPkh,
    redemptionTxHash // Add the redemption tx hash to the return object
  };
}