import { ipcRenderer, contextBridge } from 'electron'
import IpcChannel from '../../types/IpcChannel.ts'
import { PvzVersionInfo } from '../../types/PvzVersionInfo.ts'
import definePreloadAction from '../utils/definePreloadAction.ts'

export default definePreloadAction(() => {
  contextBridge.exposeInMainWorld('configApi', {
    get: () => {
      return ipcRenderer.invoke(IpcChannel.CONFIG_GET)
    },
    set: (config: PvzVersionInfo[]) => {
      return ipcRenderer.invoke(IpcChannel.CONFIG_SET, config)
    },
  })
})
