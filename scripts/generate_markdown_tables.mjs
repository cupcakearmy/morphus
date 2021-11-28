import { config, StorageType } from '../dist/src/config.js'

const schema = config._def

function stringAsMarkdownCode(string) {
  return '`' + string + '`'
}

for (const storage of Object.values(StorageType)) {
  const storageType = schema[storage]
  let table = `
  | Config           | Environment        | Default | Description              |
  | ---------------- | ------------------ | ------- | ------------------------ |
  `
  for (const [key, value] of Object.entries(storageType)) {
    table += `| \`${storage}.${key}\` | \`${value.env}\` | ${value.default} | ${value.doc} |\n`
  }

  console.log(table)
}
