import Version from "../version";
import { DatabasesMetadata } from "./Metadata";

/**
 * (Query) Result column information
 */
export interface ColumnInfo {
    /**
     * Result column name
     */
    name: string,
    /**
     * Space name
     */
    space?: string | number,
    /**
     * Source table name or id
     */
    table?: string | number,
    /**
     * Source field name or id
     */
    field?: string | number,
    /**
     * Column data type, id 
     */
    dataType: string | number,
    /**
     * Column data type logical size
     */
    dataTypeSize?: string | number,
    /**
     * Display data type
     */
    typeName: string,
}

/**
 * Statement result info
 */
export interface StatementResult {
    /**
     * Query command (SELECT, INSERT, UPDATE, DELETE, etc)
     */
    command: string | undefined,
    /**
     * Execution time
     */
    duration?: number,
}

/**
 * Query result info base interface
 */
export interface QueryResultBase extends StatementResult {
    /**
     * Result row count
     */
    rowCount?: number | null | undefined,
    /**
     * Result column info
     */
    columns: ColumnInfo[] | undefined
}

export interface QueryResultRow {
    [column: string]: unknown;
}

/**
 * Query result
 */
export interface QueryResult<R extends QueryResultRow = QueryResultRow> extends QueryResultBase {
    /**
     * Result rows
     */
    rows: R[];
}

/**
 * Command result info
 */
export interface CommandResult extends StatementResult {
    /**
     * Count of Updated, deleted, etc command
     */
    updateCount?: number | null | undefined,
}

/**
 * Property option for select type
 */
export type PropertyTypeSelectOption = {
    /**
     * Option value
     */
    value: string,
    /**
     * Display title/label
     */
    title: string
}

/**
 * Property types
 * @see PropertyTypeSelectOption
 */
export type PropertyType = 'string' | "password" | 'number' | 'boolean' | "file" | "text" | PropertyTypeSelectOption[];

/**
 * Property info for settings, connection, others, for display and schema configuration
 */
export type PropertyInfo = {
    /**
     * Property name
     * @see Properties
     */
    name: string,
    /**
     * Property type
     * @see PropertyType
     */
    type: PropertyType,
    /**
     * Display title/label
     */
    title: string,
    /**
     * Property required (default false)
     */
    required?: boolean,
    /**
     * Extended property description
     */
    description?: string,
    /**
     * Default value for property
     */
    default?: string
}

/**
 * Property group
 */
export type PropertyGroup = {
    /** name needed for various uses, mainly as a key */
    name: string,
    title: string;
    description?: string;
    properties: PropertyInfo[];
}

export type PropertiesInfo = PropertyGroup[];

export type Properties = {
    [key: string]: unknown;
}

export type ConnectionImplementsMethod = 
    "store" 
    | "query" 
    | "open" 
    | "execute" 
    | "clone" 
    | "version" 
    | "metadata"
    | "cancel";
export type ConnectionImplementsMethods = ConnectionImplementsMethod[];

export interface CursorInfo {
    uniqueId: string;
    connectionId: string;
    columns: ColumnInfo[] | undefined;
    command: string | undefined;
    sql: string;
    parameters: unknown[] | undefined;
    duration?: number | undefined;
    fetchedRows?: number | undefined;
    sessionId?: string | undefined;
}

export interface BaseCursor {
    /**
     * Unique id of the connection cursor
     */
    getUniqueId(): string;

    /**
     * Cursor info
     */
    getCursorInfo(): Promise<CursorInfo>;

    /**
     * Fetch data from cursor
     */
    fetch(fetchCount?: number): Promise<QueryResultRow[]>;

    /**
     * Returns true if curosr is opened (not closed/destroyed)
     */
    isEnd(): boolean;

    /**
     * Close cursor
     */
    close(): Promise<void>;

    /**
     * Cancel cursor
     */
    cancel(): Promise<void>;

}

/**
 * Opened fetch cursor for main and renderer
 */
export interface Cursor extends BaseCursor {
    /**
     * Cursor connection
     */
    getConnection(): Connection;

    getSessionId(): string | undefined;
}

export interface ConnectionInfo {
    uniqueId: string;
    driver: DriverInfo;
    properties: Properties;
    connected: boolean;
    userData: Record<string, unknown>;
    version?: string;
    cursors: string[];
    sessionId?: string;
}

export interface BaseConnection {

    /**
     * Connection info
     */
    getConnectionInfo(): Promise<ConnectionInfo>;

    /**
     * Get value of user data property
     */
    getUserData(property: string): unknown;

    /**
     * Set user data property value
     */
    setUserData(property: string, value: unknown): void;

    /**
     * Unique id for connection, new for new connection
     */
    getUniqueId(): string;

    /**
     * Connection properties
     */
    getProperties(): Properties;

    /**
     * Return true if connected
     */
    isConnected(): boolean;

    /**
     * Execute ddl command
     * 
     * @param sql database onbject code
     */
    store(sql: string): Promise<StatementResult>;

    /**
     * Execute query and return rows
     * @param sql query or prepared name to execute
     * @param values parameter values
     * @returns all data
     */
    query<R extends QueryResultRow = QueryResultRow>(sql: string, values?: unknown[]): Promise<QueryResult<R>>;

    /**
     * Prepare query for next execute or query
     * @param name prepared query name
     * @param sql query to execute
     */
    //prepare(name: string, sql: string): Promise<void>;

    /**
     * Execute dml command
     * @param sql sql code to execute
     * @param values parameter values
     */
    execute(sql: string, values?: unknown[]): Promise<CommandResult>;

    /**
     * Close connection
     * 
     * call super.close() for remove connection from global list
     */
    close(): Promise<void>;

