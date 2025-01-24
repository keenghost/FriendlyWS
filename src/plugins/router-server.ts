import { type IServerRequestHandler } from '../main/server-node'
import { type IRequestHandler } from '../types/common'
import { WSRouter } from './router'

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
