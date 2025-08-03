import { Hono } from 'hono'
import { cors } from 'hono/cors'

const submit = new Hono()

// Add CORS middleware
submit.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Submit order endpoint
const handleSubmitOrder = async (c: any) => {
  try {
    // Parse request body
    const body = await c.req.json();
    
    // Log the request data
    console.log('Submit order request:', JSON.stringify(body, null, 2));
    
    // Return 201 status with success message
    return c.json({ message: "The order has been successfully saved" }, 201);
    
  } catch (error) {
    console.error('Error in submit order endpoint:', error);
    return c.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};

// Register the submit endpoint
submit.post('/v1.0/submit', handleSubmitOrder);

export default submit 