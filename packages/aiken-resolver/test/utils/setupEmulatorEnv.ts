import { Lucid, Emulator, generateEmulatorAccountFromPrivateKey, Koios } from "@evolution-sdk/lucid";

export const makeEmulatorEnv = async () => {

    const koisPreviewProvider = new Koios("https://preprod.koios.rest/api/v1")
    const previewParameters = await koisPreviewProvider.getProtocolParameters()

    const makerAccount = generateEmulatorAccountFromPrivateKey({
        lovelace: 100_000_000_000n, // 90,000 ADA
    });

    const takerAccount = generateEmulatorAccountFromPrivateKey({
        lovelace: 100_000_000_000n, // 90,000 ADA
    });

    const deploymentAccount = generateEmulatorAccountFromPrivateKey({
        lovelace: 100_000_000_000n, // 90,000 ADA
    });

    const emulator = new Emulator([
        makerAccount,
        takerAccount,
        deploymentAccount,
    ], previewParameters);

    const lucid = await Lucid(emulator, "Custom");

    return {
        lucid,
        makerAccount,
        takerAccount,
        deploymentAccount,
        emulator,
    }
}