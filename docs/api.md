#### WSNodeServer

- constructor options

  - onOpen?: () => void
  - onLog?: (inLogStruct: IWSLogStruct) => void
  - onError?: (inErrorStruct: IWSErrorStruct) => void
  - onClose?: (inCode?: number, inReason?: string) => void

  - port?: number
  - httpServer?: http.Server
  - onPreConnect?: (inToken: string, inUrl: string) => Promise<string | void>
  - onConnected?: (inRemoteClient: RemoteClient<TRemoteClientExInfo>) => Promise<void>
  - onClientLog?: (
    inLogStruct: IWSLogStruct,
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
    ) => void
  - onClientError?: (
    inErrorStruct: IWSErrorStruct,
    inRemoteClient: RemoteClient<TRemoteClientExInfo>
    ) => void
  - onClientClose?: (
    inRemoteClient: RemoteClient<TRemoteClientExInfo>,
    inCode?: number,
    inReason?: string
    ) => void

- broadcast()
- clients()
- close()
- opened
- use()
- useError()

#### WSNodeClient

- constructor options

  - onOpen?: () => void
  - onLog?: (inLogStruct: IWSLogStruct) => void
  - onError?: (inErrorStruct: IWSErrorStruct) => void
  - onClose?: (inCode?: number, inReason?: string) => void

  - url: string
  - token?: string

- close()
- opened
- request()
- use()
- useError()

#### WSWebClient

- constructor options

  - onOpen?: () => void
  - onLog?: (inLogStruct: IWSLogStruct) => void
  - onError?: (inErrorStruct: IWSErrorStruct) => void
  - onClose?: (inCode?: number, inReason?: string) => void

  - url: string
  - token?: string

- close()
- opened
- request()
- use()
- useError()

#### WSServerRouter

- constructor options

  - none

- get()
- routes()

#### WSClientRouter

- constructor options

  - none

- get()
- routes()
