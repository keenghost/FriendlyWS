import { EMsgType, EWSErrorCode, EWSLogCode } from './enums.js'

export interface IMessage {
  type: EMsgType
  uniqueId: number
  path: string
  headers: Record<string, any>
  body: any
}

// [type, uniqueId, path, headers, body]
export type IMessageRaw = [EMsgType, number, string, Record<string, any>, any]

export type IOnMessageData = string | Buffer | ArrayBuffer | Buffer[]

export type ISendData = string | Buffer | ArrayBuffer

export type IRequestHandler<TRequestBody = any, TResponseBody = any, TRequestHeaders = any> = (
  inContext: IContext<TRequestBody, TResponseBody, TRequestHeaders>
) => Promise<void>

export interface IContext<TRequestBody = any, TResponseBody = any, TRequestHeaders = any> {
  request: {
    path: string
    headers: Record<string, any> & TRequestHeaders
    body: TRequestBody
  }
  body?: TResponseBody
  errorMessage?: string
  errorContent?: any
}

export interface IWSLogStruct {
  code: EWSLogCode
  text: string
  extra?: any
}

export interface IWSErrorStruct {
  code: EWSErrorCode
  error: Error
  extra?: any
}

export interface IWSRequestError<TContent = any> extends Error {
  content?: TContent
}
