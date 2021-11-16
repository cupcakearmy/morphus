import { FastifyReply } from 'fastify'

export function ForbiddenError(reply: FastifyReply, message?: string) {
  reply.code(403).send({ error: 'Forbidden', message })
}
