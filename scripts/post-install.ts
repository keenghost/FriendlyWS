import fs from 'node:fs'

const pnpmlock = fs.readFileSync('pnpm-lock.yaml', { encoding: 'utf-8' })

fs.writeFileSync('pnpm-lock.yaml', pnpmlock.replace(/, tarball: .*}/g, '}'))
