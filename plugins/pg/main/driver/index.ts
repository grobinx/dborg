import * as api from '../../../../src/api/db';
import Version from '../../../../src/api/version';
import * as driver from '../../../../src/main/api/db';
import { uuidv7 } from "uuidv7";
import pg from 'pg';
import PgCursor from 'pg-cursor';
import logo from '../../resources/postgresql-logo.svg';
import { DRIVER_UNIQUE_ID } from '../../common/consts';
import { MetadataCollector } from './MetadataService';

const driverVersion: Version = {
    major: 1,
    minor: 0,
    release: 0,
    build: 1,

    toString: function () {
        return `${this.major}.${this.minor}.${this.release}.${this.build}`;
    }
}

const driver_extend_info = "driver:extend_info";
const driver_extend_info_default = false;

const driver_pool = "driver:pool";
const driver_pool_default = false;

const driver_fetch_record_count = "driver:fetch_record_count";
const driver_fetch_record_count_default = 100;

const driver_max_statement_rows = "driver:max_statement_rows";
const driver_max_statement_rows_default = 1000;

const application_name_default = "ORBADA for PostgreSQL";

// Only array types from the original enum are included below
export enum pgTypes {
    BIT_ARRAY = 1561,
    BOOL_ARRAY = 1000,
    BPCHAR_ARRAY = 1014,
    BYTEA_ARRAY = 1001,
    CHAR_ARRAY = 1002,
    DATE_ARRAY = 1182,
    FLOAT4_ARRAY = 1021,
    FLOAT8_ARRAY = 1022,
    INT2_ARRAY = 1005,
    INT4_ARRAY = 1007,
    INT8_ARRAY = 1016,
    INTERVAL_ARRAY = 1187,
    JSON_ARRAY = 199,
    JSONB_ARRAY = 3807,
    MONEY_ARRAY = 791,
    NAME_ARRAY = 1003,
    NUMERIC_ARRAY = 1231,
    OID_ARRAY = 1028,
    POINT_ARRAY = 1017,
    REF_CURSOR_ARRAY = 2201,
    TEXT_ARRAY = 1009,
    TIME_ARRAY = 1183,
    TIMESTAMP_ARRAY = 1115,
    TIMESTAMPTZ_ARRAY = 1185,
    TIMETZ_ARRAY = 1270,
    VARBIT_ARRAY = 1563,
    VARCHAR_ARRAY = 1015,
    XML_ARRAY = 143,
    ANY_ARRAY = 2277,
}

pg.types.setTypeParser(pg.types.builtins.INT8, function (val) {
    return val;
});
pg.types.setTypeParser(pg.types.builtins.NUMERIC, function (val) {
    return val;
});
pg.types.setTypeParser(pg.types.builtins.MONEY, function (val) {
    return val;
});
pg.types.setTypeParser(pgTypes.NUMERIC_ARRAY, function (val) {
    return val.replace(/^\{|\}$/g, '').split(',').map(item => item.trim());
});
pg.types.setTypeParser(pgTypes.INT8_ARRAY, function (val) {
    return val.replace(/^\{|\}$/g, '').split(',').map(item => item.trim());
});
pg.types.setTypeParser(pgTypes.MONEY_ARRAY, function (val) {
    return val.replace(/^\{|\}$/g, '').split(',').map(item => item.trim());
});

/**
 * Mapuje typy PostgreSQL (OID) na typy obsługiwane przez aplikację.
 */
