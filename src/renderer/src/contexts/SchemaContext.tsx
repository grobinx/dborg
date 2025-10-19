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
import { Add } from "@mui/icons-material";

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
    | 'creating'
    | 'updating'
    | 'deleting'
    | 'connecting'
    | 'disconnecting'
    | 'testing'
    | 'fetching'
    | 'storing'
    ;

type SchemaEventConnecting = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; connection?: api.ConnectionInfo; error?: any };
type SchemaEventDisconnecting = { schema: SchemaRecord; connectionUniqueId: string; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type SchemaEventTesting = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type SchemaEventFetching = { status: 'started' | 'success' | 'error'; error?: any };
type SchemaEventStoring = { status: 'started' | 'success' | 'error'; error?: any };
type SchemaEventCreating = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type SchemaEventUpdating = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type SchemaEventDeleting = { schema: SchemaRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };

type SchemaEvent =
    | SchemaEventConnecting
    | SchemaEventDisconnecting
    | SchemaEventTesting
    | SchemaEventFetching
    | SchemaEventStoring
    | SchemaEventCreating
    | SchemaEventUpdating
    | SchemaEventDeleting
    ;

type SchemaEventMethod = {
    (type: 'connecting', callback: (event: SchemaEventConnecting) => void): () => void;
    (type: 'disconnecting', callback: (event: SchemaEventDisconnecting) => void): () => void;
    (type: 'testing', callback: (event: SchemaEventTesting) => void): () => void;
    (type: 'fetching', callback: (event: SchemaEventFetching) => void): () => void;
    (type: 'storing', callback: (event: SchemaEventStoring) => void): () => void;
    (type: 'creating', callback: (event: SchemaEventCreating) => void): () => void;
    (type: 'updating', callback: (event: SchemaEventUpdating) => void): () => void;
    (type: 'deleting', callback: (event: SchemaEventDeleting) => void): () => void;
};

interface SchemaContextValue {
    initialized: boolean;
    schemas: SchemaRecord[];
    getSchema: (schemaId: string, throwError?: boolean) => SchemaRecord | null;
    reloadSchemas: () => Promise<void>;
    createSchema: (schema: Omit<SchemaRecord, "sch_id" | "sch_created" | "sch_updated" | "sch_last_selected" | "sch_db_version" | "sch_order">) => Promise<string | undefined>;
    updateSchema: (schema: Omit<SchemaRecord, "sch_updated" | "sch_last_selected" | "sch_db_version" | "sch_order">) => Promise<boolean | undefined>;
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
    const { drivers, connections } = useDatabase();
    const { addToast } = useToast();
    const dialogs = useDialogs();
    const { t } = useTranslation();
    const { onEvent, emitEvent } = useListeners<SchemaEvent>();
    const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
    const [schemaInitialized, setSchemaInitialized] = useState<boolean>(false);
    const schemasRef = React.useRef<SchemaRecord[]>(schemas);
    const [justFetched, setJustFetched] = useState<boolean>(false);

    const getSchema = useCallback((schemaId: string, throwError: boolean = true) => {
        if (schemasRef.current) {
            const schema = schemasRef.current.find((s) => s.sch_id === schemaId);
            if (schema) {
                return JSON.parse(JSON.stringify(schema)) as SchemaRecord;
            }
        }
        if (throwError) {
            throw new Error(t("profile-id-not-found", "Profile not found!"));
        }
        return null;
    }, []);

    const loadSchemas = useCallback(async () => {
        emitEvent('fetching', { status: 'started' });
        const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);
        const data = await window.dborg.file.readFile(`${dataPath}/schemas.json`).catch(() => null);
        if (data) {
            try {
                const loadedSchemas = JSON.parse(data);
                setSchemas(loadedSchemas);
                setJustFetched(true);
                setSchemaInitialized(true);
            } catch (error) {
                addToast("error", t("error-parsing-schemas-json", "Error parsing schemas.json file."), { reason: error });
                emitEvent('fetching', { status: 'error', error });
                throw error;
            }
        }
        emitEvent('fetching', { status: 'success' });
    }, []);

    const storeSchemas = useCallback(async (schemas: SchemaRecord[]) => {
        emitEvent('storing', { status: 'started' });
        const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);
        await window.dborg.path.ensureDir(dataPath);
        const backupData = await window.dborg.file.readFile(`${dataPath}/schemas.json`).catch(() => null);
        if (backupData) {
            await window.dborg.path.ensureDir(`${dataPath}/backup`);
            const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmmss");
            await window.dborg.file.writeFile(`${dataPath}/backup/schemas.json.${timestamp}`, backupData);
            const backupFiles =
                (await window.dborg.path.list(`${dataPath}/backup`, "schemas.json.*"))
                    .sort((a, b) => b.localeCompare(a));
            if (backupFiles.length > 10) {
                for (let i = 10; i < backupFiles.length; i++) {
                    await window.dborg.file.deleteFile(`${dataPath}/backup/${backupFiles[i]}`);
                }
            }
        }
        await window.dborg.file.writeFile(`${dataPath}/schemas.json`, JSON.stringify(schemas, null, 2));
        emitEvent('storing', { status: 'success' });
    }, []);

    useEffect(() => {
        schemasRef.current = schemas;
        if (!schemaInitialized) {
            return;
        }
        if (justFetched) {
            setJustFetched(false);
            return;
        }
        storeSchemas(schemas);
    }, [schemas, storeSchemas]);

    React.useEffect(() => {
        loadSchemas();
    }, [loadSchemas]);

    const reloadSchemas = useCallback(async () => {
        await loadSchemas();
    }, [loadSchemas]);

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
        const schema = getSchema(schemaId)!;

        emitEvent("connecting", { schema, status: "started" });

        const confirm = await checkExistingConnection(schemaId);
        if (!confirm) {
            emitEvent("connecting", { schema, status: "cancel" });
            return;
        }

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
            addToast("error",
                t("profile-connection-error", "Failed to connect to {{name}}!", { name: schema.sch_name }),
                { source: t("profile-context", "Profile context"), reason: error }
            );
            emitEvent("connecting", { schema, status: "error", error });
            throw error;
        }
        schema.sch_last_selected = DateTime.now().toSQL();
        schema.sch_db_version = connection.version;
        schema.sch_updated = DateTime.now().toSQL();
        connections.userData.set(connection.uniqueId, "schema", schema);
        connection.userData.schema = schema;
        setSchemas((prev) => {
            const otherSchemas = prev.filter((s) => s.sch_id !== schemaId);
            return [...otherSchemas, schema];
        });
        emitEvent("connecting", { schema, status: "success", connection });
        return connection;
    }, [getSchema, drivers, connections, dialogs, passwordPrompt, checkExistingConnection]);

    const disconnectFromDatabase = useCallback(async (uniqueId: string) => {
        const schema = (await connections.userData.get(uniqueId, "schema")) as SchemaRecord;
        emitEvent("disconnecting", { schema, status: "started", connectionUniqueId: uniqueId });
        try {
            await connections.close(uniqueId);
            emitEvent("disconnecting", { schema, status: "success", connectionUniqueId: uniqueId });
        }
        catch (error) {
            emitEvent("disconnecting", { schema, status: "error", connectionUniqueId: uniqueId, error });
            throw error;
        }
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
        const schema = { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: schemaName, sch_properties: properties };
        try {
            emitEvent("testing", { schema, status: "started" });
            const passwordProperty = drivers.find(driverUniqueId)?.passwordProperty;
            const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
            if (!passwordHandled) {
                emitEvent("testing", { schema, status: "cancel" });
                return;
            }

            const connection = await drivers.connect(driverUniqueId, properties);
            await connections.close(connection.uniqueId);

            addToast("success",
                t("profile-test-success", "Connection \"{{name}}\" is valid.", { name: schemaName }),
                { source: t("profile-context", "Profile context") }
            );
            emitEvent("testing", { schema, status: "success" });

            return true;
        }
        catch (error) {
            addToast("error",
                t("profile-test-error", "An error occurred while testing the profile connection \"{{name}}\".", { name: schemaName }),
                { source: t("profile-context", "Profile context"), reason: error }
            );
            emitEvent("testing", { schema, status: "error", error });
            throw error;
        }
    }, [drivers, connections, passwordPrompt]);

    const updateOrder = useCallback((schemas: SchemaRecord[]) => {
        return schemas.slice()
            .sort((a, b) => (a.sch_order ?? 0) - (b.sch_order ?? 0))
            .map((schema, index) => ({
                ...schema,
                sch_order: index + 1,
                sch_updated: DateTime.now().toSQL(),
            }));
    }, []);

    const deleteSchema = useCallback(async (schemaId: string) => {
        const schema = getSchema(schemaId)!;
        if (await dialogs.confirm(
            t("delete-profile-q", 'Delete profile "{{name}}" ?', { name: schema.sch_name }),
            { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
        )) {
            setSchemas(prev => updateOrder(prev.filter(s => s.sch_id !== schemaId)));
            return true;
        }
        return false;
    }, [dialogs]);

    /**
     * Check if a schema with the same name already exists.
     * @param schemaName The name of the schema to check.
     * @param schemaId The ID of the schema to exclude from the check.
     * @returns True if the schema does not exist or the user confirms to continue.
     */
    const checkSchemaExists = useCallback(async (schemaName: string, schemaId?: string): Promise<boolean> => {
        const schema = schemasRef.current.find(s => s.sch_name === schemaName && s.sch_id !== schemaId);

        if (schema) {
            const confirm = await dialogs.confirm(
                t("schema-exists-q", 'Schema "{{name}}" already exists. Do you want to continue?', { name: schemaName }),
                { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
            );
            return confirm;
        }

        return true;
    }, [dialogs]);

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
    const createSchema = useCallback(async (schema: Omit<SchemaRecord, "sch_id" | "sch_created" | "sch_updated" | "sch_last_selected" | "sch_db_version" | "sch_order">) => {
        emitEvent('creating', { schema: schema as SchemaRecord, status: 'started' });
        if (!(await checkSchemaExists(schema.sch_name))) {
            emitEvent('creating', { schema: schema as SchemaRecord, status: 'cancel' });
            return;
        }
        passwordRetention(schema);

        const uniqueId = uuidv7();
        const newSchema: SchemaRecord = {
            ...schema,
            sch_id: uniqueId,
            sch_created: DateTime.now().toSQL(),
            sch_updated: DateTime.now().toSQL(),
            sch_order: Infinity,
        };
        setSchemas((prev) => updateOrder([...prev, newSchema]));
        emitEvent('creating', { schema: newSchema, status: 'success' });
        return uniqueId;
    }, [checkSchemaExists, passwordRetention]);

    /**
     * Update an existing schema.
     * @param schema The schema to update.
     * @returns True if the update was successful, false otherwise.
     */
    const updateSchema = useCallback(async (schema: Omit<SchemaRecord, "sch_updated" | "sch_last_selected" | "sch_db_version" | "sch_order">) => {
        const existsSchema = getSchema(schema.sch_id)!;

        emitEvent('updating', { schema: existsSchema as SchemaRecord, status: 'started' });
        if (!(await checkSchemaExists(schema.sch_name, schema.sch_id))) {
            emitEvent('updating', { schema: existsSchema as SchemaRecord, status: 'cancel' });
            return false;
        }
        passwordRetention(schema);

        const updatedSchema: SchemaRecord = {
            ...existsSchema,
            ...schema,
            sch_updated: DateTime.now().toSQL(),
        };
        setSchemas((prev) =>
            prev.map((s) => (s.sch_id === updatedSchema.sch_id ? updatedSchema : s)) // Zaktualizuj schemat w liście
        );
        emitEvent('updating', { schema: updatedSchema, status: 'success' });
        return true;
    }, [checkSchemaExists, passwordRetention]);

    const swapSchemasOrder = useCallback(async (sourceSchemaId: string, targetSchemaId: string, group?: boolean) => {
        if (!schemasRef.current) {
            return;
        }

        const sourceIndex = schemasRef.current.findIndex(s => s.sch_id === sourceSchemaId);
        const targetIndex = schemasRef.current.findIndex(s => s.sch_id === targetSchemaId);
        if (sourceIndex === -1 || targetIndex === -1) {
            throw new Error(t("profile-not-found", "Profile not found!"));
        }

        const nextOrder = Math.max(...schemasRef.current.map(s => s.sch_order ?? 0)) + 1;
        
        let sourceOrder = schemasRef.current[sourceIndex].sch_order ?? (nextOrder);
        let targetOrder = schemasRef.current[targetIndex].sch_order ?? (nextOrder + 1);

        if (group) {
            setSchemas(prev => {
                const newSchemas = prev.slice().sort((a, b) => (a.sch_order ?? 0) - (b.sch_order ?? 0));
                const sourceGroup = newSchemas[sourceIndex].sch_group;
                const targetGroup = newSchemas[targetIndex].sch_group;
                for (let i = 0; i < newSchemas.length; i++) {
                    if (newSchemas[i].sch_group === sourceGroup) {
                        newSchemas[i].sch_order = targetOrder;
                        newSchemas[i].sch_updated = DateTime.now().toSQL();
                        targetOrder += 0.001;
                    } else if (newSchemas[i].sch_group === targetGroup) {
                        newSchemas[i].sch_order = sourceOrder;
                        newSchemas[i].sch_updated = DateTime.now().toSQL();
                        sourceOrder += 0.001;
                    }
                }
                return updateOrder(newSchemas);
            });
        }
        else {
            setSchemas(prev => {
                const newSchemas = prev.slice();
                newSchemas[sourceIndex].sch_order = targetOrder;
                newSchemas[sourceIndex].sch_updated = DateTime.now().toSQL();
                newSchemas[targetIndex].sch_order = sourceOrder;
                newSchemas[targetIndex].sch_updated = DateTime.now().toSQL();
                return newSchemas;
            });
        }
    }, []);

    console.count("SchemaProvider render");

    return (
        <SchemaContext.Provider
            value={{
                initialized: schemaInitialized,
                schemas,
                getSchema,
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