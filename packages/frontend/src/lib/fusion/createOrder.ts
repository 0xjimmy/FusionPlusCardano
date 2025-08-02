import { SDK, HashLock, randBigInt, NetworkEnum, type QuoteParams, OrderStatus } from "@1inch/cross-chain-sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ViemProviderConnector } from "./viemProviderConnector";
import { keccak256, encodePacked } from "viem/utils";
import { maxUint256, parseUnits } from "viem";
// import { getQuote } from "./getQuote";

export async function createOrder() {

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
    // url: "https://api.1inch.dev/fusion-plus",
    //   authKey: "FAKE_KEY",
    authKey: "78gSpwG6wWBjCJuud3RIiqUPkForIQ5Y",
    blockchainProvider,
  });

  const params = {
    srcChain: NetworkEnum.BINANCE,
    dstChain: NetworkEnum.AVALANCHE,
    srcTokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as `0x${string}`,
    dstTokenAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" as `0x${string}`,
    amount: encodePacked(["uint256"], [parseUnits("100", 18)]),
    enableEstimate: true,
    walletAddress: makerAddress,
  };

  // const quote = await getQuote(params);
  
  const sdkQuoteParams: QuoteParams = {
    srcChainId: NetworkEnum.BINANCE,
    dstChainId: NetworkEnum.AVALANCHE,
    srcTokenAddress: params.srcTokenAddress,
    dstTokenAddress: params.dstTokenAddress,
    amount: params.amount,
    walletAddress: params.walletAddress,
    enableEstimate: true,
  };
  const quoteWithSdk = await sdk.getQuote(sdkQuoteParams);

  const secretsCount = quoteWithSdk.getPreset().secretsCount;
  const secrets = Array.from({ length: secretsCount }).map(() => encodePacked(["uint256"], [randBigInt(maxUint256)]));
  const secretHashes = secrets.map((x) => HashLock.hashSecret(x) as `0x${string}`);
  const hashLock =
    secretsCount === 1
      ? HashLock.forSingleFill(secrets[0])
      : HashLock.forMultipleFills(secretHashes.map((secretHash, i) => keccak256(encodePacked(["uint64", "bytes32"], [BigInt(i), secretHash])) as MerkleLeaf));

  console.log(quoteWithSdk)

  const order = await sdk
    .createOrder(quoteWithSdk, {
      walletAddress: makerAddress,
      hashLock,
      secretHashes,
      // fee is an optional field
      fee: {
        takingFeeBps: 100, // 1% as we use bps format, 1% is equal to 100bps
        takingFeeReceiver: "0x0000000000000000000000000000000000000000", //  fee receiver address
      },
    });

  console.log(order.hash)

  const submitOrder = await sdk.submitOrder(quoteWithSdk.srcChainId, order.order, order.quoteId, secretHashes)
  console.log(submitOrder.orderHash)
  console.log(submitOrder)

  let status: OrderStatus | undefined | string = undefined
  while (status !== "SKIBIDI") {
    const orderStatus = await sdk.getOrderStatus(submitOrder.orderHash)
    console.log(orderStatus)
    status = orderStatus.status
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return submitOrder; 
}