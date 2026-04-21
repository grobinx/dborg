import { RequiredOnly } from "../types";
import { DatabaseMetadata, Metadata, MetadataObjectType, OwnedMetadataBase, PackageMetadata, RelationMetadata, RoutineMetadata, SchemaMetadata, SequenceMetadata, TypeMetadata } from "./Metadata";

/** Options for identifying a metadata entity */
export interface IdentityOptions {
    /** The name of the metadata entity */
    name?: string;
    /** The unique identity of the metadata entity */
    identity?: string;
}

export interface EntityFilterIdentity {
    /** Whether to negate the filter */
    not?: boolean;
    /** The ID of the metadata entity, or an array of IDs, or a regex to match the ID(s) */
    id?: string | string[];
    /** The name of the metadata entity */
    name?: string | string[] | RegExp;
    /** The owner of the metadata entity */
    owner?: string | string[] | RegExp;
}

/** Options for filtering metadata entities */
export interface EntityFilter<T extends OwnedMetadataBase> extends EntityFilterIdentity {
    /** Additional properties to filter by, where the key is the property name and the value is the expected value or a regular expression to match against the property's value. */
    filter?: Partial<Omit<T, keyof EntityFilterIdentity>>;
}

export type IdentifierMatchMode = "exact" | "contains" | "startsWith" | "regex";

export type ObjectFilters = Partial<{
    database: DatabaseFilter;
    schema: SchemaFilter;
    relation: RelationFilter;
    routine: RoutineFilter;
    sequence: SequenceFilter;
    type: TypeFilter;
    package: PackageFilter;
}>;

/** Options for searching identifier usage */
export interface ObjectSearchOptions {
    /** The identifier to search for (e.g. table name, column name, etc.) */
    query: string;
    /** The mode to use for matching the identifier, default: "contains" */
    mode?: IdentifierMatchMode;
    /** Whether the search should be case-sensitive, default: false */
    caseSensitive?: boolean;
    /** The types of objects to search for, if undefined, all types are considered */
    objectTypes?: Array<MetadataObjectType>;
    /** Additional filters to apply to the search, where the key is the object type and the value is a filter to apply to objects of that type. */
    filters?: ObjectFilters;
}

/** Options for finding objects */
export interface ObjectFindOptions extends EntityFilterIdentity {
    /** The types of objects to search for, if undefined, all types are considered */
    objectTypes?: Array<MetadataObjectType>;
    /** Additional filters to apply to the search, where the key is the object type and the value is a filter to apply to objects of that type. */
    filters?: ObjectFilters;
}

/** Interface for querying metadata */
export interface MetadataObjectHit {
    /** The type of the object (relation, routine, etc.) */
    objectType: MetadataObjectType;
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
}

export type MetadataAnyObjectHit = RequiredOnly<MetadataObjectHit, "objectType">;

