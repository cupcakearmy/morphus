import { RouteHandlerMethod } from 'fastify'

import { version as v } from '../../package.json'

export const version: RouteHandlerMethod = async (request, reply) => {
  return { version: v }
}
