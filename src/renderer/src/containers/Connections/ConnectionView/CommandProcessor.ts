import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { Definition, Interpreter } from "@renderer/utils/SqlParser/interpreter";
import { Tokenizer } from "@renderer/utils/SqlParser/tokenizer";
import { RelationType, RoutineType } from "../../../../../../src/api/db/Metadata";
import { DatabaseQueryApi, MetadataObjectHit, MetadataQueryApi } from "../../../../../../src/api/db/MetadataQuery";
import { RequiredOnly } from "src/api/types";

export type ObjectType = "relation" | "routine" | "schema" | null;

export interface ObjectName {
    quoted: boolean;
    name: string;
    type?: ObjectType;
}

export interface GridResult {
    columns: ColumnDefinition[];
    rows: any[]
}

export class CommandProcessor {
    private static createDefinition(metadata: MetadataQueryApi): Definition<GridResult> {
        const definition: Definition<GridResult> = {
            name: "orbada_editor_commands",
            references: {
                schema_object: {
                    name: "schema_object",
                    sequence: [
                        { type: "wild_identifier", key: "schema" },
                        { type: "punctuator", value: "." },
                        { type: "wild_identifier", key: "object" },
                    ]
                },
                object: {
                    name: "object",
                    sequence: [
                        { type: "wild_identifier", key: "object" },
                    ]
                },
                schema: {
                    name: "schema",
                    sequence: [
                        { type: "wild_identifier", key: "schema" },
                    ]
                },
                schema_or_object: {
                    name: "schema_or_object",
                    sequence: [
                        {
                            type: "alternative",
                            options: [
                                [{ type: "reference", name: "schema_object" }],
                                [{ type: "reference", name: "schema" }]
                            ]
                        }
                    ]
                }
            },
            actions: [
                {
                    name: "help",
                    syntax: "/ help | h",
                    description: "Displays this help message",
                    sequence: [
                        { type: "operator", value: "/" },
                        { type: "keyword", value: ["help", "h"] },
                    ],
                    action: async () => {
                        return MCP.getHelp(definition);
                    },
                },
                {
                    name: "schemas",
                    syntax: "/ schemas | s [ <schema> ]",
                    description: "Displays schemas",
                    sequence: [
                        { type: "operator", value: "/" },
                        { type: "keyword", value: ["schemas", "s"] },
                        { type: "wild_identifier", key: "schema", optional: true },
                    ],
                    action: async (values) => {
                        const schemas = await MCP.findSchemas(metadata, values.soo?.object ?? null);
                        return await MCP.getSchemas(metadata, schemas.found);
                    },
                },
                {
                    name: "tables",
                    syntax: "/ tables | t [ <schema> [ . <table> ] ]",
                    description: "Displays tables in a specific schema or all tables if no schema is specified",
                    sequence: [
                        { type: "operator", value: "/" },
                        { type: "keyword", value: ["tables", "t"] },
                        { type: "reference", name: "schema_or_object", optional: true, key: "soo" },
                    ],
                    action: async (values) => {
                        return await MCP.getRelations(metadata, values.soo?.schema ?? null, values.soo?.object ?? null);
                    },
                },
                {
                    name: "functions",
                    syntax: "/ functions | f [ <schema> [ . <function> ] ]",
                    description: "Displays functions in a specific schema or all functions if no schema is specified",
                    sequence: [
                        { type: "operator", value: "/" },
                        { type: "keyword", value: ["functions", "f"] },
                        { type: "reference", name: "schema_or_object", optional: true, key: "soo" },
                    ],
                    action: async (values) => {
                        return await MCP.getRoutines(metadata, values.soo?.schema ?? null, values.soo?.object ?? null);
                    },
                },
                {
                    name: "schema_or_object",
                    syntax: "<schema> [ . <object> ] | <object>",
                    description: "Interprets input as either a schema or an object and displays relevant information",
                    sequence: [
                        {
                            type: "alternative",
                            options: [
                                [{ type: "reference", name: "schema_object" }],
                                [{ type: "reference", name: "object" }]
                            ],
                            key: "soo"
                        }
                    ],
                    action: async (values) => {
                        if (["select", "with", "delete", "update", "insert", "alter", "show"].includes(values.soo?.schema?.toLowerCase() ?? "") ||
                            ["select", "with", "delete", "update", "insert", "alter", "show"].includes(values.soo?.object?.toLowerCase() ?? "")) {
                            return null;
                        }

                        if (!values.soo?.schema && values.soo?.object) {
                            const schemas = await MCP.findSchemas(metadata, values.soo.object);
                            if (schemas.status === "one") {
                                const objects = await MCP.findObjects(metadata, values.soo.object, null);
                                return await MCP.getObjects(metadata, objects.found);
                            } else if (schemas.status === "many") {
                                return await MCP.getSchemas(metadata, schemas.found);
                            } else {
                                const objects = await MCP.findObjects(metadata, null, values.soo.object);
                                if (objects) {
                                    if (objects.status === "relation") {
                                        return await MCP.getColumns(metadata, objects.found);
                                    } else if (objects.status === "routine") {
                                        return await MCP.getArguments(metadata, objects.found);
                                    } else if (objects.status === "many") {
                                        return await MCP.getObjects(metadata, objects.found);
                                    }
                                }
                            }
                        } else if (values.soo?.schema && values.soo?.object) {
                            const objects = await MCP.findObjects(metadata, values.soo.schema, values.soo.object);
                            if (objects.status === "relation") {
                                return await MCP.getColumns(metadata, objects.found);
                            } else if (objects.status === "routine") {
                                return await MCP.getArguments(metadata, objects.found);
                            } else if (objects.status === "many") {
                                return await MCP.getObjects(metadata, objects.found);
                            }
                        }
                        return null;
                    },
                }
            ]
        };

        return definition;
    }

