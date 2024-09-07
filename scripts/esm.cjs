const fs = require('fs')

const cjsPath = '../dist/index.js'
const FriendlyWS = require(cjsPath)
const mjs = []

mjs.push("import FriendlyWS from './index.js';")

for (const key in FriendlyWS) {
  if (key !== 'default') {
    mjs.push(`export const ${key} = FriendlyWS.${key};`)
  }
}

mjs.push(`export default FriendlyWS;`)

fs.writeFileSync('dist/index.mjs', mjs.join('\n'))
