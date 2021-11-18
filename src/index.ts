import fastify from 'fastify'

import { Config, init as initConfig } from './config'
import { init as initRoutes } from './controllers'
import { init as initStorage } from './storage'
import { init as initMiddleware } from './fastify/middleware'
import { init as initHooks } from './fastify/hooks'

export const App = fastify({ logger: { prettyPrint: true, level: Config.logLevel } })

process.on('SIGINT', async function () {
  App.log.info('Stopping server')
  // Close with 2s timeout
  await Promise.race([App.close(), new Promise((resolve) => setTimeout(resolve, 2000))])
  process.exit()
})

async function main() {
  try {
    // Internal
    initConfig(App)
    await initStorage(App)

    // Fastify
    initMiddleware(App)
    initHooks(App)
    initRoutes(App)

    // Start
    await App.listen(Config.port, Config.address)
  } catch (err) {
    App.log.error(err)
    process.exit(1)
  }
}
main()
