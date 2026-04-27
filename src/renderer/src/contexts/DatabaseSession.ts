import { ProfileRecord } from "src/api/entities";
import * as api from "../../../api/db";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IQueueTask, QueueTask, TaskOptions } from "@renderer/utils/QueueTask";
import { Messages, queueMessage } from "./MessageContext";
import { getProfileSettings, PROFILE_UPDATE_MESSAGE, storeProfileSettings } from "./ProfilesContext";
import { DataGridChangesManager, DataGridChangesOptions } from "@renderer/components/DataGrid/DataGridChangesManager";
import { versionToNumber } from "../../../../src/api/version";
import { createMetadataQueryApi, MetadataQueryApi } from "../../../../src/api/db/MetadataQuery";

export function resultsTabsId(session: IDatabaseSession): string {
    return session.profile.sch_id + ":" + session.info.connectionId + ":results-tabs";
}

export interface IDatabaseSession extends api.BaseConnection, api.IMetadataProvider {
    info: api.ConnectionInfo; // Connection information
    profile: ProfileRecord; // Profile information
    settings: Map<string, Record<string, any>>; // Profile settings (loaded from user settings folder)
    metadata?: api.Metadata | undefined; // Metadata of the database

    getVersion(): string | undefined; // Get the version of the database

    getContext(reload?: boolean): Promise<api.SessionContext | undefined>; // Get session context, if supported by database, for example current user, roles, permissions, etc. This method is optional and may not be implemented by all drivers. If the database does not support session context or if the information is not available, this method may return undefined or throw an error. The session context provides information about the current session and can be used to determine the permissions and capabilities of the session user.

    open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<IDatabaseSessionCursor>;

    closeCursors(): Promise<void>; // Close all cursors

    /**
     * Queue task (fire-and-forget). Per-session queue.
     * @param task
     */
    enqueue(task: TaskOptions<IDatabaseSession>): void;

    /**
     * Get current queue tasks (including running).
     */
    getQueue(): IQueueTask;

    /**
     * Store a value in the profile field (persisted). 
     * This will update the profile both in-memory and in the database, and trigger profile change listeners. 
     * The value will be available in session profile structure.
     * @param property profile property name
     * @param value value or structured object to store
     */
    storeProfileField(property: string, values: Record<string, any>): void;

    /**
     * Store a value on user data folder in a file. 
     * @param name name for a file in user data folder (without extension)
     * @param value value or structured object to store
     */
    storeProfileSettings(name: string, value: Record<string, any>): void;

    getProfileSettings(name: string): Promise<Record<string, any> | null>;

    getProfile(): ProfileRecord;

    setProfile(profile: ProfileRecord): void;

    /**
     * Create a DataGridChangesManager for managing changes in data grids. Each manager is associated with a context object (e.g. component instance) and can be retrieved later using that context.
     * @param options 
     */
    createChangeManager<T extends Record<string, any>>(options: DataGridChangesOptions<T> & { context: object }): DataGridChangesManager<T>;

    /**
     * Get a DataGridChangesManager associated with the given context. Returns undefined if no manager is found for that context.
     * @param context 
     */
    changeManager<T extends Record<string, any>>(context: object): DataGridChangesManager<T> | undefined;

    /**
     * Get all active change managers.
     */
    changeManagerList(): DataGridChangesManager<any>[];

    /**
     * Change the order of change managers. The order can be used to determine the sequence of applying changes or generating scripts.
     * @param newOrder Array of keys representing the new order. Keys are generated based on the context object provided when creating the manager.
     * @returns true if the order was successfully updated, false if there was an error (e.g. invalid keys).
     */
    setChangeManagersOrder(newOrder: string[]): boolean;

    /**
     * Move a change manager to a new position in the order.
     * @param key Key of the manager to move (generated based on context).
     * @param newIndex New position index (0-based).
     * @returns true if the manager was successfully moved, false if there was an error (e.g. invalid key or index).
     */
    moveChangeManager(key: string, newIndex: number): boolean;

    /**
     * Get the current order of change manager keys.
     */
    getChangeManagersOrder(): string[];

    /**
     * Get change managers with their keys.
     */
    changeManagerEntries(): Array<[string, DataGridChangesManager<any>]>;
}

export interface IDatabaseSessionCursor extends api.BaseCursor {
    info: api.CursorInfo;
}

export class DatabaseSessionCursor implements IDatabaseSessionCursor {
    info: api.CursorInfo; // Cursor information
    ended: boolean = false;

    constructor(info: api.CursorInfo) {
        this.info = info;
    }
    getCursorId(): string {
        return this.info.cursorId;
    }

    async getCursorInfo(): Promise<api.CursorInfo> {
        this.info = (await window.dborg.database.connection.cursor.getCursor(this.info.connectionId, this.info.cursorId))!;
        return this.info;
    }

