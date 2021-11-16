// Require the framework and instantiate it
import fastify from 'fastify'
import compress from 'fastify-compress'
import cors from 'fastify-cors'
import underPressure from 'under-pressure'

import './config'
import { version } from './controllers'
import { image } from './controllers/image'
import { init } from './storage'

init()

const app = fastify({ logger: true })
app.register(underPressure)
app.register(require('fastify-caching'))
app.register(compress, { global: true })
app.register(cors, { origin: true })

app.addHook('preHandler', (request, reply, done) => {
  reply.header('Server', 'morphus')
  done()
})

app.get('/api/image', image)
app.get('/version', version)

async function start() {
  try {
    await app.listen(3000)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