    static async processCommand(command: string, metadata: MetadataQueryApi): Promise<{ columns: ColumnDefinition[]; rows: any[]; } | null> {
        if (metadata.status !== "ready") {
            return null;
        }
        const tokens = new Tokenizer(command).tokenize();
        const definition = MCP.createDefinition(metadata);
        const interpreter = new Interpreter(tokens, definition);
        return await interpreter.interpret();
    }

    private static async findSchemas(metadata: MetadataQueryApi, name: string | null): Promise<{ found: RequiredOnly<MetadataObjectHit, "objectType">[]; status: "one" | "many" | false }> {
        const objects = await metadata.findObjects({
            name: Interpreter.createMask(name),
            objectTypes: ["schema"],
            filters: {
                database: { filter: { connected: true } }
            }
        });

        if (objects.length === 0) {
            return { found: [], status: false };
        } else if (objects.length === 1) {
            return { found: objects, status: "one" };
        } else {
            return { found: objects, status: "many" };
        }
    }

    private static async findObjects(
        metadata: MetadataQueryApi,
        schemaName: string | null,
        objectName: string | null
    ): Promise<{ found: RequiredOnly<MetadataObjectHit, "objectType">[]; status: "many" | "relation" | "routine" | false }> {
        const objects = await metadata.findObjects({
            name: Interpreter.createMask(objectName),
            objectTypes: ["relation", "routine"],
            filters: {
                database: { filter: { connected: true } },
                schema: schemaName ? { name: Interpreter.createMask(schemaName) } : undefined,
            }
        });

        if (objects.length === 0) {
            return { found: [], status: false };
        } else if (objects.length === 1) {
            return { found: objects, status: objects[0].objectType === "relation" ? "relation" : "routine" };
        }

        if (objects.every(obj => obj.objectType === "relation")) {
            return { found: objects, status: "relation" };
        } else if (objects.every(obj => obj.objectType === "routine")) {
            return { found: objects, status: "routine" };
        }

        return { found: objects, status: "many" };
    }


    private static getConnectedDatabases(metadata: MetadataQueryApi): Promise<DatabaseQueryApi[]> {
        const databases = metadata.getDatabaseList({ filter: { connected: true } });
        return databases;
    }

    private static getHelp(definition: Definition): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "command", label: "Command", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        for (const action of definition.actions) {
            rows.push({
                command: action.syntax,
                description: action.description,
            });
        }