    async fetch(fetchCount?: number): Promise<api.QueryResultRow[]> {
        const rows = await window.dborg.database.connection.cursor.fetch(this.info.connectionId, this.info.cursorId, fetchCount);
        this.ended = await window.dborg.database.connection.cursor.isEnd(this.info.connectionId, this.info.cursorId);
        return rows;
    }

    isEnd(): boolean {
        return this.ended;
    }

    close(): Promise<void> {
        return window.dborg.database.connection.cursor.close(this.info.connectionId, this.info.cursorId);
    }

    cancel(): Promise<void> {
        return window.dborg.database.connection.cursor.cancel(this.info.connectionId, this.info.cursorId);
    }

}

class DatabaseSession implements IDatabaseSession {
    private readonly changeManagers: Map<string, DataGridChangesManager<any>> = new Map();
    private changeManagersOrder: string[] = [];

    info: api.ConnectionInfo; // Connection information
    profile: ProfileRecord; // Profile information
    settings: Map<string, Record<string, any>> = new Map();
    private readonly queue: QueueTask<IDatabaseSession>;

    constructor(info: api.ConnectionInfo, restored?: boolean) {
        this.info = info;
        this.profile = info.userData.profile as ProfileRecord;

        this.queue = new QueueTask<IDatabaseSession>({
            id: this.info.connectionId,
            maxConcurrency: this.profile.sch_queue?.concurrency ?? 1,
            maxQueueHistory: this.profile.sch_queue?.history ?? 200,
        });

        if (!restored) {
            this.initializeMetadata();
        } else {
            this.closeCursors();
        }
    }

    async open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<IDatabaseSessionCursor> {
        const cursorInfo = await window.dborg.database.connection.open(this.info.connectionId, sql, values, maxRowsMode);
        return new DatabaseSessionCursor(cursorInfo);
    }

    getVersion(): string | undefined {
        return this.info.version;
    }

    async getConnectionInfo(): Promise<api.ConnectionInfo> {
        this.info = (await window.dborg.database.connection.getConnection(this.info.connectionId))!;
        return this.info;
    }

    getUserData(property: string): unknown {
        return this.info.userData[property];
    }

    setUserData(property: string, value: unknown): void {
        window.dborg.database.connection.userData.set(this.info.connectionId, property, value);
        this.info.userData[property] = value;
    }

    getProfile(): ProfileRecord {
        return this.getUserData("profile") as ProfileRecord;
    }

    setProfile(profile: ProfileRecord): void {
        this.setUserData("profile", profile);
    }

    getConnectionId(): string {
        return this.info.connectionId;
    }

    getProperties(): api.Properties {
        return this.info.properties;
    }

    isConnected(): boolean {
        return this.info.connected;
    }

    store(sql: string): Promise<api.StatementResult> {
        return window.dborg.database.connection.store(this.info.connectionId, sql);
    }

    query<R extends api.QueryResultRow>(sql: string, values?: unknown[]): Promise<api.QueryResult<R>> {
        return window.dborg.database.connection.query<R>(this.info.connectionId, sql, values);
    }

    execute(sql: string, values?: unknown[]): Promise<api.CommandResult> {
        return window.dborg.database.connection.execute(this.info.connectionId, sql, values);
    }

    close(): Promise<void> {
        // cancel all queued (not started) tasks
        this.queue.cancelAllQueued();
        return window.dborg.database.connection.close(this.info.connectionId);
    }

    async getContext(reload?: boolean): Promise<api.SessionContext | undefined> {
        if (this.info.context && !reload) {
            return this.info.context;
        }
        this.info.context = await window.dborg.database.connection.getContext(this.info.connectionId, reload);
        return this.info.context;
    }

    async getMetadataQuery(): Promise<MetadataQueryApi> {
        const metadataQuery = await createMetadataQueryApi(this.info.connectionId);
        return metadataQuery;
    }

