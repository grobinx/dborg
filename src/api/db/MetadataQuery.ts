import { DatabaseMetadata, Metadata, OwnedMetadataBase, RelationMetadata, RoutineMetadata, SchemaMetadata } from "./Metadata";

/** Options for identifying a metadata entity */
export interface IdentityOptions {
    /** The name of the metadata entity */
    name?: string;
    /** The unique identity of the metadata entity */
    identity?: string;
}

/** Options for filtering metadata entities */
export interface EntityFilter<T extends OwnedMetadataBase> {
    /** The name of the metadata entity */
    name?: string | RegExp;
    /** The owner of the metadata entity */
    owner?: string | RegExp;
    /** Additional properties to filter by, where the key is the property name and the value is the expected value or a regular expression to match against the property's value. */
    filter?: Partial<Omit<T, "name" | "owner">>;
}

export type MetadataSummary = Omit<Metadata, "databases">;

/** Interface for querying metadata */
export interface MetadataQueryApi extends MetadataSummary {
    /** Get a list of databases, optionally filtered by the provided criteria */
    getDatabaseList(filter?: DatabaseFilter): Promise<DatabaseQueryApi[]>;
    /** Get a full specific database by its name or identity */
    getDatabase(id: string | IdentityOptions): Promise<DatabaseQueryApi | undefined>;
}

export const createMetadataQueryApi = async (connectionId: string): Promise<MetadataQueryApi> => {
    const metadata: MetadataSummary = await window.dborg.database.connection.metadata.getMetadata(connectionId);
    return {
        ...metadata,
        getDatabaseList: async (filter?: DatabaseFilter) => {
            const databaseList: DatabaseSummary[] = await window.dborg.database.connection.metadata.getDatabaseList(connectionId, filter);
            return databaseList.map(db => createDatabaseQueryApi(connectionId, db));
        },
        getDatabase: async (id: string | IdentityOptions) => {
            const database = await window.dborg.database.connection.metadata.getDatabase(connectionId, id);
            if (database) {
                return createDatabaseQueryApi(connectionId, database);
            }
            return undefined;
        }
    };
};

export type DatabaseSummary = Omit<DatabaseMetadata, "schemas" | "builtInRelations" | "builtInTypes" | "builtInRoutines">;
export interface DatabaseFilter extends EntityFilter<DatabaseSummary> { }

/** Interface for querying database metadata */
export interface DatabaseQueryApi extends DatabaseSummary {
    /** Get a list of schemas, optionally filtered by the provided criteria */
    getSchemaList(filter?: SchemaFilter): Promise<SchemaQueryApi[]>;
    /** Get a full specific schema by its name or identity */
    getSchema(id: string | IdentityOptions): Promise<SchemaQueryApi | undefined>;
}

export const createDatabaseQueryApi = (connectionId: string, metadata: DatabaseSummary): DatabaseQueryApi => {
    return {
        ...metadata,
        getSchemaList: async (filter?: SchemaFilter) => {
            const schemaList: SchemaSummary[] = await window.dborg.database.connection.metadata.getSchemaList(connectionId, metadata.id, filter);
            return schemaList.map(schema => createMetadataSchemaQuery(connectionId, schema));
        },
        getSchema: async (id: string | IdentityOptions) => {
            const schema = await window.dborg.database.connection.metadata.getSchema(connectionId, metadata.id, id);
            if (schema) {
                return createMetadataSchemaQuery(connectionId, schema);
            }
            return undefined;
        }
    };
};

export type SchemaSummary = Omit<SchemaMetadata, "relations" | "routines" | "packages" | "sequences" | "types">;
export interface SchemaFilter extends EntityFilter<SchemaSummary> { }

export interface SchemaQueryApi extends SchemaSummary {
    /**
     * Get a list of relations, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     * @param include - The keys of the relation metadata to include in the result
     */
    getRelationList(filter?: RelationFilter, include?: RelationInclude[]): Promise<Partial<RelationQueryApi>[]>;
    /**
     * Get a full specific relation by its name or identity
     * @param id - The id or identity of the relation
     */
    getRelation(id: string | IdentityOptions): Promise<RelationQueryApi | undefined>;

    /**
     * Get a list of routines, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     * @param include - The keys of the routine metadata to include in the result
     */
    getRoutineList(filter?: RoutineFilter, include?: RoutineInclude[]): Promise<Partial<RoutineQueryApi>[]>;
    /**
     * Get a full specific routine by its name or identity
     * @param id - The id or identity of the routine
     */
    getRoutine(id: string | IdentityOptions): Promise<RoutineQueryApi | undefined>;
}

export const createMetadataSchemaQuery = (connectionId: string, metadata: SchemaSummary): SchemaQueryApi => {
    return new MetadataSchemaQuery(connectionId, metadata);
};

export type RelationDetails = RelationMetadata;
export interface RelationFilter extends EntityFilter<RelationDetails> { }
export type RelationInclude = "columns" | "constraints" | "foreignKeys" | "indexes" | "stats" | "identifiers";

export interface RelationQueryApi extends RelationDetails {
}

export type RoutineDetails = RoutineMetadata;
export interface RoutineFilter extends EntityFilter<RoutineDetails> { }
export type RoutineInclude = "arguments" | "identifiers";

export interface RoutineQueryApi extends RoutineDetails {
}
