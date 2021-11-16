import DeviceDetector from 'device-detector-js'
import Avif from 'caniuse-db/features-json/avif.json'
import WebP from 'caniuse-db/features-json/webp.json'

const detector = new DeviceDetector()

function findLowestCompatibleVersion(stat: Record<string, string>): string {
  const entries = Object.entries(stat).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  for (const [version, support] of entries) {
    if (support.startsWith('y') || support.startsWith('a')) {
      return version
    }
  }
}

const mapping = {
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
  if (!browser.os || !browser.client) throw new Error('Invalid browser')
  if (browser.os.name === 'iOS') {
    return 'ios_saf'
  }
  if (browser.os.name in mapping) {
    return mapping[browser.os.name as keyof typeof mapping]
  }
  throw new Error('Could not determine mapping for browser')
}

function match(feature: typeof Avif | typeof WebP, ua: string): boolean {
  const browser = detector.parse(ua)
  const stats = feature.stats[matchBrowserToStat(browser) as keyof typeof feature.stats]
  console.debug(stats)
  console.debug(findLowestCompatibleVersion(stats))
  return false
}