    async initializeMetadata(forceReload?: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                queueMessage(Messages.SESSION_GET_METADATA_START, {
                    connectionId: this.info.connectionId,
                    profile: this.getProfile(),
                } as Messages.SessionGetMetadataStart);

                window.dborg.database.connection.initializeMetadata(this.info.connectionId, (current) => {
                    queueMessage(Messages.SESSION_GET_METADATA_PROGRESS, {
                        connectionId: this.info.connectionId,
                        progress: current,
                    } as Messages.SessionGetMetadataProgress);
                }, forceReload).then(() => {
                    queueMessage(Messages.SESSION_GET_METADATA_SUCCESS, {
                        connectionId: this.info.connectionId,
                    } as Messages.SessionGetMetadataSuccess);
                    resolve();
                }).catch((error) => {
                    queueMessage(Messages.SESSION_GET_METADATA_ERROR, {
                        connectionId: this.info.connectionId,
                        error: error.message,
                    } as Messages.SessionGetMetadataError);
                    reject(error);
                }).finally(() => {
                    queueMessage(Messages.SESSION_GET_METADATA_END, {
                        connectionId: this.info.connectionId,
                    } as Messages.SessionGetMetadataEnd);
                });
            }, forceReload ? 0 : 2000);
        });
    }

    async closeCursors(): Promise<void> {
        if (this.info.cursors.length > 0) {
            this.info.cursors.forEach(async (cursor) => {
                await window.dborg.database.connection.cursor.close(this.info.connectionId, cursor);
            });
            this.info.cursors = [];
        }
    }

    cancel(): Promise<void> {
        return window.dborg.database.connection.cancel(this.info.connectionId);
    }

    /**
 * Enqueue task (fire-and-forget). Per-session.
 */
    enqueue(task: TaskOptions<IDatabaseSession>): void {
        this.queue.enqueue(task, this);
    }

    /**
     * Get current queue tasks (including running).
     */
    getQueue(): IQueueTask {
        return this.queue;
    }

    storeProfileField(property: string, value: Record<string, any>): void {
        queueMessage(PROFILE_UPDATE_MESSAGE, { profileId: this.getProfile().sch_id, profile: { [property]: value } });
        this.setProfile({ ...this.getProfile(), [property]: value });
    }

    storeProfileSettings(name: string, value: Record<string, any>): void {
        storeProfileSettings(this.getProfile().sch_id, name, value);
    }

    getProfileSettings(name: string): Promise<Record<string, any> | null> {
        return getProfileSettings(this.getProfile().sch_id, name);
    }

    /**
     * Tworzy unikatowy klucz dla kontekstu poprzez serializację posortowanych właściwości
     */
    private createChangeManagerKey(context: object): string {
        const sorted = Object.keys(context)
            .sort()
            .reduce((acc, key) => {
                acc[key] = (context as Record<string, any>)[key];
                return acc;
            }, {} as Record<string, any>);

        return JSON.stringify(sorted);
    }

    createChangeManager<T extends Record<string, any>>(
        options: DataGridChangesOptions<T> & { context: object }
    ): DataGridChangesManager<T> {
        const key = this.createChangeManagerKey(options.context);

        if (!this.changeManagers.has(key)) {
            this.changeManagers.set(key, new DataGridChangesManager(options));
            // Dodaj na koniec porządku
            this.changeManagersOrder.push(key);
        }

        return this.changeManagers.get(key)!;
    }

    changeManager<T extends Record<string, any>>(context: object): DataGridChangesManager<T> | undefined {
        const key = this.createChangeManagerKey(context);
        return this.changeManagers.get(key) as DataGridChangesManager<T> | undefined;
    }

    /**
     * Zwraca wszystkie managery w obecnym porządku
     */
    changeManagerList(): DataGridChangesManager<any>[] {
        return this.changeManagersOrder
            .map(key => this.changeManagers.get(key))
            .filter((manager): manager is DataGridChangesManager<any> => manager !== undefined);
    }

    /**
     * Zmienia porządek managerów
     * @param newOrder - Tablica kluczy w nowej kolejności
     */
    setChangeManagersOrder(newOrder: string[]): boolean {
        // Sprawdzenie czy wszystkie klucze istnieją
        const validKeys = new Set(this.changeManagersOrder);
        const allKeysValid = newOrder.every(key => validKeys.has(key));

        if (!allKeysValid || newOrder.length !== this.changeManagersOrder.length) {
            console.warn('Invalid order:Keys mismatch or incorrect count');
            return false;
        }

        this.changeManagersOrder = [...newOrder];
        return true;
    }

    /**
     * Przesuwa manager na określoną pozycję
     * @param key - Klucz managera
     * @param newIndex - Nowa pozycja (0-based)
     */
    moveChangeManager(key: string, newIndex: number): boolean {
        const currentIndex = this.changeManagersOrder.indexOf(key);

        if (currentIndex === -1 || newIndex < 0 || newIndex >= this.changeManagersOrder.length) {
            return false;
        }

        this.changeManagersOrder.splice(currentIndex, 1);
        this.changeManagersOrder.splice(newIndex, 0, key);
        return true;
    }

    /**
     * Zwraca porządek kluczy managerów
     */
    getChangeManagersOrder(): string[] {
        return [...this.changeManagersOrder];
    }

    /**
     * Zwraca managery z ich kluczami
     */
    changeManagerEntries(): Array<[string, DataGridChangesManager<any>]> {
        return this.changeManagersOrder
            .map(key => {
                const manager = this.changeManagers.get(key);
                return manager ? [key, manager] as const : null;
            })
            .filter((entry): entry is [string, DataGridChangesManager<any>] => entry !== null);
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