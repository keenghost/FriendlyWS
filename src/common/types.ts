export const PUBLIC_SEND = Symbol()
export const PUBLIC_ONLOG = Symbol()
export const PUBLIC_ONCLOSE = Symbol()
export const PUBLIC_ONERROR = Symbol()
export const PUBLIC_ONREQUEST = Symbol()

export enum EMsgType {
  NORECORD = -1,
  REQUEST = 0,
  RESPONSE = 1,
  ERROR = 2,
}

export enum EWSErrorCode {
  DEFAULT = 1,
  HANDLER = 2,
  SEND_PING = 3,
  SEND_PONG = 4,
  SEND_REQUEST = 5,
  SEND_RESPONSE = 6,
  SEND_ERROR = 7,
}

export enum EWSLogCode {
  CLOSED = 1,
  LISTENING = 2,
  CONNECTED = 3,
  RECIEVED_BINARY = 4,
  RECIEVED_MESSAGE = 5,
  RECIEVED_HEARTBEAT = 6,
}

export const ECloseCode = {
  C1000: 1000,
  C1001: 1001,
  C1002: 1002,
  C1003: 1003,
  C1004: 1004,
  C1005: 1005,
  C1006: 1006,
  C1007: 1007,
  C1008: 1008,
  C1009: 1009,
  C1010: 1010,
  C1011: 1011,
  C1012: 1012,
  C1013: 1013,
  C1014: 1014,
  C1015: 1015,
}

export const ECloseCodeStr: Record<number, string> = {
  1000: 'Normal Closure',
  1001: 'Going Away',
  1002: 'Protocol Error',
  1003: 'Unsupported Data',
  1004: 'Reserved',
  1005: 'No Status Received',
  1006: 'Abnormal Closure',
  1007: 'Invalid Payload Data',
  1008: 'Policy Violation',
  1009: 'Message Too Big',
  1010: 'Missing Extension',
  1011: 'Internal Error',
  1012: 'Service Restart',
  1013: 'Try Again Later',
  1014: 'Reserved',
  1015: 'TLS Handshake Failure',
}

/* code explains from chatgpt */
// - 1001: Going Away - This code is used when an endpoint is going away, such as a server going down or a browser tab being closed.
// - 1002: Protocol Error - This code is used when there is a protocol error, such as an invalid frame received or an unsupported data type.
// - 1003: Unsupported Data - This code is used when the endpoint received data of an unsupported data type.
// - 1004: Reserved - This code is reserved and should not be used.
// - 1005: No Status Received - This code is used when no status code was actually present in the close frame.
// - 1006: Abnormal Closure - This code is used when the connection was closed abnormally, without sending or receiving a close frame.
// - 1007: Invalid Payload Data - This code is used when the payload data contains an invalid character sequence or is not in a valid format.
// - 1008: Policy Violation - This code is used when there is a policy violation, such as a cross-origin request that is not allowed.
// - 1009: Message Too Big - This code is used when the received message is too big for the endpoint to process.
// - 1010: Missing Extension - This code is used when the endpoint requires an extension that the other endpoint did not negotiate.
// - 1011: Internal Error - This code is used when an internal server error occurred while processing the request.
// - 1012: Service Restart - This code is used when the server is restarting.
// - 1013: Try Again Later - This code is used when the server is temporarily unavailable and the client should try again later.
// - 1014: Reserved - This code is reserved and should not be used.
// - 1015: TLS Handshake Failure - This code is used when the connection was closed due to a TLS handshake failure.

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
