import { type IRequestHandler } from '../types/common'
import { WSRouter } from './router'

export type IGetFunction = (inPath: string, ...args: IRequestHandler[]) => void

export class WSClientRouter extends WSRouter {}
