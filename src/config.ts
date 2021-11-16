import convict from 'convict'
import yaml from 'yaml'

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

convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.parse })
const config = convict({
  // Security
  allowedDomains: {
    doc: 'The domains that are allowed to be used as image sources',
    format: Array,
    default: [] as string[],
    env: 'ALLOWED_DOMAINS',
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
  assets: {
    doc: 'The path to the assets folder',
    format: String,
    default: './assets',
    env: 'ASSETS',
  },
})

for (const file of ['morphus.yaml', 'morphus.yaml', 'morphus.json']) {
  try {
    config.loadFile(file)
    break
  } catch {}
}

export const Config = config.get()

console.debug(Config)
