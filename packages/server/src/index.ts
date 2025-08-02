import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { SDK } from "@1inch/cross-chain-sdk";
import resolver from './routes/Resolver'
import relayer from './routes/Relayer'

const app = new Hono()

// Add CORS middleware with wildcard origin
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Mount the resolver routes (quoter, etc.)
app.route('/resolver', resolver)

// Mount the relayer routes (orders, etc.)
app.route('/fusion-plus', relayer)

export default app
