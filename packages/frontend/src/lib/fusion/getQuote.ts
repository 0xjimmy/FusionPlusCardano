import { FUSION_BASE_URL } from "./constants";
import { getQuoteResponseSchema, type GetQuoteParams, type GetQuoteResponse } from "@fusion-cardano/shared";

export async function getQuote(params: GetQuoteParams): Promise<GetQuoteResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`${FUSION_BASE_URL}/quoter/v1.0/quote/receive?${searchParams.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HTTP error! status: ${response.status} ${response.statusText} ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return getQuoteResponseSchema.parse(data);
}


/* const quote = await getQuote({
  srcChain: NetworkEnum.BINANCE,
  dstChain: NetworkEnum.AVALANCHE,
  srcTokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  dstTokenAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" as `0x${string}`,
  amount: parseUnits("100", 18).toString(10),
  enableEstimate: true,
  walletAddress: "0x0000000000000000000000000000000000000000",
});
console.log(quote)
console.log(quote.presets.fast.secretsCount)

const secretsCount = quote.presets.fast.secretsCount;

const secrets = Array.from({ length: secretsCount }).map(() => encodePacked(["uint256"], [randBigInt(maxUint256)]));
const secretHashes = secrets.map((x) => HashLock.hashSecret(x) as `0x${string}`);

const hashLock =
    secretsCount === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(secretHashes.map((secretHash, i) => keccak256(encodePacked(["uint64", "bytes32"], [BigInt(i), secretHash])) as MerkleLeaf));

console.log(secrets);
console.log(secretHashes);
console.log(hashLock) */;
