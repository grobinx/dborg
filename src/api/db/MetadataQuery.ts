import { DatabaseMetadata, Metadata, MetadataObjectType, OwnedMetadataBase, RelationMetadata, RoutineMetadata, SchemaMetadata } from "./Metadata";

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

export type IdentifierMatchMode = "exact" | "contains" | "startsWith" | "regex";

/** Options for searching identifier usage */
export interface ObjectSearchOptions {
    /** The identifier to search for (e.g. table name, column name, etc.) */
    query: string;
    /** The mode to use for matching the identifier, default: "contains" */
    mode?: IdentifierMatchMode;
    /** Whether the search should be case-sensitive, default: false */
    caseSensitive?: boolean;
    /** The types of objects to search for */
    objectTypes?: Array<MetadataObjectType>;
    /** Additional filters to apply to the search, where the key is the object type and the value is a filter to apply to objects of that type. */
    filters?: Partial<{
        "database": DatabaseFilter;
        "schema": SchemaFilter;
        "relation": RelationFilter;
        "routine": RoutineFilter;
    }>;
}

/** Interface for querying metadata */
export interface IdentifierUsageHit {
    /** The ID of the database */
    databaseId: string;
    /** The name of the database */
    databaseName: string;
    /** The ID of the schema */
    schemaId: string;
    /** The name of the schema */
    schemaName: string;
    /** The ID of the object */
    objectId: string;
    /** The name of the object */
    objectName: string;
    /** The type of the object (relation, routine, etc.) */
    objectType: MetadataObjectType;
    /** The kind of the object (table, view, function, procedure, etc.) */
    objectKind?: string;
    /** The ID of the column, if applicable */
    matchedIdentifier: string;
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
   /** Search for usage of an identifier across the database, with various matching modes and filters */ 
    searchIdentifierUsage(options: ObjectSearchOptions): Promise<IdentifierUsageHit[]>;
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
        },
        searchIdentifierUsage: async (options: ObjectSearchOptions) => {
            const result: IdentifierUsageHit[] = await window.dborg.database.connection.metadata.searchIdentifierUsage(connectionId, options);
            return result;
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
    databaseId: string;
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
    getRelationList(filter?: RelationFilter): Promise<RelationQueryApi[]>;
    /**
     * Get a full specific relation by its name or identity
     * @param id - The id or identity of the relation
     */
    getRelation(id: string | IdentityOptions): Promise<RelationQueryApi | undefined>;

    /**
     * Get a list of routines, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     */
    getRoutineList(filter?: RoutineFilter): Promise<RoutineQueryApi[]>;
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
                const result: RelationQueryApi = { ...relation };
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
                const result: RoutineQueryApi = { ...routine };
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

export interface RelationDetails extends RelationMetadata {
    databaseId: string;
    schemaId: string | undefined;
}
export interface RelationFilter extends EntityFilter<RelationDetails> { }

export interface RelationQueryApi extends RelationDetails {
}

const createMetadataRelationQuery = (_connectionId: string, _databaseId: string, _schemaId: string | undefined, relation: RelationDetails): RelationQueryApi => {
    return {
        ...relation
    };
};

export interface RoutineDetails extends RoutineMetadata {
    databaseId: string;
    schemaId: string | undefined;
}
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

const metadataSchemaToDetails = (databaseId: string, metadata: SchemaMetadata): SchemaDetails => {
    const { relations, routines, packages, sequences, types, ...schemaMetadata } = metadata;
    return {
        ...schemaMetadata,
        databaseId,
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
        .map(schema => metadataSchemaToDetails(databaseId, schema));
}

export const getMetadataSchema = (metadata: Metadata, databaseId: string, id: string | IdentityOptions): SchemaDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    const schema = Object.values(database.schemas ?? {}).find(schema => matchId(schema, id));
    if (!schema) return undefined;
    return metadataSchemaToDetails(databaseId, schema);
}

const metadataRelationToDetails = (databaseId: string, schemaId: string | undefined, metadata: RelationMetadata): RelationDetails => {
    const { columns, constraints, foreignKeys, indexes, stats, identifiers, ...relationMetadata } = metadata;
    return {
        ...relationMetadata,
        databaseId,
        schemaId,
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
            .map(relation => metadataRelationToDetails(databaseId, schemaId, relation));
    } else {
        return Object.values(database.builtInRelations ?? {})
            .filter(relation => matchFilter(relation, filter))
            .map(relation => metadataRelationToDetails(databaseId, schemaId, relation));
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
        return metadataRelationToDetails(databaseId, schemaId, relation);
    } else {
        const relation = Object.values(database.builtInRelations ?? {}).find(relation => matchId(relation, id));
        if (!relation) return undefined;
        return metadataRelationToDetails(databaseId, schemaId, relation);
    }
}

const metadataRoutineToDetails = (databaseId: string, schemaId: string | undefined, metadata: RoutineMetadata): RoutineDetails => {
    const { arguments: args, identifiers, ...routineMetadata } = metadata;
    return {
        ...routineMetadata,
        databaseId,
        schemaId,
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
            .map(routine => metadataRoutineToDetails(databaseId, schemaId, routine));
    } else {
        return Object.values(database.builtInRoutines ?? {})
            .flatMap(routines => Object.values(routines))
            .filter(routine => matchFilter(routine, filter))
            .map(routine => metadataRoutineToDetails(databaseId, schemaId, routine));
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
        return metadataRoutineToDetails(databaseId, schemaId, routine);
    } else {
        const routine = Object.values(database.builtInRoutines ?? {})
            .flatMap(routines => Object.values(routines))
            .find(routine => matchId(routine, id));
        if (!routine) return undefined;
        return metadataRoutineToDetails(databaseId, schemaId, routine);
    }
}

const normalizeIdentifier = (value: string, caseSensitive: boolean): string => {
    const trimmed = value.trim();
    return caseSensitive ? trimmed : trimmed.toLowerCase();
};

const matchesIdentifier = (
    candidate: string,
    query: string,
    mode: IdentifierMatchMode,
    caseSensitive: boolean
): boolean => {
    const c = normalizeIdentifier(candidate, caseSensitive);
    const q = normalizeIdentifier(query, caseSensitive);

    if (mode === "exact") return c === q;
    if (mode === "contains") return c.includes(q);
    if (mode === "startsWith") return c.startsWith(q);

    try {
        const re = new RegExp(query, caseSensitive ? "" : "i");
        return re.test(candidate);
    } catch {
        return false;
    }
};

const allowObjectType = (
    objectType: MetadataObjectType,
    filter?: Array<MetadataObjectType>
): boolean => {
    if (!filter || filter.length === 0) return true;
    return filter.includes(objectType);
};

export const getMetadataIdentifierUsage = (
    metadata: Metadata,
    options: ObjectSearchOptions
): IdentifierUsageHit[] => {
    const mode = options.mode ?? "contains";
    const caseSensitive = options.caseSensitive ?? false;
    const query = options.query ?? "";

    if (!query.trim()) return [];

    const result: IdentifierUsageHit[] = [];

    for (const database of Object.values(metadata.databases ?? {}).filter(db => matchFilter(db, options.filters?.database))) {
        for (const schema of Object.values(database.schemas ?? {}).filter(schema => matchFilter(schema, options.filters?.schema))) {
            if (allowObjectType("relation", options.objectTypes)) {
                for (const relation of Object.values(schema.relations ?? {})) {
                    for (const id of relation.identifiers ?? []) {
                        if (!matchesIdentifier(id, query, mode, caseSensitive)) continue;

                        result.push({
                            databaseId: database.id,
                            databaseName: database.name,
                            schemaId: schema.id,
                            schemaName: schema.name,
                            objectId: relation.id,
                            objectName: relation.name,
                            objectType: "relation",
                            objectKind: relation.relationType,
                            matchedIdentifier: id,
                        });
                    }
                }
            }

            if (allowObjectType("routine", options.objectTypes)) {
                for (const routineGroup of Object.values(schema.routines ?? {})) {
                    for (const routine of Object.values(routineGroup)) {
                        for (const id of routine.identifiers ?? []) {
                            if (!matchesIdentifier(id, query, mode, caseSensitive)) continue;

                            result.push({
                                databaseId: database.id,
                                databaseName: database.name,
                                schemaId: schema.id,
                                schemaName: schema.name,
                                objectId: routine.id,
                                objectName: routine.name,
                                objectType: "routine",
                                objectKind: routine.routineType,
                                matchedIdentifier: id,
                            });
                        }
                    }
                }
            }
        }
    }

    return result;
};