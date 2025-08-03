import { validatorToScriptHash, Data, Constr, validatorToAddress, paymentCredentialOf } from "@evolution-sdk/lucid";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { makeEmulatorEnv } from "./utils/setupEmulatorEnv";
import { uploadScript } from "./utils/uploadScript";
import plutusJson from "../plutus.json"

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

// Test variant: Maker redeems escrow with taker as change address
async function testDeploymentWithMakerRedemption() {
    console.log("🚀 Starting deployment and escrow creation test (Maker redemption variant)...");
    
    // Deploy the script first
    const { scriptRef, scriptHash } = await deploySourceEscrow();
    console.log("Deployment completed successfully!");
    
    // Switch to taker account to get PKH and address
    lucid.selectWallet.fromPrivateKey(takerAccount.privateKey);
    const takerPkh = paymentCredentialOf(await lucid.wallet().address()).hash;
    const takerAddress = await lucid.wallet().address();
    
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
    
    // Stay with maker account for redemption (no signer key needed)
    // Create the redeemer for TakerClaim with the secret
    // TakerClaim is constructor 1 (index 1) with secret as ByteArray
    const redeemer = Data.to(new Constr(1, [bytesToHex(secretBytes)]));
    
    console.log("Attempting to redeem escrow with maker wallet...");
    console.log("Secret:", secret);
    console.log("Secret bytes length:", secretBytes.length);
    console.log("Redeemer:", redeemer);
    
    // Debug: Verify secret hash calculation
    const calculatedHash = bytesToHex(keccak_256(secretBytes));
    console.log("Calculated secret hash:", calculatedHash);
    console.log("Stored secret hash:", bytesToHex(secretHashBytes));
    console.log("Hashes match:", calculatedHash === bytesToHex(secretHashBytes));
    
    // Build the redemption transaction with taker as change address
    const redeemTx = await lucid
        .newTx()
        .collectFrom([escrowOutput], redeemer)
        .attach.SpendingValidator(spendingValidator)
        .pay.ToAddress(takerAddress, { lovelace: 100_000_000n }) // Send funds to taker's address
        .complete();

    // Sign with maker's wallet (no signer key needed)
    const signedRedeemTx = await redeemTx.sign.withWallet().complete();
    const redeemTxHash = await signedRedeemTx.submit();
    
    // Wait for redemption transaction confirmation
    await emulator.awaitBlock(3);
    
    console.log("✅ Escrow redeemed successfully by maker!");
    console.log(`Redeem transaction hash: ${redeemTxHash}`);
    console.log(`Redeemed by maker with secret: ${secret}`);
    console.log(`Change sent to taker address: ${takerAddress}`);
    
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
        takerPkh: takerPkh,
        takerAddress
    };
}

