import { Hono } from 'hono'
import orders from './orders'

const relayer = new Hono()

// Mount relayer routes
relayer.route('/orders', orders)

export default relayer 