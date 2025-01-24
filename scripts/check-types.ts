import child_process from 'node:child_process'
import fs from 'node:fs'

const dirs = fs.readdirSync('./tsconfigs')

for (const dir of dirs) {
  if (/^tsconfig\.(?!base).+\.json$/.test(dir)) {
    child_process.execSync(`pnpm tsc -p tsconfigs/${dir} --noEmit`, { stdio: 'inherit' })
  }
}
