import child_process from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

try {
  fs.rmSync('dist', { recursive: true })
} catch {}

fs.mkdirSync('dist')

child_process.execSync('pnpm tsc -p tsconfigs/tsconfig.source.json --incremental false', {
  stdio: 'inherit',
})

fs.writeFileSync('dist/index.cjs', "exports = module.exports = require('./index.js');\n")

function importDotJs(inPath: string) {
  const dirs = fs.readdirSync(inPath).map(item => path.resolve(inPath, item))

  for (const dir of dirs) {
    const stat = fs.statSync(dir)

    if (stat.isDirectory()) {
      importDotJs(dir)
    }

    if (/\.js$/.test(dir)) {
      const content = fs.readFileSync(dir, { encoding: 'utf-8' })
      const newContent = content
        .replace(/(import\s+.*\s+from\s+['"])(?!.*\.js)(\.?\.\/.*)(['"])/g, '$1$2.js$3')
        .replace(/(export\s+.*\s+from\s+['"])(?!.*\.js)(\.?\.\/.*)(['"])/g, '$1$2.js$3')
      fs.writeFileSync(dir, newContent, { encoding: 'utf-8' })
    }
  }
}

importDotJs(path.resolve('dist'))

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
