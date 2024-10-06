import { optimizer } from '@electron-toolkit/utils'
import defineMainAction from '../utils/defineMainAction.ts'

export default defineMainAction((win) => {
  optimizer.watchWindowShortcuts(win)
})
