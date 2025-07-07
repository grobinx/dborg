import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { DatabasesMetadata, DatabaseMetadata, SchemaMetadata, RelationMetadata, ColumnMetadata, RelationKind, RelationType, RoutineType } from "src/api/db/Metadata";

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
 * /functions | /f - wyświetla funkcje w domyślnych schematach w aktywnej bazie danych
 * /functions | /f <schema> - wyświetla funkcje w konkretnym schemacie
 * /procedures | /p - wyświetla procedury w domyślnych schematach w aktywnej bazie danych
 * /procedures | /p <schema> - wyświetla procedury w konkretnym schemacie
 * /columns | /c [<schema>.]<relation> - wyświetla kolumny w tabeli
 * /indexes | /i [<schema>.]<relation> - wyświetla indeksy w tabeli
 * /constraints | /co [<schema>.]<relation> - wyświetla ograniczenia w tabeli
 * /foreign keys [<schema>.]<relation> - wyświetla klucze obce w tabeli
 * /primary key [<schema>.]<relation> - wyświetla klucze główne w tabeli
 * <table> - wyświetla kolumny w tabeli
 * <schema> - wyświetla relacje w schemacie
 * <schema>.<table> - wyświetla kolumny w tabeli
 */

export class MetadataCommandProcessor {
    static processCommand(command: string, metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } | null {
        if (!command.startsWith("/")) {
            return null; // Polecenie musi zaczynać się od "/"
        }

        const parts = command.slice(1).split(" "); // Usuń "/" i podziel na części
        const mainCommand = parts[0].toLowerCase(); // Główne polecenie
        const args = parts.slice(1); // Argumenty polecenia

        switch (mainCommand) {
            case "d":
            case "databases":
                return MetadataCommandProcessor.getDatabases(metadata);
            case "s":
            case "schemas":
                return MetadataCommandProcessor.getSchemas(metadata);
            case "rel":
            case "relations":
                return MetadataCommandProcessor.getRelations(metadata, args[0]);
            case "t":
            case "tables":
                return MetadataCommandProcessor.getRelations(metadata, args[0], "table");
            case "v":
            case "views":
                return MetadataCommandProcessor.getRelations(metadata, args[0], "view");
            case "r":
            case "routines":
                return MetadataCommandProcessor.getRoutines(metadata, args[0]);
            case "f":
            case "functions":
                return MetadataCommandProcessor.getRoutines(metadata, args[0], "function");
            case "p":
            case "procedures":
                return MetadataCommandProcessor.getRoutines(metadata, args[0], "procedure");
            case "c":
            case "columns":
                return MetadataCommandProcessor.getColumns(metadata, args[0]);
            case "i":
            case "indexes":
                return MetadataCommandProcessor.getIndexes(metadata, args[0]);
            case "co":
            case "constraints":
                return MetadataCommandProcessor.getConstraints(metadata, args[0]);
            case "foreign":
                if (args[0]?.toLowerCase() === "keys") {
                    return MetadataCommandProcessor.getForeignKeys(metadata, args[1]);
                }
                break;
            case "primary":
                if (args[0]?.toLowerCase() === "key") {
                    return MetadataCommandProcessor.getPrimaryKey(metadata, args[1]);
                }
                break;
            default:
                // Obsługa poleceń typu "<schema>", "<table>", "<schema>.<table>"
                if (args.length === 0) {
                    return MetadataCommandProcessor.getSchemaRelations(metadata, mainCommand);
                } else if (args.length === 1) {
                    return MetadataCommandProcessor.getTableColumns(metadata, mainCommand);
                } else if (args.length === 2 && mainCommand.includes(".")) {
                    const [schema, table] = mainCommand.split(".");
                    return MetadataCommandProcessor.getColumns(metadata, `${schema}.${table}`);
                }
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

    private static getSchemas(metadata: DatabasesMetadata): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                rows.push({
                    database: dbName,
                    schema: schema.name,
                    owner: schema.owner,
                    description: schema.description,
                });
            }
        }

