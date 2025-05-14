export * from './Driver';

import * as driver from './Driver';
import * as api from '../../../api/db';
import { ipcMain, ipcRenderer, IpcMainInvokeEvent, IpcRendererEvent } from "electron";
import internal from '../../core/db/internal';
import { handleResult, invokeResult, InvokeResult } from '../../../api/ipc-helpers';

// Driver events
const EVENT_DRIVER_GET_DRIVERS = "dborg:database:driver:getDrivers";
const EVENT_DRIVER_GET_DRIVER = "dborg:database:driver:getDriver";
const EVENT_DRIVER_GET_CONNECTIONS = "dborg:database:driver:getConnections";
const EVENT_DRIVER_CONNECT = "dborg:database:driver:connect";

// Connection events
const EVENT_CONNECTION_GET = "dborg:database:connection:get";
const EVENT_CONNECTION_CLOSE = "dborg:database:connection:close";
const EVENT_CONNECTION_USER_DATA_GET = "dborg:database:connection:getUserData";
const EVENT_CONNECTION_USER_DATA_SET = "dborg:database:connection:setUserData";
const EVENT_CONNECTION_STORE = "dborg:database:connection:store";
const EVENT_CONNECTION_QUERY = "dborg:database:connection:query";
const EVENT_CONNECTION_OPEN = "dborg:database:connection:open";
const EVENT_CONNECTION_EXECUTE = "dborg:database:connection:execute";
const EVENT_CONNECTION_GET_METADATA = "dborg:database:connection:getMetadata";
const EVENT_CONNECTION_GET_METADATA_PROGRESS = "dborg:database:connection:getMetadata:progress";
const EVENT_CONNECTION_CANCEL = "dborg:database:connection:cancel";

// Cursor events
const EVENT_CONNECTION_CURSOR_GET = "dborg:database:connection:cursor:get";
const EVENT_CONNECTION_CURSOR_FETCH = "dborg:database:connection:cursor:fetch";
const EVENT_CONNECTION_CURSOR_CLOSE = "dborg:database:connection:cursor:close";
const EVENT_CONNECTION_CURSOR_IS_END = "dborg:database:connection:cursor:isEnd";
const EVENT_CONNECTION_CURSOR_CANCEL = "dborg:database:connection:cursor:cancel";

// Internal dborg database
const EVENT_INTERNAL_QUERY = "dborg:database:internal:query";
const EVENT_INTERNAL_EXECUTE = "dborg:database:internal:execute";

function ConnectionError(uniqueId: string): Error {
    return new Error(`Can't find "${uniqueId}" connection!`);
}

function CursorError(uniqueId: string): Error {
    return new Error(`Can't find "${uniqueId}" cursor!`);
}

