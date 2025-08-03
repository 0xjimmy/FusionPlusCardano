import { Lucid, Koios, fromHex, toHex, validatorToAddress, Data, Constr } from "@evolution-sdk/lucid";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function deployToPreview() {
    try {
        console.log("🚀 Starting deployment to Cardano Preview Network...");

        // Check for deployment private key
        const deploymentPk = process.env.DEPLOYMENT_PK;
        if (!deploymentPk) {
            throw new Error("DEPLOYMENT_PK not found in .env file");
        }

        // Initialize Lucid with preview network
        const lucid = await Lucid(
            new Koios("https://preview.koios.rest/api/v1"),
            "Preview"
        );

        // Set the wallet from private key
        lucid.selectWallet.fromPrivateKey(deploymentPk);

        // Get wallet address
        const address = await lucid.wallet().address();
        console.log("📍 Deployer address:", address);

        // Read the compiled validator from plutus.json
        const plutusPath = path.join(process.cwd(), "plutus.json");
        if (!fs.existsSync(plutusPath)) {
            throw new Error("plutus.json not found. Run 'aiken build' first.");
        }

        const plutusData = JSON.parse(fs.readFileSync(plutusPath, "utf8"));
        
        // Find the source_escrow validator
        const sourceEscrowValidator = plutusData.validators.find(
            (v: any) => v.title === "source_escrow.source_escrow.spend"
        );

        if (!sourceEscrowValidator) {
            throw new Error("source_escrow validator not found in plutus.json");
        }

        console.log("📜 Found validator:", sourceEscrowValidator.title);
        console.log("🔑 Validator hash:", sourceEscrowValidator.hash);

        // Create the validator script
        const validator = {
            type: "PlutusV3" as const,
            script: sourceEscrowValidator.compiledCode,
        };

        // Get the script address
        const scriptAddress = validatorToAddress("Preview", validator);
        console.log("🏠 Script address:", scriptAddress);

        // Build the transaction to deploy the script
        const tx = await lucid
            .newTx()
            .pay.ToAddress(
                scriptAddress,
                { lovelace: 2000000n } // 2 ADA for script deployment
            )
            .complete();

        // Sign the transaction
        const signedTx = await tx.sign.withWallet().complete();

        // Submit the transaction
        console.log("📤 Submitting transaction...");
        const txHash = await signedTx.submit();
        
        console.log("✅ Transaction submitted successfully!");
        console.log("🔗 Transaction hash:", txHash);

        // Wait for confirmation
        console.log("⏳ Waiting for transaction confirmation...");
        await lucid.awaitTx(txHash);
        console.log("✅ Transaction confirmed!");

        // Get the output index (UTXO index)
        const utxos = await lucid.utxosAt(scriptAddress);
        const deployedUtxo = utxos.find(utxo => 
            utxo.txHash === txHash && utxo.outputIndex === 0
        );

        if (deployedUtxo) {
            console.log("📊 Deployment Details:");
            console.log("   Transaction Hash:", txHash);
            console.log("   Output Index:", deployedUtxo.outputIndex);
            console.log("   Script Hash:", sourceEscrowValidator.hash);
            console.log("   Script Address:", scriptAddress);
            console.log("   Amount Locked:", deployedUtxo.assets.lovelace);
        }

        // Save deployment info to file
        const deploymentInfo = {
            network: "preview",
            txHash,
            outputIndex: deployedUtxo?.outputIndex || 0,
            scriptHash: sourceEscrowValidator.hash,
            scriptAddress,
            deployedAt: new Date().toISOString(),
            validator: sourceEscrowValidator.title
        };

        const deploymentPath = path.join(process.cwd(), "deployment-preview.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("💾 Deployment info saved to:", deploymentPath);

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Run the deployment
deployToPreview(); 