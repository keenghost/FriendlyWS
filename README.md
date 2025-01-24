# Javascript Friendly WebSocket

<p align="center">
    <img src="https://img.shields.io/badge/node-≥18-green" alt="">
    <img src="https://img.shields.io/badge/pnpm-^9-orange" alt="">
    <br>
    <img src="https://img.shields.io/github/license/keenghost/FriendlyWS?color=purple" alt="">
    <img src="https://img.shields.io/github/commit-activity/m/keenghost/FriendlyWS?color=red" alt="">
    <img src="https://img.shields.io/github/stars/keenghost/FriendlyWS?style=social" alt="">
</p>

### Installation

```
pnpm add friendly-ws
```

### Usage

- Create Server

  - use internal httpServer and onOpen to continue

    ```typescript
    import { WSNodeServer } from 'friendly-ws'

    const server = new WSNodeServer({
      port: 12345,
      onPreConnect: async (token, url) => {
        // authentication
        throw new Error('auth failed')
      },
      onConnected: async () => {},
      onOpen: () => res(), // do things after open
      onError: errorStruct => rej(errorStruct.error),
    })
    ```

  - use provided httpServer and await opened to continue

    ```typescript
    import http from 'http'
    import { WSNodeServer } from 'friendly-ws'

    const httpServer = http.createServer()
    httpServer.on('error', (inError: Error) => rej(inError))
    httpServer.listen(34721)

    const wsServer = new WSNodeServer({
      httpServer: httpServer,
      onPreConnect: async (token, url) => {
        // do token check or split your custom token from url
      },
      onError: errorStruct => rej(errorStruct.error),
    })

    await wsServer.opened
    ```

- Create Client

  - Node Client

    ```typescript
    import { WSNodeClient } from 'friendly-ws'

    const client = new WSNodeClient({
      url: 'ws://127.0.0.1:12345',
      token: 'iamtoken',
      onOpen: () => res(),
      onError: errorStruct => rej(errorStruct.error),
    })
    ```

    ```typescript
    import { WSWebClient } from 'friendly-ws'

    const client = new WSWebClient({
      url: 'ws://127.0.0.1:12345',
      token: 'iamtoken',
      onError: errorStruct => rej(errorStruct.error),
    })

    await client.opened
    ```

### Use Router

- node

  ```typescript
  import { WSClientRouter } from 'friendly-ws'

  const router = new WSClientRouter()

  router.get<string, string>('request1', async ctx => {
    const result = await doSomeJob(ctx.request.body)

    if (result === -1) {
      ctx.errorMessage = 'oops not right'
      ctx.errorContent = { operation: 'delete' }
    }
  })

  router.get<{ name: string }, { newName: string }>('request1', async ctx => {
    const result = await doSomeJob(ctx.request.body.name)

    if (result === -1) {
      ctx.errorMessage = 'user can see this message'
      ctx.errorContent = { userId: 'abcd' }
      throw new Error('internal error rename failed')
    }

    ctx.body = { newName: 'haha' }
  })

  client.use(router.routes())
  ```

- web

  ```typescript
  import { WSClientRouter } from 'friendly-ws'

  const router = new WSClientRouter()

  router.get<string, string>('request1', async ctx => {
    ctx.body = ''
  })

  webClient.use(router.routes())
  ```
