/** Structure describing multiple databases */
export type DatabasesMetadata = Record<string, DatabaseMetadata>;

/** List of permissions? assigned to the database */
export type DatabasePermissions = {
    /** User have permission for connect */
    connect: boolean;

    /** User have permission for create schema */
    create: boolean;
};

/** Main structure describing the database */
export interface DatabaseMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Database name */
    name: string;

    /** Description of the database */
    description?: string;

    /** Owner of the database */
    owner?: string;

    /** To this database are you connected */
    connected?: boolean;

    /** Whether the database is the template database */
    template?: boolean;

    /** Permissions assigned to the database */
    permissions?: DatabasePermissions;

    /** List of schemas in the database */
    schemas: Record<string, SchemaMetadata>;

    /** List of built-in tables in the database */
    builtInRelations?: Record<string, Partial<RelationMetadata>>;

    /** List of built-in types in the database */
    builtInTypes?: Record<string, Partial<TypeMetadata>>;

    /** List of built-in routines in the database */
    builtInRoutines?: Record<string, Partial<RoutineMetadata>>;

    /** Custom data */
    data?: Record<string, any>;
}

/** List of permissions? assigned to the schema */
export type SchemaPermissions = {
    /** User have permission for create object */
    create: boolean;

    /** User have permission for usage */
    usage: boolean;
}

/** Structure describing a schema */
export interface SchemaMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Whether the schema is the default schema for logged user, can be more than one */
    default?: boolean;

    /** is database catalog schema */
    catalog?: boolean;

    /** Schema name */
    name: string;

    /** Description of the schema */
    description?: string;

    /** Owner of the schema */
    owner?: string;

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

    /** Custom data */
    data?: Record<string, any>;
}

export interface RoutinePermissions {
    /** User have permission for execute */
    execute: boolean;
}

/** Structure describing a package */
export interface PackageMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Package name */
    name: string;

    /** Description of the package */
    description?: string;

    /** Owner of the package */
    owner?: string;

    /** Permissions assigned to the package */
    permissions?: RoutinePermissions;

    /** Map of routines in the package, grouped by name */
    routines?: Record<string, RoutineMetadata[]>;

    /** Map of types in the package, grouped by name */
    types?: Record<string, TypeMetadata>;

    /** Custom data */
    data?: Record<string, any>;
}

export type RoutineType = "function" | "procedure";
export type RoutineKind = "trigger" | "aggregate" | "window" | "set-returning";

/** Structure describing a function overload */
export interface RoutineMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Function name */
    name: string;

    /** Routine type */
    type: RoutineType;

    /** Routine kind */
    kind?: RoutineKind;

    /** Description of the function */
    description?: string;

    /** Owner of the function */
    owner?: string;

    /** Permissions assigned to the function */
    permissions?: RoutinePermissions;

    /** Return type of the function */
    returnType: string;

    /** List of function arguments */
    arguments: RoutineArgumentMetadata[];

    /** List of identifiers for the routine code */
    identifiers?: string[];

    /** Custom data */
    data?: Record<string, any>;
}

export type RoutineArgumentMode = "in" | "out" | "inout";

/** Structure describing a routine argument */
export interface RoutineArgumentMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Argument number in the function/procedure */
    no: number;

    /** Argument name */
    name?: string;

    /** Description of the argument */
    description?: string;

    /** Data type of the argument */
    dataType: string;

    /** Default value of the argument */
    defaultValue?: string;

    /** Argument mode */
    mode?: RoutineArgumentMode;

    /** Custom data */
    data?: Record<string, any>;
}

export type RelationType = "table" | "view";
export type RelationKind = "regular" | "foreign" | "partitioned" | "temporary" | "materialized";

/** Structure describing permissions? */
export interface RelationPermissions {
    /** User have permission for select */
    select: boolean;

    /** User have permission for update */
    update: boolean;

    /** User have permission for insert */
    insert: boolean;

    /** List of users or roles with delete access */
    delete: boolean;
}

export interface RelationStatsMetadata {
    /** Number of rows in the relation */
    rows: number;

    /** Size of the relation (bytes) */
    size: string;

    /** Bytes reads from the relation */
    reads: number;

    /** Bytes writes to the relation */
    writes: number;

    /** Number of scans on the relation, e.g., sequential scans */
    scans: number;

    /** Number of inserts on the relation */
    inserts: number;
    
    /** Number of updates on the relation */
    updates: number;
    
    /** Number of deletes on the relation */
    deletes: number;
}

/** Structure describing a table */
export interface RelationMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Table name */
    name: string;

    /** Type of the relation */
    type?: RelationType;

    /** Kind of the relation */
    kind?: RelationKind;

    /** Description of the relation */
    description?: string;

    /** Owner of the relation */
    owner?: string;

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
    stats?: Partial<RelationStatsMetadata>;

    /** Custom data */
    data?: Record<string, any>;

    /** List of identifiers (for views) */
    identifiers?: string[];
}

export type ColumnPermissions = {
    /** User have permission for select */
    select: boolean;

    /** User have permission for update */
    update: boolean;
}

