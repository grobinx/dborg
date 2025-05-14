import { electronAPI } from "@electron-toolkit/preload";
import { BrowserWindow, ipcMain, ipcRenderer, IpcRendererEvent, Rectangle, Size, dialog, OpenDialogOptions, OpenDialogReturnValue, IpcMainInvokeEvent } from "electron";
import { OnMovedFn, OnResizedFn, OnStateFn, WindowState } from "../../api/electron";

const EVENT_ELECTRON_MAIN_RESIZED = "electron:main:resized";
const EVENT_ELECTRON_MAIN_MOVED = "electron:main:moved";
const EVENT_ELECTRON_MAIN_STATE = "electron:main:state";
const EVENT_ELECTRON_MAIN_MINIMIZE = "electron:main:minimize";
const EVENT_ELECTRON_MAIN_MAXIMIZE = "electron:main:maximize";
const EVENT_ELECTRON_MAIN_RESTORE = "electron:main:restore";
const EVENT_ELECTRON_MAIN_FULLSCREEN = "electron:main:fullscreen";
const EVENT_ELECTRON_MAIN_CLOSE = "electron:main:close";

const EVENT_ELECTRON_DIALOG_OPENFILE = "electron:dialog:openfile";

const windowState: WindowState = {
    minimized: false,
    maximized: false,
    normal: false,
    focused: false,
    fullScreen: false,
    visible: false,
    zoom: 100
}

function mainSetState(window: BrowserWindow): void {
    windowState.minimized = window.isMinimized();
    windowState.maximized = window.isMaximized();
    windowState.focused = window.isFocused();
    windowState.fullScreen = window.isFullScreen() || window.isSimpleFullScreen();
    windowState.normal = window.isNormal();
    windowState.visible = window.isVisible();
    windowState.zoom = Math.round(window.webContents.getZoomFactor() * 100);
}

function mainSetSize(window: BrowserWindow): void {
    preload.main.bounds.width = preload.main.size.width = window.getSize()[0];
    preload.main.bounds.height = preload.main.size.height = window.getSize()[1];
    preload.main.bounds.x = window.getBounds().x;
    preload.main.bounds.y = window.getBounds().y;
}

function updateState(window: BrowserWindow): void {
    Promise.resolve().then(() => {
        mainSetState(window);
        window.webContents.send(EVENT_ELECTRON_MAIN_STATE, windowState);
    });
}

function initZoom(window: BrowserWindow): void {
    const [minZoom, maxZoom, zoomStep] = [0.4, 2, 0.1];

    window.webContents.setZoomFactor(1);
    window.webContents.setVisualZoomLevelLimits(1, maxZoom).then(() => {
        window.webContents.on("zoom-changed", (_event, zoomDirection) => {
            const currentZoom = window.webContents.getZoomFactor();
            let newZoom = currentZoom;

            if (zoomDirection === "in") {
                if (currentZoom + zoomStep > maxZoom) {
                    newZoom = maxZoom;
                }
                else {
                    newZoom += zoomStep
                }
                if (currentZoom != newZoom) {
                    window.webContents.setZoomFactor(newZoom);
                }
            }
            if (zoomDirection === "out" && currentZoom - zoomStep >= minZoom) {
                if (currentZoom - zoomStep < minZoom) {
                    newZoom = maxZoom;
                }
                else {
                    newZoom -= zoomStep
                }
                if (currentZoom != newZoom) {
                    window.webContents.setZoomFactor(newZoom);
                }
            }
            //console.log('zoom factor:', window.webContents.getZoomFactor());
            updateState(window);
        });
    });
    mainSetState(window);
}

