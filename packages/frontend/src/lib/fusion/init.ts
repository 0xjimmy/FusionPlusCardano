import { SDK } from "@1inch/cross-chain-sdk";

export async function main() {
  const sdk = new SDK({
    url: "http://localhost:8787/fusionplus",
    authKey: "FAKE_KEY",
  });

  const orders = await sdk.getActiveOrders({ page: 1, limit: 2 });
  console.log(orders)
}
