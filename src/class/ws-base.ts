import { PromBat } from '../common/utils.js'
import { type IWSErrorStruct, type IWSLogStruct } from '../types/common.js'
import { ECloseCodeStr, PUBLIC_ONCLOSE, PUBLIC_ONERROR, PUBLIC_ONLOG } from '../types/const.js'
import { EWSLogCode } from '../types/enums.js'

export interface IWSBaseInitOptions {
  onOpen?: () => void
  onLog?: (inLogStruct: IWSLogStruct) => void
  onError?: (inErrorStruct: IWSErrorStruct) => void
  onClose?: (inCode?: number, inReason?: string) => void
}

export abstract class WSBase {
  #openProm: PromBat | undefined
  #onOpen: (() => void) | undefined;

  [PUBLIC_ONLOG]: (inLogStruct: IWSLogStruct) => void = () => {};
  [PUBLIC_ONERROR]: (inErrorStruct: IWSErrorStruct) => void = () => {};
  [PUBLIC_ONCLOSE]: (inCode?: number, inReason?: string) => void = () => {}

  constructor(inOpts: IWSBaseInitOptions) {
    this.#onOpen = inOpts.onOpen || this.#onOpen
    this[PUBLIC_ONLOG] = inOpts.onLog || this[PUBLIC_ONLOG]
    this[PUBLIC_ONERROR] = inOpts.onError || this[PUBLIC_ONERROR]
    this[PUBLIC_ONCLOSE] = inOpts.onClose || this[PUBLIC_ONCLOSE]

    this.#openProm = this.#onOpen ? this.#openProm : new PromBat()
  }

  protected _onOpen() {
    this.#openProm?.res()
    this.#onOpen?.()
  }

  protected _onLog(inLogStruct: IWSLogStruct) {
    this[PUBLIC_ONLOG](inLogStruct)
  }

  protected _onError(inErrorStruct: IWSErrorStruct) {
    this.#openProm?.rej(inErrorStruct.error)

    this[PUBLIC_ONERROR](inErrorStruct)
  }

  protected _onClose(inCode?: number, inReason?: string) {
    this.#openProm?.rej(inReason)

    const code = inCode === void 0 ? -1 : inCode
    const reason = inReason || ECloseCodeStr[code] || ''
    this._onLog({
      code: EWSLogCode.CLOSED,
      text: `closed ${code} ${reason}`,
      extra: { code, reason },
    })

    this[PUBLIC_ONCLOSE](inCode, inReason)
  }

  get opened() {
    return this.#openProm?.prom
  }

  abstract close(inCode?: number, inReason?: string): void
}
