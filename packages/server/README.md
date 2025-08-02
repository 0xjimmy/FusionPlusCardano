# Fusion Cardano Server

A Hono server that provides a proxy to the 1inch Fusion API, handling authentication and request validation.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure your Fusion API key:
   - For local development: Set the `FUSION_API_KEY` environment variable
   - For production: Update the `FUSION_API_KEY` in `wrangler.jsonc` or set it as a Cloudflare Worker secret

3. Run the development server:
```bash
pnpm run dev
```

## API Endpoints

### GET `/fusionplus/quoter/{version}/quote/receive`

Proxies requests to the 1inch Fusion quote API. No authentication required on this endpoint as the server handles the Fusion API authentication.

**Query Parameters:**
- `srcChain` (required): Source chain ID
- `dstChain` (required): Destination chain ID  
- `srcTokenAddress` (required): Source token address
- `dstTokenAddress` (required): Destination token address
- `amount` (required): Amount to swap
- `walletAddress` (required): Wallet address
- `enableEstimate` (required): Whether to enable estimation
- `fee` (optional): Fee in bps
- `isPermit2` (optional): Permit2 allowance transfer
- `permit` (optional): User approval signature

**Example:**
```bash
curl "http://localhost:8787/fusionplus/quoter/v1.0/quote/receive?srcChain=1&dstChain=137&srcTokenAddress=0x...&dstTokenAddress=0x...&amount=1000000000000000000&walletAddress=0x...&enableEstimate=true"
```

## Deployment

```bash
pnpm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
pnpm run cf-typegen
```