        return { columns, rows };
    }

    private static getRelations(metadata: DatabasesMetadata, schemaName?: string, type?: RelationType): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "kind", label: "Kind", dataType: "string" }, 
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                if (!schemaName || schema.name.toLowerCase() === schemaName.toLowerCase()) {
                    for (const relation of Object.values(schema.relations)) {
                        if (type && relation.type !== type) {
                            continue;
                        }
                        rows.push({
                            database: dbName,
                            schema: schema.name,
                            owner: relation.owner,
                            relation: relation.name,
                            type: relation.type,
                            kind: relation.kind,
                            description: relation.description,
                        });
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getRoutines(metadata: DatabasesMetadata, schemaName?: string, type?: RoutineType): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "owner", label: "Owner", dataType: "string" },
            { key: "overload", label: "Overload", dataType: "number" },
            { key: "routine", label: "Routine", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                if (!schemaName || schema.name.toLowerCase() === schemaName.toLowerCase()) {
                    if (schema.routines) {
                        for (const routines of Object.values(schema.routines)) {
                            for (const [index, routine] of routines.entries()) {
                                if (type && routine.type !== type) {
                                    continue;
                                }
                                rows.push({
                                    database: dbName,
                                    schema: schema.name,
                                    owner: routine.owner,
                                    overload: index + 1,
                                    routine: routine.name,
                                    type: routine.type,
                                    description: routine.description,
                                });
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
            { key: "column", label: "Column", dataType: "string" },
            { key: "dataType", label: "Data Type", dataType: "string" },
            { key: "nullable", label: "Nullable", dataType: "boolean" },
            { key: "defaultValue", label: "Default Value", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                for (const relation of Object.values(schema.relations)) {
                    if (relation.name.toLowerCase() === relationName.toLowerCase()) {
                        for (const column of Object.values(relation.columns)) {
                            rows.push({
                                database: dbName,
                                schema: schema.name,
                                relation: relation.name,
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
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                for (const relation of Object.values(schema.relations)) {
                    if (relation.name.toLowerCase() === relationName.toLowerCase()) {
                        for (const index of Object.values(relation.indexes || {})) {
                            rows.push({
                                database: dbName,
                                schema: schema.name,
                                relation: relation.name,
                                index: index.name,
                                columns: index.columns,
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
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                for (const relation of Object.values(schema.relations)) {
                    if (relation.name.toLowerCase() === relationName.toLowerCase()) {
                        for (const constraint of Object.values(relation.constraints || {})) {
                            rows.push({
                                database: dbName,
                                schema: schema.name,
                                relation: relation.name,
                                constraint: constraint.name,
                                type: constraint.type,
                                description: constraint.description,
                            });
                        }
                    }
                }
            }
        }

        return { columns, rows };
    }

    private static getForeignKeys(metadata: DatabasesMetadata, relationName?: string): { columns: ColumnDefinition[]; rows: any[] } {
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
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                for (const relation of Object.values(schema.relations)) {
                    if (!relationName || relation.name.toLowerCase() === relationName.toLowerCase()) {
                        for (const foreignKey of Object.values(relation.foreignKeys || {})) {
                            rows.push({
                                database: dbName,
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

    private static getPrimaryKey(metadata: DatabasesMetadata, relationName?: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "primaryKey", label: "Primary Key", dataType: "string" },
            { key: "columns", label: "Columns", dataType: "string" },
            { key: "description", label: "Description", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            for (const schema of Object.values(dbMetadata.schemas)) {
                for (const relation of Object.values(schema.relations)) {
                    if (!relationName || relation.name.toLowerCase() === relationName.toLowerCase()) {
                        if (relation.primaryKey) {
                            rows.push({
                                database: dbName,
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

    private static getSchemaRelations(metadata: DatabasesMetadata, schemaName: string): { columns: ColumnDefinition[]; rows: any[] } {
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "type", label: "Type", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            const schema = dbMetadata.schemas[schemaName];
            if (schema) {
                for (const relation of Object.values(schema.relations)) {
                    rows.push({
                        database: dbName,
                        schema: schema.name,
                        relation: relation.name,
                        type: relation.type,
                    });
                }
            }
        }

        return { columns, rows };
    }

    private static getTableColumns(metadata: DatabasesMetadata, tableName: string): { columns: ColumnDefinition[]; rows: any[] } {
        const [schemaName, relationName] = tableName.split(".");
        const columns: ColumnDefinition[] = [
            { key: "database", label: "Database", dataType: "string" },
            { key: "schema", label: "Schema", dataType: "string" },
            { key: "relation", label: "Relation", dataType: "string" },
            { key: "column", label: "Column", dataType: "string" },
            { key: "dataType", label: "Data Type", dataType: "string" },
            { key: "nullable", label: "Nullable", dataType: "boolean" },
            { key: "defaultValue", label: "Default Value", dataType: "string" },
        ];

        const rows: any[] = [];
        for (const [dbName, dbMetadata] of Object.entries(metadata)) {
            const schema = dbMetadata.schemas[schemaName];
            if (schema) {
                const relation = schema.relations[relationName];
                if (relation) {
                    for (const column of Object.values(relation.columns)) {
                        rows.push({
                            database: dbName,
                            schema: schema.name,
                            relation: relation.name,
                            column: column.name,
                            dataType: column.dataType,
                            nullable: column.nullable,
                            defaultValue: column.defaultValue,
                        });
                    }
                }
            }
        }

        return { columns, rows };
    }
}