/** Interface for querying metadata */
export interface IdentifierUsageHit extends MetadataObjectHit {
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
    /** Find objects in the database based on various criteria and filters */
    findObjects(options: ObjectFindOptions): Promise<MetadataAnyObjectHit[]>;
    /** Get a query API for a specific metadata object hit, which can be used to retrieve detailed information about the object and its related entities */
    getObject(hit: MetadataAnyObjectHit): Promise<DatabaseQueryApi | SchemaQueryApi | RelationQueryApi | RoutineQueryApi | SequenceQueryApi | TypeQueryApi | PackageQueryApi | undefined>
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
        },
        findObjects: async (options: ObjectFindOptions) => {
            const result: MetadataAnyObjectHit[] = await window.dborg.database.connection.metadata.findObjects(connectionId, options);
            return result;
        },
        getObject: async (hit: MetadataAnyObjectHit): Promise<DatabaseQueryApi | SchemaQueryApi | RelationQueryApi | RoutineQueryApi | SequenceQueryApi | TypeQueryApi | PackageQueryApi | undefined> => {
            switch (hit.objectType) {
                case "database": {
                    if (!hit.databaseId) return undefined;
                    const db = await window.dborg.database.connection.metadata.getDatabase(connectionId, hit.databaseId);
                    return db ? createDatabaseQueryApi(connectionId, db) : undefined;
                }

                case "schema": {
                    if (!hit.databaseId || !hit.schemaId) return undefined;
                    const schema = await window.dborg.database.connection.metadata.getSchema(connectionId, hit.databaseId, hit.schemaId);
                    return schema ? createMetadataSchemaQuery(connectionId, hit.databaseId, schema) : undefined;
                }

                case "relation": {
                    if (!hit.databaseId || !hit.schemaId || !hit.objectId) return undefined;
                    const relation = await window.dborg.database.connection.metadata.getRelation(
                        connectionId,
                        hit.databaseId,
                        hit.schemaId,
                        hit.objectId
                    );
                    return relation ? createMetadataRelationQuery(connectionId, hit.databaseId, hit.schemaId, relation) : undefined;
                }

                case "routine": {
                    if (!hit.databaseId || !hit.schemaId || !hit.objectId) return undefined;
                    const routine = await window.dborg.database.connection.metadata.getRoutine(
                        connectionId,
                        hit.databaseId,
                        hit.schemaId,
                        undefined,
                        hit.objectId,
                    );
                    return routine ? createMetadataRoutineQuery(connectionId, hit.databaseId, hit.schemaId, undefined, routine) : undefined;
                }

                case "sequence": {
                    if (!hit.databaseId || !hit.schemaId || !hit.objectId) return undefined;
                    const sequence = await window.dborg.database.connection.metadata.getSequence(
                        connectionId,
                        hit.databaseId,
                        hit.schemaId,
                        hit.objectId
                    );
                    return sequence ? createMetadataSequenceQuery(connectionId, hit.databaseId, hit.schemaId, sequence) : undefined;
                }

                case "type": {
                    if (!hit.databaseId || !hit.schemaId || !hit.objectId) return undefined;
                    const type = await window.dborg.database.connection.metadata.getType(
                        connectionId,
                        hit.databaseId,
                        hit.schemaId,
                        undefined,
                        hit.objectId
                    );
                    return type ? createMetadataTypeQuery(connectionId, hit.databaseId, hit.schemaId, undefined, type) : undefined;
                }

                case "package": {
                    if (!hit.databaseId || !hit.schemaId || !hit.objectId) return undefined;
                    const pkg = await window.dborg.database.connection.metadata.getPackage(
                        connectionId,
                        hit.databaseId,
                        hit.schemaId,
                        hit.objectId
                    );
                    return pkg ? createMetadataPackageQuery(connectionId, hit.databaseId, hit.schemaId, pkg) : undefined;
                }

                default:
                    return undefined;
            }
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
    /**
     * Get a list of sequences, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     */
    getSequenceList(filter?: SequenceFilter): Promise<SequenceQueryApi[]>;
    /**
     * Get a full specific sequence by its name or identity
     * @param id - The id or identity of the sequence
     */
    getSequence(id: string | IdentityOptions): Promise<SequenceQueryApi | undefined>;
    /**
     * Get a list of types, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     */
    getTypeList(filter?: TypeFilter): Promise<TypeQueryApi[]>;
    /**
     * Get a full specific type by its name or identity
     * @param id - The id or identity of the type
     */
    getType(id: string | IdentityOptions): Promise<TypeQueryApi | undefined>;
    /**
     * Get a list of packages, optionally filtered by the provided criteria
     * @param filter - The filter criteria to apply
     */
    getPackageList(filter?: PackageFilter): Promise<PackageQueryApi[]>;
    /**
     * Get a full specific package by its name or identity
     * @param id - The id or identity of the package
     */
    getPackage(id: string | IdentityOptions): Promise<PackageQueryApi | undefined>;

}

