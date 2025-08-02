import { Hono } from 'hono'
import quoter from './quoter'

const resolver = new Hono()

// Mount resolver routes
resolver.route('/quoter', quoter)

export default resolver 