export function init(window: BrowserWindow): void {
    const updateSize = (): void => {
        Promise.resolve().then(() => {
            mainSetSize(window);
            window.webContents.send(EVENT_ELECTRON_MAIN_RESIZED, JSON.stringify(preload.main.size));
        });
    }

    const updateBounds = (): void => {
        Promise.resolve().then(() => {
            mainSetSize(window);
            window.webContents.send(EVENT_ELECTRON_MAIN_MOVED, JSON.stringify(preload.main.bounds));
        });
    }

    ipcMain.on(EVENT_ELECTRON_MAIN_MINIMIZE, () => window.minimize());
    ipcMain.on(EVENT_ELECTRON_MAIN_MAXIMIZE, () => window.maximize());
    ipcMain.on(EVENT_ELECTRON_MAIN_RESTORE, () => window.restore());
    ipcMain.on(EVENT_ELECTRON_MAIN_FULLSCREEN, (_: Electron.IpcMainEvent, flag: boolean) => window.setFullScreen(flag));
    ipcMain.on(EVENT_ELECTRON_MAIN_CLOSE, () => window.close());
    ipcMain.handle(EVENT_ELECTRON_MAIN_STATE, (): WindowState => windowState);

    ipcMain.handle(
        EVENT_ELECTRON_DIALOG_OPENFILE, 
        (_: IpcMainInvokeEvent, options: OpenDialogOptions): Promise<OpenDialogReturnValue> => {
            return dialog.showOpenDialog(window, options);
        }
    );

    window.on('minimize', () => { updateState(window); });
    window.on('maximize', () => { updateState(window); });
    window.on('unmaximize', () => { updateState(window); });
    window.on('restore', () => { updateState(window); });
    window.on('hide', () => { updateState(window); });
    window.on('show', () => { updateState(window); });
    window.on('focus', () => { updateState(window); });
    window.on('enter-full-screen', () => { updateState(window); });
    window.on('leave-full-screen', () => { updateState(window); });
    window.on('enter-html-full-screen', () => { updateState(window); });
    window.on('leave-html-full-screen', () => { updateState(window); });
    mainSetState(window);

    window.on('resized', () => { updateSize(); });
    window.on('moved', () => { updateBounds(); });
    mainSetSize(window);

    initZoom(window);

    mainSetSize(window);
}

export const preload = {
    versions: electronAPI.process.versions,

    main: {
        close: (): void => {
            ipcRenderer.send(EVENT_ELECTRON_MAIN_CLOSE);
        },
        onResized: (callback: OnResizedFn): () => void => {
            const subscription = (_event: IpcRendererEvent, size: Size): void => callback(size);
            ipcRenderer.on(EVENT_ELECTRON_MAIN_RESIZED, subscription);
            return (): void => { ipcRenderer.off(EVENT_ELECTRON_MAIN_RESIZED, subscription) };
        },
        onMoved: (callback: OnMovedFn): () => void => {
            const subscription = (_event: IpcRendererEvent, bounds: Rectangle): void => callback(bounds);
            ipcRenderer.on(EVENT_ELECTRON_MAIN_MOVED, subscription);
            return (): void => { ipcRenderer.off(EVENT_ELECTRON_MAIN_MOVED, subscription) };
        },

        minimize: (): void => ipcRenderer.send(EVENT_ELECTRON_MAIN_MINIMIZE),
        maximize: (): void => ipcRenderer.send(EVENT_ELECTRON_MAIN_MAXIMIZE),
        restore: (): void => ipcRenderer.send(EVENT_ELECTRON_MAIN_RESTORE),
        setFullScreen: (flag: boolean): void => ipcRenderer.send(EVENT_ELECTRON_MAIN_FULLSCREEN, flag),

        onState: (callback: OnStateFn): () => void => {
            const subscription = (_event: IpcRendererEvent, state: WindowState): void => callback(state);
            ipcRenderer.on(EVENT_ELECTRON_MAIN_STATE, subscription);
            return (): void => { ipcRenderer.off(EVENT_ELECTRON_MAIN_STATE, subscription) };
        },

        //get sizer(): Size {  }

        size: {
            width: 0,
            height: 0
        } as Size,

        bounds: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        } as Rectangle,

        state: (): Promise<WindowState> => {
            return ipcRenderer.invoke(EVENT_ELECTRON_MAIN_STATE);
        },

    },

    dialog: {
        showOpenDialog: (options: OpenDialogOptions): Promise<OpenDialogReturnValue> => ipcRenderer.invoke(EVENT_ELECTRON_DIALOG_OPENFILE, options),
    }
}
