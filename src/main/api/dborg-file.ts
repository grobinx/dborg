import { ipcMain, IpcMainInvokeEvent, ipcRenderer } from "electron";
import fs from "node:fs";
import { handleResult, invokeResult, InvokeResult } from "../../../src/api/ipc-helpers";

export const EVENT_FILE_READ = "dborg:file:read";
export const EVENT_FILE_WRITE = "dborg:file:write";
export const EVENT_FILE_DELETE = "dborg:file:delete";
export const EVENT_FILE_EXISTS = "dborg:file:exists";

export function init(ipc: typeof ipcMain) : void {
    ipc.handle(EVENT_FILE_READ, (_ : IpcMainInvokeEvent, path: string, charCode?: BufferEncoding) : Promise<InvokeResult> => {
        return handleResult(new Promise((resolve, reject) => {
            fs.readFile(path, charCode || "utf8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }));
    });
    ipc.handle(EVENT_FILE_WRITE, (_ : IpcMainInvokeEvent, path: string, content: string, charCode?: BufferEncoding) : Promise<InvokeResult> => {
        return handleResult(new Promise((resolve, reject) => {
            fs.writeFile(path, content, charCode || "utf8", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        }));
    });
    ipc.handle(EVENT_FILE_DELETE, (_ : IpcMainInvokeEvent, path: string) : Promise<InvokeResult> => {
        return handleResult(new Promise((resolve, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        }));
    });
    ipc.handle(EVENT_FILE_EXISTS, (_ : IpcMainInvokeEvent, path: string) : Promise<InvokeResult> => {
        return handleResult(new Promise((resolve) => {
            fs.access(path, fs.constants.F_OK, (err) => {
                resolve(!err);
            });
        }));
    });
}

export const preload = {
    readFile: async (path: string, charCode?: BufferEncoding) : Promise<string> => {
        return invokeResult(ipcRenderer.invoke(EVENT_FILE_READ, path, charCode));
    },
    writeFile: async (path: string, content: string, charCode?: BufferEncoding) : Promise<void> => {
        return invokeResult(ipcRenderer.invoke(EVENT_FILE_WRITE, path, content, charCode));
    },
    deleteFile: async (path: string) : Promise<void> => {
        return invokeResult(ipcRenderer.invoke(EVENT_FILE_DELETE, path));
    },
    exists: async (path: string) : Promise<boolean> => {
        return invokeResult(ipcRenderer.invoke(EVENT_FILE_EXISTS, path));
    },
};