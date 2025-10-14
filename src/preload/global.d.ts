/// <reference types="vite/client" />

// loaded in tsconfig.web.json

import { OnMovedFn, OnResizedFn, OnStateFn } from "@api/electron"
import { Dialog, OpenDialogOptions, OpenDialogReturnValue, Rectangle, Size } from "electron"
import { CommandResult, ConnectionInfo, Cursor, CursorInfo, DatabasesMetadata, DriverInfo, Properties, QueryResult, StatementResult } from "src/api/db"
import { FileChangeEvent } from "src/main/api/dborg-file"

declare global {
    interface Window {
        electron: {
            versions: { [key: string]: string | undefined },
            main: {
                close: () => void,
                /** subscribe event for resize window, returns handle to unsubscibe useEffect => return */
                onResized: (callback: OnResizedFn) => () => void,
                /** subscribe event for move window, returns handle to unsubscibe useEffect => return */
                onMoved: (callback: OnMovedFn) => () => void,

                minimize: () => void,
                maximize: () => void,
                restore: () => void,
                setFullScreen: (flag: boolean) => void,

                /** subscribe event for change window state, returns handle to unsubscibe useEffect => return */
                onState: (callback: OnStateFn) => () => void,

                size: Size,
                bounds: Rectangle,
                state: () => Promise<WindowState>,
            },
            dialog: {
                showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>,
            }
        }
        dborg: {
            path: {
                get: (name: dborgPath.DBORG_PATHS) => Promise<string>
                ensureDir: (path: string) => Promise<void>
            },
            file: {
                readFile: (path: string, charCode?: BufferEncoding) => Promise<string>,
                writeFile: (path: string, content: string, charCode?: BufferEncoding) => Promise<void>,
                deleteFile: (path: string) => Promise<void>,
                exists: (path: string) => Promise<boolean>,
                /**
                 * Watch file or directory for changes, when directory is watched all subdirectorys are watched too
                 * @param filePath Can be file or directory path with parent directorys (eg c:/temp or c:/temp/file.txt or c:/temp/*.txt)
                 */
                watchFile: (filePath: string) => Promise<void>,
                unwatchFile: (filePath: string) => Promise<void>,
                /** 
                 * Subscribe to file changes, return unsubscribe function.
                 * First must be called watchFile(filePath) to start watching.
                 * @param callback (filePath, eventType) => void
                 * @param events optional filter events, if not set all events are listened to
                 * @param filePath optional filter filePath, if set only this filePath is listened to
                 * 
                 * eventType can be: 'changed' | 'deleted' | 'added' | 'dir-added' | 'dir-deleted'
                 */
                onFileChanged: (callback: (filePath: string, eventType?: FileChangeEvent) => void, events?: FileChangeEvent[], filePath?: string) => () => void,
            },
            settings: {
                get: (name: string) => Promise<TSettings>,
                store: (name: string, settings: TSettings) => void
            },
            database: {
                driver: {
                    getDrivers: () => Promise<DriverInfo[]>,
                    getDriver: (uniqueId: string) => Promise<DriverInfo | undefined>,
                    /** @param uniqueId driver uniqueId */
                    getConnections: (uniqueId: string) => Promise<ConnectionInfo[]>,
                    /** @param uniqueId driver uniqueId */
                    connect: (uniqueId: string, properties: Properties) => Promise<ConnectionInfo>,
                },
                connection: {
                    getConnection: (uniqueId: string) => Promise<ConnectionInfo | undefined>,
                    close: (uniqueId: string) => Promise<void>,
                    userData: {
                        get: (uniqueId: string, property: string) => Promise<unknown>,
                        set: (uniqueId: string, property: string, value: unknown) => Promise<void>,
                    },
                    store: (uniqueId: string, sql: string) => Promise<StatementResult>,
                    query: <R extends api.QueryResultRow = api.QueryResultRow>(uniqueId: string, sql: string, values?: unknown[]) => Promise<QueryResult<R>>,
                    open: (uniqueId: string, sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode) => Promise<CursorInfo>,
                    execute: (uniqueId: string, sql: string, values?: unknown[]) => Promise<CommandResult>,
                    cancel: (uniqueId: string) => Promise<void>,
                    cursor: {
                        getCursor: (connectionId: string, uniqueId: string) => Promise<CursorInfo | undefined>,
                        fetch: (connectionId: string, uniqueId: string, fetchCount?: number) => Promise<api.QueryResultRow[]>,
                        close: (connectionId: string, uniqueId: string) => Promise<void>,
                        isEnd: (connectionId: string, uniqueId: string) => Promise<boolean>,
                        cancel: (connectionId: string, uniqueId: string) => Promise<void>,
                    },
                    getMetadata: (uniqueId: string, progress?: (current: string) => void, force?: boolean) => Promise<DatabasesMetadata>,
                    //updateObject: (uniqueId: string, progress?: (current: string) => void, schemaName?: string, objectName?: string) => Promise<void>,
                },
                internal: {
                    query: <R extends api.QueryResultRow = api.QueryResultRow>(sql: string, values?: unknown[]) => Promise<QueryResult<R>>,
                    execute: (sql: string, values?: unknown[]) => Promise<CommandResult>,
                }
            }
        }
    }
}

export { }