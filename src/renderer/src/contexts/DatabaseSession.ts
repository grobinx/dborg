import { ProfileRecord } from "src/api/entities";
import * as api from "../../../api/db";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";

export type QueueTaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface QueueTaskInfo {
    id: string;
    status: QueueTaskStatus;
    enqueuedAt: number;
    startedAt?: number;
    finishedAt?: number;
    error?: string;
}

export interface IDatabaseSession extends api.BaseConnection {
    info: api.ConnectionInfo; // Connection information
    profile: ProfileRecord; // Profile information
    metadata?: api.DatabasesMetadata | undefined; // Metadata of the database

    getVersion(): string | undefined; // Get the version of the database

    open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<IDatabaseSessionCursor>;

    closeCursors(): Promise<void>; // Close all cursors

    /**
     * Queue task (fire-and-forget). Per-session queue.
     * @param task
     */
    enqueue(task: (session: IDatabaseSession) => Promise<unknown>): void;

    /**
     * Get current queue tasks (including running).
     */
    getQueueTasks(): QueueTaskInfo[];

    /**
     * Cancel a queued task by id (only if not started).
     */
    cancelQueuedTask(id: string): boolean;

    /**
     * Configure queue concurrency for this session.
     * max <= 1 => sequential FIFO
     */
    setQueueConcurrency(max: number): void;
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
    profile: ProfileRecord; // Profile information
    metadata: api.DatabasesMetadata | undefined; // Metadata of the database
    metadataInitialized: boolean;

    // Per-session concurrency state (default: sequential)
    private maxConcurrency = 1;
    // Keep only last N finished tasks
    private maxQueueHistory = 200;
    private active = 0;
    private pending: Array<{ id: string; run: () => void }> = [];

    // Queue task tracking
    private queueTasks: QueueTaskInfo[] = [];
    private queueSeq = 0;

    constructor(info: api.ConnectionInfo) {
        this.info = info;
        this.profile = info.userData.profile as ProfileRecord;
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
        // cancel all queued (not started) tasks
        if (this.pending.length > 0) {
            const canceledIds = new Set(this.pending.map((p) => p.id));
            this.pending = [];
            this.queueTasks.forEach((t) => {
                if (t.status === "queued" && canceledIds.has(t.id)) {
                    t.status = "canceled";
                    t.finishedAt = Date.now();
                }
            });
            this.trimQueueHistory(true);
        }
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

    /**
     * Configure queue concurrency for this session.
     * max <= 1 => sequential FIFO
     */
    setQueueConcurrency(max: number): void {
        this.maxConcurrency = Math.max(1, Math.floor(max));
        this.pumpQueue();
    }

    /**
     * Enqueue task (fire-and-forget). Per-session.
     */
    enqueue(task: (session: IDatabaseSession) => Promise<unknown>): void {
        const id = this.nextQueueId();
        const info: QueueTaskInfo = {
            id,
            status: "queued",
            enqueuedAt: Date.now(),
        };
        this.queueTasks.push(info);

        const run = async () => {
            this.active++;
            info.status = "running";
            info.startedAt = Date.now();

            try {
                await task(this);
                info.status = "done";
            } catch (err: any) {
                info.status = "failed";
                info.error = err?.message ?? String(err);
                console.error("Queue task failed:", err);
            } finally {
                info.finishedAt = Date.now();
                this.active--;
                this.pumpQueue();
                this.trimQueueHistory();
            }
        };

        this.pending.push({ id, run });
        this.pumpQueue();
        this.trimQueueHistory();
    }

    /**
     * Get current queue tasks (including running).
     */
    getQueueTasks(): QueueTaskInfo[] {
        return this.queueTasks.map((t) => ({ ...t }));
    }

    /**
     * Cancel a queued task by id (only if not started).
     */
    cancelQueuedTask(id: string): boolean {
        const taskInfo = this.queueTasks.find((t) => t.id === id);
        if (!taskInfo || taskInfo.status !== "queued") {
            return false;
        }

        const index = this.pending.findIndex((p) => p.id === id);
        if (index >= 0) {
            this.pending.splice(index, 1);
            taskInfo.status = "canceled";
            taskInfo.finishedAt = Date.now();
            return true;
        }

        return false;
    }

    private pumpQueue(): void {
        while (this.active < this.maxConcurrency && this.pending.length > 0) {
            const item = this.pending.shift();
            if (item) {
                item.run();
            }
        }
    }

    private nextQueueId(): string {
        this.queueSeq += 1;
        return `${this.info.uniqueId}-${this.queueSeq}`;
    }

    private trimQueueHistory(clearAllFinished: boolean = false): void {
        // Keep all queued/running + last N finished (or none if clearAllFinished)
        const active = this.queueTasks.filter((t) => t.status === "queued" || t.status === "running");
        if (clearAllFinished) {
            this.queueTasks = active;
            return;
        }

        const finished = this.queueTasks.filter((t) => t.status !== "queued" && t.status !== "running");
        if (finished.length <= this.maxQueueHistory) {
            this.queueTasks = active.concat(finished);
            return;
        }
        const tail = finished.slice(-this.maxQueueHistory);
        this.queueTasks = active.concat(tail);
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