import { z } from "zod";

/**
 * Zod schema for getQuote query parameters
 * Based on 1inch Fusion Plus API documentation
 */
export const getQuoteSchema = z.object({
  // Required parameters
  srcChain: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "string") {
      return Number(val);
    }
    return val;
  }).describe("Id of source chain"),
  dstChain: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === "string") {
      return Number(val);
    }
    return val;
  }).describe("Id of destination chain"),
  srcTokenAddress: z.string().describe("Address of 'SOURCE' token in source chain"),
  dstTokenAddress: z.string().describe("Address of 'DESTINATION' token in destination chain"),
  amount: z.union([z.string(), z.bigint()]).transform((val: string | bigint) => {
    if (typeof val === "bigint") {
      return val.toString(10);
    }
    return val;
  }).describe("Amount to take from 'SOURCE' token to get 'DESTINATION' token"),
  walletAddress: z.string().describe("An address of the wallet or contract in source chain who will create Fusion order"),
  enableEstimate: z.union([z.string(), z.boolean()]).transform((val) => {
    if (typeof val === "string") {
      return val === "true";
    }
    return val;
  }).describe("if enabled then get estimation from 1inch swap builder and generates quoteId, by default is false"),
  
  // Optional parameters
  fee: z.union([z.string(), z.number()]).transform((val) => val !== undefined ? Number(val) : undefined).optional().describe("fee in bps format, 1% is equal to 100bps"),
  isPermit2: z.string().optional().describe("permit2 allowance transfer encoded call"),
  permit: z.string().optional().describe("permit, user approval sign"),
});

export type GetQuoteParams = z.infer<typeof getQuoteSchema>;

// Response schemas
const auctionPointSchema = z.object({
  delay: z.number(),
  coefficient: z.number(),
});

const gasCostConfigSchema = z.object({
  gasBumpEstimate: z.number(),
  gasPriceEstimate: z.string(),
});

const exclusiveResolverSchema = z.object({
  costInDstToken: z.string(),
  points: z.array(auctionPointSchema),
});

const presetSchema = z.object({
  auctionDuration: z.number(),
  startAuctionIn: z.number(),
  initialRateBump: z.number(),
  auctionStartAmount: z.string(),
  startAmount: z.string(),
  auctionEndAmount: z.string(),
  exclusiveResolver: exclusiveResolverSchema.nullable().optional(),
  allowPartialFills: z.boolean(),
  allowMultipleFills: z.boolean(),
  gasCost: gasCostConfigSchema,
  secretsCount: z.number(),
});

const quotePresetsSchema = z.object({
  fast: presetSchema,
  medium: presetSchema,
  slow: presetSchema,
  custom: presetSchema.optional(),
});

const timeLocksSchema = z.object({
  srcWithdrawal: z.number(),
  srcPublicWithdrawal: z.number(),
  srcCancellation: z.number(),
  srcPublicCancellation: z.number(),
  dstWithdrawal: z.number(),
  dstPublicWithdrawal: z.number(),
  dstCancellation: z.number(),
});

const tokenPairSchema = z.object({
  srcToken: z.string(),
  dstToken: z.string(),
});

const pairCurrencySchema = z.object({
  usd: tokenPairSchema,
});

const pricesSchema = z.object({
  usd: tokenPairSchema,
  volume: pairCurrencySchema.optional(),
});

/**
 * Zod schema for getQuote response
 * Based on 1inch Fusion Plus API swagger documentation
 */
export const getQuoteResponseSchema = z.object({
  quoteId: z.string(),
  presets: quotePresetsSchema,
  srcEscrowFactory: z.string(),
  dstEscrowFactory: z.string(),
  whitelist: z.array(z.string()),
  timeLocks: timeLocksSchema,
  srcSafetyDeposit: z.string(),
  dstSafetyDeposit: z.string(),
  recommendedPreset: z.enum(["fast", "slow", "medium", "custom"]),
  prices: pricesSchema,
});

export type GetQuoteResponse = z.infer<typeof getQuoteResponseSchema>; 