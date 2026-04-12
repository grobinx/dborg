import { DatabaseMetadata, Metadata, OwnedMetadataBase, RelationMetadata, RoutineMetadata, SchemaMetadata } from "./Metadata";

/** Options for identifying a metadata entity */
export interface IdentityOptions {
    /** The name of the metadata entity */
    name?: string;
    /** The unique identity of the metadata entity */
    identity?: string;
}

/** Options for filtering metadata entities */
export interface QueryFilter<T extends OwnedMetadataBase> {
    /** The name of the metadata entity */
    name?: string | RegExp;
    /** The owner of the metadata entity */
    owner?: string | RegExp;
    /** Additional properties to filter by, where the key is the property name and the value is the expected value or a regular expression to match against the property's value. */
    filter?: Partial<Omit<T, 'name' | 'owner'>>;
}

/** Interface for querying metadata */
export interface IMetadataQuery extends Omit<Metadata, 'databases'> {
    /** Get a list of databases, optionally filtered by the provided criteria */
    getDatabaseList(filter?: DatabaseFilter): Promise<MetadataDatabaseQuery[]>;
    /** Get a full specific database by its name or identity */
    getDatabase(id: string | IdentityOptions): Promise<MetadataDatabaseQuery | undefined>;
}

export class MetadataQuery implements IMetadataQuery {
    private _connectionId: string;
    constructor(connectionId: string, metadata?: Omit<Metadata, 'databases'>) {
        this._connectionId = connectionId;
        Object.assign(this, { ...metadata });
    }
    async getDatabaseList(filter?: DatabaseFilter): Promise<MetadataDatabaseQuery[]> {
        const databaseList: DatabaseQueryMetadata[] = await window.dborg.database.connection.metadata.getDatabaseList(this._connectionId, filter);
        const result = databaseList.map(db => new MetadataDatabaseQuery(this._connectionId, db));
        return result;
    }
    async getDatabase(id: string | IdentityOptions): Promise<MetadataDatabaseQuery | undefined> {
        const database = await window.dborg.database.connection.metadata.getDatabase(this._connectionId, id);
        if (database) {
            return new MetadataDatabaseQuery(this._connectionId, database);
        }
        return undefined;
    }
}

export type DatabaseQueryMetadata = Omit<DatabaseMetadata, 'schemas' | 'builtInRelations' | 'builtInTypes' | 'builtInRoutines'>;
export interface DatabaseFilter extends QueryFilter<DatabaseQueryMetadata> { }

/** Interface for querying database metadata */
export interface IMetadataDatabaseQuery extends DatabaseQueryMetadata {
    _connectionId: string;
    /** Get a list of schemas, optionally filtered by the provided criteria */
    getSchemaList(filter?: SchemaFilter): Promise<MetadataSchemaQuery[]>;
    /** Get a full specific schema by its name or identity */
    getSchema(id: string | IdentityOptions): Promise<MetadataSchemaQuery | undefined>;
}

export class MetadataDatabaseQuery implements IMetadataDatabaseQuery {
    _connectionId: string;
    constructor(connectionId: string, metadata?: DatabaseQueryMetadata) {
        this._connectionId = connectionId;
        Object.assign(this, { ...metadata });
    }

    getSchemaList(filter?: SchemaFilter): Promise<MetadataSchemaQuery[]> {
        return window.dborg.database.connection.metadata.getSchemaList(this._connectionId, this.id, filter);
    }
    getSchema(id: string | IdentityOptions): Promise<MetadataSchemaQuery | undefined> {
        return window.dborg.database.connection.metadata.getSchema(this._connectionId, this.id, id);
    }
}

export type SchemaQueryMetadata = Omit<SchemaMetadata, 'relations' | 'routines' | 'packages' | 'sequences' | 'types'>;
export interface SchemaFilter extends QueryFilter<SchemaQueryMetadata> { }

export interface IMetadataSchemaQuery extends SchemaQueryMetadata {
    /** 
     * Get a list of relations, optionally filtered by the provided criteria 
     * @param filter - The filter criteria to apply
     * @param include - The keys of the relation metadata to include in the result
     */
    getRelationList(filter?: RelationFilter, include?: RelationIncludeKeys[]): Promise<Partial<IMetadataRelationQuery>[]>;
    /** 
     * Get a full specific relation by its name or identity
     * @param id - The id or identity of the relation
     */
    getRelation(id: string | IdentityOptions): Promise<IMetadataRelationQuery | undefined>;

    /**
     * Get a list of routines, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     * @param include - The keys of the routine metadata to include in the result
     */
    getRoutineList(filter?: RoutineFilter, include?: RoutineIncludeKeys[]): Promise<Partial<IMetadataRoutineQuery>[]>;
    /**
     * Get a full specific routine by its name or identity
     * @param id - The id or identity of the routine
     */
    getRoutine(id: string | IdentityOptions): Promise<IMetadataRoutineQuery | undefined>;
}

export class MetadataSchemaQuery implements IMetadataSchemaQuery {
    _connectionId: string;

    constructor(connectionId: string, metadata?: SchemaQueryMetadata) {
        this._connectionId = connectionId;
        Object.assign(this, { ...metadata });
    }
}

export type RelationQueryMetadata = RelationMetadata;
export interface RelationFilter extends QueryFilter<RelationQueryMetadata> { }
export type RelationIncludeKeys = 'columns' | 'constraints' | 'foreignKeys' | 'indexes' | 'stats' | 'identifiers';

export interface IMetadataRelationQuery extends RelationQueryMetadata {
}

export type RoutineQueryMetadata = RoutineMetadata;
export interface RoutineFilter extends QueryFilter<RoutineQueryMetadata> { }
export type RoutineIncludeKeys = 'arguments' | 'identifiers';

export interface IMetadataRoutineQuery extends RoutineQueryMetadata {
}