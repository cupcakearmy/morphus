import DeviceDetector from 'device-detector-js'
import Avif from 'caniuse-db/features-json/avif.json'
import WebP from 'caniuse-db/features-json/webp.json'

const detector = new DeviceDetector()

function findLowestSupportedVersion(stat: Record<string, string>): number | null {
  const entries = Object.entries(stat).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  for (const [version, support] of entries) {
    if (support.startsWith('y') || support.startsWith('a')) {
      return parseInt(version)
    }
  }
  return null
}

const BrowserMappings = {
  'Internet Explorer': 'ie',
  'Microsoft Edge': 'edge',
  Firefox: 'firefox',
  Chrome: 'chrome',
  Safari: 'safari',
  Opera: 'opera',
  'Mobile Safari': 'ios_saf',
  'Opera Mini': 'op_mini',
  'Android Browser': 'android',
  'Chrome Mobile': 'and_chr',
  'Firefox Mobile': 'and_ff',
  'UC Browser': 'and_uc',
  'Samsung Browser': 'samsung',
  'QQ Browser': 'and_qq',
}

function matchBrowserToStat(browser: DeviceDetector.DeviceDetectorResult): string {
  if (browser.os!.name === 'iOS') {
    return 'ios_saf'
  }
  if (browser.client!.name in BrowserMappings) {
    return BrowserMappings[browser.client!.name as keyof typeof BrowserMappings]
  }
  throw new Error('Could not determine mapping for browser')
}

function match(feature: typeof Avif | typeof WebP, ua: string): boolean {
  const browser = detector.parse(ua)
  if (!browser.client || !browser.os) {
    throw new Error('Could not parse browser')
  }
  const stats = feature.stats[matchBrowserToStat(browser) as keyof typeof feature.stats]
  const lowestSupported = findLowestSupportedVersion(stats)
  if (lowestSupported === null) {
    return false
  }
  return lowestSupported <= parseInt(browser.client.version)
}

export function supportsAvif(ua: string): boolean {
  try {
    return match(Avif, ua)
  } catch {
    return false
  }
}

export function supportsWebP(ua: string): boolean {
  try {
    return match(WebP, ua)
  } catch {
    return false
  }
}