export function mapPostgresTypeToColumnDataType(pgType: number): api.ColumnDataType {
    switch (pgType) {
        case pg.types.builtins.BOOL:
            return 'boolean';
        case pg.types.builtins.INT2:
        case pg.types.builtins.INT4:
            return 'int';
        case pg.types.builtins.OID:
        case pg.types.builtins.INT8:
            return 'bigint';
        case pg.types.builtins.FLOAT4:
        case pg.types.builtins.FLOAT8:
        case pg.types.builtins.MONEY:
            return 'number';
        case pg.types.builtins.NUMERIC:
            return 'decimal';
        case pg.types.builtins.DATE:
            return 'date';
        case pg.types.builtins.TIME:
            return 'time';
        case pg.types.builtins.TIMESTAMP:
        case pg.types.builtins.TIMESTAMPTZ:
        case pg.types.builtins.TIMETZ:
        case pg.types.builtins.ABSTIME:
        case pg.types.builtins.RELTIME:
            return 'datetime';
        case pg.types.builtins.TINTERVAL:
        case pg.types.builtins.INTERVAL:
            return 'duration';
        case pg.types.builtins.JSON:
        case pg.types.builtins.JSONB:
            return 'json';
        case pg.types.builtins.XML:
            return 'xml';
        case pg.types.builtins.BYTEA:
            return 'binary';
        case pg.types.builtins.UUID:
            return 'uuid';
        case pg.types.builtins.PATH:
            return 'file';
        case pg.types.builtins.MACADDR:
        case pg.types.builtins.MACADDR8:
            return 'mac';
        case pg.types.builtins.POLYGON:
            return 'geometry';
        case pg.types.builtins.TEXT:
        case pg.types.builtins.BPCHAR:
        case pg.types.builtins.VARCHAR:
        case pg.types.builtins.CHAR:
        case pg.types.builtins.REGPROC:
        case pg.types.builtins.REGPROCEDURE:
        case pg.types.builtins.REGOPER:
        case pg.types.builtins.REGOPERATOR:
        case pg.types.builtins.REGCLASS:
        case pg.types.builtins.REGTYPE:
        case pg.types.builtins.PG_NODE_TREE:
        case pg.types.builtins.SMGR:
        case pg.types.builtins.CIDR:
        case pg.types.builtins.INET:
        case pg.types.builtins.ACLITEM:
        case pg.types.builtins.PG_LSN:
        case pg.types.builtins.TSVECTOR:
        case pg.types.builtins.TSQUERY:
        case pg.types.builtins.GTSVECTOR:
        case pg.types.builtins.REGCONFIG:
        case pg.types.builtins.REGDICTIONARY:
        case pg.types.builtins.REGROLE:
        case pg.types.builtins.PG_NDISTINCT:
        case pg.types.builtins.PG_DEPENDENCIES:
            return 'string';
        case pg.types.builtins.BIT:
        case pg.types.builtins.VARBIT:
            return 'string';
        case pgTypes.BOOL_ARRAY:
            return ['boolean'];
        case pgTypes.BPCHAR_ARRAY:
        case pgTypes.CHAR_ARRAY:
        case pgTypes.NAME_ARRAY:
        case pgTypes.TEXT_ARRAY:
        case pgTypes.VARCHAR_ARRAY:
            return ['string'];
        case pgTypes.BYTEA_ARRAY:
            return ['binary'];
        case pgTypes.DATE_ARRAY:
            return ['date'];
        case pgTypes.FLOAT4_ARRAY:
        case pgTypes.FLOAT8_ARRAY:
        case pgTypes.MONEY_ARRAY:
            return ['number'];
        case pgTypes.INT2_ARRAY:
        case pgTypes.INT4_ARRAY:
            return ['int'];
        case pgTypes.INT8_ARRAY:
        case pgTypes.OID_ARRAY:
            return ['bigint'];
        case pgTypes.INTERVAL_ARRAY:
            return ['duration'];
        case pgTypes.JSON_ARRAY:
        case pgTypes.JSONB_ARRAY:
            return ['json'];
        case pgTypes.NUMERIC_ARRAY:
            return ['decimal'];
        case pgTypes.POINT_ARRAY:
            return ['geometry'];
        case pgTypes.REF_CURSOR_ARRAY:
            return ['string'];
        case pgTypes.TIME_ARRAY:
            return ['time'];
        case pgTypes.TIMESTAMP_ARRAY:
        case pgTypes.TIMESTAMPTZ_ARRAY:
        case pgTypes.TIMETZ_ARRAY:
            return ['datetime'];
        case pgTypes.VARBIT_ARRAY:
        case pgTypes.BIT_ARRAY:
            return ['string'];
        case pgTypes.XML_ARRAY:
            return ['xml'];
        case pgTypes.ANY_ARRAY:
            return ['string'];
    }
    return 'string';
}

