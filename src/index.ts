// Require the framework and instantiate it
import fastify from 'fastify'
import compress from 'fastify-compress'
import cors from 'fastify-cors'
// @ts-ignore
import cache from 'fastify-caching'
import ms from 'ms'
import underPressure from 'under-pressure'

import { Config } from './config'
import { handler } from './controllers'
import { init } from './storage'

init()

const app = fastify({ logger: true })
app.register(underPressure)
app.register(cache, { expiresIn: ms(Config.maxAge) / 1000 })
app.register(compress, { global: true })
app.register(cors, { origin: true })

app.get('/api/image', handler)

async function start() {
  try {
    await app.listen(3000)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
