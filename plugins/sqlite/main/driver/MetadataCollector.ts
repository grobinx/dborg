// c:\projekty\mPak\nodejs\dborg\plugins\sqlite\main\driver\MetadataCollector.ts

import * as api from '../../../../src/api/db';
import sqlite3 from 'sqlite3';

const METADATA_ARCHIVE_FORMAT = 'dborg-metadata-ndjson-v1';
const NOT_ARCHIVE_ERROR = '__NOT_DBORG_METADATA_ARCHIVE__';

export class MetadataCollector implements api.IMetadataCollector {
    private metadata: api.Metadata = { status: "pending" };
    private inited = false;
    private db: sqlite3.Database | undefined;
    private collectionOptions?: api.MetadataCollectionOptions;
    private mainDatabaseName: string = 'main';

    setDatabase(db: sqlite3.Database): void {
        this.db = db;
    }

    setCollectionOptions(options: api.MetadataCollectionOptions): void {
        this.collectionOptions = options;
    }

    async restoreMetadata(_fileName: string): Promise<api.Metadata> {
        // SQLite metadata restore not implemented yet
        // Można opcjonalnie zaimplementować jeśli będzie potrzebne
        throw new Error("Metadata restore not implemented for SQLite");
    }

    async storeMetadata(_fileName: string): Promise<void> {
        // SQLite metadata store not implemented yet
        throw new Error("Metadata store not implemented for SQLite");
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
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

    async collect(progress?: (current: string) => void, force?: boolean): Promise<api.Metadata> {
        if (!this.inited || force) {
            if (!this.db) {
                throw new Error("Database not set");
            }
            await this.initialize(progress);
        }
        return this.metadata;
    }

    async updateObject(progress?: (current: string) => void, _schemaName?: string, objectName?: string): Promise<void> {
        // SQLite nie ma schematów w tradycyjnym sensie, ale ma attached databases
        if (objectName) {
            await this.updateTables(progress, objectName);
            await this.updateTableDetails(progress, objectName);
            if (this.collectionOptions?.relationStats) {
                await this.updateTableStats(progress, objectName);
            }
        }
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

        this.inited = true;
    }

    private removeUnused(from: Record<string, any>, exists: Set<string>): void {
        for (const key in from) {
            if (!exists.has(key)) {
                delete from[key];
            }
        }
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
                id: schemaName,
                name: schemaName,
                identity: schemaName,
                owner: null,
                description: 'Default SQLite schema',
                default: true,
                catalog: false,
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
            sql: string;
        }>(
            `SELECT type, name, tbl_name, rootpage, sql FROM sqlite_master 
             WHERE type IN ('table', 'view')
             AND name NOT LIKE 'sqlite_%'
             ${name ? `AND name = ?` : ''}
             ORDER BY name`,
            name ? [name] : []
        );

        const exists = new Set<string>();

        for (const row of rows) {
            const isView = row.type === 'view';
            const tableName = row.name;

            exists.add(tableName);

            const relation: api.RelationMetadata = {
                id: `${this.mainDatabaseName}.${tableName}`,
                name: tableName,
                identity: tableName,
                relationType: isView ? 'view' : 'table',
                kind: 'regular',
                owner: null,
                description: null,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: [],
                identifiers: isView && row.sql ? [row.sql] : null,
                permissions: {
                    select: true,
                    insert: !isView,
                    update: !isView,
                    delete: !isView
                }
            };

            schema.relations[tableName] = relation;
        }

        if (!name) {
            this.removeUnused(schema.relations, exists);
        }
    }

    async updateTableDetails(progress?: (current: string) => void, name?: string): Promise<void> {
        const schema = this.ensureDefaultSchema();

        if (progress) {
            progress("table details");
        }

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
                `PRAGMA table_info(?);`,
                [tableName]
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
                `PRAGMA foreign_key_list(?);`,
                [tableName]
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
                    `SELECT COUNT(*) as count FROM ${tableName};`
                );

                relation.stats = {
                    rows: countResult?.count ?? null,
                    size: null,
                    pages: null,
                    avgRowLength: null,
                    reads: null,
                    writes: null,
                    scans: null,
                    inserts: null,
                    updates: null,
                    deletes: null,
                    lastAnalyze: null
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
                `PRAGMA index_list(?);`,
                [tableName]
            );

            relation.indexes = [];

            for (const idx of indexes) {
                const indexInfo = await this.query<{ seqno: number; cid: number; name: string }>(
                    `PRAGMA index_info(?);`,
                    [idx.name]
                );

                const indexColumns = await this.query<{ seqno: number; cid: number; name: string }>(
                    `PRAGMA index_info(?);`,
                    [idx.name]
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
                `PRAGMA table_info(?);`,
                [tableName]
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
                `PRAGMA foreign_key_list(?);`,
                [tableName]
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