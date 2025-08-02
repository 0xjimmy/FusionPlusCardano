import { validatorToScriptHash, Data, fromText, generatePrivateKey, makeWalletFromPrivateKey, Constr, Koios, validatorToAddress, paymentCredentialOf } from "@evolution-sdk/lucid";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { makeEmulatorEnv } from "./utils/setupEmulatorEnv";
import { uploadScript } from "./utils/uploadScript";
import plutusJson from "../plutus.json"

// Utility function to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.replace(/^0x/, '');
    return new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

// Define datum schema for type safety
const DatumSchema = Data.Object({
    expire_timestamp: Data.Integer(),
    maker_address: Data.Bytes(),
    taker_address: Data.Bytes(),
    secret_hash: Data.Bytes(),
});
type DatumType = Data.Static<typeof DatumSchema>;

const { lucid, makerAccount, takerAccount, deploymentAccount, emulator } = await makeEmulatorEnv();

async function deploySourceEscrow() {
    console.log("Starting source escrow deployment...");
    
    // Set the deployment account as the active wallet
    lucid.selectWallet.fromPrivateKey(deploymentAccount.privateKey);
    
    try {
        const sourceEscrowValidator = plutusJson.validators.find((v: any) => v.title === "source_escrow.source_escrow.spend");
        if (!sourceEscrowValidator) throw new Error("Source escrow validator not found in plutus.json");
        
        const script = {
            type: "PlutusV3" as const,
            script: sourceEscrowValidator.compiledCode
        };
        const scriptHash = validatorToScriptHash(script);
        
        const scriptRef = await uploadScript({
            script,
            scriptTag: "srcEscrow",
            lucidWithDeploymentAccount: lucid,
            network: "Custom" // Using emulator network
        });
        
        console.log("✅ Source escrow deployed successfully!");
        console.log(`Transaction hash: ${scriptRef.txHash}`);
        console.log(`Script hash: ${scriptHash}`);
        
        // Wait for a few blocks to confirm deployment
        await emulator.awaitBlock(5);
        
        return { scriptRef, scriptHash };
    } catch (error) {
        console.error("❌ Failed to deploy source escrow:", error);
        throw error;
    }
}

// Test the deployment and create escrow
async function testDeployment() {
    console.log("🚀 Starting deployment and escrow creation test...");
    
    // Deploy the script first
    const { scriptRef, scriptHash } = await deploySourceEscrow();
    console.log("Deployment completed successfully!");
    
    // Switch to taker account to get PKH
    lucid.selectWallet.fromPrivateKey(takerAccount.privateKey);
    const takerPkh = paymentCredentialOf(await lucid.wallet().address()).hash;
    
    // Switch to maker account to get PKH and create escrow
    lucid.selectWallet.fromPrivateKey(makerAccount.privateKey);
    const makerPkh = paymentCredentialOf(await lucid.wallet().address()).hash;
    
    // Generate secret and hash
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secret = bytesToHex(secretBytes);
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
    
    // Create the script address using the validator
    const spendingValidator = {
        type: "PlutusV3" as const,
        script: plutusJson.validators.find((v: any) => v.title === "source_escrow.source_escrow.spend")!.compiledCode
    };
    const scriptAddress = validatorToAddress("Custom", spendingValidator);
    
    // Build the transaction to lock 100 ADA in the escrow
    const tx = await lucid
        .newTx()
        .pay.ToContract(
            scriptAddress,
            { kind: "inline", value: datum },
            { lovelace: 100_000_000n } // 100 ADA in lovelace
        )
        .complete();
    
    // Sign and submit the transaction
    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();
    
    console.log("✅ Escrow created successfully!");
    console.log(`Escrow transaction hash: ${txHash}`);
    console.log(`Script address: ${scriptAddress}`);
    console.log(`Locked amount: 100 ADA`);
    console.log(`Expiration timestamp: ${expireTimestamp} (${new Date(expireTimestamp * 1000).toISOString()})`);
    console.log(`Secret hash: ${bytesToHex(secretHashBytes)}`);
    console.log(`Maker PKH: ${makerPkh}`);
    console.log(`Taker PKH: ${takerPkh}`);
    
    // Wait for transaction confirmation before querying UTXOs
    await emulator.awaitBlock(3);
    
    // Get the UTXO from the script address
    const scriptUtxos = await lucid.utxosAt(scriptAddress);
    console.log(`Found ${scriptUtxos.length} UTXOs at script address`);
    
    const escrowOutput = scriptUtxos.find(utxo => 
        utxo.txHash === txHash && utxo.outputIndex === 0
    );
    
    if (!escrowOutput) {
        throw new Error("Failed to retrieve escrow output UTXO");
    }
    
    console.log("Escrow UTXO found:", {
        address: escrowOutput.address,
        datum: escrowOutput.datum,
        datumHash: escrowOutput.datumHash,
        assets: escrowOutput.assets,
        outputIndex: escrowOutput.outputIndex,
        txHash: escrowOutput.txHash
    });
    
    // Switch to taker account for redemption
    lucid.selectWallet.fromPrivateKey(takerAccount.privateKey);
    
    // Create the redeemer for TakerClaim with the secret
    // TakerClaim is constructor 1 (index 1) with secret as ByteArray
    const redeemer = Data.to(new Constr(1, [bytesToHex(secretBytes)]));
    
    console.log("Attempting to redeem escrow...");
    console.log("Secret:", secret);
    console.log("Secret bytes length:", secretBytes.length);
    console.log("Redeemer:", redeemer);
    
    // Debug: Verify secret hash calculation
    const calculatedHash = bytesToHex(keccak_256(secretBytes));
    console.log("Calculated secret hash:", calculatedHash);
    console.log("Stored secret hash:", bytesToHex(secretHashBytes));
    console.log("Hashes match:", calculatedHash === bytesToHex(secretHashBytes));
    
    // Build the redemption transaction
    const redeemTx = await lucid
        .newTx()
        .addSignerKey(takerPkh) // Use taker's PKH since taker is redeeming
        .collectFrom([escrowOutput], redeemer)
        .attach.SpendingValidator(spendingValidator)
        .complete();

    // Sign with taker's wallet (required by validator)
    const signedRedeemTx = await redeemTx.sign.withWallet().complete();
    const redeemTxHash = await signedRedeemTx.submit();
    
    // Wait for redemption transaction confirmation
    await emulator.awaitBlock(3);
    
    console.log("✅ Escrow redeemed successfully!");
    console.log(`Redeem transaction hash: ${redeemTxHash}`);
    console.log(`Redeemed by taker with secret: ${secret}`);
    
    // Verify the UTXO was consumed
    const remainingUtxos = await lucid.utxosAt(scriptAddress);
    console.log(`Remaining UTXOs at script address: ${remainingUtxos.length}`);
    
    return {
        scriptRef,
        scriptHash,
        escrowTxHash: txHash,
        redeemTxHash,
        scriptAddress,
        datum,
        secret,
        secretHash: bytesToHex(secretHashBytes),
        expireTimestamp,
        makerPkh: makerPkh,
        takerPkh: takerPkh
    };
}

// Run the test if this file is executed directly
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
    await testDeployment();
}

export { deploySourceEscrow, testDeployment };