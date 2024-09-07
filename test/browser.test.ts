import { IWSRequestError, WSClientRouter, WSWebClient } from '../index'
import { describe, expect, it, proms, runTestWeb } from './test-suite'

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

let WEB_CLIENT1: WSWebClient
let WEB_CLIENT2: WSWebClient
let WEB_CLIENT3: WSWebClient
let WEB_CLIENT4: WSWebClient

function waitRandom() {
  return new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200))
}

describe('CREATE_WEB_CLIENT', () => {
  it('CreateWebClient1', async () => {
    await new Promise<void>((res, rej) => {
      WEB_CLIENT1 = new WSWebClient({
        url: `ws://${location.host}/ws34721`,
        token: TOKEN,
        onOpen: () => res(),
        onError: inError => rej(inError),
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
          proms.emitSucc('WEBCLIENT1_RECIEVED_BROADCAST')
        }
      })

      WEB_CLIENT1.use(router.routes())
    })
  })

  it('CreateWebClient2', async () => {
    await new Promise<void>((res, rej) => {
      WEB_CLIENT2 = new WSWebClient({
        url: `ws://${location.host}/ws34721`,
        token: TOKEN,
        onOpen: () => res(),
        onError: inError => rej(inError),
      })

      const router = new WSClientRouter()

      router.get<string, string>(BROADCAST_NAME, async ctx => {
        await waitRandom()

        if (ctx.request.body === BROADCAST_BODY) {
          proms.emitSucc('WEBCLIENT2_RECIEVED_BROADCAST')
        }
      })

      WEB_CLIENT2.use(router.routes())
    })
  })

  it('CreateWebClient3', async () => {
    WEB_CLIENT3 = new WSWebClient({ url: `ws://${location.host}/ws34721`, token: TOKEN })

    const router = new WSClientRouter()

    router.get<string, string>(BROADCAST_NAME, async ctx => {
      await waitRandom()

      if (ctx.request.body === BROADCAST_BODY) {
        proms.emitSucc('WEBCLIENT3_RECIEVED_BROADCAST')
      }
    })

    WEB_CLIENT3.use(router.routes())

    await WEB_CLIENT3.opened
  })

  it('CreateWebClient4', async () => {
    WEB_CLIENT4 = new WSWebClient({ url: `ws://${location.host}/ws34722` })

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
        proms.emitSucc('WEBCLIENT4_RECIEVED_BROADCAST')
      }
    })

    WEB_CLIENT4.use(router.routes())

    await WEB_CLIENT4.opened
  })

  it('CreateWebClientError', async () => {
    try {
      const client = new WSWebClient({
        url: `ws://${location.host}/ws34721`,
        token: '',
      })

      await client.opened

      throw new Error('Should not connect success')
    } catch {}
  })
})

describe('WEBCLIENT_REQUEST_TO_SERVER', () => {
  it('WebClient1Request1', async () => {
    const data = await WEB_CLIENT1.request<string, string>(REQ1_NAME, REQ1_BODY)

    expect(data).toBe(RES1_BODY)
  })

  it('WebClient1Request2', async () => {
    const data = await WEB_CLIENT1.request<number, number>(REQ2_NAME, REQ2_BODY)

    expect(data).toBe(RES2_BODY)
  })

  it('WebClient1Request3', async () => {
    const data = await WEB_CLIENT1.request<Record<any, any>, Record<any, any>>(
      REQ3_NAME,
      REQ3_BODY
    )

    expect(JSON.stringify(data)).toBe(JSON.stringify(RES3_BODY))
  })

  it('WebClient4Request4', async () => {
    const data = await WEB_CLIENT4.request<string, string>(REQ4_NAME, REQ4_BODY)

    expect(data).toBe(RES4_BODY)
  })

  it('WebClient1Request1Error', async () => {
    let errored = false

    try {
      await WEB_CLIENT1.request<string, string>(REQ1_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError<{ customKey: string }>

      expect(newError.message).toBe(REQ1_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ1_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('WebClient1Request2Error', async () => {
    let errored = false

    try {
      await WEB_CLIENT1.request<number, number>(REQ2_NAME, 0)
    } catch (inError) {
      const newError = inError as IWSRequestError<string>

      expect(newError.message).toBe(REQ2_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ2_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('WebClient1Request3Error', async () => {
    let errored = false

    try {
      await WEB_CLIENT1.request<Record<any, any>, Record<any, any>>(REQ3_NAME, {})
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ3_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ3_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })

  it('WebClient4Request4Error', async () => {
    let errored = false

    try {
      await WEB_CLIENT4.request<string, string>(REQ4_NAME, '')
    } catch (inError) {
      const newError = inError as IWSRequestError

      expect(newError.message).toBe(REQ4_ERROR.message)
      expect(JSON.stringify(newError.content)).toBe(JSON.stringify(REQ4_ERROR.content))

      errored = true
    }

    expect(errored).toBe(true)
  })
})

runTestWeb()
