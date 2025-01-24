import {
  ClientLocalBase,
  type IClientLocalBaseInitOptions,
} from '../class/client-local-base.js'
import { type ISendData } from '../types/common.js'
import { ECloseCode, ECloseCodeStr, PUBLIC_SEND } from '../types/const.js'
import { EWSErrorCode } from '../types/enums.js'

export interface IClientWebInitOptions extends IClientLocalBaseInitOptions {}

export class WSWebClient extends ClientLocalBase {
  #ws: WebSocket

  constructor(inOpts: IClientWebInitOptions) {
    super(inOpts)

    const protocols: string[] = []

    if (inOpts.token) {
      protocols.push('__token__' + inOpts.token)
    }

    this.#ws = new WebSocket(inOpts.url, protocols)

    this.#ws.onopen = () => {
      this._onOpen()
    }

    this.#ws.onmessage = inEvt => {
      const isBinary = inEvt.data instanceof Blob

      this._onMessage(inEvt.data, isBinary)
    }

    this.#ws.onclose = inEvt => {
      this._onClose(inEvt.code, inEvt.reason)
    }

    this.#ws.onerror = () => {
      this._onError({ code: EWSErrorCode.DEFAULT, error: new Error('websocket error') })
    }
  }

  close(inCode?: number, inReason?: string) {
    const code = inCode === void 0 ? ECloseCode.C1000 : inCode
    const reason = inReason || ECloseCodeStr[code] || ''

    this.#ws.close(code, reason)
  }

  [PUBLIC_SEND] = (inData: ISendData) => {
    return new Promise<void>((resolve, reject) => {
      if (this.#ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('websocket is not open'))
      }

      this.#ws.send(inData)
      resolve()
    })
  }
}
