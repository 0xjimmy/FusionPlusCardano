import { GetQuoteParams, GetQuoteResponse } from "@fusion-cardano/shared";

/**
 * Generates a mock quote response for Cardano and Sepolia networks
 * This function creates a realistic mock response based on the input parameters
 */
export function generateMockQuoteResponse(params: GetQuoteParams): GetQuoteResponse {
    // Generate a unique quote ID based on timestamp and random component
    const quoteId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate mock amounts based on input
    const srcAmount = params.amount;
    const dstAmount = (BigInt(srcAmount) * BigInt(98) / BigInt(100)).toString(); // 2% slippage
    
    // Generate mock presets with realistic values
    const baseAmount = BigInt(dstAmount);
    const fastAmount = baseAmount.toString();
    const mediumAmount = (baseAmount * BigInt(101) / BigInt(100)).toString(); // 1% higher
    const slowAmount = (baseAmount * BigInt(102) / BigInt(100)).toString(); // 2% higher
    
    const mockResponse: GetQuoteResponse = {
        quoteId: quoteId,
        srcTokenAmount: srcAmount,
        dstTokenAmount: dstAmount,
        presets: {
            fast: {
                auctionDuration: 180,
                startAuctionIn: 17,
                initialRateBump: 107248,
                auctionStartAmount: fastAmount,
                startAmount: fastAmount,
                auctionEndAmount: (BigInt(fastAmount) * BigInt(99) / BigInt(100)).toString(),
                exclusiveResolver: null,
                costInDstToken: (BigInt(fastAmount) * BigInt(1) / BigInt(100)).toString(),
                points: [],
                allowPartialFills: false,
                allowMultipleFills: false,
                gasCost: {
                    gasBumpEstimate: 0,
                    gasPriceEstimate: "0"
                },
                secretsCount: 1
            },
            medium: {
                auctionDuration: 360,
                startAuctionIn: 17,
                initialRateBump: 214083,
                auctionStartAmount: mediumAmount,
                startAmount: mediumAmount,
                auctionEndAmount: (BigInt(mediumAmount) * BigInt(99) / BigInt(100)).toString(),
                exclusiveResolver: null,
                costInDstToken: (BigInt(mediumAmount) * BigInt(1) / BigInt(100)).toString(),
                points: [
                    {
                        delay: 24,
                        coefficient: 107248
                    }
                ],
                allowPartialFills: false,
                allowMultipleFills: false,
                gasCost: {
                    gasBumpEstimate: 0,
                    gasPriceEstimate: "0"
                },
                secretsCount: 1
            },
            slow: {
                auctionDuration: 600,
                startAuctionIn: 17,
                initialRateBump: 214083,
                auctionStartAmount: slowAmount,
                startAmount: slowAmount,
                auctionEndAmount: (BigInt(slowAmount) * BigInt(99) / BigInt(100)).toString(),
                exclusiveResolver: null,
                costInDstToken: (BigInt(slowAmount) * BigInt(1) / BigInt(100)).toString(),
                points: [
                    {
                        delay: 24,
                        coefficient: 107248
                    }
                ],
                allowPartialFills: false,
                allowMultipleFills: false,
                gasCost: {
                    gasBumpEstimate: 0,
                    gasPriceEstimate: "0"
                },
                secretsCount: 1
            }
        },
        timeLocks: {
            srcWithdrawal: 12,
            srcPublicWithdrawal: 276,
            srcCancellation: 432,
            srcPublicCancellation: 552,
            dstWithdrawal: 12,
            dstPublicWithdrawal: 264,
            dstCancellation: 384
        },
        srcEscrowFactory: "0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a",
        dstEscrowFactory: "0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a",
        srcSafetyDeposit: "1050000000000000",
        dstSafetyDeposit: "187998691230000",
        whitelist: [
            "0xdff5e7ac1275182cb476c0d6ca36e23f4fcab1f7",
            "0x33b41fe18d3a39046ad672f8a0c8c415454f629c"
        ],
        recommendedPreset: "fast",
        prices: {
            usd: {
                srcToken: "1.0000932396922326",
                dstToken: "0.9999999996691362"
            }
        },
        volume: {
            usd: {
                srcToken: "100.01",
                dstToken: "99.94"
            }
        },
        priceImpactPercent: 0.07,
        autoK: 1.05,
        k: 1.05,
        mxK: 37
    };
    
    return mockResponse;
}