    /**
     * Cancel query or command
     */
    cancel(): Promise<void>;

    getMetadata(progress?: (current: string) => void, force?: boolean): Promise<DatabasesMetadata>;

    updateObject(progress?: (current: string) => void, schemaName?: string, objectName?: string): Promise<void>;

}

export type CursorFetchMaxRowsMode =
    /**
     * Fetch all rows
     */
    "all" |
    /**
     * Fetch max rows setted by property (if exists in driver) - default
     */
    "set" |
    /**
     * Fetch max rows
     */
    number;

/**
 * Established connection for main and renderer
 */
export interface Connection extends BaseConnection {

    /**
     * Get the session ID for the connection
     * If the database does not support sessions, this will return undefined
     * If you use pooling, this will return undefined, only cursor can have session id (see open and cancel method)
     */
    getSessionId(): string | undefined;

    /**
     * Open cursor for fetching partial data
     * 
     * @param sql query or prepared name to open
     * @param values
     * @returns opened cursor
     */
    open(sql: string, values?: unknown[], maxRowsMode?: CursorFetchMaxRowsMode): Promise<Cursor>;

    /**
     * Clone connection, establish a new connection to database
     */
    clone(): Promise<Connection>;

    /**
     * Version of connected database
     */
    getVersion(): Promise<Version>;

    /**
     * Connection driver
     */
    getDriver(): Driver;


    getCursors(): Cursor[];
}

export type DatabaseName = "PostgreSQL" | "MySQL" | "SQLite" | "Oracle" | "MSSQL" | "ClickHouse" | "MongoDB" | "Redis" | "Cassandra" | "Elasticsearch" | "InfluxDB" | "TimescaleDB" | "MariaDB";
export type DatabaseType = "SQL" | "NoSQL" | "GraphQL" | "TimeSeries" | "Document" | "KeyValue" | "Columnar" | "Search" | "Cache";
export type DatabaseObjectType =
    "table" | "view" | "index" | "trigger" | "function" | "procedure" | "schema" | "database" |
    "user" | "role" | "group" | "partition" | "materialized_view" | "sequence" | "synonym" |
    "type" | "domain" | "foreign_key" | "primary_key" | "unique_key" | "check_constraint" |
    "default_constraint" | "rule" | "policy" | "event_trigger" | "materialized_view_log" | "table_partition";
export type DatabaseObjectTypes = DatabaseObjectType[];

export interface DatabaseSupports {
    /**
     * Database name
     */
    name: DatabaseName;
    /**
     * Database type
     */
    type: DatabaseType;
    /**
     * Database version range
     */
    minVersion: string;
    maxVersion: string;
    /**
     * Database object types supported by this driver.
     * This is a driver supports objects, not plugin supports.
     * It means that driver can get information about this objects and return in meta data
     * and plugin can use this information to show in UI or other purposes. 
     */
    objects: DatabaseObjectTypes;
    /**
     * Database objects that driver generate source code for.
     * This is a driver supports objects, not plugin supports.
     */
    sourceObjects: DatabaseObjectTypes;
    supports: {
        /**
         * Transactions supported by this driver
         */
        transactions: boolean;
        /**
         * Prepared statements supported by this driver
         */
        preparedStatements: boolean;
        /**
         * Cursors supported by this driver
         */
        cursors: boolean;
        /**
         * Batch operations supported by this driver
         */
        batchs: boolean;
        /**
         * Connection encryption supported by this driver
         */
        encryption: boolean;
        /**
         * Connection pooling supported by this driver
         */
        pooling: boolean;
        /**
         * Indicates if parameterized queries are supported by this driver
         */
        parameterizedQueries: boolean;
    };
    /**
     * Regexp placeholder pattern for parameterized queries
     * @example $1, $2, $3, etc for PostgreSQL
     * @example ? for SQLite, MySQL, MSSQL, etc
     * @example :param1, :param2, :param3, etc for Oracle
     * @example @param1, @param2, @param3, etc for SQL Server
     * @example $param1, $param2, $param3, etc for ClickHouse
     */
    parameterPlaceholder: string;
}

/**
 * Driver info, structure for exchanging information between main and renderer
 */
export interface DriverInfo {
    uniqueId: string;
    supports: DatabaseSupports;
    name: string;
    description?: string;
    icon?: string;
    version: Version;
    properties: PropertiesInfo;
    implements: ConnectionImplementsMethods;
    passwordProperty?: string;
}

/**
 * Base interface to implement database driver for dborg main and renderer
 */
export interface Driver {

    getImplementsMethods(): ConnectionImplementsMethods;

    /**
     * Get driver info
     * @returns driver info
     */
    getDriverInfo(): DriverInfo;

    /**
     * Get database supports info
     * @returns {DatabaseSupports} database supports info
     */
    getSupports(): DatabaseSupports;

    /**
     * Get connection list
     * @returns array connection of this driver
     */
    getConnections(): Connection[];

    /**
     * Unique driver id, static (for reference to other settings)
     */
    getUniqueId(): string;

    /**
     * Driver name, eg PostgreSQL, ClickHouse, Oracle, etc
     */
    getName(): string;

    /**
     * Driver description
     */
    getDescription(): string | undefined;

    /**
     * Path to the icon (on browser side)
     */
    getIcon(): string | undefined;

    /**
     * Driver version
     */
    getVersion(): Version;

    /**
     * Returns (display) property info, for schema connection configuration
     */
    getProperties(): PropertiesInfo;

    /**
     * Establish a connection to database
     * 
     * @param properties connection and configuration properties
     */
    connect(properties: Properties): Promise<Connection>;

    /**
     * CLose all connections and remove Driver from global list
     */
    destroy(): void;
}
