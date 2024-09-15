import http from 'node:http'
import type { IncomingMessage } from 'node:http'
import type internal from 'node:stream'
import { WebSocketServer } from 'ws'
import type ws from 'ws'
import { WSBase } from '../class/ws-base'
import type { IWSBaseInitOptions } from '../class/ws-base'
import {
  ECloseCode,
  ECloseCodeStr,
  EMsgType,
  EWSErrorCode,
  EWSLogCode,
  PUBLIC_ONCLOSE,
  PUBLIC_ONERROR,
  PUBLIC_ONLOG,
  PUBLIC_ONREQUEST,
  PUBLIC_SEND,
} from '../common/types'
import { IContext, IMessage, IWSErrorStruct, IWSLogStruct } from '../common/types'
import { nanoid, newMsgStr } from '../common/utils'
import { RemoteClient } from './client-remote'

export interface IServerNodeInitOptions<TRemoteClientExInfo = any> extends IWSBaseInitOptions {
  port?: number
  httpServer?: http.Server
  onPreConnect?: (inToken: string, inUrl: string) => Promise<string | void>
  onConnected?: (inRemoteClient: RemoteClient<TRemoteClientExInfo>) => Promise<void>
  onClientLog?: (
    inLogStruct: IWSLogStruct,
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
  ) => void
  onClientError?: (
    inErrorStruct: IWSErrorStruct,
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
  ) => void
  onClientClose?: (
    inCodeReason: { code?: number | undefined; reason?: string | undefined },
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
  ) => void
}

export interface IServerContext<TRequestBody = any, TResponseBody = any, TRequestHeaders = any>
  extends IContext<TRequestBody, TResponseBody, TRequestHeaders> {
  remoteClient: RemoteClient
}

export type IServerRequestHandler<
  TRequestBody = any,
  TResponseBody = any,
  TRequestHeaders = any,
> = (inContext: IServerContext<TRequestBody, TResponseBody, TRequestHeaders>) => Promise<void>

export class WSNodeServer<TRemoteClientExInfo = any> extends WSBase {
  #wsServer: ws.Server
  #httpServer: http.Server

  #useInnerHttp = false
  #clients: RemoteClient<TRemoteClientExInfo>[] = []

