import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from "zod";
import { getQuoteSchema, getQuoteResponseSchema } from "@fusion-cardano/shared";

const FUSION_BASE_URL = "https://api.1inch.dev/fusion-plus";

const quoter = new Hono()

// Add CORS middleware
quoter.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Proxy endpoint for Fusion quote API - handles both with and without trailing slash
const handleQuoteReceive = async (c: any) => {
  try {
    // Parse query parameters with zod
    const queryParams = c.req.query();
    const validatedParams = getQuoteSchema.parse(queryParams);
    
    // Get API key from environment
    const apiKey = (c.env as any)?.FUSION_API_KEY || process.env.FUSION_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'Fusion API key not configured' }, 500);
    }

    // Build search params for the Fusion API call
    const searchParams = new URLSearchParams();
    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    // Make request to Fusion API
    const fusionResponse = await fetch(`${FUSION_BASE_URL}/quoter/v1.0/quote/receive/?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    if (!fusionResponse.ok) {
      const error = await fusionResponse.json();
      return c.json({ 
        error: `Fusion API error: ${fusionResponse.status} ${fusionResponse.statusText}`,
        details: error 
      }, fusionResponse.status as any);
    }
    
    // Parse and validate the response
    const data = await fusionResponse.json();
    console.log(JSON.stringify(data, null, 2))
    const validatedResponse = getQuoteResponseSchema.parse(data);
    
    // Return the validated response
    return c.json(data);
    
  } catch (error) {
    console.error('Error in quote endpoint:', error);
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Invalid request parameters', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, 400);
    }
    return c.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};

// Register both routes (with and without trailing slash)
quoter.get('/v1.0/quote/receive', handleQuoteReceive);
quoter.get('/v1.0/quote/receive/', handleQuoteReceive);

export default quoter 