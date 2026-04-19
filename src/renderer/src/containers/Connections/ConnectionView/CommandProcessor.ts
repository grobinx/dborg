import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { Definition, Interpreter } from "@renderer/utils/SqlParser/interpreter";
import { Tokenizer } from "@renderer/utils/SqlParser/tokenizer";
import { DatabaseMetadata, RelationType, RoutineType, Metadata } from "../../../../../../src/api/db/Metadata";
import { DatabaseQueryApi, MetadataQueryApi } from "../../../../../../src/api/db/MetadataQuery";

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
                        return await MCP.getSchemas(metadata, values.schema ?? null);
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
                            const isSchema = await MCP.isSchema(metadata, values.soo.object);
                            if (isSchema === "one") {
                                return await MCP.getObjects(metadata, values.soo.object, null);
                            } else if (isSchema === "many") {
                                return await MCP.getSchemas(metadata, values.soo.object);
                            } else {
                                const isObject = await MCP.isObject(metadata, null, values.soo.object);
                                if (isObject) {
                                    if (isObject === "relation") {
                                        return await MCP.getColumns(metadata, null, values.soo.object);
                                    } else if (isObject === "routine") {
                                        return await MCP.getArguments(metadata, null, values.soo.object);
                                    } else if (isObject === "many") {
                                        return await MCP.getObjects(metadata, null, values.soo.object);
                                    }
                                }
                            }
                        } else if (values.soo?.schema && values.soo?.object) {
                            const isObject = await MCP.isObject(metadata, values.soo.schema, values.soo.object);
                            if (isObject === "relation") {
                                return await MCP.getColumns(metadata, values.soo.schema, values.soo.object);
                            } else if (isObject === "routine") {
                                return await MCP.getArguments(metadata, values.soo.schema, values.soo.object);
                            } else if (isObject === "many") {
                                return await MCP.getObjects(metadata, values.soo.schema, values.soo.object);
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

    private static async isSchema(metadata: MetadataQueryApi, name: string): Promise<"one" | "many" | false> {
        const matchedSchemas = (
            await Promise.all(
                (await MCP.getConnectedDatabases(metadata))
                    .map(db => db.getSchemaList({ name: Interpreter.createMask(name) }))
            )
        ).flat();
        if (matchedSchemas.length === 0) {
            return false;
        } else if (matchedSchemas.length === 1) {
            return "one";
        } else {
            return "many";
        }
    }

    private static async isObject(
        metadata: MetadataQueryApi,
        schemaName: string | null,
        objectName: string
    ): Promise<"one" | "many" | "relation" | "routine" | false> {
        const databases = await MCP.getConnectedDatabases(metadata);

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const objectMask = Interpreter.createMask(objectName);

        let relationCount = 0;
        let routineCount = 0;

        for (const database of databases) {
            const schemas = await database.getSchemaList(
                schemaMask ? { name: schemaMask } : undefined
            );

            const perSchemaMatches = await Promise.all(
                schemas.map(async (schema) => {
                    const [relations, routines] = await Promise.all([
                        schema.getRelationList({ name: objectMask }),
                        schema.getRoutineList({ name: objectMask }),
                    ]);

                    return {
                        relations: relations.length,
                        routines: routines.length,
                    };
                })
            );

            for (const match of perSchemaMatches) {
                relationCount += match.relations;
                routineCount += match.routines;
            }
        }

        const total = relationCount + routineCount;

        if (total === 0) return false;
        if (total > 1) return "many";
        if (relationCount === 1) return "relation";
        if (routineCount === 1) return "routine";

        return "one";
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
        schemaName?: string | null
    ): Promise<{ columns: ColumnDefinition[]; rows: any[] }> {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const databases = await MCP.getConnectedDatabases(metadata);

        const schemaLists = await Promise.all(
            databases.map((db) => db.getSchemaList(schemaMask ? { name: schemaMask } : undefined))
        );

        const rows: any[] = [];

        for (let i = 0; i < databases.length; i++) {
            const db = databases[i];
            const schemas = schemaLists[i] ?? [];

            for (const schema of schemas) {
                rows.push({
                    database: db.name,
                    schema: schema.name,
                    owner: schema.owner,
                    description: schema.description,
                });
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

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const objectMask = objectName ? Interpreter.createMask(objectName) : undefined;

        const rows: any[] = [];

        for (const database of await MCP.getConnectedDatabases(metadata)) {
            const schemas = await database.getSchemaList(
                schemaMask ? { name: schemaMask } : undefined
            );

            const relationLists = await Promise.all(
                schemas.map((schema) =>
                    schema.getRelationList(objectMask ? { name: objectMask } : undefined)
                )
            );

            for (let i = 0; i < schemas.length; i++) {
                const schema = schemas[i];
                const relations = relationLists[i] ?? [];

                for (const relation of relations) {
                    if (type && relation.relationType !== type) {
                        continue;
                    }

                    rows.push({
                        database: database.name,
                        schema: schema.name,
                        owner: relation.owner,
                        relation: relation.name,
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

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const objectMask = objectName ? Interpreter.createMask(objectName) : undefined;

        const rows: any[] = [];

        for (const database of await MCP.getConnectedDatabases(metadata)) {
            const schemas = await database.getSchemaList(
                schemaMask ? { name: schemaMask } : undefined
            );

            const routineLists = await Promise.all(
                schemas.map((schema) =>
                    schema.getRoutineList(objectMask ? { name: objectMask } : undefined)
                )
            );

            for (let i = 0; i < schemas.length; i++) {
                const schema = schemas[i];
                const routines = routineLists[i] ?? [];
                const overloadByName = new Map<string, number>();

                for (const routine of routines) {
                    if (type && routine.routineType !== type) {
                        continue;
                    }

                    const overload = (overloadByName.get(routine.name) ?? 0) + 1;
                    overloadByName.set(routine.name, overload);

                    rows.push({
                        database: database.name,
                        schema: schema.name,
                        owner: routine.owner,
                        overload,
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
        schemaName: string | null,
        objectName: string | null,
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

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const objectMask = objectName ? Interpreter.createMask(objectName) : undefined;

        const rows: any[] = [];

        for (const database of await MCP.getConnectedDatabases(metadata)) {
            const schemas = await database.getSchemaList(
                schemaMask ? { name: schemaMask } : undefined
            );

            const perSchemaData = await Promise.all(
                schemas.map(async (schema) => {
                    const [relations, routines] = await Promise.all([
                        schema.getRelationList(objectMask ? { name: objectMask } : undefined),
                        schema.getRoutineList(objectMask ? { name: objectMask } : undefined),
                    ]);
                    return { schema, relations, routines };
                })
            );

            for (const item of perSchemaData) {
                for (const relation of item.relations) {
                    rows.push({
                        database: database.name,
                        schema: item.schema.name,
                        object: relation.name,
                        owner: relation.owner,
                        type: relation.relationType,
                        kind: relation.kind,
                        description: relation.description,
                    });
                }

                for (const routine of item.routines) {
                    rows.push({
                        database: database.name,
                        schema: item.schema.name,
                        object: routine.name,
                        owner: routine.owner,
                        type: routine.routineType,
                        kind: routine.kind,
                        description: routine.description,
                    });
                }
            }
        }

        return { columns, rows };
    }

    private static async getArguments(
        metadata: MetadataQueryApi,
        schemaName: string | null,
        routineName: string | null
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

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const routineMask = routineName ? Interpreter.createMask(routineName) : undefined;

        const rows: any[] = [];

        for (const database of await MCP.getConnectedDatabases(metadata)) {
            const schemas = await database.getSchemaList(
                schemaMask ? { name: schemaMask } : undefined
            );

            const routineLists = await Promise.all(
                schemas.map((schema) =>
                    schema.getRoutineList(routineMask ? { name: routineMask } : undefined)
                )
            );

            for (let i = 0; i < schemas.length; i++) {
                const schema = schemas[i];
                const routines = routineLists[i] ?? [];
                const overloadByName = new Map<string, number>();

                for (const routine of routines) {
                    const overload = (overloadByName.get(routine.name) ?? 0) + 1;
                    overloadByName.set(routine.name, overload);

                    for (const arg of routine.arguments ?? []) {
                        rows.push({
                            database: database.name,
                            schema: schema.name,
                            routine: routine.name,
                            overload,
                            no: arg.no,
                            argument: arg.name,
                            dataType: arg.dataType,
                            mode: arg.mode,
                            defaultValue: arg.defaultValue,
                            description: arg.description,
                        });
                    }

                    if (routine.returnType) {
                        rows.push({
                            database: database.name,
                            schema: schema.name,
                            routine: routine.name,
                            overload,
                            no: null,
                            argument: null,
                            dataType: routine.returnType,
                            mode: "return",
                            defaultValue: null,
                            description: null,
                        });
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static async getColumns(
        metadata: MetadataQueryApi,
        schemaName: string | null,
        relationName: string | null
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

        const schemaMask = schemaName ? Interpreter.createMask(schemaName) : undefined;
        const relationMask = relationName ? Interpreter.createMask(relationName) : undefined;

        const rows: any[] = [];

        for (const database of await MCP.getConnectedDatabases(metadata)) {
            const schemas = await database.getSchemaList(
                schemaMask ? { name: schemaMask } : undefined
            );

            const relationLists = await Promise.all(
                schemas.map((schema) =>
                    schema.getRelationList(relationMask ? { name: relationMask } : undefined)
                )
            );

            for (let i = 0; i < schemas.length; i++) {
                const schema = schemas[i];
                const relations = relationLists[i] ?? [];

                for (const relation of relations) {
                    for (const column of relation.columns ?? []) {
                        rows.push({
                            database: database.name,
                            schema: schema.name,
                            relation: relation.name,
                            no: column.no,
                            column: column.name,
                            dataType: column.dataType,
                            nullable: column.nullable,
                            defaultValue: column.defaultValue,
                            description: column.description,
                        });
                    }
                }
            }
        }

        return { columns, rows };
    }

}

const MCP = CommandProcessor;
