import convict from 'convict'
import type { FastifyInstance } from 'fastify'
import yaml from 'js-yaml'

convict.addFormat(require('convict-format-with-validator').ipaddress)

export enum StorageType {
  Local = 'local',
  Minio = 'minio',
  S3 = 's3',
  GCS = 'gcs',
  // Azure = 'azure',
  // B2 = 'b2',
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

export const config = convict({
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

  // Logging
  logLevel: {
    doc: 'The level of logging to use.',
    format: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    default: 'info',
    env: 'LOG_LEVEL',
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
  local: {
    assets: {
      doc: 'The path to the assets folder',
      format: String,
      default: './assets',
      env: 'LOCAL_ASSETS',
    },
  },

  // Minio storage
  minio: {
    accessKey: {
      doc: 'The access key for Minio',
      format: String,
      default: '',
      env: 'MINIO_ACCESS_KEY',
      sensitive: true,
    },
    secretKey: {
      doc: 'The secret key for Minio',
      format: String,
      default: '',
      env: 'MINIO_SECRET_KEY',
      sensitive: true,
    },
    endpoint: {
      doc: 'The endpoint for Minio',
      format: String,
      default: '',
      env: 'MINIO_ENDPOINT',
    },
    bucket: {
      doc: 'The bucket to use for Minio',
      format: String,
      default: '',
      env: 'MINIO_BUCKET',
    },
    region: {
      doc: 'The region for Minio',
      format: String,
      default: '',
      env: 'MINIO_REGION',
    },
  },

  // S3 storage
  s3: {
    bucket: {
      doc: 'The S3 bucket to use',
      format: String,
      default: '',
      env: 'S3_BUCKET',
    },
    region: {
      doc: 'The S3 region to use',
      format: String,
      default: '',
      env: 'S3_REGION',
    },
    accessKey: {
      doc: 'The S3 access key id to use',
      format: String,
      default: '',
      env: 'S3_ACCESS_KEY_ID',
      sensitive: true,
    },
    secretKey: {
      doc: 'The S3 secret access key to use',
      format: String,
      default: '',
      env: 'S3_SECRET_ACCESS_KEY',
      sensitive: true,
    },
  },

  // GCS storage
  gcs: {
    bucket: {
      doc: 'The GCS bucket to use',
      format: String,
      default: '',
      env: 'GCS_BUCKET',
    },
    keyFilename: {
      doc: 'The GCS key file to use',
      format: String,
      default: '',
      env: 'GCS_KEY_FILENAME',
    },
  },
})

for (const file of ['morphus.yaml', 'morphus.yml']) {
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
