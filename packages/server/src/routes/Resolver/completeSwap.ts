import { Hono } from 'hono'
import { z } from 'zod'
import { Lucid, Koios, Data, Constr, validatorToAddress, paymentCredentialOf, UTxO } from '@evolution-sdk/lucid'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

// Deployed script configuration for Preview network
const DEPLOYED_SCRIPT_ADDRESS = "addr_test1wr7sx8cj5m8ss046gygzuwmswedf3kq4lqxdhqq8qn9zt2g8lqjr0"
const SCRIPT_REF_TX_HASH = "00cc0f9cfbc9bdf5aae746a6a9ea2831a1e3d68ed5c190358237c4e225cf76f8"
const SCRIPT_REF_OUTPUT_INDEX = 0

const completeSwap = new Hono()

const completeSwapSchema = z.object({
  txHash: z.string().min(1, 'Transaction hash is required'),
  outputIndex: z.number().min(0, 'Output index must be non-negative'),
  secret: z.string().min(1, 'Secret is required')
})

// Plutus validator script from aiken-resolver
const VALIDATOR_SCRIPT = {
  type: "PlutusV3" as const,
  script: "59022201010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e26466453001159800980098059baa0028cc004c03cc030dd500148c040c044c044c044c044c044c044c044c04400644646600200200644b30010018a508acc004cdc79bae30130010038a51899801001180a000a01c4045230103011301130113011301130113011001911919192cc004c028c040dd5000c566002601460206ea8c050c05400a266e20010dd6980a18089baa001899b89004375a602860226ea800500f4528201e3013001330113012001330119800980418071baa30123013001a60103d87a8000a60103d8798000403497ae0300e37546022601c6ea80092222259800980318081baa00c8acc004cc004c008c044dd50049bad30143011375400b1330033758600860226ea8024dd7180a180a98089baa0058a50403d159800cc004cc004c008c044dd50049bad30143011375400b4a14a2807a2b30013371e6f1cdd7180a18089baa00c375c6028602a602a602a60226ea80162660066eb0c010c044dd50049bae3014301530153011375400b14a0807a294100f201e45900a4c02cdd5003cc03c00d2225980098020014566002601e6ea802a007164041159800980400144c8c966002602a0050058b2024375c6026002601e6ea802a2c806900d0c034c038004dc3a400060126ea800e2c8038601000260066ea802229344d9590011"
}

