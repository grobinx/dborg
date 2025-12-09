import { Typography } from "@mui/material";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { Action, Actions } from "@renderer/components/CommandPalette/ActionManager";

export interface TableColumnRecord {
    no: number;
    name: string;
    data_type: string;
    display_type: string;
    not_null: boolean;
    default_value: string | null;
    foreign_key: boolean;
    primary_key: boolean;
    unique: boolean;
    description: string | null;
    has_index: boolean;
    [key: string]: any;
}

interface ColumnDetailRecord {
    // Typ szczegółowy
    type_schema: string;
    type_name: string;
    base_type: string | null;
    is_array: boolean;
    array_elem_type: string | null;
    char_max_length: number | null;
    numeric_precision: number | null;
    numeric_scale: number | null;

    // Collation
    collation_schema: string | null;
    collation_name: string | null;
    is_custom_collation: boolean;

    // Identity / Generated
    identity_generation: string | null;
    identity_start: string | null;
    identity_increment: string | null;
    identity_maximum: string | null;
    identity_minimum: string | null;
    identity_cycle: boolean | null;
    generated_expr: string | null;

    // Storage
    storage: string;
    compression: string | null;
    statistics_target: number | null;

    // Klucze i ograniczenia (szczegóły)
    pk_constraint_name: string | null;
    pk_position: number | null;

    // Dziedziczenie / partycje
    is_inherited: boolean;
    is_partition_key: boolean;

    [key: string]: any;
}

type ScriptAlterMode = "data-type" | "default" | "not-null" | "rename" | "collation" | "identity" | "compression" | "statistics";

