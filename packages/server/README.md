# Fusion Cardano Server

A Hono server that provides a proxy to the 1inch Fusion API, handling authentication and request validation.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure your Fusion API key:
   - Create a `.env` file in the server directory
   - Add your Fusion API key: `FUSION_API_KEY=your_api_key_here`
   - For production: Set the `FUSION_API_KEY` environment variable

3. Run the development server:
```bash
pnpm run dev
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### GET `/fusion-plus/quoter/{version}/quote/receive`

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
curl "http://localhost:3000/fusion-plus/quoter/v1.0/quote/receive?srcChain=1&dstChain=137&srcTokenAddress=0x...&dstTokenAddress=0x...&amount=1000000000000000000&walletAddress=0x...&enableEstimate=true"
```

### POST `/fusion-plus/relayer/v1.0/submit`

Submit orders to the relayer.

### POST `/resolver/orders/create`

Create a new order.

### POST `/resolver/orders/send/:orderId`

Send an order to the relayer.

### GET `/resolver/orders/:orderId`

Get order status.

## Development

```bash
# Start development server with hot reload
pnpm run dev

# Build the project
pnpm run build

# Start production server
pnpm run start
```

## Environment Variables

- `FUSION_API_KEY`: Your 1inch Fusion API key (required)
- `PORT`: Server port (optional, defaults to 3000)

## Deployment

This server can be deployed to any Node.js hosting platform (Vercel, Railway, Heroku, etc.) or run directly with Bun/Node.js.

For production deployment:
1. Build the project: `pnpm run build`
2. Set the `FUSION_API_KEY` environment variable
3. Run: `pnpm run start`
