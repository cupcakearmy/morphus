import {
  IsDefined,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsIn,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { RouteHandlerMethod } from 'fastify'
import sharp, { FitEnum, FormatEnum } from 'sharp'
import { flatten, unflatten } from 'flat'
import ms from 'ms'

import { storage } from '../storage'
import { transform } from '../transform'
import { sha3, sortObjectByKeys, validateSyncOrFail } from '../utils/utils'
import { Config, URLClean } from '../config'
import { supportsAvif, supportsWebP } from '../utils/caniuse'

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

export class TransformQueryBase {
  @IsString()
  @IsUrl()
  @IsDefined()
  url!: string

  @IsOptional()
  @ValidateNested()
  format?: ComplexParameter<keyof FormatEnum>

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

  hash: string

  constructor(data: any, options: { ua?: string }) {
    Object.assign(this, data)

    if (this.width) this.width = parseInt(this.width as any)
    if (this.height) this.height = parseInt(this.height as any)

    this.op = Array.isArray(this.op) ? this.op : [this.op]
    this.op = this.op.map((op) => new ComplexParameter(op as any))
    if (this.format) this.format = new ComplexParameter(this.format as any)
    if ((this.format?.name as string) === 'auto') {
      if (!options.ua) throw new Error('cannot use auto format without user agent')
      this.autoFormat(options.ua)
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

    validateSyncOrFail(this)
    if (this.resize) {
      if (!this.width && !this.height) {
        throw new Error('width or height is required when resizing')
      }
    }

    this.hash = sha3(this.toString())
  }

  toString(): string {
    const data = flatten(this) as Record<string, any>
    return new URLSearchParams(sortObjectByKeys(data)).toString()
  }

  isAllowed(prefixes: string[]): boolean {
    for (const prefix of prefixes) {
      if (this.url.startsWith(prefix)) return true
    }
    return false
  }

  autoFormat(ua: string) {
    if (supportsAvif(ua)) this.format!.name = 'avif'
    else if (supportsWebP(ua)) this.format!.name = 'webp'
    else this.format!.name = 'jpeg'
  }
}

export const handler: RouteHandlerMethod = async (request, reply) => {
  try {
    const q = new TransformQueryBase(request.query, { ua: request.headers['user-agent'] })

    if (!q.isAllowed(Config.allowedDomains)) {
      reply.code(403).send({ error: 'Forbidden' })
      return
    }

    // @ts-ignore
    reply.etag(q.hash)
    // @ts-ignore
    reply.expires(new Date(Date.now() + ms(Config.maxAge)))

    let stream: NodeJS.ReadableStream = (await storage.exists(q.hash))
      ? await storage.readStream(q.hash)
      : await transform(q)

    reply.code(200).headers({
      'Content-Type': `image/${q.format?.name}`,
    })

    return stream
    // .send(stream)
  } catch (err) {
    reply.code(400).send(err)
    return
  }
}
