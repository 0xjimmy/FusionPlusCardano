import { z } from "zod";
/**
 * Zod schema for getQuote query parameters
 * Based on 1inch Fusion Plus API documentation
 */
export declare const getQuoteSchema: z.ZodObject<{
    srcChain: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>;
    dstChain: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>;
    srcTokenAddress: z.ZodString;
    dstTokenAddress: z.ZodString;
    amount: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodBigInt]>, string, string | bigint>;
    walletAddress: z.ZodString;
    enableEstimate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodBoolean]>, boolean, string | boolean>;
    fee: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number | undefined, string | number>>;
    isPermit2: z.ZodOptional<z.ZodString>;
    permit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    srcChain: number;
    dstChain: number;
    srcTokenAddress: string;
    dstTokenAddress: string;
    amount: string;
    walletAddress: string;
    enableEstimate: boolean;
    fee?: number | undefined;
    isPermit2?: string | undefined;
    permit?: string | undefined;
}, {
    srcChain: string | number;
    dstChain: string | number;
    srcTokenAddress: string;
    dstTokenAddress: string;
    amount: string | bigint;
    walletAddress: string;
    enableEstimate: string | boolean;
    fee?: string | number | undefined;
    isPermit2?: string | undefined;
    permit?: string | undefined;
}>;
export type GetQuoteParams = z.infer<typeof getQuoteSchema>;
/**
 * Zod schema for getQuote response
 * Based on 1inch Fusion Plus API swagger documentation
 */
