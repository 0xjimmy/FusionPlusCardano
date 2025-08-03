import { Hono } from 'hono'

const addresses = new Hono()

async function deriveEthereumAddress(privateKey: string): Promise<string> {
  try {
    // @ts-ignore - Dynamic import for optional dependency
    const viem = await import('viem/accounts').catch(() => null)
    if (viem) {
      const account = viem.privateKeyToAccount(privateKey as `0x${string}`)
      return account.address
    }
    return 'viem not installed - run: bun add viem'
  } catch (error) {
    console.error('Ethereum address derivation error:', error)
    return 'Error deriving Ethereum address'
  }
}

async function deriveCardanoAddress(privateKey: string, blockfrostApiKey?: string): Promise<string> {
  try {
    // @ts-ignore - Dynamic import for optional dependency
    const lucid = await import('@evolution-sdk/lucid').catch(() => null)
    if (lucid) {
      const lucidInstance = await lucid.Lucid(
        new lucid.Koios(
          'https://preview.koios.rest/api/v1',
        ),
        'Preview'
      )
      
      lucidInstance.selectWallet.fromPrivateKey(privateKey)
      return await lucidInstance.wallet().address()
    }
    return '@evolution-sdk/lucid not installed - run: bun add @evolution-sdk/lucid'
  } catch (error) {
    console.error('Cardano address derivation error:', error)
    return 'Error deriving Cardano address'
  }
}

addresses.get('/', async (c) => {
  try {
    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
    const cardanoPrivateKey = process.env.CARDANO_PRIVATE_KEY
    const blockfrostApiKey = process.env.BLOCKFROST_API_KEY

    if (!ethereumPrivateKey || !cardanoPrivateKey) {
      return c.json({ 
        error: 'Missing private keys in environment variables',
        required: ['ETHEREUM_PRIVATE_KEY', 'CARDANO_PRIVATE_KEY'],
        optional: ['BLOCKFROST_API_KEY']
      }, 400)
    }

    const [ethereumAddress, cardanoAddress] = await Promise.all([
      deriveEthereumAddress(ethereumPrivateKey),
      deriveCardanoAddress(cardanoPrivateKey, blockfrostApiKey)
    ])

    return c.json({
      ethereum: ethereumAddress,
      cardano: cardanoAddress,
      network: 'Preview'
    })
  } catch (error) {
    console.error('Address derivation error:', error)
    return c.json({ error: 'Failed to derive addresses' }, 500)
  }
})

export default addresses