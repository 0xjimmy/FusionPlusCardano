import { Koios, Lucid, type LucidEvolution } from "@evolution-sdk/lucid";
import { signal } from "@preact/signals";

export const wallet = signal<LucidEvolution | null>(null);

export async function connectWallet() {
    if (!window.cardano.lace) throw new Error("Lace wallet not found");
    const api = await window.cardano.lace.enable();

    const lucid = wallet.value ?? await Lucid(new Koios("https://preview.koios.rest/api/v1", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyIjoic3Rha2UxdTkzNGs0eGtwenhncm5jdnh0NXFoMGtkNHVwdmVtYW5wczRlMHJ1bjVzamY5ZHMzZng4dTkiLCJleHAiOjE3NjA5NDMyNDEsInRpZXIiOjEsInByb2pJRCI6ImRlbW8tZnVzaW9uIn0.JY7hHVFSmpH8XPFyZ7qXvA04XktAM1YEaizq8CYRw1Y"), "Preview");
    lucid.selectWallet.fromAPI(api);
    wallet.value = lucid;

    return lucid;
}