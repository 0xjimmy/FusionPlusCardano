import { Hono } from 'hono'
import orders from '../Relayer/orders'
import addresses from './addresses'
import completeSwap from './completeSwap'

const resolver = new Hono()

resolver.route('/orders', orders)
resolver.route('/addresses', addresses)
resolver.route('/complete-swap', completeSwap)

export default resolver 