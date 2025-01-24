export const enum EMsgType {
  NORECORD = -1,
  REQUEST = 0,
  RESPONSE = 1,
  ERROR = 2,
}

export const enum EWSErrorCode {
  DEFAULT = 1,
  HANDLER = 2,
  SEND_PING = 3,
  SEND_PONG = 4,
  SEND_REQUEST = 5,
  SEND_RESPONSE = 6,
  SEND_ERROR = 7,
}

export const enum EWSLogCode {
  CLOSED = 1,
  LISTENING = 2,
  CONNECTED = 3,
  RECIEVED_BINARY = 4,
  RECIEVED_MESSAGE = 5,
  RECIEVED_HEARTBEAT = 6,
}
