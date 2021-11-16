import { get } from 'https'
import sharp from 'sharp'
import { PassThrough } from 'stream'
import { ComplexParameter, TransformQueryBase } from '../controllers'

import { storage } from '../storage'
import { sha3, splitter } from '../utils/utils'

async function downloadImage(url: string): Promise<NodeJS.ReadableStream> {
  const disk = await storage.writeStream(sha3(url))
  return new Promise((resolve) => {
    get(url, (res) => {
      const out = new PassThrough()
      splitter(res, out, disk)
      resolve(out)
    })
  })
}

export async function getImage(url: string): Promise<NodeJS.ReadableStream> {
  const id = sha3(url)
  if (!(await storage.exists(id))) {
    return await downloadImage(url)
  }
  return await storage.readStream(id)
}

function applyOperation(pipeline: sharp.Sharp, { name, options }: ComplexParameter<string, any>): sharp.Sharp {
  switch (name) {
    case 'negate':
    case 'clahe':
    case 'convolve':
    case 'modulate':
      return pipeline[name](options)
    case 'flip':
    case 'flop':
    case 'normalise':
    case 'normalize':
    case 'greyscale':
    case 'grayscale':
    case 'removeAlpha':
      return pipeline[name]()
    case 'rotate': {
      const { angle, ...rest } = options
      return pipeline.rotate(angle, rest)
    }
    case 'threshold': {
      const { threshold, ...rest } = options
      return pipeline.threshold(threshold, rest)
    }
    case 'boolean': {
      const { operator, operand, ...rest } = options
      return pipeline.boolean(operand, operator, rest)
    }
    case 'linear':
      return pipeline.linear(options.a, options.b)
    case 'sharpen':
      return pipeline.sharpen(options.sigma, options.flat, options.jagged)
    case 'media':
      return pipeline.median(options.size)
    case 'blur':
      return pipeline.blur(options.sigma)
    case 'flatten':
      return pipeline.flatten(options.background)
    case 'gamma':
      return pipeline.gamma(options.gamma)
    case 'tint':
      return pipeline.tint(options.rgb)
    case 'pipelineColorspace':
    case 'pipelineColourspace':
      return pipeline.pipelineColorspace(options.colorspace || options.colourspace)
    case 'toColorspace':
    case 'toColourspace':
      return pipeline.toColorspace(options.colorspace || options.colourspace)
    case 'ensureAlpha':
      return pipeline.ensureAlpha(options.alpha)
    case 'extractChannel':
      return pipeline.extractChannel(options.channel)
    default:
      throw new Error(`Unsupported operation ${name}`)
  }
}

export function buildPipeline(options: TransformQueryBase) {
  let pipeline = sharp()
  if (options.resize) {
    pipeline = pipeline.resize({
      fit: options.resize,
      width: options.width,
      height: options.height,
    })
  }
  if (options.format) {
    pipeline = pipeline.toFormat(options.format.name, options.format.options)
  }

  for (const op of options.op) {
    try {
      pipeline = applyOperation(pipeline, op)
    } catch (e) {
      throw new Error(`${op.name} is not a valid operation: ${e}`)
    }
  }
  return pipeline
}

export async function transform(options: TransformQueryBase): Promise<NodeJS.ReadableStream> {
  const source = await getImage(options.url)
  const pipeline = buildPipeline(options)
  const writer = await storage.writeStream(options.hash)
  const out = new PassThrough()
  splitter(source.pipe(pipeline), writer, out)
  return out
}
