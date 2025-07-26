import React, { useEffect, useCallback } from "react";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { DateTime } from "luxon";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import PasswordDialog from "@renderer/dialogs/PasswordDialog";
import { useDialogs } from "@toolpad/core";
import { SchemaUsePasswordType } from "@renderer/containers/SchemaAssistant/SchemaParameters/DriverPropertyPassword";
import { Properties } from "src/api/db";
import * as api from "../../../../api/db";
import { useTranslation } from "react-i18next";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";

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
}

const SchemaConnectionManager: React.FC = () => {
    const { subscribe, unsubscribe, queueMessage } = useMessages();
    const { internal, drivers, connections } = useDatabase();
    const { addToast } = useToast();
    const dialogs = useDialogs();
    const { t } = useTranslation();

    const [schemas, setSchemas] = React.useState<SchemaRecord[]>([]); // Stan przechowujący załadowane schematy
    const [schemasLoaded, setSchemasLoaded] = React.useState(false); // Flaga wskazująca, czy schematy zostały załadowane

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
        if (schemasLoaded) {
            return [...schemas]; // Nie ładuj ponownie, jeśli schematy są już załadowane
        }

        const { rows } = await internal.query(query ?? "select * from schemas");
        const loadedSchemas = rows.map(rowToSchemaRecord);
        setSchemas(loadedSchemas); // Zaktualizuj stan załadowanych schematów
        setSchemasLoaded(true); // Ustaw flagę, że schematy zostały załadowane
        return loadedSchemas;
    }, [internal, schemasLoaded, schemas]);

    const reloadSchemas = useCallback(async () => {
        setSchemasLoaded(false); // Zresetuj flagę załadowania
        await fetchSchemas(); // Ponownie załaduj schematy
        queueMessage(Messages.RELOAD_SCHEMAS_SUCCESS); 
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
        queueMessage(Messages.SCHEMA_CONNECT_INFO, schema);
        const driverId = schema.sch_drv_unique_id as string;
        const properties = schema.sch_properties;
        const usePassword = schema.sch_use_password as SchemaUsePasswordType;
        const passwordProperty = drivers.find(driverId)?.passwordProperty;

        const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
        if (!passwordHandled) {
            queueMessage(Messages.SCHEMA_CONNECT_CANCEL, schema);
            return;
        }

        let connection: api.ConnectionInfo;
        try {
            connection = await drivers.connect(driverId, properties);
        }
        catch (error) {
            queueMessage(Messages.SCHEMA_CONNECT_ERROR, error, schema);
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
        queueMessage(Messages.SCHEMA_CONNECT_SUCCESS, connection);
        return connection;
    }, [fetchSchema, drivers, internal, connections, dialogs, t, passwordPrompt, checkExistingConnection]);

    const disconnectFromDatabase = useCallback(async (uniqueId: string) => {
        await connections.close(uniqueId);
        queueMessage(Messages.SCHEMA_DISCONNECT_SUCCESS, uniqueId);
    }, [connections]);

    const testConnection = useCallback(async (driverUniqueId: string, usePassword: SchemaUsePasswordType, properties: Properties, schemaName: string) => {
        try {
            const passwordProperty = drivers.find(driverUniqueId)?.passwordProperty;
            const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
            if (!passwordHandled) {
                return;
            }

            const connection = await drivers.connect(driverUniqueId, properties);
            await connections.close(connection.uniqueId);

            addToast("success", t("schema-test-success", "Connection \"{{name}}\" is valid.", { name: schemaName }), {
                source: t_connectionSchemaManager,
            });

            return true;
        }
        catch (error) {
            addToast("error",
                t("schema-test-error", "An error occurred while testing the connection to \"{{name}}\".", { name: schemaName }),
                {
                    source: t_connectionSchemaManager, reason: error,
                }
            );
            return false;
        }
    }, [internal, drivers, connections, passwordPrompt]);

    const deleteSchema = useCallback(async (schemaId: string) => {
        const schema = await fetchSchema(schemaId);
        if (await dialogs.confirm(
            t("delete-schema-q", 'Delete schema "{{name}}" ?', { name: schema.sch_name }),
            { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
        )) {
            await internal.execute("delete from schemas where sch_id = ?", [schemaId]);
            setSchemas((prev) => prev.filter((s) => s.sch_id !== schemaId)); // Usuń schemat z listy
            queueMessage(Messages.SCHEMA_DELETE_SUCCESS, schema.sch_id);
            return true;
        }
        return false;
    }, [internal, dialogs, fetchSchema, t]);

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
            "  sch_properties, sch_script)\n" +
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        subscribe(Messages.FETCH_SCHEMAS, fetchSchemas);
        subscribe(Messages.SCHEMA_DELETE, deleteSchema);
        subscribe(Messages.SCHEMA_CREATE, createSchema);
        subscribe(Messages.SCHEMA_UPDATE, updateSchema);
        subscribe(Messages.RELOAD_SCHEMAS, reloadSchemas);
        subscribe(Messages.SCHEMA_DISCONNECT, disconnectFromDatabase);
        

        return () => {
            unsubscribe(Messages.SCHEMA_TEST_CONNECTION, testConnection);
            unsubscribe(Messages.SCHEMA_CONNECT, connectToDatabase);
            unsubscribe(Messages.FETCH_SCHEMA, fetchSchema);
            unsubscribe(Messages.FETCH_SCHEMAS, fetchSchemas);
            unsubscribe(Messages.SCHEMA_DELETE, deleteSchema);
            unsubscribe(Messages.SCHEMA_CREATE, createSchema);
            unsubscribe(Messages.SCHEMA_UPDATE, updateSchema);
            unsubscribe(Messages.RELOAD_SCHEMAS, reloadSchemas);
            unsubscribe(Messages.SCHEMA_DISCONNECT, disconnectFromDatabase);
        };
    }, [
        subscribe, 
        unsubscribe, 
        testConnection, 
        connectToDatabase, 
        fetchSchema, 
        fetchSchemas, 
        deleteSchema, 
        createSchema, 
        updateSchema, 
        reloadSchemas, 
        disconnectFromDatabase
    ]);

    return <></>;
};

export default SchemaConnectionManager;