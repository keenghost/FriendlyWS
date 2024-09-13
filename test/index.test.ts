import child_process from 'node:child_process'
import http from 'node:http'
import puppeteer, { Browser } from 'puppeteer'
import {
  IWSRequestError,
  WSClientRouter,
  WSNodeClient,
  WSNodeServer,
  WSServerRouter,
} from '../index'
import { describe, expect, it, proms, runTest } from './test-suite'

const TOKEN = 'THE_CORRECT_TOKEN'

const REQ1_NAME = 'REQUEST1'
const REQ1_BODY = 'REQUEST1_BODY'
const RES1_BODY = 'RESPONSE1'

const REQ2_NAME = 'REQUEST2'
const REQ2_BODY = 22
const RES2_BODY = 222

const REQ3_NAME = 'REQUEST3'
const REQ3_BODY = { Req3: 'Req3' }
const RES3_BODY = { Res3: 'Res3' }

const REQ4_NAME = 'REQUEST4'
const REQ4_BODY = 'REQUEST4_BODY'
const RES4_BODY = 'RESPONSE4'

const REQ1_ERROR = { message: '', content: { customKey: '10001' } }
const REQ2_ERROR = { message: '10002', content: '20001' }
const REQ3_ERROR = { message: '10003', content: void 0 }
const REQ4_ERROR = { message: '10004', content: void 0 }

const BROADCAST_NAME = 'BROADCAST'
const BROADCAST_BODY = 'BROADCAST_FROM_SERVER'

let HTTP: http.Server

let SERVER1: WSNodeServer
let SERVER2: WSNodeServer

let NODE_CLIENT1: WSNodeClient
let NODE_CLIENT2: WSNodeClient
let NODE_CLIENT3: WSNodeClient
let NODE_CLIENT4: WSNodeClient

function waitRandom() {
  return new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200))
}

describe('CREATE_SERVER', () => {
  it('CreateServer1', async () => {
    await new Promise<void>((res, rej) => {
      HTTP = http.createServer()
      HTTP.on('error', (inError: Error) => rej(inError))
      HTTP.listen(34721)

      SERVER1 = new WSNodeServer({
        httpServer: HTTP,
        onPreConnect: async (inToken, inUrl) => {
          await waitRandom()

          if (inToken !== TOKEN) {
            throw new Error(`TOKEN NOT MATCH: ${inToken} ${inUrl}`)
          }
        },
        onOpen: () => res(),
        onError: inErrorStruct => rej(inErrorStruct.error),
      })

      const router = new WSServerRouter()

      router.get<string, string>(REQ1_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body !== REQ1_BODY) {
          ctx.errorMessage = REQ1_ERROR.message
          ctx.errorContent = REQ1_ERROR.content

          return
        }

        ctx.body = RES1_BODY
      })

      router.get<number, number>(REQ2_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body !== REQ2_BODY) {
          ctx.errorMessage = REQ2_ERROR.message
          ctx.errorContent = REQ2_ERROR.content

          throw new Error('NOT THIS MESSAGE')
        }

        ctx.body = RES2_BODY
      })

      router.get<Record<any, any>, Record<any, any>>(REQ3_NAME, async ctx => {
        await waitRandom()

        if (JSON.stringify(ctx.request.body) !== JSON.stringify(REQ3_BODY)) {
          ctx.errorMessage = REQ3_ERROR.message
          ctx.errorContent = REQ3_ERROR.content

          return
        }

        ctx.body = RES3_BODY
      })

      SERVER1.use(router.routes())
    })
  })

  it('CreateServer2', async () => {
    SERVER2 = new WSNodeServer({
      port: 34722,
      onPreConnect: async () => {
        await waitRandom()
      },
    })

    const router = new WSServerRouter()

    router.get<string, string>(REQ4_NAME, async ctx => {
      await waitRandom()

      if (ctx.request.body !== REQ4_BODY) {
        ctx.errorMessage = REQ4_ERROR.message
        ctx.errorContent = REQ4_ERROR.content

        throw new Error('NOT THIS MESSAGE')
      }

      ctx.body = RES4_BODY
    })

    SERVER2.use(router.routes())

    await SERVER2.opened
  })
})

