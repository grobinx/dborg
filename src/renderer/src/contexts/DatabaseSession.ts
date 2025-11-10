import * as api from "../../../api/db";
import { View } from "./ApplicationContext";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { ProfileRecord } from "./ProfilesContext";

export interface IDatabaseSession extends api.BaseConnection {
    info: api.ConnectionInfo; // Connection information
    schema: ProfileRecord; // Schema information
    metadata?: api.DatabasesMetadata | undefined; // Metadata of the database

    getVersion(): string | undefined; // Get the version of the database

    open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<IDatabaseSessionCursor>;

    closeCursors(): Promise<void>; // Close all cursors
}

export interface IDatabaseSessionCursor extends api.BaseCursor {
    info: api.CursorInfo;
}

export class DatabaseSessionCursor implements IDatabaseSessionCursor {
    info: api.CursorInfo; // Cursor information
    ended: boolean = false;;

    constructor(info: api.CursorInfo) {
        this.info = info;
    }
    getUniqueId(): string {
        return this.info.uniqueId;
    }

    async getCursorInfo(): Promise<api.CursorInfo> {
        this.info = (await window.dborg.database.connection.cursor.getCursor(this.info.connectionId, this.info.uniqueId))!;
        return this.info;
    }

    async fetch(fetchCount?: number): Promise<api.QueryResultRow[]> {
        const rows = await window.dborg.database.connection.cursor.fetch(this.info.connectionId, this.info.uniqueId, fetchCount);
        this.ended = await window.dborg.database.connection.cursor.isEnd(this.info.connectionId, this.info.uniqueId);
        return rows;
    }

    isEnd(): boolean {
        return this.ended;
    }

    close(): Promise<void> {
        return window.dborg.database.connection.cursor.close(this.info.connectionId, this.info.uniqueId);
    }

    cancel(): Promise<void> {
        return window.dborg.database.connection.cursor.cancel(this.info.connectionId, this.info.uniqueId);
    }

}

class DatabaseSession implements IDatabaseSession {
    info: api.ConnectionInfo; // Connection information
    schema: ProfileRecord; // Schema information
    metadata: api.DatabasesMetadata | undefined; // Metadata of the database
    metadataInitialized: boolean;

    constructor(info: api.ConnectionInfo) {
        this.info = info;
        this.schema = info.userData.schema as ProfileRecord;
        this.metadata = undefined;
        this.metadataInitialized = false;
    }

    async open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<IDatabaseSessionCursor> {
        const cursorInfo = await window.dborg.database.connection.open(this.info.uniqueId, sql, values, maxRowsMode);
        return new DatabaseSessionCursor(cursorInfo);
    }

    getVersion(): string | undefined {
        return this.info.version;
    }

    async getConnectionInfo(): Promise<api.ConnectionInfo> {
        this.info = (await window.dborg.database.connection.getConnection(this.info.uniqueId))!;
        return this.info;
    }

    getUserData(property: string): unknown {
        return this.info.userData[property];
    }

    setUserData(property: string, value: unknown): void {
        window.dborg.database.connection.userData.set(this.info.uniqueId, property, value);
        this.info.userData[property] = value;
    }

    getUniqueId(): string {
        return this.info.uniqueId;
    }

    getProperties(): api.Properties {
        return this.info.properties;
    }

    isConnected(): boolean {
        return this.info.connected;
    }

    store(sql: string): Promise<api.StatementResult> {
        return window.dborg.database.connection.store(this.info.uniqueId, sql);
    }

    query<R extends api.QueryResultRow>(sql: string, values?: unknown[]): Promise<api.QueryResult<R>> {
        return window.dborg.database.connection.query<R>(this.info.uniqueId, sql, values);
    }

    execute(sql: string, values?: unknown[]): Promise<api.CommandResult> {
        return window.dborg.database.connection.execute(this.info.uniqueId, sql, values);
    }

    close(): Promise<void> {
        return window.dborg.database.connection.close(this.info.uniqueId);
    }

    async getMetadata(progress?: (current: string) => void, force?: boolean): Promise<api.DatabasesMetadata> {
        if (this.info.driver.implements.includes("metadata")) {
            if (this.metadataInitialized && !force) {
                return this.metadata!;
            }
            this.metadata = await window.dborg.database.connection.getMetadata(this.info.uniqueId, progress, force);
            this.metadataInitialized = true;
        }
        return this.metadata ?? {};
    }

    updateObject(_progress?: (current: string) => void, _schemaName?: string, _objectName?: string): Promise<void> {
        // if (this.info.driver.implements.includes("metadata")) {
        //     return window.dborg.database.connection.updateObject(this.info.uniqueId, progress, schemaName, objectName);
        // }
        return Promise.resolve();
    }

    async closeCursors(): Promise<void> {
        if (this.info.cursors.length > 0) {
            this.info.cursors.forEach(async (cursor) => {
                await window.dborg.database.connection.cursor.close(this.info.uniqueId, cursor);
            });
            this.info.cursors = [];
        }
    }

    cancel(): Promise<void> {
        return window.dborg.database.connection.cancel(this.info.uniqueId);
    }
}

export interface MetadataGridResult {
    data: unknown[];
    columns: ColumnDefinition[];
}

export interface IMetadataGrid {
    getRelations(schema: string): MetadataGridResult;
    getRelations(database: string, schema: string): MetadataGridResult;
    getColumns(relation: string): MetadataGridResult;
    getColumns(schema: string, relation: string): MetadataGridResult;
}

export default DatabaseSession;