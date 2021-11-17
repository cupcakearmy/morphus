import { FastifyInstance } from 'fastify'

import { image } from './image'
import { version } from './version'

export function init(App: FastifyInstance) {
  App.get('/api/image', image)
  App.get('/version', version)
}
