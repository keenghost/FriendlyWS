import { type IRequestHandler } from '../types/common.js'
import { WSRouter } from './router.js'

export type IGetFunction = (inPath: string, ...args: IRequestHandler[]) => void

export class WSClientRouter extends WSRouter {}
