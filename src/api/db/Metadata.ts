import internal from "src/main/core/db/internal";
import { DatabaseFilter, DatabaseDetails, EntityFilter, IdentityOptions, MetadataQueryApi } from "./MetadataQuery";

export const METADATA_VERSION = 11;

/** Options for collecting metadata */
export interface MetadataCollectionOptions {
    /** relation statistics collected */
    relationStats?: boolean;
    /** relation column statistics collected */
    relationColumnStats?: boolean;
    /** routine and view identifiers collected from source */
    identifiers?: boolean;
    /** index statistics collected */
    indexStats?: boolean;
    /** system objects collected */
    systemObjects?: boolean;
    /** built-in objects collected */
    builtInObjects?: boolean;
    /** constraints collected (fk, pk, unique, check) */
    constraints?: boolean;
    /** permissions collected */
    permissions?: boolean;
}

/** Structure describing metadata */
export interface Metadata {
    /** Version of the metadata */
    version?: number;
    /** Updated date of the metadata */
    date?: number;
    /** Options used for collecting metadata */
    collected?: MetadataCollectionOptions;
    /** Databases metadata */
    databases?: Record<string, DatabaseMetadata>;
}

export interface MetadataBase {
    /** Unique identifier of the object */
    id: string;
    /** Object name */
    name: string;
    /** Unique object identity */
    identity?: string | null;
    /** Description of the object */
    description?: string | null;
    /** Custom data */
    data?: Record<string, any>;
}

export interface OwnedMetadataBase extends MetadataBase {
    /** Owner of the object */
    owner?: string | null;
    /** Creation timestamp */
    created?: string | null;
    /** Last modification timestamp */
    modified?: string | null;
}

export interface DatabasePermissions {
    /** User have permission for connect */
    connect?: boolean | null;
    /** User have permission for create schema */
    create?: boolean | null;
    /** User have permission for temporary tables */
    temp?: boolean | null;
}

/** Main structure describing the database */
export interface DatabaseMetadata extends OwnedMetadataBase {
    /** Permissions assigned to the database */
    permissions?: DatabasePermissions;

    /** To this database are you connected */
    connected?: boolean | null;

    /** Whether the database is the template database */
    template?: boolean | null;

    /** List of schemas in the database */
    schemas: Record<string, SchemaMetadata>;

    /** List of built-in tables in the database */
    builtInRelations?: Record<string, RelationMetadata>;

    /** List of built-in types in the database */
    builtInTypes?: Record<string, TypeMetadata>;

    /** List of built-in routines in the database */
    builtInRoutines?: Record<string, RoutineMetadata>;
}

/** List of permissions? assigned to the schema */
export type SchemaPermissions = {
    /** User have permission for create object */
    create?: boolean | null;

    /** User have permission for usage */
    usage?: boolean | null;
}

/** Structure describing a schema */
export interface SchemaMetadata extends OwnedMetadataBase {
    /** Whether the schema is the default schema for logged user, can be more than one */
    default?: boolean | null;

    /** is database catalog schema */
    catalog?: boolean | null;

    /** Permissions assigned to the schema */
    permissions?: SchemaPermissions;

    /** List of relations in the schema */
    relations: Record<string, RelationMetadata>;

    /** Map of functions in the schema, grouped by name */
    routines?: Record<string, RoutineMetadata[]>;

    /** Map of packages in the schema */
    packages?: Record<string, PackageMetadata>;

    /** List of sequences in the schema */
    sequences?: Record<string, SequenceMetadata>;

    /** List of user-defined types in the schema */
    types?: Record<string, TypeMetadata>;
}

export interface RoutinePermissions {
    /** User have permission for execute */
    execute: boolean;
}

/** Structure describing a package */
export interface PackageMetadata extends OwnedMetadataBase {
    /** Permissions assigned to the package */
    permissions?: RoutinePermissions;

    /** Map of routines in the package, grouped by name */
    routines?: Record<string, RoutineMetadata[]>;

    /** Map of types in the package, grouped by name */
    types?: Record<string, TypeMetadata>;
}

export type RoutineType = "function" | "procedure";
export type RoutineKind = "regular" | "trigger" | "aggregate" | "window" | "set-returning";

/** Structure describing a function overload */
export interface RoutineMetadata extends OwnedMetadataBase {
    /** Routine type */
    type: RoutineType;

    /** Routine kind */
    kind?: RoutineKind;

