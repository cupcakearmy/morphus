import { createHash } from 'crypto'
import { validateSync, ValidatorOptions, ValidationError as VE } from 'class-validator'
import { PassThrough, Readable } from 'stream'

export class ValidationError extends Error {
  override message: string

  constructor(errors: VE[]) {
    super()
    this.message = errors
      .map((e) => Object.values(e.constraints!))
      .flat()
      .join(', ')
  }
}

export function validateSyncOrFail(data: object, options: ValidatorOptions = {}) {
  options = Object.assign({ whitelist: true, forbidUnknownValues: true, skipMissingProperties: false }, options)
  const errors = validateSync(data, options)
  if (errors.length > 0) {
    throw new ValidationError(errors)
  }
}

export function sha3(url: string) {
  return createHash('sha3-256').update(url).digest('hex')
}

export function sortObjectByKeys<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]))) as T
}

export function splitter(from: NodeJS.ReadableStream, ...streams: NodeJS.WritableStream[]) {
  const splitter = new PassThrough()
  for (const stream of streams) {
    splitter.pipe(stream)
  }
  from.pipe(splitter)
}
