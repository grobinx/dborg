import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { Definition, Interpreter } from "@renderer/utils/SqlParser/interpreter";
import { Tokenizer } from "@renderer/utils/SqlParser/tokenizer";
import { DatabasesMetadata, DatabaseMetadata, RelationType, RoutineType } from "src/api/db/Metadata";

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
    private static createDefinition(metadata: DatabasesMetadata): Definition<GridResult> {
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
                    action() {
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
                    action(values) {
                        return MCP.getSchemas(metadata, values.schema ?? null);
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
                    action(values) {
                        return MCP.getRelations(metadata, values.soo?.schema ?? null, values.soo?.object ?? null);
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
                    action(values) {
                        return MCP.getRoutines(metadata, values.soo?.schema ?? null, values.soo?.object ?? null);
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
                    action(values) {
                        if (!values.soo?.schema && values.soo?.object) {
                            const isSchema = MCP.isSchema(metadata, values.soo.object);
                            if (isSchema === "one") {
                                return MCP.getObjects(metadata, values.soo.object, null);
                            } else if (isSchema === "many") {
                                return MCP.getSchemas(metadata, values.soo.object);
                            } else {
                                const isObject = MCP.isObject(metadata, null, values.soo.object);
                                if (isObject) {
                                    if (isObject === "relation") {
                                        return MCP.getColumns(metadata, null, values.soo.object);
                                    } else if (isObject === "routine") {
                                        return MCP.getArguments(metadata, null, values.soo.object);
                                    } else if (isObject === "many") {
                                        return MCP.getObjects(metadata, null, values.soo.object);
                                    }
                                }
                            }
                        } else if (values.soo?.schema && values.soo?.object) {
                            const isObject = MCP.isObject(metadata, values.soo.schema, values.soo.object);
                            if (isObject === "relation") {
                                return MCP.getColumns(metadata, values.soo.schema, values.soo.object);
                            } else if (isObject === "routine") {
                                return MCP.getArguments(metadata, values.soo.schema, values.soo.object);
                            } else if (isObject === "many") {
                                return MCP.getObjects(metadata, values.soo.schema, values.soo.object);
                            }
                        }
                        return null;
                    },
                }
            ]
        };

        return definition;
    }

    static processCommand(command: string, metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } | null {
        const tokens = new Tokenizer(command).tokenize();
        const definition = MCP.createDefinition(metadata);
        const interpreter = new Interpreter(tokens, definition);
        return interpreter.interpret();
    }

    private static isSchema(metadata: DatabasesMetadata, name: string): "one" | "many" | false {
        const matchingSchemas = MCP.getConnectedDatabases(metadata).flatMap(db =>
            Object.values(db.schemas).filter(schema => Interpreter.maskMatch(name, schema.name))
        );
        if (matchingSchemas.length === 0) {
            return false;
        } else if (matchingSchemas.length === 1) {
            return "one";
        } else {
            return "many";
        }
    }

    private static isObject(metadata: DatabasesMetadata, schemaName: string | null, objectName: string): "one" | "many" | "relation" | "routine" | false {
        const matchingObjects = MCP.getConnectedDatabases(metadata).flatMap(db =>
            Object.values(db.schemas)
                .filter(schema => Interpreter.maskMatch(schemaName, schema.name))
                .flatMap(schema => {
                    const relations = Object.values(schema.relations)
                        .filter(relation => Interpreter.maskMatch(objectName, relation.name));

                    const routines = schema.routines
                        ? Object.values(schema.routines)
                            .flatMap(routines => routines)
                            .filter(routine => Interpreter.maskMatch(objectName, routine.name))
                        : [];

                    return [...relations, ...routines];
                })
        );

        if (matchingObjects.length === 0) {
            return false;
        }
        if (matchingObjects.length === 1) {
            const obj = matchingObjects[0];
            if ("columns" in obj) {
                return "relation";
            } else if ("parameters" in obj) {
                return "routine";
            }
            return "one";
        }
        return "many";
    }


    private static getConnectedDatabases(metadata: DatabasesMetadata): DatabaseMetadata[] {
        return Object.values(metadata).filter(db => db.connected);
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

    private static getSchemas(metadata: DatabasesMetadata, schemaName?: string | null): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => Interpreter.maskMatch(schemaName ?? null, schema.name))) {
                rows.push({
                    database: database.name,
                    schema: schema.name,
                    owner: schema.owner,
                    description: schema.description,
                });
            }
        }

        return { columns, rows };
    }

    private static getRelations(metadata: DatabasesMetadata, schemaName: string | null, objectName: string | null, type?: RelationType): { columns: ColumnDefinition[]; rows: any[] } {
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

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => Interpreter.maskMatch(schemaName, schema.name))) {
                for (const relation of Object.values(schema.relations).filter(relation => Interpreter.maskMatch(objectName, relation.name))) {
                    if (type && relation.type !== type) {
                        continue;
                    }
                    rows.push({
                        database: database.name,
                        schema: schema.name,
                        owner: relation.owner,
                        relation: relation.name,
                        type: relation.type,
                        kind: relation.kind,
                        columns: Object.keys(relation.columns).length,
                        description: relation.description,
                    });
                }
            }
        }

        return { columns, rows };
    }

    private static getRoutines(metadata: DatabasesMetadata, schemaName: string | null, objectName: string | null, type?: RoutineType): { columns: ColumnDefinition[]; rows: any[] } {
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

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => Interpreter.maskMatch(schemaName ?? null, schema.name))) {
                if (schema.routines) {
                    for (const routines of Object.values(schema.routines).filter(routines => Interpreter.maskMatch(objectName ?? null, routines[0]?.name ?? null))) {
                        for (const [index, routine] of routines.entries()) {
                            if (type && routine.type !== type) {
                                continue;
                            }
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                owner: routine.owner,
                                overload: index + 1,
                                routine: routine.name,
                                type: routine.type,
                                kind: routine.kind,
                                arguments: routine?.arguments?.length ?? 0,
                                description: routine.description,
                            });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getObjects(
        metadata: DatabasesMetadata,
        schemaName: string | null,
        objectName: string | null,
    ): { columns: ColumnDefinition[]; rows: any[] } {
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

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema =>
                Interpreter.maskMatch(schemaName, schema.name)
            )) {
                // relations
                for (const relation of Object.values(schema.relations).filter(relation =>
                    Interpreter.maskMatch(objectName, relation.name)
                )) {
                    rows.push({
                        database: database.name,
                        schema: schema.name,
                        object: relation.name,
                        owner: relation.owner,
                        type: relation.type,
                        kind: relation.kind,
                        description: relation.description,
                    });
                }

                // routines
                if (schema.routines) {
                    for (const routines of Object.values(schema.routines)) {
                        for (const [index, routine] of routines.entries()) {
                            if (!Interpreter.maskMatch(objectName, routine.name)) {
                                continue;
                            }
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                object: routine.name,
                                owner: routine.owner,
                                type: routine.type,
                                kind: routine.kind,
                                description: routine.description,
                            });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getArguments(metadata: DatabasesMetadata, schemaName: string | null, routineName: string | null): { columns: ColumnDefinition[]; rows: any[] } {
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

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => Interpreter.maskMatch(schemaName, schema.name))) {
                if (schema.routines) {
                    for (const routines of Object.values(schema.routines)) {
                        for (const [index, routine] of routines.entries()) {
                            if (Interpreter.maskMatch(routineName, routine.name)) {
                                for (const arg of routine.arguments || []) {
                                    rows.push({
                                        database: database.name,
                                        schema: schema.name,
                                        routine: routine.name,
                                        overload: index + 1,
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
                                        overload: index + 1,
                                        argument: undefined,
                                        dataType: routine.returnType,
                                        mode: "return",
                                        defaultValue: undefined,
                                        description: undefined,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getColumns(metadata: DatabasesMetadata, schemaName: string | null, relationName: string | null): { columns: ColumnDefinition[]; rows: any[] } {
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

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => Interpreter.maskMatch(schemaName, schema.name))) {
                for (const relation of Object.values(schema.relations)) {
                    if (Interpreter.maskMatch(relationName, relation.name)) {
                        for (const column of Object.values(relation.columns)) {
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
        }

        return { columns, rows };
    }

}

const MCP = CommandProcessor;
