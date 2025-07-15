import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { DatabasesMetadata, DatabaseMetadata, RelationType, RoutineType } from "src/api/db/Metadata";

/**
 * Polecenia
 * /databases | /d - wyświetla bazy danych
 * /schemas | /s - wyświetla schematy w aktywnej bazie danych
 * /relations | /r - wyświetla relacje w domyślnych schematach w aktywnej bazie danych
 * /relations | /r <schema> - wyświetla relacje w konkretnym schemacie
 * /tables | /t - wyświetla tabele w domyślnych schematach w aktywnej bazie danych
 * /tables | /t <schema> - wyświetla tabele w konkretnym schemacie
 * /views | /v - wyświetla widoki w domyślnych schematach w aktywnej bazie danych
 * /views | /v <schema> - wyświetla widoki w konkretnym schemacie
 * /routines | /r - wyświetla procedury i funkcje w domyślnych schematach w aktywnej bazie danych
 * /routines | /r <schema> - wyświetla procedury i funkcje w konkretnym schemacie
 * /arguments | /a [<schema>.]<routine> - wyświetla argumenty procedury lub funkcji
 * /functions | /f - wyświetla funkcje w domyślnych schematach w aktywnej bazie danych
 * /functions | /f <schema> - wyświetla funkcje w konkretnym schemacie
 * /procedures | /p - wyświetla procedury w domyślnych schematach w aktywnej bazie danych
 * /procedures | /p <schema> - wyświetla procedury w konkretnym schemacie
 * /columns | /c [<schema>.]<relation> - wyświetla kolumny w tabeli
 * /indexes | /i [<schema>.]<relation> - wyświetla indeksy w tabeli
 * /constraints | /co [<schema>.]<relation> - wyświetla ograniczenia w tabeli
 * /foreign keys [<schema>.]<relation> - wyświetla klucze obce w tabeli
 * /primary key [<schema>.]<relation> - wyświetla klucze główne w tabeli
 * /types | /ty - wyświetla typy danych w aktywnej bazie danych
 * /types | /ty <schema> - wyświetla typy danych w konkretnym schemacie
 * <table> - wyświetla kolumny w tabeli
 * <schema> - wyświetla relacje w schemacie
 * <schema>.<table> - wyświetla kolumny w tabeli
 * <routine> - wyświetla argumenty procedury lub funkcji
 * <schema>.<routine> - wyświetla argumenty procedury lub funkcji
 */

export type ObjectType = "relation" | "routine" | "schema" | null;

export interface ObjectName {
    quoted: boolean;
    name: string;
    type?: ObjectType;
}

export class MetadataCommandProcessor {
    static processCommand(command: string, metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } | null {
        let mainCommand: string | undefined;
        let args: string[] | undefined;

        if (!command.startsWith("/")) {
            if (!/^(?:"([^"]+)"\.|"([a-zA-Z_][a-zA-Z0-9_]*)"\.|([a-zA-Z_][a-zA-Z0-9_]*)\.)?(?:"([^"]+)"|([a-zA-Z_][a-zA-Z0-9_]*))$/.test(command)) {
                return null;
            }
            const [schemaName, objectName] = MCP.resolveObjectName(metadata, command);
            if (schemaName && objectName || !schemaName && objectName) {
                if (objectName.type === "relation") {
                    mainCommand = "columns";
                }
                else if (objectName.type === "routine") {
                    mainCommand = "arguments";
                }
                else {
                    return null;
                }
                args = [command];
            }
            else {
                mainCommand = "relations";
                args = [command];
            }
        }
        else {
            const parts = command.slice(1).split(" ");
            mainCommand = parts[0].toLowerCase(); // Główne polecenie
            args = parts.slice(1); // Argumenty polecenia
        }

        switch (mainCommand) {
            case "help":
                return MCP.getHelp(metadata);
            case "d":
            case "databases":
                return MCP.getDatabases(metadata);
            case "s":
            case "schemas":
                return MCP.getSchemas(metadata);
            case "rel":
            case "relations":
                return MCP.getRelations(metadata, args[0]);
            case "t":
            case "tables":
                return MCP.getRelations(metadata, args[0], "table");
            case "v":
            case "views":
                return MCP.getRelations(metadata, args[0], "view");
            case "r":
            case "routines":
                return MCP.getRoutines(metadata, args[0]);
            case "f":
            case "functions":
                return MCP.getRoutines(metadata, args[0], "function");
            case "p":
            case "procedures":
                return MCP.getRoutines(metadata, args[0], "procedure");
            case "a":
            case "arguments":
                return MCP.getArguments(metadata, args[0]);
            case "c":
            case "columns":
                return MCP.getColumns(metadata, args[0]);
            case "i":
            case "indexes":
                return MCP.getIndexes(metadata, args[0]);
            case "co":
            case "constraints":
                return MCP.getConstraints(metadata, args[0]);
            case "foreign":
                if (args[0]?.toLowerCase() === "keys") {
                    return MCP.getForeignKeys(metadata, args[1]);
                }
                break;
            case "primary":
                if (args[0]?.toLowerCase() === "key") {
                    return MCP.getPrimaryKey(metadata, args[1]);
                }
                break;
            case "ty":
            case "types":
                return MCP.getTypes(metadata, args[0]);
        }

        return null; // Jeśli polecenie nie pasuje do żadnego case
    }

