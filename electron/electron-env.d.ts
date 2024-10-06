/// <reference types="vite-plugin-electron/electron-env" />

import { PvzVersionInfo } from '../types/PvzVersionInfo.ts'
import { Archive } from '../types/Archive.ts'

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

interface ConfigApi<T> {
  get: () => Promise<T>
  set: (config: T) => Promise<void>
}

interface ArchiveApi {
  list: (versionInfo: PvzVersionInfo) => Promise<Archive[]>
  create: (versionInfo: PvzVersionInfo, archiveName: string) => Promise<Archive>
  remove: (currentPvzVersionInfo: PvzVersionInfo, archive: Archive) => Promise<void>
  reset: (pvzVersionInfo: PvzVersionInfo) => Promise<void>
  use: (pvzVersionInfo: PvzVersionInfo, archive: Archive) => Promise<Archive>
}

// Used in Renderer process, expose in `preload.ts`

declare global {
  interface Window {
    configApi: ConfigApi<PvzVersionInfo[]>
    archiveApi: ArchiveApi
  }
}
