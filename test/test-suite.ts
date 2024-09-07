import pico from 'picocolors'
import { PromBat } from '../src/common/utils'

type SyncAsyncFunc = (() => void) | (() => Promise<void>)

const __TEST_INFO__: {
  current: { name: string; its: { name: string; func: SyncAsyncFunc }[] } | null
  describes: { name: string; its: { name: string; func: SyncAsyncFunc }[] }[]
} = {
  current: null,
  describes: [],
}

export function describe(inName: string, inFunc: () => void) {
  __TEST_INFO__.current = { name: inName, its: [] }

  inFunc()

  __TEST_INFO__.describes.push(__TEST_INFO__.current)
  __TEST_INFO__.current = null
}

export function it(inName: string, inFunc: SyncAsyncFunc) {
  if (__TEST_INFO__.current) {
    __TEST_INFO__.current.its.push({ name: inName, func: inFunc })
  } else {
    const desc = {
      name: '',
      its: [
        {
          name: inName,
          func: inFunc,
        },
      ],
    }

    __TEST_INFO__.describes.push(desc)
  }
}

export async function runTest() {
  let curItName = ''

  try {
    while (__TEST_INFO__.describes.length > 0) {
      const desc = __TEST_INFO__.describes.shift()

      if (!desc) {
        return
      }

      const descName = desc.name
      const its = desc.its

      if (descName) {
        console.log('  ' + descName)
      }

      for (const item of its) {
        curItName = item.name
        const func = item.func

        globalThis.process?.stdout.write(pico.yellow('    = ') + curItName + '\r')

        const start = Date.now()

        await func()

        if (curItName) {
          console.log(
            pico.green('    \u2713 ') + curItName + pico.green(` (${Date.now() - start}ms)`)
          )
        }
      }

      console.log()
    }

    console.log('  ' + pico.bgGreen(' PASS ') + '\n')
  } catch (inError) {
    const newError = inError as Error | undefined

    console.log(pico.red('    \u2717 ') + curItName + '\n')
    console.log(pico.yellow(newError?.message) + '\n')
    console.log('  ' + pico.bgRed(' FAIL ') + '\n')

    globalThis.process?.exit(0)
  }
}

export async function runTestWeb() {
  let curItName = ''

  try {
    while (__TEST_INFO__.describes.length > 0) {
      const desc = __TEST_INFO__.describes.shift()

      if (!desc) {
        return
      }

      const its = desc.its

      for (const item of its) {
        curItName = item.name
        const func = item.func

        await func()

        console.log('__TEST_SUCC__' + curItName)
      }
    }
  } catch {
    console.log('__TEST_ERROR__' + curItName)
  }
}

export function expect(inActual: any) {
  return {
    toBe: (inToBeValue: any) => {
      if (inToBeValue !== inActual) {
        throw new Error(`  Expect: ${inToBeValue}\n  Actual: ${inActual}`)
      }
    },
  }
}

class PromManager {
  #PromMap: Map<string, PromBat> = new Map()

  #getProm(inKey: string) {
    const p = this.#PromMap.get(inKey)

    if (p) {
      return p
    }

    const newP = new PromBat()
    this.#PromMap.set(inKey, newP)

    return newP
  }

  handle(inStr: string) {
    if (inStr.startsWith('__TEST_SUCC__')) {
      const key = inStr.replace(/^__TEST_SUCC__/, '')
      this.#getProm(key).res()
    }

    if (inStr.startsWith('__TEST_ERROR__')) {
      const key = inStr.replace(/^__TEST_ERROR__/, '')
      this.#getProm(key).rej()
    }
  }

  emitSucc(inKey: string) {
    console.log('__TEST_SUCC__' + inKey)
  }

  emitError(inKey: string) {
    console.log('__TEST_ERROR__' + inKey)
  }

  resolve(inKey: string) {
    this.#getProm(inKey).res()
  }

  reject(inKey: string, inError?: Error) {
    this.#getProm(inKey).rej(inError)
  }

  get(inKey: string) {
    return this.#getProm(inKey).prom
  }
}

export const proms = new PromManager()
