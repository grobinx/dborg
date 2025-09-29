import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { init as initDborgPath } from './api/dborg-path'
import { init as initDborgFile } from './api/dborg-file'
import { init as initSettings } from './api/settings'
import { init as initElectron } from './api/electron'
import { init as initDatabase } from './api/db'
import path from 'node:path'
import { init as initInternal } from './core/db/internal'
import logo from '../../resources/dborg.png?asset'
import debounce from '../renderer/src/utils/debounce'

function createWindow(): BrowserWindow {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { logo } : {}),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: false,
            //backgroundThrottling: false,
        },
        icon: logo,
        titleBarStyle: 'hidden',
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
    
    mainWindow.on('resize', debounce(() => {
        mainWindow.webContents.send('window-resized', mainWindow.getBounds());
    }, 40));

    return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    await initInternal()

    // Set app user model id for windows
    electronApp.setAppUserModelId('dborg')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    const mainWindow = createWindow()

    // Pobierz istniejące menu aplikacji
    const menu = Menu.getApplicationMenu();

    if (menu) {
        // Przejdź przez wszystkie elementy menu i znajdź pozycję z Ctrl+W
        menu.items.forEach((menuItem) => {
            if (menuItem.submenu) {
                menuItem.submenu.items.forEach((submenuItem) => {
                    if (submenuItem.accelerator === 'Ctrl+W' || submenuItem.accelerator === 'CommandOrControl+W') {
                        submenuItem.accelerator = "Alt+F4"; // Zmień skrót na Alt+F4
                    }
                });
            }
        });

        // Ustaw zmodyfikowane menu jako aktywne
        Menu.setApplicationMenu(menu);
    }

    initSettings(ipcMain)
    initDborgPath(ipcMain)
    initDborgFile(ipcMain)
    initElectron(mainWindow)
    initDatabase()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
