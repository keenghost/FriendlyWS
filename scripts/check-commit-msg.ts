import fs from 'node:fs'
import path from 'node:path'
import picocolors from 'picocolors'

const msgPath = path.resolve('.git/COMMIT_EDITMSG')
const msg = fs.readFileSync(msgPath, 'utf-8').trim()

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.log(
    '  ' +
      picocolors.bgRed(picocolors.white(' ERROR ')) +
      picocolors.red(' invalid commit message format.\n')
  )
  console.log(
    picocolors.yellow(
      '  Proper commit message format is required for automated changelog generation. Examples:\n'
    )
  )
  console.log(picocolors.green('    feat: add download component\n'))
  console.log(picocolors.green('    fix: upload slice number not matched (close #1)\n'))
  process.exit(1)
}
