import type { FastifyInstance } from 'fastify'
import convict from 'convict'
import yaml from 'js-yaml'

convict.addFormat(require('convict-format-with-validator').ipaddress)

export enum StorageType {
  Local = 'local',
  // S3 = 's3',
  // GCS = 'gcs',
  // Azure = 'azure',
}

export enum URLClean {
  Off = 'off',
  Fragment = 'fragment',
  Query = 'query',
}

const RegExpTag = new yaml.Type('!regexp', {
  kind: 'scalar',
  construct: (value: string) => new RegExp(value),
  instanceOf: RegExp,
})

const Schema = yaml.DEFAULT_SCHEMA.extend([RegExpTag])

export type NullableStringOrRegexpArray = (string | RegExp)[] | null

function formatNullableStringOrRegexpArray(values: any) {
  if (!Array.isArray(values)) throw new Error('must be an array')
  if (values.length === 0) throw new Error('must be an array with at least one element')
  for (const value of values) {
    if (typeof value === 'string') continue
    if (value instanceof RegExp) continue
    throw new Error('must be an array of strings or regexps')
  }
}

convict.addParser({ extension: ['yml', 'yaml'], parse: (s) => yaml.load(s, { schema: Schema }) })
const config = convict({
  // Server
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 80,
    env: 'PORT',
  },
  address: {
    doc: 'The address to bind.',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'ADDRESS',
  },

  // Security
  allowedDomains: {
    doc: 'The domains that are allowed to be used as image sources',
    format: formatNullableStringOrRegexpArray,
    default: null as NullableStringOrRegexpArray,
    nullable: true,
    env: 'ALLOWED_DOMAINS',
  },
  allowedHosts: {
    doc: 'The hosts that are allowed to access the images',
    format: formatNullableStringOrRegexpArray,
    default: null as NullableStringOrRegexpArray,
    nullable: true,
    env: 'ALLOWED_HOSTS',
  },
  cleanUrls: {
    doc: 'Whether to clean URLs',
    format: Object.values(URLClean),
    default: URLClean.Fragment,
    env: 'CLEAN_URLS',
  },

  // Caching
  maxAge: {
    doc: 'The maximum age of a cached image',
    format: String,
    default: '1d',
    env: 'MAX_AGE',
  },

  storage: {
    doc: 'The storage engine to use',
    format: Object.values(StorageType),
    default: StorageType.Local,
    env: 'STORAGE',
  },

  // Local storage
  localAssets: {
    doc: 'The path to the assets folder',
    format: String,
    default: './assets',
    env: 'LOCAL_ASSETS',
  },
})

for (const file of ['morphus.yaml', 'morphus.yaml']) {
  try {
    config.loadFile(file)
    break
  } catch {}
}

export function init(App: FastifyInstance) {
  try {
    config.validate({ allowed: 'strict' })
    App.log.info(config.toString())
  } catch (e) {
    if (e instanceof Error) {
      App.log.error(e.message)
    } else {
      App.log.error(e)
    }
    process.exit(1)
  }
}

export const Config = config.get()
