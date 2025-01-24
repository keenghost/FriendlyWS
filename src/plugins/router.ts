import { type IContext, type IRequestHandler } from '../types/common'

export class WSRouter {
  protected _handlers: Map<string, IRequestHandler[]> = new Map()

  get<TRequestBody = any, TResponseBody = any, TReqeustHeaders = any>(
    inPath: string,
    ...args: IRequestHandler<TRequestBody, TResponseBody, TReqeustHeaders>[]
  ) {
    this._handlers.set(inPath, args)
  }

  protected async _handler(inContext: IContext) {
    const request = inContext.request
    const handlers = this._handlers.get(request.path)

    if (!handlers) {
      throw new Error(`No handler for path: ${request.path}`)
    }

    for (const handler of handlers) {
      await handler(inContext)
    }
  }

  routes() {
    const handler: IRequestHandler = (inContext: IContext) => this._handler(inContext)

    return handler
  }
}