describe('CREATE_NODE_CLIENT', () => {
  it('CreateNodeClient1', async () => {
    await new Promise<void>((res, rej) => {
      NODE_CLIENT1 = new WSNodeClient({
        url: 'ws://127.0.0.1:34721',
        token: TOKEN,
        onOpen: () => res(),
        onError: inErrorStruct => rej(inErrorStruct.error),
      })

      const router = new WSClientRouter()

      router.get<string, string>(REQ1_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body !== REQ1_BODY) {
          ctx.errorMessage = REQ1_ERROR.message
          ctx.errorContent = REQ1_ERROR.content

          return
        }

        ctx.body = RES1_BODY
      })

      router.get<number, number>(REQ2_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body !== REQ2_BODY) {
          ctx.errorMessage = REQ2_ERROR.message
          ctx.errorContent = REQ2_ERROR.content

          throw new Error('NOT THIS MESSAGE')
        }

        ctx.body = RES2_BODY
      })

      router.get<Record<any, any>, Record<any, any>>(REQ3_NAME, async ctx => {
        await waitRandom()

        if (JSON.stringify(ctx.request.body) !== JSON.stringify(REQ3_BODY)) {
          ctx.errorMessage = REQ3_ERROR.message
          ctx.errorContent = REQ3_ERROR.content

          return
        }

        ctx.body = RES3_BODY
      })

      router.get<string, string>(BROADCAST_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body === BROADCAST_BODY) {
          proms.resolve('CLIENT1_RECIEVED_BROADCAST')
        } else {
          proms.reject('CLIENT1_RECIEVED_BROADCAST')
        }
      })

      NODE_CLIENT1.use(router.routes())
    })
  })

  it('CreateNodeClient2', async () => {
    await new Promise<void>((res, rej) => {
      NODE_CLIENT2 = new WSNodeClient({
        url: 'ws://127.0.0.1:34721',
        token: TOKEN,
        onOpen: () => res(),
        onError: inErrorStruct => rej(inErrorStruct.error),
      })

      const router = new WSClientRouter()

      router.get<string, string>(BROADCAST_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body === BROADCAST_BODY) {
          proms.resolve('CLIENT2_RECIEVED_BROADCAST')
        } else {
          proms.reject('CLIENT2_RECIEVED_BROADCAST')
        }
      })

      NODE_CLIENT2.use(router.routes())
    })
  })

  it('CreateNodeClient3', async () => {
    NODE_CLIENT3 = new WSNodeClient({ url: 'ws://127.0.0.1:34721', token: TOKEN })

    const router = new WSClientRouter()

    router.get<string, string>(BROADCAST_NAME, async ctx => {
      await waitRandom()

      if (ctx.request.body === BROADCAST_BODY) {
        proms.resolve('CLIENT3_RECIEVED_BROADCAST')
      } else {
        proms.reject('CLIENT3_RECIEVED_BROADCAST')
      }
    })

    NODE_CLIENT3.use(router.routes())

    await NODE_CLIENT3.opened
  })

  it('CreateNodeClient4', async () => {
    NODE_CLIENT4 = new WSNodeClient({ url: 'ws://127.0.0.1:34722' })

    const router = new WSClientRouter()

    router.get<string, string>(REQ4_NAME, async ctx => {
      await waitRandom()

      if (ctx.request.body !== REQ4_BODY) {
        ctx.errorMessage = REQ4_ERROR.message
        ctx.errorContent = REQ4_ERROR.content

        throw new Error('NOT THIS MESSAGE')
      }

      ctx.body = RES4_BODY
    })

    router.get<string, string>(BROADCAST_NAME, async ctx => {
      await waitRandom()

      if (ctx.request.body === BROADCAST_BODY) {
        proms.resolve('CLIENT4_RECIEVED_BROADCAST')
      } else {
        proms.reject('CLIENT4_RECIEVED_BROADCAST')
      }
    })

    NODE_CLIENT4.use(router.routes())

    await NODE_CLIENT4.opened
  })

  it('CreateNodeClientError', async () => {
    try {
      const client = new WSNodeClient({ url: 'ws://127.0.0.1:34721', token: '' })

      await client.opened

      throw new Error('should not connect success')
    } catch {}
  })
})

