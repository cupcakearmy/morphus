import { Client } from 'minio'
import { PassThrough } from 'stream'

import { Storage } from '.'
import { StreamUtils } from '../utils/utils'

export type MinioConfig = {
  accessKey: string
  secretKey: string
  endpoint: string
  region?: string
  bucket: string
}

export class Minio implements Storage {
  client: Client

  constructor(private options: MinioConfig) {
    const url = new URL(this.options.endpoint)
    this.client = new Client({
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      endPoint: url.hostname,
      port: parseInt(url.port),
      useSSL: url.protocol === 'https:',
    })
  }

  async init(): Promise<void> {
    await this.client.bucketExists(this.options.bucket)
  }

  async read(path: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.options.bucket, path)
    return StreamUtils.toBuffer(stream)
  }
  async write(path: string, data: Buffer): Promise<void> {
    const stream = await StreamUtils.fromBuffer(data)
    await this.client.putObject(this.options.bucket, path, stream)
  }

  async readStream(path: string): Promise<NodeJS.ReadableStream> {
    const stream = await this.client.getObject(this.options.bucket, path)
    return stream
  }
  async writeStream(path: string): Promise<NodeJS.WritableStream> {
    const stream = new PassThrough()
    this.client.putObject(this.options.bucket, path, stream)
    return stream
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.statObject(this.options.bucket, path)
      return true
    } catch {
      return false
    }
  }

  delete(path: string): Promise<void> {
    throw new Error('Method not implemented. Delete')
  }
}
