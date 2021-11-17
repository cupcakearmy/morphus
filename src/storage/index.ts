import { Config, StorageType } from '../config'
import { Local } from './local'

export abstract class Storage {
  abstract read(path: string): Promise<Buffer>
  abstract write(path: string, data: Buffer): Promise<void>
  abstract exists(path: string): Promise<boolean>
  abstract delete(path: string): Promise<void>

  abstract readStream(path: string): Promise<NodeJS.ReadableStream>
  abstract writeStream(path: string): Promise<NodeJS.WritableStream>
  // list(path: string): Promise<string[]>

  abstract init(): Promise<void>
}

export let storage: Storage

export async function init() {
  if (!storage) {
    switch (Config.storage) {
      case StorageType.Local:
        storage = new Local(Config.localAssets)
        break
      default:
        throw new Error(`Unknown storage type: ${Config.storage}`)
    }
    await storage.init()
  }
}
