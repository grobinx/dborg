import { contextBridge } from 'electron'
import { preload as preloadDborgFile } from '../main/api/dborg-file'
import { preload as preloadDborgPath } from '../main/api/dborg-path'
import { preload as preloadSettings } from '../main/api/settings'
import { preload as preloadElectron } from '../main/api/electron'
import { preload as preloadDatabase } from '../main/api/db'

const dborg = {
    file: preloadDborgFile,
    path: preloadDborgPath,
    settings: preloadSettings,
    database: preloadDatabase,
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', preloadElectron)
        contextBridge.exposeInMainWorld('dborg', dborg);
    } 
    catch (error) {
        console.error(error)
    }
} else {
    window.electron = preloadElectron,
    window.dborg = dborg
}
