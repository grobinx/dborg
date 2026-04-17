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
    id?: string | string[];
    /** The name of the metadata entity */
    name?: string | string[] | RegExp;
    /** The owner of the metadata entity */
    owner?: string | string[] | RegExp;
    /** Additional properties to filter by, where the key is the property name and the value is the expected value or a regular expression to match against the property's value. */
    filter?: Partial<Omit<T, "id" | "name" | "owner">>;
}

export interface MetadataDetails extends Omit<Metadata, "databases"> {
    databaseCount: number;
}

/** Interface for querying metadata */
export interface MetadataQueryApi extends MetadataDetails {
    /** Get a list of databases, optionally filtered by the provided criteria */
    getDatabaseList(filter?: DatabaseFilter): Promise<DatabaseQueryApi[]>;
    /** Get a full specific database by its name or identity */
    getDatabase(id: string | IdentityOptions): Promise<DatabaseQueryApi | undefined>;
}

export const createMetadataQueryApi = async (connectionId: string): Promise<MetadataQueryApi> => {
    const metadata: MetadataDetails = await window.dborg.database.connection.metadata.getMetadata(connectionId);
    return {
        ...metadata,
        getDatabaseList: async (filter?: DatabaseFilter) => {
            const databaseList: DatabaseDetails[] = await window.dborg.database.connection.metadata.getDatabaseList(connectionId, filter);
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

export interface DatabaseDetails extends Omit<DatabaseMetadata, "schemas" | "builtInRelations" | "builtInTypes" | "builtInRoutines"> {
    schemaCount: number;
    builtInRelationCount: number;
    builtInTypeCount: number;
    builtInRoutineCount: number;
}
export interface DatabaseFilter extends EntityFilter<DatabaseDetails> { }

/** Interface for querying database metadata */
export interface DatabaseQueryApi extends DatabaseDetails {
    /** Get a list of schemas, optionally filtered by the provided criteria */
    getSchemaList(filter?: SchemaFilter): Promise<SchemaQueryApi[]>;
    /** Get a full specific schema by its name or identity */
    getSchema(id: string | IdentityOptions): Promise<SchemaQueryApi | undefined>;
}

const createDatabaseQueryApi = (connectionId: string, database: DatabaseDetails): DatabaseQueryApi => {
    return {
        ...database,
        getSchemaList: async (filter?: SchemaFilter) => {
            const schemaList: SchemaDetails[] = await window.dborg.database.connection.metadata.getSchemaList(connectionId, database.id, filter);
            return schemaList.map(schema => createMetadataSchemaQuery(connectionId, database.id, schema));
        },
        getSchema: async (id: string | IdentityOptions) => {
            const schema = await window.dborg.database.connection.metadata.getSchema(connectionId, database.id, id);
            if (schema) {
                return createMetadataSchemaQuery(connectionId, database.id, schema);
            }
            return undefined;
        }
    };
};

export interface SchemaDetails extends Omit<SchemaMetadata, "relations" | "routines" | "packages" | "sequences" | "types"> {
    relationCount: number;
    routineCount: number;
    packageCount: number;
    sequenceCount: number;
    typeCount: number;
}
export interface SchemaFilter extends EntityFilter<SchemaDetails> { }

export interface SchemaQueryApi extends SchemaDetails {
    /**
     * Get a list of relations, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     */
    getRelationList(filter?: RelationFilter): Promise<Partial<RelationQueryApi>[]>;
    /**
     * Get a full specific relation by its name or identity
     * @param id - The id or identity of the relation
     */
    getRelation(id: string | IdentityOptions): Promise<RelationQueryApi | undefined>;

    /**
     * Get a list of routines, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     */
    getRoutineList(filter?: RoutineFilter): Promise<Partial<RoutineQueryApi>[]>;
    /**
     * Get a full specific routine by its name or identity
     * @param id - The id or identity of the routine
     */
    getRoutine(id: string | IdentityOptions): Promise<RoutineQueryApi | undefined>;
}

const createMetadataSchemaQuery = (connectionId: string, databaseId: string, schema: SchemaDetails): SchemaQueryApi => {
    return {
        ...schema,
        getRelationList: async (filter?: RelationFilter) => {
            const relationList: RelationDetails[] = await window.dborg.database.connection.metadata.getRelationList(connectionId, databaseId, schema.id, filter);
            return relationList.map(relation => {
                const result: Partial<RelationQueryApi> = { ...relation };
                return result;
            });
        },
        getRelation: async (id: string | IdentityOptions) => {
            const relation = await window.dborg.database.connection.metadata.getRelation(connectionId, databaseId, schema.id, id);
            if (relation) {
                return createMetadataRelationQuery(connectionId, databaseId, schema.id, relation);
            }
            return undefined;
        },
        getRoutineList: async (filter?: RoutineFilter) => {
            const routineList: RoutineDetails[] = await window.dborg.database.connection.metadata.getRoutineList(connectionId, databaseId, schema.id, filter);
            return routineList.map(routine => {
                const result: Partial<RoutineQueryApi> = { ...routine };
                return result;
            });
        },
        getRoutine: async (id: string | IdentityOptions) => {
            const routine = await window.dborg.database.connection.metadata.getRoutine(connectionId, databaseId, schema.id, id);
            if (routine) {
                return createMetadataRoutineQuery(connectionId, databaseId, schema.id, routine);
            }
            return undefined;
        }
    };
};

export type RelationDetails = RelationMetadata;
export interface RelationFilter extends EntityFilter<RelationDetails> { }

export interface RelationQueryApi extends RelationDetails {
}

const createMetadataRelationQuery = (_connectionId: string, _databaseId: string, _schemaId: string | undefined, relation: RelationDetails): RelationQueryApi => {
    return {
        ...relation
    };
};

export type RoutineDetails = RoutineMetadata;
export interface RoutineFilter extends EntityFilter<RoutineDetails> { }

export interface RoutineQueryApi extends RoutineDetails {
}

const createMetadataRoutineQuery = (_connectionId: string, _databaseId: string, _schemaId: string | undefined, routine: RoutineDetails): RoutineQueryApi => {
    return {
        ...routine
    };
}

/**
 * Test value against filter (string, array of strings, or regex)
 * Optimized for performance with early exits
 */
const testFilterValue = (value: string, filter: string | string[] | RegExp): boolean => {
    if (typeof filter === "string") {
        return value === filter; // Fastest: exact string comparison
    }
    if (Array.isArray(filter)) {
        return filter.includes(value); // O(n) but faster than map/filter for small arrays
    }
    return filter.test(value); // RegExp test
}

/**
 * Match item against filter criteria
 * Optimized with early exit strategy and minimal allocations
 */
const matchFilter = <T extends OwnedMetadataBase>(item: T, filter?: EntityFilter<T>): boolean => {
    if (!filter) return true;

    if (filter.id !== undefined && !testFilterValue(item.id, filter.id)) return false;

    if (filter.name !== undefined && !testFilterValue(item.name, filter.name)) return false;

    if (filter.owner !== undefined && (!item.owner || !testFilterValue(item.owner, filter.owner))) return false;

    if (filter.filter) {
        // Only iterate if filter.filter has keys
        for (const key in filter.filter) {
            // Avoid unnecessary casting, direct property access
            const itemValue = (item as Record<string, unknown>)[key];
            const filterValue = (filter.filter as Record<string, unknown>)[key];

            // Early exit on mismatch
            if (itemValue !== filterValue) return false;
        }
    }

    return true;
}

const matchId = <T extends OwnedMetadataBase>(item: T, id: string | IdentityOptions): boolean => {
    if (typeof id === "string") {
        return item.id === id;
    }
    if (id.name && item.name !== id.name) return false;
    if (id.identity && item.identity !== id.identity) return false;
    return true;
}

const metadataToDetails = (metadata: Metadata): MetadataDetails => {
    const { databases, ...metadataSummary } = metadata;
    return {
        databaseCount: Object.keys(databases ?? {}).length,
        ...metadataSummary
    };
}

export const getMetadata = (metadata: Metadata): MetadataDetails => {
    return metadataToDetails(metadata);
}

const metadataDatabaseToDetails = (metadata: DatabaseMetadata): DatabaseDetails => {
    const { schemas, builtInRelations, builtInTypes, builtInRoutines, ...dbMetadata } = metadata;
    return {
        ...dbMetadata,
        schemaCount: Object.keys(schemas ?? {}).length,
        builtInRelationCount: Object.keys(builtInRelations ?? {}).length,
        builtInTypeCount: Object.keys(builtInTypes ?? {}).length,
        builtInRoutineCount: Object.keys(builtInRoutines ?? {}).length,
    };
}

export const getMetadataDatabaseList = (metadata: Metadata, filter?: DatabaseFilter): DatabaseDetails[] => {
    return Object.values(metadata.databases ?? {})
        .filter(db => matchFilter(db, filter))
        .map(db => metadataDatabaseToDetails(db));
}

export const getMetadataDatabase = (metadata: Metadata, id: string | IdentityOptions): DatabaseDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => matchId(db, id));

    if (!database) return undefined;

    return metadataDatabaseToDetails(database);
}

const metadataSchemaToDetails = (metadata: SchemaMetadata): SchemaDetails => {
    const { relations, routines, packages, sequences, types, ...schemaMetadata } = metadata;
    return {
        ...schemaMetadata,
        relationCount: Object.keys(relations ?? {}).length,
        routineCount: Object.keys(routines ?? {}).length,
        packageCount: Object.keys(packages ?? {}).length,
        sequenceCount: Object.keys(sequences ?? {}).length,
        typeCount: Object.keys(types ?? {}).length,
    };
}

export const getMetadataSchemaList = (metadata: Metadata, databaseId: string, filter?: SchemaFilter): SchemaDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    return Object.values(database.schemas ?? {})
        .filter(schema => matchFilter(schema, filter))
        .map(schema => metadataSchemaToDetails(schema));
}

