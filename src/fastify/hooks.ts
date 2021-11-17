import { FastifyInstance } from 'fastify'

export function init(App: FastifyInstance) {
  App.addHook('preHandler', (request, reply, done) => {
    reply.header('Server', 'morphus')
    done()
  })
}