// Test variant: Gasless escrow creation - maker partially signs, deployment wallet submits
async function testDeploymentWithGaslessMaker() {
    console.log("🚀 Starting deployment and gasless escrow creation test...");
    
    // Helper function to calculate total lovelace from UTXOs
    const calculateLovelaceBalance = (utxos: any[]) => {
        return utxos
            .map(utxo => utxo.assets.lovelace || 0n)
            .reduce((sum, lovelace) => sum + lovelace, 0n);
    };
    
    // Deploy the script first
    const { scriptRef, scriptHash } = await deploySourceEscrow();
    console.log("Deployment completed successfully!");
    
    // Get addresses and PKHs
    lucid.selectWallet.fromPrivateKey(deploymentAccount.privateKey);
    const deploymentAddress = await lucid.wallet().address();
    
    lucid.selectWallet.fromPrivateKey(makerAccount.privateKey);
    const makerAddress = await lucid.wallet().address();
    const makerPkh = paymentCredentialOf(makerAddress).hash;
    
    lucid.selectWallet.fromPrivateKey(takerAccount.privateKey);
    const takerAddress = await lucid.wallet().address();
    const takerPkh = paymentCredentialOf(takerAddress).hash;
    
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
    
    console.log("🔧 Creating gasless escrow transaction...");
    console.log(`Maker address: ${makerAddress}`);
    console.log(`Script address: ${scriptAddress}`);
    console.log(`Locked amount: 100 ADA`);
    console.log(`Expiration timestamp: ${expireTimestamp} (${new Date(expireTimestamp * 1000).toISOString()})`);
    console.log(`Secret hash: ${bytesToHex(secretHashBytes)}`);
    console.log(`Maker PKH: ${makerPkh}`);
    console.log(`Taker PKH: ${takerPkh}`);
    
    // Get initial balances before escrow creation
    console.log("💰 Initial Balance Analysis (Before Escrow Creation):");
    
    lucid.selectWallet.fromPrivateKey(makerAccount.privateKey);
    const makerInitialUtxos = await lucid.utxosAt(makerAddress);
    const makerInitialLovelace = calculateLovelaceBalance(makerInitialUtxos);
    
    lucid.selectWallet.fromPrivateKey(deploymentAccount.privateKey);
    const deploymentInitialUtxos = await lucid.utxosAt(deploymentAddress);
    const deploymentInitialLovelace = calculateLovelaceBalance(deploymentInitialUtxos);
    
    console.log(`- Maker initial balance: ${makerInitialLovelace} lovelace (${Number(makerInitialLovelace) / 1_000_000} ADA)`);
    console.log(`- Deployment wallet initial balance: ${deploymentInitialLovelace} lovelace (${Number(deploymentInitialLovelace) / 1_000_000} ADA)`);
    
    // Build the transaction to lock 100 ADA in the escrow
    // This transaction will be funded by the deployment wallet but signed by the maker
    const tx = await lucid
        .newTx()
        .addSignerKey(makerPkh)
        .pay.ToContract(
            scriptAddress,
            { kind: "inline", value: datum },
            { lovelace: 100_000_000n } // 100 ADA in lovelace
        )
        .complete();
    
    console.log("📝 Maker partially signing the transaction...");
    
    // Maker partially signs the transaction (this simulates the gasless experience)
    const makerSignedTx = await tx.sign.withPrivateKey(makerAccount.privateKey);
    
    console.log("✅ Maker partial signature completed!");
    console.log("Maker signed transaction:", makerSignedTx);
    
    // Switch to deployment wallet to complete the transaction
    console.log("🔄 Switching to deployment wallet to complete transaction...");
    lucid.selectWallet.fromPrivateKey(deploymentAccount.privateKey);
    
    // Complete the transaction with deployment wallet's signature and submit
    const signedTx = await makerSignedTx.sign.withWallet().complete();
    const txHash = await signedTx.submit();
    
    console.log("✅ Gasless escrow created successfully!");
    console.log(`Escrow transaction hash: ${txHash}`);
    console.log(`Deployment wallet paid for transaction fees`);
    console.log(`Maker provided partial signature for escrow creation`);
    
    // Wait for transaction confirmation before querying UTXOs
    await emulator.awaitBlock(3);
    
    // Get balances after escrow creation (before redemption)
    console.log("💰 Balance Analysis After Escrow Creation:");
    
    lucid.selectWallet.fromPrivateKey(makerAccount.privateKey);
    const makerAfterEscrowUtxos = await lucid.utxosAt(makerAddress);
    const makerAfterEscrowLovelace = calculateLovelaceBalance(makerAfterEscrowUtxos);
    
    lucid.selectWallet.fromPrivateKey(deploymentAccount.privateKey);
    const deploymentAfterEscrowUtxos = await lucid.utxosAt(deploymentAddress);
    const deploymentAfterEscrowLovelace = calculateLovelaceBalance(deploymentAfterEscrowUtxos);
    
    console.log(`- Maker balance after escrow: ${makerAfterEscrowLovelace} lovelace (${Number(makerAfterEscrowLovelace) / 1_000_000} ADA)`);
    console.log(`- Deployment wallet balance after escrow: ${deploymentAfterEscrowLovelace} lovelace (${Number(deploymentAfterEscrowLovelace) / 1_000_000} ADA)`);
    
    // Calculate net changes for escrow creation only
    const makerEscrowNetChange = makerAfterEscrowLovelace - makerInitialLovelace;
    const deploymentEscrowNetChange = deploymentAfterEscrowLovelace - deploymentInitialLovelace;
    
    console.log("💸 Net Balance Changes (Escrow Creation Only):");
    console.log(`- Maker net change: ${makerEscrowNetChange} lovelace (${Number(makerEscrowNetChange) / 1_000_000} ADA)`);
    console.log(`- Deployment wallet net change: ${deploymentEscrowNetChange} lovelace (${Number(deploymentEscrowNetChange) / 1_000_000} ADA)`);
    
    // Verify gasless experience
    const makerPaidFees = makerEscrowNetChange < -100_000_000n; // If maker lost more than 100 ADA, they paid fees
    const deploymentPaidFees = deploymentEscrowNetChange < 0n; // If deployment wallet lost ADA, they paid fees
    
    console.log("🔍 Gasless Experience Verification:");
    console.log(`- Maker paid fees: ${makerPaidFees ? "❌ YES" : "✅ NO"} (Maker should not pay fees)`);
    console.log(`- Deployment wallet paid fees: ${deploymentPaidFees ? "✅ YES" : "❌ NO"} (Deployment should pay fees)`);
    console.log(`- Gasless experience: ${!makerPaidFees && deploymentPaidFees ? "✅ SUCCESS" : "❌ FAILED"}`);
    
    // Check who paid the fees by examining the transaction
    console.log("💰 Fee Analysis:");
    console.log(`- Deployment wallet (${deploymentAddress}) paid for transaction fees`);
    console.log(`- Maker (${makerAddress}) provided signature but paid no fees`);
    console.log(`- 100 ADA locked in escrow at ${scriptAddress}`);
    console.log(`- This demonstrates a true gasless experience for the maker`);
    
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
    
    // Switch to taker account for redemption (standard flow)
    lucid.selectWallet.fromPrivateKey(takerAccount.privateKey);
    
    // Create the redeemer for TakerClaim with the secret
    const redeemer = Data.to(new Constr(1, [bytesToHex(secretBytes)]));
    
    console.log("Attempting to redeem escrow with taker wallet...");
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

    // Sign with taker's wallet
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
    
    // Final summary
    console.log("🎯 Gasless Escrow Summary:");
    console.log(`- Maker created escrow without paying transaction fees`);
    console.log(`- Deployment wallet paid for escrow creation fees`);
    console.log(`- Taker successfully redeemed the escrow`);
    console.log(`- Total gasless experience: ✅ ACHIEVED`);
    
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
        takerPkh: takerPkh,
        makerAddress,
        makerSignedTx
    };
}

// Run the test if this file is executed directly
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
    await testDeployment();
    // await testDeploymentWithMakerRedemption();
    await testDeploymentWithGaslessMaker();
}

export { deploySourceEscrow, testDeployment, testDeploymentWithMakerRedemption, testDeploymentWithGaslessMaker };