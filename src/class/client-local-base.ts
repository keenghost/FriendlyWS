import { EMsgType, EWSErrorCode, PUBLIC_ONREQUEST, PUBLIC_SEND } from '../common/types'
import type { IContext, IMessage, IRequestHandler } from '../common/types'
import { newMsgStr } from '../common/utils'
import { ClientBase } from './client-base'
import type { IClientBaseInitOptions } from './client-base'

export interface IClientLocalBaseInitOptions extends IClientBaseInitOptions {
  url: string
  token?: string
}

export abstract class ClientLocalBase extends ClientBase {
  #handlers: IRequestHandler[] = []
  #errorHandlers: ((inError: Error, inContext: IContext) => Promise<void>)[] = []

  constructor(inOpts: IClientLocalBaseInitOptions) {
    super(inOpts)
  }

  async #onRequest(inMsg: IMessage) {
    const ctx: IContext = {
      request: {
        path: inMsg.path,
        headers: inMsg.headers,
        body: inMsg.body,
      },
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
        // error reponse
        await this[PUBLIC_SEND](
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

      // response
      await this[PUBLIC_SEND](
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

  [PUBLIC_ONREQUEST]: (inMessage: IMessage) => void = (inMsg: IMessage) =>
    this.#onRequest(inMsg)

  use<TRequestBody = any, TResponseBody = any, TRequestHeaders = any>(
    inHandler: IRequestHandler<TRequestBody, TResponseBody, TRequestHeaders>
  ) {
    this.#handlers.push(inHandler)
  }

  useError<TRequestBody = any, TResponseBody = any, TRequestHeaders = any>(
    inHandler: (
      inError: Error,
      inContext: IContext<TRequestBody, TResponseBody, TRequestHeaders>
    ) => Promise<void>
  ) {
    this.#errorHandlers.push(inHandler)
  }
}
