import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import { useMessages, Messages } from "@renderer/contexts/MessageContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { uuidv7 } from "uuidv7";
import { DBORG_DATA_PATH_NAME } from "../../../api/dborg-path";
import { sortArray } from "@renderer/hooks/useSort";
import { groupArray } from "@renderer/hooks/useGroup";
import * as api from "../../../api/db";
import { useTranslation } from "react-i18next";
import PasswordDialog from "@renderer/dialogs/PasswordDialog";
import { SchemaUsePasswordType } from "@renderer/containers/SchemaAssistant/SchemaParameters/DriverPropertyPassword";
import { Properties } from "src/api/db";
import useListeners from "@renderer/hooks/useListeners";
import { emit } from "process";

// Define the schema structure
export interface SchemaRecord {
    sch_id: string;
    sch_created?: string;
    sch_updated?: string;
    sch_drv_unique_id: string;
    sch_group?: string;
    sch_pattern?: string;
    sch_name: string;
    sch_color?: string;
    sch_use_password?: SchemaUsePasswordType;
    sch_properties: Properties;
    sch_last_selected?: string;
    sch_db_version?: string;
    sch_script?: string;
    sch_order?: number;
}

export type SchemaEventType =
    | 'fetched'
    | 'created'
    | 'updated'
    | 'deleted'
    | 'connecting'
    | 'disconnecting'
    | 'testing'
    ;

type SchemaEventConnecting = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; connection?: api.ConnectionInfo; error?: any };
type SchemaEventDisconnecting = { schema: SchemaRecord; connectionUniqueId: string; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type SchemaEventTesting = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };

type SchemaEvent = SchemaEventConnecting | SchemaEventDisconnecting | SchemaEventTesting;

type SchemaEventMethod = {
    (type: 'connecting', callback: (event: SchemaEventConnecting) => void): () => void;
    (type: 'disconnecting', callback: (event: SchemaEventDisconnecting) => void): () => void;
    (type: 'testing', callback: (event: SchemaEventTesting) => void): () => void;
};

interface SchemaContextValue {
    schemas: SchemaRecord[];
    fetchSchema: (schemaId: string) => Promise<SchemaRecord>;
    fetchSchemas: (query?: string) => Promise<void>;
    reloadSchemas: () => Promise<void>;
    createSchema: (schema: Omit<SchemaRecord, "sch_id" | "sch_created" | "sch_updated" | "sch_last_selected" | "sch_db_version">) => Promise<string | undefined>;
    updateSchema: (schema: Omit<SchemaRecord, "sch_updated" | "sch_last_selected" | "sch_db_version">) => Promise<boolean | undefined>;
    deleteSchema: (schemaId: string) => Promise<boolean>;
    swapSchemasOrder: (sourceSchemaId: string, targetSchemaId: string, group?: boolean) => Promise<void>;
    connectToDatabase: (schemaId: string) => Promise<api.ConnectionInfo | undefined>;
    disconnectFromDatabase: (uniqueId: string) => Promise<void>;
    disconnectFromAllDatabases: (schemaId: string) => Promise<void>;
    testConnection: (driverUniqueId: string, usePassword: SchemaUsePasswordType, properties: Properties, schemaName: string) => Promise<boolean | undefined>;

    onEvent: SchemaEventMethod;
}

const SchemaContext = createContext<SchemaContextValue | undefined>(undefined);

