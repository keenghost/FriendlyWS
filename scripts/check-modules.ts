import fs from 'node:fs'
import { builtinModules } from 'node:module'

const files = process.argv.slice(2)

for (const file of files) {
  if (!/\.(js|ts)$/.test(file)) {
    continue
  }

  const content = fs.readFileSync(file, { encoding: 'utf-8' })
  const regexp = /\s+from\s+['"](.*)['"]/g
  const matches = content.matchAll(regexp)

  for (const match of matches) {
    const modname = match[1]

    if (modname.startsWith('node:')) {
      continue
    }

    if (builtinModules.includes(modname)) {
      throw new Error(`${file}: '${modname}' should use prefix like 'node:${modname}'`)
    }
  }
}
