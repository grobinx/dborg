// c:\projekty\mPak\nodejs\dborg\plugins\sqlite\main\driver\MetadataCollector.ts

import * as api from '../../../../src/api/db';
import sqlite3 from 'sqlite3';
import { Connection } from '.';

export class MetadataCollector implements api.IMetadataCollector {
    private metadata: api.Metadata = { status: "pending" };
    private db: sqlite3.Database | undefined;
    private collectionOptions?: api.MetadataCollectionOptions;
    private databaseName: string = 'sqlite';
    private connection: Connection;
    private schemaNames: string[] = [];

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
        await this.ensureAllSchemas(progress);
        await this.updateTables(progress);
        if (this.collectionOptions?.relationStats) {
            await this.updateTableStats(progress);
        }
        await this.updateIndexes(progress);
        if (this.collectionOptions?.constraints) {
            await this.updateForeignKeys(progress);
        }
        if (this.collectionOptions?.systemObjects) {
            await this.updateSystemTables(progress);
        }

        this.metadata.status = "ready";
    }

    private quoteSqliteString(value: string): string {
        return `'${value.replace(/'/g, "''")}'`;
    }

    private quoteSqliteIdentifier(value: string): string {
        return `"${value.replace(/"/g, '""')}"`;
    }

    async updateDatabases(progress?: (current: string) => void): Promise<void> {
        if (progress) {
            progress("databases");
        }

        // Pobierz listę wszystkich schematów (main, temp, attached databases)
        const rows = await this.query<{ seq: number; name: string; file: string }>(
            `PRAGMA database_list;`
        );

        this.schemaNames = rows.map(row => row.name);

        this.metadata.databases = this.metadata.databases ?? {};

        // Tworzymy jedną bazę danych "sqlite" dla całej instancji SQLite
        const filename = rows.find(r => r.name === 'main')?.file || ':memory:';

        this.metadata.databases[this.databaseName] = {
            objectType: "database",
            id: this.databaseName,
            name: this.databaseName,
            identity: this.databaseName,
            owner: null,
            description: filename === '' ? 'In-memory database' : filename,
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

    private getDatabase(): api.DatabaseMetadata {
        const database = this.metadata.databases?.[this.databaseName];
        if (!database) {
            throw new Error("No sqlite database found");
        }
        return database;
    }

    /**
     * Tworzy schematy odpowiadające wynikom PRAGMA database_list
     * Każdy schemat (main, temp, attached databases) ma swoją SchemaMetadata
     */
    private async ensureAllSchemas(progress?: (current: string) => void): Promise<void> {
        if (progress) {
            progress("schemas");
        }

        const database = this.getDatabase();

        for (const schemaName of this.schemaNames) {
            database.schemas[schemaName] = {
                objectType: "schema",
                id: schemaName,
                name: schemaName,
                identity: schemaName,
                description: schemaName === 'main' ? 'Main SQLite database' : 
                             schemaName === 'temp' ? 'Temporary database' : 
                             `Attached database: ${schemaName}`,
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
    }

    /**
     * Pobiera sqlite_master dla danego schematu
     */
    private getSqliteMasterQuery(schemaName: string): string {
        if (schemaName === 'main') {
            return `SELECT type, name, tbl_name, rootpage FROM sqlite_master 
                   WHERE type IN ('table', 'view') 
                   AND name NOT LIKE 'sqlite_%'
                   ORDER BY name`;
        } else {
            return `SELECT type, name, tbl_name, rootpage FROM ${this.quoteSqliteIdentifier(schemaName)}.sqlite_master 
                   WHERE type IN ('table', 'view') 
                   AND name NOT LIKE 'sqlite_%'
                   ORDER BY name`;
        }
    }

    async updateTables(progress?: (current: string) => void): Promise<void> {
        const database = this.getDatabase();

        if (progress) {
            progress("tables");
        }

        // Iteruj po każdym schemacie
        for (const schemaName of this.schemaNames) {
            const schema = database.schemas[schemaName];
            if (!schema) continue;

            const sqlQuery = this.getSqliteMasterQuery(schemaName);

            const rows = await this.query<{
                type: string;
                name: string;
                tbl_name: string;
                rootpage: number;
            }>(sqlQuery);

            for (const row of rows) {
                const isView = row.type === 'view';
                const tableName = row.name;

                const relation: api.RelationMetadata = {
                    objectType: "relation",
                    id: `${this.databaseName}.${schemaName}.${tableName}`,
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

                await this.updateTableDetails(schemaName, tableName);
            }
        }
    }

    async updateTableDetails(schemaName: string, tableName?: string): Promise<void> {
        const database = this.getDatabase();
        const schema = database.schemas[schemaName];
        if (!schema) return;

        for (const [currentTableName, relation] of Object.entries(schema.relations)) {
            if (tableName && currentTableName !== tableName) continue;

            // Pobierz kolumny - dla SQLite info o kolumnach pobieramy z PRAGMA table_info
            let columns: any[] = [];
            try {
                if (schemaName === 'main') {
                    columns = await this.query<{
                        cid: number;
                        name: string;
                        type: string;
                        notnull: number;
                        dflt_value: string | null;
                        pk: number;
                    }>(`PRAGMA table_info(${this.quoteSqliteString(currentTableName)});`);
                } else {
                    // Dla attached database, SELECT z sqlite_master
                    const masterRows = await this.query<{
                        sql: string;
                    }>(`SELECT sql FROM ${this.quoteSqliteIdentifier(schemaName)}.sqlite_master 
                       WHERE type='table' AND name=${this.quoteSqliteString(currentTableName)}`);
                    
                    if (masterRows.length > 0 && masterRows[0].sql) {
                        // Parsuj CREATE TABLE statement żeby wydobyć kolumny
                        // Fallback: spróbuj SELECT * na puste dane i zobaczysz schemat
                        columns = await this.query<{
                            cid: number;
                            name: string;
                            type: string;
                            notnull: number;
                            dflt_value: string | null;
                            pk: number;
                        }>(`PRAGMA ${this.quoteSqliteIdentifier(schemaName)}.table_info(${this.quoteSqliteString(currentTableName)});`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to get table info for ${schemaName}.${currentTableName}:`, error);
                columns = [];
            }

            relation.columns = columns.map(col => ({
                id: `${schemaName}.${currentTableName}.${col.name}`,
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
            let fkList: any[] = [];
            try {
                if (schemaName === 'main') {
                    fkList = await this.query<{
                        id: number;
                        seq: number;
                        table: string;
                        from: string;
                        to: string;
                        on_delete: string;
                        on_update: string;
                    }>(`PRAGMA foreign_key_list(${this.quoteSqliteString(currentTableName)});`);
                } else {
                    fkList = await this.query<{
                        id: number;
                        seq: number;
                        table: string;
                        from: string;
                        to: string;
                        on_delete: string;
                        on_update: string;
                    }>(`PRAGMA ${this.quoteSqliteIdentifier(schemaName)}.foreign_key_list(${this.quoteSqliteString(currentTableName)});`);
                }
            } catch (error) {
                console.warn(`Failed to get foreign keys for ${schemaName}.${currentTableName}:`, error);
            }

            for (const fk of fkList) {
                const col = relation.columns.find(c => c.name === fk.from);
                if (col) {
                    col.foreignKey = true;
                }
            }
        }
    }

    async updateTableStats(progress?: (current: string) => void): Promise<void> {
        const database = this.getDatabase();

        if (progress) {
            progress("table statistics");
        }

        for (const schemaName of this.schemaNames) {
            const schema = database.schemas[schemaName];
            if (!schema) continue;

            for (const [tableName, relation] of Object.entries(schema.relations)) {
                if (relation.relationType === 'view') continue; // Widoki nie mają statystyk

                try {
                    let countResult: any;
                    if (schemaName === 'main') {
                        countResult = await this.queryOne<{ count: number }>(
                            `SELECT COUNT(*) as count FROM ${this.quoteSqliteString(tableName)};`
                        );
                    } else {
                        countResult = await this.queryOne<{ count: number }>(
                            `SELECT COUNT(*) as count FROM ${this.quoteSqliteIdentifier(schemaName)}.${this.quoteSqliteIdentifier(tableName)};`
                        );
                    }

                    relation.stats = {
                        rows: countResult?.count ?? null,
                    };
                } catch (error) {
                    console.warn(`Failed to get stats for ${schemaName}.${tableName}:`, error);
                    relation.stats = undefined;
                }
            }
        }
    }

    async updateIndexes(progress?: (current: string) => void): Promise<void> {
        const database = this.getDatabase();

        if (progress) {
            progress("indexes");
        }

        for (const schemaName of this.schemaNames) {
            const schema = database.schemas[schemaName];
            if (!schema) continue;

            for (const [tableName, relation] of Object.entries(schema.relations)) {
                if (relation.relationType === 'view') continue;

                let indexes: any[] = [];
                try {
                    if (schemaName === 'main') {
                        indexes = await this.query<{
                            seqno: number;
                            cid: number;
                            name: string;
                        }>(`PRAGMA index_list(${this.quoteSqliteString(tableName)});`);
                    } else {
                        indexes = await this.query<{
                            seqno: number;
                            cid: number;
                            name: string;
                        }>(`PRAGMA ${this.quoteSqliteIdentifier(schemaName)}.index_list(${this.quoteSqliteString(tableName)});`);
                    }
                } catch (error) {
                    console.warn(`Failed to get indexes for ${schemaName}.${tableName}:`, error);
                    indexes = [];
                }

                relation.indexes = [];

                for (const idx of indexes) {
                    let indexColumns: any[] = [];
                    try {
                        if (schemaName === 'main') {
                            indexColumns = await this.query<{
                                seqno: number;
                                cid: number;
                                name: string;
                            }>(`PRAGMA index_info(${this.quoteSqliteString(idx.name)});`);
                        } else {
                            indexColumns = await this.query<{
                                seqno: number;
                                cid: number;
                                name: string;
                            }>(`PRAGMA ${this.quoteSqliteIdentifier(schemaName)}.index_info(${this.quoteSqliteString(idx.name)});`);
                        }
                    } catch (error) {
                        console.warn(`Failed to get index info for ${schemaName}.${idx.name}:`, error);
                    }

                    const indexMetadata: api.IndexMetadata = {
                        id: `${schemaName}.${idx.name}`,
                        name: idx.name,
                        identity: idx.name,
                        columns: indexColumns.map(col => ({
                            name: col.name,
                            identity: col.name
                        })),
                        unique: false,
                        primary: false
                    };

                    relation.indexes.push(indexMetadata);
                }

                // Pobierz primary key z table_info
                let pkInfo: any[] = [];
                try {
                    if (schemaName === 'main') {
                        pkInfo = await this.query<{
                            cid: number;
                            name: string;
                            type: string;
                            pk: number;
                        }>(`PRAGMA table_info(${this.quoteSqliteString(tableName)});`);
                    } else {
                        pkInfo = await this.query<{
                            cid: number;
                            name: string;
                            type: string;
                            pk: number;
                        }>(`PRAGMA ${this.quoteSqliteIdentifier(schemaName)}.table_info(${this.quoteSqliteString(tableName)});`);
                    }
                } catch (error) {
                    console.warn(`Failed to get primary key for ${schemaName}.${tableName}:`, error);
                }

                const pkColumns = pkInfo.filter(col => col.pk > 0).map(col => col.name);
                if (pkColumns.length > 0) {
                    relation.primaryKey = {
                        id: `${schemaName}.${tableName}_pk`,
                        name: `${tableName}_pk`,
                        columns: pkColumns
                    };
                }
            }
        }
    }

    async updateForeignKeys(progress?: (current: string) => void): Promise<void> {
        const database = this.getDatabase();

        if (progress) {
            progress("foreign keys");
        }

        for (const schemaName of this.schemaNames) {
            const schema = database.schemas[schemaName];
            if (!schema) continue;

            for (const [tableName, relation] of Object.entries(schema.relations)) {
                if (relation.relationType === 'view') continue;

                let fkList: any[] = [];
                try {
                    if (schemaName === 'main') {
                        fkList = await this.query<{
                            id: number;
                            seq: number;
                            table: string;
                            from: string;
                            to: string;
                            on_delete: string;
                            on_update: string;
                        }>(`PRAGMA foreign_key_list(${this.quoteSqliteString(tableName)});`);
                    } else {
                        fkList = await this.query<{
                            id: number;
                            seq: number;
                            table: string;
                            from: string;
                            to: string;
                            on_delete: string;
                            on_update: string;
                        }>(`PRAGMA ${this.quoteSqliteIdentifier(schemaName)}.foreign_key_list(${this.quoteSqliteString(tableName)});`);
                    }
                } catch (error) {
                    console.warn(`Failed to get foreign keys for ${schemaName}.${tableName}:`, error);
                    fkList = [];
                }

                relation.foreignKeys = fkList.map(fk => ({
                    id: `${schemaName}.${tableName}_fk_${fk.id}`,
                    name: `${tableName}_fk_${fk.id}`,
                    column: [fk.from],
                    referencedSchema: fk.table.includes('.') ? fk.table.split('.')[0] : schemaName,
                    referencedTable: fk.table.includes('.') ? fk.table.split('.')[1] : fk.table,
                    referencedColumn: [fk.to],
                    onDelete: fk.on_delete?.toLowerCase() as api.ForeignKeyActionType,
                    onUpdate: fk.on_update?.toLowerCase() as api.ForeignKeyActionType
                }));
            }
        }
    }

    /**
     * Tworzy tabele systemowe na sztywno
     * Te tabele nie są dostępne normalnie, ale pokazujemy je w metadanych
     * Oparte na: https://www.sqlite.org/schematab.html
     */
    async updateSystemTables(progress?: (current: string) => void): Promise<void> {
        const database = this.getDatabase();

        if (progress) {
            progress("system tables");
        }

        const mainSchema = database.schemas['main'];
        const tempSchema = database.schemas['temp'];

        // Definicja kolumn dla sqlite_schema/sqlite_master
        const schemaMasterColumns = [
            {
                id: 'schema_type',
                name: 'type',
                identity: 'type',
                no: 0,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'schema_name',
                name: 'name',
                identity: 'name',
                no: 1,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'schema_tbl_name',
                name: 'tbl_name',
                identity: 'tbl_name',
                no: 2,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'schema_rootpage',
                name: 'rootpage',
                identity: 'rootpage',
                no: 3,
                dataType: 'INTEGER',
                displayType: 'INTEGER',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'schema_sql',
                name: 'sql',
                identity: 'sql',
                no: 4,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: true,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            }
        ];

        // Definicja kolumn dla sqlite_sequence
        const sequenceColumns = [
            {
                id: 'seq_name',
                name: 'name',
                identity: 'name',
                no: 0,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: false,
                defaultValue: null,
                primaryKey: true,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'seq_seq',
                name: 'seq',
                identity: 'seq',
                no: 1,
                dataType: 'INTEGER',
                displayType: 'INTEGER',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            }
        ];

        // Definicja kolumn dla sqlite_stat1
        const stat1Columns = [
            {
                id: 'stat1_tbl',
                name: 'tbl',
                identity: 'tbl',
                no: 0,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'stat1_idx',
                name: 'idx',
                identity: 'idx',
                no: 1,
                dataType: 'TEXT',
                displayType: 'TEXT',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            },
            {
                id: 'stat1_stat',
                name: 'stat',
                identity: 'stat',
                no: 2,
                dataType: 'BLOB',
                displayType: 'BLOB',
                nullable: false,
                defaultValue: null,
                primaryKey: false,
                foreignKey: false,
                unique: false,
                permissions: { select: true, update: false }
            }
        ];

        // Tabele dla main schematu
        if (mainSchema) {
            // sqlite_schema (główna tabela schematu)
            mainSchema.relations['sqlite_schema'] = {
                objectType: "relation",
                id: `${this.databaseName}.main.sqlite_schema`,
                name: 'sqlite_schema',
                identity: 'sqlite_schema',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: schemaMasterColumns.map(col => ({
                    id: `main.sqlite_schema.${col.id}`,
                    name: col.name,
                    identity: col.identity,
                    no: col.no,
                    dataType: col.dataType,
                    displayType: col.displayType,
                    nullable: col.nullable,
                    defaultValue: col.defaultValue,
                    primaryKey: col.primaryKey,
                    foreignKey: col.foreignKey,
                    unique: col.unique,
                    permissions: col.permissions
                })),
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };

            // sqlite_master (alias dla sqlite_schema)
            mainSchema.relations['sqlite_master'] = {
                objectType: "relation",
                id: `${this.databaseName}.main.sqlite_master`,
                name: 'sqlite_master',
                identity: 'sqlite_master',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: schemaMasterColumns.map(col => ({
                    id: `main.sqlite_master.${col.id}`,
                    name: col.name,
                    identity: col.identity,
                    no: col.no,
                    dataType: col.dataType,
                    displayType: col.displayType,
                    nullable: col.nullable,
                    defaultValue: col.defaultValue,
                    primaryKey: col.primaryKey,
                    foreignKey: col.foreignKey,
                    unique: col.unique,
                    permissions: col.permissions
                })),
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };

            // sqlite_sequence (tworzona gdy używany AUTOINCREMENT)
            mainSchema.relations['sqlite_sequence'] = {
                objectType: "relation",
                id: `${this.databaseName}.main.sqlite_sequence`,
                name: 'sqlite_sequence',
                identity: 'sqlite_sequence',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: sequenceColumns.map(col => ({
                    id: `main.sqlite_sequence.${col.id}`,
                    name: col.name,
                    identity: col.identity,
                    no: col.no,
                    dataType: col.dataType,
                    displayType: col.displayType,
                    nullable: col.nullable,
                    defaultValue: col.defaultValue,
                    primaryKey: col.primaryKey,
                    foreignKey: col.foreignKey,
                    unique: col.unique,
                    permissions: col.permissions
                })),
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };

            // sqlite_stat1 (statystyki z ANALYZE)
            mainSchema.relations['sqlite_stat1'] = {
                objectType: "relation",
                id: `${this.databaseName}.main.sqlite_stat1`,
                name: 'sqlite_stat1',
                identity: 'sqlite_stat1',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: stat1Columns.map(col => ({
                    id: `main.sqlite_stat1.${col.id}`,
                    name: col.name,
                    identity: col.identity,
                    no: col.no,
                    dataType: col.dataType,
                    displayType: col.displayType,
                    nullable: col.nullable,
                    defaultValue: col.defaultValue,
                    primaryKey: col.primaryKey,
                    foreignKey: col.foreignKey,
                    unique: col.unique,
                    permissions: col.permissions
                })),
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };

            // sqlite_stat3 (rozszerzone statystyki, opcjonalne)
            mainSchema.relations['sqlite_stat3'] = {
                objectType: "relation",
                id: `${this.databaseName}.main.sqlite_stat3`,
                name: 'sqlite_stat3',
                identity: 'sqlite_stat3',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: [
                    {
                        id: `main.sqlite_stat3.tbl`,
                        name: 'tbl',
                        identity: 'tbl',
                        no: 0,
                        dataType: 'TEXT',
                        displayType: 'TEXT',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat3.idx`,
                        name: 'idx',
                        identity: 'idx',
                        no: 1,
                        dataType: 'TEXT',
                        displayType: 'TEXT',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat3.neq`,
                        name: 'neq',
                        identity: 'neq',
                        no: 2,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat3.nlt`,
                        name: 'nlt',
                        identity: 'nlt',
                        no: 3,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat3.ndlt`,
                        name: 'ndlt',
                        identity: 'ndlt',
                        no: 4,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat3.sample`,
                        name: 'sample',
                        identity: 'sample',
                        no: 5,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    }
                ],
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };

            // sqlite_stat4 (nowsza wersja sqlite_stat3)
            mainSchema.relations['sqlite_stat4'] = {
                objectType: "relation",
                id: `${this.databaseName}.main.sqlite_stat4`,
                name: 'sqlite_stat4',
                identity: 'sqlite_stat4',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: [
                    {
                        id: `main.sqlite_stat4.tbl`,
                        name: 'tbl',
                        identity: 'tbl',
                        no: 0,
                        dataType: 'TEXT',
                        displayType: 'TEXT',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat4.idx`,
                        name: 'idx',
                        identity: 'idx',
                        no: 1,
                        dataType: 'TEXT',
                        displayType: 'TEXT',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat4.neq`,
                        name: 'neq',
                        identity: 'neq',
                        no: 2,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat4.nlt`,
                        name: 'nlt',
                        identity: 'nlt',
                        no: 3,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat4.ndlt`,
                        name: 'ndlt',
                        identity: 'ndlt',
                        no: 4,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    },
                    {
                        id: `main.sqlite_stat4.sample`,
                        name: 'sample',
                        identity: 'sample',
                        no: 5,
                        dataType: 'BLOB',
                        displayType: 'BLOB',
                        nullable: false,
                        defaultValue: null,
                        primaryKey: false,
                        foreignKey: false,
                        unique: false,
                        permissions: { select: true, update: false }
                    }
                ],
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };
        }

        // Tabele dla temp schematu
        if (tempSchema) {
            // sqlite_temp_schema
            tempSchema.relations['sqlite_temp_schema'] = {
                objectType: "relation",
                id: `${this.databaseName}.temp.sqlite_temp_schema`,
                name: 'sqlite_temp_schema',
                identity: 'sqlite_temp_schema',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: schemaMasterColumns.map(col => ({
                    id: `temp.sqlite_temp_schema.${col.id}`,
                    name: col.name,
                    identity: col.identity,
                    no: col.no,
                    dataType: col.dataType,
                    displayType: col.displayType,
                    nullable: col.nullable,
                    defaultValue: col.defaultValue,
                    primaryKey: col.primaryKey,
                    foreignKey: col.foreignKey,
                    unique: col.unique,
                    permissions: col.permissions
                })),
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };

            // sqlite_temp_master (alias)
            tempSchema.relations['sqlite_temp_master'] = {
                objectType: "relation",
                id: `${this.databaseName}.temp.sqlite_temp_master`,
                name: 'sqlite_temp_master',
                identity: 'sqlite_temp_master',
                relationType: 'table',
                kind: 'system',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                columns: schemaMasterColumns.map(col => ({
                    id: `temp.sqlite_temp_master.${col.id}`,
                    name: col.name,
                    identity: col.identity,
                    no: col.no,
                    dataType: col.dataType,
                    displayType: col.displayType,
                    nullable: col.nullable,
                    defaultValue: col.defaultValue,
                    primaryKey: col.primaryKey,
                    foreignKey: col.foreignKey,
                    unique: col.unique,
                    permissions: col.permissions
                })),
                permissions: {
                    select: true,
                    insert: false,
                    update: false,
                    delete: false
                }
            };
        }
    }
}