export function init(): void {
    // Driver events
    ipcMain.handle(
        EVENT_DRIVER_GET_DRIVERS,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_: IpcMainInvokeEvent): api.DriverInfo[] => {
            return driver.Driver.getDrivers().map<api.DriverInfo>(driver => driver.getDriverInfo());
        }
    );
    ipcMain.handle(
        EVENT_DRIVER_GET_DRIVER,
        (_: IpcMainInvokeEvent, uniqueId: string): api.DriverInfo | undefined => {
            return driver.Driver.getDriver(uniqueId)?.getDriverInfo();
        }
    );
    ipcMain.handle(
        EVENT_DRIVER_GET_CONNECTIONS,
        (_: IpcMainInvokeEvent, uniqueId: string): Promise<InvokeResult> =>
            handleResult(async () => {
                const connections = driver.Driver.getDriver(uniqueId)?.getConnections() || [];
                // Filtruj połączenia, aby wykluczyć "internal"
                const filteredConnections = connections.filter(connection => connection.getUniqueId() !== "internal");
                return await Promise.all(filteredConnections.map(async connection => await connection.getConnectionInfo()));
            })
    );
    ipcMain.handle(
        EVENT_DRIVER_CONNECT,
        async (_: IpcMainInvokeEvent, uniqueId: string, properties: api.Properties): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundDriver = driver.Driver.getDriver(uniqueId);
                if (!foundDriver) {
                    throw new Error(`Can't find "${uniqueId}" driver!`);
                }
                const connection = await foundDriver.connect(properties);
                try {
                    return await connection.getConnectionInfo();
                }
                catch (error) {
                    // if this is a pool connection we need to close it at getConnectionInfo error
                    await connection.close();
                    throw error;
                }
            })
        }
    );

    // Connection events
    ipcMain.handle(
        EVENT_CONNECTION_GET,
        (_: IpcMainInvokeEvent, uniqueId: string): Promise<InvokeResult> =>
            handleResult(async () => await driver.Driver.getConnection(uniqueId)?.getConnectionInfo())
    );
    ipcMain.handle(
        EVENT_CONNECTION_CLOSE,
        async (_: IpcMainInvokeEvent, uniqueId: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return await foundConnection.close();
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_USER_DATA_GET,
        async (_: IpcMainInvokeEvent, uniqueId: string, property: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return foundConnection.getUserData(property);
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_USER_DATA_SET,
        async (_: IpcMainInvokeEvent, uniqueId: string, property: string, value: unknown): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                foundConnection.setUserData(property, value);
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_STORE,
        async (_: IpcMainInvokeEvent, uniqueId: string, sql: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return await foundConnection.store(sql);
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_QUERY,
        async (_: IpcMainInvokeEvent, uniqueId: string, sql: string, values: unknown[]): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return await foundConnection.query(sql, values);
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_OPEN,
        async (_: IpcMainInvokeEvent, uniqueId: string, sql: string, values: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                const cursor = await foundConnection.open(sql, values, maxRowsMode);
                return await cursor.getCursorInfo();
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_EXECUTE,
        async (_: IpcMainInvokeEvent, uniqueId: string, sql: string, values: unknown[]): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return await foundConnection.execute(sql, values);
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_GET_METADATA,
        async (event: IpcMainInvokeEvent, uniqueId: string, force: boolean): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return await foundConnection.getMetadata((current: string) => {
                    event.sender.send(EVENT_CONNECTION_GET_METADATA_PROGRESS, uniqueId, current);
                }, force);
            })
        }
    );
    ipcMain.handle(
        EVENT_CONNECTION_CANCEL,
        async (_: IpcMainInvokeEvent, uniqueId: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundConnection = driver.Driver.getConnection(uniqueId);
                if (!foundConnection) {
                    throw ConnectionError(uniqueId);
                }
                return await foundConnection.cancel();
            })
        }
    );

    ipcMain.handle(
        EVENT_CONNECTION_CURSOR_GET,
        async (_: IpcMainInvokeEvent, connectionId: string, uniqueId: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundCursor = driver.Connection.getCursor(connectionId, uniqueId);
                if (!foundCursor) {
                    throw CursorError(uniqueId);
                }
                return await foundCursor.getCursorInfo();
            })
        }
    );

    ipcMain.handle(
        EVENT_CONNECTION_CURSOR_FETCH,
        async (_: IpcMainInvokeEvent, connectionId: string, uniqueId: string, fetchCount: number): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundCursor = driver.Connection.getCursor(connectionId, uniqueId);
                if (!foundCursor) {
                    throw CursorError(uniqueId);
                }
                return await foundCursor.fetch(fetchCount);
            })
        }
    );

    ipcMain.handle(
        EVENT_CONNECTION_CURSOR_CLOSE,
        async (_: IpcMainInvokeEvent, connectionId: string, uniqueId: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundCursor = driver.Connection.getCursor(connectionId, uniqueId);
                if (!foundCursor) {
                    //throw CursorError(uniqueId);
                    return;
                }
                return await foundCursor.close();
            })
        }
    );

    ipcMain.handle(
        EVENT_CONNECTION_CURSOR_IS_END,
        async (_: IpcMainInvokeEvent, connectionId: string, uniqueId: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundCursor = driver.Connection.getCursor(connectionId, uniqueId);
                if (!foundCursor) {
                    //throw CursorError(uniqueId);
                    return true;
                }
                return foundCursor.isEnd();
            })
        }
    );

    ipcMain.handle(
        EVENT_CONNECTION_CURSOR_CANCEL,
        async (_: IpcMainInvokeEvent, connectionId: string, uniqueId: string): Promise<InvokeResult> => {
            return handleResult(async () => {
                const foundCursor = driver.Connection.getCursor(connectionId, uniqueId);
                if (!foundCursor) {
                    //throw CursorError(uniqueId);
                    return;
                }
                return await foundCursor.cancel();
            })
        }
    );

    // Internal dborg database
    ipcMain.handle(
        EVENT_INTERNAL_QUERY,
        (_: IpcMainInvokeEvent, sql: string, values: unknown[]): Promise<InvokeResult> => handleResult(internal.query(sql, values))
    );
    ipcMain.handle(
        EVENT_INTERNAL_EXECUTE,
        (_: IpcMainInvokeEvent, sql: string, values: unknown[]): Promise<InvokeResult> => handleResult(internal.execute(sql, values))
    );
}

