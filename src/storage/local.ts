import fs from 'fs'
import { join, resolve } from 'path'
import { promisify } from 'util'

import { Storage } from './'

export class Local implements Storage {
  constructor(private readonly root: string) {
    this.root = resolve(root)
  }

  async init() {
    await promisify(fs.mkdir)(this.root, { recursive: true })
  }

  exists(path: string): Promise<boolean> {
    const file = join(this.root, path)
    return new Promise((resolve, reject) => {
      fs.access(file, fs.constants.F_OK, (err) => {
        if (err) {
          return resolve(false)
        }
        resolve(true)
      })
    })
  }

  delete(path: string): Promise<void> {
    const file = join(this.root, path)
    return new Promise((resolve, reject) => {
      fs.unlink(file, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  readStream(path: string): Promise<NodeJS.ReadableStream> {
    const file = join(this.root, path)
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file)
      stream.on('error', reject)
      resolve(stream)
    })
  }

  writeStream(path: string): Promise<NodeJS.WritableStream> {
    const file = join(this.root, path)
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(file)
      stream.on('error', reject)
      resolve(stream)
    })
  }
}
