import { Hono } from 'hono'
import orders from '../Relayer/orders'

const resolver = new Hono()

resolver.route('/orders', orders)

export default resolver 