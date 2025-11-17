import chokidar, { FSWatcher } from 'chokidar';
import { ipcMain, IpcMainInvokeEvent, ipcRenderer } from "electron";
import fs from "node:fs";
import { handleResult, invokeResult, InvokeResult } from "../../../src/api/ipc-helpers";

const EVENT_FILE_READ = "dborg:file:read";
const EVENT_FILE_WRITE = "dborg:file:write";
const EVENT_FILE_DELETE = "dborg:file:delete";
const EVENT_FILE_EXISTS = "dborg:file:exists";
const EVENT_FILE_WATCH_START = "dborg:file:watch:start";
const EVENT_FILE_WATCH_STOP = "dborg:file:watch:stop";
const EVENT_FILE_CHANGED = "dborg:file:changed";
const EVENT_FILE_RENAME = "dborg:file:rename";

const watchers = new Map<string, FSWatcher>();

export type FileChangeEvent = "changed" | "deleted" | "added" | "dir-added" | "dir-deleted";

export function init(ipc: typeof ipcMain, window: Electron.BrowserWindow) : void {
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
    ipc.handle(
        EVENT_FILE_WATCH_START,
        (_: IpcMainInvokeEvent, filePath: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                if (watchers.has(filePath)) {
                    return; // Już monitorowany
                }

                const watcher = chokidar.watch(filePath, {
                    persistent: true,
                    ignoreInitial: true, // Nie uruchamiaj dla istniejących plików
                });

                watcher.on("change", () => {
                    window.webContents.send(EVENT_FILE_CHANGED, filePath, 'changed');
                });

                watcher.on("unlink", () => {
                    window.webContents.send(EVENT_FILE_CHANGED, filePath, "deleted");
                });

                watcher.on("add", () => {
                    window.webContents.send(EVENT_FILE_CHANGED, filePath, "added");
                });

                watcher.on("addDir", () => {
                    window.webContents.send(EVENT_FILE_CHANGED, filePath, "dir-added");
                });

                watcher.on("unlinkDir", () => {
                    window.webContents.send(EVENT_FILE_CHANGED, filePath, "dir-deleted");
                });

                watchers.set(filePath, watcher);
            });
        }
    );

    ipc.handle(
        EVENT_FILE_WATCH_STOP,
        (_: IpcMainInvokeEvent, filePath: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const watcher = watchers.get(filePath);
                if (watcher) {
                    await watcher.close();
                    watchers.delete(filePath);
                }
            });
        }
    );

    ipc.handle(EVENT_FILE_RENAME, (_ : IpcMainInvokeEvent, oldPath: string, newPath: string) : Promise<InvokeResult> => {
        return handleResult(new Promise((resolve, reject) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
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
    watchFile: async (filePath: string): Promise<void> => {
        return ipcRenderer.invoke(EVENT_FILE_WATCH_START, filePath);
    },
    unwatchFile: async (filePath: string): Promise<void> => {
        return ipcRenderer.invoke(EVENT_FILE_WATCH_STOP, filePath);
    },
    renameFile: async (oldPath: string, newPath: string): Promise<void> => {
        return invokeResult(ipcRenderer.invoke(EVENT_FILE_RENAME, oldPath, newPath));
    },
    onFileChanged: (callback: (filePath: string, eventType?: FileChangeEvent) => void, options?: { events?: FileChangeEvent[], filePath?: string }): (() => void) => {
        const subscription = (_event: any, filePath: string, eventType?: FileChangeEvent) => {
            if (options?.events && eventType && !options.events.includes(eventType)) {
                return;
            }
            if (options?.filePath && filePath !== options?.filePath) {
                return;
            }
            callback(filePath, eventType);
        };
        ipcRenderer.on(EVENT_FILE_CHANGED, subscription);
        return () => {
            ipcRenderer.off(EVENT_FILE_CHANGED, subscription);
        };
    },
};