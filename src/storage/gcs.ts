import { Bucket, Storage as GCStorage } from '@google-cloud/storage'

import { Storage } from '.'

export type GCSConfig = {
  bucket: string
  keyFilename: string
}

export class GCS implements Storage {
  client: GCStorage
  bucket: Bucket

  constructor(private options: GCSConfig) {
    this.client = new GCStorage(options)
    this.bucket = this.client.bucket(options.bucket)
  }

  async init(): Promise<void> {
    await this.client.bucket(this.options.bucket).getFiles({ maxResults: 1 })
  }

  async readStream(path: string): Promise<NodeJS.ReadableStream> {
    if (!(await this.exists(path))) throw new Error(`File ${path} does not exist`)
    return this.bucket.file(path).createReadStream()
  }

  async writeStream(path: string): Promise<NodeJS.WritableStream> {
    return this.bucket.file(path).createWriteStream()
  }

  async exists(path: string): Promise<boolean> {
    const [exists] = await this.bucket.file(path).exists()
    return exists
  }

  async delete(path: string): Promise<void> {
    await this.bucket.file(path).delete()
  }
}
