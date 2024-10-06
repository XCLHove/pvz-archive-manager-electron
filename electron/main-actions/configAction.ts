import fs from 'fs'
import { ipcMain } from 'electron'
import { PvzVersionInfo } from '../../types/PvzVersionInfo.ts'
import IpcChannel from '../../types/IpcChannel.ts'
import { resourceDir } from '../utils/resourceDir.ts'
import definePvzVersionInfo from '../utils/definePvzVersionInfo.ts'
import defineMainAction from '../utils/defineMainAction.ts'

const CONFIG_PATH = `${resourceDir()}/config.json`

const saveConfig = (config: PvzVersionInfo[]) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config))
}

const readConfig: () => PvzVersionInfo[] = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    return []
  }
  try {
    const configStr = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(configStr)
  } catch (error) {
    console.error(error)
    return []
  }
}

const initConfig = () => {
  const map = new Map<PvzVersionInfo['name'], PvzVersionInfo>()
  const oldConfig = readConfig()
  oldConfig.forEach((config) => {
    map.set(config.name, config)
  })

  const defaultConfig: PvzVersionInfo[] = []
  const defaultConfigs = import.meta.glob('./default-pvz-version-info/*.ts', {
    eager: true,
    import: 'default',
  })
  Object.entries(defaultConfigs).forEach(([_, _config]) => {
    const config = _config as ReturnType<typeof definePvzVersionInfo>
    defaultConfig.push(config)
  })

  defaultConfig.forEach((config) => {
    if (map.has(config.name)) {
      return
    }
    map.set(config.name, config)
  })

  const newConfig: PvzVersionInfo[] = []
  map.entries().forEach(([_, config]) => {
    newConfig.push(config)
  })
  saveConfig(newConfig)
}

export default defineMainAction(() => {
  initConfig()

  ipcMain.handle(IpcChannel.CONFIG_GET, () => {
    return readConfig()
  })

  ipcMain.handle(IpcChannel.CONFIG_SET, (_, config: PvzVersionInfo[]) => {
    saveConfig(config)
  })
})
