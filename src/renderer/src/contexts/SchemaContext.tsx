import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { uuidv7 } from "uuidv7";
import { DBORG_DATA_PATH_NAME } from "../../../api/dborg-path";
import * as api from "../../../api/db";
import { useTranslation } from "react-i18next";
import PasswordDialog from "@renderer/dialogs/PasswordDialog";
import { SchemaUsePasswordType } from "@renderer/containers/SchemaAssistant/SchemaParameters/DriverPropertyPassword";
import { Properties } from "src/api/db";
import useListeners from "@renderer/hooks/useListeners";

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
    const addToast = useToast();
    const dialogs = useDialogs();
    const { t } = useTranslation();
    const { onEvent, emitEvent } = useListeners<SchemaEvent>();
    const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
    const [schemaInitialized, setSchemaInitialized] = useState<boolean>(false);

    // Refs
    const schemasRef = useRef<SchemaRecord[]>([]);
    const saveTimerRef = useRef<number | null>(null);
    const unmountedRef = useRef(false);
    const justFetchedRef = useRef<boolean>(false);

    // Utils
    const nowSql = () => DateTime.now().toSQL();
    const parseJsonSafe = <T,>(json: string): T | null => {
        try { return JSON.parse(json) as T; } catch { return null; }
    };

    // Keep ref in sync
    useEffect(() => { schemasRef.current = schemas; }, [schemas]);
    useEffect(() => {
        return () => {
            unmountedRef.current = true;
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
        };
    }, []);

    // Fast lookups
    const schemaMap = useMemo(() => {
        const map = new Map<string, SchemaRecord>();
        for (const s of schemas) map.set(s.sch_id, s);
        return map;
    }, [schemas]);

    const scheduleSave = useCallback((payload: SchemaRecord[]) => {
        if (!schemaInitialized || justFetchedRef.current) {
            // Skip saving right after fetch
            justFetchedRef.current = false;
            return;
        }
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        saveTimerRef.current = window.setTimeout(async () => {
            try {
                await storeSchemas(payload);
            } finally {
                saveTimerRef.current && window.clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
        }, 300);
    }, [schemaInitialized]); // storeSchemas is declared below but stable via useCallback

    const getSchema = useCallback((schemaId: string, throwError: boolean = true) => {
        const schema = schemaMap.get(schemaId) || null;
        if (!schema && throwError) {
            throw new Error(t("profile-id-not-found", "Profile not found!"));
        }
        return schema ? { ...schema } : null;
    }, [schemaMap, t]);

    const loadSchemas = useCallback(async () => {
        emitEvent('fetching', { status: 'started' });
        try {
            const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);
            const data = await window.dborg.file.readFile(`${dataPath}/schemas.json`).catch(() => null);
            if (data) {
                const loadedSchemas = parseJsonSafe<SchemaRecord[]>(data) ?? [];
                setSchemas(loadedSchemas);
                justFetchedRef.current = true;
            } else {
                setSchemas([]);
            }
            setSchemaInitialized(true);
            emitEvent('fetching', { status: 'success' });
        } catch (error) {
            addToast("error", t("error-parsing-schemas-json", "Error parsing schemas.json file."), { reason: error });
            setSchemas([]);
            setSchemaInitialized(true);
            emitEvent('fetching', { status: 'error', error });
        }
    }, [addToast, emitEvent, t]);

    const storeSchemas = useCallback(async (schemasToStore: SchemaRecord[]) => {
        emitEvent('storing', { status: 'started' });
        try {
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

            await window.dborg.file.writeFile(`${dataPath}/schemas.json`, JSON.stringify(schemasToStore, null, 2));
            emitEvent('storing', { status: 'success' });
        } catch (error) {
            emitEvent('storing', { status: 'error', error });
            throw error;
        }
    }, [emitEvent]);

    // Persist with debounce
    useEffect(() => {
        if (!schemaInitialized) return;
        scheduleSave(schemas);
    }, [schemas, schemaInitialized, scheduleSave]);

    useEffect(() => {
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
        const list = await connections.list();
        const existingConnection = list.find(
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
            return confirm;
        }
        return true;
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
        const properties = { ...schema.sch_properties };
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

        const updated: SchemaRecord = {
            ...schema,
            sch_last_selected: nowSql(),
            sch_db_version: connection.version,
            sch_updated: nowSql(),
            sch_properties: properties,
        };

        connections.userData.set(connection.uniqueId, "schema", updated);
        connection.userData.schema = updated;

        setSchemas((prev) => prev.map(s => s.sch_id === schemaId ? updated : s));
        emitEvent("connecting", { schema: updated, status: "success", connection });
        return connection;
    }, [addToast, checkExistingConnection, drivers, passwordPrompt, t, connections, getSchema]);

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
    }, [connections, emitEvent]);

    const disconnectFromAllDatabases = useCallback(async (schemaId: string) => {
        const allConnections = (await connections.list()).filter(
            (conn) => (conn.userData?.schema as SchemaRecord)?.sch_id === schemaId
        );
        for (const conn of allConnections) {
            await disconnectFromDatabase(conn.uniqueId);
        }
    }, [connections, disconnectFromDatabase]);

    const testConnection = useCallback(async (driverUniqueId: string, usePassword: SchemaUsePasswordType, properties: Properties, schemaName: string) => {
        const schema = { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: schemaName, sch_properties: properties } as SchemaRecord;
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
    }, [drivers, connections, addToast, passwordPrompt, t, emitEvent]);

    const normalizeOrder = useCallback((list: SchemaRecord[]): SchemaRecord[] => {
        return list
            .slice()
            .sort((a, b) => (a.sch_order ?? 0) - (b.sch_order ?? 0))
            .map((schema, index) => ({
                ...schema,
                sch_order: index + 1,
                sch_updated: nowSql(),
            }));
    }, []);

    const deleteSchema = useCallback(async (schemaId: string) => {
        const schema = getSchema(schemaId)!;
        if (await dialogs.confirm(
            t("delete-profile-q", 'Delete profile "{{name}}" ?', { name: schema.sch_name }),
            { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
        )) {
            setSchemas(prev => normalizeOrder(prev.filter(s => s.sch_id !== schemaId)));
            return true;
        }
        return false;
    }, [dialogs, getSchema, normalizeOrder, t]);

    /**
     * Check if a schema with the same name already exists.
     */
    const checkSchemaExists = useCallback(async (schemaName: string, schemaId?: string): Promise<boolean> => {
        const duplicate = schemasRef.current.find(s => s.sch_name === schemaName && s.sch_id !== schemaId);
        if (duplicate) {
            const confirm = await dialogs.confirm(
                t("schema-exists-q", 'Schema "{{name}}" already exists. Do you want to continue?', { name: schemaName }),
                { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
            );
            return confirm;
        }
        return true;
    }, [dialogs, t]);

    /**
     * Remove the password property from the schema if the password is not saved.
     */
    const passwordRetention = useCallback((schema: Pick<SchemaRecord, "sch_use_password" | "sch_properties" | "sch_drv_unique_id">) => {
        const passwordProperty = drivers.find(schema.sch_drv_unique_id)?.passwordProperty;
        if (schema.sch_use_password !== "save" && passwordProperty) {
            // Mutate local draft object only; caller should pass copies if needed
            delete schema.sch_properties?.[passwordProperty];
        }
    }, [drivers]);

    /**
     * Create a new schema.
     */
    const createSchema = useCallback(async (schema: Omit<SchemaRecord, "sch_id" | "sch_created" | "sch_updated" | "sch_last_selected" | "sch_db_version" | "sch_order">) => {
        emitEvent('creating', { schema: schema as SchemaRecord, status: 'started' });
        if (!(await checkSchemaExists(schema.sch_name))) {
            emitEvent('creating', { schema: schema as SchemaRecord, status: 'cancel' });
            return;
        }

        const draft: typeof schema = { ...schema, sch_properties: { ...schema.sch_properties } };
        passwordRetention(draft);

        const uniqueId = uuidv7();
        const newSchema: SchemaRecord = {
            ...draft,
            sch_id: uniqueId,
            sch_created: nowSql(),
            sch_updated: nowSql(),
            sch_order: (schemasRef.current.length ? Math.max(...schemasRef.current.map(s => s.sch_order ?? 0)) + 1 : 1),
        };

        setSchemas((prev) => [...prev, newSchema]);
        emitEvent('creating', { schema: newSchema, status: 'success' });
        return uniqueId;
    }, [checkSchemaExists, passwordRetention, emitEvent]);

    /**
     * Update an existing schema.
     */
    const updateSchema = useCallback(async (schema: Omit<SchemaRecord, "sch_updated" | "sch_last_selected" | "sch_db_version" | "sch_order">) => {
        const existsSchema = getSchema(schema.sch_id)!;

        emitEvent('updating', { schema: existsSchema as SchemaRecord, status: 'started' });
        if (!(await checkSchemaExists(schema.sch_name, schema.sch_id))) {
            emitEvent('updating', { schema: existsSchema as SchemaRecord, status: 'cancel' });
            return false;
        }

        const draft: typeof schema = { ...schema, sch_properties: { ...schema.sch_properties } };
        passwordRetention(draft);

        const updatedSchema: SchemaRecord = {
            ...existsSchema,
            ...draft,
            sch_updated: nowSql(),
        };

        setSchemas((prev) => prev.map((s) => (s.sch_id === updatedSchema.sch_id ? updatedSchema : s)));
        emitEvent('updating', { schema: updatedSchema, status: 'success' });
        return true;
    }, [checkSchemaExists, getSchema, passwordRetention, emitEvent]);

    const swapSchemasOrder = useCallback(async (sourceSchemaId: string, targetSchemaId: string, group?: boolean) => {
        const list = schemasRef.current;
        if (!list?.length) return;

        const byId = (id: string) => list.findIndex(s => s.sch_id === id);
        const srcIdx = byId(sourceSchemaId);
        const tgtIdx = byId(targetSchemaId);
        if (srcIdx === -1 || tgtIdx === -1) {
            throw new Error(t("profile-not-found", "Profile not found!"));
        }

        const sorted = list.slice().sort((a, b) => (a.sch_order ?? 0) - (b.sch_order ?? 0));

        if (group) {
            const srcGroup = sorted[srcIdx].sch_group;
            const tgtGroup = sorted[tgtIdx].sch_group;

            const srcBlock = sorted.filter(s => s.sch_group === srcGroup);
            const tgtBlock = sorted.filter(s => s.sch_group === tgtGroup);
            const rest = sorted.filter(s => s.sch_group !== srcGroup && s.sch_group !== tgtGroup);

            // Find insertion points based on original positions
            const firstSrcPos = Math.min(...sorted.map((s, i) => s.sch_group === srcGroup ? i : Number.MAX_SAFE_INTEGER));
            const firstTgtPos = Math.min(...sorted.map((s, i) => s.sch_group === tgtGroup ? i : Number.MAX_SAFE_INTEGER));

            let newOrder: SchemaRecord[];
            if (firstSrcPos < firstTgtPos) {
                // src before tgt -> place tgt where src was, then src where tgt was
                const beforeSrc = rest.slice(0, firstSrcPos);
                const between = rest.slice(firstSrcPos, firstTgtPos - srcBlock.length);
                const afterTgt = rest.slice(firstTgtPos - srcBlock.length);
                newOrder = [...beforeSrc, ...tgtBlock, ...between, ...srcBlock, ...afterTgt];
            } else {
                // tgt before src
                const beforeTgt = rest.slice(0, firstTgtPos);
                const between = rest.slice(firstTgtPos, firstSrcPos - tgtBlock.length);
                const afterSrc = rest.slice(firstSrcPos - tgtBlock.length);
                newOrder = [...beforeTgt, ...srcBlock, ...between, ...tgtBlock, ...afterSrc];
            }

            setSchemas(normalizeOrder(newOrder));
        } else {
            // Swap single items by position
            const newList = sorted.slice();
            const [a, b] = [newList[srcIdx], newList[tgtIdx]];
            newList[srcIdx] = { ...b, sch_updated: nowSql() };
            newList[tgtIdx] = { ...a, sch_updated: nowSql() };
            setSchemas(normalizeOrder(newList));
        }
    }, [normalizeOrder, t]);

    // Provide memoized context value to avoid re-renders
    const ctxValue = useMemo<SchemaContextValue>(() => ({
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
    }), [
        schemaInitialized,
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
        onEvent,
    ]);

    console.count("SchemaProvider render");

    return (
        <SchemaContext.Provider value={ctxValue}>
            {children}
        </SchemaContext.Provider>
    );
};

export const useSchema = () => {
    const ctx = useContext(SchemaContext);
    if (!ctx) throw new Error("useSchema must be used within a SchemaProvider");
    return ctx;
};