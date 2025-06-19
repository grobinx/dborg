import * as api from '../../../../src/api/db';
import Version from '../../../../src/api/version';
import * as driver from '../../../../src/main/api/db';
import { uuidv7 } from "uuidv7";
import sqlite3 from 'sqlite3';
import * as sqlParser from 'node-sql-parser';
import logo from '../../resources/sqlite-logo.svg';

const driverVersion: Version = {
    major: 1,
    minor: 0,
    release: 0,
    build: 1,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}
const driverUniqueId = "sqlite3";

const driver_database_location = "driver:database_location";
const driver_database_location_default = ":memory:";

const driver_fetch_record_count = "driver:fetch_record_count";
const driver_fetch_record_count_default = 100;

const driver_max_statement_rows = "driver:max_statement_rows";
const driver_max_statement_rows_default = 10000;

/**
 * Mapuje typ JS (typeof value) na typ obsługiwany przez aplikację.
 * Nie korzysta z deklarowanego typu kolumny.
 */
export function mapSqliteValueToColumnDataType(value: unknown): api.ColumnDataType {
    const isArray = Array.isArray(value);
    if (isArray) {
        if (value.length > 0) {
            return api.resolveDataTypeFromString(value[0] as string) ?? 'string';
        }
        else {
            return 'object';
        }
    }
    return api.resolveDataTypeFromString(value as string) ?? 'string';
}

export class Cursor extends driver.Cursor {
    private uniqueId: string;
    private statement: sqlite3.Statement;
    private values: unknown[] | undefined;
    private ended: boolean = false;
    private start: number;
    private fetchRecordCount: number;
    private maxStatementRows: number;
    private maxRowsMode?: api.CursorFetchMaxRowsMode

    rowCount?: number | null | undefined;
    columns: api.ColumnInfo[] | undefined = [];
    command: string | undefined;
    duration: number | undefined;
    sql: string;

