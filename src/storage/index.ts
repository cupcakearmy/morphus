import { Config, StorageType } from '../config'
import { Local } from './local'

export interface Storage {
  read(path: string): Promise<Buffer>
  write(path: string, data: Buffer): Promise<void>
  exists(path: string): Promise<boolean>
  delete(path: string): Promise<void>

  readStream(path: string): Promise<NodeJS.ReadableStream>
  writeStream(path: string): Promise<NodeJS.WritableStream>
  // list(path: string): Promise<string[]>
}

export let storage: Storage

export function init() {
  if (!storage) {
    switch (Config.storage) {
      case StorageType.Local:
        storage = new Local(Config.assets)
        break
      default:
        throw new Error(`Unknown storage type: ${Config.storage}`)
    }
  }
}
