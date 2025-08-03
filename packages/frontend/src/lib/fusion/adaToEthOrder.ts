import { SDK, HashLock, randBigInt, type QuoteParams, OrderStatus, type MerkleLeaf, CustomNetworkEnum } from "@1inch/cross-chain-sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ViemProviderConnector } from "./viemProviderConnector";
import { keccak256, encodePacked } from "viem/utils";
import { maxUint256, parseUnits, formatUnits } from "viem";
import type { LucidEvolution } from "@evolution-sdk/lucid";
import { validatorToAddress, Data, Constr, paymentCredentialOf } from "@evolution-sdk/lucid";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { TAKER_ADDRESS } from "./constants";

export async function createAdaToEthOrder(adaAmount: string, lucid: LucidEvolution) {
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
  
  const hashLock = secretsCount === 1
    ? HashLock.forSingleFill(secrets[0])
    : HashLock.forMultipleFills(
        secretHashes.map((secretHash, i) => 
          keccak256(encodePacked(["uint64", "bytes32"], [BigInt(i), secretHash])) as MerkleLeaf
        )
      );

  console.log("Quote received:", quoteWithSdk);

  // Create the order
  const order = await sdk.createOrder(quoteWithSdk, {
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
  
  // For now, we'll use a hardcoded taker PKH from constants
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
  
  // Create the script address using the validator
  // For now, we'll use a placeholder script - in production this would come from deployment
  const spendingValidator = {
    type: "PlutusV3" as const,
    script: "5909f101010029800aba4aba2aba1aba0aab9faab9eaab9dab9cab9a4888888888c96600264653001300a00198051805800cdc3a4005300a0024888966002600460146ea800e2646644b300100789919912cc004c00c0062b300130113754015002806a0248acc004c020006264b300100180744c96600200300f807c03e01f13259800980c001c01602080a8dd7000a0303015001404c60226ea802a01a807100e0a99806a4811a736f757263655f657363726f775f7370656e643a20737461727400159800980098071baa0028cc004c048c03cdd500148c04cc050c050c05000646026602860280032301330140019112cc004cdc48012400110018cc00400e66e10009201499b8b3370066e14009201448180005003201e91111919800800802912cc004006200b13259800800c4cc010c06400801a26600a60320046600600600280b8c064005016244444464646464a6602e66e58cdcb19b963372c66e58cdcb19b964910e646174756d5f7061727365643a2000373266002603860326ea80292201004901022c2000373266002600e60326ea80292201004901022c2000373266002601060326ea80292201004901022c2000373266002601260326ea8029220100198009180e980f180f180f180f180f180f180f180f000c88c8cc00400400c896600200314a115980099b8f375c604000200714a31330020023021001406880f24603a603c603c603c603c603c603c603c0032232323259800980a980e9baa0018acc004c054c074dd51810981100144cdc40021bad3021301e37540031337120086eb4c084c078dd5000a0368a50406c60400026603c603e0026603d30013013301b3754603e60400034c103d87a8000a60103d8798000406497ae0301b3754603c60366ea80092222598009807980e1baa0168a9980da491472656465656d65723a204d616b6572436c61696d0013253301c3372c66e58cdcb19b963372c9211574696d655f636865636b3a20657870697265642c200037326600d3001001a60103d87a8000a60103d8798000406c9101004901022c200037326600c6006603c6ea80512201004901022c200037326600c6042603c6ea803d22010013253301d3372c66e58cdcb19b963372c9211f7369676e61747572655f636865636b3a206d616b65725f7369676e65642c200037326600f3001001a60103d87a8000a60103d879800040709101004901022c200037326600e600c603e6ea80552201004901022c200037326600e601a603e6ea804122010013253301e3372c9201146d616b65725f636c61696d5f726573756c743a20003732660113001001a60103d87a8000a60103d8798000407491010010015980080144006294101c198021bac3005301e37540286eb8c030c078dd5007998009801180e9baa013375a6040603a6ea803a264a6603866e592411672656465656d65723a2054616b6572436c61696d2c200037326600c6ea400522010013253301d3372c66e58cdcb19b963372c9211974696d655f636865636b3a206e6f745f657870697265642c200037326600f3001001a60103d87a8000a60103d879800040709101004901022c200037326600e6008603e6ea80552201004901022c200037326600e6044603e6ea804122010013253301e3372c66e58cdcb19b963372c921247365637265745f76616c69646174696f6e3a2063616c63756c617465645f686173682c20003732660106ea40052201004901022c200049010b73746f7265645f68617368004901022c2000373266010602060406ea804522010013253301f3372c9201217365637265745f76616c69646174696f6e3a207365637265745f76616c69642c20003732660133001001a60103d87a8000a60103d879800040789101001325330203372c66e58cdcb19b963372c9211f7369676e61747572655f636865636b3a2074616b65725f7369676e65642c20003732660153001001a60103d87a8000a60103d8798000407c9101004901022c2000373266014601260446ea80612201004901022c2000373266014602260446ea804d2201001325330213372c66e58cdcb19b963372c66e58cdcb24811474616b65725f636c61696d5f726573756c743a20003732660173001001a60103d87a8000a60103d879800040809101004901022c20003732660173001005a60103d87a8000a60103d879800040809101004901022c20003732660173001003a60103d87a8000a60103d879800040809101004901022c20003732660173001002a60103d87a8000a60103d87980004080910100100159800802456600200510018a50407d14a080f8cc01cdd6180418109baa017375c602060426ea8048cdc78009bae3010302037540226f1c00a6002660046006603c6ea8050dd69810980f1baa00fa50a51406c6eb8c080c074dd500b20341800800911192cc00400e2646466446601200466e29220101280059800800c4cdc52441035b5d2900006899b8a489035b5f20009800800ccdc52441025d2900006914c00402a00530070014029229800805400a002805100b20405980099b880014803a266e0120f2010018acc004cdc4000a41000513370066e01208014001480362c80d101a1bac301d002375a60360026466ec0dd4180d8009ba7301c001375400713259800800c4cdc52441027b7d00003899b8a489037b5f20009800800ccdc52441015d00003914c00401e0053004001401d229800803c00a0028039008203a3758007133005375a0060051323371491102682700329800800ccdc01b8d0024800666e292210127000044004444b3001337100049000440062646645300100699b800054800666e2ccdc00012cc004cdc40012402914818229037203e3371666e000056600266e2000520148a40c11481b901f002200c33706002901019b8600148080cdc70020012038375c0068100dc5245022c200022323300100100322598009806000c4cdc52450130000038acc004cdc4000a40011337149101012d0033002002337029000000c4cc014cdc2000a402866e2ccdc019b85001480512060003405c80b8c008009153300d49011e65787065637420536f6d6528646174756d29203d20646174756d5f6f707400164030601c6ea8020dc3a400100a805402a0148098c03c004c03cc040004c02cdd5001c54cc02524011e736f757263655f657363726f775f7370656e643a206661696c5f656c736500164020300a00130053754017149a2a660069211856616c696461746f722072657475726e65642066616c7365001365640082a6600492011672656465656d65723a205377617052656465656d6572001601"
  };
  
  const scriptAddress = validatorToAddress("Custom", spendingValidator);
  
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
 
  lucid.awaitTx(escrowTxHash)



  // Submit the order
  const submitOrder = await sdk.submitOrder(
    quoteWithSdk.srcChainId, 
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