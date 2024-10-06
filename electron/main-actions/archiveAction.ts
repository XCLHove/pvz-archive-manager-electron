import fs from 'fs'
import archiver from 'archiver'
import { ipcMain } from 'electron'
import AdmZip from 'adm-zip'
import { PvzVersionInfo } from '../../types/PvzVersionInfo.ts'
import IpcChannel from '../../types/IpcChannel.ts'
import { Archive } from '../../types/Archive.ts'
import defineMainAction from '../utils/defineMainAction.ts'
import { resourceDir } from '../utils/resourceDir.ts'

const ensureFolderExist = (path: string) => {
  const exist = fs.existsSync(path)
  if (!exist) {
    fs.mkdirSync(path, { recursive: true })
  }
  return exist
}

export default defineMainAction(() => {
  const basePath = `${resourceDir()}/archive`
  ensureFolderExist(basePath)

  // 创建存档
  ipcMain.handle(IpcChannel.ARCHIVE_CREATE, async (_, pvzVersionInfo: PvzVersionInfo, archiveName: string) => {
    ensureFolderExist(pvzVersionInfo.archivePath)
    if (fs.readdirSync(pvzVersionInfo.archivePath).length === 0) {
      return Promise.reject('存档为空')
    }
    const outFolder = `${basePath}\\${pvzVersionInfo.name}`
    ensureFolderExist(outFolder)
    const archivePath = `${outFolder}\\${archiveName}.zip`
    const writeStream = fs.createWriteStream(archivePath)
    writeStream.on('close', () => {})

    const archive = archiver('zip', {
      zlib: { level: 5 },
    })
    archive.on('error', (err: Error) => {
      throw err
    })
    archive.pipe(writeStream)
    archive.directory(pvzVersionInfo.archivePath, false)
    await archive.finalize()
  })

  // 列出存档
  ipcMain.handle(IpcChannel.ARCHIVE_LIST, (_, pvzVersionInfo: PvzVersionInfo) => {
    const folder = `${basePath}/${pvzVersionInfo.name}`
    ensureFolderExist(folder)
    const files = fs.readdirSync(folder)
    return files.map((file) => {
      return {
        name: file.replace(/\.zip$/, ''),
        createTime: fs.statSync(`${folder}/${file}`).mtime,
      } as Archive
    })
  })

  // 移除存档
  ipcMain.handle(IpcChannel.ARCHIVE_REMOVE, (_, pvzVersionInfo: PvzVersionInfo, archive: Archive) => {
    const folder = `${basePath}/${pvzVersionInfo.name}`
    ensureFolderExist(folder)
    const archivePath = `${folder}/${archive.name}.zip`
    fs.rmSync(archivePath)
  })

  // 清空当前游戏进度
  const resetCurrentArchive = (pvzVersionInfo: PvzVersionInfo) => {
    fs.rmSync(pvzVersionInfo.archivePath, { recursive: true, force: true })
  }
  ipcMain.handle(IpcChannel.ARCHIVE_RESET, (_, config: PvzVersionInfo) => {
    resetCurrentArchive(config)
  })

  // 使用存档
  ipcMain.handle(IpcChannel.ARCHIVE_USE, (_, pvzVersionInfo: PvzVersionInfo, archive: Archive) => {
    resetCurrentArchive(pvzVersionInfo)

    const zip = new AdmZip(`${basePath}/${pvzVersionInfo.name}/${archive.name}.zip`)
    ensureFolderExist(pvzVersionInfo.archivePath)
    zip.extractAllTo(pvzVersionInfo.archivePath, true)
  })
})
