import { FastifyInstance } from 'fastify'

export function init(App: FastifyInstance) {
  App.register(require('under-pressure'))
  App.register(require('@fastify/caching'))
  App.register(require('@fastify/compress'), { global: true })
  App.register(require('@fastify/cors'), { origin: '*' })
}
