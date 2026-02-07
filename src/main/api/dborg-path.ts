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
 * list directory event
 */
export const EVENT_LIST_PATH = "dborg:path:list"
/**
 * Root dborg root data path in userData directory
 */
export const DBORG_USER_DATA_PATH = ".dborg"
/**
 * Is subfolder of DBORG_DATA_PATH where settings will be stored
 */
export const DBORG_SETTINGS_PATH = "settings"
export const DBORG_EDITORS_PATH = "editors"
export const DBORG_DATA_PATH = "data"

export function dataPath(...subPath: string[]): string {
    let result = join(app.getPath("home"), DBORG_USER_DATA_PATH);
    if (subPath !== undefined) {
        result = join(result, ...subPath)
    }
    if (!fs.existsSync(result)) {
        fs.mkdirSync(result, { recursive: true });
    }
    return result;
}

function escapeRegex(text: string): string {
    return text.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function maskToRegex(mask?: string): RegExp | null {
    if (!mask || mask.trim() === "" || mask === "*") return null;
    let rx = "^";
    for (let i = 0; i < mask.length; i++) {
        const ch = mask[i];
        if (ch === "\\") {
            // escape next char literally
            const next = mask[++i];
            if (next !== undefined) {
                rx += escapeRegex(next);
            } else {
                // trailing backslash -> match literal backslash
                rx += "\\\\";
            }
        } else if (ch === "*") {
            rx += ".*";
        } else if (ch === "?") {
            rx += ".";
        } else {
            rx += escapeRegex(ch);
        }
    }
    rx += "$";
    const flags = process.platform === "win32" ? "i" : "";
    return new RegExp(rx, flags);
}

export function init(ipc: typeof ipcMain): void {
    ipc.handle(EVENT_CORE_GET_PATH, (_: IpcMainInvokeEvent, name: dborgPath.DBORG_PATHS): string => {
        if (name === dborgPath.DBORG_USER_DATA_PATH_NAME) {
            return dataPath()
        }
        else if (name === dborgPath.DBORG_SETTINGS_PATH_NAME) {
            return dataPath(DBORG_SETTINGS_PATH)
        }
        else if (name === dborgPath.DBORG_EDITORS_PATH_NAME) {
            return dataPath(DBORG_EDITORS_PATH)
        }
        else if (name === dborgPath.DBORG_DATA_PATH_NAME) {
            return dataPath(DBORG_DATA_PATH)
        }
        return app.getPath(name)
    })
    ipc.handle(EVENT_ENSURE_PATH, (_: IpcMainInvokeEvent, path: string): void => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    });
    ipc.handle(EVENT_LIST_PATH, (_: IpcMainInvokeEvent, path: string, mask?: string): string[] => {
        try {
            if (!fs.existsSync(path)) return [];
            const entries = fs.readdirSync(path);
            const rx = maskToRegex(mask);
            return rx ? entries.filter(name => rx.test(name)) : entries;
        } catch {
            return [];
        }
    });
}

export const preload = {
    get: async (name: dborgPath.DBORG_PATHS): Promise<string> => {
        return await ipcRenderer.invoke(EVENT_CORE_GET_PATH, name);
    },
    ensureDir: async (path: string): Promise<void> => {
        return await ipcRenderer.invoke(EVENT_ENSURE_PATH, path);
    },
    list: async (path: string, mask?: string): Promise<string[]> => {
        return await ipcRenderer.invoke(EVENT_LIST_PATH, path, mask);
    }
}