    /** Permissions assigned to the function */
    permissions?: RoutinePermissions;

    /** Return type of the function */
    returnType: string;

    /** List of function arguments */
    arguments: RoutineArgumentMetadata[];

    /** List of identifiers for the routine code */
    identifiers?: string[] | null;
}

export type RoutineArgumentMode = "in" | "out" | "inout";

/** Structure describing a routine argument */
export interface RoutineArgumentMetadata extends MetadataBase {
    /** Argument number in the function/procedure */
    no: number;

    /** Data type of the argument */
    dataType: string;

    /** Default value of the argument */
    defaultValue?: string | null;

    /** Argument mode */
    mode?: RoutineArgumentMode | null;
}

export type RelationType = "table" | "view";
export type RelationKind = "regular" | "foreign" | "partitioned" | "temporary" | "materialized";

/** Structure describing permissions? */
export interface RelationPermissions {
    /** User have permission for select */
    select?: boolean | null;

    /** User have permission for update */
    update?: boolean | null;

    /** User have permission for insert */
    insert?: boolean | null;

    /** List of users or roles with delete access */
    delete?: boolean | null;
}

export interface RelationStatsMetadata {
    /** Size of the relation (bytes) */
    size?: number | null;

    /** Number of pages in the relation */
    pages?: number | null;

    /** Number of rows in the relation */
    rows?: number | null;

    /** Average row length (bytes) */
    avgRowLength?: number | null;

    /** Bytes reads from the relation */
    reads?: number | null;

    /** Bytes writes to the relation */
    writes?: number | null;

    /** Number of scans on the relation, e.g., sequential scans */
    scans?: number | null;

    /** Number of inserts on the relation */
    inserts?: number | null;

    /** Number of updates on the relation */
    updates?: number | null;

    /** Number of deletes on the relation */
    deletes?: number | null;

    /** Timestamp of the last analyze operation (ISO 8601 format) */
    lastAnalyze?: string | null;

    [key: string]: any;
}

/** Structure describing a table */
export interface RelationMetadata extends OwnedMetadataBase {
    /** Type of the relation */
    type: RelationType;

    /** Kind of the relation */
    kind?: RelationKind | null;

    /** Permissions assigned to the relation */
    permissions?: RelationPermissions;

    /** List of columns in the relation */
    columns: ColumnMetadata[];

    /** List of constraints on the relation */
    constraints?: ConstraintMetadata[];

    /** List of columns in the primary key */
    primaryKey?: PrimaryKeyMetadata;

    /** List of foreign keys */
    foreignKeys?: ForeignKeyMetadata[];

    /** List of indexes */
    indexes?: IndexMetadata[];

    /** Stats of the relation */
    stats?: RelationStatsMetadata;

    /** List of identifiers (for views) */
    identifiers?: string[] | null;
}

export type ColumnPermissions = {
    /** User have permission for select */
    select?: boolean | null;

    /** User have permission for update */
    update?: boolean | null;
}

export type ColumnStatsMetadata = {
    /** Fraction of NULL values in the column */
    nullFraction?: number | null;

    /** Average width of the column (bytes) */
    avgWidth?: number | null;

    /** Number of distinct values in the column */
    nDistinct?: number | null;

    /** Most common values in the column */
    mostCommonValues?: any[] | null;

    /** Frequencies of the most common values */
    mostCommonFreqs?: number[] | null;

    /** Histogram of the column values */
    histogram?: any[] | null;

    [key: string]: any;
}

/** Structure describing a column */
export interface ColumnMetadata extends MetadataBase {
    /** Column number in the relation */
    no: number;

    /** Data type (e.g., VARCHAR, INT) */
    dataType: string;

    /** Full data type (e.g., VARCHAR(255), NUMERIC(10, 2)) */
    displayType?: string | null;

    /** Permissions assigned to the column */
    permissions?: ColumnPermissions;

    /** Whether the column can be NULL */
    nullable?: boolean | null;

    /** Default value of the column */
    defaultValue?: string | null;

    /** Whether the column is part of the primary key */
    primaryKey?: boolean | null;

    /** Whether the column is part of a foreign key */
    foreignKey?: boolean | null;

    /** Whether the column has a unique index */
    unique?: boolean | null;

    stats?: ColumnStatsMetadata;
}

export type ForeignKeyActionType = 'cascade' | 'set null' | 'set default' | 'no action' | 'restrict';

