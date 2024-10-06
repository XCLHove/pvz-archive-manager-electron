import { ipcRenderer, contextBridge } from 'electron'
import { PvzVersionInfo } from '../../types/PvzVersionInfo.ts'
import { Archive } from '../../types/Archive.ts'
import IpcChannel from '../../types/IpcChannel.ts'
import definePreloadAction from '../utils/definePreloadAction.ts'

export default definePreloadAction(() => {
  contextBridge.exposeInMainWorld('archiveApi', {
    create: (pvzVersionInfo: PvzVersionInfo, archiveName: string) => {
      return ipcRenderer.invoke(IpcChannel.ARCHIVE_CREATE, pvzVersionInfo, archiveName)
    },
    list: (pvzVersionInfo: PvzVersionInfo) => {
      return ipcRenderer.invoke(IpcChannel.ARCHIVE_LIST, pvzVersionInfo)
    },
    remove: (pvzVersionInfo: PvzVersionInfo, archive: Archive) => {
      return ipcRenderer.invoke(IpcChannel.ARCHIVE_REMOVE, pvzVersionInfo, archive)
    },
    reset: (pvzVersionInfo: PvzVersionInfo) => {
      return ipcRenderer.invoke(IpcChannel.ARCHIVE_RESET, pvzVersionInfo)
    },
    use: (pvzVersionInfo: PvzVersionInfo, archive: Archive) => {
      return ipcRenderer.invoke(IpcChannel.ARCHIVE_USE, pvzVersionInfo, archive)
    },
  })
})