        return { columns, rows };
    }

    private static async getSchemas(
        metadata: MetadataQueryApi,
        found: RequiredOnly<MetadataObjectHit, "objectType">[]
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        for (const hit of found) {
            if (hit.objectType === "schema") {
                const schema = await metadata.getObject(hit);
                if (schema?.objectType === "schema") {
                    rows.push({
                        database: hit.databaseName,
                        schema: hit.schemaName,
                        owner: schema.owner,
                        description: schema.description,
                    });
                }
            }
        }

        return { columns, rows };
    }

    private static async getRelations(
        metadata: MetadataQueryApi,
        schemaName: string | null,
        objectName: string | null,
        type?: RelationType
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "kind", label: "Kind", dataType: "string" },
            { key: "columns", label: "Columns", dataType: "number" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        const database = await metadata.getDatabaseList({ filter: { connected: true } });

        for (const db of database) {
            const schemas = await db.getSchemaList(
                schemaName ? { name: Interpreter.createMask(schemaName) } : undefined
            );
            for (const schema of schemas) {
                const relations = await schema.getRelationList(
                    objectName ? { name: Interpreter.createMask(objectName), filter: { relationType: type } } : undefined
                );
                for (const relation of relations) {
                    rows.push({
                        database: db.name,
                        schema: schema.name,
                        relation: relation.name,
                        owner: relation.owner,
                        type: relation.relationType,
                        kind: relation.kind,
                        columns: relation.columns?.length ?? 0,
                        description: relation.description,
                    });
                }
            }
        }

        return { columns, rows };
    }

    private static async getRoutines(
        metadata: MetadataQueryApi,
        schemaName: string | null,
        objectName: string | null,
        type?: RoutineType
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "overload", label: "Overload", dataType: "number" },
            { key: "routine", label: "Routine", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "kind", label: "Kind", dataType: "string" },
            { key: "arguments", label: "Arguments", dataType: "number" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        const database = await metadata.getDatabaseList({ filter: { connected: true } });

        for (const db of database) {
            const schemas = await db.getSchemaList(
                schemaName ? { name: Interpreter.createMask(schemaName) } : undefined
            );
            for (const schema of schemas) {
                const routines = await schema.getRoutineList(
                    objectName ? { name: Interpreter.createMask(objectName), filter: { routineType: type } } : undefined
                );
                for (const routine of routines) {
                    rows.push({
                        database: db.name,
                        schema: schema.name,
                        owner: routine.owner,
                        overload: routine.overload ?? 1,
                        routine: routine.name,
                        type: routine.routineType,
                        kind: routine.kind,
                        arguments: routine.arguments?.length ?? 0,
                        description: routine.description,
                    });
                }
            }
        }

        return { columns, rows };
    }

    private static async getObjects(
        metadata: MetadataQueryApi,
        found: RequiredOnly<MetadataObjectHit, "objectType">[],
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "object", label: "Object", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "kind", label: "Kind", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        for (const hit of found) {
            const object = await metadata.getObject(hit);
            if (!object) {
                continue;
            }
            if (object?.objectType === "relation") {
                rows.push({
                    database: hit.databaseName,
                    schema: hit.schemaName,
                    object: hit.objectName,
                    owner: object.owner,
                    type: object.relationType,
                    kind: object.kind,
                    description: object.description,
                });
            }
            if (object?.objectType === "routine") {
                rows.push({
                    database: hit.databaseName,
                    schema: hit.schemaName,
                    object: hit.objectName,
                    owner: object.owner,
                    type: object.routineType,
                    kind: object.kind,
                    description: object.description,
                });
            }
        }
        return { columns, rows };
    }

    private static async getArguments(
        metadata: MetadataQueryApi,
        found: RequiredOnly<MetadataObjectHit, "objectType">[],
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "routine", label: "Routine", dataType: "string" },
            { key: "overload", label: "Overload", dataType: "number" },
            { key: "no", label: "No.", dataType: "number" },
            { key: "argument", label: "Argument", dataType: "string" },
            { key: "dataType", label: "Data Type", dataType: "string" },
            { key: "mode", label: "Mode", dataType: "string" },
            { key: "defaultValue", label: "Default Value", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        for (const hit of found) {
            if (hit.objectType !== "routine") {
                continue;
            }

            const routine = await metadata.getObject(hit);
            if (!routine || routine.objectType !== "routine") {
                continue;
            }

            rows.push(...(routine.arguments ?? []).map((arg, index) => ({
                database: hit.databaseName,
                schema: hit.schemaName,
                routine: hit.objectName,
                overload: routine.overload ?? 1,
                no: arg.no ?? index + 1,
                argument: arg.name,
                dataType: arg.dataType,
                mode: arg.mode,
                defaultValue: arg.defaultValue,
                description: arg.description,
            })));
        }

        return { columns, rows };
    }

    private static async getColumns(
        metadata: MetadataQueryApi,
        found: RequiredOnly<MetadataObjectHit, "objectType">[]
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "no", label: "No.", dataType: "number" },
            { key: "column", label: "Column", dataType: "string" },
            { key: "dataType", label: "Data Type", dataType: "string" },
            { key: "nullable", label: "Nullable", dataType: "boolean" },
            { key: "defaultValue", label: "Default Value", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];

        for (const hit of found) {
            if (hit.objectType !== "relation") {
                continue;
            }

            const relation = await metadata.getObject(hit);
            if (!relation || relation.objectType !== "relation") {
                continue;
            }

            rows.push(...(relation.columns ?? []).map((column) => ({
                database: hit.databaseName,
                schema: hit.schemaName,
                relation: hit.objectName,
                no: column.no,
                column: column.name,
                dataType: column.dataType,
                nullable: column.nullable,
                defaultValue: column.defaultValue,
                description: column.description,
            })));
        }

        return { columns, rows };
    }

}

const MCP = CommandProcessor;
