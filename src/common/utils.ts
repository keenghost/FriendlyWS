import { IMessage } from './types'

export function toJSON<T>(inStr: string, inDefault: T) {
  try {
    return JSON.parse(inStr) as T
  } catch {
    return inDefault
  }
}

export function newMsgStr(inStruct: Partial<IMessage>) {
  return JSON.stringify([
    inStruct.type,
    inStruct.uniqueId,
    inStruct.path,
    inStruct.headers,
    inStruct.body,
  ])
}

/**
 * snippet from nanoid
 */
const __TABLE__ = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'

export function nanoid() {
  let id = ''
  let size = 32

  while (size--) {
    id = id + __TABLE__[(Math.random() * 64) | 0]
  }

  return id
}

export class PromBat<T = void> {
  #prom: Promise<T>
  #res: (inValue: T | PromiseLike<T>) => void = () => {}
  #rej: (inReason?: any) => void = () => {}

  constructor() {
    this.#prom = new Promise<T>((res, rej) => {
      this.#res = res
      this.#rej = rej
    })
  }

  get prom() {
    return this.#prom
  }

  get res() {
    return this.#res
  }

  get rej() {
    return this.#rej
  }
}
