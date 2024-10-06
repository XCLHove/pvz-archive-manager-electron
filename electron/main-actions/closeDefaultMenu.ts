import defineMainAction from '../utils/defineMainAction.ts'
import { Menu } from 'electron'

export default defineMainAction(() => {
  Menu.setApplicationMenu(null)
})