export class Cursor extends driver.Cursor {
    private uniqueId: string;
    private fetchRecordCount: number;
    private maxStatementRows: number;
    private maxRowsMode?: api.CursorFetchMaxRowsMode;
    private cursor?: PgCursor;
    private firstFetch: boolean = false;
    private pid: string | undefined;

    rowCount?: number | null | undefined;
    columns: api.ColumnInfo[] | undefined;
    sql: string;
    parameters: unknown[] | undefined;
    command: string | undefined;
    duration?: number | undefined;
    stop?: boolean | undefined;

    constructor(connection: Connection, cursor: PgCursor,
        columns: api.ColumnInfo[] | undefined, command: string | undefined, duration: number | undefined,
        sql: string, parameters: unknown[] | undefined,
        fetchRecordCount: number, maxStatementRows: number, maxRowsMode?: api.CursorFetchMaxRowsMode,
        pid?: string
    ) {
        super(connection);
        this.uniqueId = uuidv7();
        connection._addCursor(this);
        this.cursor = cursor;
        this.columns = columns;
        this.command = command;
        this.duration = duration;
        this.sql = sql;
        this.parameters = parameters;
        this.fetchRecordCount = fetchRecordCount;
        this.maxStatementRows = maxStatementRows;
        this.maxRowsMode = maxRowsMode;
        this.stop = false;
        this.pid = pid;
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    getSessionId(): string | undefined {
        return this.pid;
    }

    async getCursorInfo(): Promise<api.CursorInfo> {
        return {
            uniqueId: this.getUniqueId(),
            connectionId: this.connection.getUniqueId(),
            columns: this.columns,
            command: this.command,
            duration: this.duration,
            fetchedRows: this.rowCount ?? undefined,
            sql: this.sql,
            parameters: this.parameters,
            sessionId: this.pid,
        }
    };

    getConnection(): driver.Connection {
        return this.connection;
    }

    private checkEnded(): void {
        if (this.isEnd()) {
            if (this.cursor?.["state"] === "error") {
                throw this.cursor["_error"];
            }
            (this.connection as Connection)._error("[CURSOR]", "End of data set reached or cursor unexpectedly closed!");
        }
    }

    async fillCursorInfo(): Promise<void> { // Fixed typo in method name
        this.columns = (this.connection as Connection)._fieldsToColumns(this.cursor!["_result"].fields);
        this.command = this.cursor!["_result"].command;
    }

    async fetch(fetchCount?: number): Promise<api.QueryResultRow[]> {
        this.checkEnded();

        const rows: api.QueryResultRow[] = await this.cursor!.read(fetchCount ?? this.fetchRecordCount);
        this.rowCount = (this.rowCount ?? 0) + rows.length;

        if (((this.maxRowsMode ?? "set") === "set" && this.rowCount >= this.maxStatementRows) ||
            (typeof this.maxRowsMode === "number" && this.rowCount >= this.maxRowsMode)) {
            this.stop = true;
        }

        if (!this.firstFetch) {
            this.duration = Date.now() - (this.duration ?? 0);
            await this.fillCursorInfo();
            this.firstFetch = true;
        }
        return rows;
    }

    isEnd(): boolean {
        return this.stop || (this.cursor ? ["done", "error"].includes(this.cursor["state"]) : false); // && !this.stream.destroyed;
    }

    async close(): Promise<void> {
        if (this.cursor) {
            try {
                return await this.cursor.close();
            }
            catch (error) {
                throw error;
            }
            finally {
                this.connection._removeCursor(this.getUniqueId());
                this.cursor = undefined;
            }
        }
    }

    async cancel(): Promise<void> {
        if (this.cursor && this.pid) {
            const client = new pg.Client(this.connection.getProperties());
            try {
                await client.connect();
                await client.query("SELECT pg_cancel_backend($1)", [this.pid]);
            }
            catch (error) {
                throw error;
            }
            finally {
                await client.end();
            }
        }
    }

}

export class Connection extends driver.Connection {
    private uniqueId: string;
    private properties: api.Properties;
    private client?: pg.Client | pg.Pool;
    private version: Version<"major" | "minor" | "patch" | "toString"> | undefined;
    private pool: boolean;
    private fetchRecordCount: number;
    private maxStatementRows: number;
    private metadata: MetadataCollector;
    private metadataPromise: Promise<api.DatabasesMetadata> | null = null;
    private pid: string | undefined;

