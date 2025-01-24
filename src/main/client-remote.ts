import { WebSocket } from 'ws'
import type ws from 'ws'
import { ClientBase } from '../class/client-base'
import { type IClientBaseInitOptions } from '../class/client-base'
import { type IMessage, type ISendData } from '../types/common'
import { ECloseCode, ECloseCodeStr, PUBLIC_ONREQUEST, PUBLIC_SEND } from '../types/const'
import { EWSErrorCode } from '../types/enums'

export interface IClientRemoteInitOptions extends IClientBaseInitOptions {
  id: string
  ws: ws
}

export class RemoteClient<TExInfo = any> extends ClientBase {
  #id: string
  #ws: ws
  exInfo: TExInfo | undefined = void 0

  constructor(inOpts: IClientRemoteInitOptions) {
    super(inOpts)

    this.#id = inOpts.id
    this.#ws = inOpts.ws

    this.#ws.onmessage = inEvt => {
      const isBinary = inEvt.data instanceof Buffer

      this._onMessage(inEvt.data, isBinary)
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

    this._onOpen()
  }

  close(inCode?: number, inReason?: string) {
    const code = inCode === void 0 ? ECloseCode.C1000 : inCode
    const reason = inReason || ECloseCodeStr[code] || ''

    this.#ws.close(code, reason)
  }

  get id() {
    return this.#id
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
  };

  [PUBLIC_ONREQUEST]: (inMsg: IMessage) => void = () => {}
}