    private static getDatabases(metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = Object.entries(metadata).map(([dbName, dbMetadata]) => ({
            database: dbName,
            description: dbMetadata.description || "",
        }));

        return { columns, rows };
    }

    static resolveObjectName(metadata: DatabasesMetadata, name?: string): [ObjectName | null, ObjectName | null] {
        if (!name) {
            return [null, null];
        }

        const parts = name.split(".").map(part => {
            const quoted = part.startsWith('"') && part.endsWith('"');
            const name = quoted ? part.slice(1, -1) : part.toLowerCase();
            return { quoted, name } as ObjectName;
        });

        let schemaName: ObjectName | null = null;
        let objectName: ObjectName | null = null;

        if (parts.length === 1) {
            // Sprawdź, czy podana nazwa jest schematem
            const isSchema = MCP.getConnectedDatabases(metadata).some(db =>
                Object.values(db.schemas).some(schema =>
                    MCP.nameEquals({ quoted: parts[0].quoted, name: schema.name }, parts[0])
                )
            );

            if (isSchema) {
                schemaName = parts[0];
                schemaName.type = "schema";
            } else {
                objectName = parts[0];
                objectName.type = MCP.resolveObjectType(metadata, null, objectName);
            }
        } else if (parts.length === 2) {
            // Podano schemat i obiekt
            schemaName = parts[0];
            schemaName.type = "schema";
            objectName = parts[1];
            objectName.type = MCP.resolveObjectType(metadata, schemaName, objectName);
        }

        return [schemaName, objectName];
    }

