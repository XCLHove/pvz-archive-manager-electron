import { BrowserWindow } from 'electron'

type MainAction = (window: BrowserWindow) => void

const defineMainAction = (action: MainAction) => {
  return action
}

export default defineMainAction