/** Structure describing a foreign key */
export interface ForeignKeyMetadata extends MetadataBase {
    /** Column name in the relation */
    column: string[];

    /** Name of the referenced schema */
    referencedSchema: string;

    /** Name of the referenced table */
    referencedTable: string;

    /** Name of the referenced column */
    referencedColumn: string[];

    /** Action on update (e.g., CASCADE, SET NULL) */
    onUpdate?: ForeignKeyActionType;

    /** Action on delete (e.g., CASCADE, SET NULL) */
    onDelete?: ForeignKeyActionType;
}

export type SortOrder = "asc" | "desc";
export type NullsPosition = "first" | "last";

/** Structure describing an index column */
export interface IndexColumnMetadata {
    /** Column name in the index */
    name: string;

    /** Unique object identity */
    identity?: string | null;

    /** Sort order (e.g., ASC, DESC) */
    order?: SortOrder | null;

    /** Position of nulls in the sort order (e.g., FIRST, LAST) */
    nulls?: NullsPosition | null;
}

export interface IndexStatsMetadata {
    /** Number of rows in the index */
    rows?: number | null;

    /** Size of the index (bytes) */
    size?: string | null;

    /** Bytes reads from the index */
    reads?: number | null;

    /** Bytes writes to the index */
    writes?: number | null;

    /** Number of scans on the index, e.g., sequential scans */
    scans?: number | null;

    [key: string]: any;
}

/** Structure describing an index */
export interface IndexMetadata extends MetadataBase {
    /** List of columns in the index */
    columns: IndexColumnMetadata[];

    /** Whether the index is unique */
    unique: boolean;

    /** Whether the index is a primary key */
    primary?: boolean | null;

    /** Stats of the index */
    stats?: IndexStatsMetadata;
}

export interface PrimaryKeyMetadata extends MetadataBase {
    /** List of columns in the primary key */
    columns: string[];
}

export type ConstraintType = "check" | "unique" | "primary key" | "foreign key" | "trigger" | "exclude" | "not null" | string;

export interface ConstraintMetadata extends MetadataBase {
    /** Type of the constraint (e.g., CHECK, UNIQUE) */
    type: ConstraintType;

    /** Expression defining the constraint */
    expression?: string | null;
}

/** Structure describing permissions? for the sequence */
export type SequencePermissions = {
    /** User have permission for select current value */
    select?: boolean | null;

    /** User have permission for usage */
    usage?: boolean | null;

    /** User have permission for update next value */
    update?: boolean | null;
}

/** Structure describing a sequence */
export interface SequenceMetadata extends OwnedMetadataBase {
    /** Permissions assigned to the sequence */
    permissions?: SequencePermissions;

    /** Increment value */
    increment?: number | null;

    /** Minimum value */
    min?: number | null;

    /** Maximum value */
    max?: number | null;

    /** Starting value */
    start?: number | null;

    /** Cache size */
    cache?: number | null;

    /** Whether the sequence is cyclic */
    cycled?: boolean | null;
}

export type TypeKind = "enum" | "composite" | "base" | "domain" | "range" | "pseudo" | "xml" | "json" | "jsonb" | "hstore" | "array";

/** Structure describing permissions? for the type */
export type TypePermissions = {
    /** User have permission for usage type */
    usage?: boolean | null;
}

/** Structure describing a user-defined type */
export interface TypeMetadata extends OwnedMetadataBase {
    /** Permissions assigned to the type */
    permissions?: TypePermissions;

    /** Type kind */
    kind: TypeKind;

    /** Values (for ENUM types) */
    values?: string[];

    /** Attributes (for composite types) */
    attributes?: ColumnMetadata[];
}

//export type MetadataCollectorOptions = {


export interface IMetadataCollector {
    getMetadata(progress?: (current: string) => void, force?: boolean): Promise<Metadata>;
    updateObject(progress?: (current: string) => void, schemaName?: string, objectName?: string): Promise<void>;
}

export interface IMetadataMainCollector extends IMetadataCollector {
    getMetadata(progress?: (current: string) => void, force?: boolean): Promise<Metadata>;
}

export interface IMetadataSessionCollector {
    getMetadataQuery(): Promise<MetadataQueryApi>;
    getMetadata(progress?: (current: string) => void, force?: boolean): Promise<Metadata>;
    updateObject(progress?: (current: string) => void, schemaName?: string, objectName?: string): Promise<void>;
}
