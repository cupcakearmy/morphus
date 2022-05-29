import { config, StorageType } from '../dist/src/config.js'

const schema = config._def

const asInlineCode = (s) => '`' + s + '`'
const formatInline = (s, empty = '') => (s === undefined ? empty : asInlineCode(s))
const formatEnv = (s) => formatInline(s, 'not supported')
const formatDefault = (s) => formatInline(s, '')

for (const storage of Object.values(StorageType)) {
  const storageType = schema[storage]
  let table = `
  | Config           | Environment        | Default | Description              |
  | ---------------- | ------------------ | ------- | ------------------------ |
  `
  for (const [key, value] of Object.entries(storageType)) {
    table += `| \`${storage}.${key}\` | ${formatEnv(value.env)} | ${formatDefault(value.default)} | ${value.doc} |\n`
  }

  console.log(table)
}

{
  let table = `
  | Config | Environment | Default | Description |
  | ------- | ----------- | ------- | ------------ |
`

  for (const [key, value] of Object.entries(schema)) {
    if (Object.values(StorageType).includes(key)) continue
    table += `| ${asInlineCode(key)} | ${formatEnv(value.env)} | ${formatDefault(value.default)} | ${value.doc} |\n`
  }

  console.log(table)
}
