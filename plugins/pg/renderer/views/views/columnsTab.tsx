import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

interface ViewColumnRecord {
    no: number;
    name: string;
    data_type: string;
    display_type: string;
    not_null: boolean;
    description: string | null;
    [key: string]: any;
}

interface ColumnDetailRecord {
    // Relation kind
    relkind: "v" | "m";
    relation_kind: string; // "view" | "materialized view"
    is_view: boolean;

    // Type details
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

    [key: string]: any;
}

const columnsTab = (
    session: IDatabaseSession,
    selectedView: () => ViewRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    let selected: ViewColumnRecord | null = null;

    return {
        id: cid("view-columns-tab"),
        type: "tab",
        label: {
            id: cid("view-columns-tab-label"),
            type: "tablabel",
            label: t("columns", "Columns"),
        },
        content: {
            id: cid("view-columns-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-columns-split"),
                type: "split",
                direction: "horizontal",
                first: () => ({
                    id: cid("view-columns-grid"),
                    type: "grid",
                    onRowSelect(row: ViewColumnRecord, slotContext) {
                        selected = row;
                        slotContext.refresh(cid("view-columns-info-panel-title"));
                        slotContext.refresh(cid("view-columns-info-panel-grid"));
                    },
                    rows: async () => {
                        selected = null;
                        const view = selectedView();
                        if (!view) return [];
                        const { rows } = await session.query<ViewColumnRecord>(
                            `
        select 
          att.attnum as no, 
          att.attname as name, 
          att.atttypid::regtype::text as data_type,
          pg_catalog.format_type(att.atttypid, att.atttypmod) as display_type,
          att.attnotnull as not_null, 
          des.description as description
        from pg_catalog.pg_attribute att
          join pg_catalog.pg_class cl on cl.oid = att.attrelid
          join pg_catalog.pg_namespace na on na.oid = cl.relnamespace
          -- removed: left join pg_attrdef (views don't have column defaults)
          left outer join pg_catalog.pg_description des 
            on des.classoid = 'pg_class'::regclass and des.objoid = att.attrelid and des.objsubid = att.attnum
        where att.attnum > 0
          and cl.relkind in ('v', 'm') -- view or materialized view
          and na.nspname not ilike 'pg_toast%' and na.nspname not ilike 'pg_temp%'
          and na.nspname = $1
          and cl.relname = $2
          and att.atttypid != 0
        order by no
        `,
                            [view.schema_name, view.view_name]
                        );
                        return rows;
                    },
                    columns: [
                        { key: "no", label: t("ordinal-number-short", "No"), width: 50, dataType: "number" },
                        { key: "name", label: t("name", "Name"), width: 160, dataType: "string" },
                        { key: "display_type", label: t("data-type", "Data Type"), width: 180, dataType: "string" },
                        { key: "not_null", label: t("not-null", "Not Null"), width: 90, dataType: "boolean" },
                        { key: "description", label: t("comment", "Comment"), width: 300, dataType: "string" },
                    ] as ColumnDefinition[],
                    autoSaveId: "view-columns-grid-" + session.profile.sch_id,
                } as IGridSlot),
                second: () => ({
                    id: cid("view-columns-info-panel"),
                    type: "content",
                    title: () => ({
                        id: cid("view-columns-info-panel-title"),
                        type: "title",
                        title: () => (selected ? selected.name : t("column-details", "Column Details")),
                    }),
                    main: () => ({
                        id: cid("view-columns-info-panel-grid"),
                        type: "grid",
                        pivot: true,
                        rows: async () => {
                            const view = selectedView();
                            if (!view || !selected) return [];
                            const { rows } = await session.query<ColumnDetailRecord>(columnDetailQuery(), [
                                view.schema_name,
                                view.view_name,
                                selected.name,
                            ]);
                            return rows;
                        },
                        columns: [
                            // Relation kind info (to show it's a view)
                            { key: "relation_kind", label: t("relation-kind", "Relation Kind"), width: 160, dataType: "string" },
                            { key: "is_view", label: t("is-view", "Is View"), width: 80, dataType: "boolean" },
                            { key: "type_schema", label: t("type-schema", "Type Schema"), width: 120, dataType: "string" },
                            { key: "type_name", label: t("type-name", "Type Name"), width: 120, dataType: "string" },
                            { key: "base_type", label: t("base-type", "Base Type"), width: 120, dataType: "string" },
                            { key: "is_array", label: t("is-array", "Is Array"), width: 80, dataType: "boolean" },
                            { key: "array_elem_type", label: t("array-elem-type", "Array Elem Type"), width: 140, dataType: "string" },
                            { key: "char_max_length", label: t("char-max-length", "Char Max Length"), width: 120, dataType: "number" },
                            { key: "numeric_precision", label: t("numeric-precision", "Numeric Precision"), width: 120, dataType: "number" },
                            { key: "numeric_scale", label: t("numeric-scale", "Numeric Scale"), width: 120, dataType: "number" },
                            { key: "collation_schema", label: t("collation-schema", "Collation Schema"), width: 140, dataType: "string" },
                            { key: "collation_name", label: t("collation-name", "Collation Name"), width: 140, dataType: "string" },
                            { key: "is_custom_collation", label: t("is-custom-collation", "Is Custom Collation"), width: 160, dataType: "boolean" },
                            { key: "ref_table_schemas", label: t("ref-table-schemas", "Ref Table Schemas"), width: 200, dataType: "string" },
                            { key: "ref_table_names", label: t("ref-table-names", "Ref Table Names"), width: 200, dataType: "string" },
                            { key: "ref_column_names", label: t("ref-column-names", "Ref Column Names"), width: 220, dataType: "string" },
                        ] as ColumnDefinition[],
                        pivotColumns: [
                            { key: "detail", label: t("details", "Details"), width: 220, dataType: "string" },
                            { key: "value", label: t("value", "Value"), width: 420, dataType: "string" },
                        ],
                        autoSaveId: "view-columns-info-panel-grid-" + session.profile.sch_id,
                    }),
                }),
                autoSaveId: "view-columns-split-" + session.profile.sch_id,
            }),
        },
    };
};