    constructor(properties: api.Properties, driver: Driver, client: pg.Client | pg.Pool, uniqueId?: string, pid?: string) {
        super(driver);
        this.uniqueId = uniqueId ?? uuidv7();
        this.pid = pid;
        driver._addConnection(this);
        this.properties = Object.assign({}, properties);
        this.client = client;
        this.pool = client instanceof pg.Pool;
        this.fetchRecordCount = this.properties[driver_fetch_record_count] as number ?? driver_fetch_record_count_default;
        this.maxStatementRows = this.properties[driver_max_statement_rows] as number ?? driver_max_statement_rows_default;
        this.metadata = new MetadataCollector();
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    getSessionId(): string | undefined {
        return this.pid;
    }

    getDriver(): driver.Driver {
        return this.driver;
    }

    getProperties(): api.Properties {
        return this.properties;
    }

    isConnected(): boolean {
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

    async getVersion(): Promise<Version> {
        this._checkConnected();

        if (this.version === undefined) {
            const { rows: svrows } = await this.query("show server_version");

            let major: number | undefined;
            let minor: number | undefined;
            let patch: number | undefined;

            if (svrows.length) {
                const versionParts = (svrows[0].server_version as string).split(" ")[0].split(".");
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

    async store(sql: string): Promise<api.StatementResult> {
        this._checkConnected();

        const start = Date.now()
        const qResult = await this.client!.query(sql);
        const duration = Date.now() - start;

        return {
            command: qResult.command,
            duration: duration,
        };
    }

    _fieldsToColumns(fields: pg.FieldDef[]): api.ColumnInfo[] {
        function getEnumKeyByValue<T extends Record<string, unknown>>(enumObj: T, value: number): string | undefined {
            return Object.keys(enumObj).find(key => enumObj[key as keyof T] === value);
        }

        const columns: api.ColumnInfo[] = [];
        for (const c of fields) {
            columns.push({
                name: c.name,
                dbDataType: c.dataTypeID,
                typeName: getEnumKeyByValue(pg.types.builtins, c.dataTypeID) ?? getEnumKeyByValue(pgTypes, c.dataTypeID) ?? c.format,
                dataTypeSize: c.dataTypeSize,
                field: c.columnID,
                table: c.tableID,
                dataType: mapPostgresTypeToColumnDataType(c.dataTypeID),
            });
        }
        return columns;
    }

    async query<R extends api.QueryResultRow = api.QueryResultRow>(sql: string, values?: unknown[]): Promise<api.QueryResult<R>> {
        this._checkConnected();

        const start = Date.now()
        const qResult = await this.client!.query(sql, values);
        const duration = Date.now() - start;

        const columns = this._fieldsToColumns(qResult.fields);

        return {
            command: qResult.command,
            duration: duration,
            columns: columns,
            rowCount: qResult.rowCount,
            rows: qResult.rows
        };
    }

    async open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<api.Cursor> {
        this._checkConnected();

        let pid: string | undefined;
        const start = Date.now();
        let cursor = new PgCursor(sql, values);
        if (this.pool) {
            const client = await (this.client as pg.Pool)!.connect();

            try {
                const { rows } = await client!.query("select pg_backend_pid() as pid");
                if (rows.length) {
                    pid = rows[0].pid;
                }
            }
            catch (error) {
            }

            cursor = client!.query(cursor);
            cursor.once("error", (_error) => {
                client.release();
            });
            cursor.once("end", () => {
                client.release();
            });
            cursor.once("close", () => {
                client.release();
            });
        }
        else {
            cursor = this.client!.query(cursor);
        }
        const duration = Date.now();

        return new Cursor(
            this,
            cursor,
            undefined,
            undefined,
            duration,
            sql,
            values,
            this.fetchRecordCount,
            this.maxStatementRows,
            maxRowsMode,
            pid ?? this.pid
        );
    }

    async execute(sql: string, values?: unknown[]): Promise<api.CommandResult> {
        this._checkConnected();

        const start = Date.now()
        const qResult = await this.client!.query(sql, values);
        const duration = Date.now() - start;

        const result: api.CommandResult = {
            command: qResult.command,
            duration: duration,
            updateCount: qResult.rowCount,
        };

        // if query result retunrs rows put it into result on command result
        if (qResult.rows && qResult.rows.length > 0) {
            result.rows = qResult.rows;
            result.columns = this._fieldsToColumns(qResult.fields);
        }

        return result;
    }

    clone(): Promise<driver.Connection> {
        return this.driver.connect(this.properties);
    }

    async close(): Promise<void> {
        if (this.isConnected()) {
            try {
                return await this.client!.end();
            }
            finally {
                this.client = undefined;
                super.close();
            }
        }
    }

    async cancel(): Promise<void> {
        if (this.pid) {
            const client = new pg.Client(this.properties);
            try {
                await client.connect();
                await client.query("SELECT pg_cancel_backend($1)", [this.pid]);
            }
            catch (error) {
                throw error;
            }
            finally {
                await client.end();
            }
        }
    }

    async getMetadata(progress?: (current: string) => void, force?: boolean): Promise<api.DatabasesMetadata> {
        if (!this.metadataPromise || force) {
            const client = new pg.Client(this.properties);

            // Tworzymy nową obietnicę tylko wtedy, gdy nie ma aktywnej lub wymuszono `force`
            this.metadataPromise = (async () => {
                try {
                    this.metadata.setVersion(await this.getVersion());
                    await client.connect();
                    this.metadata.setClient(client);
                    return await this.metadata.getMetadata(progress, force);
                } finally {
                    await client.end();
                    // Resetujemy obietnicę po zakończeniu operacji
                    if (!force) {
                        this.metadataPromise = null;
                    }
                }
            })();
        }

        // Zwracamy istniejącą obietnicę
        return this.metadataPromise;
    }

    async updateObject(progress?: (current: string) => void, schemaName?: string, objectName?: string): Promise<void> {
        const client = new pg.Client(this.properties);
        try {
            await client.connect();
            this.metadata.setClient(client);
            return await this.metadata.updateObject(progress, schemaName, objectName);
        }
        finally {
            await client.end();
        }
    }

}

export class Driver extends driver.Driver {

    constructor() {
        super(["execute", "open", "query", "store", "version", "metadata", "cancel"]);
    }

    getUniqueId(): string {
        return DRIVER_UNIQUE_ID;
    }

    getSupports(): api.DatabaseSupports {
        return {
            name: "PostgreSQL",
            type: "SQL",
            minVersion: "10",
            maxVersion: "17",
            objects: ["table", "view", "index", "schema", "function", "procedure", "trigger", "sequence", "materialized_view", "database", "type"],
            sourceObjects: [],
            supports: {
                transactions: true,
                preparedStatements: false,
                cursors: true,
                batchs: true,
                encryption: false,
                pooling: true,
                parameterizedQueries: true,
            },
            parameterPlaceholder: "$1",
        }
    }

    getName(): string {
        return "PostgreSQL driver";
    }

    getDescription(): string | undefined {
        return "ORBADA driver for PostgreSQL database";
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
                    { name: "host", title: "Host", type: "string" },
                    { name: "port", title: "Port", type: "number", default: "5432" },
                    { name: "database", title: "Database", type: "string" },
                    { name: "user", title: "User", type: "string" },
                    { name: "password", title: "Password", type: "password" },
                    { name: "connectionString", title: "Connection string", type: "string", description: "eg postgresql://dbuser:secretpassword@database.server.com:3211/mydb" },
                ]
            },
            {
                name: "pool",
                title: "Pool",
                description: "Enable connection pooling. Set specific properties.",
                properties: [
                    { name: "driver:pool", title: "Pool connections", type: "boolean", description: "Turn on connection pooling", flags: ["pool"] },
                    { name: "connectionTimeoutMillis", title: "Connection timeout (ms)", type: "number", description: "Number of milliseconds to wait before timing out when connecting a new client by default this is 0 which means no timeout" },
                    { name: "idleTimeoutMillis", title: "Idle timout (ms)", type: "number", description: "Number of milliseconds a client must sit idle in the pool and not be checked out before it is disconnected from the backend and discarded default is 10000 (10 seconds) - set to 0 to disable auto-disconnection of idle clients" },
                    { name: "max", title: "Max connections", type: "number", description: "Maximum number of clients the pool should contain by default this is set to 10." },
                    { name: "allowExitOnIdle", title: "Allow exit on idle", type: "boolean", description: "Setting 'allowExitOnIdle: true' in the config will allow the node event loop to exit as soon as all clients in the pool are idle, even if their socket is still open to the postgres server.  This can be handy in scripts & tests where you don't want to wait for your clients to go idle before your process exits" },
                ]
            },
            {
                name: "timeouts",
                title: "Timeouts",
                properties: [
                    { name: "connectionTimeoutMillis", title: "Connection timeout (ms)", type: "number", description: "Number of milliseconds to wait for connection, default is no timeout" },
                    { name: "lock_timeout", title: "Lock timeout", type: "number", description: "Number of milliseconds a query is allowed to be en lock state before it's cancelled due to lock timeout" },
                    { name: "query_timeout", title: "Query timout", type: "number", description: "Number of milliseconds before a query call will timeout, default is no timeout" },
                    { name: "statement_timeout", title: "Statement timeout", type: "number", description: "Number of milliseconds before a statement in query will time out, default is no timeout" },
                    { name: "idle_in_transaction_session_timeout", title: "Idle in transaction timout", type: "number", description: "Number of milliseconds before terminating any session with an open idle transaction, default is no timeout" },
                ]
            },
            {
                name: "other",
                title: "Other settings",
                properties: [
                    { name: "application_name", title: "Application name", type: "string" },
                    { name: "keepAlive", title: "Keep alive", type: "boolean" },
                    { name: "keepAliveInitialDelayMillis", title: "Keep alive initial delay (ms)", type: "number" },
                ]
            },
            {
                name: "driver-settings",
                title: "Driver settings",
                properties: [
                    { name: driver_fetch_record_count, title: "Fetch record count", type: "number", description: `Set the number of records fetch by the cursor at once, default ${driver_fetch_record_count_default}` },
                    { name: driver_max_statement_rows, title: "Max statement rows", type: "number", description: `Set the number of records retrieved by the cursor at all, default ${driver_max_statement_rows_default}`, flags: ["max-fetch-size"] },
                ]
            }
        ];
    }

    async connect(properties: api.Properties, uniqueId?: string): Promise<Connection> {
        const config: pg.PoolConfig = {
            application_name: properties?.application_name as string ?? application_name_default,
            connectionString: properties?.connectionString as string,
            connectionTimeoutMillis: properties?.connectionTimeoutMillis as number,
            database: properties?.database as string,
            host: properties?.host as string,
            idle_in_transaction_session_timeout: properties?.idle_in_transaction_session_timeout as number,
            keepAlive: properties?.keepAlive as boolean,
            keepAliveInitialDelayMillis: properties?.keepAliveInitialDelayMillis as number,
            lock_timeout: properties?.lock_timeout as number,
            options: properties?.options as string,
            password: properties?.password as string,
            port: properties?.port as number,
            query_timeout: properties?.query_timeout as number,
            // TODO ssl
            statement_timeout: properties?.statement_timeout as number,
            // TODO stream
            // TODO types
            user: properties?.user as string,

            // Pool settings
            allowExitOnIdle: properties?.allowExitOnIdle as boolean,
            idleTimeoutMillis: properties?.idleTimeoutMillis as number,
            max: properties?.max as number,
        };
        const pool: boolean = properties[driver_pool] as boolean ?? driver_pool_default;

        if (pool) {
            const client = new pg.Pool(config);
            //await client.connect();
            return new Connection(properties, this, client);
        }
        const client = new pg.Client(config);
        await client.connect();

        let pid: string | undefined;
        try {
            const { rows } = await client.query("select pg_backend_pid() as pid");
            if (rows.length) {
                pid = rows[0].pid;
            }
        }
        catch (error) {
        }
        return new Connection(properties, this, client, uniqueId, pid);
    }
}

export default new Driver();
