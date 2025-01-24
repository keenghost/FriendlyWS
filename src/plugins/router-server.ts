import { type IServerRequestHandler } from '../main/server-node.js'
import { type IRequestHandler } from '../types/common.js'
import { WSRouter } from './router.js'

export type IGetFunction = (inPath: string, ...args: IServerRequestHandler[]) => void

export class WSServerRouter extends WSRouter {
  override get<TRequestBody = any, TResponseBody = any, TReqeustHeaders = any>(
    inPath: string,
    ...args: IServerRequestHandler<TRequestBody, TResponseBody, TReqeustHeaders>[]
  ) {
    super.get<TRequestBody, TResponseBody, TReqeustHeaders>(
      inPath,
      ...(args as IRequestHandler<TRequestBody, TResponseBody, TReqeustHeaders>[])
    )
  }
}
