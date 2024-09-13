import fs from 'node:fs'
import { builtinModules } from 'node:module'

const files = process.argv.slice(2)
const __ESM_REGEXP__ = /\s+from\s+['"](.*)['"]/g
const __CJS_REGEXP__ = /\s+require\(['"](.*)['"]\)/g

for (const file of files) {
  const content = fs.readFileSync(file, { encoding: 'utf-8' })
  const regexp = /\.cjs$/.test(file) ? __CJS_REGEXP__ : __ESM_REGEXP__
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