export declare const getQuoteResponseSchema: z.ZodObject<{
    quoteId: z.ZodString;
    presets: z.ZodObject<{
        fast: z.ZodObject<{
            auctionDuration: z.ZodNumber;
            startAuctionIn: z.ZodNumber;
            initialRateBump: z.ZodNumber;
            auctionStartAmount: z.ZodString;
            startAmount: z.ZodString;
            auctionEndAmount: z.ZodString;
            exclusiveResolver: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                costInDstToken: z.ZodString;
                points: z.ZodArray<z.ZodObject<{
                    delay: z.ZodNumber;
                    coefficient: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    delay: number;
                    coefficient: number;
                }, {
                    delay: number;
                    coefficient: number;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }>>>;
            allowPartialFills: z.ZodBoolean;
            allowMultipleFills: z.ZodBoolean;
            gasCost: z.ZodObject<{
                gasBumpEstimate: z.ZodNumber;
                gasPriceEstimate: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }>;
            secretsCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }>;
        medium: z.ZodObject<{
            auctionDuration: z.ZodNumber;
            startAuctionIn: z.ZodNumber;
            initialRateBump: z.ZodNumber;
            auctionStartAmount: z.ZodString;
            startAmount: z.ZodString;
            auctionEndAmount: z.ZodString;
            exclusiveResolver: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                costInDstToken: z.ZodString;
                points: z.ZodArray<z.ZodObject<{
                    delay: z.ZodNumber;
                    coefficient: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    delay: number;
                    coefficient: number;
                }, {
                    delay: number;
                    coefficient: number;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }>>>;
            allowPartialFills: z.ZodBoolean;
            allowMultipleFills: z.ZodBoolean;
            gasCost: z.ZodObject<{
                gasBumpEstimate: z.ZodNumber;
                gasPriceEstimate: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }>;
            secretsCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }>;
        slow: z.ZodObject<{
            auctionDuration: z.ZodNumber;
            startAuctionIn: z.ZodNumber;
            initialRateBump: z.ZodNumber;
            auctionStartAmount: z.ZodString;
            startAmount: z.ZodString;
            auctionEndAmount: z.ZodString;
            exclusiveResolver: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                costInDstToken: z.ZodString;
                points: z.ZodArray<z.ZodObject<{
                    delay: z.ZodNumber;
                    coefficient: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    delay: number;
                    coefficient: number;
                }, {
                    delay: number;
                    coefficient: number;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }>>>;
            allowPartialFills: z.ZodBoolean;
            allowMultipleFills: z.ZodBoolean;
            gasCost: z.ZodObject<{
                gasBumpEstimate: z.ZodNumber;
                gasPriceEstimate: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }>;
            secretsCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }>;
        custom: z.ZodOptional<z.ZodObject<{
            auctionDuration: z.ZodNumber;
            startAuctionIn: z.ZodNumber;
            initialRateBump: z.ZodNumber;
            auctionStartAmount: z.ZodString;
            startAmount: z.ZodString;
            auctionEndAmount: z.ZodString;
            exclusiveResolver: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                costInDstToken: z.ZodString;
                points: z.ZodArray<z.ZodObject<{
                    delay: z.ZodNumber;
                    coefficient: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    delay: number;
                    coefficient: number;
                }, {
                    delay: number;
                    coefficient: number;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }, {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            }>>>;
            allowPartialFills: z.ZodBoolean;
            allowMultipleFills: z.ZodBoolean;
            gasCost: z.ZodObject<{
                gasBumpEstimate: z.ZodNumber;
                gasPriceEstimate: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }, {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            }>;
            secretsCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }, {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fast: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        medium: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        slow: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        custom?: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        } | undefined;
    }, {
        fast: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        medium: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        slow: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        custom?: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        } | undefined;
    }>;
    srcEscrowFactory: z.ZodString;
    dstEscrowFactory: z.ZodString;
    whitelist: z.ZodArray<z.ZodString, "many">;
    timeLocks: z.ZodObject<{
        srcWithdrawal: z.ZodNumber;
        srcPublicWithdrawal: z.ZodNumber;
        srcCancellation: z.ZodNumber;
        srcPublicCancellation: z.ZodNumber;
        dstWithdrawal: z.ZodNumber;
        dstPublicWithdrawal: z.ZodNumber;
        dstCancellation: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        srcWithdrawal: number;
        srcPublicWithdrawal: number;
        srcCancellation: number;
        srcPublicCancellation: number;
        dstWithdrawal: number;
        dstPublicWithdrawal: number;
        dstCancellation: number;
    }, {
        srcWithdrawal: number;
        srcPublicWithdrawal: number;
        srcCancellation: number;
        srcPublicCancellation: number;
        dstWithdrawal: number;
        dstPublicWithdrawal: number;
        dstCancellation: number;
    }>;
    srcSafetyDeposit: z.ZodString;
    dstSafetyDeposit: z.ZodString;
    recommendedPreset: z.ZodEnum<["fast", "slow", "medium", "custom"]>;
    prices: z.ZodObject<{
        usd: z.ZodObject<{
            srcToken: z.ZodString;
            dstToken: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            srcToken: string;
            dstToken: string;
        }, {
            srcToken: string;
            dstToken: string;
        }>;
        volume: z.ZodOptional<z.ZodObject<{
            usd: z.ZodObject<{
                srcToken: z.ZodString;
                dstToken: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                srcToken: string;
                dstToken: string;
            }, {
                srcToken: string;
                dstToken: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            usd: {
                srcToken: string;
                dstToken: string;
            };
        }, {
            usd: {
                srcToken: string;
                dstToken: string;
            };
        }>>;
    }, "strip", z.ZodTypeAny, {
        usd: {
            srcToken: string;
            dstToken: string;
        };
        volume?: {
            usd: {
                srcToken: string;
                dstToken: string;
            };
        } | undefined;
    }, {
        usd: {
            srcToken: string;
            dstToken: string;
        };
        volume?: {
            usd: {
                srcToken: string;
                dstToken: string;
            };
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    quoteId: string;
    presets: {
        fast: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        medium: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        slow: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        custom?: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        } | undefined;
    };
    srcEscrowFactory: string;
    dstEscrowFactory: string;
    whitelist: string[];
    timeLocks: {
        srcWithdrawal: number;
        srcPublicWithdrawal: number;
        srcCancellation: number;
        srcPublicCancellation: number;
        dstWithdrawal: number;
        dstPublicWithdrawal: number;
        dstCancellation: number;
    };
    srcSafetyDeposit: string;
    dstSafetyDeposit: string;
    recommendedPreset: "custom" | "fast" | "medium" | "slow";
    prices: {
        usd: {
            srcToken: string;
            dstToken: string;
        };
        volume?: {
            usd: {
                srcToken: string;
                dstToken: string;
            };
        } | undefined;
    };
}, {
    quoteId: string;
    presets: {
        fast: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        medium: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        slow: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        };
        custom?: {
            auctionDuration: number;
            startAuctionIn: number;
            initialRateBump: number;
            auctionStartAmount: string;
            startAmount: string;
            auctionEndAmount: string;
            allowPartialFills: boolean;
            allowMultipleFills: boolean;
            gasCost: {
                gasBumpEstimate: number;
                gasPriceEstimate: string;
            };
            secretsCount: number;
            exclusiveResolver?: {
                costInDstToken: string;
                points: {
                    delay: number;
                    coefficient: number;
                }[];
            } | null | undefined;
        } | undefined;
    };
    srcEscrowFactory: string;
    dstEscrowFactory: string;
    whitelist: string[];
    timeLocks: {
        srcWithdrawal: number;
        srcPublicWithdrawal: number;
        srcCancellation: number;
        srcPublicCancellation: number;
        dstWithdrawal: number;
        dstPublicWithdrawal: number;
        dstCancellation: number;
    };
    srcSafetyDeposit: string;
    dstSafetyDeposit: string;
    recommendedPreset: "custom" | "fast" | "medium" | "slow";
    prices: {
        usd: {
            srcToken: string;
            dstToken: string;
        };
        volume?: {
            usd: {
                srcToken: string;
                dstToken: string;
            };
        } | undefined;
    };
}>;
export type GetQuoteResponse = z.infer<typeof getQuoteResponseSchema>;
//# sourceMappingURL=fusion.d.ts.map