import { WebSocket } from 'ws'
import { ClientLocalBase } from '../class/client-local-base'
import { type IClientLocalBaseInitOptions } from '../class/client-local-base'
import { type ISendData } from '../types/common'
import { ECloseCode, ECloseCodeStr, PUBLIC_SEND } from '../types/const'
import { EWSErrorCode } from '../types/enums'

export interface IClientNodeInitOptions extends IClientLocalBaseInitOptions {}

export class WSNodeClient extends ClientLocalBase {
  #ws: WebSocket

  constructor(inOpts: IClientNodeInitOptions) {
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
      this._onMessage(inEvt.data, inEvt.data instanceof Buffer)
    }

    this.#ws.onclose = inEvt => {
      this._onClose(inEvt.code, inEvt.reason)
    }

    this.#ws.onerror = inEvt => {
      this._onError({
        code: EWSErrorCode.DEFAULT,
        error: inEvt.error,
      })
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

      this.#ws.send(inData, inError => {
        inError ? reject(inError) : resolve()
      })
    })
  }
}