/** Structure describing a column */
export interface ColumnMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Column number in the relation */
    no: number;

    /** Column name */
    name: string;

    /** Description of the column */
    description?: string;

    /** Data type (e.g., VARCHAR, INT) */
    dataType: string;

    /** Full data type (e.g., VARCHAR(255), NUMERIC(10, 2)) */
    displayType?: string;

    /** Permissions assigned to the column */
    permissions?: ColumnPermissions;

    /** Whether the column can be NULL */
    nullable: boolean;

    /** Default value of the column */
    defaultValue?: string;

    /** Whether the column is part of the primary key */
    primaryKey?: boolean;

    /** Whether the column is part of a foreign key */
    foreignKey?: boolean;

    /** Whether the column has a unique index */
    unique?: boolean;

    /** Custom data */
    data?: Record<string, any>;
}

export type ForeignKeyAction = 'cascade' | 'set null' | 'set default' | 'no action' | 'restrict';

/** Structure describing a foreign key */
export interface ForeignKeyMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Foreign key name */
    name: string;

    /** Column name in the relation */
    column: string[];

    /** Description of the foreign key */
    description?: string;

    /** Name of the referenced schema */
    referencedSchema: string;

    /** Name of the referenced table */
    referencedTable: string;

    /** Name of the referenced column */
    referencedColumn: string[];

    /** Action on update (e.g., CASCADE, SET NULL) */
    onUpdate?: ForeignKeyAction;

    /** Action on delete (e.g., CASCADE, SET NULL) */
    onDelete?: ForeignKeyAction;

    /** Custom data */
    data?: Record<string, any>;
}

export type SortOrder = "asc" | "desc";
export type NullsPosition = "first" | "last";

/** Structure describing an index column */
export interface IndexColumnMetadata {
    /** Column name in the index */
    name: string;

    /** Sort order (e.g., ASC, DESC) */
    order?: SortOrder;

    /** Position of nulls in the sort order (e.g., FIRST, LAST) */
    nulls?: NullsPosition;
}

export interface IndexStatsMetadata {
    /** Number of rows in the index */
    rows: number;

    /** Size of the index (bytes) */
    size: string;

    /** Bytes reads from the index */
    reads: number;

    /** Bytes writes to the index */
    writes: number;

    /** Number of scans on the index, e.g., sequential scans */
    scans: number;
}

/** Structure describing an index */
export interface IndexMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Index name */
    name: string;

    /** Description of the index */
    description?: string;

    /** List of columns in the index */
    columns: IndexColumnMetadata[];

    /** Whether the index is unique */
    unique: boolean;

    /** Whether the index is a primary key */
    primary?: boolean;

    /** Stats of the index */
    stats?: Partial<IndexStatsMetadata>;

    /** Custom data */
    data?: Record<string, any>;
}

export interface PrimaryKeyMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Primary key name */
    name: string;

    /** List of columns in the primary key */
    columns: string[];

    /** Description of the primary key */
    description?: string;

    /** Custom data */
    data?: Record<string, any>;
}

export type ConstraintType = "check" | "unique" | "primary key" | "foreign key" | "trigger" | "exclude" | "not null" | string;

export interface ConstraintMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Constraint name */
    name: string;

    /** Description of the constraint */
    description?: string;

    /** Type of the constraint (e.g., CHECK, UNIQUE) */
    type: ConstraintType;

    /** Expression defining the constraint */
    expression?: string;

    /** Custom data */
    data?: Record<string, any>;
}

/** Structure describing permissions? for the sequence */
export type SequencePermissions = {
    /** User have permission for select current value */
    select: boolean;

    /** User have permission for usage */
    usage: boolean;

    /** User have permission for update next value */
    update: boolean;
}

/** Structure describing a sequence */
export interface SequenceMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Sequence name */
    name: string;

    /** Description of the sequence */
    description?: string;

    /** Owner of the sequence */
    owner?: string;

    /** Permissions assigned to the sequence */
    permissions?: Permissions;

    /** Increment value */
    increment?: number;

    /** Minimum value */
    min?: number;

    /** Maximum value */
    max?: number;

    /** Starting value */
    start?: number;

    /** Cache size */
    cache?: number;

    /** Whether the sequence is cyclic */
    cycled?: boolean;

    /** Custom data */
    data?: Record<string, any>;
}

export type TypeKind = "enum" | "composite" | "base" | "domain" | "range" | "pseudo" | "xml" | "json" | "jsonb" | "hstore" | "array";

/** Structure describing permissions? for the type */
export type TypePermissions = {
    /** User have permission for usage type */
    usage: boolean;
}

/** Structure describing a user-defined type */
export interface TypeMetadata {
    /** Unique identifier of the object */
    id: string;

    /** Type name */
    name: string;

    /** Description of the type */
    description?: string;

    /** Owner of the type */
    owner?: string;

    /** Permissions assigned to the type */
    permissions?: TypePermissions;

    /** Type kind */
    kind: TypeKind;

    /** Values (for ENUM types) */
    values?: string[];

    /** Attributes (for composite types) */
    attributes?: ColumnMetadata[];

    /** Custom data */
    data?: Record<string, any>;
}

export interface IMetadataCollector {
    getMetadata(progress?: (current: string) => void, force?: boolean): Promise<DatabasesMetadata>;
    updateObject(progress?: (current: string) => void, schemaName?: string, objectName?: string): Promise<void>;
}