const columnDetailQuery = () => {
    return `
with col as (
  select 
    att.attrelid, att.attnum, att.attname, att.atttypid, att.atttypmod,
    att.attcollation,            
    cl.relkind
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
)
select
  ci.relkind,
  case ci.relkind when 'v' then 'view' when 'm' then 'materialized view' else ci.relkind::text end as relation_kind,
  (ci.relkind in ('v','m')) as is_view,

  ci.type_schema,
  ci.type_name,
  ci.base_type_name as base_type,
  (ci.typcategory = 'A') as is_array,
  ci.array_elem_type,
  case when ci.atttypmod > 0 and ci.type_name in ('varchar','bpchar','char') then ci.atttypmod - 4 else null end as char_max_length,
  case when ci.type_name in ('numeric','decimal') then ((ci.atttypmod - 4) >> 16) & 65535 else null end as numeric_precision,
  case when ci.type_name in ('numeric','decimal') then (ci.atttypmod - 4) & 65535 else null end as numeric_scale,
  
  ci.collation_schema,
  ci.collation_name,
  (ci.collation_name is not null) as is_custom_collation,

  r.ref_table_schema  as ref_table_schemas,
  r.ref_table_name    as ref_table_names,
  r.ref_column_name   as ref_column_names
from collation_info ci
left join lateral (
  select 
    vcu.table_schema as ref_table_schema,
    vcu.table_name   as ref_table_name,
    vcu.column_name  as ref_column_name
  from information_schema.view_column_usage vcu
  where vcu.view_schema = $1 and vcu.view_name = $2 and vcu.column_name = $3
  limit 1
) r on true;
`;
};

export default columnsTab;