const fs = require('fs')

const mjs = []

mjs.push('import * as all from "./index.js";')
mjs.push('export * from "./index.js";')
mjs.push('export default all;')

fs.writeFileSync('dist/index.mjs', mjs.join('\n') + '\n')