export const SchemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Przenieś całą logikę ze SchemaConnectionManager tutaj!
    // Zmień setSchemas na useState, itd.
    // Przykład:
    const { subscribe, unsubscribe, queueMessage } = useMessages();
    const { internal, drivers, connections } = useDatabase();
    const { addToast } = useToast();
    const dialogs = useDialogs();
    const { t } = useTranslation();
    const { onEvent, emitEvent } = useListeners<SchemaEvent>();

    const [schemas, setSchemas] = useState<SchemaRecord[]>([]);

    const t_connectionSchemaManager = t("connection-schemas-manager", "Connection schemas Manager");

    const rowToSchemaRecord = (row: api.QueryResultRow): SchemaRecord => {
        return {
            sch_id: row.sch_id as string,
            sch_created: row.sch_created as string,
            sch_updated: row.sch_updated as string,
            sch_drv_unique_id: row.sch_drv_unique_id as string,
            sch_group: row.sch_group as string,
            sch_pattern: row.sch_pattern as string,
            sch_name: row.sch_name as string,
            sch_color: row.sch_color as string,
            sch_use_password: row.sch_use_password as SchemaUsePasswordType,
            sch_properties: JSON.parse(row.sch_properties as string ?? "{}"),
            sch_last_selected: row.sch_last_selected as string,
            sch_db_version: row.sch_db_version as string,
            sch_script: row.sch_script as string,
            sch_order: Number.parseInt(row.sch_order as string),
        };
    };

    const fetchSchema = useCallback(async (schemaId: string) => {
        const existingSchema = schemas.find((s) => s.sch_id === schemaId);
        if (existingSchema) {
            return existingSchema; // Zwróć schemat z pamięci, jeśli już istnieje
        }

        const { rows } = await internal.query("select * from schemas where sch_id = ?", [schemaId]);
        if (!rows.length) {
            throw new Error(t("schema-id-not-found", "Schema {{schemaId}} not found!", { schemaId }));
        }
        const schema = rowToSchemaRecord(rows[0]);
        setSchemas((prev) => [...prev, schema]); // Dodaj nowy schemat do listy
        return schema;
    }, [internal, schemas]);

    const fetchSchemas = useCallback(async (query?: string) => {
        const { rows } = await internal.query(query ?? "select * from schemas");
        const loadedSchemas = rows.map(rowToSchemaRecord);
        setSchemas(loadedSchemas);
        //emitEvent("fetched", { type: "fetched", schema: loadedSchemas });
    }, [internal]);

    React.useEffect(() => {
        fetchSchemas();
    }, [fetchSchemas]);

    const reloadSchemas = useCallback(async () => {
        await fetchSchemas();
    }, [fetchSchemas]);

    const passwordPrompt = useCallback(async (
        usePassword: SchemaUsePasswordType,
        passwordProperty: string | undefined,
        properties: Properties
    ): Promise<boolean> => {
        if (usePassword === "ask" && passwordProperty) {
            const password = await dialogs.open(PasswordDialog, {});
            if (!password) return false;
            properties[passwordProperty] = password;
        }
        return true;
    }, [dialogs]);

    const checkExistingConnection = useCallback(async (schemaId: string): Promise<boolean> => {
        const existingConnection = (await connections.list()).find(
            (conn) => (conn.userData?.schema as SchemaRecord)?.sch_id === schemaId
        );

        if (existingConnection) {
            const confirm = await dialogs.confirm(
                t(
                    "connection-already-established",
                    'A connection to "{{name}}" is already established. Do you want to continue?',
                    { name: (existingConnection.userData.schema as SchemaRecord).sch_name }
                ),
                {
                    severity: "warning",
                    title: t("confirm", "Confirm"),
                    cancelText: t("no", "No"),
                    okText: t("yes", "Yes"),
                }
            );
            return confirm; // Zwraca true, jeśli użytkownik potwierdził, false w przeciwnym razie
        }

        return true; // Brak istniejącego połączenia, można kontynuować
    }, [connections, dialogs, t]);

    const connectToDatabase = useCallback(async (schemaId: string) => {
        const confirm = await checkExistingConnection(schemaId);
        if (!confirm) {
            return; // Użytkownik anulował operację
        }

        const schema = await fetchSchema(schemaId);
        emitEvent("connecting", { schema, status: "started" });
        const driverId = schema.sch_drv_unique_id as string;
        const properties = schema.sch_properties;
        const usePassword = schema.sch_use_password as SchemaUsePasswordType;
        const passwordProperty = drivers.find(driverId)?.passwordProperty;

        const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
        if (!passwordHandled) {
            emitEvent("connecting", { schema, status: "cancel" });
            return;
        }

        let connection: api.ConnectionInfo;
        try {
            connection = await drivers.connect(driverId, properties);
        }
        catch (error) {
            emitEvent("connecting", { schema, status: "error", error });
            throw error;
        }
        schema.sch_last_selected = DateTime.now().toSQL();
        schema.sch_db_version = connection.version;
        connections.userData.set(connection.uniqueId, "schema", schema);
        connection.userData.schema = schema;
        internal.execute(
            "update schemas set \n" +
            "  sch_last_selected = ?, \n" +
            "  sch_db_version = ? \n" +
            " where sch_id = ?",
            [schema.sch_last_selected, schema.sch_db_version, schemaId]
        );
        setSchemas((prev) => {
            const otherSchemas = prev.filter((s) => s.sch_id !== schemaId);
            return [...otherSchemas, schema];
        });
        emitEvent("connecting", { schema, status: "success", connection });
        return connection;
    }, [fetchSchema, drivers, internal, connections, dialogs, t, passwordPrompt, checkExistingConnection]);

    const disconnectFromDatabase = useCallback(async (uniqueId: string) => {
        const schema = (await connections.userData.get(uniqueId, "schema")) as SchemaRecord;
        emitEvent("disconnecting", { schema, status: "started", connectionUniqueId: uniqueId });
        await connections.close(uniqueId);
        emitEvent("disconnecting", { schema, status: "success", connectionUniqueId: uniqueId });
    }, [connections]);

    const disconnectFromAllDatabases = useCallback(async (schemaId: string) => {
        const allConnections = (await connections.list()).filter(
            (conn) => (conn.userData?.schema as SchemaRecord)?.sch_id === schemaId
        );
        for (const conn of allConnections) {
            disconnectFromDatabase(conn.uniqueId);
        }
    }, [connections, disconnectFromDatabase]);

    const testConnection = useCallback(async (driverUniqueId: string, usePassword: SchemaUsePasswordType, properties: Properties, schemaName: string) => {
        try {
            emitEvent("testing", { schema: { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: schemaName, sch_properties: properties }, status: "started" });
            const passwordProperty = drivers.find(driverUniqueId)?.passwordProperty;
            const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
            if (!passwordHandled) {
                emitEvent("testing", { schema: { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: schemaName, sch_properties: properties }, status: "cancel" });
                return;
            }

            const connection = await drivers.connect(driverUniqueId, properties);
            await connections.close(connection.uniqueId);

            addToast("success",
                t("profile-test-success", "Connection \"{{name}}\" is valid.", { name: schemaName }),
                { source: t("profile-assistant", "Profile assistant") }
            );
            emitEvent("testing", { schema: { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: schemaName, sch_properties: properties }, status: "success" });

            return true;
        }
        catch (error) {
            addToast("error",
                t("profile-test-error", "An error occurred while testing the profile connection \"{{name}}\".", { name: schemaName }),
                { source: t("profile-assistant", "Profile assistant"), reason: error }
            );
            emitEvent("testing", { schema: { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: schemaName, sch_properties: properties }, status: "error", error });
            throw error;
        }
    }, [internal, drivers, connections, passwordPrompt]);

    const updateOrder = useCallback(async () => {
        await internal.execute(
            "WITH ordered AS (\n" +
            "    SELECT sch_id, ROW_NUMBER() OVER (ORDER BY sch_order) AS new_order\n" +
            "    FROM schemas\n" +
            ")\n" +
            "UPDATE schemas\n" +
            "SET sch_order = (\n" +
            "    SELECT new_order FROM ordered WHERE ordered.sch_id = schemas.sch_id\n" +
            ")"
        );
    }, [internal]);

    const deleteSchema = useCallback(async (schemaId: string) => {
        const schema = await fetchSchema(schemaId);
        if (await dialogs.confirm(
            t("delete-profile-q", 'Delete profile "{{name}}" ?', { name: schema.sch_name }),
            { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
        )) {
            await internal.execute("delete from schemas where sch_id = ?", [schemaId]);
            await updateOrder();
            await fetchSchemas();
            queueMessage(Messages.SCHEMA_DELETE_SUCCESS, schema.sch_id);
            return true;
        }
        return false;
    }, [internal, dialogs, fetchSchema, t]);

    const swapSchemasOrder = useCallback(async (sourceSchemaId: string, targetSchemaId: string, group?: boolean) => {
        const sourceSchema = schemas.find(s => s.sch_id === sourceSchemaId);
        const targetSchema = schemas.find(s => s.sch_id === targetSchemaId);
        if (!sourceSchema || !targetSchema) {
            throw new Error(t("profile-id-not-found", "Profile not found!"));
        }
        const sourceOrder = sourceSchema.sch_order;
        const targetOrder = targetSchema.sch_order;
        if (sourceOrder === undefined || targetOrder === undefined) {
            throw new Error(t("profile-order-undefined", "Profile order is undefined!"));
        }
        if (group) {
            const updateGroupOrder = async (schemaId: string, order: number) => {
                await internal.execute(
                    "WITH ordered AS (\n" +
                    "    SELECT \n" +
                    "        sch_id,\n" +
                    "        ROW_NUMBER() OVER (ORDER BY sch_order) AS new_order\n" +
                    "    FROM schemas\n" +
                    "    WHERE coalesce(sch_group, 'ungrouped') = (SELECT coalesce(sch_group, 'ungrouped') FROM schemas WHERE sch_id = ?)\n" +
                    ")\n" +
                    "UPDATE schemas\n" +
                    "SET sch_order = (\n" +
                    "    SELECT ? + new_order / 1000.0 FROM ordered WHERE ordered.sch_id = schemas.sch_id\n" +
                    ")\n" +
                    "WHERE sch_id IN (SELECT sch_id FROM ordered)",
                    [schemaId, order]
                );
            }
            await updateGroupOrder(sourceSchemaId, targetOrder);
            await updateGroupOrder(targetSchemaId, sourceOrder);
            await updateOrder();
        }
        else {
            await internal.execute(
                "update schemas set sch_order = case \n" +
                "  when sch_id = ? then ? \n" +
                "  when sch_id = ? then ? \n" +
                "end \n" +
                "where sch_id in (?, ?)",
                [sourceSchemaId, targetOrder, targetSchemaId, sourceOrder, sourceSchemaId, targetSchemaId]
            );
        }
        await reloadSchemas();
    }, [internal, fetchSchemas, schemas, t]);

    /**
     * Check if a schema with the same name already exists.
     * @param schemaName The name of the schema to check.
     * @param schemaId The ID of the schema to exclude from the check.
     * @returns True if the schema does not exist or the user confirms to continue.
     */
    const checkSchemaExists = useCallback(async (schemaName: string, schemaId?: string): Promise<boolean> => {
        const { rows } = await internal.query(
            "select count(*) as count from schemas where sch_name = ? and sch_id != ?",
            [schemaName, schemaId ?? ""]
        );
        const exists = (rows[0]?.count as number) > 0;

        if (exists) {
            const confirm = await dialogs.confirm(
                t("schema-exists-q", 'Schema "{{name}}" already exists. Do you want to continue?', { name: schemaName }),
                { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
            );
            return confirm;
        }

        return true;
    }, [internal, dialogs, t]);

    /**
     * Remove the password property from the schema if the password is not saved.
     * @param schema The schema to check.
     * @param schema.sch_use_password The password usage type.
     * @param schema.sch_properties The schema properties.
     * @param schema.sch_drv_unique_id The driver unique ID.
     * @returns The schema without the password property if the password is not saved.
     */
    const passwordRetention = useCallback((schema: Pick<SchemaRecord, "sch_use_password" | "sch_properties" | "sch_drv_unique_id">) => {
        const passwordProperty = drivers.find(schema.sch_drv_unique_id)?.passwordProperty;
        if (schema.sch_use_password !== "save" && passwordProperty) {
            delete schema.sch_properties?.[passwordProperty];
        }
    }, [drivers]);

    /**
     * Create a new schema.
     * @param schema The schema to create.
     * @returns The ID of the created schema.
     */
    const createSchema = useCallback(async (schema: Omit<SchemaRecord, "sch_id" | "sch_created" | "sch_updated" | "sch_last_selected" | "sch_db_version">) => {
        if (!(await checkSchemaExists(schema.sch_name))) {
            return;
        }
        passwordRetention(schema);

        const uniqueId = uuidv7();
        const newSchema: SchemaRecord = {
            ...schema,
            sch_id: uniqueId,
            sch_created: DateTime.now().toSQL(),
            sch_updated: DateTime.now().toSQL(),
        };
        await internal.execute(
            "insert into schemas (\n" +
            "  sch_id, sch_created, sch_updated, sch_drv_unique_id, \n" +
            "  sch_group, sch_pattern, sch_name, sch_color, sch_use_password, \n" +
            "  sch_properties, sch_script, sch_order)\n" +
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (select ifnull(max(sch_order), 0) + 1 from schemas))",
            [
                newSchema.sch_id,
                newSchema.sch_created,
                newSchema.sch_updated,
                newSchema.sch_drv_unique_id,
                newSchema.sch_group,
                newSchema.sch_pattern,
                newSchema.sch_name,
                newSchema.sch_color,
                newSchema.sch_use_password,
                JSON.stringify(newSchema.sch_properties),
                newSchema.sch_script,
            ]
        );
        const { rows } = await internal.query("select sch_order from schemas where sch_id = ?", [newSchema.sch_id]);
        if (rows.length) {
            newSchema.sch_order = Number.parseInt(rows[0].sch_order as string);
        }
        setSchemas((prev) => [...prev, newSchema]); // Dodaj nowy schemat do listy
        queueMessage(Messages.SCHEMA_CREATE_SUCCESS, newSchema);
        return uniqueId;
    }, [internal, checkSchemaExists, passwordRetention]);

    /**
     * Update an existing schema.
     * @param schema The schema to update.
     * @returns True if the update was successful, false otherwise.
     */
    const updateSchema = useCallback(async (schema: Omit<SchemaRecord, "sch_updated" | "sch_last_selected" | "sch_db_version">) => {
        if (!(await checkSchemaExists(schema.sch_name, schema.sch_id))) {
            return;
        }
        passwordRetention(schema);

        const updatedSchema: SchemaRecord = {
            ...schemas.find(s => s.sch_id === schema.sch_id), // fill missing properties
            ...schema,
            sch_updated: DateTime.now().toSQL(),
        };
        await internal.execute(
            "update schemas set \n" +
            "  sch_updated = ?, \n" +
            "  sch_drv_unique_id = ?, \n" +
            "  sch_group = ?, \n" +
            "  sch_pattern = ?, \n" +
            "  sch_name = ?, \n" +
            "  sch_color = ?, \n" +
            "  sch_use_password = ?, \n" +
            "  sch_properties = ?, \n" +
            "  sch_script = ? \n" +
            "where sch_id = ?",
            [
                updatedSchema.sch_updated,
                updatedSchema.sch_drv_unique_id,
                updatedSchema.sch_group,
                updatedSchema.sch_pattern,
                updatedSchema.sch_name,
                updatedSchema.sch_color,
                updatedSchema.sch_use_password,
                JSON.stringify(updatedSchema.sch_properties),
                updatedSchema.sch_script,
                updatedSchema.sch_id,
            ]
        );
        setSchemas((prev) =>
            prev.map((s) => (s.sch_id === updatedSchema.sch_id ? updatedSchema : s)) // Zaktualizuj schemat w liście
        );
        queueMessage(Messages.SCHEMA_UPDATE_SUCCESS, updatedSchema);
        return true;
    }, [internal, checkSchemaExists, passwordRetention, schemas]);

    useEffect(() => {
        subscribe(Messages.SCHEMA_TEST_CONNECTION, testConnection);
        subscribe(Messages.SCHEMA_CONNECT, connectToDatabase);
        subscribe(Messages.FETCH_SCHEMA, fetchSchema);
        subscribe(Messages.SCHEMA_DELETE, deleteSchema);
        subscribe(Messages.SCHEMA_CREATE, createSchema);
        subscribe(Messages.SCHEMA_UPDATE, updateSchema);
        subscribe(Messages.SCHEMA_SWAP_ORDER, swapSchemasOrder);

        return () => {
            unsubscribe(Messages.SCHEMA_TEST_CONNECTION, testConnection);
            unsubscribe(Messages.SCHEMA_CONNECT, connectToDatabase);
            unsubscribe(Messages.FETCH_SCHEMA, fetchSchema);
            unsubscribe(Messages.SCHEMA_DELETE, deleteSchema);
            unsubscribe(Messages.SCHEMA_CREATE, createSchema);
            unsubscribe(Messages.SCHEMA_UPDATE, updateSchema);
            unsubscribe(Messages.SCHEMA_SWAP_ORDER, swapSchemasOrder);
        };
    }, [
        testConnection,
        connectToDatabase,
        fetchSchema,
        fetchSchemas,
        deleteSchema,
        createSchema,
        updateSchema,
        reloadSchemas,
        disconnectFromDatabase,
        disconnectFromAllDatabases,
        swapSchemasOrder,
    ]);

    useEffect(() => {
        (async () => {
            const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);
            await window.dborg.path.ensureDir(dataPath);
            await window.dborg.file.writeFile(`${dataPath}/schemas.json`, JSON.stringify(schemas, null, 2));
        })();
    }, [schemas]);

    console.count("SchemaProvider render");

    return (
        <SchemaContext.Provider
            value={{
                schemas,
                fetchSchema,
                fetchSchemas,
                reloadSchemas,
                createSchema,
                updateSchema,
                deleteSchema,
                swapSchemasOrder,
                connectToDatabase,
                disconnectFromDatabase,
                disconnectFromAllDatabases,
                testConnection,
                onEvent: onEvent as SchemaEventMethod,
            }}
        >
            {children}
        </SchemaContext.Provider>
    );
};

export const useSchema = () => {
    const ctx = useContext(SchemaContext);
    if (!ctx) throw new Error("useSchema must be used within a SchemaProvider");
    return ctx;
};