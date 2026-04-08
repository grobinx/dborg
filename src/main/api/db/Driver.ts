import * as api from "../../../api/db";
import Version from "../../../api/version";

export abstract class Cursor implements api.Cursor {
    protected connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }
    
    getConnection(): api.Connection {
        return this.connection;
    }

    abstract getCursorId(): string;

    abstract getSessionId(): string | undefined;

    abstract getCursorInfo(): Promise<api.CursorInfo>;

    abstract fetch(fetchCount?: number): Promise<api.QueryResultRow[]>;

    abstract isEnd(): boolean;

    close(): Promise<void> {
        return new Promise(resolve => {
            this.connection._removeCursor(this.getCursorId());
            resolve();
        });
    }

    abstract cancel(): Promise<void>;
}

/**
 * Established connection for main
 */
export abstract class Connection implements api.Connection {

    protected driver: Driver;
    protected userData: Record<string, unknown> = {};
    protected cursors: {
        [uniqueId: string]: api.Cursor
    } = {}


    /**
     * call super() for add connection to global list
     * @param driver 
     */
    constructor(driver: Driver) {
        this.driver = driver;
        //driver._addConnection(this);
    }

    abstract getConnectionId(): string;

    abstract getSessionId(): string | undefined;

    async getConnectionInfo(): Promise<api.ConnectionInfo> {
        return {
            connectionId: this.getConnectionId(),
            driver: this.getDriver().getDriverInfo(),
            properties: this.getProperties(),
            connected: this.isConnected(),
            userData: this.userData,
            version:
                this.getDriver().getImplementsMethods().includes("version") ?
                    (await this.getVersion()).toString()
                    : undefined,
            cursors: Object.keys(this.cursors),
            sessionId: this.getSessionId(),
            context: await this.getContext(),
        };
    }

    /**
     * do not call this function yourself
     * developer, call this function when you create a new cursor, in constructor, after set uniqueId
     * @param connection 
     */
    _addCursor(cursor: api.Cursor): void {
        this.cursors[cursor.getCursorId()] = cursor;
    }

    /**
     * do not call this function yourself
     * @param uniqueId 
     * @returns 
     */
    _removeCursor(uniqueId: string): api.Cursor | undefined {
        const cursor = this.cursors[uniqueId];
        delete this.cursors[uniqueId];
        return cursor;
    }

    getUserData(property: string): unknown {
        return this.userData[property];
    }

    setUserData(property: string, value: unknown): void {
        this.userData[property] = value;
    }

    getDriver(): Driver {
        return this.driver;
    }

    getCursorList(): api.Cursor[] {
        return [...Object.values<api.Cursor>(this.cursors)];
    }

    abstract getProperties(): api.Properties;

    abstract getVersion(): Promise<Version>;

    abstract getContext(reload?: boolean): Promise<api.SessionContext | undefined>;

    abstract isConnected(): boolean;

    abstract store(sql: string): Promise<api.StatementResult>;

    abstract query<R extends api.QueryResultRow = api.QueryResultRow>(sql: string, values?: unknown[]): Promise<api.QueryResult<R>>;

    abstract open(sql: string, values?: unknown[], maxRowsMode?: api.CursorFetchMaxRowsMode): Promise<api.Cursor>;

    abstract execute(sql: string, values?: unknown[]): Promise<api.CommandResult>;

    abstract clone(): Promise<Connection>;

    abstract cancel(): Promise<void>;

    close(): Promise<void> {
        this.cursors = {};
        this.getDriver()._removeConnection(this.getConnectionId());
        return new Promise(resolve => resolve());
    }

    static getCursor(connectionId: string, uniqueId: string): api.Cursor | undefined {
        return Driver.getConnection(connectionId)?.cursors[uniqueId];
    }

    async getMetadata(_progress?: (current: string) => void, _force?: boolean): Promise<api.DatabasesMetadata> {
        return {};
    }

    async updateObject(_progress?: (current: string) => void, _schemaName?: string, _objectName?: string): Promise<void> {
        return;
    }
}

/**
 * Base class to implement database driver for dborg for main
 */
export abstract class Driver implements api.Driver {

    private static drivers: {
        [uniqueId: string]: Driver
    } = {};

    protected connections: {
        [uniqueId: string]: Connection
    } = {}

    protected implementsMethods: api.ConnectionImplementsMethods;

    /**
     * Get driver by uniqueId
     * 
     * @param uniqueId
     * @returns undefined if not found
     */
    static getDriver(uniqueId: string): Driver | undefined {
        return Driver.drivers[uniqueId];
    }

    /**
     * Get Driver list
     * 
     * @returns array of drivers
     */
    static getDriverList(): Driver[] {
        return [...Object.values<Driver>(Driver.drivers)];
    }

    constructor(implementsMethods: api.ConnectionImplementsMethods) {
        Driver.drivers[this.getDriverId()] = this;
        this.implementsMethods = implementsMethods;
    }

    getImplementsMethods(): api.ConnectionImplementsMethods {
        return this.implementsMethods;
    }

    getDriverInfo(): api.DriverInfo {
        const { major, minor, release, build } = this.getVersion();
        const properties = this.getProperties();
        return {
            driverId: this.getDriverId(),
            name: this.getName(),
            supports: this.getSupports(),
            description: this.getDescription(),
            icon: this.getIcon(),
            version: { major, minor, release, build },
            properties: properties,
            implements: this.getImplementsMethods(),
            passwordProperty: properties.flatMap(group => group.properties).find(property => property.type === "password")?.name,
            poolProperty: properties.flatMap(group => group.properties).find(property => property.flags?.includes("pool"))?.name,
            maxFetchSizeProperty: properties.flatMap(group => group.properties).find(property => property.flags?.includes("max-fetch-size"))?.name,
        }
    }

    /**
     * do not call this function yourself
     * developer, call this function after you create a new connection, in constructor, after set uniqueId
     * @param connection 
     */
    _addConnection(connection: Connection): void {
        this.connections[connection.getConnectionId()] = connection;
    }

    /**
     * do not call this function yourself
     * @param uniqueId 
     * @returns 
     */
    _removeConnection(uniqueId: string): Connection | undefined {
        const connection = this.connections[uniqueId];
        delete this.connections[uniqueId];
        return connection;
    }

    /**
     * Get connection
     * 
     * @param uniqueId connection uniqueId
     * @returns connection
     */
    static getConnection(uniqueId: string): Connection | undefined {
        for (const driver of Driver.getDriverList()) {
            const result = driver.connections[uniqueId];
            if (result) {
                return result;
            }
        }
        return;
    }

    getConnectionList(): Connection[] {
        return [...Object.values<Connection>(this.connections)];
    }

    abstract getDriverId(): string;

    abstract getSupports(): api.DatabaseSupports;

    abstract getName(): string;

    abstract getDescription(): string | undefined;

    abstract getIcon(): string | undefined;

    abstract getVersion(): Version;

    abstract getProperties(): api.PropertiesInfo;

    abstract connect(properties: api.Properties, uniqueId?: string): Promise<Connection>;

    destroy(): void {
        for (const connection of Object.values<Connection>(this.connections)) {
            connection.close();
        }
        this.connections = {};
        delete Driver.drivers[this.getDriverId()];
    }
    
}
