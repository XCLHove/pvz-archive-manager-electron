import os from 'os'

/**
 * C:/Users/{username}/AppData/LocalLow/xclhove/pvz-archive-manager
 */
export const resourceDir = (() => {
  const basePath = `${os.homedir()}/AppData/LocalLow/xclhove/pvz-archive-manager`

  return () => basePath
})()
