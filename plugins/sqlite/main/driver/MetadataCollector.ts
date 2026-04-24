// c:\projekty\mPak\nodejs\dborg\plugins\sqlite\main\driver\MetadataCollector.ts

import * as api from '../../../../src/api/db';
import sqlite3 from 'sqlite3';
import { Connection } from '.';

export class MetadataCollector implements api.IMetadataCollector {
    private metadata: api.Metadata = { status: "pending" };
    private db: sqlite3.Database | undefined;
    private collectionOptions?: api.MetadataCollectionOptions;
    private mainDatabaseName: string = 'main';
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
        this.collectionOptions = {
            relationStats: true,
            relationColumnStats: false,
            identifiers: false,
            indexStats: false,
            systemObjects: true,
            builtInObjects: true,
            constraints: true,
            permissions: true,
        };
    }

    setDatabase(db: sqlite3.Database): void {
        this.db = db;
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db!.all(sql, params || [], (err: Error | null, rows: T[]) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.db!.get(sql, params || [], (err: Error | null, row: T) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async collect(progress?: (current: string) => void): Promise<api.Metadata> {
        this.db = new sqlite3.Database(this.connection.getProperties()['driver:database_location'] as string, sqlite3.OPEN_READONLY);
        try {
            await this.initialize(progress);
        } finally {
            this.db!.close();
        }
        return this.metadata;
    }

    async initialize(progress?: (current: string) => void): Promise<void> {
        this.metadata = {
            status: "collecting",
            version: api.METADATA_VERSION,
            date: Date.now(),
            databases: {},
            collected: this.collectionOptions,
        };

        await this.updateDatabases(progress);
        await this.updateTables(progress);
        if (this.collectionOptions?.relationStats) {
            await this.updateTableStats(progress);
        }
        await this.updateIndexes(progress);
        if (this.collectionOptions?.constraints) {
            await this.updateForeignKeys(progress);
        }

        this.metadata.status = "ready";
    }

    private quoteSqliteString(value: string): string {
        return `'${value.replace(/'/g, "''")}'`;
    }

    async updateDatabases(progress?: (current: string) => void): Promise<void> {
        if (progress) {
            progress("databases");
        }

        // SQLite ma jedno główne database 'main' i opcjonalnie attached databases
        const rows = await this.query<{ schema: string; file: string }>(
            `PRAGMA database_list;`
        );

        this.metadata.databases = this.metadata.databases ?? {};

        for (const row of rows) {
            const dbName = row.schema || this.mainDatabaseName;
            const filename = row.file || ':memory:';

            this.metadata.databases[dbName] = {
                objectType: "database",
                id: dbName,
                name: dbName,
                identity: dbName,
                owner: null,
                description: filename === ':memory:' ? 'In-memory database' : filename,
                connected: true,
                template: false,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                schemas: {},
                permissions: {
                    connect: true,
                    create: true,
                    temp: true
                }
            };
        }
    }

    private connectedDatabase(): api.DatabaseMetadata {
        const database = this.metadata.databases?.[this.mainDatabaseName];
        if (!database) {
            throw new Error("No connected database found");
        }
        return database;
    }

    /**
     * W SQLite brak tradycyjnych schematów, więc wszystkie obiekty traktujemy
     * jako należące do jednego "public" schematu
     */
    private ensureDefaultSchema(): api.SchemaMetadata {
        const database = this.connectedDatabase();
        const schemaName = 'main';

        if (!database.schemas[schemaName]) {
            database.schemas[schemaName] = {
                objectType: "schema",
                id: schemaName,
                name: schemaName,
                identity: schemaName,
                description: 'Default SQLite schema',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                relations: {},
                routines: {},
                types: {},
                sequences: {},
                permissions: {
                    create: true,
                    usage: true
                }
            };
        }

        return database.schemas[schemaName];
    }

    async updateTables(progress?: (current: string) => void, name?: string): Promise<void> {
        const database = this.connectedDatabase();
        const schema = this.ensureDefaultSchema();

        if (progress) {
            progress("tables");
        }

        // Pobierz listę wszystkich tabel i widoków
        const rows = await this.query<{
            type: string;
            name: string;
            tbl_name: string;
            rootpage: number;
        }>(
            `SELECT type, name, tbl_name, rootpage FROM sqlite_master 
             WHERE type IN ('table', 'view')
             AND name NOT LIKE 'sqlite_%'
             ${name ? `AND name = ?` : ''}
             ORDER BY name`,
            name ? [name] : []
        );

        for (const row of rows) {
            const isView = row.type === 'view';
            const tableName = row.name;

            const relation: api.RelationMetadata = {
                objectType: "relation",
                id: `${this.mainDatabaseName}.${tableName}`,
                name: tableName,
                identity: tableName,
                relationType: isView ? 'view' : 'table',
                kind: 'regular',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: [],
                permissions: {
                    select: true,
                    insert: !isView,
                    update: !isView,
                    delete: !isView
                }
            };

            schema.relations[tableName] = relation;

            await this.updateTableDetails(tableName);
        }

    }

    async updateTableDetails(name?: string): Promise<void> {
        const schema = this.ensureDefaultSchema();

        for (const [tableName, relation] of Object.entries(schema.relations)) {
            if (name && tableName !== name) continue;

            // Pobierz kolumny
            const columns = await this.query<{
                cid: number;
                name: string;
                type: string;
                notnull: number;
                dflt_value: string | null;
                pk: number;
            }>(
                `PRAGMA table_info(${this.quoteSqliteString(tableName)});`
            );

            relation.columns = columns.map(col => ({
                id: `${tableName}.${col.name}`,
                name: col.name,
                identity: col.name,
                no: col.cid,
                dataType: col.type || 'TEXT',
                displayType: col.type || 'TEXT',
                nullable: col.notnull === 0,
                defaultValue: col.dflt_value,
                primaryKey: col.pk > 0,
                foreignKey: false,
                unique: false,
                permissions: {
                    select: true,
                    update: true
                }
            }));

            // Oznacz kolumny które są w FK
            const fkList = await this.query<{ id: number; seq: number; table: string; from: string; to: string; on_delete: string; on_update: string }>(
                `PRAGMA foreign_key_list(${this.quoteSqliteString(tableName)});`
            );

            for (const fk of fkList) {
                const col = relation.columns.find(c => c.name === fk.from);
                if (col) {
                    col.foreignKey = true;
                }
            }
        }
    }

    async updateTableStats(progress?: (current: string) => void, name?: string): Promise<void> {
        const schema = this.ensureDefaultSchema();

        if (progress) {
            progress("table statistics");
        }

        for (const [tableName, relation] of Object.entries(schema.relations)) {
            if (name && tableName !== name) continue;
            if (relation.relationType === 'view') continue; // Widoki nie mają statystyk

            try {
                const countResult = await this.queryOne<{ count: number }>(
                    `SELECT COUNT(*) as count FROM ${this.quoteSqliteString(tableName)};`
                );

                relation.stats = {
                    rows: countResult?.count ?? null,
                };
            } catch (error) {
                // Jeśli liczenie nie zadziała (np. widok systemowy), pomiń
                relation.stats = undefined;
            }
        }
    }

    async updateIndexes(progress?: (current: string) => void, name?: string): Promise<void> {
        const schema = this.ensureDefaultSchema();

        if (progress) {
            progress("indexes");
        }

        for (const [tableName, relation] of Object.entries(schema.relations)) {
            if (name && tableName !== name) continue;
            if (relation.relationType === 'view') continue;

            const indexes = await this.query<{
                seqno: number;
                cid: number;
                name: string;
            }>(
                `PRAGMA index_list(${this.quoteSqliteString(tableName)});`
            );

            relation.indexes = [];

            for (const idx of indexes) {
                const indexInfo = await this.query<{ seqno: number; cid: number; name: string }>(
                    `PRAGMA index_info(${this.quoteSqliteString(idx.name)});`
                );

                const indexColumns = await this.query<{ seqno: number; cid: number; name: string }>(
                    `PRAGMA index_info(${this.quoteSqliteString(idx.name)});`
                );

                const indexMetadata: api.IndexMetadata = {
                    id: idx.name,
                    name: idx.name,
                    identity: idx.name,
                    columns: indexColumns.map(col => ({
                        name: col.name,
                        identity: col.name
                    })),
                    unique: false, // SQLite PRAGMA index_list zwraca unique flag, ale nie w queryzie
                    primary: false
                };

                relation.indexes.push(indexMetadata);
            }

            // Pobierz primary key
            const pkInfo = await this.query<{ cid: number; name: string; type: string; pk: number }>(
                `PRAGMA table_info(${this.quoteSqliteString(tableName)});`
            );

            const pkColumns = pkInfo.filter(col => col.pk > 0).map(col => col.name);
            if (pkColumns.length > 0) {
                relation.primaryKey = {
                    id: `${tableName}_pk`,
                    name: `${tableName}_pk`,
                    columns: pkColumns
                };
            }
        }
    }

    async updateForeignKeys(progress?: (current: string) => void, name?: string): Promise<void> {
        const schema = this.ensureDefaultSchema();

        if (progress) {
            progress("foreign keys");
        }

        for (const [tableName, relation] of Object.entries(schema.relations)) {
            if (name && tableName !== name) continue;
            if (relation.relationType === 'view') continue;

            const fkList = await this.query<{
                id: number;
                seq: number;
                table: string;
                from: string;
                to: string;
                on_delete: string;
                on_update: string;
            }>(
                `PRAGMA foreign_key_list(${this.quoteSqliteString(tableName)});`
            );

            relation.foreignKeys = fkList.map(fk => ({
                id: `${tableName}_fk_${fk.id}`,
                name: `${tableName}_fk_${fk.id}`,
                column: [fk.from],
                referencedSchema: 'main',
                referencedTable: fk.table,
                referencedColumn: [fk.to],
                onDelete: fk.on_delete?.toLowerCase() as api.ForeignKeyActionType,
                onUpdate: fk.on_update?.toLowerCase() as api.ForeignKeyActionType
            }));
        }
    }
}