export const getMetadataSchema = (metadata: Metadata, databaseId: string, id: string | IdentityOptions): SchemaDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    const schema = Object.values(database.schemas ?? {}).find(schema => matchId(schema, id));
    if (!schema) return undefined;
    return metadataSchemaToDetails(schema);
}

const metadataRelationToDetails = (metadata: RelationMetadata): RelationDetails => {
    const { columns, constraints, foreignKeys, indexes, stats, identifiers, ...relationMetadata } = metadata;
    return {
        ...relationMetadata,
        columns: columns ?? [],
        constraints: constraints ?? [],
        foreignKeys: foreignKeys ?? [],
        indexes: indexes ?? [],
        stats: stats ?? {},
        identifiers: identifiers ?? []
    };
}

export const getMetadataRelationList = (metadata: Metadata, databaseId: string, schemaId: string | undefined, filter?: RelationFilter): RelationDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    if (schemaId) {
        const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
        if (!schema) return [];
        return Object.values(schema.relations ?? {})
            .filter(relation => matchFilter(relation, filter))
            .map(relation => metadataRelationToDetails(relation));
    } else {
        return Object.values(database.builtInRelations ?? {})
            .filter(relation => matchFilter(relation, filter))
            .map(relation => metadataRelationToDetails(relation));
    }
}

