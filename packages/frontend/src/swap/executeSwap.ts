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

export interface SwapResult {
  submitOrder: any;
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
  
  // For now, we'll use a hardcoded taker PKH
  // In a real implementation, this would come from the order or user input
  const takerPkh = "0000000000000000000000000000000000000000000000000000000000000000"; // Placeholder
  
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
 
  // Wait for escrow transaction to be confirmed
  await lucid.awaitTx(escrowTxHash);

  // Submit the order
  const submitOrder = await sdk.submitOrder(
    quote.srcChainId, 
    order.order, 
    order.quoteId, 
    secretHashes
  );
  
  console.log("Submitted order hash:", submitOrder.orderHash);
  console.log("Submit order response:", submitOrder);

  // Wait for order status and reveal secrets when ready
  let status: OrderStatus | undefined | string = undefined;
  while (status !== "SKIBIDI") {
    const orderStatus = await sdk.getOrderStatus(submitOrder.orderHash);
    console.log("Order status:", orderStatus);
    status = orderStatus.status;
    
    // If order is ready for secret revelation, reveal the secrets
    if (status === "READY_TO_REVEAL_SECRETS" || status === "READY") {
      console.log("Order ready for secret revelation");
      // Reveal secrets logic would go here if needed
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    submitOrder,
    secrets,
    secretHashes,
    makerAddress,
    orderHash: submitOrder.orderHash,
    escrowTxHash,
    scriptAddress,
    datum,
    secretHash: bytesToHex(secretHashBytes),
    expireTimestamp,
    makerPkh,
    takerPkh
  };
}