export const preload = {
    driver: {
        getDrivers: (): Promise<api.DriverInfo[]> => ipcRenderer.invoke(EVENT_DRIVER_GET_DRIVERS),
        getDriver: (uniqueId: string): Promise<api.DriverInfo | undefined> => ipcRenderer.invoke(EVENT_DRIVER_GET_DRIVER, uniqueId),
        /** @param uniqueId driver uniqueId */
        getConnections: (uniqueId: string): Promise<api.ConnectionInfo[]> => invokeResult(ipcRenderer.invoke(EVENT_DRIVER_GET_CONNECTIONS, uniqueId)),
        /** @param uniqueId driver uniqueId */
        connect: (uniqueId: string, properties: api.Properties): Promise<api.ConnectionInfo> => invokeResult(ipcRenderer.invoke(EVENT_DRIVER_CONNECT, uniqueId, properties)),
    },
    connection: {
        getConnection: (uniqueId: string): Promise<api.ConnectionInfo | undefined> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_GET, uniqueId)),
        close: (uniqueId: string): Promise<void> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CLOSE, uniqueId)),
        userData: {
            get: (uniqueId: string, property: string): Promise<unknown> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_USER_DATA_GET, uniqueId, property)),
            set: (uniqueId: string, property: string, value: unknown): Promise<void> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_USER_DATA_SET, uniqueId, property, value)),
        },
        store: (uniqueId: string, sql: string): Promise<api.StatementResult> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_STORE, uniqueId, sql)),
        query: <R extends api.QueryResultRow = api.QueryResultRow>(uniqueId: string, sql: string, values: unknown[] = []): Promise<api.QueryResult<R>> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_QUERY, uniqueId, sql, values)),
        open: (uniqueId: string, sql: string, values: unknown[] = [], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<api.CursorInfo> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_OPEN, uniqueId, sql, values, maxRowsMode)),
        execute: (uniqueId: string, sql: string, values: unknown[] = []): Promise<api.CommandResult> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_EXECUTE, uniqueId, sql, values)),
        cancel: (uniqueId: string): Promise<void> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CANCEL, uniqueId)),
        cursor: {
            getCursor: (connectionId: string, uniqueId: string): Promise<api.CursorInfo | undefined> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CURSOR_GET, connectionId, uniqueId)),
            fetch: (connectionId: string, uniqueId: string, fetchCount?: number): Promise<api.QueryResultRow[]> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CURSOR_FETCH, connectionId, uniqueId, fetchCount)),
            close: (connectionId: string, uniqueId: string): Promise<void> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CURSOR_CLOSE, connectionId, uniqueId)),
            isEnd: (connectionId: string, uniqueId: string): Promise<boolean> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CURSOR_IS_END, connectionId, uniqueId)),
            cancel: (connectionId: string, uniqueId: string): Promise<void> => invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_CURSOR_CANCEL, connectionId, uniqueId)),
        },
        getMetadata: async (uniqueId: string, progress?: (current: string) => void, force?: boolean): Promise<api.DatabasesMetadata> => {
            const listener = (_event: IpcRendererEvent, eUniqueId: string, current: string): void => {
                if (eUniqueId !== uniqueId) {
                    return;
                }
                if (progress) {
                    progress(current);
                }
            };

            ipcRenderer.on(EVENT_CONNECTION_GET_METADATA_PROGRESS, listener);

            try {
                return await invokeResult(ipcRenderer.invoke(EVENT_CONNECTION_GET_METADATA, uniqueId, force));
            }
            finally {
                ipcRenderer.removeListener(EVENT_CONNECTION_GET_METADATA_PROGRESS, listener);
            };
        }
    },
    internal: {
        query: <R extends api.QueryResultRow = api.QueryResultRow>(sql: string, values: unknown[] = []): Promise<api.QueryResult<R>> => invokeResult(ipcRenderer.invoke(EVENT_INTERNAL_QUERY, sql, values)),
        execute: (sql: string, values: unknown[] = []): Promise<api.CommandResult> => invokeResult(ipcRenderer.invoke(EVENT_INTERNAL_EXECUTE, sql, values)),
    }
}
