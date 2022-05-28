import {
  IsDefined,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator'
import type { RouteHandlerMethod } from 'fastify'
import { flatten, unflatten } from 'flat'
import type { IncomingHttpHeaders } from 'http2'
import ms from 'ms'
import sharp, { FitEnum, FormatEnum } from 'sharp'
import { App } from '..'
import { Config, URLClean } from '../config'
import { storage } from '../storage'
import { transform } from '../transform'
import { ForbiddenError } from '../utils/errors'
import { sha3, sortObjectByKeys, testForPrefixOrRegexp, validateSyncOrFail } from '../utils/utils'

export enum ImageOperations {
  resize,
  flip,
  flop,
  affine,
  sharpen,
  median,
  blur,
  flatten,
  gamma,
  negate,
  normalise,
  normalize,
  clahe,
  convolve,
  threshold,
  boolean,
  linear,
  recomb,
  modulate,
}

export enum ImageFormat {
  jpeg,
  png,
  webp,
  gif,
  jp2,
  tiff,
  avif,
  heif,
  raw,
}
export class ComplexParameter<N = string, T extends object = {}> {
  @IsString()
  name: N

  @IsObject()
  options: T

  constructor(parameter: string) {
    const [name, optionsRaw] = parameter.split('|')
    if (!name) throw new Error('Invalid parameter')
    this.name = name as any
    this.options = {} as any
    if (optionsRaw) {
      for (const option of optionsRaw.split(',')) {
        const [key, value] = option.split(':')
        if (!key || !value) continue
        // @ts-ignore
        this.options[key] = ComplexParameter.ParseValue(value)
      }
    }
    this.options = unflatten(this.options)
  }

  static ParseValue(value: string) {
    if (value === 'true') return true
    if (value === 'false') return false

    const asNumber = Number(value)
    if (!isNaN(asNumber)) return asNumber

    return value
  }
}

export class TransformQueryBase {
  @IsString()
  @IsUrl()
  @IsDefined()
  url!: string

  @IsOptional()
  @ValidateNested()
  format: ComplexParameter<keyof FormatEnum>

  @IsOptional()
  @IsIn(Object.values(sharp.fit))
  resize?: keyof FitEnum

  @IsOptional()
  @IsInt()
  @IsPositive()
  width?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  height?: number

  @ValidateNested()
  op: ComplexParameter[] = []

  constructor(data: any, options: { headers: IncomingHttpHeaders }) {
    Object.assign(this, data)

    if (this.width) this.width = parseInt(this.width as any)
    if (this.height) this.height = parseInt(this.height as any)

    this.op = Array.isArray(this.op) ? this.op : [this.op]
    this.op = this.op.map((op) => new ComplexParameter(op as any))

    // @ts-ignore
    this.format = new ComplexParameter((this.format as any) || 'auto')
    if ((this.format.name as string) === 'auto') {
      if (!options.headers) throw new Error('cannot use auto format without user agent')

      this.autoFormat(options.headers)
    }

    validateSyncOrFail(this)
    if (this.resize) {
      if (!this.width && !this.height) {
        throw new Error('width or height is required when resizing')
      }
    }

    switch (Config.cleanUrls) {
      case URLClean.Query: {
        this.url = this.url.split('#')[0]!
        this.url = this.url.split('?')[0]!
        break
      }
      case URLClean.Fragment: {
        this.url = this.url.split('#')[0]!
        break
      }
    }
  }

  toString(): string {
    const data = flatten(this) as Record<string, any>
    return new URLSearchParams(sortObjectByKeys(data)).toString()
  }

  autoFormat(headers: IncomingHttpHeaders) {
    const ua = headers['user-agent']
    const accept = headers['accept'] // Accept: image/avif,image/webp,*/*
    if (accept) {
      const acceptTypes = accept.split(',')
      for (const type of acceptTypes) {
        if (type.startsWith('image/')) {
          this.format!.name = type.split('/')[1] as any
          return
        }
      }
    }
    // Fallback
    this.format!.name = 'jpeg'
  }

  get hash(): string {
    return sha3(this.toString())
  }
}

export const image: RouteHandlerMethod = async (request, reply) => {
  try {
    const q = new TransformQueryBase(request.query, { headers: request.headers })

    if (Config.allowedDomains) {
      if (!testForPrefixOrRegexp(q.url, Config.allowedDomains))
        return ForbiddenError(reply, 'source domain not allowed')
    }

    if (Config.allowedHosts) {
      const origin = request.headers.origin
      if (!origin || !testForPrefixOrRegexp(origin, Config.allowedHosts))
        return ForbiddenError(reply, 'origin not allowed')
    }

    const hash = q.hash

    // @ts-ignore
    reply.etag(hash)
    // @ts-ignore
    reply.expires(new Date(Date.now() + ms(Config.maxAge)))

    let stream: NodeJS.ReadableStream
    App.log.debug('Serving image. Hash: ' + hash)
    try {
      stream = await storage.readStream(hash)
    } catch {
      App.log.debug(`Transforming`)
      stream = await transform(q)
    }

    reply.code(200).headers({
      'Content-Type': `image/${q.format?.name}`,
    })

    return stream
  } catch (err) {
    reply.code(400).send(err)
    return
  }
}