describe('NODE_CLIENT_REQUEST_TO_SERVER', () => {
  it('NodeClient1Request1', async () => {
    const data = await NODE_CLIENT1.request<string, string>(REQ1_NAME, REQ1_BODY)

    expect(data).toBe(RES1_BODY)
  })

  it('NodeClient1Request2', async () => {
    const data = await NODE_CLIENT1.request<number, number>(REQ2_NAME, REQ2_BODY)

    expect(data).toBe(RES2_BODY)
  })

  it('NodeClient1Request3', async () => {
    const data = await NODE_CLIENT1.request<Record<any, any>, Record<any, any>>(
      REQ3_NAME,
      REQ3_BODY
    )

    expect(JSON.stringify(data)).toBe(JSON.stringify(RES3_BODY))
  })

  it('NodeClient4Request4', async () => {
    const data = await NODE_CLIENT4.request<string, string>(REQ4_NAME, REQ4_BODY)

    expect(data).toBe(RES4_BODY)
  })

  it('NodeClient1Request1Error', async () => {
    let errored = false

    try {
      await NODE_CLIENT1.request<string, string>(REQ1_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError<{ customKey: string }>

      expect(newError.message).toBe(REQ1_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ1_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('NodeClient1Request2Error', async () => {
    let errored = false

    try {
      await NODE_CLIENT1.request<number, number>(REQ2_NAME, 0)
    } catch (inError) {
      const newError = inError as IWSRequestError<string>

      expect(newError.message).toBe(REQ2_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ2_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('NodeClient1Request3Error', async () => {
    let errored = false

    try {
      await NODE_CLIENT1.request<Record<any, any>, Record<any, any>>(REQ3_NAME, {})
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ3_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ3_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('NodeClient4Request4Error', async () => {
    let errored = false

    try {
      await NODE_CLIENT4.request<string, string>(REQ4_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ4_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ4_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })
})

describe('SERVER_REQUEST_TO_CLIENT', () => {
  it('Server1Request1', async () => {
    const remoteClient = SERVER1.clients()[0]

    const data = await remoteClient?.request<string, string>(REQ1_NAME, REQ1_BODY)

    expect(data).toBe(RES1_BODY)
  })

  it('Server1Request2', async () => {
    const remoteClient = SERVER1.clients()[0]

    const data = await remoteClient?.request<number, number>(REQ2_NAME, REQ2_BODY)

    expect(data).toBe(RES2_BODY)
  })

  it('Server1Request3', async () => {
    const remoteClient = SERVER1.clients()[0]

    const data = await remoteClient?.request<Record<any, any>, Record<any, any>>(
      REQ3_NAME,
      REQ3_BODY
    )

    expect(JSON.stringify(data)).toBe(JSON.stringify(RES3_BODY))
  })

  it('Server2Request4', async () => {
    const remoteClient = SERVER2.clients()[0]

    const data = await remoteClient?.request<string, string>(REQ4_NAME, REQ4_BODY)

    expect(data).toBe(RES4_BODY)
  })

  it('Server1Request1Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER1.clients()[0]
      await remoteClient?.request<string, string>(REQ1_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError<{ customKey: string }>

      expect(newError.message).toBe(REQ1_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ1_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('Server1Request2Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER1.clients()[0]
      await remoteClient?.request<number, number>(REQ2_NAME, 0)
    } catch (inError) {
      const newError = inError as IWSRequestError<string>

      expect(newError.message).toBe(REQ2_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ2_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('Server1Request3Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER1.clients()[0]
      await remoteClient?.request<Record<any, any>, Record<any, any>>(REQ3_NAME, {})
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ3_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ3_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('Server2Request4Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER2.clients()[0]
      await remoteClient?.request<string, string>(REQ4_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ4_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ4_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })
})

let browser: Browser

describe('LAUNCH_WEB_BROWSER', () => {
  it('StartVite', async () => {
    child_process.spawn('pnpm', ['vite', 'test'], { detached: true })

    await new Promise(res => setTimeout(res, 3000))
  })

  it('StartPuppeteer', async () => {
    browser = await puppeteer.launch({
      headless: 'shell',
    })
    const page = await browser.newPage()

    page.on('console', inMsg => proms.handle(inMsg.text()))

    await page.goto('http://127.0.0.1:11111')
  })
})

describe('CREATE_WEBCLIENT', () => {
  it('CreateWebClient1', () => proms.get('CreateWebClient1'))
  it('CreateWebClient2', () => proms.get('CreateWebClient2'))
  it('CreateWebClient3', () => proms.get('CreateWebClient3'))
  it('CreateWebClient4', () => proms.get('CreateWebClient4'))
  it('CreateWebClientError', () => proms.get('CreateWebClientError'))
})

describe('WEBCLIENT_REQUEST_TO_SERVER', () => {
  it('WebClient1Request1', () => proms.get('WebClient1Request1'))
  it('WebClient1Request2', () => proms.get('WebClient1Request2'))
  it('WebClient1Request3', () => proms.get('WebClient1Request3'))
  it('WebClient4Request4', () => proms.get('WebClient4Request4'))
  it('WebClient1Request1Error', () => proms.get('WebClient1Request1Error'))
  it('WebClient1Request2Error', () => proms.get('WebClient1Request2Error'))
  it('WebClient1Request3Error', () => proms.get('WebClient1Request3Error'))
  it('WebClient4Request4Error', () => proms.get('WebClient4Request4Error'))
})

describe('SERVER_REQUEST_TO_WEBCLIENT', () => {
  it('Server1Request1', async () => {
    const remoteClient = SERVER1.clients()[3]

    const data = await remoteClient?.request<string, string>(REQ1_NAME, REQ1_BODY)

    expect(data).toBe(RES1_BODY)
  })

  it('Server1Request2', async () => {
    const remoteClient = SERVER1.clients()[3]

    const data = await remoteClient?.request<number, number>(REQ2_NAME, REQ2_BODY)

    expect(data).toBe(RES2_BODY)
  })

  it('Server1Request3', async () => {
    const remoteClient = SERVER1.clients()[3]

    const data = await remoteClient?.request<Record<any, any>, Record<any, any>>(
      REQ3_NAME,
      REQ3_BODY
    )

    expect(JSON.stringify(data)).toBe(JSON.stringify(RES3_BODY))
  })

  it('Server2Request4', async () => {
    const remoteClient = SERVER2.clients()[1]

    const data = await remoteClient?.request<string, string>(REQ4_NAME, REQ4_BODY)

    expect(data).toBe(RES4_BODY)
  })

  it('Server1Request1Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER1.clients()[3]
      await remoteClient?.request<string, string>(REQ1_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError<{ customKey: string }>

      expect(newError.message).toBe(REQ1_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ1_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('Server1Request2Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER1.clients()[3]
      await remoteClient?.request<number, number>(REQ2_NAME, 0)
    } catch (inError) {
      const newError = inError as IWSRequestError<string>

      expect(newError.message).toBe(REQ2_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ2_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('Server1Request3Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER1.clients()[3]
      await remoteClient?.request<Record<any, any>, Record<any, any>>(REQ3_NAME, {})
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ3_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ3_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('Server2Request4Error', async () => {
    let errored = false

    try {
      const remoteClient = SERVER2.clients()[1]
      await remoteClient?.request<string, string>(REQ4_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ4_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ4_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })
})

describe('BROADCAST', () => {
  it('Server1Broadcast', async () => {
    SERVER1.broadcast<string>(BROADCAST_NAME, BROADCAST_BODY)

    await Promise.all([
      proms.get('CLIENT1_RECIEVED_BROADCAST'),
      proms.get('CLIENT2_RECIEVED_BROADCAST'),
      proms.get('CLIENT3_RECIEVED_BROADCAST'),
      proms.get('WEBCLIENT1_RECIEVED_BROADCAST'),
      proms.get('WEBCLIENT2_RECIEVED_BROADCAST'),
      proms.get('WEBCLIENT3_RECIEVED_BROADCAST'),
    ])
  })

  it('Server2Broadcast', async () => {
    SERVER2.broadcast<string>(BROADCAST_NAME, BROADCAST_BODY)

    await Promise.all([
      proms.get('CLIENT4_RECIEVED_BROADCAST'),
      proms.get('WEBCLIENT4_RECIEVED_BROADCAST'),
    ])
  })
})

describe('FINISH', () => {
  it('Close', async () => {
    await browser.close()
    child_process.execSync('pnpm kill-port 11111')

    NODE_CLIENT1.close()
    NODE_CLIENT2.close()
    NODE_CLIENT3.close()
    NODE_CLIENT4.close()
    SERVER1.close()
    SERVER2.close()
    HTTP.close()
  })
})

runTest()
