import { IRequestHandler } from '../common/types'
import { WSRouter } from './router'

export type IGetFunction = (inPath: string, ...args: IRequestHandler[]) => void

export class WSClientRouter extends WSRouter {}