    private static resolveObjectType(metadata: DatabasesMetadata, schemaName: ObjectName | null, objectName: ObjectName | null): ObjectType {
        if (!objectName) {
            return null;
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
                    if (MCP.nameEquals({ quoted: objectName.quoted, name: relation.name }, objectName)) {
                        return "relation";
                    }
                }
                if (schema.routines) {
                    for (const routines of Object.values(schema.routines)) {
                        for (const routine of routines) {
                            if (MCP.nameEquals({ quoted: objectName.quoted, name: routine.name }, objectName)) {
                                return "routine";
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    private static nameEquals(n1: ObjectName, n2: ObjectName): boolean {
        if (!n1.quoted) {
            n1.name = n1.name.toLowerCase();
        }
        if (!n2.quoted) {
            n2.name = n2.name.toLowerCase();
        }
        return n1.name === n2.name;
    }

    private static getConnectedDatabases(metadata: DatabasesMetadata): DatabaseMetadata[] {
        return Object.values(metadata).filter(db => db.connected);
    }

    private static getHelp(_metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "command", label: "Command", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [
            { command: "/databases | /d", description: "Displays databases" },
            { command: "/schemas | /s", description: "Displays schemas in the active database" },
            { command: "/relations | /rel", description: "Displays relations in the schemas in the active database" },
            { command: "/relations | /rel <schema>", description: "Displays relations in a specific schema" },
            { command: "/tables | /t", description: "Displays tables in the schemas in the active database" },
            { command: "/tables | /t <schema>", description: "Displays tables in a specific schema" },
            { command: "/views | /v", description: "Displays views in the schemas in the active database" },
            { command: "/views | /v <schema>", description: "Displays views in a specific schema" },
            { command: "/routines | /r", description: "Displays procedures and functions in the schemas in the active database" },
            { command: "/routines | /r <schema>", description: "Displays procedures and functions in a specific schema" },
            { command: "/arguments | /a [<schema>.]<routine>", description: "Displays arguments of a procedure or function" },
            { command: "/functions | /f", description: "Displays functions in the schemas in the active database" },
            { command: "/functions | /f <schema>", description: "Displays functions in a specific schema" },
            { command: "/procedures | /p", description: "Displays procedures in the schemas in the active database" },
            { command: "/procedures | /p <schema>", description: "Displays procedures in a specific schema" },
            { command: "/columns | /c [<schema>.]<relation>", description: "Displays columns in a table" },
            { command: "/indexes | /i [<schema>.]<relation>", description: "Displays indexes in a table" },
            { command: "/constraints | /co [<schema>.]<relation>", description: "Displays constraints in a table" },
            { command: "/foreign keys [<schema>.]<relation>", description: "Displays foreign keys in a table" },
            { command: "/primary key [<schema>.]<relation>", description: "Displays primary keys in a table" },
            { command: "/types | /ty", description: "Displays data types in the active database" },
            { command: "/types | /ty <schema>", description: "Displays data types in a specific schema" },
            { command: "<table>", description: "Displays columns in a table" },
            { command: "<schema>", description: "Displays relations in a schema" },
            { command: "<schema>.<table>", description: "Displays columns in a table" },
            { command: "<routine>", description: "Displays arguments of a procedure or function" },
            { command: "<schema>.<routine>", description: "Displays arguments of a procedure or function" },
        ];

        return { columns, rows };
    }

    private static getSchemas(metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas)) {
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

    private static getRelations(metadata: DatabasesMetadata, typedSchemaName?: string, type?: RelationType): { columns: ColumnDefinition[]; rows: any[] } {
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
        const [schemaName] = MCP.resolveObjectName(metadata, typedSchemaName);

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
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

    private static getRoutines(metadata: DatabasesMetadata, typedSchemaName?: string, type?: RoutineType): { columns: ColumnDefinition[]; rows: any[] } {
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
        const [schemaName] = MCP.resolveObjectName(metadata, typedSchemaName);

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                if (schema.routines) {
                    for (const routines of Object.values(schema.routines)) {
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

    private static getArguments(metadata: DatabasesMetadata, routineName?: string): { columns: ColumnDefinition[]; rows: any[] } {
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
        const [schemaName, objectName] = MCP.resolveObjectName(metadata, routineName);

        if (!objectName) {
            return { columns, rows };
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                if (schema.routines) {
                    for (const routines of Object.values(schema.routines)) {
                        for (const [index, routine] of routines.entries()) {
                            if (MCP.nameEquals({ quoted: objectName.quoted, name: routine.name }, objectName)) {
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

    private static getColumns(metadata: DatabasesMetadata, relationName: string): { columns: ColumnDefinition[]; rows: any[] } {
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
        const [schemaName, objectName] = MCP.resolveObjectName(metadata, relationName);

        if (!objectName) {
            return { columns, rows };
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
                    if (MCP.nameEquals({ quoted: objectName.quoted, name: relation.name }, objectName)) {
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

    private static getIndexes(metadata: DatabasesMetadata, relationName: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "index", label: "Index", dataType: "string" },
            { key: "columns", label: "Columns", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        const [schemaName, objectName] = MCP.resolveObjectName(metadata, relationName);

        if (!objectName) {
            return { columns, rows };
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
                    if (MCP.nameEquals({ quoted: objectName.quoted, name: relation.name }, objectName)) {
                        for (const index of Object.values(relation.indexes || {})) {
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                relation: relation.name,
                                index: index.name,
                                columns: index.columns.map(col => col.name).join(", "),
                                description: index.description,
                            });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getConstraints(metadata: DatabasesMetadata, relationName: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "constraint", label: "Constraint", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "expression", label: "Expression", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        const [schemaName, objectName] = MCP.resolveObjectName(metadata, relationName);

        if (!objectName) {
            return { columns, rows };
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
                    if (MCP.nameEquals({ quoted: objectName.quoted, name: relation.name }, objectName)) {
                        for (const constraint of Object.values(relation.constraints || {})) {
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                relation: relation.name,
                                constraint: constraint.name,
                                type: constraint.type,
                                expression: constraint.expression,
                                description: constraint.description,
                            });
                        }
                        if (relation.indexes) {
                            for (const index of Object.values(relation.indexes).filter(index => index.unique)) {
                                rows.push({
                                    database: database.name,
                                    schema: schema.name,
                                    relation: relation.name,
                                    constraint: index.name,
                                    type: "unique",
                                    expression: `UNIQUE (${index.columns.map(col => col.name).join(", ")})`,
                                    description: index.description,
                                });
                            }
                        }
                        if (relation.primaryKey) {
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                relation: relation.name,
                                constraint: relation.primaryKey.name,
                                type: "primary key",
                                expression: `PRIMARY KEY (${relation.primaryKey.columns.join(", ")})`,
                                description: relation.primaryKey.description,
                            });
                        }
                        if (relation.foreignKeys) {
                            for (const foreignKey of Object.values(relation.foreignKeys)) {
                                rows.push({
                                    database: database.name,
                                    schema: schema.name,
                                    relation: relation.name,
                                    constraint: foreignKey.name,
                                    type: "foreign key",
                                    expression: `FOREIGN KEY (${foreignKey.column.join(", ")}) REFERENCES ${foreignKey.referencedTable}(${foreignKey.referencedColumn.join(", ")})`,
                                    description: foreignKey.description,
                                });
                            }
                        }
                        for (const column of Object.values(relation.columns).filter(column => !column.nullable)) {
                                rows.push({
                                    database: database.name,
                                    schema: schema.name,
                                    relation: relation.name,
                                    constraint: undefined,
                                    type: "not null",
                                    expression: `${column.name} IS NOT NULL`,
                                    description: column.description,
                                });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getForeignKeys(metadata: DatabasesMetadata, relationName: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "foreignKey", label: "Foreign Key", dataType: "string" },
            { key: "referencedTable", label: "Referenced Table", dataType: "string" },
            { key: "columns", label: "Columns", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        const [schemaName, objectName] = MCP.resolveObjectName(metadata, relationName);

        if (!objectName) {
            return { columns, rows };
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
                    if (MCP.nameEquals({ quoted: objectName.quoted, name: relation.name }, objectName)) {
                        for (const foreignKey of Object.values(relation.foreignKeys || {})) {
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                relation: relation.name,
                                foreignKey: foreignKey.name,
                                referencedTable: foreignKey.referencedTable,
                                columns: foreignKey.column,
                                description: foreignKey.description,
                            });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getPrimaryKey(metadata: DatabasesMetadata, relationName: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "primaryKey", label: "Primary Key", dataType: "string" },
            { key: "columns", label: "Columns", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        const [schemaName, objectName] = MCP.resolveObjectName(metadata, relationName);

        if (!objectName) {
            return { columns, rows };
        }

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !schemaName || MCP.nameEquals({ quoted: schemaName.quoted, name: schema.name }, schemaName))) {
                for (const relation of Object.values(schema.relations)) {
                    if (MCP.nameEquals({ quoted: objectName.quoted, name: relation.name }, objectName)) {
                        if (relation.primaryKey) {
                            rows.push({
                                database: database.name,
                                schema: schema.name,
                                relation: relation.name,
                                primaryKey: relation.primaryKey.name,
                                columns: relation.primaryKey.columns.join(", "),
                                description: relation.primaryKey.description,
                            });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getTypes(metadata: DatabasesMetadata, schemaName?: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "kind", label: "Kind", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        const [resolvedSchemaName] = MCP.resolveObjectName(metadata, schemaName);

        for (const database of MCP.getConnectedDatabases(metadata)) {
            for (const schema of Object.values(database.schemas).filter(schema => !resolvedSchemaName || MCP.nameEquals({ quoted: resolvedSchemaName.quoted, name: schema.name }, resolvedSchemaName))) {
                for (const type of Object.values(schema.types || {})) {
                    rows.push({
                        database: database.name,
                        schema: schema.name,
                        owner: type.owner,
                        kind: type.kind,
                        type: type.name,
                        description: type.description,
                    });
                }
            }
        }

        return { columns, rows };
    }

}

const MCP = MetadataCommandProcessor;
