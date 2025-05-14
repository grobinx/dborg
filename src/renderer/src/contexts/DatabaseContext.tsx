import React from "react";
import * as api from "../../../api/db";
import { useTranslation } from "react-i18next";

export interface DatabaseDriversContext {
    readonly list: api.DriverInfo[],
    readonly find: (uniqueId: string) => api.DriverInfo | undefined,
    readonly loadList: () => Promise<void>,
    readonly connect: (driverUniqueId: string, properties: api.Properties) => Promise<api.ConnectionInfo>,
}

export interface DatabaseConnectionsContext {

    readonly list: () => Promise<api.ConnectionInfo[]>,
    readonly close: (uniqueId: string) => Promise<void>,
    readonly userData: {
        readonly get: (uniqueId: string, property: string) => Promise<unknown>,
        readonly set: (uniqueId: string, property: string, value: unknown) => Promise<void>,
    },
    readonly query: <R extends api.QueryResultRow = api.QueryResultRow>(uniqueId: string, sql: string, values?: unknown[]) => Promise<api.QueryResult<R>>,
    readonly store: (uniqueId: string, sql: string) => Promise<api.StatementResult>,
    readonly execute: (uniqueId: string, sql: string, values?: unknown[]) => Promise<api.CommandResult>,
}

export interface DatabaseInternalContext {
    readonly query: (sql: string, values?: unknown[]) => Promise<api.QueryResult>,
    readonly execute: (sql: string, values?: unknown[]) => Promise<api.CommandResult>,
}

export interface DatabaseContextType {
    readonly drivers: DatabaseDriversContext,
    readonly connections: DatabaseConnectionsContext,
    readonly internal: DatabaseInternalContext,
}

export const DatabaseContext = React.createContext<DatabaseContextType | null>(null);

export interface DatabaseProviderProps {
    children: React.ReactNode
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = (props) => {
    const { children } = props;
    const [driverList, setDriverList] = React.useState<api.DriverInfo[]>([]);
    const { t } = useTranslation();

    const loadDriverList = async (): Promise<void> => {
        window.dborg.database.driver.getDrivers().then((driverList) => {
            for (const driver of driverList) {
                const driverKey = `${driver.uniqueId}.driver`;
                for (const group of driver.properties) {
                    const groupKey = `${driverKey}.${group.name}`;
                    group.title = t(`${groupKey}.title`.replaceAll(":", "-"), group.title);
                    if (group.description) {
                        group.description = t(`${groupKey}.description`.replaceAll(":", "-"), group.description);
                    }
                    for (const property of group.properties) {
                        property.title = t(`${groupKey}.properties.${property.name}-title`.replaceAll(":", "-"), property.title);
                        if (property.description) {
                            property.description = t(`${groupKey}.properties.${property.name}-description`.replaceAll(":", "-"), property.description);
                        }
                    }
                }
            }
            setDriverList(driverList);
        });
    };

    const internalQuery = (sql: string, values?: unknown[]): Promise<api.QueryResult> => {
        return window.dborg.database.internal.query(sql, values ?? []);
    }

    const internalExecute = (sql: string, values?: unknown[]): Promise<api.CommandResult> => {
        return window.dborg.database.internal.execute(sql, values ?? []);
    }

    const driverConnect = (driverUniqueId: string, properties: api.Properties): Promise<api.ConnectionInfo> => {
        return window.dborg.database.driver.connect(driverUniqueId, properties);
    }

    const driverFind = (driverUniqueId: string): api.DriverInfo => {
        return driverList.filter(driver => driver.uniqueId === driverUniqueId)[0];
    }

    const connectionClose = (uniqueId: string): Promise<void> => {
        return window.dborg.database.connection.close(uniqueId);
    }

    const connectionList = async (): Promise<api.ConnectionInfo[]> => {
        const result: api.ConnectionInfo[] = [];
        for (const driver of driverList) {
            result.push(...await window.dborg.database.driver.getConnections(driver.uniqueId));
        }
        return result;
    }

    const connectionGetUserData = (uniqueId: string, property: string): Promise<unknown> => {
        return window.dborg.database.connection.userData.get(uniqueId, property);
    }

    const connectionSetUserData = (uniqueId: string, property: string, value: unknown): Promise<void> => {
        return window.dborg.database.connection.userData.set(uniqueId, property, value);
    }

    const connectionStore = (uniqueId: string, sql: string): Promise<api.StatementResult> => {
        return window.dborg.database.connection.store(uniqueId, sql);
    }

    const connectionQuery = <R extends api.QueryResultRow = api.QueryResultRow>(uniqueId: string, sql: string, values?: unknown[]): Promise<api.QueryResult<R>> => {
        return window.dborg.database.connection.query<R>(uniqueId, sql, values ?? []);
    }

    const connectionExecute = (uniqueId: string, sql: string, values?: unknown[]): Promise<api.CommandResult> => {
        return window.dborg.database.connection.execute(uniqueId, sql, values ?? []);
    }

    const value = {
        drivers: {
            list: driverList,
            find: driverFind,
            loadList: loadDriverList,
            connect: driverConnect,
        },
        connections: {
            list: connectionList,
            close: connectionClose,
            userData: {
                get: connectionGetUserData,
                set: connectionSetUserData,
            },
            query: connectionQuery,
            store: connectionStore,
            execute: connectionExecute,
        },
        internal: {
            query: internalQuery,
            execute: internalExecute,
        }
    } as DatabaseContextType;

    React.useEffect(() => {
        loadDriverList();
    }, []);

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
};

export function useDatabase(): DatabaseContextType {
    const context = React.useContext(DatabaseContext);

    if (!context) {
        throw new Error('useDatabase must be used within a DatabaseProvider')
    }

    return context;
}
