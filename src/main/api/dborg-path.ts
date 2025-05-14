import { app, ipcMain, IpcMainInvokeEvent, ipcRenderer } from 'electron'
import { join } from "node:path"
import fs from "node:fs";
import * as dborgPath from '../../api/dborg-path';

/**
 * path events
 */
export const EVENT_CORE_GET_PATH = "dborg:path:get"
/**
 * ensure path event
 */

export const EVENT_ENSURE_PATH = "dborg:path:ensure"
/**
 * Root dborg root data path in userData directory
 */
export const DBORG_DATA_PATH = ".dborg"
/**
 * Is subfolder of DBORG_DATA_PATH where settings will be stored
 */
export const DBORG_SETTINGS_PATH = "settings"

export const DBORG_EDITORS_PATH = "editors"

export function dataPath(subPath : string | undefined = undefined) : string {
    let result = join(app.getPath("home"), DBORG_DATA_PATH);
    if (subPath !== undefined) {
        result = join(result, subPath)
    }
    if (!fs.existsSync(result)) {
        fs.mkdirSync(result, { recursive: true });
    }
    return result;
}

export function init(ipc: typeof ipcMain) : void {
    ipc.handle(EVENT_CORE_GET_PATH, (_ : IpcMainInvokeEvent, name: dborgPath.DBORG_PATHS) : string => {
        if (name === dborgPath.DBORG_DATA_PATH_NAME) {
            return dataPath()
        }
        else if (name === dborgPath.DBORG_SETTINGS_PATH_NAME) {
            return dataPath(DBORG_SETTINGS_PATH)
        }
        else if (name === dborgPath.DBORG_EDITORS_PATH_NAME) {
            return dataPath(DBORG_EDITORS_PATH)
        }
        return app.getPath(name)
    })
    ipc.handle(EVENT_ENSURE_PATH, (_ : IpcMainInvokeEvent, path: string) : void => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    });
}

export const preload = {
    get: async (name : dborgPath.DBORG_PATHS) : Promise<string> => {
        return await ipcRenderer.invoke(EVENT_CORE_GET_PATH, name);
    },
    ensureDir: async (path : string) : Promise<void> => {
        return await ipcRenderer.invoke(EVENT_ENSURE_PATH, path);
    }
}