completeSwap.post('/', async (c) => {
  console.log('=== COMPLETE SWAP REQUEST STARTED ===')
  
  try {
    console.log('1. Parsing request body...')
    const body = await c.req.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))
    
    console.log('2. Validating request schema...')
    const validation = completeSwapSchema.safeParse(body)
    
    if (!validation.success) {
      console.error('Schema validation failed:', validation.error.issues)
      return c.json({ 
        error: 'Invalid request body',
        details: validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      }, 400)
    }
    
    const { txHash, outputIndex, secret } = validation.data
    console.log('3. Request validated successfully')
    console.log(`UTXO: ${txHash}#${outputIndex}`)
    console.log(`Secret provided: ${secret.substring(0, 8)}...`)

    // Check for required environment variables
    console.log('4. Checking environment variables...')
    const cardanoPrivateKey = process.env.CARDANO_PRIVATE_KEY
    const koiosApiKey = process.env.KOIOS_API_KEY
    
    console.log('Environment check:', {
      hasCardanoPrivateKey: !!cardanoPrivateKey,
      hasKoiosApiKey: !!koiosApiKey
    })
    
    if (!cardanoPrivateKey) {
      console.error('Missing CARDANO_PRIVATE_KEY environment variable')
      return c.json({ 
        error: 'Server configuration error',
        details: 'CARDANO_PRIVATE_KEY environment variable is required'
      }, 500)
    }
    
    if (!koiosApiKey) {
      console.error('Missing KOIOS_API_KEY environment variable')
      return c.json({ 
        error: 'Server configuration error',
        details: 'KOIOS_API_KEY environment variable is required'
      }, 500)
    }

    console.log('5. Initializing Lucid with Koios provider...')
    // Initialize Lucid with Koios provider for Preview network
    const lucid = await Lucid(
      new Koios("https://preview.koios.rest/api/v1", koiosApiKey),
      "Preview"
    )
    console.log('Lucid initialized successfully')
    
    // Set the wallet from private key
    lucid.selectWallet.fromPrivateKey(cardanoPrivateKey)
    const takerAddress = await lucid.wallet().address()
    const takerPkh = paymentCredentialOf(takerAddress).hash

    console.log(`Taker address: ${takerAddress}`)
    console.log(`Taker PKH: ${takerPkh}`)

    // Use the deployed script address
    const scriptAddress = DEPLOYED_SCRIPT_ADDRESS
    console.log(`Script address (deployed): ${scriptAddress}`)

    // Fetch the specific UTXO by transaction hash and output index
    let escrowUtxo: UTxO
    try {
      const [utxo] = await lucid.utxosByOutRef([{ txHash, outputIndex }])
      if (!utxo) {
        return c.json({
          error: 'UTXO not found',
          details: `No UTXO found at ${txHash}#${outputIndex}`
        }, 404)
      }
      escrowUtxo = utxo
      console.log('UTXO fetched directly by outRef:', {
        txHash: escrowUtxo.txHash,
        outputIndex: escrowUtxo.outputIndex,
        address: escrowUtxo.address,
        assets: escrowUtxo.assets
      })
    } catch (error) {
      console.error('Failed to fetch UTXO by outRef:', error instanceof Error ? error.message : 'Unknown error')
      return c.json({
        error: 'Failed to fetch UTXO',
        details: error instanceof Error ? error.message : 'Unknown error occurred while fetching UTXO'
      }, 500)
    }

    // Verify the UTXO is at the expected script address
    if (escrowUtxo.address !== scriptAddress) {
      return c.json({
        error: 'UTXO address mismatch',
        details: `UTXO is at address ${escrowUtxo.address}, expected ${scriptAddress}`
      }, 400)
    }

    console.log('Escrow UTXO details:', {
      txHash: escrowUtxo.txHash,
      outputIndex: escrowUtxo.outputIndex,
      assets: escrowUtxo.assets,
      datum: escrowUtxo.datum
    })

    // Parse the datum
    if (!escrowUtxo.datum) {
      return c.json({
        error: 'Invalid escrow UTXO',
        details: 'UTXO does not contain required datum'
      }, 400)
    }

    let parsedDatum: any
    try {
      parsedDatum = Data.from(escrowUtxo.datum)
      console.log('Parsed datum:', parsedDatum)
    } catch (error) {
      return c.json({
        error: 'Failed to parse datum',
        details: error instanceof Error ? error.message : 'Unknown parsing error'
      }, 400)
    }

    // Extract datum fields (SwapDatum constructor 0 with 4 fields)
    if (!parsedDatum || !Array.isArray(parsedDatum.fields) || parsedDatum.fields.length !== 4) {
      return c.json({
        error: 'Invalid datum structure',
        details: 'Expected SwapDatum with 4 fields: [expire_timestamp, maker_address, taker_address, secret_hash]'
      }, 400)
    }

    const [expireTimestamp, makerAddress, takerAddressFromDatum, secretHash] = parsedDatum.fields
    
    console.log('Datum fields:', {
      expireTimestamp: expireTimestamp.toString(),
      makerAddress,
      takerAddressFromDatum,
      secretHash
    })

    // Validate the secret by hashing it with Keccak256
    let secretBytes: Uint8Array
    try {
      // Convert hex secret to bytes (remove 0x prefix if present)
      const cleanSecret = secret.startsWith('0x') ? secret.slice(2) : secret
      secretBytes = hexToBytes(cleanSecret)
    } catch (error) {
      return c.json({
        error: 'Invalid secret format',
        details: 'Secret must be a valid hex string'
      }, 400)
    }
    
    // Calculate the hash of the provided secret
    const calculatedHashBytes = keccak_256(secretBytes)
    const calculatedHash = bytesToHex(calculatedHashBytes)
    
    console.log('Secret validation:', {
      providedSecret: secret.substring(0, 8) + '...',
      calculatedHash,
      storedHash: secretHash,
      hashesMatch: calculatedHash === secretHash
    })
    
    // Verify the secret hash matches
    if (calculatedHash !== secretHash) {
      return c.json({
        error: 'Invalid secret',
        details: 'The provided secret does not match the stored hash'
      }, 400)
    }

    // Check if the escrow has not expired yet (taker can only claim before expiry)
    const currentTime = Math.floor(Date.now() / 1000)
    const expireTime = Number(expireTimestamp)
    
    if (currentTime >= expireTime) {
      return c.json({
        error: 'Escrow expired',
        details: `Escrow expired at ${new Date(expireTime * 1000).toISOString()}. Current time: ${new Date(currentTime * 1000).toISOString()}`
      }, 400)
    }

    console.log('Time validation:', {
      currentTime,
      expireTime,
      timeRemaining: expireTime - currentTime,
      notExpired: currentTime < expireTime
    })

    // Create the TakerClaim redeemer (constructor 1 with secret as hex string)
    // The secret should be a hex string without 0x prefix for Cardano serialization
    const cleanSecret = secret.startsWith('0x') ? secret.slice(2) : secret
    const redeemer = Data.to(new Constr(1, [cleanSecret]))
    console.log('Created TakerClaim redeemer:', redeemer)

    // Fetch the script reference UTXO from deployment configuration
    const [scriptRef] = await lucid.utxosByOutRef([{ txHash: SCRIPT_REF_TX_HASH, outputIndex: SCRIPT_REF_OUTPUT_INDEX }])
    console.log('Script reference UTXO fetched:', {
      txHash: scriptRef.txHash,
      outputIndex: scriptRef.outputIndex,
      address: scriptRef.address
    })

    // Build the redemption transaction
    console.log('Building redemption transaction...')
    const tx = await lucid
      .newTx()
      .readFrom([scriptRef])
      .addSignerKey(takerPkh) // Taker must sign the transaction
      .collectFrom([escrowUtxo], redeemer)
      .attach.SpendingValidator(VALIDATOR_SCRIPT)
      .complete()

    console.log('Transaction built successfully')

    // Sign and submit the transaction
    const signedTx = await tx.sign.withWallet().complete()
    const redeemTxHash = await signedTx.submit()

    console.log('✅ Escrow redeemed successfully!')
    console.log(`Redemption transaction hash: ${redeemTxHash}`)

    return c.json({
      success: true,
      message: 'Escrow redeemed successfully',
      details: {
        originalUtxo: `${txHash}#${outputIndex}`,
        redemptionTxHash: redeemTxHash,
        takerAddress,
        secretValidated: true,
        network: 'Preview',
        redemptionType: 'TakerClaim',
        escrowAmount: escrowUtxo.assets,
        timeRemaining: expireTime - currentTime
      }
    })

  } catch (error) {
    console.error('=== COMPLETE SWAP ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END ERROR ===')
    
    return c.json({ 
      error: 'Failed to process complete swap request',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }, 500)
  }
})

export default completeSwap