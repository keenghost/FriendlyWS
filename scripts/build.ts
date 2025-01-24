import child_process from 'node:child_process'
import fs from 'node:fs'

try {
  fs.rmSync('dist', { recursive: true })
} catch {}

child_process.execSync('pnpm tsc -p tsconfigs/tsconfig.source.json --incremental false', {
  stdio: 'inherit',
})

const omit_keys = ['scripts', 'devDependencies', 'simple-git-hooks', 'lint-staged']
const packagejson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }))
const newpackagejson: Record<string, any> = {}

for (const key in packagejson) {
  if (!omit_keys.includes(key)) {
    newpackagejson[key] = packagejson[key]
  }
}

fs.writeFileSync('dist/package.json', JSON.stringify(newpackagejson, null, 2))
fs.copyFileSync('LICENSE', 'dist/LICENSE')
fs.copyFileSync('README.md', 'dist/README.md')