const createMetadataSchemaQuery = (connectionId: string, databaseId: string, schema: SchemaDetails): SchemaQueryApi => {
    return {
        ...schema,
        getRelationList: async (filter?: RelationFilter) => {
            const relationList: RelationDetails[] = await window.dborg.database.connection.metadata.getRelationList(connectionId, databaseId, schema.id, filter);
            return relationList.map(relation => {
                return createMetadataRelationQuery(connectionId, databaseId, schema.id, relation);
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
            const routineList: RoutineDetails[] = await window.dborg.database.connection.metadata.getRoutineList(connectionId, databaseId, schema.id, undefined, filter);
            return routineList.map(routine => {
                return createMetadataRoutineQuery(connectionId, databaseId, schema.id, undefined, routine);
            });
        },
        getRoutine: async (id: string | IdentityOptions) => {
            const routine = await window.dborg.database.connection.metadata.getRoutine(connectionId, databaseId, schema.id, undefined, id);
            if (routine) {
                return createMetadataRoutineQuery(connectionId, databaseId, schema.id, undefined, routine);
            }
            return undefined;
        },
        getSequenceList: async (filter?: SequenceFilter) => {
            const sequenceList: SequenceDetails[] = await window.dborg.database.connection.metadata.getSequenceList(connectionId, databaseId, schema.id, filter);
            return sequenceList.map(sequence => {
                return createMetadataSequenceQuery(connectionId, databaseId, schema.id, sequence);
            });
        },
        getSequence: async (id: string | IdentityOptions) => {
            const sequence = await window.dborg.database.connection.metadata.getSequence(connectionId, databaseId, schema.id, id);
            if (sequence) {
                return createMetadataSequenceQuery(connectionId, databaseId, schema.id, sequence);
            }
            return undefined;
        },
        getTypeList: async (filter?: TypeFilter) => {
            const typeList: TypeDetails[] = await window.dborg.database.connection.metadata.getTypeList(connectionId, databaseId, schema.id, undefined, filter);
            return typeList.map(type => {
                return createMetadataTypeQuery(connectionId, databaseId, schema.id, undefined, type);
            });
        },
        getType: async (id: string | IdentityOptions) => {
            const type = await window.dborg.database.connection.metadata.getType(connectionId, databaseId, schema.id, undefined, id);
            if (type) {
                return createMetadataTypeQuery(connectionId, databaseId, schema.id, undefined, type);
            }
            return undefined;
        },
        getPackageList: async (filter?: PackageFilter) => {
            const packageList: PackageDetails[] = await window.dborg.database.connection.metadata.getPackageList(connectionId, databaseId, schema.id, filter);
            return packageList.map(pkg => {
                return createMetadataPackageQuery(connectionId, databaseId, schema.id, pkg);
            });
        },
        getPackage: async (id: string | IdentityOptions) => {
            const pkg = await window.dborg.database.connection.metadata.getPackage(connectionId, databaseId, schema.id, id);
            if (pkg) {
                return createMetadataPackageQuery(connectionId, databaseId, schema.id, pkg);
            }
            return undefined;
        },
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
    packageId: string | undefined;
}
export interface RoutineFilter extends EntityFilter<RoutineDetails> { }

export interface RoutineQueryApi extends RoutineDetails {
}

const createMetadataRoutineQuery = (_connectionId: string, _databaseId: string, _schemaId: string | undefined, _packageId: string | undefined, routine: RoutineDetails): RoutineQueryApi => {
    return {
        ...routine
    };
}

export interface SequenceDetails extends SequenceMetadata {
    databaseId: string;
    schemaId: string | undefined;
}
export interface SequenceFilter extends EntityFilter<SequenceDetails> { }

export interface SequenceQueryApi extends SequenceDetails {
}

const createMetadataSequenceQuery = (_connectionId: string, _databaseId: string, _schemaId: string | undefined, sequence: SequenceDetails): SequenceQueryApi => {
    return {
        ...sequence
    };
}

export interface TypeDetails extends TypeMetadata {
    databaseId: string;
    schemaId: string | undefined;
    packageId: string | undefined;
}
export interface TypeFilter extends EntityFilter<TypeDetails> { }

export interface TypeQueryApi extends TypeDetails {
}

const createMetadataTypeQuery = (_connectionId: string, _databaseId: string, _schemaId: string | undefined, _packageId: string | undefined, type: TypeDetails): TypeQueryApi => {
    return {
        ...type
    };
}

export interface PackageDetails extends Omit<PackageMetadata, "routines" | "types"> {
    databaseId: string;
    schemaId: string | undefined;
    routineCount: number;
    typeCount: number;
}
export interface PackageFilter extends EntityFilter<PackageDetails> { }

export interface PackageQueryApi extends PackageDetails {
    /**
     * Get a list of routines in the package, optionally filtered by the provided criteria
     * @param filter 
     */
    getRoutineList(filter?: RoutineFilter): Promise<RoutineQueryApi[]>;
    /**
     * Get a full specific routine in the package by its name or identity
     * @param id
     */
    getRoutine(id: string | IdentityOptions): Promise<RoutineQueryApi | undefined>;
    /**
     * Get a list of types in the package, optionally filtered by the provided criteria
     * @param filter 
     */
    getTypeList(filter?: TypeFilter): Promise<TypeQueryApi[]>;
    /**
     * Get a full specific type in the package by its name or identity
     * @param id
     */
    getType(id: string | IdentityOptions): Promise<TypeQueryApi | undefined>;
}

const createMetadataPackageQuery = (connectionId: string, databaseId: string, schemaId: string | undefined, pkg: PackageDetails): PackageQueryApi => {
    return {
        ...pkg,
        getRoutineList: async (filter?: RoutineFilter) => {
            const routineList: RoutineDetails[] = await window.dborg.database.connection.metadata.getRoutineList(connectionId, databaseId, schemaId, pkg.id, filter);
            return routineList.map(routine => {
                return createMetadataRoutineQuery(connectionId, databaseId, schemaId, pkg.id, routine);
            });
        },
        getRoutine: async (id: string | IdentityOptions) => {
            const routine: RoutineDetails | undefined = await window.dborg.database.connection.metadata.getRoutine(connectionId, databaseId, schemaId, pkg.id, id);
            if (!routine) return undefined;
            return createMetadataRoutineQuery(connectionId, databaseId, schemaId, pkg.id, routine);
        },
        getTypeList: async (filter?: TypeFilter) => {
            const typeList: TypeDetails[] = await window.dborg.database.connection.metadata.getTypeList(connectionId, databaseId, schemaId, pkg.id, filter);
            return typeList.map(type => {
                return createMetadataTypeQuery(connectionId, databaseId, schemaId, pkg.id, type);
            });
        },
        getType: async (id: string | IdentityOptions) => {
            const type: TypeDetails | undefined = await window.dborg.database.connection.metadata.getType(connectionId, databaseId, schemaId, pkg.id, id);
            if (!type) return undefined;
            return createMetadataTypeQuery(connectionId, databaseId, schemaId, pkg.id, type);
        }
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

const matchIdentity = <T extends OwnedMetadataBase>(item: T, filter: EntityFilterIdentity): boolean => {
    if (!filter) return true;

    const hasCriteria =
        filter.id !== undefined ||
        filter.name !== undefined ||
        filter.owner !== undefined;

    if (!hasCriteria) return true;

    let matched = true;

    if (filter.id !== undefined && !testFilterValue(item.id, filter.id)) matched = false;
    if (filter.name !== undefined && !testFilterValue(item.name, filter.name)) matched = false;
    if (filter.owner !== undefined && (!item.owner || !testFilterValue(item.owner, filter.owner))) matched = false;

    return filter.not ? !matched : matched;
};


/**
 * Match item against filter criteria
 * Optimized with early exit strategy and minimal allocations
 */
const matchFilter = <T extends OwnedMetadataBase>(item: T, filter?: EntityFilter<T>): boolean => {
    if (!filter) return true;

    if (!matchIdentity(item, filter)) return false;

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

const metadataRoutineToDetails = (databaseId: string, schemaId: string | undefined, packageId: string | undefined, metadata: RoutineMetadata): RoutineDetails => {
    const { arguments: args, identifiers, ...routineMetadata } = metadata;
    return {
        ...routineMetadata,
        databaseId,
        schemaId,
        packageId,
        arguments: args ?? [],
        identifiers: identifiers ?? []
    };
}

export const getMetadataRoutineList = (metadata: Metadata, databaseId: string, schemaId: string | undefined, packageId: string | undefined, filter?: RoutineFilter): RoutineDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    if (schemaId) {
        const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
        if (!schema) return [];
        if (packageId) {
            const pkg = Object.values(schema.packages ?? {}).find(pkg => pkg.id === packageId);
            if (!pkg) return [];
            return Object.values(pkg.routines ?? {})
                .flatMap(routines => Object.values(routines))
                .filter(routine => matchFilter(routine, filter))
                .map(routine => metadataRoutineToDetails(databaseId, schemaId, packageId, routine));
        }
        return Object.values(schema.routines ?? {})
            .flatMap(routines => Object.values(routines))
            .filter(routine => matchFilter(routine, filter))
            .map(routine => metadataRoutineToDetails(databaseId, schemaId, packageId, routine));
    } else {
        return Object.values(database.builtInRoutines ?? {})
            .flatMap(routines => Object.values(routines))
            .filter(routine => matchFilter(routine, filter))
            .map(routine => metadataRoutineToDetails(databaseId, schemaId, packageId, routine));
    }
}

export const getMetadataRoutine = (metadata: Metadata, databaseId: string, schemaId: string | undefined, packageId: string | undefined, id: string | IdentityOptions): RoutineDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    if (schemaId) {
        const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
        if (!schema) return undefined;
        if (packageId) {
            const pkg = Object.values(schema.packages ?? {}).find(pkg => pkg.id === packageId);
            if (!pkg) return undefined;
            const routine = Object.values(pkg.routines ?? {})
                .flatMap(routines => Object.values(routines))
                .find(routine => matchId(routine, id));
            if (!routine) return undefined;
            return metadataRoutineToDetails(databaseId, schemaId, packageId, routine);
        }
        const routine = Object.values(schema.routines ?? {})
            .flatMap(routines => Object.values(routines))
            .find(routine => matchId(routine, id));
        if (!routine) return undefined;
        return metadataRoutineToDetails(databaseId, schemaId, packageId, routine);
    } else {
        const routine = Object.values(database.builtInRoutines ?? {})
            .flatMap(routines => Object.values(routines))
            .find(routine => matchId(routine, id));
        if (!routine) return undefined;
        return metadataRoutineToDetails(databaseId, schemaId, packageId, routine);
    }
}

const metadataSequenceToDetails = (databaseId: string, schemaId: string | undefined, metadata: SequenceMetadata): SequenceDetails => {
    const { ...sequenceMetadata } = metadata;
    return {
        ...sequenceMetadata,
        databaseId,
        schemaId,
    };
}

export const getMetadataSequenceList = (metadata: Metadata, databaseId: string, schemaId: string | undefined, filter?: SequenceFilter): SequenceDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
    if (!schema) return [];
    return Object.values(schema.sequences ?? {})
        .filter(sequence => matchFilter(sequence, filter))
        .map(sequence => metadataSequenceToDetails(databaseId, schemaId, sequence));
}

export const getMetadataSequence = (metadata: Metadata, databaseId: string, schemaId: string | undefined, id: string | IdentityOptions): SequenceDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
    if (!schema) return undefined;
    const sequence = Object.values(schema.sequences ?? {}).find(sequence => matchId(sequence, id));
    if (!sequence) return undefined;
    return metadataSequenceToDetails(databaseId, schemaId, sequence);
}

const metadataTypeToDetails = (databaseId: string, schemaId: string | undefined, packageId: string | undefined, metadata: TypeMetadata): TypeDetails => {
    const { ...typeMetadata } = metadata;
    return {
        ...typeMetadata,
        databaseId,
        schemaId,
        packageId,
    };
}

export const getMetadataTypeList = (metadata: Metadata, databaseId: string, schemaId: string | undefined, packageId: string | undefined, filter?: TypeFilter): TypeDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
    if (!schema) return [];
    if (packageId) {
        const pkg = Object.values(schema.packages ?? {}).find(pkg => pkg.id === packageId);
        if (!pkg) return [];
        return Object.values(pkg.types ?? {})
            .filter(type => matchFilter(type, filter))
            .map(type => metadataTypeToDetails(databaseId, schemaId, packageId, type));
    }
    return Object.values(schema.types ?? {})
        .filter(type => matchFilter(type, filter))
        .map(type => metadataTypeToDetails(databaseId, schemaId, undefined, type));
}

export const getMetadataType = (metadata: Metadata, databaseId: string, schemaId: string | undefined, packageId: string | undefined, id: string | IdentityOptions): TypeDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
    if (!schema) return undefined;
    if (packageId) {
        const pkg = Object.values(schema.packages ?? {}).find(pkg => pkg.id === packageId);
        if (!pkg) return undefined;
        const type = Object.values(pkg.types ?? {}).find(type => matchId(type, id));
        if (!type) return undefined;
        return metadataTypeToDetails(databaseId, schemaId, packageId, type);
    }
    const type = Object.values(schema.types ?? {}).find(type => matchId(type, id));
    if (!type) return undefined;
    return metadataTypeToDetails(databaseId, schemaId, undefined, type);
}

