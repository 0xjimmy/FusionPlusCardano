import { Data, fromText, generatePrivateKey, Koios, LucidEvolution, makeWalletFromPrivateKey, Network, Script } from "@evolution-sdk/lucid";

export async function uploadScript({
    script,
    scriptTag,
    lucidWithDeploymentAccount,
    network,
}: {
    script: Script,
    scriptTag: string,
    lucidWithDeploymentAccount: LucidEvolution,
    network: Network
}) {
    const storeAddress = await makeWalletFromPrivateKey(new Koios(`https://${network === "Mainnet" ? "api" : network.toLowerCase()}.koios.rest/api/v1`), network,  generatePrivateKey()).address()

    const tx = await lucidWithDeploymentAccount
        .newTx()
        .pay.ToAddressWithData(storeAddress, 
            { kind: "inline", value: Data.to<string>(fromText(scriptTag)) },
            { lovelace: 1n }, script)
        .complete();

    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();

    return { txHash, outputIndex: 0 };
}