export const getMetadataRelation = (metadata: Metadata, databaseId: string, schemaId: string | undefined, id: string | IdentityOptions): RelationDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    if (schemaId) {
        const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
        if (!schema) return undefined;
        const relation = Object.values(schema.relations ?? {}).find(relation => matchId(relation, id));
        if (!relation) return undefined;
        return metadataRelationToDetails(relation);
    } else {
        const relation = Object.values(database.builtInRelations ?? {}).find(relation => matchId(relation, id));
        if (!relation) return undefined;
        return metadataRelationToDetails(relation);
    }
}

const metadataRoutineToDetails = (metadata: RoutineMetadata): RoutineDetails => {
    const { arguments: args, identifiers, ...routineMetadata } = metadata;
    return {
        ...routineMetadata,
        arguments: args ?? [],
        identifiers: identifiers ?? []
    };
}

export const getMetadataRoutineList = (metadata: Metadata, databaseId: string, schemaId: string | undefined, filter?: RoutineFilter): RoutineDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    if (schemaId) {
        const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
        if (!schema) return [];
        return Object.values(schema.routines ?? {})
            .flatMap(routines => Object.values(routines))
            .filter(routine => matchFilter(routine, filter))
            .map(routine => metadataRoutineToDetails(routine));
    } else {
        return Object.values(database.builtInRoutines ?? {})
            .flatMap(routines => Object.values(routines))
            .filter(routine => matchFilter(routine, filter))
            .map(routine => metadataRoutineToDetails(routine));
    }
}

export const getMetadataRoutine = (metadata: Metadata, databaseId: string, schemaId: string | undefined, id: string | IdentityOptions): RoutineDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    if (schemaId) {
        const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
        if (!schema) return undefined;
        const routine = Object.values(schema.routines ?? {})
            .flatMap(routines => Object.values(routines))
            .find(routine => matchId(routine, id));
        if (!routine) return undefined;
        return metadataRoutineToDetails(routine);
    } else {
        const routine = Object.values(database.builtInRoutines ?? {})
            .flatMap(routines => Object.values(routines))
            .find(routine => matchId(routine, id));
        if (!routine) return undefined;
        return metadataRoutineToDetails(routine);
    }
}