const metadataPackageToDetails = (databaseId: string, schemaId: string | undefined, metadata: PackageMetadata): PackageDetails => {
    const { routines, types, ...packageMetadata } = metadata;
    return {
        ...packageMetadata,
        databaseId,
        schemaId,
        routineCount: Object.keys(routines ?? {}).length,
        typeCount: Object.keys(types ?? {}).length,
    };
}

export const getMetadataPackageList = (metadata: Metadata, databaseId: string, schemaId: string | undefined, filter?: PackageFilter): PackageDetails[] => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return [];
    const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
    if (!schema) return [];
    return Object.values(schema.packages ?? {})
        .filter(pkg => matchFilter(pkg, filter))
        .map(pkg => metadataPackageToDetails(databaseId, schemaId, pkg));
}

export const getMetadataPackage = (metadata: Metadata, databaseId: string, schemaId: string | undefined, id: string | IdentityOptions): PackageDetails | undefined => {
    const database = Object.values(metadata.databases ?? {}).find(db => db.id === databaseId);
    if (!database) return undefined;
    const schema = Object.values(database.schemas ?? {}).find(schema => schema.id === schemaId);
    if (!schema) return undefined;
    const pkg = Object.values(schema.packages ?? {}).find(pkg => matchId(pkg, id));
    if (!pkg) return undefined;
    return metadataPackageToDetails(databaseId, schemaId, pkg);
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

export const searchIdentifierUsage = (
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
            if (!options.objectTypes || allowObjectType("relation", options.objectTypes)) {
                for (const relation of Object.values(schema.relations ?? {}).filter(relation => matchFilter(relation, options.filters?.relation))) {
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
                            matchedIdentifier: id,
                        });
                    }
                }
            }

            if (!options.objectTypes || allowObjectType("routine", options.objectTypes)) {
                for (const routineGroup of Object.values(schema.routines ?? {})) {
                    for (const routine of Object.values(routineGroup).filter(routine => matchFilter(routine, options.filters?.routine))) {
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

export const findObjects = (
    metadata: Metadata,
    options: ObjectFindOptions
): MetadataAnyObjectHit[] => {
    const result: MetadataAnyObjectHit[] = [];

    for (const database of Object.values(metadata.databases ?? {}).filter(db => matchFilter(db, options.filters?.database))) {
        if ((!options.objectTypes || allowObjectType("database", options.objectTypes)) && matchIdentity(database, options)) {
            result.push({
                objectType: "database",
                databaseId: database.id,
                databaseName: database.name,
            });
        }
        for (const schema of Object.values(database.schemas ?? {}).filter(schema => matchFilter(schema, options.filters?.schema))) {
            if ((!options.objectTypes || allowObjectType("schema", options.objectTypes)) && matchIdentity(schema, options)) {
                result.push({
                    objectType: "schema",
                    databaseId: database.id,
                    databaseName: database.name,
                    schemaId: schema.id,
                    schemaName: schema.name,
                });
            }
            if (!options.objectTypes || allowObjectType("relation", options.objectTypes)) {
                for (const relation of Object.values(schema.relations ?? {}).filter(relation => matchFilter(relation, options.filters?.relation))) {
                    if (!matchIdentity(relation, options)) continue;
                    result.push({
                        objectType: "relation",
                        databaseId: database.id,
                        databaseName: database.name,
                        schemaId: schema.id,
                        schemaName: schema.name,
                        objectId: relation.id,
                        objectName: relation.name,
                    });
                }
            }
            if (!options.objectTypes || allowObjectType("routine", options.objectTypes)) {
                for (const routineGroup of Object.values(schema.routines ?? {})) {
                    for (const routine of Object.values(routineGroup).filter(routine => matchFilter(routine, options.filters?.routine))) {
                        if (!matchIdentity(routine, options)) continue;
                        result.push({
                            objectType: "routine",
                            databaseId: database.id,
                            databaseName: database.name,
                            schemaId: schema.id,
                            schemaName: schema.name,
                            objectId: routine.id,
                            objectName: routine.name,
                        });
                    }
                }
            }
            if (!options.objectTypes || allowObjectType("sequence", options.objectTypes)) {
                for (const sequence of Object.values(schema.sequences ?? {}).filter(sequence => matchFilter(sequence, options.filters?.sequence))) {
                    if (!matchIdentity(sequence, options)) continue;
                    result.push({
                        objectType: "sequence",
                        databaseId: database.id,
                        databaseName: database.name,
                        schemaId: schema.id,
                        schemaName: schema.name,
                        objectId: sequence.id,
                        objectName: sequence.name,
                    });
                }
            }
            if (!options.objectTypes || allowObjectType("type", options.objectTypes)) {
                for (const type of Object.values(schema.types ?? {}).filter(type => matchFilter(type, options.filters?.type))) {
                    if (!matchIdentity(type, options)) continue;
                    result.push({
                        objectType: "type",
                        databaseId: database.id,
                        databaseName: database.name,
                        schemaId: schema.id,
                        schemaName: schema.name,
                        objectId: type.id,
                        objectName: type.name,
                    });
                }
            }
            if (!options.objectTypes || allowObjectType("package", options.objectTypes)) {
                for (const pkg of Object.values(schema.packages ?? {}).filter(pkg => matchFilter(pkg, options.filters?.package))) {
                    if (!matchIdentity(pkg, options)) continue;
                    result.push({
                        objectType: "package",
                        databaseId: database.id,
                        databaseName: database.name,
                        schemaId: schema.id,
                        schemaName: schema.name,
                        objectId: pkg.id,
                        objectName: pkg.name,
                    });
                }
            }
        }
    }

    return result;
}
