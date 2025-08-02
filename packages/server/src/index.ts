import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { SDK } from "@1inch/cross-chain-sdk";
import quoter from './routes/quoter'

const app = new Hono()
const fusionplus = new Hono()

// Add CORS middleware with wildcard origin
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

fusionplus.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

fusionplus.get('/', async (c) => {
  // const orders = await main()
  // console.log(orders)
  return c.text('Hello Fusion!')
})

// Mount the quoter routes
fusionplus.route('/quoter/:version', quoter)

// Mount the fusionplus router
app.route('/fusion-plus', fusionplus)

export default app
