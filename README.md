# Fusion Cardano Monorepo

A monorepo containing multiple packages for the Fusion Cardano project.

## Packages

- **@fusion/aiken-contracts** - Aiken smart contracts for Cardano
- **@fusion/foundry-contracts** - Foundry smart contracts for Ethereum
- **@fusion/frontend** - Vite + Preact TypeScript frontend application
- **@fusion/hono-api** - Hono API server

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build all packages:
   ```bash
   pnpm build
   ```

3. Run development servers:
   ```bash
   pnpm dev
   ```

## Package-specific Commands

### Aiken Contracts
```bash
cd packages/aiken-contracts
aiken check
aiken build
```

### Foundry Contracts
```bash
cd packages/foundry-contracts
forge build
forge test
```

### Frontend
```bash
cd packages/frontend
pnpm dev
pnpm build
```

### Hono API
```bash
cd packages/hono-api
pnpm dev
pnpm build
```

## Workspace Commands

- `pnpm build` - Build all packages
- `pnpm dev` - Start all development servers
- `pnpm test` - Run tests for all packages
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all packages