    constructor(connection: Connection, statement: sqlite3.Statement,
        values: unknown[], command: string | undefined, start: number,
        sql: string, fetchRecordCount: number,
        maxStatementRows: number, maxRowsMode?: api.CursorFetchMaxRowsMode
    ) {
        super(connection);
        this.uniqueId = uuidv7();
        connection._addCursor(this);
        this.statement = statement;
        this.command = command;
        this.values = values;
        this.start = start;
        this.sql = sql;
        this.fetchRecordCount = fetchRecordCount;
        this.maxStatementRows = maxStatementRows;
        this.maxRowsMode = maxRowsMode;
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    getSessionId(): string | undefined {
        return this.connection.getSessionId();
    }

    async getCursorInfo(): Promise<api.CursorInfo> {
        return {
            uniqueId: this.getUniqueId(),
            connectionId: this.connection.getUniqueId(),
            command: this.command,
            duration: this.duration,
            columns: this.columns,
            sql: this.sql,
            parameters: this.values,
            fetchedRows: this.rowCount ?? undefined,
            sessionId: this.connection.getSessionId(),
        };
    }

    getConnection(): driver.Connection {
        return this.connection;
    }

    async fetch(fetchCount?: number): Promise<api.QueryResultRow[]> {
        const rows: api.QueryResultRow[] = [];

        const getRow = async (): Promise<api.QueryResultRow> => {
            return new Promise((resolve, reject) => {
                try {
                    this.statement.get(this.values, (error: Error, row: object): void => {
                        if (error) {
                            reject(error);
                        }
                        resolve(row as api.QueryResultRow);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        }

        const onError = (error: Error): void => {
            throw error;
        }

        this.statement.on("error", onError);
        try {
            fetchCount ??= this.fetchRecordCount;
            let row = await getRow();
            if (row && this.duration === undefined) {
                this.duration = Date.now() - this.start;
                this.columns = [];
                for (const [key, value] of Object.entries(row)) {
                    this.columns.push({
                        typeName: "any",
                        name: key,
                        dbDataType: typeof value,
                        dataType: mapSqliteValueToColumnDataType(value),
                    });
                }
            }
            while (row) {
                rows.push(row);
                if (--fetchCount === 0) {
                    break;
                }
                row = await getRow();
            }

            if (!row) {
                this.ended = true;
            }

            this.rowCount = (this.rowCount ?? 0) + rows.length;

            if (((this.maxRowsMode ?? "set") === "set" && this.rowCount >= this.maxStatementRows) ||
                (typeof this.maxRowsMode === "number" && this.rowCount >= this.maxRowsMode)) {
                this.ended = true;
            }

            return rows;
        }
        catch (error) {
            throw error;
        }
        finally {
            this.statement.off("error", onError);
        }
    }

    isEnd(): boolean {
        return this.ended;
    }

    close(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await super.close();
            this.statement.finalize((error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }

    async cancel(): Promise<void> {
    }

}

export class Connection extends driver.Connection {
    private uniqueId: string;
    private properties: api.Properties;
    private client?: sqlite3.Database;
    private fetchRecordCount: number;
    private maxStatementRows: number;
    private version: Version<"major" | "minor" | "patch" | "toString"> | undefined;

    constructor(properties: api.Properties, driver: Driver, client: sqlite3.Database, uniqueId?: string) {
        super(driver);
        this.uniqueId = uniqueId ?? uuidv7();
        driver._addConnection(this);
        this.properties = properties;
        this.client = client;
        this.fetchRecordCount = this.properties[driver_fetch_record_count] as number ?? driver_fetch_record_count_default;
        this.maxStatementRows = this.properties[driver_max_statement_rows] as number ?? driver_max_statement_rows_default;
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    getSessionId(): string | undefined {
        return undefined;
    }

    getProperties(): api.Properties {
        return this.properties;
    }

    async getVersion(): Promise<Version> {
        this._checkConnected();

        if (this.version === undefined) {
            const { rows: svrows } = await this.query("select sqlite_version() as version");

            let major: number | undefined;
            let minor: number | undefined;
            let patch: number | undefined;

            if (svrows.length) {
                const versionParts = (svrows[0].version as string).split(" ")[0].split(".");
                major = parseInt(versionParts[0], 10);
                minor = parseInt(versionParts[1], 10);
                patch = versionParts[2] ? parseInt(versionParts[2], 10) : undefined; // Obsługa opcjonalnego `patch`
            }

            this.version = {
                major: major ?? 0,
                minor: minor ?? 0,
                patch: patch ?? 0, // Domyślnie 0, jeśli `patch` jest nieobecny
                toString: function (): string {
                    return `${this.major}.${this.minor}${this.patch !== undefined ? `.${this.patch}` : ""}`;
                },
            };
        }

        return this.version as Version;
    }

    isConnected(): boolean {
        this.client?.configure
        return this.client !== null;
    }

    _error(code: string, message: string): void {
        const error = new Error(message);
        error["code"] = code;
        throw error;
    }

    _checkConnected(): void {
        if (!this.isConnected()) {
            this._error("[CONNECTION]", "Not connected!");
        }
    }

    private sqlType(sql: string): string {
        const parser = new sqlParser.Parser();
        try {
            const ast = parser.astify(sql, { database: "Sqlite", parseOptions: {} });
            return ast["type"];
        }
        catch (error) {
            return "";
        }
    }

    store(sql: string): Promise<api.StatementResult> {
        this._checkConnected();

        return new Promise((resolve, reject) => {
            const start = Date.now();
            try {
                this.client?.exec(sql, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve({
                            command: this.sqlType(sql),
                            duration: Date.now() - start,
                        });
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    query<R extends api.QueryResultRow = api.QueryResultRow>(sql: string, values?: unknown[]): Promise<api.QueryResult<R>> {
        this._checkConnected();

        return new Promise((resolve, reject) => {
            const start = Date.now();
            this.client!.all(sql, values, (error, rows) => {
                if (error) {
                    reject(error);
                }
                else {
                    const columns: api.ColumnInfo[] = [];
                    if (rows.length) {
                        for (const [key, value] of Object.entries(rows[0] as object)) {
                            columns.push({
                                typeName: "any",
                                name: key,
                                dbDataType: typeof value,
                                dataType: mapSqliteValueToColumnDataType(value),
                            });
                        }
                    }
                    resolve({
                        command: this.sqlType(sql),
                        rows: rows as R[],
                        duration: Date.now() - start,
                        columns: columns,
                        rowCount: rows.length,
                    });
                }
            });
        });
    }

    open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<api.Cursor> {
        this._checkConnected();

        // I've never seen such a terrible driver in my life!!!
        // the following construction must be like this because otherwise sqlite3 does not work
        // especially when it comes to error handling, this is the only way to catch it
        // statement is always returned, even when an error occurs, which unfortunately is triggered "after" in callback
        return new Promise((resolve, reject) => {
            const statement: sqlite3.Statement | undefined = this.client?.prepare(sql, (error: Error,) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!statement) {
                    reject(new Error("Statement is undefined"));
                    return;
                }

                resolve(new Cursor(
                    this,
                    statement,
                    values ?? [],
                    this.sqlType(sql),
                    Date.now(),
                    sql,
                    this.fetchRecordCount,
                    this.maxStatementRows,
                    maxRowsMode,
                ));
            });

        });
    }

    execute(sql: string, values?: unknown[]): Promise<api.CommandResult> {
        this._checkConnected();

        return new Promise((resolve, reject) => {
            const start = Date.now();
            try {
                const prepare = this.client?.prepare(sql, (error: Error) => {
                    if (error) {
                        reject(error);
                    }
                });
                const result = prepare!.run(values, (error: Error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        result.finalize();
                        resolve({
                            command: this.sqlType(sql),
                            duration: Date.now() - start,
                            updateCount: result["changes"],
                        });
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    clone(): Promise<driver.Connection> {
        throw new Error('Method not implemented.');
    }

    async close(): Promise<void> {
        try {
            return await new Promise<void>((resolve, reject) => {
                if (this.isConnected()) {
                    this.client!.close((error) => {
                        this.client = undefined;
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                }
                else {
                    resolve();
                }
            });
        } finally {
            this.client = undefined;
            super.close();
        }
    }

    async cancel(): Promise<void> {
    }
}

export class Driver extends driver.Driver {
    constructor() {
        super(["execute", "open", "query", "store", "version"]);
    }

    getUniqueId(): string {
        return driverUniqueId;
    }

    getSupports(): api.DatabaseSupports {
        return {
            name: "SQLite",
            type: "SQL",
            minVersion: "1.0",
            maxVersion: "3.0",
            objects: ["table", "view", "index", "trigger", "schema", "database"],
            sourceObjects: ["table", "view", "trigger"],
            supports: {
                transactions: true,
                preparedStatements: false,
                cursors: true,
                batchs: false,
                encryption: false,
                pooling: false,
                parameterizedQueries: true,
            },
            parameterPlaceholder: "?",
        }
    }

    getName(): string {
        return "SQLite (3) driver";
    }

    getDescription(): string | undefined {
        return "DBorg driver for SQLite (3) database";
    }

    getIcon(): string | undefined {
        return logo;
    }

    getVersion(): Version {
        return driverVersion;
    }

    getProperties(): api.PropertiesInfo {
        return [
            {
                name: "connection",
                title: "Connection",
                description: "General connection parameters",
                properties: [
                    { name: driver_database_location, title: "Database location", type: "file", required: true, default: driver_database_location_default }
                ]
            },
            {
                name: "open-mode",
                title: "Open mode",
                properties: [
                    { name: "SQLITE_OPEN_READONLY", title: "Read only", type: "boolean", description: "The database is opened in read-only mode. If the database does not already exist, an error is returned." },
                    { name: "SQLITE_OPEN_READWRITE", title: "Read write", type: "boolean", default: "true", description: "The database is opened for reading and writing if possible, or reading only if the file is write protected by the operating system. In either case the database must already exist, otherwise an error is returned. For historical reasons, if opening in read-write mode fails due to OS-level permissions, an attempt is made to open it in read-only mode." },
                    { name: "SQLITE_OPEN_CREATE", title: "Create", type: "boolean", default: "true", description: "The database is opened for reading and writing, and is created if it does not already exist." },
                    { name: "SQLITE_OPEN_FULLMUTEX", title: "Full mutex", type: "boolean", default: "true", description: "The new database connection will use the \"serialized\" threading mode. This means the multiple threads can safely attempt to use the same database connection at the same time. (Mutexes will block any actual concurrency, but in this mode there is no harm in trying.)" },
                    { name: "SQLITE_OPEN_URI", title: "File name interpreted as URI", type: "boolean", description: "The filename can be interpreted as a URI if this flag is set." },
                    { name: "SQLITE_OPEN_SHAREDCACHE", title: "Shared cache", type: "boolean", description: "The database is opened shared cache enabled, overriding the default shared cache setting provided by sqlite3_enable_shared_cache(). The use of shared cache mode is discouraged and hence shared cache capabilities may be omitted from many builds of SQLite. In such cases, this option is a no-op." },
                    { name: "SQLITE_OPEN_PRIVATECACHE", title: "Private cache", type: "boolean", description: "The database is opened shared cache disabled, overriding the default shared cache setting provided by sqlite3_enable_shared_cache()." },
                ]
            },
            {
                name: "driver-settings",
                title: "Driver settings",
                properties: [
                    { name: driver_fetch_record_count, title: "Fetch record count", type: "number", description: `Set the number of records fetch by the cursor, default ${driver_fetch_record_count_default}` },
                    { name: driver_max_statement_rows, title: "Max statement rows", type: "number", description: `Set the number of records retrieved by the cursor at all, default ${driver_max_statement_rows_default}` },
                ]
            }
        ];
    }

    connect(properties: api.Properties, uniqueId?: string): Promise<driver.Connection> {
        const location = properties[driver_database_location] as string ?? driver_database_location_default;

        let mode: number = 0;
        mode |= (properties["SQLITE_OPEN_READONLY"] as boolean ?? false) ? sqlite3.OPEN_READONLY : 0;
        mode |= (properties["SQLITE_OPEN_READWRITE"] as boolean ?? true) ? sqlite3.OPEN_READWRITE : 0;
        mode |= (properties["SQLITE_OPEN_CREATE"] as boolean ?? true) ? sqlite3.OPEN_CREATE : 0;
        mode |= (properties["SQLITE_OPEN_FULLMUTEX"] as boolean ?? true) ? sqlite3.OPEN_FULLMUTEX : 0;
        mode |= (properties["SQLITE_OPEN_URI"] as boolean ?? false) ? sqlite3.OPEN_URI : 0;
        mode |= (properties["SQLITE_OPEN_SHAREDCACHE"] as boolean ?? false) ? sqlite3.OPEN_SHAREDCACHE : 0;
        mode |= (properties["SQLITE_OPEN_PRIVATECACHE"] as boolean ?? false) ? sqlite3.OPEN_PRIVATECACHE : 0;

        const promise = new Promise<driver.Connection>((resolve, reject) => {
            try {
                resolve(new Connection(properties, this, new sqlite3.Database(location, mode), uniqueId));
            }
            catch (error) {
                reject(error);
            }
        });

        return promise;
    }

}

export default new Driver();
