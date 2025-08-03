import { Hono } from 'hono'
import { z } from 'zod'
import { Lucid, Blockfrost, Data, Constr, paymentCredentialOf } from '@evolution-sdk/lucid'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'



const completeSwap = new Hono()

const completeSwapSchema = z.object({
  txHash: z.string(),
  outputIndex: z.number(),
  secret: z.string()
})

const VALIDATOR_SCRIPT = {
  type: "PlutusV3" as const,
  script: "59022201010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e26466453001159800980098059baa0028cc004c03cc030dd500148c040c044c044c044c044c044c044c044c04400644646600200200644b30010018a508acc004cdc79bae30130010038a51899801001180a000a01c4045230103011301130113011301130113011001911919192cc004c028c040dd5000c566002601460206ea8c050c05400a266e20010dd6980a18089baa001899b89004375a602860226ea800500f4528201e3013001330113012001330119800980418071baa30123013001a60103d87a8000a60103d8798000403497ae0300e37546022601c6ea80092222259800980318081baa00c8acc004cc004c008c044dd50049bad30143011375400b1330033758600860226ea8024dd7180a180a98089baa0058a50403d159800cc004cc004c008c044dd50049bad30143011375400b4a14a2807a2b30013371e6f1cdd7180a18089baa00c375c6028602a602a602a60226ea80162660066eb0c010c044dd50049bae3014301530153011375400b14a0807a294100f201e45900a4c02cdd5003cc03c00d2225980098020014566002601e6ea802a007164041159800980400144c8c966002602a0050058b2024375c6026002601e6ea802a2c806900d0c034c038004dc3a400060126ea800e2c8038601000260066ea802229344d9590011"
}

completeSwap.post('/', async (c) => {
  try {
    const { txHash, outputIndex, secret } = completeSwapSchema.parse(await c.req.json())
    
    const lucid = await Lucid(
      new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", "preview3WZaOo77aEX908UT5PVU6rjqCOOneU4G"),
      "Preview"
    )
    
    lucid.selectWallet.fromPrivateKey(process.env.CARDANO_PRIVATE_KEY!)
    console.log('Lucid initialized with Blockfrost')
    const takerPkh = paymentCredentialOf(await lucid.wallet().address()).hash
    console.log(await lucid.wallet().address())

    const [escrowUtxo] = await lucid.utxosByOutRef([{ txHash, outputIndex }])
    if (!escrowUtxo || !escrowUtxo.datum) {
      return c.json({ error: 'UTXO not found or missing datum' }, 404)
    }

    const parsedDatum = Data.from(escrowUtxo.datum)
    if (!parsedDatum.fields || parsedDatum.fields.length !== 4) {
      return c.json({ error: 'Invalid datum structure' }, 400)
    }
    
    const [expireTimestamp, , , secretHash] = parsedDatum.fields

    const cleanSecret = secret.startsWith('0x') ? secret.slice(2) : secret
    const calculatedHash = bytesToHex(keccak_256(hexToBytes(cleanSecret)))
    
    if (calculatedHash !== secretHash) {
      return c.json({ error: 'Invalid secret' }, 400)
    }
    
    if (Math.floor(Date.now() / 1000) >= Number(expireTimestamp)) {
      return c.json({ error: 'Escrow expired' }, 400)
    }

    const redeemer = Data.to(new Constr(1, [cleanSecret]))

    const spendingValidator = {
      type: "PlutusV3" as const,
      script: VALIDATOR_SCRIPT.script
    }

    const tx = await lucid
      .newTx()
      .addSignerKey(takerPkh)
      .collectFrom([escrowUtxo], redeemer)
      .attach.SpendingValidator(spendingValidator)
      .complete()

    const signedTx = await tx.sign.withWallet().complete()
    const redeemTxHash = await signedTx.submit()

    return c.json({ txHash: redeemTxHash })

  } catch (error) {
    console.error('Complete swap error:', error)
    return c.json({ error: 'Failed to complete swap', details: error instanceof Error ? error.message : String(error) }, 500)
  }
})

export default completeSwap