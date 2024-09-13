import child_process from 'child_process'
import fs from 'fs'

try {
  fs.rmSync('dist', { recursive: true })
} catch {}

fs.mkdirSync('dist')

child_process.execSync('pnpm tsc -p scripts/tsconfig.cjs.json')

const omit_keys = [
  'type',
  'main',
  'scripts',
  'devDependencies',
  'simple-git-hooks',
  'lint-staged',
  'moduleOptions',
]
const packagejson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }))
const newpackagejson: Record<string, any> = {}

for (const key in packagejson) {
  if (!omit_keys.includes(key)) {
    newpackagejson[key] = packagejson[key]
  }
}

for (const key in packagejson.moduleOptions) {
  newpackagejson[key] = packagejson.moduleOptions[key]
}

fs.writeFileSync('dist/package.json', JSON.stringify(newpackagejson, null, 2))
fs.copyFileSync('LICENSE', 'dist/LICENSE')
fs.copyFileSync('README.md', 'dist/README.md')

const mjs: string[] = []

mjs.push('import * as all from "./index.js";')
mjs.push('export * from "./index.js";')
mjs.push('export default all;')

fs.writeFileSync('dist/index.mjs', mjs.join('\n') + '\n')
