import { Hono } from 'hono'
import quoter from './quoter'
import submit from './submit'
import orders from './orders'

const relayer = new Hono()

relayer.route('/quoter', quoter)
relayer.route('/relayer', submit)
relayer.route('/orders', orders)

export default relayer 