  #onPreConnect: (inToken: string, inUrl: string) => Promise<string | void> = () =>
    Promise.resolve()
  #onConnected: (inRemoteClient: RemoteClient<TRemoteClientExInfo>) => Promise<void> = () =>
    Promise.resolve()
  #onClientLog: (
    inLogStruct: IWSLogStruct,
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
  ) => void = () => {}
  #onClientError: (
    inErrorStruct: IWSErrorStruct,
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
  ) => void = () => {}
  #onClientClose: (
    inCodeReason: { code?: number | undefined; reason?: string | undefined },
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
  ) => void = () => {}

  #handlers: IServerRequestHandler[] = []
  #errorHandlers: ((inError: Error, inContext: IServerContext) => Promise<void>)[] = []
  #connectMap: WeakMap<ws, RemoteClient<TRemoteClientExInfo>> = new WeakMap()

  constructor(inOpts: IServerNodeInitOptions<TRemoteClientExInfo>) {
    if (!inOpts.httpServer && !inOpts.port) {
      throw new Error('no port or httpServer provided')
    }

    super(inOpts)

    this.#onPreConnect = inOpts.onPreConnect || this.#onPreConnect
    this.#onConnected = inOpts.onConnected || this.#onConnected
    this.#onClientLog = inOpts.onClientLog || this.#onClientLog
    this.#onClientError = inOpts.onClientError || this.#onClientError
    this.#onClientClose = inOpts.onClientClose || this.#onClientClose
    this.#useInnerHttp = !inOpts.httpServer

    this.#httpServer = inOpts.httpServer ? inOpts.httpServer : http.createServer()
    this.#wsServer = new WebSocketServer({ noServer: true })

    const onUpgrade = (
      inRequest: http.IncomingMessage,
      inSocket: internal.Duplex,
      inHead: Buffer
    ) => {
      this.#onUpgrade(inRequest, inSocket, inHead)
    }

    this.#httpServer.on('upgrade', onUpgrade)

    this.#wsServer.on('connection', async ws => {
      const remoteClient = this.#connectMap.get(ws)

      if (remoteClient) {
        try {
          await this.#onConnected(remoteClient)
        } catch (inError) {
          const newErr = inError as Error
          remoteClient.close(
            ECloseCode.C1000,
            newErr.message || ECloseCodeStr[ECloseCode.C1000] || ''
          )
        }

        this.#connectMap.delete(ws)
      }
    })

    this.#wsServer.on('error', inError => {
      this._onError({
        code: EWSErrorCode.DEFAULT,
        error: inError,
      })
    })

    this.#wsServer.on('close', () => {
      this._onClose()
      this.#httpServer.off('upgrade', onUpgrade)

      if (this.#useInnerHttp) {
        this.#httpServer.close(inError => {
          if (inError) {
            this._onError({
              code: EWSErrorCode.DEFAULT,
              error: inError,
            })
          }
        })
      }
    })

    if (this.#httpServer.listening) {
      this._onLog({ code: EWSLogCode.LISTENING, text: 'listening' })
      this._onOpen()
    } else {
      this.#httpServer.on('listening', () => {
        this._onLog({ code: EWSLogCode.LISTENING, text: 'listening' })
        this._onOpen()
      })
    }

    if (this.#useInnerHttp) {
      this.#httpServer.listen(inOpts.port)
    }
  }

  clients(): RemoteClient<TRemoteClientExInfo>[]

  clients(inId: string): RemoteClient<TRemoteClientExInfo> | undefined

  clients(inId?: string) {
    if (inId !== void 0) {
      return this.#clients.find(item => item.id === inId)
    }

    return this.#clients
  }

  broadcast<TRequestBody = void>(
    inPath: string,
    inData: TRequestBody,
    inHeaders: Record<string, any> = {}
  ) {
    for (const client of this.#clients) {
      client.request<TRequestBody>(inPath, inData, {
        noResponse: true,
        headers: inHeaders,
      })
    }
  }

  async #onUpgrade(inRequest: IncomingMessage, inSocket: internal.Duplex, inHead: Buffer) {
    const protocolStr = inRequest.headers['sec-websocket-protocol'] || ''
    const protocols = protocolStr.split(',')

    const protocol = protocols.find(item => item.startsWith('__token__')) || ''
    const token = protocol.replace('__token__', '')

    try {
      const id = await this.#onPreConnect(token, inRequest.url || '')

      this.#wsServer.handleUpgrade(inRequest, inSocket, inHead, async ws => {
        const remoteClient = new RemoteClient<TRemoteClientExInfo>({
          id: id || nanoid(),
          ws: ws,
        })

        remoteClient[PUBLIC_ONLOG] = inLogStruct => {
          this.#onClientLog(inLogStruct, remoteClient)
        }

        remoteClient[PUBLIC_ONERROR] = inErrorStruct => {
          this.#onClientError(inErrorStruct, remoteClient)
        }

        remoteClient[PUBLIC_ONCLOSE] = (inCode, inReason) => {
          this.#clients = this.#clients.filter(item => item !== remoteClient)
          this.#onClientClose({ code: inCode, reason: inReason }, remoteClient)
        }

        remoteClient[PUBLIC_ONREQUEST] = (inMsg: IMessage) =>
          this.#onRequest(inMsg, remoteClient)

        this.#clients.push(remoteClient)
        this.#connectMap.set(ws, remoteClient)
        this.#wsServer.emit('connection', ws, inRequest)
      })
    } catch {
      inSocket.destroy()
    }
  }

  async #onRequest(inMsg: IMessage, inRemoteClient: RemoteClient) {
    const ctx: IServerContext = {
      request: {
        path: inMsg.path,
        headers: inMsg.headers,
        body: inMsg.body,
      },
      remoteClient: inRemoteClient,
    }

    let handlerError: Error | undefined = void 0

    try {
      for (const handler of this.#handlers) {
        await handler(ctx)
      }
    } catch (inError) {
      try {
        for (const errorHandler of this.#errorHandlers) {
          await errorHandler(inError as Error, ctx)
        }
      } catch (inError) {
        handlerError = inError as Error
      }
    }

    if (ctx.errorMessage !== void 0 || ctx.errorContent !== void 0 || handlerError !== void 0) {
      if (!inMsg.uniqueId) {
        this._onError({
          code: EWSErrorCode.HANDLER,
          error: handlerError || new Error(),
          extra: ctx,
        })

        return
      }

      try {
        await inRemoteClient[PUBLIC_SEND](
          newMsgStr({
            type: EMsgType.ERROR,
            uniqueId: inMsg.uniqueId,
            path: inMsg.path,
            body: {
              message: ctx.errorMessage || '',
              content: ctx.errorContent,
            },
          })
        )
      } catch (inError) {
        this._onError({
          code: EWSErrorCode.SEND_ERROR,
          error: inError as Error,
          extra: ctx,
        })
      }

      return
    }

    try {
      if (!inMsg.uniqueId) {
        return
      }

      await inRemoteClient[PUBLIC_SEND](
        newMsgStr({
          type: EMsgType.RESPONSE,
          path: inMsg.path,
          uniqueId: inMsg.uniqueId,
          body: ctx.body,
        })
      )
    } catch (inError) {
      this._onError({
        code: EWSErrorCode.SEND_RESPONSE,
        error: inError as Error,
        extra: ctx,
      })
    }
  }

  close(inCode?: number, inReason?: string) {
    for (const client of this.#clients) {
      const code = inCode === void 0 ? ECloseCode.C1000 : inCode
      client.close(code, inReason || ECloseCodeStr[code] || '')
    }

    this.#wsServer.close()
  }

  use<TRequestBody = any, TResponseBody = any, TRequestHeaders = any>(
    inHandler: IServerRequestHandler<TRequestBody, TResponseBody, TRequestHeaders>
  ) {
    this.#handlers.push(inHandler)
  }

  useError<TRequestBody = any, TResponseBody = any, TRequestHeaders = any>(
    inHandler: (
      inError: Error,
      inContext: IServerContext<TRequestBody, TResponseBody, TRequestHeaders>
    ) => Promise<void>
  ) {
    this.#errorHandlers.push(inHandler)
  }
}
