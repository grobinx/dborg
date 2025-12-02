import { Typography } from "@mui/material";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";
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
    base_type: string | null; // dla domen
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
    identity_generation: string | null; // 'ALWAYS' | 'BY DEFAULT' | null
    identity_start: string | null;
    identity_increment: string | null;
    identity_maximum: string | null;
    identity_minimum: string | null;
    identity_cycle: boolean | null;
    generated_expr: string | null; // dla generated stored

    // Storage
    storage: string; // PLAIN/EXTENDED/MAIN/EXTERNAL
    compression: string | null; // pglz/lz4 (PG14+)
    statistics_target: number | null;

    // Klucze i ograniczenia (szczegóły)
    pk_constraint_name: string | null;
    pk_position: number | null;
    unique_constraints: string | null; // JSON array nazw
    check_constraints: string | null; // JSON array {name, definition}
    fk_constraints: string | null; // JSON array {name, ref_schema, ref_table, ref_columns, on_update, on_delete}

    // Indeksy (szczegóły)
    indexes: string | null; // JSON array {name, method, is_unique, is_primary, keys_position, definition}

    // Dziedziczenie / partycje
    is_inherited: boolean;
    is_partition_key: boolean;

    [key: string]: any;
}

const columnsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const major = parseInt((session.getVersion() ?? "0").split(".")[0], 10);

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    let selected: TableColumnRecord | null = null;
    let columnDetails: ColumnDetailRecord | null = null;
    let scriptMode: "add" | "alter" | "drop" | "comment" = "add";
    let scriptCommentMode: "set" | "remove" = "set";

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
                    onRowClick(row: TableColumnRecord, refresh) {
                        selected = row;
                        if (selected) {
                            refresh(cid("table-columns-info-panel-title"));
                            refresh(cid("table-columns-info-panel-grid"));
                        }
                    },
                    rows: async () => {
                        if (!selectedRow()) return [];
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
                            [selectedRow()!.schema_name, selectedRow()!.table_name]
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
                                if (!selected) return [];

                                const { rows } = await session.query<ColumnDetailRecord>(columnDetailQuery(session.getVersion()), [
                                    selectedRow()!.schema_name,
                                    selectedRow()!.table_name,
                                    selected!.name,
                                ]);

                                columnDetails = rows.length > 0 ? rows[0] : null;
                                if (columnDetails) {
                                    refresh(cid("table-columns-column-editor"));
                                }

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
                                { key: "unique_constraints", label: t("unique-constraints", "Unique Constraints"), width: 200, dataType: "string" },
                                { key: "check_constraints", label: t("check-constraints", "Check Constraints"), width: 200, dataType: "string" },
                                { key: "fk_constraints", label: t("fk-constraints", "FK Constraints"), width: 200, dataType: "string" },
                                { key: "indexes", label: t("indexes", "Indexes"), width: 200, dataType: "string" },
                                { key: "is_inherited", label: t("is-inherited", "Is Inherited"), width: 100, dataType: "boolean" },
                                { key: "is_partition_key", label: t("is-partition-key", "Is Partition Key"), width: 120, dataType: "boolean" },
                            ] as ColumnDefinition[],
                            pivotColumns: [
                                { key: "detail", label: t("details", "Details"), width: 200, dataType: "string" },
                                { key: "value", label: t("value", "Value"), width: 400, dataType: "string" },
                            ]
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
                                                scriptMode = "comment";
                                                refresh(cid("table-columns-column-editor"));
                                                refresh(cid("table-columns-column-editor-toolbar"));
                                            },
                                            selected: () => scriptMode === "comment",
                                        }
                                    } as Actions<{}>,
                                    ...(scriptMode === "comment" ? [
                                        {
                                            cmNullComment: {
                                                id: cid("table-columns-column-editor-nullComment"),
                                                icon: "CommentRemove",
                                                label: t("remove-comment", "Remove Comment"),
                                                run: () => {
                                                    scriptCommentMode = scriptCommentMode === "set" ? "remove" : "set";
                                                    refresh(cid("table-columns-column-editor"));
                                                    refresh(cid("table-columns-column-editor-toolbar"));
                                                },
                                                selected: () => scriptCommentMode === "remove",
                                            }
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
                            content: async () => {
                                if (!selected) {
                                    return "-- " + t("no-column-selected", "No column selected.");
                                }
                                const version = session.getVersion();
                                if (scriptMode === "add" && columnDetails) {
                                    return columnAddDdl(version, selectedRow()!, selected, columnDetails);
                                } else if (scriptMode === "drop" && columnDetails) {
                                    return columnDropDdl(version, selectedRow()!, selected);
                                } else if (scriptMode === "comment" && columnDetails) {
                                    const comment = selected.description;
                                    return columnCommentDdl(version, selectedRow()!, selected, comment, scriptCommentMode === "remove");
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

const columnCommentDdl = (_version: string | undefined, table: TableRecord, column: TableColumnRecord, comment: string | null, remove: boolean): string => {
    let ddl = `COMMENT ON COLUMN ${table.schema_name}.${table.table_name}.${column.name} IS `;
    ddl += remove ? "NULL" : `'${comment?.replace(/'/g, "''") ?? ''}'`;
    return ddl + ";";
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
uniq_info as (
  select
    pk.*,
    (select json_agg(conname) from pg_constraint uc 
     where uc.conrelid = pk.attrelid and uc.contype = 'u' and pk.attnum = any(uc.conkey)) as unique_constraints
  from pk_info pk
),
check_info as (
  select
    ui.*,
    (select json_agg(json_build_object('name', cc.conname, 'definition', pg_get_constraintdef(cc.oid)))
     from pg_constraint cc
     where cc.conrelid = ui.attrelid and cc.contype = 'c'
       and pg_get_constraintdef(cc.oid) like '%' || ui.attname || '%') as check_constraints
  from uniq_info ui
),
fk_info as (
  select
    chi.*,
    (select json_agg(json_build_object(
       'name', fk.conname,
       'ref_schema', rn.nspname,
       'ref_table', rc.relname,
       'ref_columns', (select array_agg(ratt.attname) from unnest(fk.confkey) with ordinality as fk_col(num, ord)
                       join pg_attribute ratt on ratt.attrelid = fk.confrelid and ratt.attnum = fk_col.num),
       'on_update', fk.confupdtype,
       'on_delete', fk.confdeltype
     ))
     from pg_constraint fk
     join pg_class rc on rc.oid = fk.confrelid
     join pg_namespace rn on rn.oid = rc.relnamespace
     where fk.conrelid = chi.attrelid and fk.contype = 'f' and chi.attnum = any(fk.conkey)) as fk_constraints
  from check_info chi
),
index_info as (
  select
    fki.*,
    (select json_agg(json_build_object(
       'name', ic.relname,
       'method', am.amname,
       'is_unique', idx.indisunique,
       'is_primary', idx.indisprimary,
       'keys_position', array_position(idx.indkey, fki.attnum),
       'definition', pg_get_indexdef(idx.indexrelid)
     ))
     from pg_index idx
     join pg_class ic on ic.oid = idx.indexrelid
     join pg_am am on am.oid = ic.relam
     where idx.indrelid = fki.attrelid and fki.attnum = any(idx.indkey)) as indexes
  from fk_info fki
),
partition_info as (
  select
    ii.*,
    exists(select 1 from pg_partitioned_table pt where pt.partrelid = ii.attrelid and ii.attnum = any(pt.partattrs)) as is_partition_key
  from index_info ii
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
  unique_constraints::text,
  check_constraints::text,
  fk_constraints::text,
  
  indexes::text,
  
  is_inherited,
  is_partition_key
from partition_info;
`;
};

export default columnsTab;