import {
  EMsgType,
  EWSErrorCode,
  EWSLogCode,
  IMessage,
  IMessageRaw,
  IOnMessageData,
  ISendData,
  IWSRequestError,
  PUBLIC_ONREQUEST,
  PUBLIC_SEND,
} from '../common/types'
import { newMsgStr, toJSON } from '../common/utils'
import { IWSBaseInitOptions, WSBase } from './ws-base'

export interface IClientBaseInitOptions extends IWSBaseInitOptions {}

export interface IRequestExtra {
  noResponse?: boolean
  unique?: string
  headers?: Record<any, any>
}

export interface IResponseStruct {
  res: (inData: any) => void
  rej: (inErr: Error) => void
}

export abstract class ClientBase extends WSBase {
  constructor(inOpts: IClientBaseInitOptions) {
    super(inOpts)
  }

  #resHandlers: Map<number, IResponseStruct> = new Map()
  #hbTimer: NodeJS.Timeout | number | undefined = void 0
  #hbTimeout: NodeJS.Timeout | number | undefined = void 0
  #nextRequestId = 0

  #getNextRequestId() {
    if (this.#nextRequestId === Number.MAX_SAFE_INTEGER) {
      this.#nextRequestId = 0
    }

    return ++this.#nextRequestId
  }

  protected override _onOpen() {
    super._onOpen()

    this._onLog({
      code: EWSLogCode.CONNECTED,
      text: 'connected',
    })
    this.#runHeartBeat()
  }

  protected override _onClose(inCode?: number, inReason?: string) {
    super._onClose(inCode, inReason)

    clearTimeout(this.#hbTimer)
    clearTimeout(this.#hbTimeout)
    this.#resHandlers.forEach(v => v.rej(new Error('websocket closed')))
    this.#resHandlers.clear()
  }

  request<TRequestBody = void, TResponseBody = void>(
    inPath: string,
    inBody: TRequestBody,
    inExtra?: IRequestExtra
  ) {
    const requestId = this.#getNextRequestId()
    const sentData = newMsgStr({
      type: EMsgType.REQUEST,
      uniqueId: requestId,
      path: inPath,
      headers: inExtra?.headers || {},
      body: inBody,
    })

    return new Promise<TResponseBody>((resolve, reject) => {
      this[PUBLIC_SEND](sentData)
        .then(() => {
          if (inExtra?.noResponse) {
            return resolve(void 0 as TResponseBody)
          }

          this.#resHandlers.set(requestId, { res: resolve, rej: reject })
        })
        .catch(inError => {
          reject(inError)
        })
    })
  }

  #runHeartBeat() {
    clearTimeout(this.#hbTimeout)
    this.#hbTimer = setTimeout(() => {
      this[PUBLIC_SEND]('ping').catch(inError => {
        this._onError({
          code: EWSErrorCode.SEND_PING,
          error: inError,
        })
      })

      this.#hbTimeout = setTimeout(() => {
        this.close(3000, 'heartbeat timeout')
      }, 10000)
    }, 60000)
  }

  protected _onMessage = (inMsgData: IOnMessageData, inIsBinary: boolean) => {
    if (inIsBinary) {
      this._onLog({
        code: EWSLogCode.RECIEVED_BINARY,
        text: 'recieved binary',
        extra: inMsgData,
      })

      return
    }

    const msgStr = inMsgData.toString()

    if (msgStr === 'ping' || msgStr === 'pong') {
      if (msgStr === 'ping') {
        this[PUBLIC_SEND]('pong').catch(inError => {
          this._onError({
            code: EWSErrorCode.SEND_PONG,
            error: inError,
            extra: this,
          })
        })
      } else {
        this.#runHeartBeat()
      }

      this._onLog({
        code: EWSLogCode.RECIEVED_HEARTBEAT,
        text: `recieved ${msgStr}`,
      })

      return
    }

    const msgRaw = toJSON<IMessageRaw>(msgStr, [EMsgType.NORECORD, -1, '', {}, void 0])
    const msg = {
      type: msgRaw[0],
      uniqueId: msgRaw[1],
      path: msgRaw[2],
      headers: msgRaw[3] instanceof Object ? msgRaw[3] : {},
      body: msgRaw[4],
    }

    this._onLog({
      code: EWSLogCode.RECIEVED_BINARY,
      text: `recieved message ${JSON.stringify(msg)}`,
      extra: msg,
    })

    switch (msg.type) {
      case EMsgType.REQUEST: {
        this[PUBLIC_ONREQUEST](msg)
        break
      }

      case EMsgType.RESPONSE: {
        const resHandler = this.#resHandlers.get(msg.uniqueId)

        if (!resHandler) {
          return
        }

        resHandler.res(msg.body)
        this.#resHandlers.delete(msg.uniqueId)
        break
      }

      case EMsgType.ERROR: {
        const resHandler = this.#resHandlers.get(msg.uniqueId)

        if (!resHandler) {
          return
        }

        if (typeof msg.body === 'string') {
          resHandler.rej(new Error(msg.body))
        }

        if (typeof msg.body === 'object') {
          const body = msg.body as Pick<IWSRequestError, 'message' | 'content'>
          const newError = new Error(body.message) as IWSRequestError
          newError.content = body.content

          resHandler.rej(newError)
        }

        this.#resHandlers.delete(msg.uniqueId)
        break
      }

      default: {
        break
      }
    }
  };

  abstract [PUBLIC_SEND]: (inData: ISendData) => Promise<void>;
  abstract [PUBLIC_ONREQUEST]: (inMessage: IMessage) => void
}