const columnsTab = (
    session: IDatabaseSession,
    selectedTable: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const major = parseInt((session.getVersion() ?? "0").split(".")[0], 10);

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    let selected: TableColumnRecord | null = null;
    let columnDetails: ColumnDetailRecord | null = null;
    let scriptMode: "add" | "alter" | "drop" | "comment" = "add";
    let scriptNegationMode: boolean = false;
    let scriptAlterMode: ScriptAlterMode = "data-type";

    return {
        id: cid("table-columns-tab"),
        type: "tab",
        label: {
            id: cid("table-columns-tab-label"),
            type: "tablabel",
            label: t("columns", "Columns"),
        },
        content: {
            id: cid("table-columns-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-columns-split"),
                type: "split",
                direction: "horizontal",
                first: () => ({
                    id: cid("table-columns-grid"),
                    type: "grid",
                    mode: "defined",
                    onRowSelect(row: TableColumnRecord, refresh) {
                        selected = row;
                        if (selected) {
                            refresh(cid("table-columns-info-panel-title"));
                            refresh(cid("table-columns-info-panel-grid"));
                        }
                    },
                    rows: async () => {
                        selected = null;
                        if (!selectedTable()) return [];
                        const { rows } = await session.query<TableColumnRecord>(`
                        select 
                            att.attnum as no, 
                            att.attname as name, 
                            att.atttypid::regtype::text as data_type,
                            pg_catalog.format_type(att.atttypid, att.atttypmod) as display_type,
                            att.attnotnull as not_null, 
                            pg_catalog.pg_get_expr(def.adbin, def.adrelid) as default_value,
                            exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='f' and att.attnum = any(conkey)) as foreign_key,
                            exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='p' and att.attnum = any(conkey)) as primary_key,
                            exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='u' and att.attnum = any(conkey)) as unique,
                            des.description as description,
                            exists (
                                select from pg_catalog.pg_index idx
                                where idx.indrelid = att.attrelid 
                                and att.attnum = any(idx.indkey)
                            ) as has_index
                        from pg_catalog.pg_attribute att
                            join pg_catalog.pg_class cl on cl.oid = att.attrelid
                            join pg_catalog.pg_namespace na on na.oid = cl.relnamespace
                            left outer join pg_catalog.pg_attrdef def on adrelid = att.attrelid and adnum = att.attnum
                            left outer join pg_catalog.pg_description des on des.classoid = 'pg_class'::regclass and des.objoid = att.attrelid and des.objsubid = att.attnum
                        where att.attnum > 0
                            and cl.relkind in ('r', 'f', 'p', 't', 'v', 'm')
                            and na.nspname not ilike 'pg_toast%' and na.nspname not ilike 'pg_temp%'
                            and na.nspname = $1
                            and cl.relname = $2
                            and att.atttypid != 0
                        order by no`,
                            [selectedTable()!.schema_name, selectedTable()!.table_name]
                        );
                        return rows;
                    },
                    columns: [
                        { key: "no", label: t("ordinal-number-short", "No"), width: 50, dataType: "number" },
                        { key: "name", label: t("name", "Name"), width: 160, dataType: "string" },
                        { key: "display_type", label: t("data-type", "Data Type"), width: 160, dataType: "string" },
                        {
                            key: "not_null",
                            label: t("null", "Null"),
                            width: 40,
                            dataType: "boolean",
                            formatter: (value: boolean) => (
                                <Typography component="span" variant="inherit" color={value ? "success" : "warning"}>
                                    {value ? t("no", "No") : t("yes", "Yes")}
                                </Typography>
                            ),
                        },
                        { key: "default_value", label: t("default", "Default"), width: 120, dataType: "string" },
                        { key: "foreign_key", label: t("fk", "FK"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                        { key: "primary_key", label: t("pk", "PK"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                        { key: "unique", label: t("unq", "Unq"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                        { key: "has_index", label: t("idx", "Idx"), width: 40, dataType: "boolean", formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                        { key: "description", label: t("comment", "Comment"), width: 350, dataType: "string" },
                    ] as ColumnDefinition[],
                    autoSaveId: "table-columns-grid-" + session.profile.sch_id,
                } as IGridSlot),
                second: () => ({
                    id: cid("table-columns-column-split"),
                    type: "split",
                    direction: "vertical",
                    secondSize: 30,
                    autoSaveId: "table-columns-column-split-" + session.profile.sch_id,
                    first: () => ({
                        id: cid("table-columns-info-panel-content"),
                        type: "content",
                        title: () => ({
                            id: cid("table-columns-info-panel-title"),
                            type: "title",
                            title: () => selected ? selected.name : t("column-details", "Column Details"),
                        }),
                        main: (refresh) => ({
                            id: cid("table-columns-info-panel-grid"),
                            type: "grid",
                            pivot: true,
                            rows: async () => {
                                if (!selected || !selectedTable()) return [];

                                const { rows } = await session.query<ColumnDetailRecord>(columnDetailQuery(session.getVersion()), [
                                    selectedTable()!.schema_name,
                                    selectedTable()!.table_name,
                                    selected!.name,
                                ]);

                                columnDetails = rows.length > 0 ? rows[0] : null;
                                if (columnDetails) {
                                    refresh(cid("table-columns-column-editor"));
                                }

                                scriptNegationMode = false;

                                return rows;
                            },
                            columns: [
                                { key: "type_schema", label: t("type-schema", "Type Schema"), width: 120, dataType: "string" },
                                { key: "type_name", label: t("type-name", "Type Name"), width: 120, dataType: "string" },
                                { key: "base_type", label: t("base-type", "Base Type"), width: 120, dataType: "string" },
                                { key: "is_array", label: t("is-array", "Is Array"), width: 80, dataType: "boolean" },
                                { key: "array_elem_type", label: t("array-elem-type", "Array Elem Type"), width: 120, dataType: "string" },
                                { key: "char_max_length", label: t("char-max-length", "Char Max Length"), width: 120, dataType: "number" },
                                { key: "numeric_precision", label: t("numeric-precision", "Numeric Precision"), width: 120, dataType: "number" },
                                { key: "numeric_scale", label: t("numeric-scale", "Numeric Scale"), width: 120, dataType: "number" },
                                { key: "collation_schema", label: t("collation-schema", "Collation Schema"), width: 120, dataType: "string" },
                                { key: "collation_name", label: t("collation-name", "Collation Name"), width: 120, dataType: "string" },
                                { key: "is_custom_collation", label: t("is-custom-collation", "Is Custom Collation"), width: 120, dataType: "boolean" },
                                ...(major >= 10 ? [
                                    { key: "identity_generation", label: t("identity-generation", "Identity Generation"), width: 120, dataType: "string" },
                                    { key: "identity_start", label: t("identity-start", "Identity Start"), width: 120, dataType: "string" },
                                    { key: "identity_increment", label: t("identity-increment", "Identity Increment"), width: 120, dataType: "string" },
                                    { key: "identity_maximum", label: t("identity-maximum", "Identity Maximum"), width: 120, dataType: "string" },
                                    { key: "identity_minimum", label: t("identity-minimum", "Identity Minimum"), width: 120, dataType: "string" },
                                    { key: "identity_cycle", label: t("identity-cycle", "Identity Cycle"), width: 120, dataType: "boolean" },
                                ] : []),
                                ...(major >= 12 ? [
                                    { key: "generated_expr", label: t("generated-expr", "Generated Expression"), width: 200, dataType: "string" },
                                ] : []),
                                { key: "storage", label: t("storage", "Storage"), width: 100, dataType: "string" },
                                ...(major >= 14 ? [
                                    { key: "compression", label: t("compression", "Compression"), width: 100, dataType: "string" },
                                ] : []),
                                { key: "statistics_target", label: t("statistics-target", "Statistics Target"), width: 120, dataType: "number" },
                                { key: "pk_constraint_name", label: t("pk-constraint-name", "PK Constraint Name"), width: 160, dataType: "string" },
                                { key: "pk_position", label: t("pk-position", "PK Position"), width: 80, dataType: "number" },
                                { key: "is_inherited", label: t("is-inherited", "Is Inherited"), width: 100, dataType: "boolean" },
                                ...(major >= 10 ? [
                                    { key: "is_partition_key", label: t("is-partition-key", "Is Partition Key"), width: 120, dataType: "boolean" },
                                ] : []),
                            ] as ColumnDefinition[],
                            pivotColumns: [
                                { key: "detail", label: t("details", "Details"), width: 200, dataType: "string" },
                                { key: "value", label: t("value", "Value"), width: 400, dataType: "string" },
                            ],
                            autoSaveId: "table-columns-info-panel-grid-" + session.profile.sch_id,
                        }),
                    }),
                    second: () => ({
                        id: cid("table-columns-column-content-editor"),
                        type: "content",
                        title: (refresh) => ({
                            id: cid("table-columns-column-editor-title"),
                            type: "title",
                            toolBar: {
                                id: cid("table-columns-column-editor-toolbar"),
                                type: "toolbar",
                                tools: () => [
                                    {
                                        cmAdd: {
                                            id: cid("table-columns-column-editor-addColumn"),
                                            icon: "Add",
                                            label: t("add-column", "Add Column"),
                                            run: () => {
                                                scriptNegationMode = scriptMode === "add" ? !scriptNegationMode : false;
                                                scriptMode = "add";
                                                refresh(cid("table-columns-column-editor"));
                                                refresh(cid("table-columns-column-editor-toolbar"));
                                            },
                                            selected: () => scriptMode === "add",
                                        },
                                        cmAlter: {
                                            id: cid("table-columns-column-editor-alterColumn"),
                                            icon: "EditableEditor",
                                            label: t("alter-column", "Alter Column"),
                                            run: () => {
                                                scriptNegationMode = scriptMode === "alter" ? !scriptNegationMode : false;
                                                scriptMode = "alter";
                                                refresh(cid("table-columns-column-editor"));
                                                refresh(cid("table-columns-column-editor-toolbar"));
                                            },
                                            selected: () => scriptMode === "alter",
                                        },
                                        cmDrop: {
                                            id: cid("table-columns-column-editor-dropColumn"),
                                            icon: "Delete",
                                            label: t("drop-column", "Drop Column"),
                                            run: () => {
                                                scriptNegationMode = scriptMode === "drop" ? !scriptNegationMode : false;
                                                scriptMode = "drop";
                                                refresh(cid("table-columns-column-editor"));
                                                refresh(cid("table-columns-column-editor-toolbar"));
                                            },
                                            selected: () => scriptMode === "drop",
                                        },
                                        cmComment: {
                                            id: cid("table-columns-column-editor-commentColumn"),
                                            icon: "Comment",
                                            label: t("comment-column", "Comment Column"),
                                            run: () => {
                                                scriptNegationMode = scriptMode === "comment" ? !scriptNegationMode : false;
                                                scriptMode = "comment";
                                                refresh(cid("table-columns-column-editor"));
                                                refresh(cid("table-columns-column-editor-toolbar"));
                                            },
                                            selected: () => scriptMode === "comment",
                                        },
                                    } as Actions<{}>,
                                    ...(scriptMode === "alter" ? [
                                        {
                                            cmDataType: {
                                                id: cid("table-columns-column-editor-alter-data-type"),
                                                icon: "DataType",
                                                label: t("alter-data-type", "Alter Data Type"),
                                                run: () => {
                                                    scriptNegationMode = scriptAlterMode === "data-type" ? !scriptNegationMode : false;
                                                    scriptAlterMode = "data-type";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptAlterMode === "data-type",
                                            },
                                            cmDefault: {
                                                id: cid("table-columns-column-editor-alter-default"),
                                                icon: "DefaultValue",
                                                label: t("alter-default", "Alter Default"),
                                                run: () => {
                                                    scriptNegationMode = scriptAlterMode === "default" ? !scriptNegationMode : false;
                                                    scriptAlterMode = "default";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptAlterMode === "default",
                                            },
                                            cmNotNull: {
                                                id: cid("table-columns-column-editor-alter-not-null"),
                                                icon: "Null",
                                                label: t("alter-not-null", "Alter Not Null"),
                                                run: () => {
                                                    scriptNegationMode = scriptAlterMode === "not-null" ? !scriptNegationMode : false;
                                                    scriptAlterMode = "not-null";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptAlterMode === "not-null",
                                            },
                                            cmRename: {
                                                id: cid("table-columns-column-editor-alter-rename"),
                                                icon: "Rename",
                                                label: t("alter-rename", "Alter Rename"),
                                                run: () => {
                                                    scriptNegationMode = scriptAlterMode === "rename" ? !scriptNegationMode : false;
                                                    scriptAlterMode = "rename";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptAlterMode === "rename",
                                            },
                                            cmCollation: {
                                                id: cid("table-columns-column-editor-alter-collation"),
                                                icon: "Sort",
                                                label: t("alter-collation", "Alter Collation"),
                                                run: () => {
                                                    scriptNegationMode = scriptAlterMode === "collation" ? !scriptNegationMode : false;
                                                    scriptAlterMode = "collation";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptAlterMode === "collation",
                                            },
                                            cmStatistics: {
                                                id: cid("table-columns-column-editor-alter-statistics"),
                                                icon: "Statistics",
                                                label: t("alter-statistics", "Alter Statistics"),
                                                run: () => {
                                                    scriptNegationMode = scriptAlterMode === "statistics" ? !scriptNegationMode : false;
                                                    scriptAlterMode = "statistics";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptAlterMode === "statistics",
                                            },
                                            ...(major >= 10 ? {
                                                cmIdentity: {
                                                    id: cid("table-columns-column-editor-alter-identity"),
                                                    icon: "Sequence",
                                                    label: t("alter-identity", "Alter Identity"),
                                                    run: () => {
                                                        scriptNegationMode = scriptAlterMode === "identity" ? !scriptNegationMode : false;
                                                        scriptAlterMode = "identity";
                                                        refresh(cid("table-columns-column-editor"));
                                                        refresh(cid("table-columns-column-editor-toolbar"));
                                                    },
                                                    selected: () => scriptAlterMode === "identity",
                                                }
                                            } : {}),
                                            ...(major >= 14 ? {
                                                cmCompression: {
                                                    id: cid("table-columns-column-editor-alter-compression"),
                                                    icon: "Compress",
                                                    label: t("alter-compression", "Alter Compression"),
                                                    run: () => {
                                                        scriptNegationMode = scriptAlterMode === "compression" ? !scriptNegationMode : false;
                                                        scriptAlterMode = "compression";
                                                        refresh(cid("table-columns-column-editor"));
                                                        refresh(cid("table-columns-column-editor-toolbar"));
                                                    },
                                                    selected: () => scriptAlterMode === "compression",
                                                }
                                            } : {}),
                                        } as Actions<{}>
                                    ] : []),
                                ],
                            },
                        }),
                        main: () => ({
                            id: cid("table-columns-column-editor"),
                            type: "editor",
                            readOnly: true,
                            wordWrap: true,
                            lineNumbers: false,
                            statusBar: false,
                            miniMap: false,
                            content: async () => {
                                if (!selected) {
                                    return "-- " + t("no-column-selected", "No column selected.");
                                }
                                const version = session.getVersion();
                                if (scriptMode === "add" && columnDetails) {
                                    return columnAddDdl(version, selectedTable()!, selected, columnDetails);
                                } else if (scriptMode === "drop" && columnDetails) {
                                    return columnDropDdl(version, selectedTable()!, selected);
                                } else if (scriptMode === "comment" && columnDetails) {
                                    return columnCommentDdl(version, selectedTable()!, selected, scriptNegationMode);
                                } else if (scriptMode === "alter" && columnDetails) {
                                    return columnAlterDdl(version, selectedTable()!, selected, columnDetails, scriptAlterMode, scriptNegationMode);
                                }

                                return "";
                            },
                        }),
                    }),
                }),
                autoSaveId: "table-columns-split-" + session.profile.sch_id,
            }),
        },
    };
};

const columnAddDdl = (version: string | undefined, table: TableRecord, column: TableColumnRecord, details: ColumnDetailRecord): string => {
    const major = parseInt((version ?? "0").split(".")[0], 10);

    let ddl = `ALTER TABLE ${table.schema_name}.${table.table_name} ADD COLUMN ${column.name} ${column.display_type}`;

    if (column.not_null) {
        ddl += " NOT NULL";
    }
    if (column.default_value) {
        ddl += ` DEFAULT ${column.default_value}`;
    }
    if (major >= 10 && details.identity_generation) {
        ddl += ` GENERATED ${details.identity_generation} AS IDENTITY`;
    }
    if (details.generated_expr) {
        ddl += ` GENERATED ALWAYS AS (${details.generated_expr}) STORED`;
    }
    return ddl + ";";
};

const columnDropDdl = (_version: string | undefined, table: TableRecord, column: TableColumnRecord): string => {
    let ddl = `ALTER TABLE ${table.schema_name}.${table.table_name} DROP COLUMN ${column.name}`;
    return ddl + ";";
};

const columnCommentDdl = (_version: string | undefined, table: TableRecord, column: TableColumnRecord, negation: boolean): string => {
    let ddl = `COMMENT ON COLUMN ${table.schema_name}.${table.table_name}.${column.name} IS `;
    ddl += negation ? "NULL" : `'${column.description?.replace(/'/g, "''") ?? ''}'`;
    return ddl + ";";
};

const columnAlterDdl = (
    version: string | undefined,
    table: TableRecord,
    column: TableColumnRecord,
    details: ColumnDetailRecord,
    mode: ScriptAlterMode,
    negation: boolean
): string => {
    const major = parseInt((version ?? "0").split(".")[0], 10);
    const qname = `${table.schema_name}.${table.table_name}`;
    const col = column.name;
    const base = `ALTER TABLE ${qname} ALTER COLUMN ${col} `;

    switch (mode) {
        case "data-type": {
            // Uwaga: w praktyce zmiana typu może wymagać USING ...
            return `${base}TYPE ${column.display_type};`;
        }

        case "default": {
            // Przy negacji ustaw domyślną wartość zależnie od typu, jeśli default_value nie jest określone
            if (negation) {
                let defVal = column.default_value;
                if (!defVal) {
                    // Proste mapowanie typów na domyślne wartości
                    switch (details.type_name) {
                        case "integer":
                        case "int":
                        case "int4":
                        case "smallint":
                        case "int2":
                        case "bigint":
                        case "int8":
                        case "real":
                        case "float4":
                        case "double precision":
                        case "float8":
                        case "numeric":
                        case "decimal":
                            defVal = "0";
                            break;
                        case "boolean":
                        case "bool":
                            defVal = "false";
                            break;
                        case "text":
                        case "varchar":
                        case "char":
                        case "bpchar":
                            defVal = "''";
                            break;
                        case "date":
                            defVal = "CURRENT_DATE";
                            break;
                        case "timestamp":
                        case "timestamp without time zone":
                        case "timestamp with time zone":
                            defVal = "CURRENT_TIMESTAMP";
                            break;
                        default:
                            defVal = "NULL";
                    }
                    return `${base}SET DEFAULT ${defVal};`;
                }
            }
            // Standardowo: jeśli default_value jest, ustaw, w przeciwnym razie usuń
            if (column.default_value && !negation) {
                return `${base}SET DEFAULT ${column.default_value};`;
            }
            return `${base}DROP DEFAULT;`;
        }

        case "not-null": {
            if (negation ? !column.not_null : column.not_null) {
                return `${base}SET NOT NULL;`;
            }
            return `${base}DROP NOT NULL;`;
        }

        case "rename": {
            // Wymaga docelowej nazwy z UI – placeholder:
            return `ALTER TABLE ${qname} RENAME COLUMN ${col} TO ${col}; -- TODO: set new column name`;
        }

        case "collation": {
            // Najbezpieczniej przez TYPE ... COLLATE ...
            // Użyj bieżącego wyświetlanego typu i kolacji z details.*
            if (!negation && details.collation_name) {
                const coll =
                    details.collation_schema
                        ? `${details.collation_schema}.${details.collation_name}`
                        : details.collation_name;
                return `ALTER TABLE ${qname} ALTER COLUMN ${col} TYPE ${column.display_type} COLLATE ${coll};`;
            }
            // Usunięcie jawnej kolacji: ustawiamy TYPE bez COLLATE (wróci do domyślnej)
            return `ALTER TABLE ${qname} ALTER COLUMN ${col} TYPE ${column.display_type}; -- drops explicit collation`;
        }

        case "identity": {
            if (major < 10) return `-- Identity columns are not supported before PostgreSQL 10`;
            // Jeśli negacja → usuń tożsamość, inaczej ustaw/utwórz zgodnie z details.identity_generation
            if (negation) {
                return `${base}DROP IDENTITY;`;
            }
            if (details.identity_generation) {
                // Kolumna już jest identity – zmieniamy tryb
                return `${base}SET GENERATED ${details.identity_generation};`;
            }
            // Brak identity – dodajemy (domyślnie BY DEFAULT)
            return `${base}ADD GENERATED BY DEFAULT AS IDENTITY;`;
        }

        case "compression": {
            if (major < 14) return `-- Column compression is not supported before PostgreSQL 14`;
            // Mapowanie wartości z details.compression (PG zwraca zwykle 'p' lub 'l')
            const current =
                details.compression === 'l' || details.compression?.toLowerCase() === 'lz4'
                    ? 'lz4'
                    : 'pglz';
            if (negation) {
                // "Wyłączenie" → wróć do pglz (bezpieczny default)
                return `${base}SET COMPRESSION pglz;`;
            }
            return `${base}SET COMPRESSION ${current};`;
        }

        case "statistics": {
            // -1 oznacza domyślne; użyj istniejącej wartości lub domyślnej 100
            if (negation) return `${base}SET STATISTICS -1;`;
            const target = details.statistics_target ?? 100;
            return `${base}SET STATISTICS ${target};`;
        }
    }
};

const columnDetailQuery = (version: string | undefined) => {
    const major = parseInt((version ?? "0").split(".")[0], 10);

    // PG 10+: att.attidentity, pg_sequence
    const hasIdentity = major >= 10;
    // PG 12+: att.attgenerated
    const hasGenerated = major >= 12;
    // PG 14+: att.attcompression
    const hasCompression = major >= 14;

    const identitySelect = hasIdentity
        ? `att.attidentity,`
        : `''::char as attidentity,`;

    const generatedSelect = hasGenerated
        ? `att.attgenerated,`
        : `''::char as attgenerated,`;

    const compressionSelect = hasCompression
        ? `att.attcompression,`
        : `null::text as attcompression,`;

    const identityJoin = hasIdentity
        ? `left join pg_depend d on d.refobjid = ci.attrelid and d.refobjsubid = ci.attnum and d.deptype = 'i'
  left join pg_class seqcl on seqcl.oid = d.objid and seqcl.relkind = 'S'
  left join pg_sequence seq on seq.seqrelid = seqcl.oid`
        : ``;

    const identityFields = hasIdentity
        ? `seq.seqstart::text as identity_start,
    seq.seqincrement::text as identity_increment,
    seq.seqmax::text as identity_maximum,
    seq.seqmin::text as identity_minimum,
    seq.seqcycle as identity_cycle`
        : `null::text as identity_start,
    null::text as identity_increment,
    null::text as identity_maximum,
    null::text as identity_minimum,
    null::boolean as identity_cycle`;

    const partitionInfoSelect = major >= 10
        ? `exists(select 1 from pg_partitioned_table pt where pt.partrelid = pk.attrelid and pk.attnum = any(pt.partattrs)) as is_partition_key`
        : `false as is_partition_key`;

    const partitionInfo = `
partition_info as (
  select
    pk.*,
    ${partitionInfoSelect}
  from pk_info pk
)
`;

    return `
with col as (
  select 
    att.attrelid, att.attnum, att.attname, att.atttypid, att.atttypmod,
    ${identitySelect}
    ${generatedSelect}
    att.attstorage, ${compressionSelect} att.attstattarget,
    att.attcollation, att.attinhcount > 0 as is_inherited
  from pg_attribute att
  join pg_class cl on cl.oid = att.attrelid
  join pg_namespace na on na.oid = cl.relnamespace
  where na.nspname = $1 and cl.relname = $2 and att.attname = $3
    and att.attnum > 0 and not att.attisdropped
),
type_info as (
  select
    col.*,
    tn.nspname as type_schema, typ.typname as type_name,
    typ.typbasetype, typ.typcategory, typ.typcollation as type_default_collation,
    case when typ.typbasetype <> 0 then bt.typname else null end as base_type_name,
    case when typ.typcategory = 'A' then et.typname else null end as array_elem_type
  from col
  join pg_type typ on typ.oid = col.atttypid
  join pg_namespace tn on tn.oid = typ.typnamespace
  left join pg_type bt on bt.oid = typ.typbasetype
  left join pg_type et on et.oid = typ.typelem
),
collation_info as (
  select
    ti.*,
    case when ti.attcollation <> 0 and ti.attcollation <> ti.type_default_collation 
         then cn.nspname else null end as collation_schema,
    case when ti.attcollation <> 0 and ti.attcollation <> ti.type_default_collation
         then coll.collname else null end as collation_name
  from type_info ti
  left join pg_collation coll on coll.oid = ti.attcollation
  left join pg_namespace cn on cn.oid = coll.collnamespace
),
identity_info as (
  select
    ci.*,
    case ci.attidentity when 'a' then 'ALWAYS' when 'd' then 'BY DEFAULT' else null end as identity_generation,
    ${identityFields}
  from collation_info ci
  ${identityJoin}
),
default_gen as (
  select
    ii.*,
    case when ii.attgenerated = 's' then pg_get_expr(ad.adbin, ad.adrelid) else null end as generated_expr
  from identity_info ii
  left join pg_attrdef ad on ad.adrelid = ii.attrelid and ad.adnum = ii.attnum
),
pk_info as (
  select
    dg.*,
    pkc.conname as pk_constraint_name,
    array_position(pkc.conkey, dg.attnum) as pk_position
  from default_gen dg
  left join pg_constraint pkc on pkc.conrelid = dg.attrelid and pkc.contype = 'p' 
    and dg.attnum = any(pkc.conkey)
),
partition_info as (
  select
    pk.*,
    ${partitionInfoSelect}
  from pk_info pk
)
select
  type_schema,
  type_name,
  base_type_name as base_type,
  (typcategory = 'A') as is_array,
  array_elem_type,
  case when atttypmod > 0 and type_name in ('varchar','bpchar','char') then atttypmod - 4 else null end as char_max_length,
  case when type_name in ('numeric','decimal') then ((atttypmod - 4) >> 16) & 65535 else null end as numeric_precision,
  case when type_name in ('numeric','decimal') then (atttypmod - 4) & 65535 else null end as numeric_scale,
  
  collation_schema,
  collation_name,
  (collation_name is not null) as is_custom_collation,
  
  identity_generation,
  identity_start,
  identity_increment,
  identity_maximum,
  identity_minimum,
  identity_cycle,
  generated_expr,
  
  case attstorage when 'p' then 'PLAIN' when 'e' then 'EXTERNAL' when 'x' then 'EXTENDED' when 'm' then 'MAIN' end as storage,
  attcompression as compression,
  attstattarget as statistics_target,
  
  pk_constraint_name,
  pk_position,
  
  is_inherited,
  is_partition_key
from partition_info;
`;
};

export default columnsTab;