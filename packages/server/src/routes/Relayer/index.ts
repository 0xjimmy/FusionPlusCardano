import { Hono } from 'hono'
import quoter from './quoter'

const relayer = new Hono()

relayer.route('/quoter', quoter)

export default relayer 