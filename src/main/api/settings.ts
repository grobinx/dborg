import { ipcMain, IpcMainInvokeEvent, ipcRenderer } from 'electron'
import { join } from "node:path"
import fs from "node:fs";
import { dataPath, DBORG_SETTINGS_PATH } from './dborg-path'
import { TSettings } from '../../api/settings';

/**
 * settings events
 */
export const EVENT_CORE_GET_SETTINGS = "dborg:settings:get"
export const EVENT_CORE_STORE_SETTINGS = "dborg:settings:store"

export function getSettings(name: string): TSettings | undefined {
    const path = join(dataPath(DBORG_SETTINGS_PATH), name + ".json")
    if (fs.existsSync(path)) {
        const settings = fs.readFileSync(path, { encoding: "utf-8" });
        if (settings === "") {
            return {};
        }
        return JSON.parse(settings);
    }
    return
}

export function storeSettings(name: string, settings: TSettings): void {
    const path = join(dataPath(DBORG_SETTINGS_PATH), name + ".json")
    fs.writeFile(path, JSON.stringify(settings, null, '  '), 'utf8', (err) => {
        if (err) {
            console.error(err);
        }
    })
}

export function init(ipc: typeof ipcMain): void {
    ipc.handle(
        EVENT_CORE_GET_SETTINGS, 
        (_: IpcMainInvokeEvent, name: string): TSettings | undefined => getSettings(name)
    );
    ipc.on(
        EVENT_CORE_STORE_SETTINGS, 
        (_: IpcMainInvokeEvent, name: string, settings: TSettings): void => storeSettings(name, settings)
    );
}

export const preload = {
    get : (name : string) : Promise<TSettings> => {
        return ipcRenderer.invoke(EVENT_CORE_GET_SETTINGS, name);
    },
    store : (name : string, settings : TSettings) : void => {
        ipcRenderer.send(EVENT_CORE_STORE_SETTINGS, name, settings)
    }
}
