import { FastifyInstance } from 'fastify'
import { Config, StorageType } from '../config'
import { Local } from './local'
import { Minio } from './minio'

export abstract class Storage {
  abstract init(): Promise<void>

  abstract read(path: string): Promise<Buffer>
  abstract write(path: string, data: Buffer): Promise<void>

  abstract readStream(path: string): Promise<NodeJS.ReadableStream>
  abstract writeStream(path: string): Promise<NodeJS.WritableStream>

  // list(path: string): Promise<string[]>
  abstract exists(path: string): Promise<boolean>
  abstract delete(path: string): Promise<void>
}

export let storage: Storage

export async function init(App: FastifyInstance) {
  if (!storage) {
    switch (Config.storage) {
      case StorageType.Local:
        storage = new Local(Config.localAssets)
        break
      case StorageType.S3:
        // storage = new S3({
        //   accessKeyId: Config.s3.accessKey,
        //   secretAccessKey: Config.s3.secretKey,
        //   bucket: Config.s3.bucket,
        //   region: Config.s3.region,
        // })
        storage = new Minio({
          accessKey: Config.s3.accessKey,
          secretKey: Config.s3.secretKey,
          bucket: Config.s3.bucket,
          region: Config.s3.region,
          endpoint: 'https://s3.amazonaws.com',
        })
        break
      case StorageType.Minio:
        storage = new Minio({
          accessKey: Config.minio.accessKey,
          secretKey: Config.minio.secretKey,
          endpoint: Config.minio.endpoint,
          region: Config.minio.region,
          bucket: Config.minio.bucket,
        })
        break
      default:
        throw new Error(`Unknown storage type: ${Config.storage}`)
    }
    try {
      await storage.init()
      App.log.debug(`Storage initialized: ${Config.storage}`)
    } catch (e) {
      App.log.error(`Storage initialization failed: ${Config.storage}`)
      process.exit(1)
    }
  }
}
